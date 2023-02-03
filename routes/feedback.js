const express = require('express');
const router = express.Router();
const mysql = require('../mysql');
const req = require('express/lib/request');
const FeedbackControler = require('../controllers/feedback-controller');
const login = require('../middleware/login');


router.get('/',login.optional, FeedbackControler.get);

router.post('/',login.required, FeedbackControler.post);

router.patch('/',login.required, FeedbackControler.patch);

module.exports = router;