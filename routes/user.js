const express = require('express');
const router = express.Router();
const login = require('../middleware/login');
const userController = require('../controllers/user-controller');

router.post('/',login.requiredInsert, userController.createUser);
router.post('/login', userController.Login)
router.patch('/',login.required, userController.atualizaUsuario)
module.exports = router;