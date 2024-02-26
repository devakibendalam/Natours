import axios from 'axios';
import { showAlert } from './alerts';

// Type is either 'password' or 'data'.
export const updateSettings = async (data, type) => {
  // Here we pass in an object containing all the data that we want to update.
  try {
    const url =
      type === 'password'
        ? 'http://localhost:3000/api/v1/users/updateMyPassword'
        : 'http://localhost:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

// export const updateData = async (name, email) => {
//   try {
//     const res = await axios({
//       method: 'PATCH', // We could also write this in lowercase.
//       url: 'http://localhost:3000/api/v1/users/updateMe',
//       data: {
//         name,
//         email,
//       },
//     });

//     if (res.data.status === 'success') {
//       showAlert('success', 'Data updated successfully');
//     }
//   } catch (err) {
//     showAlert('error', err.response.data.message);
//   }
// };
