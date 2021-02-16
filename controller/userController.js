const User = require('../models/userModel');
const ResetPassword = require('../models/resetPassword');
const UserInvestmentModel = require('../models/userInvestmentModel');
const UserModel = require('../models/userModel');
const UserInterestModel = require('../models/userInterestModel');
const PlanModel = require('../models/planModel');
const NotificationModel = require('../models/notificationDataModel');
const UserTransactionModel = require('../models/userTransactionModel');
const BoostModel = require('../models/boostModel');
const FeedbackModel = require('../models/userFeedbackModel');
const SubscriptionModel = require('../models/subsctiptionModel');
const UserChatModel = require('../models/userChatModel');

const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const config = require('../commonfunctions/config');
const fs = require('fs')
var random = require('random-gen');
const jwksClient = require('jwks-rsa');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(config.client_id);
const axios = require('axios');
var fastSort = require('fast-sort');
const _ = require('underscore');
const cron = require('node-cron');
const sendMail = require('../commonfunctions/sendMail');
const sendFCM = require('../commonfunctions/FCM_notification');

function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
}

/* Verify token for apple sign in */
function verifyJWT(json, publickey) {
    return new Promise((resolve) => {
        jwt.verify(json, publickey, (err, payload) => {
            if (err) {
                return resolve({ error: err.message });
            }
            resolve({ payload: payload });
        })
    })
}

async function getPlanDetail(plan_id) {
    const planDetail = await PlanModel.findById({ _id: plan_id });
    return planDetail;
}

async function sendVerificationMail(email, id) {
    console.log('----->----- sendVerificationMail ---------> ', email);
    const token = random.number(4);

    await ResetPassword.deleteMany({ user_id: id, email: email });

    const resetPassword = new ResetPassword({
        user_id: id,
        email: email,
        token: token
    });

    await resetPassword.save();
    const subject = 'enVest Email verificaiton';
    const htmlText = '<!DOCTYPE html>' +
        '<html>' +
        '  <head>' +
        '    <title>Welcome to Envest</title>' +
        '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
        '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

        '</head>' +
        '<body style=' +
        '  margin: 0;' +
        '  font-family: "Roboto", sans-serif;"' +
        '  background-color: #E5E5E5;' +
        '  >' +
        '  <div style=' +
        '     max-width: 800px;' +
        '     margin: 0 auto;' +
        '     background-color: #fff;' +
        '     width: 100%;' +
        '>' +
        '<div style="' +
        '  text-align: center;' +
        '  padding: 30px 0 30px 0;' +
        '  margin: 0 50px;' +
        '  border-bottom: 1px solid #BDBDBD;"' +
        '  >' +
        '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
        '      </div>' +
        '<div style="' +
        '  margin: 0 50px;' +
        '  text-align: center;' +
        '  padding: 0 0 40px 0;"' +
        '  >' +
        '  <h1 style="' +
        '     text-align: center;' +
        '     font-size: 34px;' +
        '     margin: 0;' +
        '     color: #1E2661;' +
        '     padding: 40px 0;"' +
        '     >Welcome to Envest</h1>' +
        '<p style="' +
        '     text-align: center;' +
        '     color: #6B7588;' +
        '     font-size: 16px;' +
        '     line-height: 31px;' +
        '     margin: 0 0 50px 0;">' +
        'You’ve just joined an active community of thousands of growing ' +
        'businesses and micro investors all over the nation. I seek your next ' +
        'partner as easily as swiping and get growing.' +
        '<br><br>' +
        'Use this code to verify your account</p>' +
        '<a style="' +
        'background-color: transparent;' +
        'color: #00ADD6;' +
        'font-weight: bold;' +
        'text-decoration: none;' +
        'font-size: 24px;' +
        'display: inline-block;' +
        'width: 100%;' +
        'max-width: 288px;' +
        'padding: 20px 0;">' +
        ' ' + token + ' </a>' +
        '<p style="' +
        'text-align: center;' +
        'color: #6B7588;' +
        'font-size: 16px;' +
        'line-height: 31px;' +
        'margin: 50px 0 30px 0;">' +
        '</p>' +
        '<p style="' +
        'text-align: center;' +
        'color: #6B7588;' +
        'font-size: 16px;' +
        'line-height: 31px;' +
        'margin: 0;">' +
        'Thanks for your time,<br>The enVest Team</p>' +
        '</div>' +
        '<div style="' +
        'background-color: #00ADD6;' +
        'text-align: center;' +
        'padding: 50px 10px;">' +
        '<p style="' +
        'text-align: center;' +
        'color: #ffffff;' +
        'line-height: 25px;' +
        'margin: 0;' +
        'font-size: 14px;' +
        'font-weight: 300;">' +
        'Questions or concerns? <a href="#" style="' +
        '  font-weight: 600;' +
        'color: #fff;">' +
        'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
        '<ul class="footer-links" style="' +
        '        list-style: none;' +
        '        line-height: normal;' +
        '        padding: 0;' +
        '        margin: 40px 0;">' +
        '   <li style="display: inline-block;margin: 0;">' +
        '   <a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="#">Privacy Policy</a></li>' +
        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="#">Get Help</a></li>' +
        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="#">Unsubscribe</a></li>' +
        '</ul>' +
        '<ul class="footer-social" style="' +
        '        list-style: none;' +
        '        line-height: normal;' +
        '        margin: 0 auto;' +
        '        max-width: 660px;' +
        '        width: 100%;' +
        '        padding: 0;">' +
        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
        '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
        '</ul>' +
        '<p style="' +
        'text-align: center;' +
        'color: #ffffff;' +
        'line-height: 25px;' +
        'margin: 30px 0 0 0;' +
        'font-size: 13px;' +
        'font-weight: 300;">' +
        '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
        '</div>' +
        '    </div>' +
        '  </body>' +
        '</html>';

    const toMail = email;
    sendMail(toMail, subject, htmlText);
}

async function sendWelcomeMail(email) {
    console.log('----->----- sendWelcomeMail ---------> ', email);
    const subject = 'Welcome to Envest';
    const htmlText = '<!DOCTYPE html>' +
        '<html>' +
        '  <head>' +
        '    <title>Welcome to Envest</title>' +
        '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
        '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

        '</head>' +
        '<body style=' +
        '  margin: 0;' +
        '  font-family: "Roboto", sans-serif;"' +
        '  background-color: #E5E5E5;' +
        '  >' +
        '  <div style=' +
        '     max-width: 800px;' +
        '     margin: 0 auto;' +
        '     background-color: #fff;' +
        '     width: 100%;' +
        '>' +
        '<div style="' +
        '  text-align: center;' +
        '  padding: 30px 0 30px 0;' +
        '  margin: 0 50px;' +
        '  border-bottom: 1px solid #BDBDBD;"' +
        '  >' +
        '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
        '      </div>' +
        '<div style="' +
        '  margin: 0 50px;' +
        '  text-align: center;' +
        '  padding: 0 0 40px 0;"' +
        '  >' +
        '  <h1 style="' +
        '     text-align: center;' +
        '     font-size: 34px;' +
        '     margin: 0;' +
        '     color: #1E2661;' +
        '     padding: 40px 0;"' +
        '     >Welcome to Envest</h1>' +
        '<p style="' +
        '     text-align: center;' +
        '     color: #6B7588;' +
        '     font-size: 16px;' +
        '     line-height: 31px;' +
        '     margin: 0 0 50px 0;">' +
        'You’ve just joined an active community of thousands of growing ' +
        'businesses and micro investors all over the nation. I seek your next partner ' +
        'as easily as swiping, and get growing.<br></p>' +
        '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
        'background-color: #00ADD6;' +
        'color: #fff;' +
        'font-weight: bold;' +
        'text-decoration: none;' +
        'font-size: 14px;' +
        'display: inline-block;' +
        'width: 100%;' +
        'max-width: 288px;' +
        'padding: 20px 0;">' +
        ' Get Started </a>' +
        '<p style="' +
        'text-align: center;' +
        'color: #6B7588;' +
        'font-size: 16px;' +
        'line-height: 31px;' +
        'margin: 50px 0 30px 0;">' +
        '</p>' +
        '<p style="' +
        'text-align: center;' +
        'color: #6B7588;' +
        'font-size: 16px;' +
        'line-height: 31px;' +
        'margin: 0;">' +
        'Thanks for your time,<br>The enVest Team</p>' +
        '</div>' +
        '<div style="' +
        'background-color: #00ADD6;' +
        'text-align: center;' +
        'padding: 50px 10px;">' +
        '<p style="' +
        'text-align: center;' +
        'color: #ffffff;' +
        'line-height: 25px;' +
        'margin: 0;' +
        'font-size: 14px;' +
        'font-weight: 300;">' +
        'Questions or concerns? <a href="#" style="' +
        '  font-weight: 600;' +
        'color: #fff;">' +
        'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
        '<ul class="footer-links" style="' +
        '        list-style: none;' +
        '        line-height: normal;' +
        '        padding: 0;' +
        '        margin: 40px 0;">' +
        '   <li style="display: inline-block;margin: 0;">' +
        '   <a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="#">Privacy Policy</a></li>' +
        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="#">Get Help</a></li>' +
        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="#">Unsubscribe</a></li>' +
        '</ul>' +
        '<ul class="footer-social" style="' +
        '        list-style: none;' +
        '        line-height: normal;' +
        '        margin: 0 auto;' +
        '        max-width: 660px;' +
        '        width: 100%;' +
        '        padding: 0;">' +
        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
        '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
        '</ul>' +
        '<p style="' +
        'text-align: center;' +
        'color: #ffffff;' +
        'line-height: 25px;' +
        'margin: 30px 0 0 0;' +
        'font-size: 13px;' +
        'font-weight: 300;">' +
        '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
        '</div>' +
        '    </div>' +
        '  </body>' +
        '</html>';

    const toMail = email;
    sendMail(toMail, subject, htmlText);
}

exports.sendAccountVerificationCode = async function (req, res, callback) {
    try {
        console.log('sendAccountVerificationCode -----> ', req.body);
        const { email } = req.body;
        const userDetail = await UserModel.findOneAndUpdate({ email: email }, { $set: { isLinkAlive: true } });
        await sendVerificationMail(email, userDetail._id);
        res.status(200).json({
            status: true,
            message: 'Code successfully sent.'
        })
    }
    catch (err) {
        console.log('375 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!, Please try again later.',
            error: err.message
        })
    }
}

exports.getAllUser = async function (req, res, callback) {
    try {
        console.log('----->----- getAllUser ---------> ', req.body);
        const userList = await UserModel.find({ account_type: { $ne: 'admin' } });
        res.status(200).json({ status: true, message: 'user listing', data: userList });
    }
    catch (err) {
        console.log('391 ----> err ---->', err);
        res.status(400).json({ status: false, message: err.message });
    }
}

exports.getUserDetails = async function (req, res, callback) {
    console.log('----->----- getUserDetails ---------> ', req.body);
    User.findById(req.params.id)
        .then(user => res.status(200).json({ status: true, data: user }))
        .catch(err => res.status(400).json({ status: false, Error: + err }))
}

exports.login = async function (req, res, callback) {
    try {
        console.log('login ----> ', req.body);
        const { email, password } = req.body;
        const userDetail = await UserModel.findOne({ email: email.toLowerCase() });
        if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {

            const passwordhash = userDetail.password;
            const compare = await bcrypt.compare(password, passwordhash);

            if (compare) {
                console.log('userDetail in login ----> ', userDetail);
                const token = jwt.sign({ _id: userDetail.email.toLowerCase() }, process.env.TOKEN_SECRET);
                return res.status(200).json({
                    status: true,
                    data: userDetail,
                    token: token
                });
            } else {
                return res.status(200).json({
                    status: false,
                    message: 'Invalid credentials'
                });
            }
        }
        else {
            return res.status(200).json({
                status: false,
                message: 'User not found.',
            });
        }
    }
    catch (err) {
        console.log('443 ----> err ---->', err);
        return res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
    }
}

exports.resendverificationMail = async function (req, res, callback) {
    try {
        console.log('resendverificationMail -----> ', req.body);
        const { email } = req.body;
        const userDetail = await UserModel.findOne({ email: email }, { email: 1 });
        if (userDetail == null || userDetail == '' || userDetail == undefined) {
            return res.status(200).json({
                status: false,
                message: 'User not found!.'
            })
        }
        else {
            sendVerificationMail(userDetail.email, userDetail._id);
            return res.status(200).json({
                status: true,
                message: 'Verification Mail Resent!.'
            })
        }
    }
    catch (err) {
        console.log('472 ----> err ---->', err);
        return res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
    }
}

exports.register = async function (req, res, callback) {
    try {

        console.log('register req.body ------->', req.body);

        let savedUser;
        const register_type = req.body.register_type;

        const planDetail = await PlanModel.findOne({ plan_name: 'Free' });

        if (register_type == undefined || register_type == null || register_type == '') {
            res.status(200).send({ status: false, message: 'type of register via google, apple, facebook or email is required ' })
        } else {
            if (register_type == 'email') {
                var full_name = req.body.full_name;
                var email = req.body.email.toLowerCase();
                var password = req.body.password;
                var account_type = req.body.account_type;
                var validationError = false;
                var validationMessage = '';

                if (full_name === null || full_name === undefined || full_name === '') {
                    validationError = true;
                    validationMessage = 'Firstname is required ';
                }

                if (email === null || email === undefined || email === '') {
                    validationError = true;
                    validationMessage += 'Email is required ';
                }

                if (password === null || password === undefined || password === '') {
                    validationError = true;
                    validationMessage += 'Password is required';
                }

                if (register_type === null || register_type === undefined || register_type === '') {
                    validationError = true;
                    validationMessage += 'Type is required';
                }

                if (validationError) {
                    res.status(200).send({ status: false, message: validationMessage });
                } else {
                    const saltRounds = 10;
                    const pwd = req.body.password;
                    password = await bcrypt.hash(pwd, saltRounds);

                    var checkEmail = await User.findOne({ email: email });
                    if (checkEmail && checkEmail != null && checkEmail != '' && checkEmail != undefined) {
                        res.status(200).send({ status: false, message: "email exist", data: checkEmail });
                    } else {
                        const user = new User({
                            full_name: full_name,
                            email: email,
                            account_type: account_type,
                            password: password,
                            register_type: register_type,
                            plan_id: planDetail._id
                        })
                        var userDetail = await user.save();
                        sendVerificationMail(userDetail.email, userDetail._id);
                        const token = await jwt.sign({ _id: userDetail.email }, process.env.TOKEN_SECRET);
                        res.status(200).json({
                            status: true,
                            data: userDetail,
                            token: token
                        })
                        // console.log('register email user ----->', userDetail);
                    }
                }
            }

            else if (register_type == 'apple') {
                const appletoken = req.body.token;
                const is_private_email = req.body.is_private_email;
                let checkEmail;
                let emailID;
                let user_authentication;


                if (appletoken === undefined || appletoken === null || appletoken === '') {
                    res.status(200).send({ status: false, message: 'Apple token is required' });
                } else {
                    const json = jwt.decode(appletoken, { complete: true });
                    const kid = json.header.kid;

                    const client = jwksClient({
                        jwksUri: 'https://appleid.apple.com/auth/keys'
                    });
                    client.getSigningKey(kid, async (err, key) => {
                        if (err) {
                            return err;
                        }
                        const signingKey = key.rsaPublicKey;
                        if (!signingKey || signingKey == null) {
                            return res.status(200).send({ status: false, message: 'Something went wrong!' });

                        }
                        const applePayload = await verifyJWT(appletoken, signingKey);

                        if (applePayload.error && applePayload.error != null && applePayload.error != '' && applePayload.error != undefined) {
                            return res.status(200).send({ status: false, message: 'Something Went Wrong!', error: applePayload.error });
                        }
                        // else if (applePayload.sub == req.body.social_id) {

                        if (is_private_email == 'true') {
                            user_authentication = false;
                            emailID = req.body.email.toLowerCase();
                            checkEmail = await UserModel.findOne({ email: emailID });
                            sendVerificationMail(emailID, checkEmail._id);
                        }
                        else {
                            user_authentication = true;
                            emailID = applePayload.payload.email.toLowerCase();
                            checkEmail = await UserModel.findOne({ email: emailID });
                            sendWelcomeMail(emailID);
                        }
                        if (checkEmail !== null) {
                            savedUser = checkEmail;
                        } else {
                            const is_user_authenticated = user_authentication;
                            const full_name = req.body.full_name;
                            const email = emailID.toLowerCase();;
                            const social_id = applePayload.payload.sub;
                            const saltRounds = 10;
                            const pwd = req.body.password;
                            const password = await bcrypt.hash(pwd, saltRounds);

                            const newAppleUser = new User({
                                full_name,
                                email,
                                password,
                                social_id,
                                is_user_authenticated,
                                register_type,
                                plan_id: planDetail._id
                            });

                            savedUser = await newAppleUser.save();
                            /* Check the registering user's email is exists in invited table or not */
                        }

                        /* Generate JWT token */
                        const token = await jwt.sign({ _id: savedUser.email }, process.env.TOKEN_SECRET);
                        res.status(200).json({
                            status: true,
                            data: savedUser,
                            token: token
                        })
                        // console.log('register apple user ----->', savedUser);
                        /* return json data */
                    });
                }
            }

            else if (register_type == 'google') {
                var googletoken = req.body.token;
                if (googletoken === undefined || googletoken === null || googletoken === '') {
                    res.status(200).send({ status: false, message: 'Google token is required' });
                } else {
                    async function verify() {
                        const ticket = await client.verifyIdToken({
                            idToken: googletoken,
                            audience: config.client_id,
                        });
                        const payload = ticket.getPayload();
                        var email = payload['email'].toLowerCase();
                        var checkEmail = await User.findOne({ email: email });
                        if (checkEmail && checkEmail != null && checkEmail != '' && checkEmail != undefined) {
                            res.status(200).send({ status: false, message: "email exist", data: checkEmail });
                        } else {
                            const full_name = payload['given_name'] + " " + payload['family_name'];
                            var account_type = req.body.account_type;
                            const saltRounds = 10;
                            const pwd = req.body.password;
                            const password = await bcrypt.hash(pwd, saltRounds);
                            const user = new User({
                                full_name: full_name,
                                email: email,
                                account_type: account_type,
                                password: password,
                                register_type: register_type,
                                social_id: payload['sub'],
                                is_user_authenticated: true,
                                plan_id: planDetail._id
                            })

                            let userDetail = await user.save();
                            sendWelcomeMail(userDetail.email);
                            const token = await jwt.sign({ _id: userDetail.email }, process.env.TOKEN_SECRET);
                            res.status(200).json({
                                status: true,
                                data: userDetail,
                                token: token
                            })
                            // console.log('register google user ----->', userDetail);
                        }
                    }
                    await verify((success) => {
                        return success;
                    }).catch((err) => {
                        console.log('683 ----> err ---->', err);
                        res.status(400).send({ status: false, message: err.message });
                    });
                }
            }

            else if (register_type === 'facebook') {
                var facebookToken = req.body.token;
                if (facebookToken === undefined || facebookToken === null || facebookToken === '') {
                    res.status(200).send({ status: false, message: 'facebook token required' });
                } else {
                    await axios.get('https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=' + facebookToken)
                        .then(async (response) => {
                            facebookData = response.data;
                            var email = facebookData.email.toLowerCase();
                            userDetail = await User.findOne({ email: email });
                            if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {
                                const token = await jwt.sign({ _id: userDetail.email }, process.env.TOKEN_SECRET);
                                return res.status(200).json({
                                    status: false,
                                    message: 'user Exists',
                                    data: userDetail,
                                    token: token
                                })
                            } else {
                                var full_name = facebookData.first_name + " " + facebookData.last_name;
                                var account_type = req.body.account_type;
                                const saltRounds = 10;
                                const pwd = req.body.password;
                                const password = await bcrypt.hash(pwd, saltRounds);

                                const user = new User({
                                    full_name: full_name,
                                    email: email,
                                    account_type: account_type,
                                    password: password,
                                    social_id: facebookData.id,
                                    register_type: register_type,
                                    is_user_authenticated: true,
                                    plan_id: planDetail._id
                                })
                                userDetail = await user.save();
                                sendWelcomeMail(userDetail.email);
                                const token = await jwt.sign({ _id: userDetail.email }, process.env.TOKEN_SECRET);
                                return res.status(200).json({
                                    status: true,
                                    message: 'user added',
                                    data: userDetail,
                                    token: token
                                })
                                // console.log('register facebook user ----->', userDetail);
                            }
                        })
                        .catch(err => {
                            console.log('737 ----> err ---->', err);
                            res.status(400).send({ status: false, message: err.message });
                        });
                }
            }
        }
    }
    catch (err) {
        console.log('745 ----> err ---->', err);
        return res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
    }
}

