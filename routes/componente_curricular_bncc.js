const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const req = require('express/lib/request');
const componente_curriculaController = require('../controllers/componente_curricular_bncc-controller')

router.get('/count', componente_curriculaController.getCount);

router.get('/:inicio?/:quantidade?', componente_curriculaController.getAll);

router.get('/:id', componente_curriculaController.get);



module.exports = router;