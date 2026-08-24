const nodemailer = require('nodemailer');
const message = {
  from: "customers_services@evryka.org",
  to: "aandreaspetrov@evryka.org",
  subject: "Subject",
  text: "Hello SMTP Email"
};
let transporter = nodemailer.createTransport({
        host: 'smtp.evryka.org',
        port: 587,
        auth: {
            user: "customers_services",
            pass: "Start789$"
        }
});


transporter.sendMail(message, function(err, info) {
  if (err) {
    console.log(err);
  } else {
    console.log(info);
  }
});
