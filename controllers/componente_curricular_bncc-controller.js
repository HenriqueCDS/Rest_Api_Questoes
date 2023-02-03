const mysql = require('../mysql')

function aplicaOrdem(req)
{
    let order =`ORDER BY id_componente_curricular`;
    if (Object.keys(req.query).length !== 0) {
        var result = Object.keys(req.query).map(function (key) {
            if(key == "order")
            {
                return [key, req.query[key]];
            }
        });
        result = result.filter(n => n);
        
        if(result[0])
        {
            order =`ORDER BY ${result[0][1]}`;  
        }
       
    }
    return order;
}

function aplicaFiltrosBNCC(req)
{
    let filtro = "";
    const onlyLettersPattern = '([=|-|;|*])';
    
    if (Object.keys(req.query).length !== 0) {
        filtro = "";
        //montamos uma matriz com os dados da query
        var result = Object.keys(req.query).map(function (key) {
            if(key == "search")
            {
                return [key, req.query[key]];
            }
        });
        result = result.filter(n => n); //remove campos em branco
        
        if(result && result.length > 0)
        {  
            console.log(result);
            
                filtro = `WHERE id_componente_curricular LIKE "%${result[0][1]}%" OR habilidades LIKE "%${result[0][1]}%" OR disciplina LIKE "%${result[0][1]}%" OR tipo_ensino LIKE "%${result[0][1]}%"`;
            
        }
       
    }
    //caso não tenha filtro, retornamos vazio
    return filtro;
}

exports.getAll = async (req,res,next) => {
    var limit = "";
    var order = "";
    var filtro = "";

    order = aplicaOrdem(req);
    filtro = aplicaFiltrosBNCC(req);

    if (!isNaN(req.params.inicio) && !isNaN(req.params.quantidade)) {

        limit = `LIMIT ${req.params.inicio},${req.params.quantidade}`;
    }

    try {  
        const query = `SELECT * FROM componente_curricular_bncc ${filtro} ${order} ${limit}`;
        var result = await mysql.execute(query); 
        
        const queryCount =  `SELECT COUNT(*) as total FROM componente_curricular_bncc ${filtro}`;
        var resultCount = await mysql.execute(queryCount); 

        const response = {
            totalFiltro: resultCount[0]['total'],
            quantidade: result.length,
            bnccs: result.map(prod => {
                return {          
                    id: prod.id_componente_curricular,
                    disciplina: prod.disciplina,
                    habilidades:prod.habilidades,
                    tipo_ensino:prod.tipo_ensino,                             
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
        const query =  'SELECT * FROM componente_curricular_bncc WHERE id_componente_curricular = ?;'
        var result = await mysql.execute(query,[req.params.id]); 
        if (result.length == 0) {
            return res.status(404).send({
                mensagem: 'id não encontrado',code:12 
            })
        }
        const response = {
            bnccs: {                       
                id_componente_curricular:result[0].id_componente_curricular,
                disciplina:result[0].disciplina,
                habilidades:result[0].habilidades,
                tipo_ensino:result[0].tipo_ensino
            }
        }
        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
}

exports.getCount = async (req, res, next) => {
    var filtro = "";

    filtro = aplicaFiltrosBNCC(req);
    try {
        const query =  `SELECT COUNT(*) as total FROM componente_curricular_bncc ${filtro}`;
        var result = await mysql.execute(query,[req.params.id]); 
        
        const response = {
            total : result[0]
        }

        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
}
