const mysql = require('../mysql');
const jwt = require('jsonwebtoken');

//filtros aki especificados usa o >, os demais =
const filtrosEspecificos = 
[
    {tipo:"q.aprovacao", operador:">="},
    {tipo:"q.grau_dificuldade", operador:"BETWEEN"},
    {tipo:"q.data_criacao", operador:"BETWEEN"}
];

function aplicaOrdem(req)
{
    let order =`ORDER BY DATA_CRIACAO DESC`;
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

function aplicaFiltros(req)
{
    let filtro = "";
    let operador = "";
    const onlyLettersPattern = '([=|-|;|*])';
    
    if (Object.keys(req.query).length !== 0) {
        filtro = " and ";
        //montamos uma matriz com os dados da query
        var result = Object.keys(req.query).map(function (key) {
            if(key != "order")
            {
                return [key, req.query[key]];
            }
        });
        result = result.filter(n => n); //remove campos em branco
        
        if(result)
        {  
            //montagem da query com o filtro where ........ and .......
            for (let i = 0; i < result.length; i++) {
                //os parametros diferentes do order aki são tratados 
                operador = retornaOperador(result[i][0]);
                if (validaCaracteres(result[i][0], result[i][1], onlyLettersPattern)) {
                    if (i + 1 == result.length) {
                        if(result[i][0] == "bnccs")
                        {
                            let arrayValores = result[i][1].split('OR');
                            var valoresTratados = arrayValores.map(function(bncc) {
                                return `'${bncc.trim()}'`;
                              });
                            console.log(valoresTratados.toString());
                            filtro += ` cq.id_componente_curricular IN (${valoresTratados}) `;
                        }
                        else if(result[i][0] == "correcaoAutomatica")
                        {
                            filtro += ` q.tipo != 'dissertativa' `;
                        }
                        else
                        {
                            filtro += ` ${result[i][0]} ${operador} ${result[i][1]}`;
                        }
                    } else {
                        if(result[i][0] == "bnccs")
                        {
                            let arrayValores = result[i][1].split('OR');
                            var valoresTratados = arrayValores.map(function(bncc) {
                                return `'${bncc.trim()}'`;
                              });
                            console.log(valoresTratados.toString());
                            filtro += ` cq.id_componente_curricular IN (${valoresTratados}) AND `;
                        }
                        else if(result[i][0] == "correcaoAutomatica")
                        {
                            filtro += ` q.tipo != 'dissertativa' AND `; 
                        }
                        else
                        {
                            filtro += ` ${result[i][0]} ${operador} ${result[i][1]} AND `
                        }
                    }
                } 
            }  
        }
       
    }
    //caso não tenha filtro, retornamos vazio
    return filtro == ' and ' ? "" : filtro;
}

function validaCaracteres(valor1, valor2, validacao)
{
    let valido = true;
    if (valor1.match(validacao) || valor2.match(validacao)) {
        valido = false;
        filtro = "";
        return res.status(400).send({ message: 'Query invalida, nenhum resultado encontrado', code: 20 });
    }
    return valido;
}

function retornaOperador(valor)
{
    let operador = "=";
    let resultado = filtrosEspecificos.find(c => c.tipo == valor);
    if(resultado)
    {
        operador = resultado.operador;
    }
    return operador;
}

exports.uploadImg = async (req, res, next) => {
    if(req.file)
    {
        statusCode = 200;
        resp = {
            status: true,
            mensagem: "Sucesso ao carregar a imagem",
            url: req.file.location,
            nome: req.file.key,
            tipo: req.file.contentType,
            code: 120
        };
    }
    else
    {
        statusCode = 400;
        resp = {
            status: false,
            mensagem: "Erro no upload do arquivo",
            code: 07
        }
    }
    
    return res.status(statusCode).send(resp);
}

exports.getAllquestaoPrivada = async (req, res, next) => {
    var limit = "";

    if (!isNaN(req.params.min) && !isNaN(req.params.max)) {

        limit = `LIMIT ${req.params.min},${req.params.max}`;
    }
    
    let filtro = aplicaFiltros(req);
    let order = aplicaOrdem(req);

    try {
        const query = `
        SELECT DISTINCT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
            q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
             ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', 
            asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area', usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada 
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "alternativa"  
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area
        INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario 
        LEFT JOIN cdaqts.componente_curricular_bncc_questao as cq     
			ON cq.id_questao = q.id_questao 
        WHERE q.privada = 1 and q.id_usuario = ? ${filtro} 
     
        UNION
     
        SELECT DISTINCT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
            q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qd.enunciado as enunciado_questao,
            ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',
            usu.nome as 'nome',usu.email as 'email' ,q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_dissertativa as qd
            ON qd.id_questao_dissertativa = q.id_questao_dissertativa and q.tipo = "dissertativa"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
		INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario
        LEFT JOIN cdaqts.componente_curricular_bncc_questao as cq     
			ON cq.id_questao = q.id_questao 
        WHERE q.privada = 1 and q.id_usuario = ? ${filtro}
             
        UNION
             
        SELECT DISTINCT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
            q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
             ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area',
            asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
            FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "multipla"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
        INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario
        LEFT JOIN cdaqts.componente_curricular_bncc_questao as cq     
			ON cq.id_questao = q.id_questao 
            WHERE q.privada = 1 and q.id_usuario = ? ${filtro}
        ${order}
        ${limit}
        `;
        try {
            var resultQuestes = await mysql.execute(query, [req.user.userId, req.user.userId, req.user.userId])
        } catch (error) {
            return res.status(400).send({ mensagem: 'Query invalida, nenhum resultado encontrado', code: 20 });
        }

        array_final = [];
       
        for(let j = 0; j < resultQuestes.length; j++)
        {
            let arrayAlternativas = [];
            //se do tipo alternatica ou multipla, buscamos e adicionamos as alternativas
            if(resultQuestes[j].id_questao_alternativa != null)
            {
                var query2 = `SELECT * FROM alternativa WHERE id_questao_alternativa = ?`;
                arrayAlternativas = await mysql.execute(query2, [resultQuestes[j].id_questao_alternativa]); 

                
                for(k = 0; k < arrayAlternativas.length;k++)
                {
                    arrayMidiaOpcoes = await mysql.execute("SELECT url, tipo FROM midia_opcoes WHERE id_alternativa = ?", [arrayAlternativas[k].id_alternativa]);
                    arrayAlternativas[k].url_mida = arrayMidiaOpcoes;
                }
            }

            let arrayBnccs = [];
            var query3 = `SELECT id_componente_curricular AS "id_bncc" FROM componente_curricular_bncc_questao WHERE id_questao = ?`;
            arrayBnccs = await mysql.execute(query3, [resultQuestes[j].id_questao]); 

            let arrayMidia = [];
            var query4 = `SELECT url FROM cdaqts.midia_dissertativa WHERE id_questao_dissertativa = ?
                            UNION
                          SELECT url FROM cdaqts.midia_alternativa WHERE id_questao_alternativa = ?`;
            arrayMidia = await mysql.execute(query4, [resultQuestes[j].id_questao_dissertativa, resultQuestes[j].id_questao_alternativa]); 

            array_final.push({
                id: resultQuestes[j].id_questao,
                id_questao_associativa: resultQuestes[j].id_questao_associativa,
                id_questao_alternativa: resultQuestes[j].id_questao_alternativa,
                id_questao_dissertativa: resultQuestes[j].id_questao_dissertativa,
                grau_dificuldade: resultQuestes[j].grau_dificuldade,
                periodo_recomendado: resultQuestes[j].periodo_recomendado,
                data_criacao: resultQuestes[j].data_criacao,
                tipo: resultQuestes[j].tipo,
                descricao_fonte: resultQuestes[j].fonte,
                formacao: resultQuestes[j].formacao,
                area: resultQuestes[j].area,
                sub_area: resultQuestes[j].sub_area,
                sub_sub_area: resultQuestes[j].sub_sub_area,
                aprovacao: resultQuestes[j].aprovacao,
                privada: resultQuestes[j].privada,
                usuario: {
                    nome: resultQuestes[j].nome,
                    email: resultQuestes[j].email
                },
                questao: {
                    enunciado: resultQuestes[j].enunciado_questao,
                    url_midia: arrayMidia
                },
                bnccs: arrayBnccs,
                alternativa: arrayAlternativas,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna questão específica.',
                    url: 'http://localhost:3000/questao/privada/espec/' + resultQuestes[j].id_questao
                }
    
            });
            
        }
    
        if (array_final.length == 0) {
            return res.status(400).send({ mensagem: 'Nenhum resultado encontrado',code:16 });
        } else {
            var response = {
                quantidade: array_final.length,
                questao: array_final
            }
        }

        return res.status(200).send(response);

    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
};

exports.getQuestaoPrivada = async (req, res, next) => {
    try {

        const query = `
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
            q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
             ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', 
            asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area', usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "alternativa"    
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area
        INNER JOIN cdaqts.usuario as usu     
            ON usu.id_usuario = q.id_usuario  
        where  id_questao = ? and q.privada = 1 and q.id_usuario = ? 
         
        UNION
 
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
            q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qd.enunciado as enunciado_questao,
            ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',
            usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_dissertativa as qd
            ON qd.id_questao_dissertativa = q.id_questao_dissertativa and q.tipo = "dissertativa"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
        INNER JOIN cdaqts.usuario as usu     
            ON usu.id_usuario = q.id_usuario 
        where  id_questao = ? and q.privada = 1 and q.id_usuario = ?
         
        UNION
         
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
                q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
                 ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area',
                asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "multipla"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
        INNER JOIN cdaqts.usuario as usu     
            ON usu.id_usuario = q.id_usuario 
        where  id_questao = ?   and q.privada = 1 and q.id_usuario = ?     
        `;
        try {
            var resultQuestes = await mysql.execute(query, [req.params.id, req.user.userId, req.params.id, req.user.userId, req.params.id, req.user.userId])
        } catch (error) {
            return res.status(400).send({ mensagem: 'Query invalida, nenhum resultado encontrado', code: 20 });
        }
        
        array_final = [];
       
        for(let j = 0; j < resultQuestes.length; j++)
        {
            let arrayAlternativas = [];
            //se do tipo alternatica ou multipla, buscamos e adicionamos as alternativas
            if(resultQuestes[j].id_questao_alternativa != null)
            {
                var query2 = `SELECT * FROM alternativa WHERE id_questao_alternativa = ?`;
                arrayAlternativas = await mysql.execute(query2, [resultQuestes[j].id_questao_alternativa]); 

                for(k = 0; k < arrayAlternativas.length;k++)
                {
                    arrayMidiaOpcoes = await mysql.execute("SELECT url, tipo FROM midia_opcoes WHERE id_alternativa = ?", [arrayAlternativas[k].id_alternativa]);
                    arrayAlternativas[k].url_mida = arrayMidiaOpcoes;
                }
            }

            let arrayBnccs = [];
            var query3 = `SELECT id_componente_curricular AS "id_bncc" FROM componente_curricular_bncc_questao WHERE id_questao = ?`;
            arrayBnccs = await mysql.execute(query3, [resultQuestes[j].id_questao]); 

            let arrayMidia = [];
            var query4 = `SELECT url FROM cdaqts.midia_dissertativa WHERE id_questao_dissertativa = ?
                            UNION
                          SELECT url FROM cdaqts.midia_alternativa WHERE id_questao_alternativa = ?`;
            arrayMidia = await mysql.execute(query4, [resultQuestes[j].id_questao_dissertativa, resultQuestes[j].id_questao_alternativa]); 

            array_final.push({
                id: resultQuestes[j].id_questao,
                id_questao_associativa: resultQuestes[j].id_questao_associativa,
                id_questao_alternativa: resultQuestes[j].id_questao_alternativa,
                id_questao_dissertativa: resultQuestes[j].id_questao_dissertativa,
                grau_dificuldade: resultQuestes[j].grau_dificuldade,
                periodo_recomendado: resultQuestes[j].periodo_recomendado,
                data_criacao: resultQuestes[j].data_criacao,
                tipo: resultQuestes[j].tipo,
                descricao_fonte: resultQuestes[j].fonte,
                formacao: resultQuestes[j].formacao,
                area: resultQuestes[j].area,
                sub_area: resultQuestes[j].sub_area,
                sub_sub_area: resultQuestes[j].sub_sub_area,
                aprovacao: resultQuestes[j].aprovacao,
                privada: resultQuestes[j].privada,
                usuario: {
                    nome: resultQuestes[j].nome,
                    email: resultQuestes[j].email
                },
                questao: {
                    enunciado: resultQuestes[j].enunciado_questao,
                    url_midia: arrayMidia
                },
                bnccs: arrayBnccs,
                alternativa: arrayAlternativas,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna todas as questões privadas.',
                    url: 'http://localhost:3000/questao/privada/'
                }
    
            });
            
        }
    
        if (array_final.length == 0) {
            return res.status(400).send({ message: 'Nenhum resultado encontrado',code:16 });
        } else {
            var response = {
                quantidade: array_final.length,
                questao: array_final
            }
        }

        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
}

exports.getAllquestao = async (req, res, next) => {

    var limit = "";

    if (!isNaN(req.params.min) && !isNaN(req.params.max)) {

        limit = `LIMIT ${req.params.min},${req.params.max}`;
    }
    
    let filtro = aplicaFiltros(req);
    let order = aplicaOrdem(req);

    try {

        const query = `
        SELECT DISTINCT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
            q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
             ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', 
            asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area', usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada 
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "alternativa"    
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area
        INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario 
        LEFT JOIN cdaqts.componente_curricular_bncc_questao as cq     
			ON cq.id_questao = q.id_questao 
        WHERE q.privada = 0 ${filtro} 
     
        UNION
     
        SELECT DISTINCT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
                q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qd.enunciado as enunciado_questao,
                ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',
                usu.nome as 'nome',usu.email as 'email' ,q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_dissertativa as qd
            ON qd.id_questao_dissertativa = q.id_questao_dissertativa and q.tipo = "dissertativa"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
		INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario
        LEFT JOIN cdaqts.componente_curricular_bncc_questao as cq     
			ON cq.id_questao = q.id_questao 
        WHERE q.privada = 0 ${filtro} 
             
        UNION
             
        SELECT DISTINCT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
                q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
                 ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area',
                asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
                FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "multipla"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
        INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario
        LEFT JOIN cdaqts.componente_curricular_bncc_questao as cq     
			ON cq.id_questao = q.id_questao 
        WHERE q.privada = 0 ${filtro} 
        ${order}
        ${limit}
        `;
        try {
            var resultQuestes = await mysql.execute(query, [req.params.min, req.params.max])
        } catch (error) {
            return res.status(400).send({ message: 'Query invalida nenhum resultado encontrado', code: 20 });
        }

        array_final = [];
       
        for(let j = 0; j < resultQuestes.length; j++)
        {
            let arrayAlternativas = [];
            //se do tipo alternatica ou multipla, buscamos e adicionamos as alternativas
            if(resultQuestes[j].id_questao_alternativa != null)
            {
                var query2 = `SELECT * FROM alternativa WHERE id_questao_alternativa = ?`;
                arrayAlternativas = await mysql.execute(query2, [resultQuestes[j].id_questao_alternativa]); 

                for(k = 0; k < arrayAlternativas.length;k++)
                {
                    arrayMidiaOpcoes = await mysql.execute("SELECT url, tipo FROM midia_opcoes WHERE id_alternativa = ?", [arrayAlternativas[k].id_alternativa]);
                    arrayAlternativas[k].url_mida = arrayMidiaOpcoes;
                }
            }
            
            let arrayBnccs = [];
            var query3 = `SELECT id_componente_curricular AS "id_bncc" FROM componente_curricular_bncc_questao WHERE id_questao = ?`;
            arrayBnccs = await mysql.execute(query3, [resultQuestes[j].id_questao]); 

            let arrayMidia = [];
            var query4 = `SELECT url FROM cdaqts.midia_dissertativa WHERE id_questao_dissertativa = ?
                            UNION
                          SELECT url FROM cdaqts.midia_alternativa WHERE id_questao_alternativa = ?`;
            arrayMidia = await mysql.execute(query4, [resultQuestes[j].id_questao_dissertativa, resultQuestes[j].id_questao_alternativa]); 

            array_final.push({
                id: resultQuestes[j].id_questao,
                id_questao_associativa: resultQuestes[j].id_questao_associativa,
                id_questao_alternativa: resultQuestes[j].id_questao_alternativa,
                id_questao_dissertativa: resultQuestes[j].id_questao_dissertativa,
                grau_dificuldade: resultQuestes[j].grau_dificuldade,
                periodo_recomendado: resultQuestes[j].periodo_recomendado,
                data_criacao: resultQuestes[j].data_criacao,
                tipo: resultQuestes[j].tipo,
                descricao_fonte: resultQuestes[j].fonte,
                formacao: resultQuestes[j].formacao,
                area: resultQuestes[j].area,
                sub_area: resultQuestes[j].sub_area,
                sub_sub_area: resultQuestes[j].sub_sub_area,
                aprovacao: resultQuestes[j].aprovacao,
                privada: resultQuestes[j].privada,
                usuario: {
                    nome: resultQuestes[j].nome,
                    email: resultQuestes[j].email
                },
                questao: {
                    enunciado: resultQuestes[j].enunciado_questao,
                    url_midia: arrayMidia
                },
                bnccs: arrayBnccs,
                alternativa: arrayAlternativas,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna questão específica.',
                    url: 'http://localhost:3000/questao/espec/' + resultQuestes[j].id_questao
                }
    
            });
            
        }
    
        if (array_final.length == 0) {
            return res.status(400).send({ mensagem: 'Nenhum resultado encontrado',code:16 });
        } else {
            var response = {
                quantidade: array_final.length,
                questao: array_final
            }
        }

        return res.status(200).send(response);
      
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
};

exports.getQuestao = async (req, res, next) => {
    try {

        const query = `
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
            q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
             ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', 
            asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area', usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "alternativa"    
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area
        INNER JOIN cdaqts.usuario as usu     
            ON usu.id_usuario = q.id_usuario 
        WHERE id_questao = ? and q.privada = 0 
         
        UNION
 
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
                q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qd.enunciado as enunciado_questao,
                ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',
                usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_dissertativa as qd
            ON qd.id_questao_dissertativa = q.id_questao_dissertativa and q.tipo = "dissertativa"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
        INNER JOIN cdaqts.usuario as usu     
            ON usu.id_usuario = q.id_usuario
        WHERE id_questao = ? and q.privada = 0 
         
        UNION
         
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
                q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
                 ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area',
                asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "multipla"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
        INNER JOIN cdaqts.usuario as usu     
            ON usu.id_usuario = q.id_usuario
        WHERE  id_questao = ?   and q.privada = 0 
             
        `;

        try {
            var resultQuestes = await mysql.execute(query, [req.params.id, req.params.id, req.params.id])
        } catch (error) {
            return res.status(400).send({ mensagem: 'Query invalida, nenhum resultado encontrado', code: 20 });
        }

        array_final = [];
       
        for(let j = 0; j < resultQuestes.length; j++)
        {
            let arrayAlternativas = [];
            //se do tipo alternatica ou multipla, buscamos e adicionamos as alternativas
            if(resultQuestes[j].id_questao_alternativa != null)
            {
                var query2 = `SELECT * FROM alternativa WHERE id_questao_alternativa = ?`;
                arrayAlternativas = await mysql.execute(query2, [resultQuestes[j].id_questao_alternativa]); 
                
                for(k = 0; k < arrayAlternativas.length;k++)
                {
                    arrayMidiaOpcoes = await mysql.execute("SELECT url, tipo FROM midia_opcoes WHERE id_alternativa = ?", [arrayAlternativas[k].id_alternativa]);
                    arrayAlternativas[k].url_mida = arrayMidiaOpcoes;
                }
            }
            
            let arrayBnccs = [];
            var query3 = `SELECT id_componente_curricular AS "id_bncc" FROM componente_curricular_bncc_questao WHERE id_questao = ?`;
            arrayBnccs = await mysql.execute(query3, [resultQuestes[j].id_questao]); 

            let arrayMidia = [];
            var query4 = `SELECT url FROM cdaqts.midia_dissertativa WHERE id_questao_dissertativa = ?
                            UNION
                          SELECT url FROM cdaqts.midia_alternativa WHERE id_questao_alternativa = ?`;
            arrayMidia = await mysql.execute(query4, [resultQuestes[j].id_questao_dissertativa, resultQuestes[j].id_questao_alternativa]); 

            array_final.push({
                id: resultQuestes[j].id_questao,
                id_questao_associativa: resultQuestes[j].id_questao_associativa,
                id_questao_alternativa: resultQuestes[j].id_questao_alternativa,
                id_questao_dissertativa: resultQuestes[j].id_questao_dissertativa,
                grau_dificuldade: resultQuestes[j].grau_dificuldade,
                periodo_recomendado: resultQuestes[j].periodo_recomendado,
                data_criacao: resultQuestes[j].data_criacao,
                tipo: resultQuestes[j].tipo,
                descricao_fonte: resultQuestes[j].fonte,
                formacao: resultQuestes[j].formacao,
                area: resultQuestes[j].area,
                sub_area: resultQuestes[j].sub_area,
                sub_sub_area: resultQuestes[j].sub_sub_area,
                aprovacao: resultQuestes[j].aprovacao,
                privada: resultQuestes[j].privada,
                usuario: {
                    nome: resultQuestes[j].nome,
                    email: resultQuestes[j].email
                },
                questao: {
                    enunciado: resultQuestes[j].enunciado_questao,
                    url_midia: arrayMidia
                },
                bnccs: arrayBnccs,
                alternativa: arrayAlternativas,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna todas as questões públicas.',
                    url: 'http://localhost:3000/questao/'
                }
    
            });
            
        }
    
        if (array_final.length == 0) {
            return res.status(400).send({ mensagem: 'Nenhum resultado encontrado',code:16 });
        } else {
            var response = {
                quantidade: array_final.length,
                questao: array_final
            }
        }

        return res.status(200).send(response);
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
}

exports.postQuestao = async (req, res, next) => {
    var id_questao_dissertativa = null;
    var id_questao_alternativa = null;
    var id_questao_associativa = null;
    var array_questao_dissertativa = [];
    var array_questao_alternativa = [];
    var array_alternativa = [];
    var array_bnccs = [];
    
    try {

        switch (req.body.tipo) {
            case 'dissertativa':
                // inserimos a questão dissertativa
                const query_insert_dissertativa = `INSERT INTO questao_dissertativa VALUES(null,?,?)`;
                var resultado_insert_dissertativa = await mysql.execute(query_insert_dissertativa, [req.body.enunciado, req.body.resposta_sugerida]);
                id_questao_dissertativa = resultado_insert_dissertativa.insertId;

                let array_img = [];
                let array_url = [];

                if(req.body.url_midia)
                {
                    array_img = JSON.parse( req.body.url_midia );
                }

                if(req.file)
                {
                    array_img = [{ url: req.file.location,
                                  nome: req.file.key,
                                  tipo: req.file.contentType}];
                }
                //inserimos as midias do enunciado
                for(h = 0; h < array_img.length;h++)
                {
                    array_url.push(array_img[h].url);
                    var resultado_insert_midia_dissertativa = await mysql.execute("INSERT INTO cdaqts.midia_dissertativa VALUES (null, ?, ?, ?, ?)", [array_img[h].url, array_img[h].nome, array_img[h].tipo, id_questao_dissertativa])
                }
                //representação que será apresentado no JSON de retorno
                array_questao_dissertativa = {
                    enunciado: req.body.enunciado,
                    resposta_sugerida: req.body.resposta_sugerida,
                    url_mida: array_url
                }
                break;
            case 'alternativa':
            case 'multipla':
                // inserimos a questão alternativa
                const query_insert_alternativa = `INSERT INTO questao_alternativa VALUES(null,?,?)`;

                var resultado_insert_alternativa = await mysql.execute(query_insert_alternativa, [req.body.enunciado, req.body.num_alternativa])
                id_questao_alternativa = resultado_insert_alternativa.insertId;

                let array_img_al = [];
                let array_url_al = [];

                if(req.body.url_midia)
                {
                    array_img_al = JSON.parse( req.body.url_midia );
                }

                if(req.file)
                {
                    array_img_al = [{ url: req.file.location,
                                  nome: req.file.key,
                                  tipo: req.file.contentType
                            }];
                }
                //inserimos as midias do enunciado
                for(h = 0; h < array_img_al.length;h++)
                {
                    array_url_al.push(array_img_al[h].url);
                    var resultado_insert_midia_alternativa = await mysql.execute("INSERT INTO cdaqts.midia_alternativa VALUES (null, ?, ?, ?, ?)", [array_img_al[h].url, array_img_al[h].nome, array_img_al[h].tipo, id_questao_alternativa])
                }
                //representação que será apresentado no JSON de retorno
                array_questao_alternativa = {
                    enunciado: req.body.enunciado,
                    num_alternativa: req.body.num_alternativa,
                    url_midia: array_url_al
                }

                let arrayAlternativas = JSON.parse( req.body.alternativa );
              
                //inserimos cada alternatica da questão
                for (let i = 0; i < arrayAlternativas.length; i++) {
                    var query_alt = `INSERT INTO alternativa VALUES (null,?,?,?)`
                    var resultado_insert_opcoes = await mysql.execute(query_alt, [id_questao_alternativa , arrayAlternativas[i].conteudo, arrayAlternativas[i].in_correta]);
                    //inserimos as midias de cada alternatica/opção se existir
                    if(arrayAlternativas[i].url_midia)
                    {
                        for(h = 0; h < arrayAlternativas[i].url_midia.length;h++)
                        {
                            var resultado_insert_midia_opcoes = await mysql.execute("INSERT INTO cdaqts.midia_opcoes VALUES (null, ?, ?, ?, ?)", [arrayAlternativas[i].url_midia[h].url, arrayAlternativas[i].url_midia[h].nome, arrayAlternativas[i].url_midia[h].tipo, resultado_insert_opcoes.insertId])
                        }
                    }
                    
                    array_alternativa[i] = {
                        conteudo: arrayAlternativas[i].conteudo,
                        id_questao_alternativa: id_questao_alternativa,
                        url_midia: arrayAlternativas[i].url_midia, 
                        in_correta: arrayAlternativas[i].in_correta
                    }
                }
                
                break;
            default:
                res.status(500).send({ message: 'Erro, tipo não encontrado', code: 14 })
                break;
        }

        var query = `INSERT INTO questao(id_formacao,id_area,id_sub_area,id_sub_sub_area,id_questao_associativa,id_questao_alternativa,id_questao_dissertativa,id_fonte,grau_dificuldade,periodo_recomendado,tipo,id_usuario,privada) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        var result = await mysql.execute(query, [
            req.body.id_formacao, req.body.id_area, req.body.id_sub_area, req.body.id_sub_sub_area, id_questao_associativa, id_questao_alternativa, id_questao_dissertativa, req.body.id_fonte, req.body.grau_dificuldade, req.body.periodo_recomendado, req.body.tipo, req.user.userId, req.body.privada
        ]);

        if(req.body.bnccs != null)
        {
            array_bnccs = JSON.parse( req.body.bnccs);
            for(i = 0; i < array_bnccs.length;i++){
                var query = `INSERT INTO componente_curricular_bncc_questao (id_componente_curricular, id_questao) VALUES (?, ?)`;
                var result_componetes = await mysql.execute(query, [array_bnccs[i], result.insertId]);
            };
        }

        const response = {
<<<<<<< HEAD
            mensagem: 'Questao inserido com sucesso',
            produtoCriado: {
                id_questao: result.insertId,
=======
            mensagem: 'Questão inserida com sucesso',
            questao: {
                id: result.insertId,
>>>>>>> 9a8fd8b480f8b70fc43dcf01bf5486e08ca3f6ab
                id_formacao: req.body.id_formacao,
                id_area: req.body.id_area,
                id_sub_area: req.body.id_sub_area,
                id_sub_sub_area: req.body.id_sub_sub_area,
                id_questao_associativa: id_questao_associativa,
                id_questao_alternativa: id_questao_alternativa,
                id_questao_dissertativa: id_questao_dissertativa,
                id_fonte: req.body.id_fonte,
                grau_dificuldade: req.body.grau_dificuldade,
                periodo_recomendado: req.body.periodo_recomendado,
                date: result.data_criacao,
                tipo: req.body.tipo,
                privada: req.body.privada,
                questao_dissertativa: array_questao_dissertativa,
                questao_alternativa: array_questao_alternativa,
                alternativa: array_alternativa,
                bnccs: array_bnccs,
                usuario: {
                    id_usuario: req.user.userId,
                },
                request: {
                    tipo: 'GET',
                    descricao: 'Recuperar questão cadastrada',
                    url: `http://localhost:3000/questao/espec/${result.insertId}`
                }
            }
        }
        console.log(result.id_questao);
        var query = `INSERT INTO log(id_usuario,descricao_log) VALUES (?,?)`;
        var result_log = await mysql.execute(query, [req.user.userId, `Cadastro de Questão ${result.insertId}`]);



        return res.status(201).send(response);
    } catch (error) {
        return res.status(400).send({mensagem:"erro no cadastro da questão" , code: 168});
    }

};
//não está em uso
exports.patchQuestao = async (req, res, next) => {
    var id_questao_dissertativa = null;
    var id_questao_associativa = null;
    var id_questao_alternativa = null;
    var array_questao_dissertativa = [];
    var array_questao_alternativa = [];
    var array_alternativa = [];
    try {

        switch (req.body.tipo) {

            case 'dissertativa':

                array_questao_dissertativa = {
                    enunciado: req.body.enunciado,
                    resposta_sugerida: req.body.resposta_sugerida,
                    // url_midia: req.body.url_midia
                }
                const query_d = `
                UPDATE questao_dissertativa SET enunciado = ?,resposta_sugerida = ? WHERE id_questao_dissertativa = ? 
            `;
                var result_dissertativa = await mysql.execute(query_d, [req.body.enunciado, req.body.resposta_sugerida, req.body.id_questao_dissertativa])


                break;
            case 'alternativa':
                array_questao_alternativa = {
                    enunciado: req.body.enunciado,
                    num_alternativa: req.body.num_alternativa,
                    // url_midia: req.body.url_midia
                }

                const query_q_alt = `
                UPDATE questao_alternativa SET enunciado ='${req.body.enunciado}',num_alternativa = ${req.body.num_alternativa} WHERE id_questao_alternativa  = ${req.body.id_questao_alternativa}    
                `;

                var result_alternativa = await mysql.execute(query_q_alt)
                id_questao_alternativa = result_alternativa.insertId;




                for (let i = 0; i < req.body.alternativa.length; i++) {
                    var query_alt = `UPDATE alternativa SET conteudo = '${req.body.alternativa[i].conteudo}',in_correta = '${req.body.alternativa[i].in_correta}' WHERE id_alternativa = '${req.body.alternativa[i].id_alternativa}'`;
                    array_alternativa[i] = {
                        conteudo: req.body.alternativa[i].conteudo,
                        id_questao_alternativa: id_questao_alternativa,
                        // url_midia: req.body.alternativa[i].url_midia,
                        in_correta: req.body.alternativa[i].in_correta

                    }

                    var result_alt = await mysql.execute(query_alt);

                    if (result_alt.affectedRows == 0) {

                        var query_alt_insert = `INSERT INTO alternativa VALUES (null,${req.body.id_questao_alternativa},'${req.body.alternativa[i].conteudo}',${req.body.alternativa[i].in_correta})`
                        var result_alt = await mysql.execute(query_alt_insert);

                    }

                }

                break;
            default:
                res.status(500).send({ message: 'Erro tipo não encontrado', code: 14 })
                break;
        }


        var query = `UPDATE questao SET id_formacao = ?,id_area = ?,id_sub_area = ? ,id_sub_sub_area = ?,id_questao_associativa = ?,id_questao_alternativa = ?,id_questao_dissertativa = ?,id_fonte = ?,grau_dificuldade = ?,periodo_recomendado = ?,tipo = ? WHERE id_questao = ?`;
        var result = await mysql.execute(query, [
            req.body.id_formacao, req.body.id_area, req.body.id_sub_area, req.body.id_sub_sub_area, req.body.id_questao_associativa, req.body.id_questao_alternativa, req.body.id_questao_dissertativa, req.body.id_fonte, req.body.grau_dificuldade, req.body.periodo_recomendado, req.body.tipo, req.body.id_questao
        ]);

        const response = {
            mensagem: 'Questao alterada com sucesso',
            questao: {
                id: result.id_questao,
                id_formacao: req.body.id_formacao,
                id_area: req.body.id_area,
                id_sub_area: req.body.id_sub_area,
                id_sub_sub_area: req.body.id_sub_sub_area,
                id_questao_associativa: req.body.id_questao_associativa,
                id_questao_alternativa: req.body.id_questao_alternativa,
                id_questao_dissertativa: req.body.id_questao_dissertativa,
                id_fonte: req.body.id_fonte,
                grau_dificuldade: req.body.grau_dificuldade,
                periodo_recomendado: req.body.periodo_recomendado,
                date: result.data_criacao,
                tipo: req.body.tipo,
                questao_dissertativa: array_questao_dissertativa,
                questao_alternativa: array_questao_alternativa,
                alternativa: array_alternativa,
                request: {
                    tipo: 'POST',
                    descricao: 'Insere um produto',
                    url: 'http://localhost:3000/questao'
                }
            }
        }

        return res.status(201).send(response);
    } catch (error) {
        return res.status(400).send(error);
    }
};
//não está em uso
exports.deleteQuestao = async (req, res, next) => {
    try {

        switch (req.params.tipo) {
            case 'dissertativa':

                const query_d = 'DELETE FROM questao_dissertativa WHERE id_questao_dissertativa = ?';
                var result = await mysql.execute(query_d, [req.params.id]);

                if (result.affectedRows != 0) {
                    const response = {
                        mensagem: 'Questão removido com sucesso ',
                        id: req.params.id,
                        request: {
                            tipo: 'POST',
                            descricao: 'Insere um Questão',
                            url: 'http://localhost:3000/questao',
                            body: {
                                nome: 'string',
                                preco: 'Number'
                            }
                        }

                    }
                    res.status(202).send({ response });
                } else {
                    res.status(202).send({ message: 'Não encontrado esse id:', code: 12 });
                }
                break;
            case 'alternativa':

                const query_alt = 'DELETE FROM questao_alternativa WHERE id_questao_alternativa = ?';
                var result = await mysql.execute(query_alt, [req.params.id]);

                if (result.affectedRows != 0) {
                    const response = {
                        mensagem: 'Questão removido com sucesso ',
                        id: req.params.id,
                        request: {
                            tipo: 'POST',
                            descricao: 'Insere um Questão',
                            url: 'http://localhost:3000/questao',
                            body: {
                                nome: 'string',
                                preco: 'Number'
                            }
                        }

                    }
                    res.status(202).send({ response });
                } else {
                    res.status(202).send({ message: 'Não encontrado esse id:', code: 12 });
                }
                break;
            default:
                res.status(500).send({ message: 'Erro tipo não encontrado', code: 14 })
                break;
        }


    } catch (error) {
        res.status(202).send({ error });
    }
}