/* To check if user is registred with social login or not */
exports.loginWithSocial = async function (req, res, callback) {
    try {
        /* get file and other fields */

        console.log('login with social req.body ----->', req.body);

        const { type, token } = req.body;
        let userDetail;

        if (type === undefined || type === null || type === '') {
            return res.status(200).send({ status: false, message: 'type of register via google, apple or facebook is required' })
        }
        else if (token === undefined || token === null || token === '') {
            return res.status(200).send({ status: false, message: 'Token is required' });
        }
        else {
            if (type == 'google') {
                async function verify() {
                    const ticket = await client.verifyIdToken({
                        idToken: token,
                        audience: config.client_id,
                    });
                    const payload = ticket.getPayload();
                    const googleEmail = payload['email'].toLowerCase();

                    userDetail = await User.findOne({ email: googleEmail });
                    if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {
                        /* Send user data if registred */
                        const auth_token = await jwt.sign({ _id: userDetail.email }, process.env.TOKEN_SECRET);

                        res.status(200).send({ status: true, data: userDetail, token: auth_token });
                        // console.log('login with google existing user ------->', userDetail);
                    }
                    else {
                        /* Send fetched data if user not registred */
                        const profile_photo = payload['picture'];
                        const full_name = payload['family_name'] + ' ' + payload['given_name'];

                        userDetail = {
                            full_name: full_name,
                            profile_photo: profile_photo,
                            email: googleEmail
                        }
                        res.status(200).send({ status: false, message: 'User not registered', data: userDetail });
                        // console.log('login with google new user ------->', userDetail);
                    }
                }
                await verify((success) => {
                    return success;
                }).catch((err) => {
                    console.log('805 ----> err ---->', err);
                    res.status(200).send({ status: false, message: 'Invalid Token', error: err.message });
                });
            }

            if (type === 'facebook') {
                await axios.get('https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=' + token)
                    .then(async (response) => {
                        facebookData = response.data;
                        const facebookEmail = facebookData.email.toLowerCase();
                        userDetail = await User.findOne({ email: facebookEmail });
                        if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {
                            /* Send user data if registred */
                            const auth_token = await jwt.sign({ _id: userDetail.email }, process.env.TOKEN_SECRET);
                            res.status(200).send({ status: true, message: 'User registered', data: userDetail, token: auth_token });
                            // console.log('login with facebook existing user ------->', userDetail);
                        }
                        else {
                            /* Send fetched data if user not registred */
                            const profile_photo = facebookData.picture.data.url;
                            const full_name = facebookData.first_name + " " + facebookData.last_name;

                            userDetail = {
                                full_name: full_name,
                                profile_photo: profile_photo,
                                email: facebookEmail
                            }
                            res.status(200).send({ status: false, message: 'User not registered', data: userDetail });
                            // console.log('login with facebook new user ------->', userDetail);
                        }
                    })
                    .catch(err => {
                        console.log('837 ----> err ---->', err);
                        res.status(200).send({ status: false, message: 'Invalid Token', error: err.message });
                    });
            }

            if (type == 'apple') {
                const json = jwt.decode(token, { complete: true });
                const kid = json.header.kid;

                const client = jwksClient({
                    jwksUri: 'https://appleid.apple.com/auth/keys'
                });

                client.getSigningKey(kid, async (err, key) => {
                    if (err) {
                        return err;
                    }
                    const signingKey = key.rsaPublicKey;

                    if (!signingKey) {
                        res.status(200).send({ status: false, message: 'Something Went Wrong!' });
                    }
                    const applePayload = await verifyJWT(token, signingKey);
                    if (applePayload.error && applePayload.error != null && applePayload.error != '' && applePayload.error != undefined) {
                        res.status(200).send({ status: false, message: 'Something Went Wrong!', error: applePayload.error });
                    }
                    else {
                        // if (applePayload.sub == req.body.social_id) {
                        userDetail = await UserModel.findOne({ social_id: applePayload.payload.sub });
                        if (userDetail == null || userDetail == '' || userDetail == undefined) {
                            var is_private_email = null;
                            try {
                                is_private_email = applePayload.payload.is_private_email;
                            }
                            catch (e) { console.log('871 ----> err ---->', err); }
                            if (!is_private_email) {
                                userDetail = await UserModel.findOne({ email: applePayload.payload.email.toLowerCase() });
                            }
                        }

                        if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {

                            const auth_token = await jwt.sign({ _id: userDetail.email }, process.env.TOKEN_SECRET);
                            res.status(200).send({ status: true, message: 'User exists', data: userDetail, auth_token });
                            // console.log('login with apple existing user ------->', userDetail);

                        }
                        else {
                            /* Send fetched data if user not registred */
                            var is_private_email = null;

                            try {
                                is_private_email = applePayload.payload.is_private_email;
                            }
                            catch (e) { console.log('895 ----> err ---->', err); }
                            userDetail = {
                                email: applePayload.payload.email.toLowerCase(),
                                is_private_email: applePayload.payload.is_private_email
                            }
                            res.status(200).send({ status: false, message: 'User Not registered', data: userDetail });
                            // console.log('login with apple new user ------->', userDetail);
                        }
                    }
                });
            }
        }
    }
    catch (err) {
        console.log('909 ----> err ---->', err);
        return res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
    }
}

/* To change user's password */
exports.changePassword = async function (req, res, callback) {
    console.log('change password -----> ', req.body);
    const id = req.body.id;
    let password = req.body.new_password;
    let oldPassword = req.body.old_password;
    let confirm_Password = req.body.new_password;

    if (password != null && oldPassword != null && confirm_Password != null
        && password != '' && oldPassword != '' && confirm_Password != ''
        && password != undefined && oldPassword != undefined && confirm_Password != undefined) {

        if (password != confirm_Password) {
            res.status(200).json({
                status: true,
                message: 'Password & Confirm password not matched.'
            });
            return;
        }
        else {
            User.findById(id)
                .then(async (user) => {
                    const passwordhash = user.password;
                    var compare = await bcrypt.compare(oldPassword, passwordhash);
                    if (!compare) {
                        return res.status(200).send('Invalid Old Password')
                    }
                    const saltRounds = 10;
                    const pwd = password;
                    password = await bcrypt.hash(pwd, saltRounds);
                    user.password = password;
                    /* Send email when user change their password */
                    user.save()
                        .then(async () => {

                            const notificationData = await NotificationModel.find({ user_id: user._id }, { registrationToken: 1, platform: 1 });

                            notificationData.forEach(ele => {
                                if (ele.platform == 'android') {
                                    const payload = {
                                        notification: {
                                            title: 'Your password was changed',
                                            body: 'You have successfully updated your password.'
                                        }
                                    };
                                    sendFCM(ele.registrationToken, payload)
                                }
                                else if (ele.platform == 'ios') {
                                    let notification = new apn.Notification({
                                        alert: {
                                            title: 'Your password was changed',
                                            body: 'You have successfully updated your password.'
                                        },
                                        topic: 'com.mbakop.binder',
                                        payload: {
                                            "sender": "node-apn",
                                        },
                                        pushType: 'background'
                                    });
                                    apnProvider.send(notification, ele.registrationToken);
                                }
                            })

                            const subject = 'Your password was changed';
                            const htmlText = '<!DOCTYPE html>' +
                                '<html>' +
                                '  <head>' +
                                '    <title>Your password was changed.</title>' +
                                '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
                                '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

                                '</head>' +
                                '<body style=' +
                                '  margin: 0;' +
                                '  font-family: "Roboto", sans-serif;"' +
                                '  background-color: #E5E5E5;' +
                                '  >' +
                                '  <div style=' +
                                '     max-width: 800px;' +
                                '     margin: 0 auto;' +
                                '     background-color: #fff;' +
                                '     width: 100%;' +
                                '>' +
                                '<div style="' +
                                '  text-align: center;' +
                                '  padding: 30px 0 30px 0;' +
                                '  margin: 0 50px;' +
                                '  border-bottom: 1px solid #BDBDBD;"' +
                                '  >' +
                                '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
                                '      </div>' +
                                '<div style="' +
                                '  margin: 0 50px;' +
                                '  text-align: center;' +
                                '  padding: 0 0 40px 0;"' +
                                '  >' +
                                '  <h1 style="' +
                                '     text-align: center;' +
                                '     font-size: 34px;' +
                                '     margin: 0;' +
                                '     color: #1E2661;' +
                                '     padding: 40px 0;"' +
                                '     >Your password was changed.</h1>' +
                                '<p style="' +
                                '     text-align: center;' +
                                '     color: #6B7588;' +
                                '     font-size: 16px;' +
                                '     line-height: 31px;' +
                                '     margin: 0 0 50px 0;">' +
                                'Hi ' + user.full_name + ', <br>' +
                                'You have successfully updated your password.<br><br>' +
                                'In case you haven’t perfromed this activity, change your password ' +
                                'right away to secure your account.  <br></p>' +

                                '<p style="' +
                                'text-align: center;' +
                                'color: #6B7588;' +
                                'font-size: 16px;' +
                                'line-height: 31px;' +
                                'margin: 50px 0 30px 0;">' +
                                // 'Just a reminder:<br>' +
                                // 'Never share your password or security code with anyone.<br>' +
                                // 'Create passwords that are hard to guess and don’t use personal<br>' +
                                // 'information. Be sure to include uppercase and lowercase letters, <br>' +
                                // 'numbers, and symbols.<br>' +
                                // 'Use different passwords for each of your online accounts.<br>' +
                                '</p>' +
                                '<p style="' +
                                'text-align: center;' +
                                'color: #6B7588;' +
                                'font-size: 16px;' +
                                'line-height: 31px;' +
                                'margin: 0;">' +
                                'Thanks for your time,<br>The enVest Team</p>' +
                                '</div>' +
                                '<div style="' +
                                'background-color: #00ADD6;' +
                                'text-align: center;' +
                                'padding: 50px 10px;">' +
                                '<p style="' +
                                'text-align: center;' +
                                'color: #ffffff;' +
                                'line-height: 25px;' +
                                'margin: 0;' +
                                'font-size: 14px;' +
                                'font-weight: 300;">' +
                                'Questions or concerns? <a href="#" style="' +
                                '  font-weight: 600;' +
                                'color: #fff;">' +
                                'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
                                '<ul class="footer-links" style="' +
                                '        list-style: none;' +
                                '        line-height: normal;' +
                                '        padding: 0;' +
                                '        margin: 40px 0;">' +
                                '   <li style="display: inline-block;margin: 0;">' +
                                '   <a style="' +
                                '        text-decoration: none;' +
                                '        color: #fff;' +
                                '        font-size: 14px;"' +
                                '   href="#">Privacy Policy</a></li>' +
                                '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                                '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                                '        text-decoration: none;' +
                                '        color: #fff;' +
                                '        font-size: 14px;"' +
                                '   href="#">Get Help</a></li>' +
                                '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                                '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                                '        text-decoration: none;' +
                                '        color: #fff;' +
                                '        font-size: 14px;"' +
                                '   href="#">Unsubscribe</a></li>' +
                                '</ul>' +
                                '<ul class="footer-social" style="' +
                                '        list-style: none;' +
                                '        line-height: normal;' +
                                '        margin: 0 auto;' +
                                '        max-width: 660px;' +
                                '        width: 100%;' +
                                '        padding: 0;">' +
                                '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
                                '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
                                '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
                                '</ul>' +
                                '<p style="' +
                                'text-align: center;' +
                                'color: #ffffff;' +
                                'line-height: 25px;' +
                                'margin: 30px 0 0 0;' +
                                'font-size: 13px;' +
                                'font-weight: 300;">' +
                                '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
                                '</div>' +
                                '    </div>' +
                                '  </body>' +
                                '</html>';




                            const toMail = user.email;
                            sendMail(toMail, subject, htmlText);
                            res.status(200).json({ status: true, message: 'User password updated!!!', data: user })
                        })
                        .catch(err => res.status(400).json({ status: false, errors: err.message }))
                })
                .catch(err => res.status(400).json({ status: false, errors: err.message }))
        }
    }
    else {
        res.status(200).json({
            status: true,
            message: 'Password, oldPassword & Confirm password are required.'
        });
        return;
    }
}

/* To sendToken */
exports.sendToken = async function (req, res, callback) {
    console.log('sendToken ----->', req.body);
    const email = req.body.email.toLowerCase();

    User.findOne({ email: email }, async function (err, user) {
        if (err) {
            res.status(400).json({ status: false, errors: err });
        } else {
            if (user === null) {
                res.status(200).json({ status: false, message: 'Your email did not found in our system' })
            } else {
                const token = random.number(4);

                await ResetPassword.deleteMany({ user_id: user._id, email: email });

                const resetPassword = new ResetPassword({
                    user_id: user._id,
                    email: user.email,
                    token: token
                })
                await resetPassword.save();

                const notificationData = await NotificationModel.find({ user_id: user._id }, { registrationToken: 1, platform: 1 });

                notificationData.forEach(ele => {
                    if (ele.platform == 'android') {
                        const payload = {
                            notification: {
                                title: 'Reset your password. Safety first!',
                                body: 'We received a request to reset the password for the account' +
                                    'associated with ' + user.email + '.'
                            }
                        };
                        sendFCM(ele.registrationToken, payload)
                    }
                    else if (ele.platform == 'ios') {
                        let notification = new apn.Notification({
                            alert: {
                                title: 'Reset your password. Safety first!',
                                body: 'We received a request to reset the password for the account' +
                                    'associated with ' + user.email + '.'
                            },
                            topic: 'com.mbakop.binder',
                            payload: {
                                "sender": "node-apn",
                            },
                            pushType: 'background'
                        });
                        apnProvider.send(notification, ele.registrationToken);
                    }
                })
                /* Send Email with unique token to reset user password */
                var subject = 'Reset your password. Safety first!';

                const htmlText = '<!DOCTYPE html>' +
                    '<html>' +
                    '  <head>' +
                    '    <title>Reset your password</title>' +
                    '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
                    '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

                    '</head>' +
                    '<body style=' +
                    '  margin: 0;' +
                    '  font-family: "Roboto", sans-serif;"' +
                    '  background-color: #E5E5E5;' +
                    '  >' +
                    '  <div style=' +
                    '     max-width: 800px;' +
                    '     margin: 0 auto;' +
                    '     background-color: #fff;' +
                    '     width: 100%;' +
                    '>' +
                    '<div style="' +
                    '  text-align: center;' +
                    '  padding: 30px 0 30px 0;' +
                    '  margin: 0 50px;' +
                    '  border-bottom: 1px solid #BDBDBD;"' +
                    '  >' +
                    '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
                    '      </div>' +
                    '<div style="' +
                    '  margin: 0 50px;' +
                    '  text-align: center;' +
                    '  padding: 0 0 40px 0;"' +
                    '  >' +
                    '  <h1 style="' +
                    '     text-align: center;' +
                    '     font-size: 34px;' +
                    '     margin: 0;' +
                    '     color: #1E2661;' +
                    '     padding: 40px 0;"' +
                    '     >Reset your password. Safety first!</h1>' +
                    '<p style="' +
                    '     text-align: center;' +
                    '     color: #6B7588;' +
                    '     font-size: 16px;' +
                    '     line-height: 31px;' +
                    '     margin: 0 0 50px 0;">' +
                    'Hi <b>' + user.full_name + '</b> We received a request to reset the password for the account ' +
                    'associated with ' + user.email + '.<br>' +
                    'Use below verification code to set your new password.<br></p>' +
                    '<a style="' +
                    'background-color: transparent;' +
                    'color: #00ADD6;' +
                    'font-weight: bold;' +
                    'text-decoration: none;' +
                    'font-size: 24px;' +
                    'display: inline-block;' +
                    'width: 100%;' +
                    'max-width: 288px;' +
                    'padding: 20px 0;">' +
                    ' ' + token + ' </a>' +
                    '<p style="' +
                    'text-align: center;' +
                    'color: #6B7588;' +
                    'font-size: 16px;' +
                    'line-height: 31px;' +
                    'margin: 50px 0 30px 0;">' +
                    '</p>' +
                    '<p style="' +
                    'text-align: center;' +
                    'color: #6B7588;' +
                    'font-size: 16px;' +
                    'line-height: 31px;' +
                    'margin: 0;">' +
                    'Thanks for your time,<br>The enVest Team</p>' +
                    '</div>' +
                    '<div style="' +
                    'background-color: #00ADD6;' +
                    'text-align: center;' +
                    'padding: 50px 10px;">' +
                    '<p style="' +
                    'text-align: center;' +
                    'color: #ffffff;' +
                    'line-height: 25px;' +
                    'margin: 0;' +
                    'font-size: 14px;' +
                    'font-weight: 300;">' +
                    'Questions or concerns? <a href="#" style="' +
                    '  font-weight: 600;' +
                    'color: #fff;">' +
                    'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
                    '<ul class="footer-links" style="' +
                    '        list-style: none;' +
                    '        line-height: normal;' +
                    '        padding: 0;' +
                    '        margin: 40px 0;">' +
                    '   <li style="display: inline-block;margin: 0;">' +
                    '   <a style="' +
                    '        text-decoration: none;' +
                    '        color: #fff;' +
                    '        font-size: 14px;"' +
                    '   href="#">Privacy Policy</a></li>' +
                    '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                    '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                    '        text-decoration: none;' +
                    '        color: #fff;' +
                    '        font-size: 14px;"' +
                    '   href="#">Get Help</a></li>' +
                    '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                    '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                    '        text-decoration: none;' +
                    '        color: #fff;' +
                    '        font-size: 14px;"' +
                    '   href="#">Unsubscribe</a></li>' +
                    '</ul>' +
                    '<ul class="footer-social" style="' +
                    '        list-style: none;' +
                    '        line-height: normal;' +
                    '        margin: 0 auto;' +
                    '        max-width: 660px;' +
                    '        width: 100%;' +
                    '        padding: 0;">' +
                    '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
                    '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
                    '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
                    '</ul>' +
                    '<p style="' +
                    'text-align: center;' +
                    'color: #ffffff;' +
                    'line-height: 25px;' +
                    'margin: 30px 0 0 0;' +
                    'font-size: 13px;' +
                    'font-weight: 300;">' +
                    '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
                    '</div>' +
                    '    </div>' +
                    '  </body>' +
                    '</html>';



                var toMail = user.email;
                sendMail(toMail, subject, htmlText);
                user.isLinkAlive = true;
                await user.save()
                    .then(() => res.status(200).json({ status: true, message: 'link has been sent to your registered email id to Reset password!!!', token: token }))
                    .catch(err => res.status(400).json({ status: false, errors: err.message }))
            }
        }
    })
}

