const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const req = require('express/lib/request');
const formacaoControler = require('../controllers/formacao-controller')


router.get('/', formacaoControler.getAll);

router.get('/:id', formacaoControler.get);


module.exports = router;