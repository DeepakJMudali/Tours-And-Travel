/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// To check if Razorpay script is loaded before using it
const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof Razorpay !== 'undefined') {
      return resolve();
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = (error) => reject('Failed to load Razorpay script');

    document.head.appendChild(script);
  });
};

export const bookTour = async (tourId) => {
  try {
    // Ensure Razorpay script is loaded
    await loadRazorpayScript();

    const response = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log("API response:", response.data);  // Log response for debugging

    if (response && response.status === 200) {
      const order = response.data.order;
      console.log("Order details:", order);  // Log order details for debugging

      // Razorpay options
      const options = {
        key: process.env.RAZORPAY_ID_KEY, // Ensure this is correct
        amount: order.amount,
        currency: order.currency,
        name: order.notes.product_name,
        description: order.notes.product_description,
        image: order.notes.image_url,
        order_id: order.id,
        handler: function (paymentResponse) {
          console.log('Payment successful', paymentResponse);  // Log payment response
          showAlert('success', 'Payment successful!');
        },
        prefill: {
          name: 'Deepak Mudali',
          email: 'deepak@gmail.com',
          contact: '9827942691',
        },
        notes: {
          address: "Razorpay Corporate Office"
        },
        theme: {
          "color": "#3399cc",
        },
      };

      // Create Razorpay instance
      const rzp = new Razorpay(options); 

      // Add event listener for payment failure
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed', response);  // Log payment failure
        alert(`Payment Failed: ${response.error.description}`);
      });

      // Open the Razorpay payment window
      rzp.open();
    }
  } catch (err) {
    console.error('Error in booking:', err.message || err);
    showAlert('error', 'Failed to book the tour. Please try again.');
  }
};