/* To veriy token */
exports.verifyToken = async function (req, res, callback) {
    try {
        console.log('verifytoken ------> ', req.body);
        const token = req.body.token;
        const tokenExists = await ResetPassword.findOne({ token: token });
        if (tokenExists) {
            const passedTime = diff_minutes(tokenExists.createdAt, new Date());
            if (passedTime <= 10) {
                User.findById(tokenExists.user_id)
                    .then(async (user) => {
                        user.is_user_authenticated = true;
                        user.save()
                            .then(async () => {
                                res.status(200).json({ status: true, message: 'token confirmed', token: token, user: user })
                            })
                            .catch(err => res.status(400).json({ status: false, errors: err }));
                    })
                    .catch(err => res.status(400).json({ status: false, errors: err }));
            }
            else {
                res.status(200).json({
                    status: true,
                    message: 'Token Expired, it is only valid for 10 mins.'
                })
            }
        }
        else {
            res.status(200).send({
                status: false,
                message: 'Invalid Token'
            })
        }
        return;
    }
    catch (err) {
        console.log('1362 ----> err ---->', err);
        res.status(400).send({
            status: false,
            message: 'Something went wrong!',
            error: err.message
        })
    }
}

// exports.verifyUserEmail = async function (req, res, callback) {
//     try {
//         console.log('verifyUserEmail ----> ', req.body);
//         const user_id = req.params.id;
//         const userDetail = await UserModel.findById({ _id: user_id });
//         if (userDetail || userDetail != null || userDetail != '' || userDetail != undefined) {
//             userDetail.is_user_authenticated = true;
//             const data = await userDetail.save();

//             const notificationData = await NotificationModel.find({ user_id: data._id }, { registrationToken: 1, platform: 1 });

//             notificationData.forEach(ele => {
//                 if (ele.platform == 'android') {
//                     const payload = {
//                         notification: {
//                             title: 'Welcome to the Modern Way to Invest and Find Micro Investments',
//                             body: 'You’ve just joined an active community of thousands of growing<br>' +
//                                 'businesses and micro investors all over the nation. I seek your next partner<br>' +
//                                 'as easily as swiping, and get growing.<br>'
//                         }
//                     };
//                     sendFCM(ele.registrationToken, payload)
//                 }
//                 else if (ele.platform == 'ios') {
//                     let notification = new apn.Notification({
//                         alert: {
//                             title: 'Welcome to the Modern Way to Invest and Find Micro Investments',
//                             body: 'You’ve just joined an active community of thousands of growing<br>' +
//                                 'businesses and micro investors all over the nation. I seek your next partner<br>' +
//                                 'as easily as swiping, and get growing.<br>'
//                         },
//                         topic: 'com.mbakop.binder',
//                         payload: {
//                             "sender": "node-apn",
//                         },
//                         pushType: 'background'
//                     });
//                     apnProvider.send(notification, ele.registrationToken);
//                 }
//             })
//             // sendWelcomeMail(userDetail.email);
//             const htmlText = '<!DOCTYPE html>' +
//                 '<html>' +
//                 '  <head>' +
//                 '    <title>Account Verified!</title>' +
//                 '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
//                 '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

//                 '</head>' +
//                 '<body style=' +
//                 '  margin: 0;' +
//                 '  font-family: "Roboto", sans-serif;"' +
//                 '  background-color: #E5E5E5;' +
//                 '  >' +
//                 '  <div style=' +
//                 '     max-width: 800px;' +
//                 '     margin: 0 auto;' +
//                 '     background-color: #fff;' +
//                 '     width: 100%;' +
//                 '>' +
//                 '<div style="' +
//                 '  text-align: center;' +
//                 '  padding: 30px 0 30px 0;' +
//                 '  margin: 0 50px;' +
//                 '  border-bottom: 1px solid #BDBDBD;"' +
//                 '  >' +
//                 '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
//                 '      </div>' +
//                 '<div style="' +
//                 '  margin: 0 50px;' +
//                 '  text-align: center;' +
//                 '  padding: 0 0 40px 0;"' +
//                 '  >' +
//                 '  <h1 style="' +
//                 '     text-align: center;' +
//                 '     font-size: 34px;' +
//                 '     margin: 0;' +
//                 '     color: #1E2661;' +
//                 '     padding: 40px 0;"' +
//                 '     >Congrats!!, Your account is verified now!</h1>' +
//                 '<p style="' +
//                 '     text-align: center;' +
//                 '     color: #6B7588;' +
//                 '     font-size: 16px;' +
//                 '     line-height: 31px;' +
//                 '     margin: 0 0 50px 0;">' +
//                 'You’ve just joined an active community of thousands of growing ' +
//                 'businesses and micro investors all over the nation. I seek your next partner ' +
//                 'as easily as swiping, and get growing.<br></p>' +
//                 '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
//                 'background-color: #00ADD6;' +
//                 'color: #fff;' +
//                 'font-weight: bold;' +
//                 'text-decoration: none;' +
//                 'font-size: 14px;' +
//                 'padding: 20px 70px;">' +
//                 ' Get Started </a>' +
//                 '<p style="' +
//                 'text-align: center;' +
//                 'color: #6B7588;' +
//                 'font-size: 16px;' +
//                 'line-height: 31px;' +
//                 'margin: 50px 0 30px 0;">' +
//                 '</p>' +
//                 '<p style="' +
//                 'text-align: center;' +
//                 'color: #6B7588;' +
//                 'font-size: 16px;' +
//                 'line-height: 31px;' +
//                 'margin: 0;">' +
//                 'Thanks for your time,<br>The enVest Team</p>' +
//                 '</div>' +
//                 '<div style="' +
//                 'background-color: #00ADD6;' +
//                 'text-align: center;' +
//                 'padding: 50px 10px;">' +
//                 '<p style="' +
//                 'text-align: center;' +
//                 'color: #ffffff;' +
//                 'line-height: 25px;' +
//                 'margin: 0;' +
//                 'font-size: 14px;' +
//                 'font-weight: 300;">' +
//                 'Questions or concerns? <a href="#" style="' +
//                 '  font-weight: 600;' +
//                 'color: #fff;">' +
//                 'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
//                 '<ul class="footer-links" style="' +
//                 '        list-style: none;' +
//                 '        line-height: normal;' +
//                 '        padding: 0;' +
//                 '        margin: 40px 0;">' +
//                 '   <li style="display: inline-block;margin: 0;">' +
//                 '   <a style="' +
//                 '        text-decoration: none;' +
//                 '        color: #fff;' +
//                 '        font-size: 14px;"' +
//                 '   href="#">Privacy Policy</a></li>' +
//                 '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
//                 '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
//                 '        text-decoration: none;' +
//                 '        color: #fff;' +
//                 '        font-size: 14px;"' +
//                 '   href="#">Get Help</a></li>' +
//                 '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
//                 '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
//                 '        text-decoration: none;' +
//                 '        color: #fff;' +
//                 '        font-size: 14px;"' +
//                 '   href="#">Get Help</a></li>' +
//                 '</ul>' +
//                 '<ul class="footer-social" style="' +
//                 '        list-style: none;' +
//                 '        line-height: normal;' +
//                 '        margin: 0 auto;' +
//                 '        max-width: 660px;' +
//                 '        width: 100%;' +
//                 '        padding: 0;">' +
//                 '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
//                 '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
//                 '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
//                 '</ul>' +
//                 '<p style="' +
//                 'text-align: center;' +
//                 'color: #ffffff;' +
//                 'line-height: 25px;' +
//                 'margin: 30px 0 0 0;' +
//                 'font-size: 13px;' +
//                 'font-weight: 300;">' +
//                 '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
//                 '</div>' +
//                 '    </div>' +
//                 '  </body>' +
//                 '</html>';


//             res.status(200).send(htmlText);
//         }
//         else {
//             const htmlText = '<!DOCTYPE html>' +
//                 '<html>' +
//                 '  <head>' +
//                 '    <title>Account Verified failed!</title>' +
//                 '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
//                 '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

//                 '</head>' +
//                 '<body style=' +
//                 '  margin: 0;' +
//                 '  font-family: "Roboto", sans-serif;"' +
//                 '  background-color: #E5E5E5;' +
//                 '  >' +
//                 '  <div style=' +
//                 '     max-width: 800px;' +
//                 '     margin: 0 auto;' +
//                 '     background-color: #fff;' +
//                 '     width: 100%;' +
//                 '>' +
//                 '<div style="' +
//                 '  text-align: center;' +
//                 '  padding: 30px 0 30px 0;' +
//                 '  margin: 0 50px;' +
//                 '  border-bottom: 1px solid #BDBDBD;"' +
//                 '  >' +
//                 '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
//                 '      </div>' +
//                 '<div style="' +
//                 '  margin: 0 50px;' +
//                 '  text-align: center;' +
//                 '  padding: 0 0 40px 0;"' +
//                 '  >' +
//                 '  <h1 style="' +
//                 '     text-align: center;' +
//                 '     font-size: 34px;' +
//                 '     margin: 0;' +
//                 '     color: #1E2661;' +
//                 '     padding: 40px 0;"' +
//                 '     >Opps!!, Your account is verification is failed!</h1>' +
//                 '<p style="' +
//                 '     text-align: center;' +
//                 '     color: #6B7588;' +
//                 '     font-size: 16px;' +
//                 '     line-height: 31px;' +
//                 '     margin: 0 0 50px 0;">' +
//                 'It seems like your account is not verified.<br>Please try again later with valid data</p>' +
//                 '<p style="' +
//                 'text-align: center;' +
//                 'color: #6B7588;' +
//                 'font-size: 16px;' +
//                 'line-height: 31px;' +
//                 'margin: 50px 0 30px 0;">' +
//                 '</p>' +
//                 '<p style="' +
//                 'text-align: center;' +
//                 'color: #6B7588;' +
//                 'font-size: 16px;' +
//                 'line-height: 31px;' +
//                 'margin: 0;">' +
//                 'Thanks for your time,<br>The enVest Team</p>' +
//                 '</div>' +
//                 '<div style="' +
//                 'background-color: #00ADD6;' +
//                 'text-align: center;' +
//                 'padding: 50px 10px;">' +
//                 '<p style="' +
//                 'text-align: center;' +
//                 'color: #ffffff;' +
//                 'line-height: 25px;' +
//                 'margin: 0;' +
//                 'font-size: 14px;' +
//                 'font-weight: 300;">' +
//                 'Questions or concerns? <a href="#" style="' +
//                 '  font-weight: 600;' +
//                 'color: #fff;">' +
//                 'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
//                 '<ul class="footer-links" style="' +
//                 '        list-style: none;' +
//                 '        line-height: normal;' +
//                 '        padding: 0;' +
//                 '        margin: 40px 0;">' +
//                 '   <li style="display: inline-block;margin: 0;">' +
//                 '   <a style="' +
//                 '        text-decoration: none;' +
//                 '        color: #fff;' +
//                 '        font-size: 14px;"' +
//                 '   href="#">Privacy Policy</a></li>' +
//                 '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
//                 '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
//                 '        text-decoration: none;' +
//                 '        color: #fff;' +
//                 '        font-size: 14px;"' +
//                 '   href="#">Get Help</a></li>' +
//                 '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
//                 '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
//                 '        text-decoration: none;' +
//                 '        color: #fff;' +
//                 '        font-size: 14px;"' +
//                 '   href="#">Get Help</a></li>' +
//                 '</ul>' +
//                 '<ul class="footer-social" style="' +
//                 '        list-style: none;' +
//                 '        line-height: normal;' +
//                 '        margin: 0 auto;' +
//                 '        max-width: 660px;' +
//                 '        width: 100%;' +
//                 '        padding: 0;">' +
//                 '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
//                 '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
//                 '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
//                 '</ul>' +
//                 '<p style="' +
//                 'text-align: center;' +
//                 'color: #ffffff;' +
//                 'line-height: 25px;' +
//                 'margin: 30px 0 0 0;' +
//                 'font-size: 13px;' +
//                 'font-weight: 300;">' +
//                 '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
//                 '</div>' +
//                 '    </div>' +
//                 '  </body>' +
//                 '</html>';

//             res.status(200).send(htmlText)
//         }
//     }
//     catch (err) {
//         console.log('1678 ----> err ---->', err);
//         const htmlText = '<!DOCTYPE html>' +
//             '<html>' +
//             '  <head>' +
//             '    <title>Oops, Something went wrong!</title>' +
//             '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
//             '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

//             '</head>' +
//             '<body style=' +
//             '  margin: 0;' +
//             '  font-family: "Roboto", sans-serif;"' +
//             '  background-color: #E5E5E5;' +
//             '  >' +
//             '  <div style=' +
//             '     max-width: 800px;' +
//             '     margin: 0 auto;' +
//             '     background-color: #fff;' +
//             '     width: 100%;' +
//             '>' +
//             '<div style="' +
//             '  text-align: center;' +
//             '  padding: 30px 0 30px 0;' +
//             '  margin: 0 50px;' +
//             '  border-bottom: 1px solid #BDBDBD;"' +
//             '  >' +
//             '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
//             '      </div>' +
//             '<div style="' +
//             '  margin: 0 50px;' +
//             '  text-align: center;' +
//             '  padding: 0 0 40px 0;"' +
//             '  >' +
//             '  <h1 style="' +
//             '     text-align: center;' +
//             '     font-size: 34px;' +
//             '     margin: 0;' +
//             '     color: #1E2661;' +
//             '     padding: 40px 0;"' +
//             '     >Oops!!, Something gone wrong while verifying your account!</h1>' +
//             '<p style="' +
//             '     text-align: center;' +
//             '     color: #6B7588;' +
//             '     font-size: 16px;' +
//             '     line-height: 31px;' +
//             '     margin: 0 0 50px 0;">' +
//             'We are sorry for this inconvenience. please try again later after some time.<br></p>' +
//             '<p style="' +
//             'text-align: center;' +
//             'color: #6B7588;' +
//             'font-size: 16px;' +
//             'line-height: 31px;' +
//             'margin: 50px 0 30px 0;">' +
//             '</p>' +
//             '<p style="' +
//             'text-align: center;' +
//             'color: #6B7588;' +
//             'font-size: 16px;' +
//             'line-height: 31px;' +
//             'margin: 0;">' +
//             'Thanks for your time,<br>The enVest Team</p>' +
//             '</div>' +
//             '<div style="' +
//             'background-color: #00ADD6;' +
//             'text-align: center;' +
//             'padding: 50px 10px;">' +
//             '<p style="' +
//             'text-align: center;' +
//             'color: #ffffff;' +
//             'line-height: 25px;' +
//             'margin: 0;' +
//             'font-size: 14px;' +
//             'font-weight: 300;">' +
//             'Questions or concerns? <a href="#" style="' +
//             '  font-weight: 600;' +
//             'color: #fff;">' +
//             'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
//             '<ul class="footer-links" style="' +
//             '        list-style: none;' +
//             '        line-height: normal;' +
//             '        padding: 0;' +
//             '        margin: 40px 0;">' +
//             '   <li style="display: inline-block;margin: 0;">' +
//             '   <a style="' +
//             '        text-decoration: none;' +
//             '        color: #fff;' +
//             '        font-size: 14px;"' +
//             '   href="#">Privacy Policy</a></li>' +
//             '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
//             '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
//             '        text-decoration: none;' +
//             '        color: #fff;' +
//             '        font-size: 14px;"' +
//             '   href="#">Get Help</a></li>' +
//             '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
//             '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
//             '        text-decoration: none;' +
//             '        color: #fff;' +
//             '        font-size: 14px;"' +
//             '   href="#">Get Help</a></li>' +
//             '</ul>' +
//             '<ul class="footer-social" style="' +
//             '        list-style: none;' +
//             '        line-height: normal;' +
//             '        margin: 0 auto;' +
//             '        max-width: 660px;' +
//             '        width: 100%;' +
//             '        padding: 0;">' +
//             '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
//             '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
//             '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
//             '</ul>' +
//             '<p style="' +
//             'text-align: center;' +
//             'color: #ffffff;' +
//             'line-height: 25px;' +
//             'margin: 30px 0 0 0;' +
//             'font-size: 13px;' +
//             'font-weight: 300;">' +
//             '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
//             '</div>' +
//             '    </div>' +
//             '  </body>' +
//             '</html>';

//         res.status(200).send(htmlText);
//     }
// }

/* To Reset user's password */
exports.resetPassword = async function (req, res, callback) {
    try {
        console.log('reset password ---> ', req.body);
        const { token, password } = req.body;

        const userExists = await ResetPassword.findOne({ token: token });
        if (userExists) {
            User.findById({ _id: userExists.user_id }, {}).then(async (userDetails) => {
                // console.log('userDetails --->', userDetails);
                if (userDetails.isLinkAlive === true) {

                    const saltRounds = 10;
                    const pwd = password;
                    // console.log('reset password pwd ---> ', pwd);
                    const becryptedPassword = await bcrypt.hash(pwd, saltRounds);
                    userDetails.password = becryptedPassword;
                    userDetails.isLinkAlive = false;
                    userDetails.save()
                        .then(async (a) => {
                            // console.log('userDetail resetpassword -----> ', a);
                            await ResetPassword.findOneAndRemove({ token: token });
                            res.status(200).json({ status: true, message: 'User password reseted!!!', data: userDetails })
                        })
                        .catch(err => res.status(400).json({ status: false, errors: err }));

                    await ResetPassword.findOneAndRemove({ token: token });
                }
                else {
                    res.status(200).json({ status: false, message: 'Link Expired' });
                }
            })
        }
        else {
            res.status(200).json({ status: false, message: 'Invalid Token' })
        }
    }
    catch (err) {
        console.log('1845 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong! Please try again later.',
            error: err.message
        })
    }
}

