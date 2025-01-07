import axios from 'axios';
import { showAlert } from './alerts';

 export const signup = async (name, email, password,passwordConfirm,role) => {
    console.log("Davidd",email, password,passwordConfirm,role)
  const url = 'http://127.0.0.1:3000/api/v1/users/signup'
  try{
    const res = await axios.post(url, { name, email, password, passwordConfirm, role });
    if (res?.data?.status === 'success') {
        
      showAlert('success', 'Registered successfully!')
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }

  }catch(error)
  {
    showAlert('error', error.response.data.message);
  }

};