exports.getTotal = async (req, res, next) => {
    let filtro = aplicaFiltros(req);
    
    try {
        const query = `SELECT count(*) AS total FROM questao WHERE id_questao IN ( 
                            (SELECT DISTINCT q.id_questao FROM QUESTAO AS q   
                            INNER JOIN cdaqts.fonte as ft
                                ON ft.id_fonte = q.id_fonte
                            INNER JOIN cdaqts.formacao as fm
                                ON fm.id_formacao = q.id_formacao
                            INNER JOIN cdaqts.area as ar
                                ON ar.id_area = q.id_area
                            INNER JOIN cdaqts.sub_area as asb
                                ON asb.id_sub_area = q.id_sub_area
                            INNER JOIN cdaqts.sub_sub_area as assb
                                ON assb.id_sub_sub_area = q.id_sub_sub_area
                            LEFT JOIN cdaqts.componente_curricular_bncc_questao as cq     
                                ON cq.id_questao = q.id_questao
                            WHERE privada = 0 ${filtro}) 
                        )`;
        var result = await mysql.execute(query);

        const response = {
            mensagem: 'Total de questões publicas:',
            total: result[0].total
        }
        res.status(202).send({ response });
              
    } catch (error) {
        res.status(202).send({mensagem: "Erro ao retornar", code: 131});
    }
}