exports.updateProfile = async function (req, res, callback) {
    try {
        console.log('updateProfile req.body ----> ', req.body);
        const { user_id,
            full_name,
            contact_number,
            location,
            investment_startRange,
            investment_endRange,
            investment_return,
            experience,
            roi,
            equity,
            revenue,
            industry_type,
            about,
            tags
        } = req.body;

        const image = req.file;

        let rejectedCount = 0;
        let rejectedFields = '';
        let tagNames = [];

        if (!location || location == null || location == undefined || location == '') {
            rejectedCount++;
            rejectedFields = rejectedFields + ' Location'
        }
        if (!investment_startRange || investment_startRange == null || investment_startRange == undefined || investment_startRange == '') {
            rejectedCount++;
            rejectedFields = rejectedFields + ' Investment_startRange'
        }
        if (!investment_endRange || investment_endRange == null || investment_endRange == undefined || investment_endRange == '') {
            rejectedCount++;
            rejectedFields = rejectedFields + ' Investment_endRange'
        }
        if (!about || about == null || about == undefined || about == '') {
            rejectedCount++;
            rejectedFields = rejectedFields + ' About'
        }
        if (!tags || tags == null || tags == undefined || tags == '') {
            rejectedCount++;
            rejectedFields = rejectedFields + ' Tags'
        }
        if (!image || image == null || image == undefined || image == '') {
            rejectedCount++;
            rejectedFields = rejectedFields + ' image'
        }
        if (rejectedCount > 0) {
            res.status(200).json({
                status: false,
                message: rejectedFields + ' are required.'
            });
            return;
        }

        const tagAreArray = Array.isArray(tags);
        if (tagAreArray) {
            tags.forEach(tag => {
                tagNames.push(titleCase(tag));
            })
        }
        else {
            tagNames.push(titleCase(tags));
        }

        const rootDir = image.destination.split("/")[1];
        const parentDir = image.destination.split("/")[2];
        const fileName = rootDir + '/' + parentDir + '/' + image.filename;

        if (req.fileValidationError) {
            if (fs.existsSync(fileName))
                fs.unlinkSync(fileName);

            res.status(200).json({
                status: false,
                message: req.fileValidationError
            })
            return;
        }

        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {
            const previousPhoto = userDetail.profile_photo;
            if (full_name != null && full_name != undefined && full_name != '') {
                userDetail.full_name = full_name;
            }
            if (contact_number != null && contact_number != undefined && contact_number != '') {
                userDetail.contact_number = contact_number;
            }

            userDetail.location = location;
            userDetail.profile_photo = fileName;
            userDetail.investment_startRange = investment_startRange;
            userDetail.investment_endRange = investment_endRange;
            userDetail.about = about;
            userDetail.tags = tagNames;
            userDetail.profile_createdAt = new Date();
            // if (userDetail.is_profile_updated == null) {
            //     userDetail.is_profile_updated = false;
            // }

            // else if (userDetail.is_profile_updated == false) {
            userDetail.is_profile_updated = true;
            // }

            if (userDetail.account_type == 'Business') {
                if (!investment_return || investment_return == null || investment_return == undefined || investment_return == '') {
                    rejectedCount++;
                    rejectedFields = rejectedFields + ' investment_return'
                }
                if (!revenue || revenue == null || revenue == undefined || revenue == '') {
                    rejectedCount++;
                    rejectedFields = rejectedFields + ' revenue'
                }
                if (!industry_type || industry_type == null || industry_type == undefined || industry_type == '') {
                    rejectedCount++;
                    rejectedFields = rejectedFields + ' industry_type'
                }
                if (rejectedCount > 0) {
                    res.status(200).json({
                        status: false,
                        message: rejectedFields + ' are required.'
                    });
                    return;
                }
                userDetail.investment_return = investment_return;
                userDetail.roi = roi;
                userDetail.equity = equity;
                userDetail.revenue = revenue;
                userDetail.industry_type = industry_type;
            }
            else if (userDetail.account_type == 'Investor') {
                if (!experience || experience == null || experience == undefined || experience == '') {
                    rejectedCount++;
                    rejectedFields = rejectedFields + ' experience'
                }
                if (rejectedCount > 0) {
                    res.status(200).json({
                        status: false,
                        message: rejectedFields + ' are required.'
                    });
                    return;
                }
                userDetail.experience = experience;
            }

            const updatedDetail = await userDetail.save();
            if (updatedDetail) {
                if (previousPhoto != null && previousPhoto != '' && previousPhoto != undefined) {
                    if (fs.existsSync(previousPhoto))
                        fs.unlinkSync(previousPhoto);
                }
            }
            // console.log('updateProfile updatedDetail ----> ', updatedDetail);
            res.status(200).json({
                status: true,
                data: updatedDetail
            })
        }
        else {

            res.status(200).json({
                status: false,
                message: 'User not found!.'
            })
        }
    }
    catch (err) {
        console.log('2025 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
    }
}

exports.uploadMedia = async function (req, res, callback) {
    try {
        console.log('----->----- uploadMedia ---------> ', req.body);
        const { user_id } = req.body;
        const media = req.files;

        let rootDir;
        let parentDir;
        let fileName;
        let previousMedia = [];
        let mediafiles = [];

        media.forEach(file => {
            rootDir = file.destination.split("/")[1];
            parentDir = file.destination.split("/")[2];
            fileName = rootDir + '/' + parentDir + '/' + file.filename;
            mediafiles.push(fileName);
        })

        if (req.fileValidationError) {
            mediafiles.forEach(file => {
                if (fs.existsSync(file))
                    fs.unlinkSync(file);
            })
            res.status(200).json({
                status: false,
                message: req.fileValidationError
            })
            return;
        }

        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {
            userDetail.media.forEach(file => {
                previousMedia.push(file);
            });

            userDetail.media = mediafiles;
            const updatedMedia = await userDetail.save();

            if (updatedMedia) {
                previousMedia.forEach(file => {
                    if (fs.existsSync(file))
                        fs.unlinkSync(file);
                })
            }
            res.status(200).json({
                status: true,
                data: updatedMedia
            })
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User not found!.'
            })
        }
    }
    catch (e) {
        console.log('2094 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!',
            error: e.message
        })
        return;
    }
}

exports.uploadDocs = async function (req, res, callback) {
    try {
        console.log('----->----- uploadDocs ---------> ', req.body);
        const { user_id } = req.body;
        const docs = req.files;
        let rootDir;
        let parentDir;
        let fileName;
        let docFiles = {};
        let docFilesBusiness = {};

        const userDetail = await UserModel.findById({ _id: user_id });
        if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {

            if (docs['DVL_front'] != undefined
                && docs['DVL_front'] != null
                && docs['DVL_front'] != '') {

                if ((((docs['DVL_front'][0].size) / 1024) / 1024) > 20) {
                    res.status(200).json({
                        status: false,
                        message: 'Exceed size of DVL_front!',
                    })
                    return;
                }
                rootDir = docs['DVL_front'][0].destination.split('/')[1];
                parentDir = docs['DVL_front'][0].destination.split('/')[2];
                fileName = rootDir + '/' + parentDir + '/' + docs['DVL_front'][0].filename;
                docFiles.DVL_front = fileName;
            }
            if (docs['DVL_back'] != undefined
                && docs['DVL_back'] != null
                && docs['DVL_back'] != '') {

                if ((((docs['DVL_back'][0].size) / 1024) / 1024) > 20) {
                    res.status(200).json({
                        status: false,
                        message: 'Exceed size of DVL_back!',
                    })
                    return;
                }

                rootDir = docs['DVL_back'][0].destination.split('/')[1];
                parentDir = docs['DVL_back'][0].destination.split('/')[2];
                fileName = rootDir + '/' + parentDir + '/' + docs['DVL_back'][0].filename;
                docFiles.DVL_back = fileName;
            }

            if (userDetail.account_type == 'Business') {
                if (docs['Business_licence'] != undefined
                    && docs['Business_licence'] != null
                    && docs['Business_licence'] != '') {

                    if ((((docs['Business_licence'][0].size) / 1024) / 1024) > 20) {
                        res.status(200).json({
                            status: false,
                            message: 'Exceed size of Business_licence!',
                        })
                        return;
                    }

                    rootDir = docs['Business_licence'][0].destination.split('/')[1];
                    parentDir = docs['Business_licence'][0].destination.split('/')[2];
                    fileName = rootDir + '/' + parentDir + '/' + docs['Business_licence'][0].filename;
                    docFilesBusiness.Business_licence = fileName;
                }
            }

            if (req.fileValidationError) {
                if (fs.existsSync(docFiles.DVL_front))
                    fs.unlinkSync(docFiles.DVL_front);
                if (fs.existsSync(docFiles.DVL_back))
                    fs.unlinkSync(docFiles.DVL_back);
                if (fs.existsSync(docFilesBusiness.Business_licence))
                    fs.unlinkSync(docFilesBusiness.Business_licence);
                res.status(200).json({
                    status: false,
                    message: req.fileValidationError
                })
                return;
            }

            const updateWith = {
                files: docFiles,
                status: 0,
                uploadedOn: new Date()
            }

            const updateBusinessWith = {
                files: docFilesBusiness,
                status: 0,
                uploadedOn: new Date()
            }
            let previousDocs;
            if (docs['Business_licence'] || docs['DVL_back'] || docs['DVL_front']) {

                if (docs['DVL_back'] || docs['DVL_front']) {
                    if (docs['DVL_back'] && docs['DVL_front']) {
                        if (userDetail.is_address_verified != null || userDetail.is_address_verified != undefined) {
                            previousDocs = userDetail.is_address_verified.files;
                            if (fs.existsSync(previousDocs['DVL_front']))
                                fs.unlinkSync(previousDocs['DVL_front']);
                            if (fs.existsSync(previousDocs['DVL_back']))
                                fs.unlinkSync(previousDocs['DVL_back']);
                        }
                        await UserModel.findByIdAndUpdate({ _id: user_id }, { $set: { is_address_verified: updateWith } });

                    }
                    else {
                        res.status(200).json({
                            status: false,
                            message: 'DVL_front & DVL_back both are required!.'
                        });
                        return;
                    }
                }

                if (docs['Business_licence']) {
                    if (userDetail.is_address_verified != null) {
                        if (userDetail.is_business_verified != null || userDetail.is_business_verified != undefined) {
                            previousDocs = userDetail.is_business_verified.files;
                            if (fs.existsSync(previousDocs['Business_licence'])) {
                                fs.unlinkSync(previousDocs['Business_licence']);
                            }
                        }
                    }
                    await UserModel.findByIdAndUpdate({ _id: user_id }, { $set: { is_business_verified: updateBusinessWith } });
                }
            }
            else {
                res.status(200).json({
                    status: false,
                    message: 'documents are required!.'
                });
                return;
            }

            const userProfile = await UserModel.findById({ _id: user_id });
            res.status(200).json({
                status: true,
                data: userProfile
            })
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User not found!.'
            })
        }
    }
    catch (err) {
        console.log('2255 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
    }
}

