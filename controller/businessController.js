const UserModel = require('../models/userModel');
const UserInterestModel = require('../models/userInterestModel');
const UserInvestmentModel = require('../models/userInvestmentModel');
const NotificationModel = require('../models/notificationDataModel');
const _ = require('underscore');
const sendMail = require('../commonfunctions/sendMail');
const sendFCM = require('../commonfunctions/FCM_notification');
const config = require('../commonfunctions/config');

exports.listInterestedInBusiness = async function (req, res, callback) {
    try {
        console.log('----->----- listInterestedInBusiness ---------> ', req.body);
        const { user_id } = req.body;

        const foundInterested = await UserInterestModel.find({ interestedUser_id: user_id, intersted_status: 1 });
        const foundInterestedIds = _.pluck(foundInterested, 'user_id');

        const foundInterestedUser = await UserModel.find({ _id: { $in: foundInterestedIds } });

        if (foundInterestedUser.length > 0) {
            res.status(200).json({
                status: true,
                message: 'Interested User List',
                data: foundInterestedUser
            });
        }
        else {
            res.status(200).json({
                status: false,
                message: 'No Interested User found'
            });
        }
    }
    catch (err) {
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.manageApprovedInvesmentStatus = async function (req, res, callback) {
    try {
        console.log('manageApprovedInvesmentStatus ----> ', req.body);
        const { investment_id, status, user_id } = req.body;
        let investmentDetail;
        const userInvestment = await UserInvestmentModel.findById({ _id: investment_id });
        if (user_id == userInvestment.business_user_id) {
            console.log('51 line ----> ', userInvestment);
            if (userInvestment.is_investment_accepted == 0) {
                console.log('53 line');
                if (status == 1) {
                    console.log('55 line');
                    investmentDetail = await UserInvestmentModel.findByIdAndUpdate({ _id: investment_id }, { $set: { is_investment_accepted: status, accepted_dateTime: new Date() } });
                    const investorDetail = await UserModel.findById({ _id: investmentDetail.investor_user_id });
                    const businessDetail = await UserModel.findById({ _id: investmentDetail.business_user_id });

                    const notificationData = await NotificationModel.find({ user_id: investorDetail._id }, { registrationToken: 1, platform: 1 });

                    notificationData.forEach(ele => {
                        if (ele.platform == 'android') {
                            const payload = {
                                notification: {
                                    title: 'Congrats, ' + businessDetail.full_name + ' accepted your offer!',
                                    body: businessDetail.full_name + ' has accepted your investment terms. Login to' +
                                        'your account to see how to move forward efficiently!'
                                }
                            };
                            sendFCM(ele.registrationToken, payload)
                        }
                        else if (ele.platform == 'ios') {
                            let notification = new apn.Notification({
                                alert: {
                                    title: 'Congrats, ' + businessDetail.full_name + ' accepted your offer!',
                                    body: businessDetail.full_name + ' has accepted your investment terms. Login to' +
                                        'your account to see how to move forward efficiently!'
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

                    // TO investor to inform that the business has accepted your investment
                    const toMail = investorDetail.email;
                    const subject = ' Congrats, ' + businessDetail.full_name + ' has accepted your offer!';

                    const htmlText = '<!DOCTYPE html>' +
                        '<html>' +
                        '  <head>' +
                        '    <title> Congrats, ' + businessDetail.full_name + ' has accepted your offer!</title>' +
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
                        '     > Congrats, ' + businessDetail.full_name + ' has accepted your offer!</h1>' +
                        '<p style="' +
                        '     text-align: center;' +
                        '     color: #6B7588;' +
                        '     font-size: 16px;' +
                        '     line-height: 31px;' +
                        '     margin: 0 0 50px 0;">' +
                        'Hi ' + investorDetail.full_name + ',<br>' +
                        businessDetail.full_name + ' has accepted your investment<br>' +
                        'terms. Login to your account to see how to move<br>' +
                        'forward efficiently!<br></p>' +
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
                        ' See investment details ' +
                        '</a>' +
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


                    sendMail(toMail, subject, htmlText);
                    console.log('235 ---->');
                    // To business user to inform that you have accepted the investment.

                    const toMail1 = businessDetail.email;
                    const subject1 = 'Congrats, ' + investorDetail.full_name + ' is ready to invest!';

                    const htmlText1 = '<!DOCTYPE html>' +
                        '<html>' +
                        '  <head>' +
                        '    <title>Congrats, ' + investorDetail.full_name + ' is ready to invest!</title>' +
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
                        '     >Congrats, ' + investorDetail.full_name + ' is ready to invest!</h1>' +
                        '<p style="' +
                        '     text-align: center;' +
                        '     color: #6B7588;' +
                        '     font-size: 16px;' +
                        '     line-height: 31px;' +
                        '     margin: 0 0 50px 0;">' +
                        'Hi ' + businessDetail.full_name + ',<br> ' +
                        'Congrats, You have sucessfully accepted the Investment! <br></p>' +
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
                        ' Start Hunting </a>' +
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

                    sendMail(toMail1, subject1, htmlText1);
                    console.log('378 ---->');
                }
                else {
                    console.log('381 line');
                    investmentDetail = await UserInvestmentModel.findByIdAndUpdate({ _id: investment_id }, { $set: { is_investment_accepted: status } });
                }

                const updatedInvestmentDetail = await UserInvestmentModel.findByIdAndUpdate({ _id: investment_id });
                console.log('386 line');
                res.status(200).json({
                    status: true,
                    message: 'Investment Status updated',
                    data: updatedInvestmentDetail
                });
            }
            else {
                console.log('394 line');
                res.status(200).json({
                    status: true,
                    message: 'You have already reacted to this investment'
                });
                return;
            }
        }
        else {
            console.log('403 line');
            res.status(200).json({
                status: true,
                message: 'You are not authorized business user'
            });
            return;
        }
    }
    catch (err) {
        console.log('412 -----> err -----> ', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}