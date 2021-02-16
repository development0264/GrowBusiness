var nodemailer = require('nodemailer');

var sendMail = (toMail, subject, htmlText) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: '',
            pass: ''
        }
    });

    var mailOptions = {
        from: 'no-reply@envest.com',
        to: toMail,
        subject: subject,
        html: htmlText
    }

    /* Sending mail */
    transporter.sendMail(mailOptions);

}

module.exports = sendMail;