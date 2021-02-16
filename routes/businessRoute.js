const router = require('express').Router();
const verify = require('../commonfunctions/verifyToken');

const {
    listInterestedInBusiness,
    manageApprovedInvesmentStatus
} = require('../controller/businessController');

router.post('/listInterestedInBusiness', verify, listInterestedInBusiness);
router.post('/manageApprovedInvesmentStatus', verify, manageApprovedInvesmentStatus);

module.exports = router;