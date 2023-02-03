const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;
const req = require('express/lib/request');
const QuestaoController = require('../controllers/questao-controler')
const login = require('../middleware/login');
const multer  = require('multer')
const multerConfig = require("../config/multer");

router.post('/cadastroImagem',login.required,multer(multerConfig).single("img"), QuestaoController.uploadImg);
//foi usado método POST, mesmo sendo uma consulta, pelo fato da necessidade dos dados serem informados pelo body (para evitar uma query muito grande)
router.post('/selecionadas',login.required, QuestaoController.getQuestaoSelecionadas);

router.get('/count',login.required, QuestaoController.getTotal);

router.get('/count/privada',login.required, QuestaoController.getTotalPrivada);

router.get('/privada/espec/:id',login.required, QuestaoController.getQuestaoPrivada);

router.get('/privada/:min?/:max?',login.required, QuestaoController.getAllquestaoPrivada);

router.get('/espec/:id',login.required, QuestaoController.getQuestao);

router.get('/:min?/:max?',login.required, QuestaoController.getAllquestao);

router.patch('/publicar/:id',login.required, QuestaoController.publicarQuestao);

router.post('/',login.required, multer(multerConfig).single("img"), QuestaoController.postQuestao);

router.patch('/:id',login.required, QuestaoController.patchQuestao);

router.delete('/:tipo/:id',login.required, QuestaoController.deleteQuestao);

module.exports = router; 