exports.discoverUsers = async function (req, res, callback) {
    try {
        console.log('discoverUsers req.body ----> ', req.body);
        const {
            user_id,
            investment_startRange,
            investment_endRange,
            investment_return,
            tags
        } = req.body;

        let findUsers = {};
        let foundUsersResponse = [];
        let investmentExists;
        let investmentIds = [];
        // let userPlan;
        const userDetail = await UserModel.findById({ _id: user_id });
        if (userDetail != null && userDetail != '' && userDetail != undefined) {
            if (userDetail.account_type == 'Investor') {
                investmentExists = await UserInvestmentModel.find({ investor_user_id: user_id });
                investmentIds = _.pluck(investmentExists, 'business_user_id');
                findUsers.account_type = 'Business'
                /* Business search filter code*/
                if (investment_return != null && investment_return != '' && investment_return != undefined) {
                    findUsers.investment_return = investment_return
                }
            }

            else if (userDetail.account_type == 'Business') {
                investmentExists = await UserInvestmentModel.find({ business_user_id: user_id });
                investmentIds = _.pluck(investmentExists, 'business_user_id');
                findUsers.account_type = 'Investor'
            }

            if (investment_startRange != null && investment_endRange != null && investment_startRange != '' && investment_endRange != '' && investment_startRange != undefined && investment_endRange != undefined) {
                findUsers.investment_startRange = { $gte: investment_startRange }
                findUsers.investment_endRange = { $lte: investment_endRange }
            }

            if (tags != null && tags != '' && tags != undefined) {
                let type = [];
                const tagAreArray = Array.isArray(tags);
                if (tagAreArray) {
                    tags.forEach(ele => {
                        type.push(titleCase(ele));
                    })
                }
                else {
                    type.push(titleCase(tags));
                }


                findUsers.tags = { $in: type }
            }
            /* Fetch matched users */
            const foundUsers = await UserModel.find(findUsers);

            const foundUser_Ids = _.pluck(foundUsers, '_id');
            const foundReacted = await UserInterestModel.find({ user_id: user_id, interestedUser_id: { $in: foundUser_Ids } });
            const foundReacted_Ids = _.pluck(foundReacted, 'interestedUser_id');
            const foundRoom = await UserChatModel.find({ sender_id: user_id, receiver_id: { $in: foundReacted_Ids } });
            const foundRoomIds = _.pluck(foundRoom, 'room_id');

            if (foundUsers.length > 0) {
                foundUsers.forEach(data => {
                    if (!foundReacted_Ids.includes(data._id.toString())) {
                        foundUsersResponse.push(data);
                    }
                });
                res.status(200).json({
                    status: true,
                    data: foundUsersResponse,
                    foundRoomIds
                });
            }
            else {
                res.status(200).json({
                    status: false,
                    message: 'No records found!.'
                });
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User Not found!.'
            });
        }
    }
    catch (err) {
        console.log('2345 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.getSingleUserDetail = async function (req, res, callback) {
    try {
        console.log('----->----- getSingleUserDetail ---------> ', req.body);
        const { user_id } = req.body;
        let planDetail;
        let investmentDetail;
        const foundUser = await UserModel.findById({ _id: user_id });

        if (foundUser.plan_id && foundUser.plan_id != null && foundUser.plan_id != '' && foundUser.plan_id != undefined) {
            planDetail = await PlanModel.findById({ _id: foundUser.plan_id });
        }

        // if (foundUser.account_type == "Business") {
        //     investmentDetail = await UserInvestmentModel.find({ business_user_id: user_id });
        // }
        // else {
        //     investmentDetail = await UserInvestmentModel.find({ investor_user_id: user_id });
        // }
        res.status(200).json({
            status: true,
            data: {
                foundUser,
                planDetail
                //investmentDetail
            }
        });
    }
    catch (err) {
        console.log('2382 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.userInterest = async function (req, res, callback) {
    try {
        console.log('userInterest ---> ', req.body);
        const { user_id, InterestedIn_user_id } = req.body;
        let matchedData;
        var userInterestData;
        let userInerest;
        let finalResponse;
        let planDetail;
        let no_boost = false;

        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail != null && userDetail != '' && userDetail != undefined) {
            const userInterestExist = await UserInterestModel.findOne({ user_id: user_id, interestedUser_id: InterestedIn_user_id });

            if (userDetail.account_type == 'Investor') {
                if (!userInterestExist) {
                    userInerest = new UserInterestModel({
                        user_id: user_id,
                        interestedUser_id: InterestedIn_user_id,
                        intersted_status: 1
                    })
                    userInterestData = await userInerest.save();
                }
                else {
                    await UserInterestModel.findByIdAndUpdate({ _id: userInterestExist._id }, { $set: { intersted_status: 1 } });
                    userInterestData = await UserInterestModel.findById({ _id: userInterestExist._id });
                }
            }
            else if (userDetail.account_type == 'Business') {
                planDetail = await PlanModel.findById({ _id: userDetail.plan_id });
                if (planDetail.is_swipe_unlimited == true) {

                    if (!userInterestExist) {
                        userInerest = new UserInterestModel({
                            user_id: user_id,
                            interestedUser_id: InterestedIn_user_id,
                            intersted_status: 1
                        })
                        userInterestData = await userInerest.save();
                    }
                    else {
                        await UserInterestModel.findByIdAndUpdate({ _id: userInterestExist._id }, { $set: { intersted_status: 1 } });
                        userInterestData = await UserInterestModel.findById({ _id: userInterestExist._id });
                    }
                }
                else if (planDetail.is_swipe_unlimited == false) {

                    if (userDetail.swipe_used < planDetail.swipe_limit) {
                        if (!userInterestExist) {
                            userInerest = new UserInterestModel({
                                user_id: user_id,
                                interestedUser_id: InterestedIn_user_id,
                                intersted_status: 1
                            })
                            userInterestData = await userInerest.save();
                        }
                        else {
                            await UserInterestModel.findByIdAndUpdate({ _id: userInterestExist._id }, { $set: { intersted_status: 1 } });
                            userInterestData = await UserInterestModel.findById({ _id: userInterestExist._id });
                        }
                        const updatedSwipe = userDetail.swipe_used + 1;
                        await UserModel.findByIdAndUpdate({ _id: user_id }, { $set: { swipe_used: updatedSwipe } });
                    }
                    else {
                        no_boost = true;
                    }
                }
            }

            if (no_boost === false) {
                const interestedInUserDetail = await UserModel.findById({ _id: InterestedIn_user_id });

                finalResponse = {
                    _id: userInterestData._id,
                    intersted_status: userInterestData.intersted_status,
                    user_detail: userDetail,
                    interestedUser_detail: interestedInUserDetail,
                    createdAt: userInterestData.createdAt,
                    updatedAt: userInterestData.updatedAt
                }

                const findMatch = {
                    user_id: InterestedIn_user_id,
                    interestedUser_id: user_id,
                    intersted_status: 1
                }

                const foundMatch = await UserInterestModel.findOne(findMatch);
                const projection = {
                    full_name: 1,
                    profile_photo: 1,
                    email: 1
                }

                if (foundMatch) {
                    console.log('2488 ----> ', foundMatch);
                    const userDetail = await UserModel.findById({ _id: user_id });
                    const InteresedInuserDetail = await UserModel.findById({ _id: InterestedIn_user_id });

                    await UserInterestModel.updateOne({ user_id: foundMatch.user_id, interestedUser_id: foundMatch.interestedUser_id }, { $set: { intersted_status: 3 } });

                    await UserInterestModel.updateOne({ user_id: foundMatch.interestedUser_id, interestedUser_id: foundMatch.user_id }, { $set: { intersted_status: 3 } });

                    matchedData = {
                        userDetail,
                        InteresedInuserDetail
                    }

                    const notificationData = await NotificationModel.find({ user_id: userDetail._id }, { registrationToken: 1, platform: 1 });

                    notificationData.forEach(ele => {
                        if (ele.platform == 'android') {
                            const payload = {
                                notification: {
                                    title: 'Congrats, you have a match!',
                                    body: 'It seems we found you a match.<br> ' + InteresedInuserDetail.full_name + ' has also expressed interest in you. '
                                }
                            };
                            sendFCM(ele.registrationToken, payload)
                        }
                        else if (ele.platform == 'ios') {
                            let notification = new apn.Notification({
                                alert: {
                                    title: 'Congrats, you have a match!',
                                    body: 'It seems we found you a match.<br> ' + InteresedInuserDetail.full_name + ' has also expressed interest in you. '
                                },
                                topic: 'com.mbakop.binder',
                                payload: {
                                    "sender": "node-apn",
                                },
                                pushType: 'background'
                            });
                            apnProvider.send(notification, ele.registrationToken);
                        }
                    })

                    if (userDetail.is_email_subscribed) {
                        const toMail = userDetail.email;
                        const subject = ' You have a match!';
                        const htmlText = '<!DOCTYPE html>' +
                            '<html>' +
                            '  <head>' +
                            '    <title>You have a match!</title>' +
                            '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
                            '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

                            '</head>' +
                            '<body style=' +
                            '  margin: 0;' +
                            '  font-family: "Roboto", sans-serif;"' +
                            '  background-color: #E5E5E5;' +
                            '  >' +
                            '  <div style=' +
                            '     max-width: 800px;' +
                            '     margin: 0 auto;' +
                            '     background-color: #fff;' +
                            '     width: 100%;' +
                            '>' +
                            '<div style="' +
                            '  text-align: center;' +
                            '  padding: 30px 0 30px 0;' +
                            '  margin: 0 50px;' +
                            '  border-bottom: 1px solid #BDBDBD;"' +
                            '  >' +
                            '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
                            '      </div>' +
                            '<div style="' +
                            '  margin: 0 50px;' +
                            '  text-align: center;' +
                            '  padding: 0 0 40px 0;"' +
                            '  >' +
                            '  <h1 style="' +
                            '     text-align: center;' +
                            '     font-size: 34px;' +
                            '     margin: 0;' +
                            '     color: #1E2661;' +
                            '     padding: 40px 0;"' +
                            '     >You have a match!</h1>' +
                            '<p style="' +
                            '     text-align: center;' +
                            '     color: #6B7588;' +
                            '     font-size: 16px;' +
                            '     line-height: 31px;' +
                            '     margin: 0 0 50px 0;">' +
                            'Hi ' + userDetail.full_name + ',<br> ' +
                            'You have a new match with ' + InteresedInuserDetail.full_name + ',<br>' +
                            'Jump right in and introduce yourself. ' +
                            '</p>' +
                            '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
                            'background-color: #00ADD6;' +
                            'color: #fff;' +
                            'font-weight: bold;' +
                            'text-decoration: none;' +
                            'font-size: 14px;' +
                            'display: inline-block;' +
                            'width: 100%;' +
                            'max-width: 288px;' +
                            'padding: 20px 0;">' +
                            ' Say Hello </a>' +
                            '<p style="' +
                            'text-align: center;' +
                            'color: #6B7588;' +
                            'font-size: 16px;' +
                            'line-height: 31px;' +
                            'margin: 50px 0 30px 0;">' +
                            '</p>' +
                            '<p style="' +
                            'text-align: center;' +
                            'color: #6B7588;' +
                            'font-size: 16px;' +
                            'line-height: 31px;' +
                            'margin: 0;">' +
                            'Thanks for your time,<br>The enVest Team</p>' +
                            '</div>' +
                            '<div style="' +
                            'background-color: #00ADD6;' +
                            'text-align: center;' +
                            'padding: 50px 10px;">' +
                            '<p style="' +
                            'text-align: center;' +
                            'color: #ffffff;' +
                            'line-height: 25px;' +
                            'margin: 0;' +
                            'font-size: 14px;' +
                            'font-weight: 300;">' +
                            'Questions or concerns? <a href="#" style="' +
                            '  font-weight: 600;' +
                            'color: #fff;">' +
                            'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
                            '<ul class="footer-links" style="' +
                            '        list-style: none;' +
                            '        line-height: normal;' +
                            '        padding: 0;' +
                            '        margin: 40px 0;">' +
                            '   <li style="display: inline-block;margin: 0;">' +
                            '   <a style="' +
                            '        text-decoration: none;' +
                            '        color: #fff;' +
                            '        font-size: 14px;"' +
                            '   href="#">Privacy Policy</a></li>' +
                            '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                            '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                            '        text-decoration: none;' +
                            '        color: #fff;' +
                            '        font-size: 14px;"' +
                            '   href="#">Get Help</a></li>' +
                            '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                            '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                            '        text-decoration: none;' +
                            '        color: #fff;' +
                            '        font-size: 14px;"' +
                            '   href="' + config.server_url + ':' + config.port + '/api/user/unsubscribeEmail/' + userDetail._id + '">Unsubscribe</a></li>' +
                            '</ul>' +
                            '<ul class="footer-social" style="' +
                            '        list-style: none;' +
                            '        line-height: normal;' +
                            '        margin: 0 auto;' +
                            '        max-width: 660px;' +
                            '        width: 100%;' +
                            '        padding: 0;">' +
                            '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
                            '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
                            '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
                            '</ul>' +
                            '<p style="' +
                            'text-align: center;' +
                            'color: #ffffff;' +
                            'line-height: 25px;' +
                            'margin: 30px 0 0 0;' +
                            'font-size: 13px;' +
                            'font-weight: 300;">' +
                            '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
                            '</div>' +
                            '    </div>' +
                            '  </body>' +
                            '</html>';


                        sendMail(toMail, subject, htmlText);
                    }
                    console.log('2655 ----> match found ---->', matchedData);
                    res.status(200).json({
                        status: true,
                        message: 'Matched found!!',
                        data: matchedData
                    });
                }
                else {
                    console.log('2663 ----> finalResponse ---->', finalResponse);
                    res.status(200).json({
                        status: true,
                        message: 'Interested Added!!',
                        data: finalResponse
                    });
                }
            }
            else {
                res.status(200).json({
                    status: true,
                    message: 'You have no swipes left, please purhcase new one and enjoy swipping.'
                })
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User not found!.'
            });
        }
    }
    catch (err) {
        console.log('2703 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.userNotInterstedIn = async function (req, res, callback) {
    try {
        console.log('----->----- userNotInterstedIn ---------> ', req.body);
        const { user_id, notInterstedIn_user_id } = req.body;
        let userDislikeData;

        const foundDislike = await UserInterestModel.findOne({ user_id: user_id, interestedUser_id: notInterstedIn_user_id });

        if (!foundDislike) {
            userDislike = new UserInterestModel({
                user_id: user_id,
                interestedUser_id: notInterstedIn_user_id,
                intersted_status: 2
            })
            userDislikeData = await userDislike.save();
        }
        else {
            await UserInterestModel.findByIdAndUpdate({ _id: foundDislike._id }, { $set: { intersted_status: 2 } });
            userDislikeData = await UserInterestModel.findById({ _id: foundDislike._id });
        }

        res.status(200).json({
            status: true,
            message: 'Disliked',
            data: userDislikeData
        })
    }
    catch (err) {
        console.log('2740 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went Wrong!.',
            error: err.message
        });
    }
}

exports.listMatch = async function (req, res, callback) {
    try {
        console.log('----->----- listMatch ---------> ', req.body);
        const { user_id } = req.body;

        let findPremiumMatch;
        let foundPremiumMatch = [];
        let planDetail;
        let investmentExists;
        let investmentIds = [];
        let foundMatchedUsers = [];

        const userDetail = await UserModel.findById({ _id: user_id });
        if (userDetail != null && userDetail != '' && userDetail != undefined) {
            if (userDetail.plan_id != null && userDetail.plan_id != '' && userDetail.plan_id != undefined) {
                planDetail = await PlanModel.findById({ _id: userDetail.plan_id });
            }
            if (userDetail.account_type == 'Investor') {
                investmentExists = await UserInvestmentModel.find({ investor_user_id: user_id });
                investmentIds = _.pluck(investmentExists, 'business_user_id');
            }
            else if (userDetail.account_type == 'Business') {
                investmentExists = await UserInvestmentModel.find({ business_user_id: user_id });
                investmentIds = _.pluck(investmentExists, 'business_user_id');
                findPremiumMatch = {
                    account_type: 'Investor',
                    investment_startRange: { $gte: userDetail.investment_startRange },
                    investment_endRange: { $lte: userDetail.investment_endRange },
                    tags: { $in: userDetail.tags }
                }
                if (planDetail != null && planDetail != '' && planDetail != undefined) {
                    if (planDetail.plan_name == 'Gold') {
                        foundPremiumMatch = await UserModel.find(findPremiumMatch).sort({ createdAt: -1 }).limit(10);
                    }
                    else if (planDetail.plan_name == 'Plus') {
                        foundPremiumMatch = await UserModel.find(findPremiumMatch).sort({ createdAt: -1 }).limit(5);
                    }
                }
            }

            const findMatches = {
                interestedUser_id: user_id,
                intersted_status: 3
            }

            const foundMatches = await UserInterestModel.find(findMatches);
            const matchedUserId = _.pluck(foundMatches, 'user_id');
            const foundUsers = await UserModel.find({ _id: { $in: matchedUserId } });
            if (foundUsers.length > 0) {
                foundUsers.forEach(data => {
                    if (!investmentIds.includes(data._id.toString())) {
                        foundMatchedUsers.push(data);
                    }
                });
            }

            if (foundMatchedUsers.length > 0 || foundPremiumMatch.length > 0) {
                return res.status(200).json({
                    status: true,
                    data: {
                        foundMatchedUsers,
                        foundPremiumMatch
                    }
                });
            }
            else {
                return res.status(200).json({
                    status: false,
                    message: 'No records found!.'
                });
            }
        }
        else {
            return res.status(200).json({
                status: false,
                message: 'User not found!.'
            });
        }
    }
    catch (err) {
        console.log('2813 ----> err ---->', err);
        return res.status(400).json({
            status: false,
            message: 'Something went Wrong!.',
            error: err.message
        });
    }
}

exports.userPurchase = async function (req, res, callback) {
    try {
        console.log('----->----- userPurchase ---------> ', req.body);
        const {
            user_id,
            product_id,
            device_id,
            amount,
            receipt_data,
            payment_status
        } = req.body;

        let planDetail;
        let new_transaction;
        let user_transaction;
        let newSubscription;
        let new_subscription;

        if (!user_id || user_id == null || user_id == '' || user_id == undefined) {
            res.status(200).json({ status: false, message: 'user_id is required' });
            return;
        }
        else if (!product_id || product_id == null || product_id == '' || product_id == undefined) {
            res.status(200).json({ status: false, message: 'product_id is required' });
            return;
        }
        else if (!device_id || device_id == null || device_id == '' || device_id == undefined) {
            res.status(200).json({ status: false, message: 'device_id is required' });
            return;
        }
        else if (!amount || amount == null || amount == '' || amount == undefined) {
            res.status(200).json({ status: false, message: 'amount is required' });
            return;
        }
        else if (!receipt_data || receipt_data == null || receipt_data == '' || receipt_data == undefined) {
            res.status(200).json({ status: false, message: 'receipt_data is required' });
            return;
        }

        else if (!payment_status || payment_status == null || payment_status == '' || payment_status == undefined) {
            res.status(200).json({ status: false, message: 'payment_status is required' });
            return;
        }

        const userDetail = await UserModel.findById({ _id: user_id });
        planDetail = await PlanModel.findById({ _id: product_id });
        if (!planDetail || planDetail == null || planDetail == '' || planDetail == undefined) {
            planDetail = await BoostModel.findById({ _id: product_id });
        }

        if (!userDetail || userDetail == null || userDetail == '' || userDetail == undefined) {
            res.status(200).json({
                status: false,
                message: 'User Not Found!.'
            });
            return;
        }

        if (!planDetail || planDetail == null || planDetail == '' || planDetail == undefined) {
            res.status(200).json({
                status: false,
                message: 'Plan Not Found!.'
            });
            return;
        }

        if (userDetail.account_type != 'Business') {
            res.status(200).json({
                status: false,
                message: 'Not business user!.'
            });
            return;
        }

        /* If all ok */
        const purchase_dateTime = new Date();
        // if (planDetail.plan_name != 'Gold' && planDetail.plan_name != 'Plus') {
        if (planDetail.plan_name == 'Free') {
            user_transaction = new UserTransactionModel({
                user_id: user_id,
                plan_id: product_id,
                device_id: device_id,
                payment_method: 'IAP',
                payment_id: receipt_data,
                transaction_amount: amount,
                transaction_charge: 0,
                payment_status: payment_status,
                payment_dateTime: purchase_dateTime
            });
            new_transaction = await user_transaction.save();

            await UserModel.findByIdAndUpdate({
                _id: user_id
            }, {
                $set: {
                    plan_id: product_id
                }
            })
        }
        else if (planDetail.plan_name == 'Verification') {
            await UserModel.findByIdAndUpdate({
                _id: user_id
            }, {
                $set: {
                    purchase_verification: true
                }
            })
        }

        else if (planDetail.plan_name == 'Gold' || planDetail.plan_name == 'Plus') {
            const userSubsctiption = await SubscriptionModel.findOne({ user_id: user_id });
            if (userSubsctiption == null || userSubsctiption == '' || userSubsctiption == undefined) {

                newSubscription = new SubscriptionModel({
                    user_id: user_id,
                    is_subscription_on: true,
                    will_cancel: false,
                    subscription_start_dateTime: new Date(),
                    current_subscribed_plan: product_id,
                });
                new_subscription = await newSubscription.save();

                user_transaction = new UserTransactionModel({
                    user_id: user_id,
                    plan_id: product_id,
                    device_id: device_id,
                    payment_method: 'IAP',
                    payment_id: receipt_data,
                    transaction_amount: amount,
                    transaction_charge: 0,
                    payment_status: payment_status,
                    payment_dateTime: purchase_dateTime,
                    subscription_id: new_subscription._id
                });
                new_transaction = await user_transaction.save();

                await UserModel.findByIdAndUpdate({
                    _id: user_id
                }, {
                    $set: {
                        is_boost_used: false,
                        is_premium_user: true,
                        will_cancel: false,
                        plan_id: product_id,
                        premium_plan_purchased_on: purchase_dateTime
                    }
                })
            }
            else if (userSubsctiption.next_subscribing_plan == null) {

                const currentPlanDetail = await getPlanDetail(userSubsctiption.current_subscribed_plan);
                const nextplanDetail = await getPlanDetail(product_id);

                if (parseFloat(currentPlanDetail.plan_amount) < parseFloat(nextplanDetail.plan_amount)) {

                    userSubsctiption.previous_plan_start_dateTime = userSubsctiption.subscription_start_dateTime;
                    userSubsctiption.previous_subscribed_plan = userSubsctiption.current_subscribed_plan;
                    userSubsctiption.current_subscribed_plan = product_id;
                    new_subscription = await userSubsctiption.save();

                    user_transaction = new UserTransactionModel({
                        user_id: user_id,
                        plan_id: product_id,
                        device_id: device_id,
                        payment_method: 'IAP',
                        payment_id: receipt_data,
                        transaction_amount: parseFloat(nextplanDetail.plan_amount) - parseFloat(currentPlanDetail.plan_amount),
                        transaction_charge: 0,
                        payment_status: payment_status,
                        payment_dateTime: purchase_dateTime,
                        subscription_id: new_subscription._id
                    });
                    new_transaction = await user_transaction.save();

                    await UserModel.findByIdAndUpdate({
                        _id: user_id
                    }, {
                        $set: {
                            is_boost_used: false,
                            is_premium_user: true,
                            will_cancel: false,
                            plan_id: product_id,
                            premium_plan_purchased_on: purchase_dateTime
                        }
                    })
                }

                else if (userSubsctiption.current_subscribed_plan != product_id) {

                    userSubsctiption.next_subscribing_plan = product_id;
                    new_subscription = await userSubsctiption.save();
                }
                else {
                    console.log('system will not let you subscribe same plan again.');
                }
            }
        }

        else {
            const updated_total_remaining_boost = userDetail.total_remaining_boost + planDetail.boosts;
            await UserModel.findByIdAndUpdate({
                _id: user_id
            }, {
                $set: {
                    is_boost_purchased: true,
                    boost_id: product_id,
                    total_remaining_boost: updated_total_remaining_boost,
                    total_boost_used: 0
                }
            });

            user_transaction = new UserTransactionModel({
                user_id: user_id,
                plan_id: product_id,
                device_id: device_id,
                payment_method: 'IAP',
                payment_id: receipt_data,
                transaction_amount: amount,
                transaction_charge: 0,
                payment_status: payment_status,
                payment_dateTime: purchase_dateTime,
            });
            new_transaction = await user_transaction.save();

        }

        res.status(200).json({
            status: true,
            message: 'Purchase successful!.',
            data: new_transaction
        });

    }
    catch (err) {
        console.log('3056 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went Wrong!.',
            error: err.message
        });
    }
}

exports.userVerificaitonPurchase = async function (req, res, callback) {
    try {
        console.log('----->----- userVerificaitonPurchase ---------> ', req.body);
        const {
            user_id,
            product_id,
            device_id,
            amount,
            receipt_data,
            payment_status
        } = req.body;

        let new_transaction;
        let user_transaction;

        if (!user_id || user_id == null || user_id == '' || user_id == undefined) {
            res.status(200).json({ status: false, message: 'user_id is required' });
            return;
        }
        else if (!product_id || product_id == null || product_id == '' || product_id == undefined) {
            res.status(200).json({ status: false, message: 'product_id is required' });
            return;
        }
        else if (!device_id || device_id == null || device_id == '' || device_id == undefined) {
            res.status(200).json({ status: false, message: 'device_id is required' });
            return;
        }
        else if (!amount || amount == null || amount == '' || amount == undefined) {
            res.status(200).json({ status: false, message: 'amount is required' });
            return;
        }
        else if (!receipt_data || receipt_data == null || receipt_data == '' || receipt_data == undefined) {
            res.status(200).json({ status: false, message: 'receipt_data is required' });
            return;
        }

        else if (!payment_status || payment_status == null || payment_status == '' || payment_status == undefined) {
            res.status(200).json({ status: false, message: 'payment_status is required' });
            return;
        }

        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail.purchase_verification == true) {
            res.status(200).json({
                status: true,
                message: 'You have already purchased verification plan.',
                data: userDetail
            });
            return;
        }

        const planDetail = await PlanModel.findById({ _id: product_id });

        if (!userDetail || userDetail == null || userDetail == '' || userDetail == undefined) {
            res.status(200).json({
                status: false,
                message: 'User Not Found!.'
            });
            return;
        }

        if (!planDetail || planDetail == null || planDetail == '' || planDetail == undefined) {
            res.status(200).json({
                status: false,
                message: 'Plan Not Found!.'
            });
            return;
        }

        if (userDetail.account_type != 'Business') {
            res.status(200).json({
                status: false,
                message: 'Not business user!.'
            });
            return;
        }

        /* If all ok */
        const purchase_dateTime = new Date();
        if (planDetail.plan_name == 'Verification') {
            user_transaction = new UserTransactionModel({
                user_id: user_id,
                plan_id: product_id,
                device_id: device_id,
                payment_method: 'IAP',
                payment_id: receipt_data,
                transaction_amount: amount,
                transaction_charge: 0,
                payment_status: payment_status,
                payment_dateTime: purchase_dateTime
            });
            new_transaction = await user_transaction.save();
            await UserModel.findByIdAndUpdate({
                _id: user_id
            }, {
                $set: {
                    purchase_verification: true
                }
            })
        }
        res.status(200).json({
            status: true,
            message: 'Verification Purchase successful!.',
            data: new_transaction
        });

    }
    catch (err) {
        console.log('3174 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went Wrong!.',
            error: err.message
        });
    }
}

