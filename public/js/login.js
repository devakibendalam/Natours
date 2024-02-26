import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from './alerts';

// Define an asynchronous function 'login' that takes 'email' and 'password' as parameters
export const login = async (email, password) => {
  console.log(email, password);
  try {
    // Axios is a popular JavaScript library used for making HTTP requests from browsers and Node.js environments.
    // The axios function is asynchronous and Accepts a configuration object as an argument with various properties such as method, url, data, params, headers, etc and Returns a promise that resolves to a response object.

    // To make a POST request using Axios to a local API endpoint for user login
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    console.log(res);

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        //After login success render home page after 1.5 sec
        location.assign('/'); //In order to load another page use location.assign and then pass the url of that page
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
    });

    // If successful, the page is reloaded to reflect the logout.
    if ((res.data.status = 'success')) location.reload(true);
    // Manual page reload upon logout is necessary since AJAX requests don't clear cookies on the backend.
    // Reloading the page triggers the server to recognize the new cookie without a token, effectively logging the user out.
    // This code forces a reload of the current page from the server, ignoring any cached data. This ensures the user menu is updated with the latest information, even if it was previously cached.
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
