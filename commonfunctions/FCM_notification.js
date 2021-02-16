const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

const sendFCM = (registrationToken, payload) => {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        })
        admin.messaging().sendToDevice(registrationToken, payload)
            .then(result => {
                console.log('result----->', result.results);
            });
    }
    catch (err) {
        console.log('Error in FCM---->', err);
    }
}

module.exports = sendFCM;