exports.cancelSubscription = async function (req, res, callback) {
    try {
        console.log('----->----- cancelSubscription ---------> ', req.body);
        const { user_id } = req.body;

        await SubscriptionModel.findOneAndUpdate({ user_id: user_id }, { $set: { will_cancel: true } });
        const userSubsctiption = await SubscriptionModel.findOne({ user_id: user_id });

        res.status(200).json({
            status: true,
            data: userSubsctiption
        })
    }
    catch (err) {
        console.log('3197 ----> err ---->', err);
        res.status(400).json({
            status: false,
            messsage: 'Something went wrong!.',
            error: err.message
        })
    }
}

exports.chooseFreePlan = async function (req, res, callback) {
    try {
        console.log('----->----- chooseFreePlan ---------> ', req.body);
        const { user_id } = req.body;
        const planDetail = await PlanModel.findOne({ plan_name: 'Free' });
        await UserModel.findByIdAndUpdate({ _id: user_id }, { $set: { plan_id: planDetail._id } });
        res.status(200).json({
            status: true,
            message: 'Proceed as a free user.'
        })
    }
    catch (err) {
        console.log('3218 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err
        })
    }
}

exports.listInvestment = async function (req, res, callback) {
    try {
        console.log('----->----- listInvestment ---------> ', req.body);
        const { user_id } = req.body;
        let findInvestment;
        let foundInvestments;
        let investmentUserDetail;
        let investedIn_userIds;
        let investmentResponse = [];

        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail.account_type == 'Investor') {
            findInvestment = {
                investor_user_id: user_id,
                is_investment_accepted: { $ne: 2 }
            }
            foundInvestments = await UserInvestmentModel.find(findInvestment);
            investedIn_userIds = _.pluck(foundInvestments, 'business_user_id');

        }
        else {
            findInvestment = {
                business_user_id: user_id,
                is_investment_accepted: { $ne: 2 }
            }

            foundInvestments = await UserInvestmentModel.find(findInvestment);
            investedIn_userIds = _.pluck(foundInvestments, 'investor_user_id');
        }

        investmentUserDetail = await UserModel.find({ _id: { $in: investedIn_userIds } });

        foundInvestments.forEach(investment => {
            investmentUserDetail.forEach(user => {
                if (investment.business_user_id == user._id || investment.investor_user_id == user._id) {
                    investmentResponse.push({
                        investorDetail: user,
                        investment_id: investment._id,
                        investment_amount: investment.investment_amount,
                        equity: investment.equity,
                        roi: investment.roi,
                        revenue: investment.revenue,
                        invesment_accepted_status: investment.is_investment_accepted,
                        accepted_dateTime: investment.accepted_dateTime,
                        invsetment_approved_dateTime: investment.createdAt
                    })
                }
            })
        })

        if (investmentResponse.length > 0) {
            res.status(200).json({
                status: true,
                message: 'Investment list!',
                data: investmentResponse
            })
            return;
        }
        else {
            res.status(200).json({
                status: false,
                message: 'No records found!',
            })
            return;
        }
    }
    catch (err) {
        console.log('3317 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!',
            error: err.message
        })
    }
}

exports.boostUser = async function (req, res, callback) {
    try {
        console.log('----->----- boostUser ---------> ', req.body);
        const { user_id } = req.body;
        const userDetail = await UserModel.findById({ _id: user_id });
        let success = 0;
        if (userDetail.account_type === 'Business') {
            if (userDetail.is_on_boost == false) {
                if (userDetail.is_boost_used === false) {
                    userDetail.is_boost_used = true;
                    userDetail.is_on_boost = true;
                    userDetail.boost_start_time = new Date();
                    userDetail.save();
                    success++;
                }
                else if (userDetail.is_boost_purchased == true) {
                    if (userDetail.total_remaining_boost > 0) {
                        userDetail.total_boost_used += 1;
                        userDetail.total_remaining_boost -= 1;
                        userDetail.is_on_boost = true;
                        userDetail.boost_start_time = new Date();
                        userDetail.save();
                        success++;
                    }
                    else {
                        res.status(200).json({
                            status: false,
                            message: 'REPURCHASE',
                        })
                        return;
                    }
                }
                else {
                    res.status(200).json({
                        status: false,
                        message: 'REPURCHASE',
                    })
                    return;
                }
            }
            else {
                res.status(200).json({
                    status: true,
                    message: 'You are already on boost.',
                })
                return;
            }

            if (success > 0) {
                const notificationData = await NotificationModel.find({ user_id: userDetail._id }, { registrationToken: 1, platform: 1 });
                notificationData.forEach(ele => {
                    if (ele.platform == 'android') {
                        const payload = {
                            notification: {
                                title: 'You are BOOSTed for the next 30 minutes.',
                                body: 'You will benefit of increase visibility in front of the entire enVEST community for 30mins.'
                            }
                        };
                        sendFCM(ele.registrationToken, payload)
                    }
                    else if (ele.platform == 'ios') {
                        let notification = new apn.Notification({
                            alert: {
                                title: 'You are BOOSTed for the next 30 minutes.',
                                body: 'You will benefit of increase visibility in front of the entire enVEST community for 30mins.'
                            },
                            topic: 'com.mbakop.binder',
                            payload: {
                                "sender": "node-apn",
                            },
                            pushType: 'background'
                        });
                        apnProvider.send(notification, ele.registrationToken);
                    }
                })

                if (userDetail.is_email_subscribed) {
                    const toMail = userDetail.email;
                    const subject = ' Congrats, Boostmode is here!';

                    const htmlText = '<!DOCTYPE html>' +
                        '<html>' +
                        '  <head>' +
                        '    <title>Congrats,<br> Boost mode is here!</title>' +
                        '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
                        '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

                        '</head>' +
                        '<body style=' +
                        '  margin: 0;' +
                        '  font-family: "Roboto", sans-serif;"' +
                        '  background-color: #E5E5E5;' +
                        '  >' +
                        '  <div style=' +
                        '     max-width: 800px;' +
                        '     margin: 0 auto;' +
                        '     background-color: #fff;' +
                        '     width: 100%;' +
                        '>' +
                        '<div style="' +
                        '  text-align: center;' +
                        '  padding: 30px 0 30px 0;' +
                        '  margin: 0 50px;' +
                        '  border-bottom: 1px solid #BDBDBD;"' +
                        '  >' +
                        '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
                        '      </div>' +
                        '<div style="' +
                        '  margin: 0 50px;' +
                        '  text-align: center;' +
                        '  padding: 0 0 40px 0;"' +
                        '  >' +
                        '  <h1 style="' +
                        '     text-align: center;' +
                        '     font-size: 34px;' +
                        '     margin: 0;' +
                        '     color: #1E2661;' +
                        '     padding: 40px 0;"' +
                        '     >Congrats,<br> Boost mode is here!</h1>' +
                        '<p style="' +
                        '     text-align: center;' +
                        '     color: #6B7588;' +
                        '     font-size: 16px;' +
                        '     line-height: 31px;' +
                        '     margin: 0 0 50px 0;">' +
                        'Hi ' + userDetail.full_name + ',' +
                        'You have unlocked the BOOST feature on your account! <br> ' +
                        'Improve your chances to finding a match by boosting your <br>' +
                        'profile in front of everyone else’s for about 30 minutes.<br></p>' +
                        '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
                        'background-color: #00ADD6;' +
                        'color: #fff;' +
                        'font-weight: bold;' +
                        'text-decoration: none;' +
                        'font-size: 14px;' +
                        'display: inline-block;' +
                        'width: 100%;' +
                        'max-width: 288px;' +
                        'padding: 20px 0;">' +
                        ' Try your Boost </a>' +
                        '<p style="' +
                        'text-align: center;' +
                        'color: #6B7588;' +
                        'font-size: 16px;' +
                        'line-height: 31px;' +
                        'margin: 50px 0 30px 0;">' +
                        '</p>' +
                        '<p style="' +
                        'text-align: center;' +
                        'color: #6B7588;' +
                        'font-size: 16px;' +
                        'line-height: 31px;' +
                        'margin: 0;">' +
                        'Thanks for your time,<br>The enVest Team</p>' +
                        '</div>' +
                        '<div style="' +
                        'background-color: #00ADD6;' +
                        'text-align: center;' +
                        'padding: 50px 10px;">' +
                        '<p style="' +
                        'text-align: center;' +
                        'color: #ffffff;' +
                        'line-height: 25px;' +
                        'margin: 0;' +
                        'font-size: 14px;' +
                        'font-weight: 300;">' +
                        'Questions or concerns? <a href="#" style="' +
                        '  font-weight: 600;' +
                        'color: #fff;">' +
                        'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
                        '<ul class="footer-links" style="' +
                        '        list-style: none;' +
                        '        line-height: normal;' +
                        '        padding: 0;' +
                        '        margin: 40px 0;">' +
                        '   <li style="display: inline-block;margin: 0;">' +
                        '   <a style="' +
                        '        text-decoration: none;' +
                        '        color: #fff;' +
                        '        font-size: 14px;"' +
                        '   href="#">Privacy Policy</a></li>' +
                        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                        '        text-decoration: none;' +
                        '        color: #fff;' +
                        '        font-size: 14px;"' +
                        '   href="#">Get Help</a></li>' +
                        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                        '        text-decoration: none;' +
                        '        color: #fff;' +
                        '        font-size: 14px;"' +
                        '   href="' + config.server_url + ':' + config.port + '/api/user/unsubscribeEmail/' + userDetail._id + '">Unsubscribe</a></li>' +
                        '</ul>' +
                        '<ul class="footer-social" style="' +
                        '        list-style: none;' +
                        '        line-height: normal;' +
                        '        margin: 0 auto;' +
                        '        max-width: 660px;' +
                        '        width: 100%;' +
                        '        padding: 0;">' +
                        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
                        '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
                        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
                        '</ul>' +
                        '<p style="' +
                        'text-align: center;' +
                        'color: #ffffff;' +
                        'line-height: 25px;' +
                        'margin: 30px 0 0 0;' +
                        'font-size: 13px;' +
                        'font-weight: 300;">' +
                        '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
                        '</div>' +
                        '    </div>' +
                        '  </body>' +
                        '</html>';


                    sendMail(toMail, subject, htmlText);
                }
                res.status(200).json({
                    status: true,
                    message: 'Your Profile will be highlighted for the next 30 min.',
                    data: {
                        is_boost_used: userDetail.is_boost_used,
                        is_on_boost: userDetail.is_on_boost,
                        boost_start_time: userDetail.boost_start_time
                    }
                })
                return;
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'You are not valid business user!.'
            })
            return;
        }
    }
    catch (err) {
        console.log('3568 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
        return;
    }
}

exports.rewindSearch = async function (req, res, callback) {
    try {
        console.log('rewindSearch --->', req.body);

        const { user_id } = req.body;
        let undoneDetail;

        const userDetail = await UserModel.findById({ _id: user_id });
        if (userDetail != null && userDetail != '' && userDetail != undefined) {
            const userPastInterest = await UserInterestModel.findOne({ user_id: user_id }).sort({ createdAt: -1 })
            if (userPastInterest.intersted_status == 3) {
                await UserInterestModel.findOneAndUpdate({
                    user_id: userPastInterest.interestedUser_id,
                    interestedUser_id: userPastInterest.user_id
                }, {
                    $set: {
                        intersted_status: 1
                    }
                });
                undoneDetail = await UserInterestModel.findOneAndRemove({ user_id: user_id }).sort({ createdAt: -1 });
            }
            else {
                undoneDetail = await UserInterestModel.findOneAndRemove({ user_id: user_id }).sort({ createdAt: -1 });
            }
            if (undoneDetail != null) {
                const undoneUser = await UserModel.findById({ _id: undoneDetail.interestedUser_id });
                res.status(200).json({
                    status: true,
                    message: 'Last action undone!.',
                    undoneUser: undoneUser
                })
                return;
            }
            else {
                res.status(200).json({
                    status: true,
                    message: 'No last action found!.'
                })
                return;
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User not found!.'
            })
            return;
        }
    }
    catch (err) {
        console.log('3602 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
        return;
    }
}

exports.addNotifiacationData = async function (req, res, callback) {
    try {
        console.log('----->----- addNotifiacationData ---------> ', req.body);
        const {
            user_id,
            registrationToken,
            udid,
            platform
        } = req.body;

        const findExist = {
            registrationToken: registrationToken
        }

        const foundExist = await NotificationModel.findOne(findExist);
        if (foundExist !== null && foundExist !== '' && foundExist !== undefined) {
            await NotificationModel.findByIdAndUpdate({ _id: foundExist._id }, { $set: { user_id: user_id } });
        }
        else {
            const addNew = new NotificationModel({
                user_id: user_id,
                udid: udid,
                registrationToken: registrationToken,
                platform: platform
            })
            const newlyAdded = await addNew.save();
        }
        res.status(200).json({
            status: true,
            message: 'OK.'
        });
    }
    catch (err) {
        console.log('3645 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
    }
}

exports.addFeedback = async function (req, res) {
    try {
        console.log('----->----- addFeedback ---------> ', req.body);
        const { user_id, reason, sub_reason, message } = req.body;
        if (user_id.length > 0 && reason.length > 0 && message.length > 0) {
            const newFeedback = new FeedbackModel({
                user_id: user_id,
                reason: reason,
                sub_reason: sub_reason,
                message: message
            });
            const newFeedbackAdded = await newFeedback.save();
            res.status(200).json({
                status: true,
                message: "Feedback Added",
                data: newFeedbackAdded
            })
        }
        else {
            res.status(200).json({
                status: false,
                message: "Getting NULL, All fiels are required!",
            })
        }
    }
    catch (err) {
        console.log('3672 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: "Something went wrong.!",
            error: err.message
        })
    }
}

exports.unsubscribeEmail = async (req, res) => {
    try {
        console.log('----->----- unsubscribeEmail ---------> ', req.body);
        const { id } = req.params;
        console.log('unsubscribe user_id ----> ', id);
        await UserModel.findByIdAndUpdate({ _id: id }, { $set: { is_email_subscribed: false } });
        const htmlText = '<!DOCTYPE html>' +
            '<html>' +
            '  <head>' +
            '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
            '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

            '</head>' +
            '<body style=' +
            '  margin: 0;' +
            '  font-family: "Roboto", sans-serif;"' +
            '  background-color: #E5E5E5;' +
            '  >' +
            '  <div style=' +
            '     max-width: 800px;' +
            '     margin: 0 auto;' +
            '     background-color: #fff;' +
            '     width: 100%;' +
            '>' +
            '<div style="' +
            '  text-align: center;' +
            '  padding: 30px 0 30px 0;' +
            '  margin: 0 50px;' +
            '  border-bottom: 1px solid #BDBDBD;"' +
            '  >' +
            '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
            '      </div>' +
            '<div style="' +
            '  margin: 0 50px;' +
            '  text-align: center;' +
            '  padding: 0 0 40px 0;"' +
            '  >' +
            '<p style="' +
            '     text-align: center;' +
            '     color: #6B7588;' +
            '     font-size: 16px;' +
            '     line-height: 31px;' +
            '     margin: 0 0 50px 0;">' +
            'Unsubscribe sucessful. <br> You will no longer hear from us.<br></p>' +
            '<ul class="footer-social" style="' +
            '        list-style: none;' +
            '        line-height: normal;' +
            '        margin: 0 auto;' +
            '        max-width: 660px;' +
            '        width: 100%;' +
            '        padding: 0;">' +
            '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
            '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
            '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
            '</ul>' +
            '<p style="' +
            'text-align: center;' +
            'color: #ffffff;' +
            'line-height: 25px;' +
            'margin: 30px 0 0 0;' +
            'font-size: 13px;' +
            'font-weight: 300;">' +
            '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
            '</div>' +
            '    </div>' +
            '  </body>' +
            '</html>';

        res.send(htmlText);
    }
    catch (err) {
        console.log('3752 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong! Please try again.',
            error: err.message
        })
    }
}

exports.logout = async function (req, res, callback) {
    try {
        console.log('----->----- logout ---------> ', req.body);
        const { user_id } = req.body;
        await NotificationModel.updateMany({ user_id: user_id }, { $set: { user_id: null } })
            .then(() => {
                res.status(200).json({
                    status: true,
                    message: 'Successful logged out.'
                })
            });
    }
    catch (err) {
        console.log('3774 ----> err ---->', err);
        res.status(400).json({
            status: true,
            message: 'Something went wrong.',
            error: err.message
        })
    }
}

function diff_minutes(dt2, dt1) {
    let diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));
}

