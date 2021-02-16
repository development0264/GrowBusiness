const NotificationModel = require('../models/notificationDataModel');
const UserModel = require('../models/userModel');
const UserInvestmentModel = require('../models/userInvestmentModel');
const sendMail = require('../commonfunctions/sendMail');
const sendFCM = require('../commonfunctions/FCM_notification');
const config = require('../commonfunctions/config');
const _ = require('underscore');

exports.userInvestment = async function (req, res, callback) {
    try {
        console.log('----->----- userInvestment ---------> ', req.body);
        const {
            investor_user_id,
            business_user_id,
            investment_amount,
            investment_return,
            roi,
            equity,
            revenue
        } = req.body;


        if (investor_user_id.length > 0 && business_user_id.length > 0 && investment_amount.length > 0 && investment_return.length > 0 && revenue.length > 0) {

            const investorDetail = await UserModel.findById({ _id: investor_user_id });
            const businessDetail = await UserModel.findById({ _id: business_user_id });

            if (_.isEmpty(investorDetail) || _.isEmpty(businessDetail)) {
                res.status(200).json({
                    status: false,
                    message: 'User not found!',
                });
                return;
            }
            else {

                const newInvestment = new UserInvestmentModel({
                    investor_user_id: investor_user_id,
                    business_user_id: business_user_id,
                    investment_amount: investment_amount,
                    investment_return: investment_return,
                    roi: roi,
                    equity: equity,
                    revenue: revenue,
                    is_investment_approved: true,
                    approved_dateTime: new Date(),
                    is_investment_accepted: 0
                })
                const investmentDetail = await newInvestment.save();

                const notificationData = await NotificationModel.find({ user_id: businessDetail._id }, { registrationToken: 1, platform: 1 });

                notificationData.forEach(ele => {
                    if (ele.platform == 'android') {
                        const payload = {
                            notification: {
                                title: 'Congrats, ' + investorDetail.full_name + ' is ready to invest!',
                                body: investorDetail.full_name + ' is ready to invest. Login to your account to see' +
                                    'his offer and seal the deal!'
                            }
                        };
                        sendFCM(ele.registrationToken, payload)
                    }
                    else if (ele.platform == 'ios') {
                        let notification = new apn.Notification({
                            alert: {
                                title: 'Congrats, ' + investorDetail.full_name + ' is ready to invest!',
                                body: investorDetail.full_name + ' is ready to invest. Login to your account to see' +
                                    'his offer and seal the deal!'
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

                const toMail = businessDetail.email;
                const subject = 'Congrats, ' + investorDetail.full_name + ' is ready to invest!';

                const htmlText = '<!DOCTYPE html>' +
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
                    investorDetail.full_name + ' is ready to invest. Login to your account to see<br> ' +
                    'his offer and seal the deal!<br></p>' +
                    '<div style="display: flex, justify-content: center"> ' +
                    '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
                    'background-color: #00ADD6;' +
                    'color: #fff;' +
                    'font-weight: bold;' +
                    'text-decoration: none;' +
                    'font-size: 14px;' +
                    'display: inline-block;' +
                    'width: 40%;' +
                    'margin: 5px;' +
                    'padding: 20px 0;">' +
                    ' Accept </a>' +
                    '<a href="' + config.server_url + ':' + config.port + '/api/deepLinkCheck/deepLinkChecker?app=envest&dest=" style="' +
                    'background-color: #00ADD6;' +
                    'color: #fff;' +
                    'font-weight: bold;' +
                    'margin: 5px;' +
                    'text-decoration: none;' +
                    'font-size: 14px;' +
                    'display: inline-block;' +
                    'width: 40%;' +
                    'padding: 20px 0;">' +
                    ' Reject </a>' +
                    '</div>' +
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

                res.status(200).json({
                    status: true,
                    message: 'Investment Details saved!.',
                    data: investmentDetail
                })
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'All field are required!',
            })
        }
    }
    catch (err) {
        res.status(400).json({
            status: false,
            message: 'Something went wrong!',
            error: err.message
        })
    }
}