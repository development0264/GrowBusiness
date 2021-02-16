const router = require('express').Router();

const {
    deepLinkChecker,
    browserCheck
} = require('../controller/deepLinkCheckerController');

router.get('/deepLinkChecker', deepLinkChecker);
router.get('/browserCheck', browserCheck);

module.exports = router;