const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const req = require('express/lib/request');
const SubareaControler = require('../controllers/subsubArea-controller')


router.get('/', SubareaControler.getAll);

router.get('/:id', SubareaControler.getAllSubArea);

router.get('/espec/:id', SubareaControler.get);



module.exports = router;