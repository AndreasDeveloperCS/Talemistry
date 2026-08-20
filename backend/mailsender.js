var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user:'customers_services@evryka.org',
    pass: 'Start789$'
  }
});

var mailOptions = {
  from: 'customers_services@evryka.org',
  to: "aandreaspetrov@evryka.org",
  subject: 'Sending Email using Node.js',
  html: '<h1>Welcome</h1><p>That was easy!</p>'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
