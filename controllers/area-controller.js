const mysql = require('../mysql')

exports.getAll = async (req,res,next) => {
    try {      
        const query =  'SELECT * FROM area';
        var result = await mysql.execute(query);
        const response = {
            quantidade: result.length,
            dados: result.map(prod => {
                return {
                    id:prod.id_area,
                    descricao_area:prod.descricao_area, 
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna área específica',
                        url: 'http://localhost:3000/area/' + prod.id_area
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
    
        const query = 'SELECT * FROM area WHERE id_area = ?;'
        var result = await mysql.execute(query, [req.params.id]);
        if (result.length == 0) {
            return res.status(404).send({
                message: 'id não encontrado', code:12 
            })
        }
        const response = {
            dados: {   
                id:result[0].id_area,  
                descricao_area:result[0].descricao_area,
                descricao:result[0].descricao, 
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna todas as área',
                    url: 'http://localhost:3000/area'
                }
            }
        }
        
        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
}
