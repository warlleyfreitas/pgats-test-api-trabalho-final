const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');

const app = require('../../../pgats-test-api-trabalho-final/rest/app');

// Testes
describe('Checkout Controller', () => {
    describe('POST api/checkout', () => {

        before(async () => {
            const respostaRegister = await request(app)
                .post('/api/users/register')
                .send({
                    name: 'warlley',
                    email: 'warlley.freitas@live.com',
                    password: '123456'
                });
        });

        beforeEach(async () => {
            const respostaLogin = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'warlley.freitas@live.com',
                    password: '123456'
                });

            token = respostaLogin.body.token;
        });

        it('Checkout realizado com sucesso retorna 200', async () => {
            const resposta = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    "items": [
                        {
                            "productId": 1,
                            "quantity": 10
                        }
                    ],
                    "freight": 50,
                    "paymentMethod": "boleto",
                    "cardData": {
                        "number": "12345678",
                        "name": "Warlley Freitas",
                        "expiry": "12/30",
                        "cvv": "545"
                    }
                });

            expect(resposta.status).to.equal(200);
        });

        it('Checkout com token inválido retorna 401', async () => {
            const resposta = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}+1`)
                .send({
                    "items": [
                        {
                            "productId": 1,
                            "quantity": 10
                        }
                    ],
                    "freight": 50,
                    "paymentMethod": "boleto",
                    "cardData": {
                        "number": "12345678",
                        "name": "Warlley Freitas",
                        "expiry": "12/30",
                        "cvv": "545"
                    }
                });

            expect(resposta.status).to.equal(401);
            expect(resposta.body).to.have.property('error', 'Token inválido');
        });

        it('Erro no Checkout retorna 400', async () => {
            const resposta = await request(app)
                .post('/api/checkout')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    "items": [
                        {
                            "productId": 3,
                            "quantity": 10
                        }
                    ],
                    "freight": 50,
                    "paymentMethod": "boleto",
                    "cardData": {
                        "number": "12345678",
                        "name": "Warlley Freitas",
                        "expiry": "12/30",
                        "cvv": "545"
                    }
                });

            expect(resposta.status).to.equal(400);
            expect(resposta.body).to.have.property('error', 'Produto não encontrado');
        });
    });

});
