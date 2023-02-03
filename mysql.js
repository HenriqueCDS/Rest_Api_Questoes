const mysql = require('mysql');
require("dotenv").config({
    Pattern: process.env.NODE_ENV === 'test' ? ".env.test" : ".env"
  });
  

var pool = mysql.createPool({
    host: process.env.DB_HOST_LOG,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name:process.env.DB_NAME,
    port:process.env.DB_PORT,
    database:  process.env.NODE_ENV === "test" ? "cdaqts" : "cdaqts",
    
});

exports.execute = (query, params=[]) => {
  return new Promise((resolve, reject) => {
      pool.query(query, params, (error, result, fields) => {
          if (error) {    
              reject(error);      
          } else {
              resolve(result)
          }
      });
  })
}




exports.pool = pool;

