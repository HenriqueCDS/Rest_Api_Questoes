const mysql = require('../mysql');

exports.get = async  (req, res, next) => { 
    try {
        const query = 'SELECT * FROM feedback'
        var result = await mysql.execute(query);
        const response = {
            quantidade: result.length,
            feedbacks: result.map(prod => {
                return {
                    
                    id_questao: prod.id_questao,
                    id_usuario: prod.id_usuario,
                    avaliacao: prod.avaliacao,
                }
            })
        }
        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});              
    }   
}


exports.post = async  (req, res, next) => { 
    try {   
        const query = `INSERT INTO feedback VALUES(?,?,?)`;
        var result = await mysql.execute(query,[req.body.id_questao,req.user.userId,req.body.avaliacao]);
        const response = {
            id:result.affectedRows,
            id_questao:req.body.id_questao,
            id_usuario:req.user.userId,
            avaliacao:req.body.avaliacao, 
            mensagem: 'Avaliado com sucesso' 
        }
        return res.status(200).send(response);
} catch (error) {
    if(error.code == 'ER_DUP_ENTRY')
    {
        return res.status(400).send({mensagem: "Questão já avalida pelo usuário."}); 
    }

    return res.status(400).send({mensagem: "Erro desconhecido", code: 199}); 
            
}
}

exports.patch = async  (req, res, next) => { 
    try {
        const query = `UPDATE feedback SET avaliacao = ? WHERE id_questao = ? and id_usuario = ?`;
        var result = await mysql.execute(query,[req.body.avaliacao,req.body.id_questao,req.user.userId]);
        const response = {
            Qtdalteradas: result.changedRows,
            id_questao:req.body.id_questao,
            id_usuario:req.user.userId,
            avaliacao:req.body.avaliacao, 
            mensagem: 'Reavaliado com sucesso' 
        }
        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro desconhecido", code: 199});           
    }
}
