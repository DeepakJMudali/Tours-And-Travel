/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url = type === "data" ? '/api/v1/users/updateMe' :  '/api/v1/users/updateMyPassword' ;

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    if (err.response) {
      showAlert('error', err.response.data.message); // Backend error message
    } else {
      // In case there is no response from the server
      showAlert('error', 'Something went wrong! Please try again.');
    }
  }
};
