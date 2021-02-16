const router = require('express').Router();
const verify = require('../commonfunctions/verifyToken');

const {
    listStaticData,

    addtag,
    listtags,
    editTag,

    addPlan,
    listPlans,

    addBoost,
    listBoosts,

    listDocuments,
    verifyDoc,

    listFeedbacks,
    filterTag,
    getSingleTag,
    updateTag,
    deleteTag,
    filterPlan,
    getSinglePlan,
    updatePlan,
    deletePlan,
    filterVerification,
    addVerification,
    getSingleVerification,
    updateVerification,
    filterBoost,
    getSingleBoost,
    deleteBoost,
    updateBoost,
    getSingleDocument,
    getStats
} = require('../controller/adminController');

router.get('/listStaticData', listStaticData);

router.post('/addtag', verify, addtag);
router.get('/listtags', listtags);
router.post('/editTag', verify, editTag);

router.post('/addPlan', verify, addPlan);
router.get('/listPlans', verify, listPlans);

router.post('/addBoost', verify, addBoost);
router.get('/listBoosts', verify, listBoosts);

router.get('/listDocuments', verify, listDocuments);
router.post('/verifyDoc', verify, verifyDoc);

router.get('/listFeedbacks', verify, listFeedbacks);

router.get('/filterTag', verify, filterTag);
router.get('/getSingleTag/:id', verify, getSingleTag);
router.post('/updateTag', verify, updateTag);
router.post('/deleteTag/:id', verify, deleteTag);
router.get('/filterPlan', verify, filterPlan);
router.get('/getSinglePlan/:id', verify, getSinglePlan);
router.post('/updatePlan', verify, updatePlan);
router.post('/deletePlan/:id', verify, deletePlan);
router.get('/filterVerification', verify, filterVerification);
router.post('/addVerification', verify, addVerification);
router.get('/getSingleVerification/:id', verify, getSingleVerification);
router.post('/updateVerification', verify, updateVerification);
router.get('/filterBoost', verify, filterBoost);
router.get('/getSingleBoost/:id', verify, getSingleBoost);
router.post('/updateBoost', verify, updateBoost);
router.post('/deleteBoost/:id', verify, deleteBoost);
router.get('/getSingleDocument/:id', verify, getSingleDocument);

router.get('/getStats', verify, getStats)

module.exports = router;