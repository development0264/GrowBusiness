const UserModel = require('../models/userModel');
const UserInterestModel = require('../models/userInterestModel');
const UserInvestmentModel = require('../models/userInvestmentModel');
const UserChatModel = require('../models/userChatModel');
const UserConversationModel = require('../models/userConversationModel');
const NotificationModel = require('../models/notificationDataModel');
const PlanModel = require('../models/planModel');
const _ = require('underscore');
var fastSort = require('fast-sort');
const fs = require('fs');
const sendFCM = require('../commonfunctions/FCM_notification');

const projection = {
    full_name: 1,
    profile_photo: 1,
    email: 1,
    profile_photo: 1,
    account_type: 1
}

async function getUserDetail(user_id) {
    try {
        const userDetail = await UserModel.findById({ _id: user_id })
        if (userDetail != null && userDetail != undefined && userDetail != '') {
            return userDetail;
        }
        else {
            return false;
        }
    }
    catch (err) {
        console.log('35 ----> err ---->', err);
        return err;
    }
}

exports.manageLastActiveStatus = async function (req, res, callback) {
    try {
        console.log('manageLastActiveStatus ----->', req.body);
        const { user_id, active_status } = req.body;
        // console.log('manageLastActiveStatus req.body ---->', req.body);
        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail != null && userDetail != '' && userDetail != undefined) {
            if (active_status == 1)  /* When user opens a Application */ {
                await UserChatModel.updateMany({ receiver_id: user_id }, { $set: { is_receiver_currently_active: true } });
            }
            else if (active_status == 2) /* When user closes the Application */ {
                await UserChatModel.updateMany({ receiver_id: user_id }, { $set: { is_receiver_currently_active: false, receiver_last_active: new Date() } });
            }
            res.status(200).json({
                status: true,
                message: 'OK'
            })
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User not found'
            })
        }
    }
    catch (err) {
        console.log('67 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!',
            error: err.message
        })
    }
}