cron.schedule('*/1 * * * *', async () => {
    /* Running at every 1 min */
    // console.log('Running at every 1 min');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    let planDetail;

    // const premiumUsers = await UserModel.find({ is_premium_user: true });

    // premiumUsers.forEach(async (user) => {
    //     const userSubscription = await SubscriptionModel.findOne({ user_id: user._id });

    //     const planStartDays = diff_minutes(userSubscription.subscription_start_dateTime, new Date());

    //     if (userSubscription.will_cancel == true) {
    //         if (planStartDays === 2) {

    //             // send mail if plan is about to expire in 3 days.

    //             const notificationData = await NotificationModel.find({ user_id: user._id }, { registrationToken: 1, platform: 1 });

    //             notificationData.forEach(ele => {
    //                 if (ele.platform == 'android') {
    //                     const payload = {
    //                         notification: {
    //                             title: 'Careful, your monthly plan expires in 3 days!',
    //                             body: 'This is a Simple courtesy notification to remind you that your monthly plan will expire in the next three days.'
    //                         }
    //                     };
    //                     sendFCM(ele.registrationToken, payload)
    //                 }
    //                 else if (ele.platform == 'ios') {
    //                     let notification = new apn.Notification({
    //                         alert: {
    //                             title: 'Careful, your monthly plan expires in 3 days!',
    //                             body: 'This is a Simple courtesy notification to remind you that your monthly plan will expire in the next three days.'
    //                         },
    //                         topic: 'com.mbakop.binder',
    //                         payload: {
    //                             "sender": "node-apn",
    //                         },
    //                         pushType: 'background'
    //                     });
    //                     apnProvider.send(notification, ele.registrationToken);
    //                 }
    //             })

    //             if (user.is_email_subscribed) {
    //                 const toMail = user.email;
    //                 const subject = 'Careful, your monthly plan expires in 3 days!';

    //                 const htmlText = '<!DOCTYPE html>' +
    //                     '<html>' +
    //                     '  <head>' +
    //                     '    <title>Careful, your monthly plan<br> expires in 3 days!</title>' +
    //                     '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
    //                     '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

    //                     '</head>' +
    //                     '<body style=' +
    //                     '  margin: 0;' +
    //                     '  font-family: "Roboto", sans-serif;"' +
    //                     '  background-color: #E5E5E5;' +
    //                     '  >' +
    //                     '  <div style=' +
    //                     '     max-width: 800px;' +
    //                     '     margin: 0 auto;' +
    //                     '     background-color: #fff;' +
    //                     '     width: 100%;' +
    //                     '>' +
    //                     '<div style="' +
    //                     '  text-align: center;' +
    //                     '  padding: 30px 0 30px 0;' +
    //                     '  margin: 0 50px;' +
    //                     '  border-bottom: 1px solid #BDBDBD;"' +
    //                     '  >' +
    //                     '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
    //                     '      </div>' +
    //                     '<div style="' +
    //                     '  margin: 0 50px;' +
    //                     '  text-align: center;' +
    //                     '  padding: 0 0 40px 0;"' +
    //                     '  >' +
    //                     '  <h1 style="' +
    //                     '     text-align: center;' +
    //                     '     font-size: 34px;' +
    //                     '     margin: 0;' +
    //                     '     color: #1E2661;' +
    //                     '     padding: 40px 0;"' +
    //                     '     > Careful, your monthly plan<br> expires in 3 days!</h1>' +
    //                     '<p style="' +
    //                     '     text-align: center;' +
    //                     '     color: #6B7588;' +
    //                     '     font-size: 16px;' +
    //                     '     line-height: 31px;' +
    //                     '     margin: 0 0 50px 0;">' +
    //                     'Hi ' + user.full_name + ',<br> ' +
    //                     'This is a Simple courtesy email to remind you that<br>' +
    //                     'your monthly plan will expire in the next three days. <br></p>' +
    //                     '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
    //                     'background-color: #00ADD6;' +
    //                     'color: #fff;' +
    //                     'font-weight: bold;' +
    //                     'text-decoration: none;' +
    //                     'font-size: 14px;' +
    //                     'display: inline-block;' +
    //                     'width: 100%;' +
    //                     'max-width: 288px;' +
    //                     'padding: 20px 0;">' +
    //                     ' Review your monthly plan </a>' +
    //                     '<p style="' +
    //                     'text-align: center;' +
    //                     'color: #6B7588;' +
    //                     'font-size: 16px;' +
    //                     'line-height: 31px;' +
    //                     'margin: 50px 0 30px 0;">' +
    //                     '</p>' +
    //                     '<p style="' +
    //                     'text-align: center;' +
    //                     'color: #6B7588;' +
    //                     'font-size: 16px;' +
    //                     'line-height: 31px;' +
    //                     'margin: 0;">' +
    //                     'Thanks for your time,<br>The enVest Team</p>' +
    //                     '</div>' +
    //                     '<div style="' +
    //                     'background-color: #00ADD6;' +
    //                     'text-align: center;' +
    //                     'padding: 50px 10px;">' +
    //                     '<p style="' +
    //                     'text-align: center;' +
    //                     'color: #ffffff;' +
    //                     'line-height: 25px;' +
    //                     'margin: 0;' +
    //                     'font-size: 14px;' +
    //                     'font-weight: 300;">' +
    //                     'Questions or concerns? <a href="#" style="' +
    //                     '  font-weight: 600;' +
    //                     'color: #fff;">' +
    //                     'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
    //                     '<ul class="footer-links" style="' +
    //                     '        list-style: none;' +
    //                     '        line-height: normal;' +
    //                     '        padding: 0;' +
    //                     '        margin: 40px 0;">' +
    //                     '   <li style="display: inline-block;margin: 0;">' +
    //                     '   <a style="' +
    //                     '        text-decoration: none;' +
    //                     '        color: #fff;' +
    //                     '        font-size: 14px;"' +
    //                     '   href="#">Privacy Policy</a></li>' +
    //                     '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
    //                     '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
    //                     '        text-decoration: none;' +
    //                     '        color: #fff;' +
    //                     '        font-size: 14px;"' +
    //                     '   href="#">Get Help</a></li>' +
    //                     '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
    //                     '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
    //                     '        text-decoration: none;' +
    //                     '        color: #fff;' +
    //                     '        font-size: 14px;"' +
    //'   href="' + config.server_url + ':' + config.port + '/api/user/unsubscribeEmail/' + '6014f190fa925908378e8c74' + '">Unsubscribe</a></li>' +
    //                     '</ul>' +
    //                     '<ul class="footer-social" style="' +
    //                     '        list-style: none;' +
    //                     '        line-height: normal;' +
    //                     '        margin: 0 auto;' +
    //                     '        max-width: 660px;' +
    //                     '        width: 100%;' +
    //                     '        padding: 0;">' +
    //                     '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
    //                     '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
    //                     '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
    //                     '</ul>' +
    //                     '<p style="' +
    //                     'text-align: center;' +
    //                     'color: #ffffff;' +
    //                     'line-height: 25px;' +
    //                     'margin: 30px 0 0 0;' +
    //                     'font-size: 13px;' +
    //                     'font-weight: 300;">' +
    //                     '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
    //                     '</div>' +
    //                     '    </div>' +
    //                     '  </body>' +
    //                     '</html>';


    //                 sendMail(toMail, subject, htmlText);
    //             }
    //         }
    //         if (planStartDays == 5) {

    //             userSubscription.is_subscription_on = false;
    //             await userSubscription.save();
    //         }
    //     }
    //     if (Math.floor(planStartDays) === 5) {

    //         if (userSubscription.is_subscription_on == true) {
    //             if (userSubscription.next_subscribing_plan == null) {

    //                 planDetail = await getPlanDetail(userSubscription.current_subscribed_plan);
    //                 await SubscriptionModel.findByIdAndUpdate({
    //                     _id: userSubscription._id
    //                 }, {
    //                     $set: {
    //                         subscription_start_dateTime: new Date()
    //                     }
    //                 });
    //             }
    //             else if (userSubscription.next_subscribing_plan != null) {

    //                 planDetail = await getPlanDetail(userSubscription.next_subscribing_plan);
    //                 await SubscriptionModel.findByIdAndUpdate({
    //                     _id: userSubscription._id
    //                 }, {
    //                     $set: {
    //                         subscription_start_dateTime: new Date(),
    //                         previous_subscribed_plan: userSubscription.current_subscribed_plan,
    //                         previous_plan_start_dateTime: userSubscription.subscription_start_dateTime,
    //                         current_subscribed_plan: userSubscription.next_subscribing_plan,
    //                         next_subscribing_plan: null
    //                     }
    //                 });
    //             }

    //             const user_transaction = new UserTransactionModel({
    //                 user_id: user._id,
    //                 plan_id: planDetail._id,
    //                 // device_id: device_id,
    //                 payment_method: 'IAP-Subscription',
    //                 // payment_id: receipt_data,
    //                 transaction_amount: planDetail.plan_amount,
    //                 transaction_charge: 0,
    //                 payment_status: 'Success',
    //                 payment_dateTime: new Date()
    //             });
    //             const new_transaction = await user_transaction.save();

    //             await UserModel.findByIdAndUpdate({ _id: user._id }, { $set: { plan_id: planDetail._id } });

    //         }
    //         else {
    //             user.is_premium_user = false;
    //             user.plan_id = null;
    //             user.premium_plan_purchased_on = null;
    //             user.save().then(async (data) => {

    //                 const notificationData = await NotificationModel.find({ user_id: user._id }, { registrationToken: 1, platform: 1 });

    //                 notificationData.forEach(ele => {
    //                     if (ele.platform == 'android') {
    //                         const payload = {
    //                             notification: {
    //                                 title: 'Your monthly plan has ended!',
    //                                 body: 'Your monthly plan has expired. If this is an oversight, let’s get your ' +
    //                                     'monthly plan renewed right away and resume your investment hunt!'
    //                             }
    //                         };
    //                         sendFCM(ele.registrationToken, payload)
    //                     }
    //                     else if (ele.platform == 'ios') {
    //                         let notification = new apn.Notification({
    //                             alert: {
    //                                 title: 'Your monthly plan has ended!',
    //                                 body: 'Your monthly plan has expired. If this is an oversight, let’s get your ' +
    //                                     'monthly plan renewed right away and resume your investment hunt!'
    //                             },
    //                             topic: 'com.mbakop.binder',
    //                             payload: {
    //                                 "sender": "node-apn",
    //                             },
    //                             pushType: 'background'
    //                         });
    //                         apnProvider.send(notification, ele.registrationToken);
    //                     }
    //                 })

    //                 // send mail when plan expire.
    //                 if (data.is_email_subscribed) {
    //                     const toMail = data.email;
    //                     const subject = 'Your monthly plan has ended!';

    //                     const htmlText = '<!DOCTYPE html>' +
    //                         '<html>' +
    //                         '  <head>' +
    //                         '    <title>Your monthly plan has ended!</title>' +
    //                         '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
    //                         '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

    //                         '</head>' +
    //                         '<body style=' +
    //                         '  margin: 0;' +
    //                         '  font-family: "Roboto", sans-serif;"' +
    //                         '  background-color: #E5E5E5;' +
    //                         '  >' +
    //                         '  <div style=' +
    //                         '     max-width: 800px;' +
    //                         '     margin: 0 auto;' +
    //                         '     background-color: #fff;' +
    //                         '     width: 100%;' +
    //                         '>' +
    //                         '<div style="' +
    //                         '  text-align: center;' +
    //                         '  padding: 30px 0 30px 0;' +
    //                         '  margin: 0 50px;' +
    //                         '  border-bottom: 1px solid #BDBDBD;"' +
    //                         '  >' +
    //                         '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
    //                         '      </div>' +
    //                         '<div style="' +
    //                         '  margin: 0 50px;' +
    //                         '  text-align: center;' +
    //                         '  padding: 0 0 40px 0;"' +
    //                         '  >' +
    //                         '  <h1 style="' +
    //                         '     text-align: center;' +
    //                         '     font-size: 34px;' +
    //                         '     margin: 0;' +
    //                         '     color: #1E2661;' +
    //                         '     padding: 40px 0;"' +
    //                         '     > Your monthly plan has ended!</h1>' +
    //                         '<p style="' +
    //                         '     text-align: center;' +
    //                         '     color: #6B7588;' +
    //                         '     font-size: 16px;' +
    //                         '     line-height: 31px;' +
    //                         '     margin: 0 0 50px 0;">' +
    //                         'Hi ' + data.full_name + ',<br>' +
    //                         'Your monthly plan has expired. If this is an <br>' +
    //                         'oversight, let’s get your monthly plan renewed <br>' +
    //                         'right away and resume your investment hunt!<br></p>' +
    //                         '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
    //                         'background-color: #00ADD6;' +
    //                         'color: #fff;' +
    //                         'font-weight: bold;' +
    //                         'text-decoration: none;' +
    //                         'font-size: 14px;' +
    //                         'display: inline-block;' +
    //                         'width: 100%;' +
    //                         'max-width: 288px;' +
    //                         'padding: 20px 0;">' +
    //                         'Renew Now</a>' +
    //                         '<p style="' +
    //                         'text-align: center;' +
    //                         'color: #6B7588;' +
    //                         'font-size: 16px;' +
    //                         'line-height: 31px;' +
    //                         'margin: 50px 0 30px 0;">' +
    //                         '</p>' +
    //                         '<p style="' +
    //                         'text-align: center;' +
    //                         'color: #6B7588;' +
    //                         'font-size: 16px;' +
    //                         'line-height: 31px;' +
    //                         'margin: 0;">' +
    //                         'Thanks for your time,<br>The enVest Team</p>' +
    //                         '</div>' +
    //                         '<div style="' +
    //                         'background-color: #00ADD6;' +
    //                         'text-align: center;' +
    //                         'padding: 50px 10px;">' +
    //                         '<p style="' +
    //                         'text-align: center;' +
    //                         'color: #ffffff;' +
    //                         'line-height: 25px;' +
    //                         'margin: 0;' +
    //                         'font-size: 14px;' +
    //                         'font-weight: 300;">' +
    //                         'Questions or concerns? <a href="#" style="' +
    //                         '  font-weight: 600;' +
    //                         'color: #fff;">' +
    //                         'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
    //                         '<ul class="footer-links" style="' +
    //                         '        list-style: none;' +
    //                         '        line-height: normal;' +
    //                         '        padding: 0;' +
    //                         '        margin: 40px 0;">' +
    //                         '   <li style="display: inline-block;margin: 0;">' +
    //                         '   <a style="' +
    //                         '        text-decoration: none;' +
    //                         '        color: #fff;' +
    //                         '        font-size: 14px;"' +
    //                         '   href="#">Privacy Policy</a></li>' +
    //                         '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
    //                         '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
    //                         '        text-decoration: none;' +
    //                         '        color: #fff;' +
    //                         '        font-size: 14px;"' +
    //                         '   href="#">Get Help</a></li>' +
    //                         '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
    //                         '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
    //                         '        text-decoration: none;' +
    //                         '        color: #fff;' +
    //                         '        font-size: 14px;"' +
    //'   href="' + config.server_url + ':' + config.port + '/api/user/unsubscribeEmail/' + '6014f190fa925908378e8c74' + '">Unsubscribe</a></li>' +
    //                         '</ul>' +
    //                         '<ul class="footer-social" style="' +
    //                         '        list-style: none;' +
    //                         '        line-height: normal;' +
    //                         '        margin: 0 auto;' +
    //                         '        max-width: 660px;' +
    //                         '        width: 100%;' +
    //                         '        padding: 0;">' +
    //                         '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
    //                         '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
    //                         '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
    //                         '</ul>' +
    //                         '<p style="' +
    //                         'text-align: center;' +
    //                         'color: #ffffff;' +
    //                         'line-height: 25px;' +
    //                         'margin: 30px 0 0 0;' +
    //                         'font-size: 13px;' +
    //                         'font-weight: 300;">' +
    //                         '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
    //                         '</div>' +
    //                         '    </div>' +
    //                         '  </body>' +
    //                         '</html>';


    //                     sendMail(toMail, subject, htmlText);

    //                 }
    //             })
    //         }
    //     }
    //     // console.log('cron job gets done.')
    // })
    const boosted_user = await UserModel.find({ is_boost_used: true })
    boosted_user.forEach(async (data) => {
        const passedTime = diff_minutes(data.boost_start_time, new Date());
        if (passedTime > 30) {
            data.is_on_boost = false;
            data.save()
                .then(async () => {
                    const notificationData = await NotificationModel.find({ user_id: data._id }, { registrationToken: 1, platform: 1 });

                    notificationData.forEach(ele => {
                        if (ele.platform == 'android') {
                            const payload = {
                                notification: {
                                    title: 'Your BOOST expired',
                                    body: 'Your BOOST has just expired, we hope you took full advantage of this exposure.'
                                }
                            };
                            sendFCM(ele.registrationToken, payload)
                        }
                        else if (ele.platform == 'ios') {
                            let notification = new apn.Notification({
                                alert: {
                                    title: 'Your BOOST expired',
                                    body: 'Your BOOST has just expired, we hope you took full advantage of this exposure.'
                                },
                                topic: 'com.mbakop.binder',
                                payload: {
                                    "sender": "node-apn",
                                },
                                pushType: 'background'
                            });
                            apnProvider.send(notification, ele.registrationToken);
                        }
                    })
                });
        }
    });
})

