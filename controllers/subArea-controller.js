const mysql = require('../mysql');

exports.getAll = async (req, res, next) => { 
    try {
        const query = 'SELECT * FROM sub_area'
        var result = await mysql.execute(query);
        const response = {
            quantidade: result.length,
            dados: result.map(prod => {
                return {
                    id: prod.id_sub_area,
                    descricao_sub_area: prod.descricao_sub_area,
                    id_area:prod.id_area, 
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna sub áreas específica',
                        url: 'http://localhost:3000/subarea/' + prod.id_sub_area
                    }
                }
            })
        }
        return res.status(200).send({ response })
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131})
    }
};

exports.getAllArea = async (req, res, next) => { 
    try {
        const query = 'SELECT * FROM sub_area WHERE id_area = ?'
        var result = await mysql.execute(query, [req.params.id]);
        if (result.length == 0) {
            return res.status(404).send({
                mensage: 'id não encontrado', code:12 
            })
        }
        const response = {
            quantidade: result.length,
            dados: result.map(prod => {
                return {
                    id: prod.id_sub_area,
                    descricao_sub_area: prod.descricao_sub_area,
                    id_area:prod.id_area, 
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna sub áreas específica',
                        url: 'http://localhost:3000/subarea/' + prod.id_sub_area
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
        const query = 'SELECT * FROM sub_area WHERE id_sub_area = ?;'
        var result = await mysql.execute(query, [req.params.id]);
        if (result.length == 0) {
            return res.status(404).send({
                message: 'id não encontrado', code:12 
            })
        }
        const response = {
            dados: {
                id: result[0].id_sub_area,
                descricao_sub_area: result[0].descricao_sub_area,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna todas sub áreas',
                    url: 'http://localhost:3000/subarea/'
                }
            }
        }

        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
}