exports.getTotalPrivada = async (req, res, next) => {
    let filtro = aplicaFiltros(req);

    try {
        const query = 
        `SELECT count(*) AS total FROM questao WHERE id_questao IN ( 
                            (SELECT DISTINCT q.id_questao FROM QUESTAO AS q   
                            INNER JOIN cdaqts.fonte as ft
                                ON ft.id_fonte = q.id_fonte
                            INNER JOIN cdaqts.formacao as fm
                                ON fm.id_formacao = q.id_formacao
                            INNER JOIN cdaqts.area as ar
                                ON ar.id_area = q.id_area
                            INNER JOIN cdaqts.sub_area as asb
                                ON asb.id_sub_area = q.id_sub_area
                            INNER JOIN cdaqts.sub_sub_area as assb
                                ON assb.id_sub_sub_area = q.id_sub_sub_area
                            LEFT JOIN cdaqts.componente_curricular_bncc_questao as cq     
                                ON cq.id_questao = q.id_questao
                            WHERE privada = 1 AND q.id_usuario = ? ${filtro}) 
                        )`;
        
        var result = await mysql.execute(query, [req.user.userId]);

        const response = {
            mensagem: 'Total de questões privadas:',
            total: result[0].total
        }
        res.status(202).send({ response });
              
    } catch (error) {
        res.status(202).send({mensagem: "Erro ao retornar", code: 131});
    }
}