// cron.schedule('* * * * *', async () => {
cron.schedule('1 */13 * * *', async () => {
    /* Running at every 13h */
    // console.log('Running at every 13 hr');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    let planDetail;

    const premiumUsers = await UserModel.find({ is_premium_user: true });

    premiumUsers.forEach(async (user) => {
        const userSubscription = await SubscriptionModel.findOne({ user_id: user._id });

        const planStartDays = diff_minutes(userSubscription.subscription_start_dateTime, new Date());

        if (userSubscription.will_cancel == true) {

            if (planStartDays === 2) {

                // send mail if plan is about to expire in 3 days.

                const notificationData = await NotificationModel.find({ user_id: user._id }, { registrationToken: 1, platform: 1 });

                notificationData.forEach(ele => {
                    if (ele.platform == 'android') {
                        const payload = {
                            notification: {
                                title: 'Careful, your monthly plan expires in 3 days!',
                                body: 'This is a Simple courtesy notification to remind you that your monthly plan will expire in the next three days.'
                            }
                        };
                        sendFCM(ele.registrationToken, payload)
                    }
                    else if (ele.platform == 'ios') {
                        let notification = new apn.Notification({
                            alert: {
                                title: 'Careful, your monthly plan expires in 3 days!',
                                body: 'This is a Simple courtesy notification to remind you that your monthly plan will expire in the next three days.'
                            },
                            topic: 'com.mbakop.binder',
                            payload: {
                                "sender": "node-apn",
                            },
                            pushType: 'background'
                        });
                        apnProvider.send(notification, ele.registrationToken);
                    }
                })
                if (user.is_email_subscribed) {
                    const toMail = user.email;
                    const subject = 'Careful, your monthly plan expires in 3 days!';

                    const htmlText = '<!DOCTYPE html>' +
                        '<html>' +
                        '  <head>' +
                        '    <title>Careful, your monthly plan<br> expires in 3 days!</title>' +
                        '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
                        '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

                        '</head>' +
                        '<body style=' +
                        '  margin: 0;' +
                        '  font-family: "Roboto", sans-serif;"' +
                        '  background-color: #E5E5E5;' +
                        '  >' +
                        '  <div style=' +
                        '     max-width: 800px;' +
                        '     margin: 0 auto;' +
                        '     background-color: #fff;' +
                        '     width: 100%;' +
                        '>' +
                        '<div style="' +
                        '  text-align: center;' +
                        '  padding: 30px 0 30px 0;' +
                        '  margin: 0 50px;' +
                        '  border-bottom: 1px solid #BDBDBD;"' +
                        '  >' +
                        '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
                        '      </div>' +
                        '<div style="' +
                        '  margin: 0 50px;' +
                        '  text-align: center;' +
                        '  padding: 0 0 40px 0;"' +
                        '  >' +
                        '  <h1 style="' +
                        '     text-align: center;' +
                        '     font-size: 34px;' +
                        '     margin: 0;' +
                        '     color: #1E2661;' +
                        '     padding: 40px 0;"' +
                        '     > Careful, your monthly plan<br> expires in 3 days!</h1>' +
                        '<p style="' +
                        '     text-align: center;' +
                        '     color: #6B7588;' +
                        '     font-size: 16px;' +
                        '     line-height: 31px;' +
                        '     margin: 0 0 50px 0;">' +
                        'Hi ' + user.full_name + ',<br> ' +
                        'This is a Simple courtesy email to remind you that<br>' +
                        'your monthly plan will expire in the next three days. <br></p>' +
                        '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
                        'background-color: #00ADD6;' +
                        'color: #fff;' +
                        'font-weight: bold;' +
                        'text-decoration: none;' +
                        'font-size: 14px;' +
                        'display: inline-block;' +
                        'width: 100%;' +
                        'max-width: 288px;' +
                        'padding: 20px 0;">' +
                        ' Review your monthly plan </a>' +
                        '<p style="' +
                        'text-align: center;' +
                        'color: #6B7588;' +
                        'font-size: 16px;' +
                        'line-height: 31px;' +
                        'margin: 50px 0 30px 0;">' +
                        '</p>' +
                        '<p style="' +
                        'text-align: center;' +
                        'color: #6B7588;' +
                        'font-size: 16px;' +
                        'line-height: 31px;' +
                        'margin: 0;">' +
                        'Thanks for your time,<br>The enVest Team</p>' +
                        '</div>' +
                        '<div style="' +
                        'background-color: #00ADD6;' +
                        'text-align: center;' +
                        'padding: 50px 10px;">' +
                        '<p style="' +
                        'text-align: center;' +
                        'color: #ffffff;' +
                        'line-height: 25px;' +
                        'margin: 0;' +
                        'font-size: 14px;' +
                        'font-weight: 300;">' +
                        'Questions or concerns? <a href="#" style="' +
                        '  font-weight: 600;' +
                        'color: #fff;">' +
                        'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
                        '<ul class="footer-links" style="' +
                        '        list-style: none;' +
                        '        line-height: normal;' +
                        '        padding: 0;' +
                        '        margin: 40px 0;">' +
                        '   <li style="display: inline-block;margin: 0;">' +
                        '   <a style="' +
                        '        text-decoration: none;' +
                        '        color: #fff;' +
                        '        font-size: 14px;"' +
                        '   href="#">Privacy Policy</a></li>' +
                        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                        '        text-decoration: none;' +
                        '        color: #fff;' +
                        '        font-size: 14px;"' +
                        '   href="#">Get Help</a></li>' +
                        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                        '        text-decoration: none;' +
                        '        color: #fff;' +
                        '        font-size: 14px;"' +
                        '   href="' + config.server_url + ':' + config.port + '/api/user/unsubscribeEmail/' + user._id + '">Unsubscribe</a></li>' +
                        '</ul>' +
                        '<ul class="footer-social" style="' +
                        '        list-style: none;' +
                        '        line-height: normal;' +
                        '        margin: 0 auto;' +
                        '        max-width: 660px;' +
                        '        width: 100%;' +
                        '        padding: 0;">' +
                        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
                        '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
                        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
                        '</ul>' +
                        '<p style="' +
                        'text-align: center;' +
                        'color: #ffffff;' +
                        'line-height: 25px;' +
                        'margin: 30px 0 0 0;' +
                        'font-size: 13px;' +
                        'font-weight: 300;">' +
                        '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
                        '</div>' +
                        '    </div>' +
                        '  </body>' +
                        '</html>';

                    sendMail(toMail, subject, htmlText);
                }
            }
            if (planStartDays == 5) {

                userSubscription.is_subscription_on = false;
                await userSubscription.save();
            }
        }
        if (Math.floor(planStartDays) === 5) {

            if (userSubscription.is_subscription_on == true) {
                if (userSubscription.next_subscribing_plan == null) {

                    planDetail = await getPlanDetail(userSubscription.current_subscribed_plan);
                    await SubscriptionModel.findByIdAndUpdate({
                        _id: userSubscription._id
                    }, {
                        $set: {
                            subscription_start_dateTime: new Date()
                        }
                    });
                }
                else if (userSubscription.next_subscribing_plan != null) {
                    planDetail = await getPlanDetail(userSubscription.next_subscribing_plan);
                    await SubscriptionModel.findByIdAndUpdate({
                        _id: userSubscription._id
                    }, {
                        $set: {
                            subscription_start_dateTime: new Date(),
                            previous_subscribed_plan: userSubscription.current_subscribed_plan,
                            previous_plan_start_dateTime: userSubscription.subscription_start_dateTime,
                            current_subscribed_plan: userSubscription.next_subscribing_plan,
                            next_subscribing_plan: null
                        }
                    });
                }

                const user_transaction = new UserTransactionModel({
                    user_id: user._id,
                    plan_id: planDetail._id,
                    // device_id: device_id,
                    payment_method: 'IAP-Subscription',
                    // payment_id: receipt_data,
                    transaction_amount: planDetail.plan_amount,
                    transaction_charge: 0,
                    payment_status: 'Success',
                    payment_dateTime: new Date()
                });
                const new_transaction = await user_transaction.save();

                await UserModel.findByIdAndUpdate({ _id: user._id }, { $set: { plan_id: planDetail._id } });

            }
            else {
                user.is_premium_user = false;
                user.plan_id = null;
                user.premium_plan_purchased_on = null;
                user.save().then(async (data) => {

                    const notificationData = await NotificationModel.find({ user_id: user._id }, { registrationToken: 1, platform: 1 });

                    notificationData.forEach(ele => {
                        if (ele.platform == 'android') {
                            const payload = {
                                notification: {
                                    title: 'Your monthly plan has ended!',
                                    body: 'Your monthly plan has expired. If this is an oversight, let’s get your ' +
                                        'monthly plan renewed right away and resume your investment hunt!'
                                }
                            };
                            sendFCM(ele.registrationToken, payload)
                        }
                        else if (ele.platform == 'ios') {
                            let notification = new apn.Notification({
                                alert: {
                                    title: 'Your monthly plan has ended!',
                                    body: 'Your monthly plan has expired. If this is an oversight, let’s get your ' +
                                        'monthly plan renewed right away and resume your investment hunt!'
                                },
                                topic: 'com.mbakop.binder',
                                payload: {
                                    "sender": "node-apn",
                                },
                                pushType: 'background'
                            });
                            apnProvider.send(notification, ele.registrationToken);
                        }
                    })

                    // send mail when plan expire.
                    if (data.is_email_subscribed) {
                        const toMail = data.email;
                        const subject = 'Your monthly plan has ended!';

                        const htmlText = '<!DOCTYPE html>' +
                            '<html>' +
                            '  <head>' +
                            '    <title>Your monthly plan has ended!</title>' +
                            '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
                            '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

                            '</head>' +
                            '<body style=' +
                            '  margin: 0;' +
                            '  font-family: "Roboto", sans-serif;"' +
                            '  background-color: #E5E5E5;' +
                            '  >' +
                            '  <div style=' +
                            '     max-width: 800px;' +
                            '     margin: 0 auto;' +
                            '     background-color: #fff;' +
                            '     width: 100%;' +
                            '>' +
                            '<div style="' +
                            '  text-align: center;' +
                            '  padding: 30px 0 30px 0;' +
                            '  margin: 0 50px;' +
                            '  border-bottom: 1px solid #BDBDBD;"' +
                            '  >' +
                            '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
                            '      </div>' +
                            '<div style="' +
                            '  margin: 0 50px;' +
                            '  text-align: center;' +
                            '  padding: 0 0 40px 0;"' +
                            '  >' +
                            '  <h1 style="' +
                            '     text-align: center;' +
                            '     font-size: 34px;' +
                            '     margin: 0;' +
                            '     color: #1E2661;' +
                            '     padding: 40px 0;"' +
                            '     > Your monthly plan has ended!</h1>' +
                            '<p style="' +
                            '     text-align: center;' +
                            '     color: #6B7588;' +
                            '     font-size: 16px;' +
                            '     line-height: 31px;' +
                            '     margin: 0 0 50px 0;">' +
                            'Hi ' + data.full_name + ',<br>' +
                            'Your monthly plan has expired. If this is an <br>' +
                            'oversight, let’s get your monthly plan renewed <br>' +
                            'right away and resume your investment hunt!<br></p>' +
                            '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
                            'background-color: #00ADD6;' +
                            'color: #fff;' +
                            'font-weight: bold;' +
                            'text-decoration: none;' +
                            'font-size: 14px;' +
                            'display: inline-block;' +
                            'width: 100%;' +
                            'max-width: 288px;' +
                            'padding: 20px 0;">' +
                            'Renew Now</a>' +
                            '<p style="' +
                            'text-align: center;' +
                            'color: #6B7588;' +
                            'font-size: 16px;' +
                            'line-height: 31px;' +
                            'margin: 50px 0 30px 0;">' +
                            '</p>' +
                            '<p style="' +
                            'text-align: center;' +
                            'color: #6B7588;' +
                            'font-size: 16px;' +
                            'line-height: 31px;' +
                            'margin: 0;">' +
                            'Thanks for your time,<br>The enVest Team</p>' +
                            '</div>' +
                            '<div style="' +
                            'background-color: #00ADD6;' +
                            'text-align: center;' +
                            'padding: 50px 10px;">' +
                            '<p style="' +
                            'text-align: center;' +
                            'color: #ffffff;' +
                            'line-height: 25px;' +
                            'margin: 0;' +
                            'font-size: 14px;' +
                            'font-weight: 300;">' +
                            'Questions or concerns? <a href="#" style="' +
                            '  font-weight: 600;' +
                            'color: #fff;">' +
                            'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
                            '<ul class="footer-links" style="' +
                            '        list-style: none;' +
                            '        line-height: normal;' +
                            '        padding: 0;' +
                            '        margin: 40px 0;">' +
                            '   <li style="display: inline-block;margin: 0;">' +
                            '   <a style="' +
                            '        text-decoration: none;' +
                            '        color: #fff;' +
                            '        font-size: 14px;"' +
                            '   href="#">Privacy Policy</a></li>' +
                            '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                            '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                            '        text-decoration: none;' +
                            '        color: #fff;' +
                            '        font-size: 14px;"' +
                            '   href="#">Get Help</a></li>' +
                            '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
                            '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
                            '        text-decoration: none;' +
                            '        color: #fff;' +
                            '        font-size: 14px;"' +
                            '   href="' + config.server_url + ':' + config.port + '/api/user/unsubscribeEmail/' + data._id + '">Unsubscribe</a></li>' +
                            '</ul>' +
                            '<ul class="footer-social" style="' +
                            '        list-style: none;' +
                            '        line-height: normal;' +
                            '        margin: 0 auto;' +
                            '        max-width: 660px;' +
                            '        width: 100%;' +
                            '        padding: 0;">' +
                            '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
                            '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
                            '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
                            '</ul>' +
                            '<p style="' +
                            'text-align: center;' +
                            'color: #ffffff;' +
                            'line-height: 25px;' +
                            'margin: 30px 0 0 0;' +
                            'font-size: 13px;' +
                            'font-weight: 300;">' +
                            '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
                            '</div>' +
                            '    </div>' +
                            '  </body>' +
                            '</html>';


                        sendMail(toMail, subject, htmlText);
                    }
                })
            }
        }
        // console.log('cron job gets done.')
    })
})

exports.filterUser = async (req, res) => {
    try {
        console.log('----->----- filterUser ---------> ', req.body);
        const { search_text, sort_key, sort_type } = req.body;

        let query_match = {};
        var query_all_users = [];
        const search_pattern = '.*(' + search_text + ').*';

        var query_search_text_condition = {};
        query_search_text_condition["$or"] = [];

        query_search_text_condition["$or"].push({
            "full_name": {
                $regex: search_pattern,
                $options: 'i'
            }
        });

        query_search_text_condition["$or"].push({
            "email": {
                $regex: search_pattern,
                $options: 'i'
            }
        });

        query_search_text_condition["$or"].push({
            "register_type": {
                $regex: search_pattern,
                $options: 'i'
            }
        });

        query_search_text_condition["$or"].push({
            "account_type": {
                $regex: search_pattern,
                $options: 'i'
            }
        });

        query_search_text_condition["$or"].push({
            "contact_number": {
                $regex: search_pattern,
                $options: 'i'
            }
        });

        query_search_text_condition["$or"].push({
            "investment_return": {
                $regex: search_pattern,
                $options: 'i'
            }
        });

        query_search_text_condition["$or"].push({
            "location": {
                $regex: search_pattern,
                $options: 'i'
            }
        });

        query_match_condition = {};
        query_match_condition["$and"] = [];
        query_match_condition["$and"].push(query_search_text_condition);

        query_match["$match"] = query_match_condition;
        query_all_users.push(query_match);

        var cur_tbl_user = await UserModel.aggregate(query_all_users).skip(parseInt(req.body.skip)).limit(parseInt(req.body.limit));

        if (sort_type) {

            if (parseInt(sort_type) == 1) {
                fastSort(cur_tbl_user).asc(sort_key);
            }
            else {
                fastSort(cur_tbl_user).desc(sort_key);
            }
        }
        else {
            fastSort(cur_tbl_user).asc(sort_key);
        }

        const totalData = await UserModel.aggregate(query_all_users);
        const countTotol = totalData.length;
        res.status(200).send({ status: true, data: cur_tbl_user, length: countTotol });
    }
    catch (err) {
        console.log('4783 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!, Please try again later.',
            error: err.message
        })
    }
}

exports.testFCM = async function (req, res) {
    const { registrationToken } = req.body;
    const payload = {
        notification: {
            title: "enVest",
            body: "enVest FCM Testing.",
            clickAction: 'URL to your app?'
        }
    };
    sendFCM(registrationToken, payload);
    res.send('ok');
}

exports.testAPN = async function (req, res) {
    const { registrationToken } = req.body;
    const payload = {
        notification: {
            title: "enVest",
            body: "enVest FCM Testing."
        }
    };
    sendFCM(registrationToken, payload);
    res.send('ok');
}

exports.testNoti = async function (req, res) {

    const { user_id } = req.body
    const notificationData = await NotificationModel.find({ user_id: user_id }, { registrationToken: 1, platform: 1 });

    notificationData.forEach(ele => {
        if (ele.platform == 'android') {
            const payload = {
                notification: {
                    title: "enVest FCM",
                    body: "enVest FCM Testing."
                }
            };
            sendFCM(ele.registrationToken, payload)
        }
        else if (ele.platform == 'ios') {
            let notification = new apn.Notification({
                alert: {
                    title: "enVest APN",
                    body: "enVest APN Testing."
                },
                topic: 'com.mbakop.binder',
                payload: {
                    "sender": "node-apn",
                },
                pushType: 'background'
            });
            apnProvider.send(notification, ele.registrationToken);
        }
    });
    res.send('OK');
}

exports.testEmail = async function (req, res) {

    const { email } = req.body;

    const subject = 'Test Email';
    const htmlText = '<!DOCTYPE html>' +
        '<html>' +
        '  <head>' +
        '    <title>Test Email</title>' +
        '   <link rel="preconnect" href="https://fonts.gstatic.com">' +
        '  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet">' +

        '</head>' +
        '<body style=' +
        '  margin: 0;' +
        '  font-family: "Roboto", sans-serif;"' +
        '  background-color: #E5E5E5;' +
        '  >' +
        '  <div style=' +
        '     max-width: 800px;' +
        '     margin: 0 auto;' +
        '     background-color: #fff;' +
        '     width: 100%;' +
        '>' +
        '<div style="' +
        '  text-align: center;' +
        '  padding: 30px 0 30px 0;' +
        '  margin: 0 50px;' +
        '  border-bottom: 1px solid #BDBDBD;"' +
        '  >' +
        '  <img style="width:155px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/LOGO.png"> ' +
        '      </div>' +
        '<div style="' +
        '  margin: 0 50px;' +
        '  text-align: center;' +
        '  padding: 0 0 40px 0;"' +
        '  >' +
        '  <h1 style="' +
        '     text-align: center;' +
        '     font-size: 34px;' +
        '     margin: 0;' +
        '     color: #1E2661;' +
        '     padding: 40px 0;"' +
        '     >Welcome to Envest</h1>' +
        '<p style="' +
        '     text-align: center;' +
        '     color: #6B7588;' +
        '     font-size: 16px;' +
        '     line-height: 31px;' +
        '     margin: 0 0 50px 0;">' +
        'This is the test email.<br></p>' +
        '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
        'background-color: #00ADD6;' +
        'color: #fff;' +
        'font-weight: bold;' +
        'text-decoration: none;' +
        'font-size: 14px;' +
        'display: inline-block;' +
        'width: 100%;' +
        'max-width: 288px;' +
        'padding: 20px 0;">' +
        ' Test deep link </a>' +
        '<p style="' +
        'text-align: center;' +
        'color: #6B7588;' +
        'font-size: 16px;' +
        'line-height: 31px;' +
        'margin: 50px 0 30px 0;">' +
        '</p>' +
        '<p style="' +
        'text-align: center;' +
        'color: #6B7588;' +
        'font-size: 16px;' +
        'line-height: 31px;' +
        'margin: 0;">' +
        'Thanks for your time,<br>The enVest Team</p>' +
        '</div>' +
        '<div style="' +
        'background-color: #00ADD6;' +
        'text-align: center;' +
        'padding: 50px 10px;">' +
        '<p style="' +
        'text-align: center;' +
        'color: #ffffff;' +
        'line-height: 25px;' +
        'margin: 0;' +
        'font-size: 14px;' +
        'font-weight: 300;">' +
        'Questions or concerns? <a href="#" style="' +
        '  font-weight: 600;' +
        'color: #fff;">' +
        'Contact us</a><br>Please don’t reply directly to this email—we won’t see your<br>message.</p>' +
        '<ul class="footer-links" style="' +
        '        list-style: none;' +
        '        line-height: normal;' +
        '        padding: 0;' +
        '        margin: 40px 0;">' +
        '   <li style="display: inline-block;margin: 0;">' +
        '   <a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="#">Privacy Policy</a></li>' +
        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="#">Get Help</a></li>' +
        '   <li style="display: inline-block;color: #fff;margin: 0 13px;">|</li>' +
        '   <li style="display: inline-block;position: relative;margin: 0;"><a style="' +
        '        text-decoration: none;' +
        '        color: #fff;' +
        '        font-size: 14px;"' +
        '   href="' + config.server_url + ':' + config.port + '/api/user/unsubscribeEmail/' + '6014f190fa925908378e8c74' + '">Unsubscribe</a></li>' +
        '</ul>' +
        '<ul class="footer-social" style="' +
        '        list-style: none;' +
        '        line-height: normal;' +
        '        margin: 0 auto;' +
        '        max-width: 660px;' +
        '        width: 100%;' +
        '        padding: 0;">' +
        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/instagram_icon.png"></a></li>' +
        '<li style="display: inline-block;margin: 0 25px;"<a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/facebook_icon.png"></a></li>' +
        '<li style="display: inline-block;margin: 0 25px;"><a style="font-size: 22px; color: #fff;" href="#"><img style="width: 20px;" src="' + config.server_url + ':' + config.port + '/uploads/systemUpload/linkedin_icon.png"></a></li>' +
        '</ul>' +
        '<p style="' +
        'text-align: center;' +
        'color: #ffffff;' +
        'line-height: 25px;' +
        'margin: 30px 0 0 0;' +
        'font-size: 13px;' +
        'font-weight: 300;">' +
        '© 2020 envest, Inc. All Rights Reserved.<br> </p>' +
        '</div>' +
        '    </div>' +
        '  </body>' +
        '</html>';

    const toMail = email;
    sendMail(toMail, subject, htmlText);

    res.send('SENT');

}