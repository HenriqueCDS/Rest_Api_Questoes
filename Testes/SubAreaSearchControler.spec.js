const app = require("../app");
const request = require("supertest");
const { User } = require("../app");
const mysql = require('../mysql').pool




describe("SEARCH ALL ", () => {

  it("Deve pesquisar todos os registro", async () => {

    const response = await request(app).get("/SubArea/espec/1").send({

    });
    console.log(response.body);
    console.log(response.status);
    expect(response.status).toBe(200);

  });

  it("Deve pesquisar todos os registro", async () => {

    const response = await request(app).get("/SubArea/espec/1").send({

    });
    console.log(response.body);
    console.log(response.status);
    expect(response.status).not.toBe(500);

  });

});

