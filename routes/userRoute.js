const router = require('express').Router();
const verify = require('../commonfunctions/verifyToken');
const multer = require('multer');

const storageProfileImages = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/profileImages')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
});

const storageProfileMedia = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/profileMedia')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
});

const storageVerification = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/documents')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
});

const fileFilter = function (req, file, cb) {
    /* Accept images only */
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
        //req.fileValidationError = 'Only image files are allowed!';
        req.fileValidationError = 'Only image(jpg|JPG|jpeg|JPEG|png|PNG|) files are allowed!';
        //return cb(new Error('Only image(jpg|JPG|jpeg|JPEG|png|PNG|) files are allowed!'), false);
    }
    cb(null, true);
}

const docFileFilter = function (req, file, cb) {
    /* Accept documents only */
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|mp4|avi|pdf|PDF|doc|DOC|docx|DOCX|xls|XLS|csv|CSV)$/)) {
        //req.fileValidationError = 'Only image files are allowed!';
        req.fileValidationError = 'Only (jpg|JPG|jpeg|JPEG|png|PNG|mp4|avi|pdf|PDF|doc|DOC|docx|DOCX|xls|XLS|csv|CSV) files are allowed!';
        // return cb(new Error('Only image(jpg|JPG|jpeg|JPEG|png|PNG|) files are allowed!'), false);
    }
    cb(null, true);
}

const uploadVerif = multer({ storage: storageVerification, fileFilter: docFileFilter })
const uploadProfileImages = multer({ storage: storageProfileImages, fileFilter: fileFilter })
const uploadMediaImages = multer({ storage: storageProfileMedia, fileFilter: fileFilter })

const {
    getAllUser,
    getUserDetails,
    login,
    resendverificationMail,
    loginWithSocial,
    register,
    changePassword,
    sendToken,
    verifyToken,
    resetPassword,
    sendAccountVerificationCode,
    updateProfile,
    uploadMedia,


    uploadDocs,
    userPurchase,
    userVerificaitonPurchase,
    cancelSubscription,

    discoverUsers,
    getSingleUserDetail,
    userInterest,
    userNotInterstedIn,
    listMatch,
    listInvestment,
    boostUser,
    rewindSearch,

    addNotifiacationData,
    unsubscribeEmail,

    testFCM,
    testAPN,
    testNoti,
    testEmail,

    filterUser,
    // filterTag,

    addFeedback,
    logout

} = require('../controller/userController');

router.get('/users', getAllUser);
router.post('/getSingleUserDetail', verify, getSingleUserDetail);
router.post('/login', login);
router.post('/resendverificationMail', resendverificationMail);
router.post('/loginWithSocial', loginWithSocial);
router.post('/register', register);

router.post('/sendToken', sendToken);
router.post('/verifyToken', verifyToken);
router.post('/changePassword', verify, changePassword);
router.post('/resetPassword', resetPassword);
router.post('/userPurchase', verify, userPurchase);
router.post('/sendAccountVerificationCode', sendAccountVerificationCode);
router.post('/userVerificaitonPurchase', verify, userVerificaitonPurchase);
router.post('/cancelSubscription', verify, cancelSubscription);

router.post('/updateProfile', verify, uploadProfileImages.single('image'), updateProfile);
router.post('/uploadDocs', verify, uploadVerif.fields([{ name: 'DVL_front', maxCount: 1 }, { name: 'DVL_back', maxCount: 1 }, { name: 'Business_licence', maxCount: 1 }]), uploadDocs);
router.post('/uploadMedia', verify, uploadMediaImages.array('media', 9), uploadMedia);

router.post('/discoverUsers', verify, discoverUsers);
router.post('/userInterest', verify, userInterest);
router.post('/userNotInterstedIn', verify, userNotInterstedIn);
router.post('/listMatch', verify, listMatch);
router.post('/listInvestment', verify, listInvestment);

router.post('/boostUser', verify, boostUser);
router.post('/rewindSearch', verify, rewindSearch);

router.post('/addNotifiacationData', addNotifiacationData);
router.get('/unsubscribeEmail/:id', unsubscribeEmail);

router.post('/testFCM', testFCM);
router.post('/testAPN', testAPN);
router.post('/testNoti', testNoti);
router.post('/testEmail', testEmail);

router.post('/filterUser', verify, filterUser);
// router.get('/filterTag', verify, filterTag);

router.post('/addFeedback', verify, addFeedback);
router.post('/logout', verify, logout);

module.exports = router;