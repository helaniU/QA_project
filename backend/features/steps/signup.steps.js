const { When, Then } = require("@cucumber/cucumber");
const request = require("supertest");
const { app } = require("../../index");
const assert = require("assert");

let response;
let signupData;

When(
  'I signup with name {string}, email {string} and password {string}',
  async function (name, email, password) {
    signupData = { name, email, password };
    response = await request(app)
      .post("/api/auth/register")
      .send(signupData);
  }
);

Then("the signup should be successful", function () {
  assert.strictEqual(response.status, 201);
  assert.ok(response.body.id);
  assert.strictEqual(response.body.name, signupData.name); // compare with stored input
  assert.strictEqual(response.body.email, signupData.email);
});

Then("I should see a signup failure", function () {
  assert.strictEqual(response.status, 400);
});
