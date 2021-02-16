const router = require('express').Router();
const verify = require('../commonfunctions/verifyToken');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/chatMedia')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
});

const fileFilter = function (req, file, cb) {
    /* Accept images only */
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|doc|DOC|docx|DOCX|xls|XLS|xlsx|XLSX|pdf|PDF|txt|TXT|csv|CSV)$/)) {
        //req.fileValidationError = 'Only image files are allowed!';
        req.fileValidationError = 'Only image and doc (jpg|JPG|jpeg|JPEG|png|PNG|doc|DOC|docx|DOCX|xls|XLS|xlsx|XLSX|pdf|PDF|txt|TXT|csv|CSV) files are allowed!';
        //return cb(new Error('Only image and doc (jpg|JPG|jpeg|JPEG|png|PNG|doc|DOC|docx|DOCX|xls|XLS|xlsx|XLSX|pdf|PDF|txt|TXT|csv|CSV) files are allowed!'), false);
    }
    cb(null, true);
}

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 50000000 } })

const {
    listChat,
    listConversation,
    sendMessage,
    deleteMessage,
    deleteChat,
    archiveChatToggle,
    blockUserToggle,

    checkUnread,
    manageLastActiveStatus,

    listArchive,
    listBlocked

} = require('../controller/userConversationController');

router.post('/listChat', verify, listChat);
router.post('/listConversation', verify, listConversation);
router.post('/sendMessage', verify, upload.array('media', 20), sendMessage);
router.post('/deleteMessage', verify, deleteMessage);
router.post('/deleteChat', verify, deleteChat);
router.post('/archiveChatToggle', verify, archiveChatToggle);
router.post('/blockUserToggle', verify, blockUserToggle);

router.post('/checkUnread', verify, checkUnread);
router.post('/manageLastActiveStatus', verify, manageLastActiveStatus);

router.post('/listArchive', verify, listArchive);
router.post('/listBlocked', verify, listBlocked);

module.exports = router;