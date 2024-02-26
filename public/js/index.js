// JavaScript integration for the client-side.
import { login, logout } from './login'; // Here we used these curly braces because we are doing the export in this way, but there is also something similar to module.export which is kind of the default export, and so in ES6 modules it is actually called a default export, so in that case we then would not need these curly braces.
// npm i @babel/polyfill  // We should actually also install a polyfill which will make some of the newer JavaScript features work in older browsers as well.
import '@babel/polyfill'; // We import @babel/polyfill without assigning it to a variable because it's automatically included in the bundle. This polyfills some modern JavaScript features.
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}
// retrieve location data from the HTML using dataset. BCZ whatever the data put in data attributes are stored into the dataset property.
// console.log(locations);

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value); // Append the 'name' field to the form, using the value retrieved from the element with the id 'name'.
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]); // These files are actually an array, and so since there is only one, we need to select that first element in the array.

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // updateSettings({ name, email }, 'data');
    updateSettings(form, 'data'); // sending form object to update
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    // After update completion clear the fields.
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset; // const tourId = e.target.dataset.tourId; // event.target is the element which was clicked, so the one that triggered this event listener here to be fired.
    bookTour(tourId);
  });
}
