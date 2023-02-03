const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const req = require('express/lib/request');
const fonteControler = require('../controllers/fonte-controller')


router.get('/', fonteControler.getAll);

router.get('/:id', fonteControler.get);


module.exports = router;