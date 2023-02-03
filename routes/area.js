const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const req = require('express/lib/request');
const areaControler = require('../controllers/area-controller')


router.get('/', areaControler.getAll);

router.get('/:id', areaControler.get);



module.exports = router;