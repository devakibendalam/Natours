import axios from 'axios';
import Stripe from 'stripe';
import { showAlert } from './alerts';
// const stripe = Stripe(
//   'pk_test_51OnJM4SCDytwysyFlDu17BFbFvzCMtOMsy9ehFknpHNqOI5mDfI615nhC6Te9gB2lsLxmmwXw7rYRB0F7CH4hoRw00mGVJKZfI',
// );

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51OnJM4SCDytwysyFlDu17BFbFvzCMtOMsy9ehFknpHNqOI5mDfI615nhC6Te9gB2lsLxmmwXw7rYRB0F7CH4hoRw00mGVJKZfI',
    ); // This statement creates a Stripe instance using the provided public key. The public key is used on the client-side (frontend) to collect payment information securely. The secret key (not shown here) is used on the server-side (backend) to process payments and manage sensitive data.

    // 1) Get checkout session from API
    // console.log(tourId);
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // console.log(session); // this is result of this axios call. Axios always creates an object like this, where in there is an object called data, which is the actual response.

    // 2) Create checkout form + charge credit card
    // Here we are using our stripe object to automatically create the checkout form
    // await stripe.redirectToCheckout({
    //     sessionId: session.data.session.id
    // });
    // window.location.assign(session.data.session.url);
    window.location.replace(session.data.session.url); // more secure
  } catch (err) {
    // console.log(err);
    showAlert('error', err);
  }
};