exports.publicarQuestao = async (req, res, next) => {
    try 
    {
        if(req.params.id)
        {
            const query = 'UPDATE QUESTAO SET PRIVADA = 0 WHERE id_questao = ?';
            var result = await mysql.execute(query, [req.params.id]);

            if (result.affectedRows != 0) {
                const response = {
                    mensagem: 'Questão publica com sucesso',
                    id: req.params.id
                }
                res.status(202).send({ response });
            }
            else
            {
                const response = {
                    mensagem: 'Questão não encontrada',
                    id: req.params.id,
                    code: 140
                }
                res.status(400).send({ response });
            }
        }
        else
        {
            const response = {
                mensagem: 'Parametro inválido',
                code: 141
            }
            res.status(400).send({ response });
        }

    }
    catch (error) {
        res.status(202).send({mensagem: "Erro ao publicar questão", code: 159});
    }
}

exports.getQuestaoSelecionadas = async (req, res, next) => {
    console.log(req.body.ids.toString());
    try {

        const query = `
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
            q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
             ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', 
            asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area', usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada 
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "alternativa"    
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area
        INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario 
        WHERE q.id_questao in( ? ) 
     
        UNION
     
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
                q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qd.enunciado as enunciado_questao,
                ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area', asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',
                usu.nome as 'nome',usu.email as 'email' ,q.aprovacao,q.privada
        FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_dissertativa as qd
            ON qd.id_questao_dissertativa = q.id_questao_dissertativa and q.tipo = "dissertativa"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
		INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario
        WHERE q.id_questao in( ? ) 
             
        UNION
             
        SELECT q.id_questao, q.id_questao_associativa, q.id_questao_alternativa, q.id_questao_dissertativa,
                q.grau_dificuldade, q.periodo_recomendado, q.data_criacao, q.tipo, qa.enunciado as enunciado_questao,
                 ft.descricao_fonte as 'fonte', fm.descricao_formacao as 'formacao', ar.descricao_area as 'area',
                asb.descricao_sub_area as 'sub_area', assb.descricao_sub_sub_area as 'sub_sub_area',usu.nome as 'nome',usu.email as 'email',q.aprovacao,q.privada
                FROM cdaqts.questao as q
        INNER JOIN  cdaqts.questao_alternativa as qa
            ON qa.id_questao_alternativa = q.id_questao_alternativa and q.tipo = "multipla"
        INNER JOIN cdaqts.fonte as ft
            ON ft.id_fonte = q.id_fonte
        INNER JOIN cdaqts.formacao as fm
            ON fm.id_formacao = q.id_formacao
        INNER JOIN cdaqts.area as ar
            ON ar.id_area = q.id_area
        INNER JOIN cdaqts.sub_area as asb
            ON asb.id_sub_area = q.id_sub_area
        INNER JOIN cdaqts.sub_sub_area as assb
            ON assb.id_sub_sub_area = q.id_sub_sub_area 
        INNER JOIN cdaqts.usuario as usu     
			ON usu.id_usuario = q.id_usuario
        WHERE q.id_questao in( ? )
    `;
        
        try {
            var resultQuestes = await mysql.execute(query, [req.body.ids, req.body.ids, req.body.ids])
        } catch (error) {
            return res.status(400).send({ mensagem: 'Query invalida, nenhum resultado encontrado', code: 20 });
        }

        array_final = [];
       
        for(let j = 0; j < resultQuestes.length; j++)
        {
            let arrayAlternativas = [];
            //se do tipo alternatica ou multipla, buscamos e adicionamos as alternativas
            if(resultQuestes[j].id_questao_alternativa != null)
            {
                var query2 = `SELECT * FROM alternativa WHERE id_questao_alternativa = ?`;
                arrayAlternativas = await mysql.execute(query2, [resultQuestes[j].id_questao_alternativa]); 
                
                for(k = 0; k < arrayAlternativas.length;k++)
                {
                    arrayMidiaOpcoes = await mysql.execute("SELECT url, tipo FROM midia_opcoes WHERE id_alternativa = ?", [arrayAlternativas[k].id_alternativa]);
                    arrayAlternativas[k].url_mida = arrayMidiaOpcoes;
                }
            }

            let arrayBnccs = [];
            var query3 = `SELECT id_componente_curricular AS "id_bncc" FROM componente_curricular_bncc_questao WHERE id_questao = ?`;
            arrayBnccs = await mysql.execute(query3, [resultQuestes[j].id_questao]); 

            let arrayMidia = [];
            var query4 = `SELECT url FROM cdaqts.midia_dissertativa WHERE id_questao_dissertativa = ?
                            UNION
                          SELECT url FROM cdaqts.midia_alternativa WHERE id_questao_alternativa = ?`;
            arrayMidia = await mysql.execute(query4, [resultQuestes[j].id_questao_dissertativa, resultQuestes[j].id_questao_alternativa]); 

            array_final.push({
                id: resultQuestes[j].id_questao,
                id_questao_associativa: resultQuestes[j].id_questao_associativa,
                id_questao_alternativa: resultQuestes[j].id_questao_alternativa,
                id_questao_dissertativa: resultQuestes[j].id_questao_dissertativa,
                grau_dificuldade: resultQuestes[j].grau_dificuldade,
                periodo_recomendado: resultQuestes[j].periodo_recomendado,
                data_criacao: resultQuestes[j].data_criacao,
                tipo: resultQuestes[j].tipo,
                descricao_fonte: resultQuestes[j].fonte,
                formacao: resultQuestes[j].formacao,
                area: resultQuestes[j].area,
                sub_area: resultQuestes[j].sub_area,
                sub_sub_area: resultQuestes[j].sub_sub_area,
                aprovacao: resultQuestes[j].aprovacao,
                privada: resultQuestes[j].privada,
                usuario: {
                    nome: resultQuestes[j].nome,
                    email: resultQuestes[j].email
                },
                questao: {
                    enunciado: resultQuestes[j].enunciado_questao,
                    url_midia: arrayMidia
                },
                bnccs: arrayBnccs,
                alternativa: arrayAlternativas,
                request: {
                    tipo: 'GET',
                    descricao: 'Retorna questão específica.',
                    url: 'http://localhost:3000/questao/privada/espec/' + resultQuestes[j].id_questao
                }
    
            });
            
        }
    
        if (array_final.length == 0) {
            return res.status(400).send({ mensagem: 'Nenhum resultado encontrado',code:16 });
        } else {
            var response = {
                quantidade: array_final.length,
                questao: array_final
            }
        }

        return res.status(200).send(response);             
      
    } catch (error) {
        return res.status(400).send({mensagem: "Erro ao retornar", code: 131});
    }
};
