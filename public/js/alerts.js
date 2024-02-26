// The hideAlert function selects the element with the class "alert" and removes it from its parent.
// Function to hide an existing alert
export const hideAlert = () => {
  // Select the element with class 'alert'
  const el = document.querySelector('.alert');

  // Check if the element exists before attempting to remove it
  if (el) el.parentElement.removeChild(el);
};

// The showAlert function inserts the created HTML at the beginning of the body element.
// Function to display an alert
// Type can be 'success' or 'error', msg is the message to be displayed
export const showAlert = (type, msg) => {
  // Hide any existing alert before displaying a new one
  hideAlert();

  // Create HTML markup for the alert with appropriate type and message
  const markup = `<div class="alert alert--${type}">${msg}</div>`;

  // Insert the HTML at the beginning of the 'body' element
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  // Set a timeout to hide the alert after 5000 milliseconds (5 seconds)
  window.setTimeout(hideAlert, 5000);
};
