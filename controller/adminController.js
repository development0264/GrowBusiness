const TagModel = require('../models/tagModel');
const PlanModel = require('../models/planModel');
const NotificationModel = require('../models/notificationDataModel');
const UserModel = require('../models/userModel');
const BoostModel = require('../models/boostModel');
const FeedbackModel = require('../models/userFeedbackModel');
const sendMail = require('../commonfunctions/sendMail');
const sendFCM = require('../commonfunctions/FCM_notification');
const config = require('../commonfunctions/config');
const _ = require('underscore');

function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
}

exports.listStaticData = async function (req, res, callback) {
    try {
        console.log('----->----- listStaticData ---------> ', req.body);
        let planList = [];
        let boostList = [];

        const plans = await PlanModel.find({});

        plans.forEach(plan => {
            var tit;
            if (plan.plan_name == 'Free') {
                tit = 'Free'
            }
            else {
                tit = 'Premium ' + plan.plan_name
            }
            planList.push({
                id: plan._id,
                plan_id: plan.plan_name.toLowerCase(),
                title: tit,
                amount: '$' + plan.plan_amount,
                description: [{
                    isInclude: plan.allow_likes_you,
                    title: "Likes You"
                },
                {
                    isInclude: true,
                    title: plan.match_limit + " Matches"
                },
                {
                    isInclude: true,
                    title: "1 Free Monthly Profile Boost"
                },
                {
                    isInclude: plan.allow_rewind,
                    title: "Rewind"
                },
                {
                    isInclude: plan.is_ad_free,
                    title: "Ad free swipe"
                },
                {
                    isInclude: plan.is_swipe_unlimited,
                    title: "Unlimited Right Swipes"
                }]
            })
        })

        const boosts = await BoostModel.find({});

        boosts.forEach(boost => {
            boostList.push({
                id: boost._id,
                boosts: boost.boosts,
                amount: boost.boost_amount,
                percentage_save: boost.percentage_save
            })
        })

        const investment_return = ['ROI', 'Percentage equity ( EQUITY )', 'Both'];
        const address_verification_document = ['DVL_front', 'DVL_back'];
        const register_type = ['email', 'google', 'apple', 'facebook'];
        const account_type = ['Business', 'Investor'];
        const active_status = [1, 2]; /* 1- open a app, 2- close a app */
        const message_type = ['new message', 'text', 'investment', 'blocked'];

        const help_form = [];
        help_form.push({
            'Account Related': {
                1: 'Purchase',
                2: 'Report Investor/Business',
                3: 'Close Account',
                4: 'Other'
            },
            'Verification': {
                1: 'Document Query',
                2: 'Verification failed',
                3: 'Business name change',
                4: 'Other'
            },
            'App Related': {
                1: 'Report a bug',
                2: 'Other'
            },
        })

        const media_type = [
            'image',
            'document'
        ];

        return res.status(200).json({
            status: true,
            message: 'OK',
            data: {
                register_type,
                account_type,
                planList,
                boostList,
                investment_return,
                address_verification_document,
                help_form,
                media_type,
                message_type
            }
        })
    }
    catch (err) {
        return res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.addtag = async function (req, res, callback) {
    try {
        console.log('----->----- addtag ---------> ', req.body);
        const { tag } = req.body;

        let foundTag = await TagModel.findOne({ tag: titleCase(tag) });

        if (!foundTag) {
            const newTag = new TagModel({
                tag: titleCase(tag)
            });
            foundTag = await newTag.save();
            res.status(200).send({ status: true, message: 'Tag added!.', data: foundTag });
        }
        else {
            res.status(200).send({ status: true, message: 'Tag already exist!.', data: foundTag });
        }
    }
    catch (err) {
        res.status(400).send({ status: false, message: 'Something went wrong!.', error: err.message });
    }
}

exports.listtags = async function (req, res, callback) {
    console.log('----->----- listtags ---------> ', req.body);
    const tag = await TagModel.find({}, { tag: 1 });
    res.status(200).json({ status: true, tag: tag });
}

exports.editTag = async function (req, res, callback) {
    try {
        const { tag_id, tag } = req.body;
        const preUpdate = await TagModel.findById({ _id: tag_id });

        const userHavingTags = await UserModel.find({ tags: { $all: [preUpdate.tag] } });

        userHavingTags.forEach(async (elem) => {
            for (let i = 0; i < elem.tags.length; i++) {
                if (elem.tags[i] == preUpdate.tag) {
                    elem.tags[i] = titleCase(tag);
                }
            }
            await UserModel.findByIdAndUpdate({ _id: elem._id }, { $set: { tags: elem.tags } });
        })

        await TagModel.findByIdAndUpdate({ _id: tag_id }, { $set: { tag: titleCase(tag) } });
        const foundTag = await TagModel.findById({ _id: tag_id });
        res.status(200).send({ status: true, message: 'Tag updated!.', data: foundTag });
    }
    catch (err) {
        res.status(400).json({
            status: false,
            message: 'Something wet wrong',
            error: err.message
        })
    }
}

exports.addPlan = async function (req, res, callback) {
    try {
        const {
            plan_name,
            description,
            plan_amount,
            is_swipe_unlimited,
            swipe_limit,
            match_limit,
            montly_free_boost_limit,
            is_ad_free,
            allow_likes_you,
            allow_rewind
        } = req.body;
        let foundPlan = await PlanModel.findOne({ plan_name: titleCase(plan_name) });

        if (!foundPlan) {
            const newPlan = new PlanModel({
                plan_name: titleCase(plan_name),
                description: description,
                plan_amount: plan_amount,
                is_swipe_unlimited: is_swipe_unlimited,
                swipe_limit: swipe_limit,
                match_limit: match_limit,
                montly_free_boost_limit: montly_free_boost_limit,
                is_ad_free: is_ad_free,
                allow_likes_you: allow_likes_you,
                allow_rewind: allow_rewind
            });
            const newlyAddedPlan = await newPlan.save();
            res.status(200).send({
                status: true,
                message: 'Plan added!.',
                data: newlyAddedPlan
            });
        }
        else {
            res.status(200).send({
                status: true,
                message: 'Plan already exist!.',
                data: foundPlan
            });
        }
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.listPlans = async function (req, res, callback) {
    try {
        const foundPlan = await PlanModel.find({});

        if (foundPlan.length > 0) {
            res.status(200).send({
                status: true,
                message: 'Plan List!.',
                data: foundPlan
            });
        }
        else {
            res.status(200).send({
                status: false,
                message: 'No plans found!.',
            });
        }
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.addBoost = async function (req, res, callback) {
    try {
        const {
            boost_amount,
            boosts,
            percentage_save
        } = req.body;

        let foundBoost = await BoostModel.findOne({ boosts: boosts });

        if (!foundBoost) {
            const newBoost = new BoostModel({
                boost_amount: boost_amount,
                boosts: boosts,
                percentage_save: percentage_save
            });
            const newlyAddedBoost = await newBoost.save();
            res.status(200).send({
                status: true,
                message: 'Boost added!.',
                data: newlyAddedBoost
            });
        }
        else {
            res.status(200).send({
                status: true,
                message: 'Boost already exist!.',
                data: foundBoost
            });
        }
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.listBoosts = async function (req, res, callback) {
    try {
        const foundBoost = await BoostModel.find({});

        if (foundBoost.length > 0) {
            res.status(200).send({
                status: true,
                message: 'Boost List!.',
                data: foundBoost
            });
        }
        else {
            res.status(200).send({
                status: false,
                message: 'No boost found!.'
            });
        }
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: 'Something went wrong!',
            error: err.message
        });
    }
}

exports.listDocuments = async function (req, res, callback) {
    try {
        const users = await UserModel.find({});
        let pendingDocumets = [];
        let documents = [];
        const start = parseInt(req.body.start);
        const length = parseInt(req.body.length);
        let temp = 0;
        users.forEach(user => {
            if (user.is_business_verified != null && user.is_business_verified != '' && user.is_business_verified != undefined) {
                if (user.is_business_verified.status == 0) {
                    pendingDocumets.push({
                        user_id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        profile_photo: user.profile_photo,
                        is_business_verified: user.is_business_verified,
                    })
                }
            }
            if (user.is_address_verified != null && user.is_address_verified != '' && user.is_address_verified != undefined) {
                if (user.is_address_verified.status == 0) {
                    pendingDocumets.push({
                        user_id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        profile_photo: user.profile_photo,
                        is_address_verified: user.is_address_verified
                    })
                }
            }
        })
        pendingDocumets.forEach(data => {
            if (temp < start) {
                temp++;
            }
            else {
                if (temp < length) {
                    documents.push(data);
                    temp++;
                }
            }
        })
        if (documents.length > 0) {
            res.status(200).json({
                status: true,
                data: documents,
                length: documents.length

            })
            return;
        }
        else {
            res.status(200).json({
                status: false,
                message: 'No records found!.',
                data: documents,
                length: 0
            })
            return;
        }
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
        return;
    }
}

exports.verifyDoc = async function (req, res, callback) {
    try {
        const { user_id, status, doc_type, comment } = req.body;

        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail && userDetail != null && userDetail != '' && userDetail != undefined) {
            if (doc_type == 'is_business_verified') {
                const updateWith = {
                    files: userDetail.is_business_verified.files,
                    uploadedOn: userDetail.is_business_verified.uploadedOn,
                    status: status,
                    admin_comment: comment
                }
                await UserModel.findByIdAndUpdate({ _id: user_id }, { $set: { is_business_verified: updateWith } });
            }
            if (doc_type == 'is_address_verified') {
                const updateWith = {
                    files: userDetail.is_address_verified.files,
                    uploadedOn: userDetail.is_address_verified.uploadedOn,
                    status: status,
                    admin_comment: comment
                }
                await UserModel.findByIdAndUpdate({ _id: user_id }, { $set: { is_address_verified: updateWith } });
            }

            const userProfile = await UserModel.findById({ _id: user_id });

            if (status == 1) {
                const notificationData = await NotificationModel.find({ user_id: userProfile._id }, { registrationToken: 1, platform: 1 });

                notificationData.forEach(ele => {
                    if (ele.platform == 'android') {
                        const payload = {
                            notification: {
                                title: 'Congratulations, your verification was successful!',
                                body: 'Yay! Your documents were processed and you have been verified. ' +
                                    'Enjoy that new shiny badge, you quite literally deserved it!'
                            }
                        };
                        sendFCM(ele.registrationToken, payload)
                    }
                    else if (ele.platform == 'ios') {
                        let notification = new apn.Notification({
                            alert: {
                                title: 'Congratulations, your verification was successful!',
                                body: 'Yay! Your documents were processed and you have been verified. ' +
                                    'Enjoy that new shiny badge, you quite literally deserved it!'
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
                const toMail = userProfile.email;
                const subject = 'Congratulations, your verification was successful!';

                const htmlText = '<!DOCTYPE html>' +
                    '<html>' +
                    '  <head>' +
                    '    <title> Congratulations, your verification was successful!</title>' +
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
                    '     > Congratulations,<br> your verification was successful!</h1>' +
                    '<p style="' +
                    '     text-align: center;' +
                    '     color: #6B7588;' +
                    '     font-size: 16px;' +
                    '     line-height: 31px;' +
                    '     margin: 0 0 50px 0;">' +
                    'Hi ' + userProfile.full_name + ',<br>' +
                    'Yay! Your documents were processed and you<br>' +
                    'have been verified. Enjoy that new shiny badge,<br>' +
                    'you quite literally deserved it! <br></p>' +
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
                    ' View your badge </a>' +
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
                    '© 2020 envest, Inc. All Rights Reserved.<br></p>' +
                    '</div>' +
                    '    </div>' +
                    '  </body>' +
                    '</html>';


                sendMail(toMail, subject, htmlText);
                res.send({ message: 'Account Verified', userProfile });
            }
            else if (status == 2) {

                const notificationData = await NotificationModel.find({ user_id: userProfile._id }, { registrationToken: 1, platform: 1 });

                notificationData.forEach(ele => {
                    if (ele.platform == 'android') {
                        const payload = {
                            notification: {
                                title: 'Sorry, seems there was a problem verifying you!',
                                body: 'There was a problem verifying one or more of your uploaded ' +
                                    'documents. Please re-upload the required documents to resume the ' +
                                    'verification process! '
                            }
                        };
                        sendFCM(ele.registrationToken, payload)
                    }
                    else if (ele.platform == 'ios') {
                        let notification = new apn.Notification({
                            alert: {
                                title: 'Sorry, seems there was a problem verifying you!',
                                body: 'There was a problem verifying one or more of your uploaded ' +
                                    'documents. Please re-upload the required documents to resume the ' +
                                    'verification process! '
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

                const toMail = userProfile.email;
                const subject = 'Sorry, seems there was a problem verifying you!';

                const htmlText = '<!DOCTYPE html>' +
                    '<html>' +
                    '  <head>' +
                    '    <title>Sorry, seems there was a problem verifying you!</title>' +
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
                    '     >Sorry, seems there was a problem verifying you!</h1>' +
                    '<p style="' +
                    '     text-align: center;' +
                    '     color: #6B7588;' +
                    '     font-size: 16px;' +
                    '     line-height: 31px;' +
                    '     margin: 0 0 50px 0;">' +
                    'Hi ' + userProfile.full_name + ',<br> ' +
                    'There was a problem verifying one or more of your<br>' +
                    'uploaded documents. Please re-upload the required<br>' +
                    'documents to resume the verification process! <br></p>' +
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
                    ' Upload Documents </a>' +
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
                res.send({ message: 'Account Rejected', userProfile });
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'No user found!.'
            })
        }
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
        return;
    }
}

exports.listFeedbacks = async function (req, res) {
    try {
        const totalData = await FeedbackModel.countDocuments();
        const feedbacks = await FeedbackModel.find().skip(parseInt(req.body.start)).limit(parseInt(req.body.length)).sort({ createdAt: -1 });

        const user_ids = _.pluck(feedbacks, 'user_id');
        const userDetails = await UserModel.find({ _id: { $in: user_ids } });

        let user_feedbacks = [];

        feedbacks.forEach(feedback => {
            userDetails.forEach(user => {
                if (feedback.user_id == user._id) {
                    user_feedbacks.push({
                        feedback_id: feedback._id,
                        userDetail: {
                            user_id: user._id,
                            account_type: user.account_type,
                            full_name: user.full_name,
                            email: user.email,
                            contact_number: user.contact_number,
                            profile_photo: user.profile_photo
                        },
                        reason: feedback.reason,
                        sub_reason: feedback.sub_reason,
                        message: feedback.message,
                        createdAt: feedback.createdAt
                    })
                }
            })
        })
        res.status(200).send({ status: true, message: "list feedbacks", data: user_feedbacks, length: totalData });
    }
    catch (err) {
        res.status(400).send({ status: false, message: "something went wrong!", error: err.message });
    }
}

exports.filterTag = async (req, res) => {

    const totalData = await TagModel.countDocuments();
    //console.log(totalData);
    await TagModel.find().skip(parseInt(req.body.start)).limit(parseInt(req.body.length)).sort({ createdAt: -1 })
        .then(tags => {
            res.status(200).send({ status: true, data: tags, length: totalData });
        })
}

exports.getSingleTag = async (req, res) => {
    //console.log(req.params.id);
    TagModel.findById(req.params.id)
        .then(user => res.status(200).json({ status: true, data: user }))
        .catch(err => res.status(401).json({ status: false, Error: + err }))
};

exports.updateTag = async (req, res) => {
    const tag = req.body.tag;
    const id = req.body.id;
    await TagModel.findOneAndUpdate({ _id: id },
        {
            $set: {
                tag: titleCase(tag)
            }
        });
    res.status(200).json({ status: true, message: 'Tag updated' });
};

exports.deleteTag = async (req, res) => {
    TagModel.deleteOne({ _id: req.params.id })
        .then(tag => {
            res.json(tag)
        })
        .catch(err => res.status(400).json('Error: ' + err));
};

exports.filterPlan = async (req, res) => {

    const totalData = await PlanModel.find({ plan_name: { $ne: 'Verification' } }).countDocuments();
    //console.log(totalData);
    await PlanModel.find({ plan_name: { $ne: 'Verification' } }).skip(parseInt(req.body.start)).limit(parseInt(req.body.length)).sort({ createdAt: -1 })
        .then(tags => {
            res.status(200).send({ status: true, data: tags, length: totalData });
        })
}

exports.getSinglePlan = async (req, res) => {
    //console.log(req.params.id);
    PlanModel.findById(req.params.id)
        .then(user => res.status(200).json({ status: true, data: user }))
        .catch(err => res.status(401).json({ status: false, Error: + err }))
};

exports.updatePlan = async (req, res) => {
    const {
        plan_name,
        description,
        plan_amount,
        is_swipe_unlimited,
        swipe_limit,
        match_limit,
        montly_free_boost_limit,
        is_ad_free,
        allow_likes_you,
        allow_rewind,
        id
    } = req.body;
    await PlanModel.findOneAndUpdate({ _id: id },
        {
            $set: {
                plan_name: titleCase(plan_name),
                description: description,
                plan_amount: plan_amount,
                is_swipe_unlimited: is_swipe_unlimited,
                swipe_limit: swipe_limit,
                match_limit: match_limit,
                montly_free_boost_limit: montly_free_boost_limit,
                is_ad_free: is_ad_free,
                allow_likes_you: allow_likes_you,
                allow_rewind: allow_rewind
            }
        });
    res.status(200).json({ status: true, message: 'Plan updated' });
};

exports.deletePlan = async (req, res) => {
    PlanModel.deleteOne({ _id: req.params.id })
        .then(plan => {
            res.json(plan)
        })
        .catch(err => res.status(400).json('Error: ' + err));
};

exports.filterVerification = async (req, res) => {

    const totalData = await PlanModel.find({ plan_name: 'Verification' }).countDocuments();
    //console.log(totalData);
    await PlanModel.find({ plan_name: 'Verification' }).skip(parseInt(req.body.start)).limit(parseInt(req.body.length)).sort({ createdAt: -1 })
        .then(tags => {
            res.status(200).send({ status: true, data: tags, length: totalData });
        })
}

exports.addVerification = async function (req, res, callback) {
    try {
        const {
            plan_name,
            description,
            plan_amount,
        } = req.body;
        let foundPlan = await PlanModel.findOne({ plan_name: titleCase(plan_name) });
        // console.log(is_ad_free);
        if (!foundPlan) {
            const newPlan = new PlanModel({
                plan_name: titleCase(plan_name),
                description: description,
                plan_amount: plan_amount
            });
            const newlyAddedPlan = await newPlan.save();
            res.status(200).send({
                status: true,
                message: 'Plan added!.',
                data: newlyAddedPlan
            });
        }
        else {
            res.status(200).send({
                status: true,
                message: 'Plan already exist!.',
                data: foundPlan
            });
        }
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.updateVerification = async (req, res) => {
    const {
        plan_name,
        description,
        plan_amount,
        id
    } = req.body;
    await PlanModel.findOneAndUpdate({ _id: id },
        {
            $set: {
                plan_name: titleCase(plan_name),
                description: description,
                plan_amount: plan_amount
            }
        });
    res.status(200).json({ status: true, message: 'Verification updated' });
};

exports.getSingleVerification = async (req, res) => {
    //console.log(req.params.id);
    PlanModel.findById(req.params.id)
        .then(user => res.status(200).json({ status: true, data: user }))
        .catch(err => res.status(401).json({ status: false, Error: + err }))
};

exports.filterBoost = async (req, res) => {

    const totalData = await BoostModel.countDocuments();
    //console.log(totalData);
    await BoostModel.find().skip(parseInt(req.body.start)).limit(parseInt(req.body.length)).sort({ createdAt: -1 })
        .then(boosts => {
            res.status(200).send({ status: true, data: boosts, length: totalData });
        })
}

exports.getSingleBoost = async (req, res) => {
    //console.log(req.params.id);
    BoostModel.findById(req.params.id)
        .then(user => res.status(200).json({ status: true, data: user }))
        .catch(err => res.status(401).json({ status: false, Error: + err }))
};

exports.updateBoost = async (req, res) => {
    const {
        boost_amount,
        boosts,
        percentage_save,
        id
    } = req.body;
    await BoostModel.findOneAndUpdate({ _id: id },
        {
            $set: {
                boost_amount: boost_amount,
                boosts: boosts,
                percentage_save: percentage_save
            }
        });
    res.status(200).json({ status: true, message: 'Boost updated' });
};

exports.deleteBoost = async (req, res) => {
    BoostModel.deleteOne({ _id: req.params.id })
        .then(boost => {
            res.json(boost)
        })
        .catch(err => res.status(400).json('Error: ' + err));
};

exports.getSingleDocument = async (req, res) => {
    let id = req.params.id.split('_');
    let finduser = {};
    finduser._id = id[0];
    let projection = {};
    if (id[1] == 'Business') {
        projection = {
            full_name: 1,
            email: 1,
            is_business_verified: 1
        }
    }
    else {
        projection = {
            full_name: 1,
            email: 1,
            is_address_verified: 1
        }
    }
    UserModel.find({ _id: id[0] }, projection)
        .then(user => res.status(200).json({ status: true, data: user }))
        .catch(err => res.status(401).json({ status: false, Error: + err }))
};

async function getPlanDetail(plan_id) {
    const planDetail = await PlanModel.findById({ _id: plan_id });
    return planDetail;
}

exports.getStats = async (req, res) => {
    try {

        let pendingDocCount = 0;
        let goldCount = 0;
        let plusCount = 0;
        let freeCount = 0;

        const userDetail = await UserModel.find();
        userDetail.forEach(async (user) => {
            if (user.is_business_verified != null && user.is_business_verified != '' && user.is_business_verified != undefined) {
                if (user.is_business_verified.status == 0) {
                    pendingDocCount++;
                }
            }
            if (user.is_address_verified != null && user.is_address_verified != '' && user.is_address_verified != undefined) {
                if (user.is_address_verified.status == 0) {
                    pendingDocCount++;
                }
            }

            const planDetail = await getPlanDetail(user.plan_id);

            if (planDetail.plan_name == 'Gold') {
                goldCount++;
            }
            else if (planDetail.plan_name == 'Plus') {
                plusCount++;
            }
            else if (planDetail.plan_name == 'Free') {
                freeCount++;
            }
        })

        const totalUser = await UserModel.find({ account_type: { $ne: 'admin' } }).countDocuments();
        const totalPlan = await PlanModel.find().countDocuments();
        const totalBoost = await BoostModel.find().countDocuments();
        const totolInvestmentAccepted = await UserInvestmentModel.find({ is_investment_accepted: 1 }).countDocuments();
        const totolInvestmentRejected = await UserInvestmentModel.find({ is_investment_accepted: 2 }).countDocuments();
        const totolInvestmentPending = await UserInvestmentModel.find({ is_investment_accepted: 0 }).countDocuments();
        const totolPendingDocument = pendingDocCount;
        const totalGoldenPlanUser = goldCount;
        const totalPlusPlanUser = plusCount;
        const totalFreePlanUser = freeCount;
        const totalVerifiedUser = await UserModel.find({ purchase_verification: true }).countDocuments();


        res.status(200).json({
            status: true,
            totalUser,
            totalPlan,
            totalBoost,
            totolInvestmentAccepted,
            totolInvestmentRejected,
            totolInvestmentPending,
            totolPendingDocument,
            totalGoldenPlanUser,
            totalPlusPlanUser,
            totalFreePlanUser,
            totalVerifiedUser
        })

    }
    catch (err) {
        console.log('err ----> ', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong.',
            error: err.message,
        })
    }
}