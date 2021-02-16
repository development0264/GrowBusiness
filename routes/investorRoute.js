const router = require('express').Router();
const verify = require('../commonfunctions/verifyToken');

const {
    userInvestment
} = require('../controller/investorController');

router.post('/userInvestment', verify, userInvestment);

module.exports = router;