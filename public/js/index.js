/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import {signup} from "./signup"
import { updateSettings } from './updateSettings';
import { bookTour } from './razor';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm =document.querySelector(".signup-form")
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav__menu');
const bookBtn = document.getElementById('book-tour');
// DELEGATION



if (mapBox) {
  const locations = JSON.parse(mapBox.getAttribute('data-locations'));
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit',  async e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
     await login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  document.querySelector('.form-user-data').addEventListener('submit', async e => {
    e.preventDefault();
    const form = new FormData();
    const name = document.getElementById('name').value;
    const email = document.getElementById('emaill').value;
    let photo = document.getElementById('photo').files[0].name
    await updateSettings({name,email,photo}, 'data');
    
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    
  });

  if(signupForm)
   {

    signupForm.addEventListener('submit',  async e => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('emailll').value;
      const password = document.getElementById('passwordd').value;
      const passwordConfirm = document.getElementById('Confirmpasswordd').value;
      const role = document.getElementById('role').value;
      await signup(name,email, password,passwordConfirm,role)
    })
  }

 // Get the elements

// Toggle open/close class on hamburger and nav menu when clicked
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open'); // Add/remove the "open" class for the hamburger to transform to a cross
  navMenu.classList.toggle('open');   // Add/remove the "open" class to show/hide the menu
});

if (bookBtn)
  
  bookBtn.addEventListener('click',  async e => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
     await bookTour(tourId);
    e.target.textContent = 'BOOK TOUR NOW!';
  });
