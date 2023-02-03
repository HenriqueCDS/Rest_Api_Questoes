const express = require('express');
const app = express();
const morgan = require('morgan');
const BodyParser = require('body-parser');

require("dotenv").config({
   Pattern: process.env.NODE_ENV === 'test' ? ".env.test" : ".env"
 });

const userRoute = require('./routes/user'); 
const rotaQuestao = require('./routes/questao');
const rotaFontes = require('./routes/fontes');
const rotaFormacao = require('./routes/formacao');
const rotaArea = require('./routes/area');
const rotaSubArea = require('./routes/subArea'); 
const rotaSubSubArea = require('./routes/subsubArea'); 
const feedbackRoute = require('./routes/feedback'); 
const rotaComponente_bncc = require('./routes/componente_curricular_bncc');

const bodyParser = require('body-parser');
const req = require('express/lib/request');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

app.use((req,res,next) => {
   res.header('Acess-Control-Allow-Origin','*'); 
   res.header(
   'Acess-Control-Allow-Header',
   'Origin , X-Requreested-With, Content-Type, Accept, Autorization');

   if( req.method === 'OPTIONS'){
      res.header('Acess-Control-Allow-Methods','PUT,POST,PACTH,DELETE,GET');
      return res.status(200).send({});   
      }
      
      next();   
});

   
//rotas
app.use('/user', userRoute);
app.use('/questao', rotaQuestao);
app.use('/fonte',rotaFontes);
app.use('/formacao',rotaFormacao);
app.use('/area',rotaArea);
app.use('/SubArea',rotaSubArea);
app.use('/SubSubArea',rotaSubSubArea);
app.use('/componente_bncc',rotaComponente_bncc);
app.use('/feedback', feedbackRoute);


//quando não encontra rota
app.use((req, res, next) => {
 const erro = new Error('Não encontrado');
 erro.status = 404;
 next(erro);
});

app.use((error, red, res, next) => {
   res.status(error.status || 500);
   return res.send({
      message: {
         message: error.message
      }
   });
});


module.exports = app;