exports.listChat = async function (req, res, callback) {
    try {
        console.log('listChat ----->', req.body);
        const { user_id } = req.body;
        let chatList = [];
        let sender_last_msg = {};
        let receiver_last_msg = {};

        let sender_last_chat_messages = [];
        let receiver_last_chat_messages = [];

        let foundChat;
        let chatMessage;

        let pendingIntroUserDetail;

        const userDetail = await UserModel.findById({ _id: user_id });
        if (userDetail != null && userDetail != '' && userDetail != undefined) {

            if (userDetail.account_type == 'Business') {
                const planDetail = await PlanModel.findById({ _id: userDetail.plan_id });
                if (planDetail.plan_name == 'Gold') {

                    const pendingIntro1 = await UserInterestModel.find({ user_id: user_id, is_chat_initiated: false, intersted_status: 3 });

                    const pendingIntro2 = await UserInterestModel.find({ interestedUser_id: user_id, is_chat_initiated: false, intersted_status: 3 });

                    let pendingIntro1UserIds = _.pluck(pendingIntro1, 'interestedUser_id');
                    const pendingIntro2UserIds = _.pluck(pendingIntro2, 'user_id');

                    pendingIntro1UserIds.push(...pendingIntro2UserIds);

                    pendingIntroUserDetail = await UserModel.find({ _id: { $in: pendingIntro1UserIds } });
                }
            }
            foundChat = await UserChatModel.find({ sender_id: user_id, is_chat_deleted: false, is_chat_archived: false });
            if (foundChat.length > 0) {
                let receiverID = _.pluck(foundChat, 'receiver_id');

                receiverID = receiverID.filter(function (element) {
                    return element !== 'undefined';
                });

                let receiverDetail = await UserModel.find({ _id: { $in: receiverID } }, projection);

                const sender_allowed_message_status = [0, 1, 2];

                chatMessage = await UserConversationModel.find({
                    sender_id: user_id,
                    receiver_id: { $in: receiverID },
                    message_status: { $in: sender_allowed_message_status }
                }).sort({ createdAt: -1 });

                if (chatMessage.length == 0) {
                    chatMessage = await UserConversationModel.find({
                        sender_id: { $in: receiverID },
                        receiver_id: user_id
                    }).sort({ createdAt: -1 });
                }

                const unread_messages_in_chats = await UserConversationModel.aggregate([
                    { $match: { sender_id: { $in: receiverID }, receiver_id: { $eq: user_id }, message_status: 1 } },
                    { $group: { _id: "$sender_id", count: { $sum: 1 } } }
                ])

                var sender_message_flags = [];
                for (let i = 0; i < chatMessage.length; i++) {
                    if (sender_message_flags[chatMessage[i].receiver_id]) continue;
                    sender_message_flags[chatMessage[i].receiver_id] = true;
                    sender_last_chat_messages.push(chatMessage[i]);
                }

                const receiver_allowed_message_status = [1, 2];

                const receiver_sent_conversation = await UserConversationModel.find({
                    sender_id: { $in: receiverID },
                    receiver_id: user_id,
                    message_status: { $in: receiver_allowed_message_status }
                }).sort({ createdAt: -1 });

                var receiver_message_flags = [];
                for (let i = 0; i < receiver_sent_conversation.length; i++) {
                    if (receiver_message_flags[receiver_sent_conversation[i].receiver_id]) continue;
                    receiver_message_flags[receiver_sent_conversation[i].receiver_id] = true;
                    receiver_last_chat_messages.push(receiver_sent_conversation[i]);
                }
                if (sender_last_chat_messages.length >= receiver_last_chat_messages.length) {
                    for (let i = 0; i < sender_last_chat_messages.length; i++) {
                        if (receiver_last_chat_messages.length > 0) {
                            for (let j = 0; j < receiver_last_chat_messages.length; j++) {
                                if (sender_last_chat_messages[i] && receiver_last_chat_messages[j]) {
                                    if (sender_last_chat_messages[i].receiver_id == receiver_last_chat_messages[j].sender_id) {
                                        if (sender_last_chat_messages[i].createdAt < receiver_last_chat_messages[j].createdAt) {
                                            sender_last_chat_messages[i] = receiver_last_chat_messages[j];
                                        }
                                        else {
                                            sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                        }
                                    }
                                    else {
                                        sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                    }
                                }
                                else {
                                    sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                }
                            }
                        }
                        else {
                            sender_last_chat_messages = sender_last_chat_messages;
                        }
                    }
                }
                else {
                    for (let i = 0; i < receiver_last_chat_messages.length; i++) {
                        if (sender_last_chat_messages.length > 0) {
                            for (let j = 0; j < sender_last_chat_messages.length; j++) {
                                if (sender_last_chat_messages[j] && receiver_last_chat_messages[i]) {
                                    if (receiver_last_chat_messages[i].receiver_id == sender_last_chat_messages[j].sender_id) {
                                        if (receiver_last_chat_messages[i].createdAt < sender_last_chat_messages[j].createdAt) {
                                            sender_last_chat_messages[i] = sender_last_chat_messages[j];
                                        }
                                        else {
                                            sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                        }
                                    }
                                    else {
                                        sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                    }
                                }
                                else {
                                    sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                }
                            }
                        }
                        else {
                            sender_last_chat_messages = receiver_last_chat_messages;
                        }
                    }
                }

                foundChat.forEach(chat => {
                    sender_last_chat_messages.forEach(message => {
                        if (chat.receiver_id == message.receiver_id) {
                            receiverDetail.forEach(receiver => {
                                if (chat.receiver_id == receiver._id) {
                                    let total_unread = 0;
                                    unread_messages_in_chats.forEach(element => {
                                        if (element._id == chat.receiver_id) {
                                            total_unread = element.count;
                                        }
                                    });
                                    if (message.message_deleted_by_user1 == user_id || message.message_deleted_by_user2 == user_id) {
                                        sender_last_msg.message = ' ';
                                        sender_last_msg.media = ' ';
                                    }
                                    else {
                                        if (message.message && message.media.length > 0) {
                                            sender_last_msg.message = message.message;
                                            sender_last_msg.media = message.media;
                                        }
                                        else if (message.message) {
                                            sender_last_msg.message = message.message;
                                        }
                                        else if (message.media.length > 0) {
                                            sender_last_msg.media = message.media;
                                        }
                                    }
                                    sender_last_msg.message_status = message.message_status;
                                    chatList.push({
                                        room_id: chat.room_id,
                                        sender_id: user_id,
                                        receiver_id: chat.receiver_id,
                                        sender_account_type: userDetail.account_type,
                                        receiver_account_type: receiver.account_type,
                                        full_name: receiver.full_name,
                                        profile_photo: receiver.profile_photo,
                                        is_receiver_currently_active: chat.is_receiver_currently_active,
                                        receiver_last_active: chat.receiver_last_active,
                                        last_message: sender_last_msg,
                                        last_message_dateTime: message.createdAt,
                                        total_unread_msg: total_unread,
                                        is_chat_archived: chat.is_chat_archived,
                                        is_receiver_block: chat.is_receiver_block,
                                        is_chat_deleted: chat.is_chat_deleted
                                    })
                                    sender_last_msg = {};
                                }
                            })
                        }
                        else if (chat.receiver_id == message.sender_id) {
                            receiverDetail.forEach(receiver => {
                                if (chat.receiver_id == receiver._id) {
                                    let total_unread = 0;
                                    unread_messages_in_chats.forEach(element => {
                                        if (element._id == chat.receiver_id) {
                                            total_unread = element.count;
                                        }
                                    });
                                    if (message.message_deleted_by_user1 == user_id || message.message_deleted_by_user2 == user_id) {
                                        sender_last_msg.message = ' ';
                                        sender_last_msg.media = ' ';
                                    }
                                    else {
                                        if (message.message && message.media.length > 0) {
                                            receiver_last_msg.message = message.message;
                                            receiver_last_msg.media = message.media;
                                        }
                                        else if (message.message) {
                                            receiver_last_msg.message = message.message;
                                        }
                                        else if (message.media.length > 0) {
                                            receiver_last_msg.media = message.media;
                                        }
                                    }
                                    receiver_last_msg.message_status = message.message_status;
                                    chatList.push({
                                        room_id: chat.room_id,
                                        sender_id: chat.receiver_id,
                                        receiver_id: user_id,
                                        sender_account_type: receiver.account_type,
                                        receiver_account_type: userDetail.account_type,
                                        full_name: receiver.full_name,
                                        profile_photo: receiver.profile_photo,
                                        is_receiver_currently_active: chat.is_receiver_currently_active,
                                        receiver_last_active: chat.receiver_last_active,
                                        last_message: receiver_last_msg,
                                        last_message_dateTime: message.createdAt,
                                        total_unread_msg: total_unread,
                                        is_chat_archived: chat.is_chat_archived,
                                        is_receiver_block: chat.is_receiver_block,
                                        is_chat_deleted: chat.is_chat_deleted
                                    })
                                    receiver_last_msg = {};
                                }
                            })
                        }
                    })
                })

                fastSort(chatList).desc([
                    u => u.last_message_dateTime
                ]);

                res.status(200).json({
                    status: true,
                    message: 'Chat found.',
                    user_account_type: userDetail.account_type,
                    data: chatList,
                    pendingIntro: pendingIntroUserDetail
                });
            }
            else {
                res.status(200).json({
                    status: false,
                    message: 'No chat found.',
                    data: pendingIntroUserDetail
                });
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User not found.',
            });
        }
    }
    catch (err) {
        console.log('343 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.listArchive = async (req, res, callback) => {
    try {
        console.log('listArchive ----->', req.body);
        const { user_id } = req.body;

        let chatList = [];
        let sender_last_msg = {};
        let receiver_last_msg = {};

        let sender_last_chat_messages = [];
        let receiver_last_chat_messages = [];

        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail != null && userDetail != '' && userDetail != undefined) {

            foundChat = await UserChatModel.find({ sender_id: user_id, is_chat_deleted: false, is_chat_archived: true });

            if (foundChat.length > 0) {
                let receiverID = _.pluck(foundChat, 'receiver_id');

                receiverID = receiverID.filter(function (element) {
                    return element !== 'undefined';
                });

                let receiverDetail = await UserModel.find({ _id: { $in: receiverID } }, projection);


                chatMessage = await UserConversationModel.find({
                    sender_id: user_id,
                    receiver_id: { $in: receiverID }
                }).sort({ createdAt: -1 });

                if (chatMessage.length == 0) {
                    chatMessage = await UserConversationModel.find({
                        sender_id: { $in: receiverID },
                        receiver_id: user_id
                    }).sort({ createdAt: -1 });
                }

                const unread_messages_in_chats = await UserConversationModel.aggregate([
                    { $match: { sender_id: { $in: receiverID }, receiver_id: { $eq: user_id }, message_status: 1 } },
                    { $group: { _id: "$sender_id", count: { $sum: 1 } } }
                ])

                var sender_message_flags = [];
                for (let i = 0; i < chatMessage.length; i++) {
                    if (sender_message_flags[chatMessage[i].receiver_id]) continue;
                    sender_message_flags[chatMessage[i].receiver_id] = true;
                    sender_last_chat_messages.push(chatMessage[i]);
                }
                const receiver_sent_conversation = await UserConversationModel.find({
                    sender_id: { $in: receiverID },
                    receiver_id: user_id
                }).sort({ createdAt: -1 });

                var receiver_message_flags = [];
                for (let i = 0; i < receiver_sent_conversation.length; i++) {
                    if (receiver_message_flags[receiver_sent_conversation[i].sender_id]) continue;
                    receiver_message_flags[receiver_sent_conversation[i].sender_id] = true;
                    receiver_last_chat_messages.push(receiver_sent_conversation[i]);
                }

                if (sender_last_chat_messages.length >= receiver_last_chat_messages.length) {
                    for (let i = 0; i < sender_last_chat_messages.length; i++) {
                        if (receiver_last_chat_messages.length > 0) {
                            for (let j = 0; j < receiver_last_chat_messages.length; j++) {
                                if (sender_last_chat_messages[i] && receiver_last_chat_messages[j]) {
                                    if (sender_last_chat_messages[i].receiver_id == receiver_last_chat_messages[j].sender_id) {
                                        if (sender_last_chat_messages[i].createdAt < receiver_last_chat_messages[j].createdAt) {
                                            sender_last_chat_messages[i] = receiver_last_chat_messages[j];
                                        }
                                        else {
                                            sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                        }
                                    }
                                    else {
                                        sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                    }
                                }
                                else {
                                    sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                }
                            }
                        }
                        else {
                            sender_last_chat_messages = sender_last_chat_messages;
                        }
                    }
                }
                else {
                    for (let i = 0; i < receiver_last_chat_messages.length; i++) {
                        if (sender_last_chat_messages.length > 0) {
                            for (let j = 0; j < sender_last_chat_messages.length; j++) {
                                if (sender_last_chat_messages[j] && receiver_last_chat_messages[i]) {
                                    if (receiver_last_chat_messages[i].receiver_id == sender_last_chat_messages[j].sender_id) {
                                        if (receiver_last_chat_messages[i].createdAt < sender_last_chat_messages[j].createdAt) {
                                            sender_last_chat_messages[i] = sender_last_chat_messages[j];
                                        }
                                        else {
                                            sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                        }
                                    }
                                    else {
                                        sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                    }
                                }
                                else {
                                    sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                }
                            }
                        }
                        else {
                            sender_last_chat_messages = receiver_last_chat_messages;
                        }

                    }
                }

                // console.log(' 229 sender_last_chat_messages ----> ', sender_last_chat_messages);

                foundChat.forEach(chat => {
                    sender_last_chat_messages.forEach(message => {
                        // console.log('256 message ----> ', message)
                        if (chat.receiver_id == message.receiver_id) {
                            receiverDetail.forEach(receiver => {
                                if (chat.receiver_id == receiver._id) {
                                    let total_unread = 0;
                                    unread_messages_in_chats.forEach(element => {
                                        if (element._id == chat.receiver_id) {
                                            total_unread = element.count;
                                        }
                                    });
                                    if (message.is_message_deleted) {
                                        sender_last_msg.message = ' ';
                                        sender_last_msg.media = ' ';
                                    }
                                    else {
                                        if (message.message && message.media.length > 0) {
                                            sender_last_msg.message = message.message;
                                            sender_last_msg.media = message.media;
                                        }
                                        else if (message.message) {
                                            sender_last_msg.message = message.message;
                                        }
                                        else if (message.media.length > 0) {
                                            sender_last_msg.media = message.media;
                                        }
                                    }
                                    sender_last_msg.message_status = message.message_status;
                                    chatList.push({
                                        room_id: chat.room_id,
                                        sender_id: user_id,
                                        receiver_id: chat.receiver_id,
                                        sender_account_type: userDetail.account_type,
                                        receiver_account_type: receiver.account_type,
                                        full_name: receiver.full_name,
                                        profile_photo: receiver.profile_photo,
                                        is_receiver_currently_active: chat.is_receiver_currently_active,
                                        receiver_last_active: chat.receiver_last_active,
                                        last_message: sender_last_msg,
                                        last_message_dateTime: message.createdAt,
                                        total_unread_msg: total_unread,
                                        is_chat_archived: chat.is_chat_archived,
                                        is_receiver_block: chat.is_receiver_block,
                                        is_chat_deleted: chat.is_chat_deleted
                                    })
                                    sender_last_msg = {};
                                }
                            })
                        }
                        else if (chat.receiver_id == message.sender_id) {
                            receiverDetail.forEach(receiver => {
                                if (chat.receiver_id == receiver._id) {
                                    let total_unread = 0;
                                    unread_messages_in_chats.forEach(element => {
                                        if (element._id == chat.receiver_id) {
                                            total_unread = element.count;
                                        }
                                    });
                                    if (message.is_message_deleted) {
                                        receiver_last_msg.message = ' ';
                                        receiver_last_msg.media = ' ';
                                    }
                                    else {
                                        if (message.message && message.media.length > 0) {
                                            receiver_last_msg.message = message.message;
                                            receiver_last_msg.media = message.media;
                                        }
                                        else if (message.message) {
                                            receiver_last_msg.message = message.message;
                                        }
                                        else if (message.media.length > 0) {
                                            receiver_last_msg.media = message.media;
                                        }
                                    }
                                    receiver_last_msg.message_status = message.message_status;
                                    chatList.push({
                                        room_id: chat.room_id,
                                        sender_id: chat.receiver_id,
                                        receiver_id: user_id,
                                        sender_account_type: receiver.account_type,
                                        receiver_account_type: userDetail.account_type,
                                        full_name: receiver.full_name,
                                        profile_photo: receiver.profile_photo,
                                        is_receiver_currently_active: chat.is_receiver_currently_active,
                                        receiver_last_active: chat.receiver_last_active,
                                        last_message: receiver_last_msg,
                                        last_message_dateTime: message.createdAt,
                                        total_unread_msg: total_unread,
                                        is_chat_archived: chat.is_chat_archived,
                                        is_receiver_block: chat.is_receiver_block,
                                        is_chat_deleted: chat.is_chat_deleted
                                    })
                                    receiver_last_msg = {};
                                }
                            })
                        }
                    })
                })

                // console.log('chatList ----> ', chatList);

                res.status(200).json({
                    status: true,
                    message: 'Chat found.',
                    user_account_type: userDetail.account_type,
                    data: chatList
                });
            }
            else {
                res.status(200).json({
                    status: false,
                    message: 'No chat found.'
                });
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User not found.',
            });
        }
    }
    catch (err) {
        console.log('596 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.listBlocked = async (req, res, callback) => {
    try {
        console.log('listBlocked ----->', req.body);
        const { user_id } = req.body;

        let chatList = [];
        let sender_last_msg = {};
        let receiver_last_msg = {};

        let sender_last_chat_messages = [];
        let receiver_last_chat_messages = [];

        const userDetail = await UserModel.findById({ _id: user_id });

        if (userDetail != null && userDetail != '' && userDetail != undefined) {

            foundChat = await UserChatModel.find({ sender_id: user_id, is_chat_deleted: false, is_receiver_block: true });

            if (foundChat.length > 0) {
                let receiverID = _.pluck(foundChat, 'receiver_id');

                receiverID = receiverID.filter(function (element) {
                    return element !== 'undefined';
                });

                let receiverDetail = await UserModel.find({ _id: { $in: receiverID } }, projection);


                chatMessage = await UserConversationModel.find({
                    sender_id: user_id,
                    receiver_id: { $in: receiverID }
                }).sort({ createdAt: -1 });

                if (chatMessage.length == 0) {
                    chatMessage = await UserConversationModel.find({
                        sender_id: { $in: receiverID },
                        receiver_id: user_id
                    }).sort({ createdAt: -1 });
                }

                const unread_messages_in_chats = await UserConversationModel.aggregate([
                    { $match: { sender_id: { $in: receiverID }, receiver_id: { $eq: user_id }, message_status: 1 } },
                    { $group: { _id: "$sender_id", count: { $sum: 1 } } }
                ])

                var sender_message_flags = [];
                for (let i = 0; i < chatMessage.length; i++) {
                    if (sender_message_flags[chatMessage[i].receiver_id]) continue;
                    sender_message_flags[chatMessage[i].receiver_id] = true;
                    sender_last_chat_messages.push(chatMessage[i]);
                }
                const receiver_sent_conversation = await UserConversationModel.find({
                    sender_id: { $in: receiverID },
                    receiver_id: user_id
                }).sort({ createdAt: -1 });

                var receiver_message_flags = [];
                for (let i = 0; i < receiver_sent_conversation.length; i++) {
                    if (receiver_message_flags[receiver_sent_conversation[i].sender_id]) continue;
                    receiver_message_flags[receiver_sent_conversation[i].sender_id] = true;
                    receiver_last_chat_messages.push(receiver_sent_conversation[i]);
                }

                if (sender_last_chat_messages.length >= receiver_last_chat_messages.length) {
                    for (let i = 0; i < sender_last_chat_messages.length; i++) {
                        if (receiver_last_chat_messages.length > 0) {
                            for (let j = 0; j < receiver_last_chat_messages.length; j++) {
                                if (sender_last_chat_messages[i] && receiver_last_chat_messages[j]) {
                                    if (sender_last_chat_messages[i].receiver_id == receiver_last_chat_messages[j].sender_id) {
                                        if (sender_last_chat_messages[i].createdAt < receiver_last_chat_messages[j].createdAt) {
                                            sender_last_chat_messages[i] = receiver_last_chat_messages[j];
                                        }
                                        else {
                                            sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                        }
                                    }
                                    else {
                                        sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                    }
                                }
                                else {
                                    sender_last_chat_messages[i] = sender_last_chat_messages[i];
                                }
                            }
                        }
                        else {
                            sender_last_chat_messages = sender_last_chat_messages;
                        }
                    }
                }
                else {
                    for (let i = 0; i < receiver_last_chat_messages.length; i++) {
                        if (sender_last_chat_messages.length > 0) {
                            for (let j = 0; j < sender_last_chat_messages.length; j++) {
                                if (sender_last_chat_messages[j] && receiver_last_chat_messages[i]) {
                                    if (receiver_last_chat_messages[i].receiver_id == sender_last_chat_messages[j].sender_id) {
                                        if (receiver_last_chat_messages[i].createdAt < sender_last_chat_messages[j].createdAt) {
                                            sender_last_chat_messages[i] = sender_last_chat_messages[j];
                                        }
                                        else {
                                            sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                        }
                                    }
                                    else {
                                        sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                    }
                                }
                                else {
                                    sender_last_chat_messages[i] = receiver_last_chat_messages[i];
                                }
                            }
                        }
                        else {
                            sender_last_chat_messages = receiver_last_chat_messages;
                        }

                    }
                }

                // console.log(' 229 sender_last_chat_messages ----> ', sender_last_chat_messages);

                foundChat.forEach(chat => {
                    sender_last_chat_messages.forEach(message => {
                        // console.log('256 message ----> ', message)
                        if (chat.receiver_id == message.receiver_id) {
                            receiverDetail.forEach(receiver => {
                                if (chat.receiver_id == receiver._id) {
                                    let total_unread = 0;
                                    unread_messages_in_chats.forEach(element => {
                                        if (element._id == chat.receiver_id) {
                                            total_unread = element.count;
                                        }
                                    });
                                    if (message.is_message_deleted) {
                                        sender_last_msg.message = ' ';
                                        sender_last_msg.media = ' ';
                                    }
                                    else {
                                        if (message.message && message.media.length > 0) {
                                            sender_last_msg.message = message.message;
                                            sender_last_msg.media = message.media;
                                        }
                                        else if (message.message) {
                                            sender_last_msg.message = message.message;
                                        }
                                        else if (message.media.length > 0) {
                                            sender_last_msg.media = message.media;
                                        }
                                    }
                                    sender_last_msg.message_status = message.message_status;
                                    chatList.push({
                                        room_id: chat.room_id,
                                        sender_id: user_id,
                                        receiver_id: chat.receiver_id,
                                        sender_account_type: userDetail.account_type,
                                        receiver_account_type: receiver.account_type,
                                        full_name: receiver.full_name,
                                        profile_photo: receiver.profile_photo,
                                        is_receiver_currently_active: chat.is_receiver_currently_active,
                                        receiver_last_active: chat.receiver_last_active,
                                        last_message: sender_last_msg,
                                        last_message_dateTime: message.createdAt,
                                        total_unread_msg: total_unread,
                                        is_chat_archived: chat.is_chat_archived,
                                        is_receiver_block: chat.is_receiver_block,
                                        is_chat_deleted: chat.is_chat_deleted
                                    })
                                    sender_last_msg = {};
                                }
                            })
                        }
                        else if (chat.receiver_id == message.sender_id) {
                            receiverDetail.forEach(receiver => {
                                if (chat.receiver_id == receiver._id) {
                                    let total_unread = 0;
                                    unread_messages_in_chats.forEach(element => {
                                        if (element._id == chat.receiver_id) {
                                            total_unread = element.count;
                                        }
                                    });
                                    if (message.is_message_deleted) {
                                        receiver_last_msg.message = ' ';
                                        receiver_last_msg.media = ' ';
                                    }
                                    else {
                                        if (message.message && message.media.length > 0) {
                                            receiver_last_msg.message = message.message;
                                            receiver_last_msg.media = message.media;
                                        }
                                        else if (message.message) {
                                            receiver_last_msg.message = message.message;
                                        }
                                        else if (message.media.length > 0) {
                                            receiver_last_msg.media = message.media;
                                        }
                                    }
                                    receiver_last_msg.message_status = message.message_status;
                                    chatList.push({
                                        room_id: chat.room_id,
                                        sender_id: chat.receiver_id,
                                        receiver_id: user_id,
                                        sender_account_type: receiver.account_type,
                                        receiver_account_type: userDetail.account_type,
                                        full_name: receiver.full_name,
                                        profile_photo: receiver.profile_photo,
                                        is_receiver_currently_active: chat.is_receiver_currently_active,
                                        receiver_last_active: chat.receiver_last_active,
                                        last_message: receiver_last_msg,
                                        last_message_dateTime: message.createdAt,
                                        total_unread_msg: total_unread,
                                        is_chat_archived: chat.is_chat_archived,
                                        is_receiver_block: chat.is_receiver_block,
                                        is_chat_deleted: chat.is_chat_deleted
                                    })
                                    receiver_last_msg = {};
                                }
                            })
                        }
                    })
                })

                // console.log('chatList ----> ', chatList);

                res.status(200).json({
                    status: true,
                    message: 'Chat found.',
                    user_account_type: userDetail.account_type,
                    data: chatList
                });
            }
            else {
                res.status(200).json({
                    status: false,
                    message: 'No chat found.'
                });
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'User not found.',
            });
        }
    }
    catch (err) {
        console.log('850 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.listConversation = async function (req, res, callback) {
    try {
        console.log('listConversation req.body ----> ', req.body);
        const { sender_id, receiver_id } = req.body;

        let final_conversation = [];
        let investmentDetails;
        let foundSenderConversation;
        let foundreceiverConversation;
        let chatDetail = [];
        const sender_allowed_message_status = [0, 1, 2];
        const receiver_allowed_message_status = [1, 2];

        const findSenderConversation = {
            sender_id: sender_id,
            receiver_id: receiver_id,
            message_status: { $in: sender_allowed_message_status }
        }
        const findReceiverConversation = {
            sender_id: receiver_id,
            receiver_id: sender_id,
            message_status: { $in: receiver_allowed_message_status }
        }

        let projection = {
            full_name: 1,
            profile_photo: 1,
            email: 1,
            account_type: 1,
            investment_endRange: 1,
            investment_startRange: 1,
            investment_return: 1,
            revenue: 1,
            location: 1,
            equity: 1,
            roi: 1,
            purchase_verification: 1,
            is_documents_verified: 1,
            contact_number: 1
        }

        const senderDetail = await UserModel.findById({ _id: sender_id }, projection);
        const receiverDetail = await UserModel.findById({ _id: receiver_id }, projection);
        if (receiverDetail.account_type == "Business") {
            investmentDetails = await UserInvestmentModel.find({ investor_user_id: sender_id, business_user_id: receiver_id }).sort({ createdAt: -1 }).limit(1);
        }
        else {
            investmentDetails = await UserInvestmentModel.find({ investor_user_id: receiver_id, business_user_id: sender_id }).sort({ createdAt: -1 }).limit(1);
        }

        const userChatData = await UserChatModel.findOne({ sender_id: sender_id, receiver_id: receiver_id });
        const receiverChat = await UserChatModel.findOne({ sender_id: receiver_id, receiver_id: sender_id });

        foundSenderConversation = await UserConversationModel.find(findSenderConversation)
            .sort({ createdAt: 1 });
        foundreceiverConversation = await UserConversationModel.find(findReceiverConversation)
            .sort({ createdAt: 1 });

        let media_type = null;
        let message_type = null;
        let type;

        foundSenderConversation.forEach(senderConver => {
            senderConver.media.forEach(fileName => {
                type = fileName.split('.').pop();
                if (type == 'jpg' || type == 'JPG' || type == 'jpeg' || type == 'JPEG' || type == 'png' || type == 'PNG') {
                    media_type = "image";
                }
                else {
                    media_type = "document";
                }
            })

            if (userChatData.sender_id == senderConver.sender_id
                && userChatData.receiver_id == senderConver.receiver_id
                && userChatData.is_receiver_block == true) {

                message_type = 'blocked';
            }
            else if (senderConver.receiver_id == sender_id && senderConver.message_status == 1) {
                message_type = 'new message'
            }
            else if (senderConver.receiver_id != sender_id && senderConver.message_status == 1) {
                message_type = 'text'
            }
            else if (senderConver.message_status == 2) {
                message_type = 'text'
            }

            final_conversation.push({
                _id: senderConver._id,
                message_type: message_type,
                message: senderConver.message,
                media: senderConver.media,
                media_type: media_type,
                message_status: senderConver.message_status,
                message_dateTime: senderConver.createdAt,
                sender_id: senderConver.sender_id,
                receiver_id: senderConver.receiver_id,
                is_message_deleted: senderConver.is_message_deleted,
                message_deleted_by_user1: senderConver.message_deleted_by_user1,
                message_deleted_by_user2: senderConver.message_deleted_by_user2,
            })
            media_type = null;
        })

        foundreceiverConversation.forEach(receiverConver => {
            receiverConver.media.forEach(fileName => {
                type = fileName.split('.').pop();
                if (type == 'jpg' || type == 'JPG' || type == 'jpeg' || type == 'JPEG' || type == 'png' || type == 'PNG') {
                    media_type = "image";
                }
                else {
                    media_type = "document";
                }
            })

            if (userChatData.receiver_id == receiverConver.sender_id
                && userChatData.sender_id == receiverConver.receiver_id
                && userChatData.is_receiver_block == true) {

                message_type = 'blocked';
            }

            else if (receiverConver.receiver_id == sender_id && receiverConver.message_status == 1) {
                message_type = 'new message'
            }
            else if (receiverConver.receiver_id != sender_id && receiverConver.message_status == 1) {
                message_type = 'text'
            }
            else if (receiverConver.message_status == 2) {
                message_type = 'text'
            }

            final_conversation.push({
                _id: receiverConver._id,
                message_type: message_type,
                message: receiverConver.message,
                media: receiverConver.media,
                media_type: media_type,
                message_status: receiverConver.message_status,
                message_dateTime: receiverConver.createdAt,
                sender_id: receiverConver.sender_id,
                receiver_id: receiverConver.receiver_id,
                is_message_deleted: receiverConver.is_message_deleted,
                message_deleted_by_user1: receiverConver.message_deleted_by_user1,
                message_deleted_by_user2: receiverConver.message_deleted_by_user2,
            })
            media_type = null;
        })
        final_conversation.sort((a, b) => (a.message_dateTime > b.message_dateTime) ? 1 : -1);

        var ret = _.reject(final_conversation, function (e) {
            if (e.message_deleted_by_user1 == sender_id || e.message_deleted_by_user2 == sender_id) {
                return e === e;
            }
        });

        final_conversation = ret;

        if (investmentDetails.length > 0) {
            investment_status = investmentDetails[0].is_investment_accepted;
        }
        else {
            investment_status = -1
        }
        if (investmentDetails.length > 0) {
            final_conversation.push({
                message_type: 'investment',
                investmentDetails
            })
        }

        chatDetail.push({
            is_receiver_currently_active: userChatData.is_receiver_currently_active,
            is_chat_deleted: userChatData.is_chat_deleted,
            is_chat_archived: userChatData.is_chat_archived,
            is_receiver_block: userChatData.is_receiver_block,
            room_id: userChatData.room_id,
            receiver_last_active: userChatData.receiver_last_active,
            has_receiver_blocked_you: receiverChat.is_receiver_block
        })

        res.status(200).json({
            status: true,
            message: 'User conversation.',
            senderDetail,
            receiverDetail,
            userChatData: chatDetail,
            investment_status,
            final_conversation
        });
    }
    catch (err) {
        console.log('1018 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.sendMessage = async function (req, res, callback) {
    try {
        console.log('sendMessage req.body ----> ', req.body);
        const { message, room_id, message_sent_by } = req.body;

        let sender_id;
        let receiver_id;
        let investmentDetails;

        room = room_id.split('_');
        if (message_sent_by == room[0]) {
            sender_id = room[0];
            receiver_id = room[1];
        }
        else if (message_sent_by == room[1]) {
            sender_id = room[1];
            receiver_id = room[0];
        }

        let media;
        let mediaFiles = [];
        let chatDetail = {};

        const senderDetail = await UserModel.findById({ _id: sender_id }, projection);
        const receiverDetail = await UserModel.findById({ _id: receiver_id }, projection);

        if (senderDetail != null
            && senderDetail != ''
            && senderDetail != undefined
            && senderDetail
            && receiverDetail != null
            && receiverDetail != ''
            && receiverDetail != undefined
            && receiverDetail) {

            if (receiverDetail.account_type == "Business") {
                investmentDetails = await UserInvestmentModel.find({ investor_user_id: senderDetail._id, business_user_id: receiverDetail._id, is_investment_accepted: 1 });
            }
            else {
                investmentDetails = await UserInvestmentModel.find({ investor_user_id: receiverDetail._id, business_user_id: senderDetail._id, is_investment_accepted: 1 });
            }

            if (investmentDetails.length == 0) {

                if (req.fileValidationError) {
                    res.status(200).json({
                        status: false,
                        message: req.fileValidationError
                    })
                    return;
                }
                try {
                    media = req.files;
                    media.forEach(file => {
                        const rootDir = file.destination.split("/")[1];
                        const parentDir = file.destination.split("/")[2];
                        const fileName = rootDir + '/' + parentDir + '/' + file.filename;
                        mediaFiles.push(fileName);
                    })

                    if (req.fileValidationError) {
                        mediaFiles.forEach(file => {
                            if (fs.existsSync(file))
                                fs.unlinkSync(file);
                        })

                        res.status(200).json({
                            status: false,
                            message: req.fileValidationError
                        })
                        return;
                    }

                }
                catch (err) { console.log('1101 ----> err ---->', err); }
                try {

                    const userChat = await UserChatModel.findOne({ sender_id: sender_id, receiver_id: receiver_id });

                    if (!userChat) {
                        const newChat = new UserChatModel({
                            room_id: room_id,
                            sender_id: sender_id,
                            receiver_id: receiver_id,
                            is_socket_on: true
                        })
                        user = await newChat.save();

                        const newReverseChat = new UserChatModel({
                            room_id: room_id,
                            sender_id: receiver_id,
                            receiver_id: sender_id,
                            is_socket_on: true
                        })
                        const reverseUser = await newReverseChat.save();

                    }
                    else {
                        await UserChatModel.findOneAndUpdate({ sender_id: sender_id, receiver_id: receiver_id }, { $set: { is_chat_deleted: false } });
                        await UserChatModel.findOneAndUpdate({ sender_id: receiver_id, receiver_id: sender_id }, { $set: { is_chat_deleted: false } });
                        user = await UserChatModel.findOne({ sender_id: sender_id, receiver_id: receiver_id });
                    }
                    chatDetail.is_chat_deleted = user.is_chat_deleted;
                    chatDetail.is_chat_archived = user.is_chat_archived;
                }
                catch (err) {
                    console.log('1133 ----> err ---->', err);
                    res.status(400).json({
                        status: false,
                        message: 'Something went wrong!.',
                        error: err.message
                    });
                }

                if (user.is_receiver_block == false) {

                    let status = 0;
                    const receiverSide = await UserChatModel.findOne({ sender_id: user.receiver_id, receiver_id: user.sender_id });
                    if (receiverSide.is_receiver_block) {
                        res.status(200).json({
                            status: false,
                            message: 'This user has blocked you!'
                        });
                        return
                    }
                    else {
                        const newConversation = new UserConversationModel({
                            sender_id: user.sender_id,
                            receiver_id: user.receiver_id,
                            message: message,
                            media: mediaFiles,
                            message_status: status,
                            message_status_update_dateTime: new Date()
                        });
                        const newConversationData = await newConversation.save();

                        // to update is_chat_initiated flag in userInterest model

                        await UserInterestModel.findOneAndUpdate({ user_id: user.sender_id, interestedUser_id: user.receiver_id }, { $set: { is_chat_initiated: true } });
                        await UserInterestModel.findOneAndUpdate({ user_id: user.receiver_id, interestedUser_id: user.sender_id }, { $set: { is_chat_initiated: true } });

                        const receiver_chat = await UserChatModel.findOne({ sender_id: user.receiver_id, receiver_id: user.sender_id });
                        if (receiver_chat != null && receiver_chat != '' && receiver_chat != undefined) {
                            if (receiver_chat.is_receiver_block == true) {
                                req.app.io.to(user.room_id).emit('is_blocked', { status: true, message: 'You are blocked by this user' });
                            }
                        }

                        const emitStatus = req.app.io.to(user.room_id).emit('sendMessage', newConversationData);

                        const userChatDetail = await UserChatModel.findOne({ sender_id: sender_id, receiver_id: receiver_id });

                        // send push notification if the receiver is currently not active on the app.
                        if (userChatDetail.is_receiver_currently_active == false) {
                            const userDetail = getUserDetail(sender_id);
                            const notificationData = await NotificationModel.find({ user_id: receiver_id }, { registrationToken: 1, platform: 1 });

                            notificationData.forEach(ele => {
                                if (ele.platform == 'android') {
                                    const payload = {
                                        notification: {
                                            title: userDetail.full_name,
                                            body: newConversationData.message + ' ' + newConversationData.media
                                        }
                                    };
                                    sendFCM(ele.registrationToken, payload)
                                }
                                else if (ele.platform == 'ios') {
                                    let notification = new apn.Notification({
                                        alert: {
                                            title: userDetail.full_name,
                                            body: newConversationData.message + ' ' + newConversationData.media
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
                        }

                        res.status(200).json({
                            status: true,
                            message: 'OK.',
                            data: {
                                senderDetail,
                                receiverDetail,
                                chatDetail,
                                newConversationData
                            }
                        });
                    }
                }
                else {
                    res.status(200).json({
                        status: false,
                        message: 'Unblock receiver to send message!.'
                    });
                }
            }
            else {
                res.status(200).json({
                    status: false,
                    message: 'You can not send messages anymore. Your investment is already done!.'
                });
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'No user found!.'
            });
        }
    }
    catch (err) {
        console.log('1233 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.checkUnread = async function (req, res, callback) {
    try {
        console.log('checkUnread ----->', req.body);
        const { user_id } = req.body;

        const user_unread_messages = await UserConversationModel.aggregate([
            { $match: { receiver_id: user_id, message_status: 1, is_message_deleted: false } },
            { $group: { _id: { sender_id: "$sender_id" }, count: { $sum: 1 } } }
        ])

        if (user_unread_messages.length > 0) {
            res.status(200).json({
                status: true,
                data: {
                    is_unread: true,
                    unread_chats: user_unread_messages.length
                }
            })
        }
        else {
            res.status(200).json({
                status: true,
                data: {
                    is_unread: false,
                    unread_chats: user_unread_messages.length
                }
            })
        }
    }
    catch (err) {
        console.log('1272 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        })
    }
}

exports.deleteMessage = async function (req, res, callback) {
    try {
        console.log('deleteMessage ----->', req.body);
        const { sender_id, receiver_id } = req.body;

        const findChat = {
            sender_id: sender_id,
            receiver_id: receiver_id,
        }

        const conversations = await UserConversationModel.find(findChat);

        if (conversations[conversations.length - 1].message_deleted_by_user1 == null || conversations[conversations.length - 1].message_deleted_by_user1 == sender_id) {
            await UserConversationModel.updateMany(
                findChat,
                { $set: { is_message_deleted: true, message_deleted_by_user1: sender_id } }
            );

            const findReceivedChat = {
                sender_id: receiver_id,
                receiver_id: sender_id,
            }
            await UserConversationModel.updateMany(
                findReceivedChat,
                { $set: { is_message_deleted: true, message_deleted_by_user1: sender_id } }
            );
        }
        else {
            await UserConversationModel.updateMany(
                findChat,
                { $set: { is_message_deleted: true, message_deleted_by_user2: sender_id } }
            );

            const findReceivedChat = {
                sender_id: receiver_id,
                receiver_id: sender_id,
            }
            await UserConversationModel.updateMany(
                findReceivedChat,
                { $set: { is_message_deleted: true, message_deleted_by_user2: sender_id } }
            );
        }

        res.status(200).json({
            status: true,
            message: 'Conversation Removed!.',
        });
    }
    catch (err) {
        console.log('1330 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.deleteChat = async function (req, res, callback) {
    try {

        console.log('delete Chat req.body ----> ', req.body);

        let { sender_id, receiver_id, user_id } = req.body;

        if (sender_id != user_id) {
            receiver_id = sender_id;
            sender_id = user_id;
        }

        const findChat = {
            sender_id: sender_id,
            receiver_id: receiver_id
        }

        const findReceivedChat = {
            sender_id: receiver_id,
            receiver_id: sender_id,
        }

        await UserChatModel.findOneAndUpdate(findChat, { $set: { is_chat_deleted: true } });

        const conversations = await UserConversationModel.find(findChat);

        if (conversations.length > 0) {
            if (conversations[conversations.length - 1].message_deleted_by_user1 == null || conversations[conversations.length - 1].message_deleted_by_user1 == sender_id) {
                await UserConversationModel.updateMany(
                    findChat,
                    { $set: { is_message_deleted: true, message_deleted_by_user1: sender_id } }
                );

                await UserConversationModel.updateMany(
                    findReceivedChat,
                    { $set: { is_message_deleted: true, message_deleted_by_user1: sender_id } }
                );
            }
            else {
                await UserConversationModel.updateMany(
                    findChat,
                    { $set: { is_message_deleted: true, message_deleted_by_user2: sender_id } }
                );

                await UserConversationModel.updateMany(
                    findReceivedChat,
                    { $set: { is_message_deleted: true, message_deleted_by_user2: sender_id } }
                );
            }
        }

        res.status(200).json({
            status: true,
            message: 'Chat Removed!.',
        });
    }
    catch (err) {
        console.log('1396 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.archiveChatToggle = async function (req, res, callback) {
    try {
        console.log('archiveChatToggle ----->', req.body);
        let { sender_id, receiver_id, user_id } = req.body;

        if (sender_id != user_id) {
            receiver_id = sender_id;
            sender_id = user_id;
        }

        const findChat = {
            sender_id: sender_id,
            receiver_id: receiver_id
        }

        const userChat = await UserChatModel.findOne(findChat);
        if (userChat != null && userChat != '' && userChat != undefined && userChat) {
            if (userChat.is_chat_archived == false) {
                await UserChatModel.findOneAndUpdate(findChat, { $set: { is_chat_archived: true } })
                res.status(200).json({
                    status: true,
                    message: 'Chat Archived!.',
                });
            }
            else if (userChat.is_chat_archived == true) {
                await UserChatModel.findOneAndUpdate(findChat, { $set: { is_chat_archived: false } })
                res.status(200).json({
                    status: true,
                    message: 'Chat Unarchived!.',
                });
            }
        }
        else {
            res.status(200).json({
                status: false,
                message: 'Users chat not found!.'
            });
        }
    }
    catch (err) {
        console.log('1445 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.blockUserToggle = async function (req, res, callback) {
    try {
        console.log('blockUserToggle ----->', req.body);
        let { sender_id, receiver_id, user_id } = req.body;

        if (sender_id != user_id) {
            receiver_id = sender_id;
            sender_id = user_id;
        }

        const findChat = {
            sender_id: sender_id,
            receiver_id: receiver_id
        }

        const userChat = await UserChatModel.findOne(findChat);
        if (userChat.is_receiver_block == false) {
            await UserChatModel.findOneAndUpdate(findChat, { $set: { is_receiver_block: true } })
            res.status(200).json({
                status: true,
                message: 'User Blocked!.',
            });
        }
        else if (userChat.is_receiver_block == true) {
            await UserChatModel.findOneAndUpdate(findChat, { $set: { is_receiver_block: false } })
            res.status(200).json({
                status: true,
                message: 'User Unlocked!.',
            });
        }
    }
    catch (err) {
        console.log('1486 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.downloadChatMedia = async function (req, res, callback) {
    try {

    }
    catch (err) {
        console.log('1500 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.getUserTyping = async (room_id) => {
    try {
        console.log('----->----- getUserTyping ---------> ', room_id);
        room = room_id.split('_');
        const sender_id = room[0];
        const receiver_id = room[1];

        const user = await UserChatModel.findOne({ sender_id: sender_id, receiver_id: receiver_id });

        return user.room_id;
    }
    catch (err) {
        console.log('1521 ----> err ---->', err);
        res.status(400).json({
            status: false,
            message: 'Something went wrong!.',
            error: err.message
        });
    }
}

exports.addUser = async ({ id, room_id }) => {
    console.log('add user req.body ---->', room_id);
    room = room_id.split('_');
    const sender_id = room[0];
    const receiver_id = room[1];
    let user;

    if (!room) {
        return { error: 'Room Id is required' };
    }

    if (sender_id != undefined && receiver_id != undefined) {
        const existingChat = await UserChatModel.findOne({ sender_id: sender_id, receiver_id: receiver_id });
        if (!existingChat) {
            const newChat = new UserChatModel({
                // socket_id: id,
                room_id: room_id,
                sender_id: sender_id,
                receiver_id: receiver_id,
                is_socket_on: true
            })
            user = await newChat.save();

            const roomID = receiver_id + '_' + sender_id;

            const newReverseChat = new UserChatModel({
                // socket_id: id,
                room_id: room_id,
                sender_id: receiver_id,
                receiver_id: sender_id,
                is_socket_on: true
            })
            const reverseUser = await newReverseChat.save();
        }
        else {
            await UserChatModel.updateMany({ sender_id: sender_id, receiver_id: receiver_id }, { $set: { socket_id: id } });
            user = await UserChatModel.findOne({ sender_id: sender_id, receiver_id: receiver_id });
        }
    }
    return user;
}

exports.removeUser = async (id) => {
    const user = await UserChatModel.findOneAndUpdate({ socket_id: id }, { $set: { socket_id: null } });
    return user;
}

exports.updateMessageDeliveryStatus = async (room_id, user_id, status) => {
    console.log('updateMessageDeliveryStatus room_id ---->', room_id);
    let room = room_id.split('_');
    let sender_id;
    let receiver_id;
    let updatedChat;
    let toBeUpdate;
    let toBeUpdateIds;
    let finalResponse = {};

    if (user_id == room[0]) {
        sender_id = room[0];
        receiver_id = room[1];
    }
    else if (user_id == room[1]) {
        sender_id = room[1];
        receiver_id = room[0];
    }

    const user_room = await UserChatModel.findOne({ sender_id: sender_id, receiver_id: receiver_id });

    if (status == 1) {
        toBeUpdate = await UserConversationModel.find({ sender_id: sender_id, receiver_id: receiver_id, message_status: 0 });
        toBeUpdateIds = _.pluck(toBeUpdate, '_id');
        await UserConversationModel.updateMany({ sender_id: sender_id, receiver_id: receiver_id, message_status: 0 }, { $set: { message_status: status, message_status_update_dateTime: new Date() } });
        updatedChat = await UserConversationModel.find({ _id: { $in: toBeUpdateIds } });
    }
    if (status == 2) {
        toBeUpdate = await UserConversationModel.find({ sender_id: receiver_id, receiver_id: sender_id, message_status: 1 });
        toBeUpdateIds = _.pluck(toBeUpdate, '_id');
        await UserConversationModel.updateMany({ sender_id: receiver_id, receiver_id: sender_id, message_status: 1 }, { $set: { message_status: status, message_status_update_dateTime: new Date() } });
        updatedChat = await UserConversationModel.find({ _id: { $in: toBeUpdateIds } });
    }

    finalResponse.updated = updatedChat;
    finalResponse.room = user_room.room_id;

    console.log('finalResponse ------> ', finalResponse)

    return finalResponse;
}