/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

 export const login = async (email, password) => {
  
  const url = 'http://127.0.0.1:3000/api/v1/users/login'
  try{
    const res = await axios.post(url, { email, password });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);

     
    }

  }catch(error)
  {
    showAlert('error', error.response.data.message);
  }

};



export const logout = async () => {
   const url = '/api/v1/users//logout'
  try {
    const res = await axios.get(url);
    if (res.data.status === 'success'){ 
      showAlert('success', 'Logged out successfully!');
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
    
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
