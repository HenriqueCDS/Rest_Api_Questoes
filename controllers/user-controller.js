const mysql = require('../mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res, next) => {
    try{
        var query = `SELECT * FROM usuario WHERE email = ?`;
        var result = await mysql.execute(query, [req.body.email]);
       
         if (result.length > 0) {
             return res.status(409).send({ mensagem: 'E-mail já cadastrado',code:42 })
         }

        const password =  bcrypt.hashSync(req.body.password, 10)
        query = 'INSERT INTO usuario (nome,email,senha) VALUES (?,?,?)';
        const results = await mysql.execute(query, [req.body.nome,req.body.email, password]);
    
        if(results.affectedRows == 0){
            return res.status(400).send({mensagem:'Erro ao cadastrar usuário', code:44});
        }
        
        const response = {
            mensagem: 'Usuário cadastrado com sucesso',
            createdUsers: req.body.email,
            code: 01
        }
        return res.status(201).send(response);
    }
    catch (error) {
        return res.status(400).send({mensagem:'Erro ao cadastrar usuário', code:44})
    } 
    
};

exports.Login = async (req, res, next) => {
    try{
        const query = `SELECT * FROM usuario WHERE email = ?`;
        var results = await mysql.execute(query, [req.body.email]);

        if (results.length < 1) {
            return res.status(401).send({ mensagem: 'E-mail de usuário não encontrado', code:48
         })
        }
        if (await bcrypt.compare(req.body.senha, results[0].senha)) {
            const token = jwt.sign({
                userId: results[0].id_usuario,
                email: results[0].email,
                data: results[0].data_cadastro,
            },
            process.env.JWT_KEY,
            {
                expiresIn: "48h"
            });
            return res.status(200).send({
                mensagem: 'Autenticado com sucesso',
                token: token,
                code: 02
            });
        }
        return res.status(401).send({ mensagem: 'Falha na autenticação', code:46 })
    }
    catch (error) {
        return res.status(400).send({ mensagem: 'Falha na autenticação', code:46 })
    } 
   
};

exports.atualizaUsuario = async (req, res, next) => {
    try {
   
        var query = `UPDATE usuario SET email = ? WHERE email = ? `;
        var result = await mysql.execute(query,[req.body.emailNovo,req.user.email]);

        if(result.affectedRows != 1)
        {
            return res.status(400).send({mensagem: "Erro na alteração do usuário", code:"xxx"});
        }

        const response = {
            mensagem: 'Usuário alterado com sucesso',
            code: "xxx",
            usuario: {
                id_usuario:req.user.userId,
                novo_email: req.body.emailNovo,
                request: {
                    tipo: 'POST',
                    descricao: 'Login',
                    url: 'http://localhost:3000/user/login'
                }
            }
        }
        return res.status(202).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro na alteração do usuário", code:09});
    }
};

//não está em uso
exports.patchUser = async (req, res, next) => {
    try {
        const password =  bcrypt.hashSync(req.body.password, 10);    
        var query = `UPDATE usuario SET email = ?,senha = ?  WHERE id_usuario = ? `;
        var result = await mysql.execute(query,[req.user.email,password,req.user.userId]);

        const response = {
            mensagem: 'Usuário alterado com sucesso',
            UserModificado: {
                alterado: result.affectedRows,
                userId:req.user.userId,
                password:password,
                request: {
                    tipo: 'GET',
                    descricao: 'Login',
                    url: 'http://localhost:3000/user/login'
                }
            }
        }
        return res.status(202).send(response);
    } catch (error) {
        return res.status(400).send(error);
    }
};