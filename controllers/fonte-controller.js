const mysql = require('../mysql')

exports.getAll = async (req,res,next) => {
    try {      
        const query = 'SELECT * FROM fonte;'
        var result = await mysql.execute(query);      
        const response = {
            quantidade: result.length,
            dados: result.map(prod => { 
                return {
                    id:prod.id_fonte,
                    descricao_fonte:prod.descricao_fonte,
                    autoral:prod.autoral,
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna fonte específica',
                        url: 'http://localhost:3000/fontes/' + prod.id_fonte
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
        const query = 'SELECT * FROM fonte WHERE id_fonte = ?;'
        var result = await mysql.execute(query,[req.params.id]);    
        if (result.length == 0) {
            return res.status(404).send({
                mensagem: 'id não encontrado', code:12 
            })
        }
        const response = {
            dados: {  
                id: result[0].id_questao,
                id_fonte:result[0].id_fonte,
                descricao_fonte:result[0].descricao_fonte,
                autoral:result[0].autoral,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna todas fontes',
                    url: 'http://localhost:3000/fontes'
                }
            }
        }
        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
}




