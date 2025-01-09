/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
require('dotenv').config();
// To check Razorpay script is loaded before using it
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
 
    await loadRazorpayScript();

    const response = await axios.get(`/api/v1/bookings/checkout-session/${tourId}`);
  

    if (response && response.status === 200) {
      const order = response.data.order;


      const options = {
        key: process.env.RAZORPAY_ID_KEY,
        amount: order.amount,
        currency: order.currency,
        name: order.notes.product_name,
        description: order.notes.product_description,
        image: order.notes.image_url,
        order_id: order.id,
        // callbackUrl : `${req.protocol}://${req.get('host')}/tour?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        handler: function (paymentResponse) {
   
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

   
      const rzp = new Razorpay(options); 

      rzp.on('payment.failed', function (response) {
    
        alert(`Payment Failed: ${response.error.description}`);
      });

      rzp.open();
    }
  } catch (err) {
    console.error('Error in booking:', err.message || err);
    showAlert('error', 'Failed to book the tour. Please try again.');
  }
};
