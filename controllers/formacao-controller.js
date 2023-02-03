const mysql = require('../mysql');

exports.getAll = async (req, res, next) => {
    try {
        const query = 'SELECT * FROM formacao';
        var result = await mysql.execute(query);

        const response = {
            quantidade: result.length,
            dados: result.map(prod => {
                return {
                    id: prod.id_formacao,
                    descricao_formacao: prod.descricao_formacao,
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna formação específica',
                        url: 'http://localhost:3000/formacao/' + prod.id_formacao
                    }
                }
            })

        }
        return res.status(200).send({ response })
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131})
    }
};

exports.get = async (req, res, next) => {
    try {
        const query = 'SELECT * FROM formacao WHERE id_formacao = ?;';
        var result = await mysql.execute(query, [req.params.id]);

        if (result.length == 0) {
            return res.status(404).send({
                message: "id não encontrado", code:12 
            })
        }
        const response = {
            dados: {
                id: result[0].id_formacao,
                descricao_formacao: result[0].descricao_formacao,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna todas as formações',
                    url: 'http://localhost:3000/formacao'
                }
            }
        }
        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
}
