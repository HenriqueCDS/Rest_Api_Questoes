const mysql = require('../mysql');

exports.getAll = async (req, res, next) => {

    try {
        const query = 'SELECT * FROM sub_sub_area';
        var result = await mysql.execute(query);
        const response = {
            quantidade: result.length,
            dados: result.map(prod => {
                return {
                    id: prod.id_sub_sub_area,
                    descricao_sub_sub_area: prod.descricao_sub_sub_area,
                    id_sub_area:prod.id_sub_area,
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna sub sub área especifica',
                        url: 'http://localhost:3000/subsubarea/' + prod.id_sub_sub_area
                    }
                }
            })
        }
        return res.status(200).send({ response })
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131})
    }
    
};

exports.getAllSubArea = async (req, res, next) => {

    try {
        const query = 'SELECT * FROM sub_sub_area WHERE id_sub_area = ?';
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
                    id: prod.id_sub_sub_area,
                    descricao_sub_sub_area: prod.descricao_sub_sub_area,
                    id_sub_area:prod.id_sub_area,
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna sub sub área especifica',
                        url: 'http://localhost:3000/subsubarea/' + prod.id_sub_sub_area
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
        const query = 'SELECT * FROM sub_sub_area WHERE id_sub_sub_area = ?;';
        var result = await mysql.execute(query, [req.params.id]);

        if (result.length == 0) {
            return res.status(404).send({
                mensage: 'id não encontrado', code:12 
            })
        }
        const response = {
            dados: {
                id: result[0].id_sub_sub_area,
                descricao_sub_sub_area: result[0].descricao_sub_sub_area,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna todas sub sub áreas',
                    url: 'http://localhost:3000/subsubarea/'
                }
            }
        }
        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }

}
