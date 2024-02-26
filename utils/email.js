const nodemailer = require('nodemailer');
const pug = require('pug');
// const htmlToText = require('html-to-text'); // not working
const { htmlToText } = require('html-to-text');

// new Email(User, url).sendWelcome();
module.exports = class Email {
  constructor(user, url) {
    // As always a class needs a constructor function that is gonna be running when a new object is created through this class.
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Devaki <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    // When we are in production we actually want to send real emails using SendGrid, but if we are not in production then we want to use Mailtrap application.
    if (process.env.NODE_ENV === 'production') {
      // https://mailsac.com/
      // https://www.brevo.com/
      // In the video tutorial, Jonas used SendGrid for email delivery. However, it's currently not functioning, so we've opted to use Brevo in this context.
      return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com', // Brevo SMTP server
        port: 587, // Secure port (587 for non-encrypted connections)
        // secure: false, // Use secure connection (SSL/TLS)
        auth: {
          user: process.env.BREVO_USERNAME,
          pass: process.env.BREVO_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual mail -  handles email sending
  async send(template, subject) {
    // Up to this point, we've solely used Pug to generate templates. We pass the template's name to the render function in the response. For instance: res.render('template name'). The render function internally translates the Pug template into HTML and sends it to the client. However, in this scenario, our objective is to create HTML content from the template without rendering it for the client. Thus, we'll define it here as an HTML option within the mail options. Our primary goal here is to send an HTML email. Hence, we'll utilize a Pug template to generate this HTML.

    // 1) Render HTML for the email based on a pug template
    const html = pug.renderFile(
      // Unlike `res.render()`, which directly sends HTML to the client, this function generates HTML from the Pug template and uses it for email content. The `pug.renderFile()` function renders the specified Pug template file and returns the generated HTML content. The `__dirname` variable refers to the directory of the currently executing script (the `utils` folder in this case). Data like `firstName`, `url`, and `subject` can be passed to personalize the email.
      `${__dirname}/../views/email/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // text: htmlToText.fromString(html) // Not working
      text: htmlToText(html), // Additionally, we aim to include a text version of our email alongside the HTML version. This is beneficial for email delivery rates, spam folder prevention, and catering to recipients who prefer plain text emails over formatted HTML ones. Thus, we need a method to convert the HTML content to plain text, removing all HTML formatting and retaining only the text content. For this purpose, we'll utilize the 'html-to-text' package. Here, we employ 'htmlToText.fromString()' to achieve this conversion, storing the resulting string in 'html'.
      // npm i html-to-text
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions); // The `await` keyword ensures that the email is sent only after the transporter is created and the `sendMail()` method completes successfully.
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
};

/*
const sendEmail = async (options) => {
  // 1) Create a transporter ( to handle the email service provider.)
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in gmail "less secure app" option
  });

  // 2) Define the email options (such as sender's email address, recipient's email, subject, and email content.)
  const mailOptions = {
    from: 'Devaki <Hello@devaki.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
*/
