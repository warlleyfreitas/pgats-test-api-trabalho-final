const request = require('supertest');
const { expect } = require('chai');
require('dotenv').config();

// Testes
describe('Checkout GraphQL External', () => {
    let token;

    describe('Mutation register', () => {
        it('Registro de usuário com sucesso retorna dados do usuário', async () => {
            const mutation = `
                mutation Register($name: String!, $email: String!, $password: String!) {
                    register(name: $name, email: $email, password: $password) {
                        name
                        email
                    }
                }
            `;

            const variables = {
                name: 'Warlley',
                email: 'warlley@email.com',
                password: '123456'
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.data.register).to.have.property('name', 'Warlley');
            expect(resposta.body.data.register).to.have.property('email', 'warlley@email.com');
        });

        it('Registro com email já existente retorna erro', async () => {
            const mutation = `
                mutation Register($name: String!, $email: String!, $password: String!) {
                    register(name: $name, email: $email, password: $password) {
                        name
                        email
                    }
                }
            `;

            const variables = {
                name: 'Alice Duplicate',
                email: 'alice@email.com', // Email já existe nos dados iniciais
                password: '123456'
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.errors).to.exist;
            expect(resposta.body.errors[0].message).to.equal('Email já cadastrado');
        });
    });

    describe('Mutation login', () => {
        before(async () => {
            
            const mutation = `
                mutation Register($name: String!, $email: String!, $password: String!) {
                    register(name: $name, email: $email, password: $password) {
                        name
                        email
                        password
                    }
                }
            `;

            const variables = {
                name: 'Alice',
                email: 'alice@email.com',
                password: '123456'
            };

            await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .send({
                    query: mutation,
                    variables: variables
                });
        });

        it('Login com credenciais válidas retorna token', async () => {
            const mutation = `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                        user {
                            name
                            email
                        }
                    }
                }
            `;

            const variables = {
                email: 'alice@email.com',
                password: '123456'
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.data.login).to.have.property('token');
            expect(resposta.body.data.login.user).to.have.property('name', 'Alice');
            expect(resposta.body.data.login.user).to.have.property('email', 'alice@email.com');

            token = resposta.body.data.login.token; // Salva token para próximos testes
        });

        it('Login com credenciais inválidas retorna erro', async () => {
            const mutation = `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                        user {
                            name
                            email
                        }
                    }
                }
            `;

            const variables = {
                email: 'alice@email.com',
                password: 'senhaerrada'
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.errors).to.exist;
            expect(resposta.body.errors[0].message).to.equal('Credenciais inválidas');
        });
    });

    describe('Query users', () => {
        it('Consulta de usuários retorna lista de usuários', async () => {
            const query = `
                query Users {
                    users {
                        name
                        email
                    }
                }
            `;

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .send({
                    query: query
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.data.users).to.be.an('array');
            expect(resposta.body.data.users.length).to.be.greaterThan(0);
            expect(resposta.body.data.users[0]).to.have.property('name');
            expect(resposta.body.data.users[0]).to.have.property('email');
        });
    });

    describe('Mutation checkout', () => {
        beforeEach(async () => {
            // Faz login para obter token válido antes de cada teste de checkout
            const mutation = `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                    }
                }
            `;

            const variables = {
                email: 'alice@email.com',
                password: '123456'
            };

            const respostaLogin = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .send({
                    query: mutation,
                    variables: variables
                });

            token = respostaLogin.body.data.login.token;
        });

        it('Checkout realizado com sucesso retorna dados do pedido', async () => {
            const mutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!, $cardData: CardDataInput) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod, cardData: $cardData) {
                        userId
                        valorFinal
                        paymentMethod
                        freight
                        items {
                            productId
                            quantity
                        }
                    }
                }
            `;

            const variables = {
                items: [
                    {
                        productId: 1,
                        quantity: 10
                    }
                ],
                freight: 50,
                paymentMethod: "boleto"
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.data.checkout).to.have.property('userId');
            expect(resposta.body.data.checkout).to.have.property('valorFinal');
            expect(resposta.body.data.checkout).to.have.property('paymentMethod', 'boleto');
            expect(resposta.body.data.checkout).to.have.property('freight', 50);
            expect(resposta.body.data.checkout.items).to.be.an('array');
            expect(resposta.body.data.checkout.items[0]).to.have.property('productId', 1);
            expect(resposta.body.data.checkout.items[0]).to.have.property('quantity', 10);
        });

        it('Checkout com token inválido retorna erro', async () => {
            const mutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                        userId
                        valorFinal
                        paymentMethod
                        freight
                        items {
                            productId
                            quantity
                        }
                    }
                }
            `;

            const variables = {
                items: [
                    {
                        productId: 1,
                        quantity: 10
                    }
                ],
                freight: 50,
                paymentMethod: "boleto"
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .set('Authorization', `Bearer ${token}invalid`)
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.errors).to.exist;
            expect(resposta.body.errors[0].message).to.equal('Token inválido');
        });

        it('Checkout sem token retorna erro', async () => {
            const mutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                        userId
                        valorFinal
                        paymentMethod
                        freight
                        items {
                            productId
                            quantity
                        }
                    }
                }
            `;

            const variables = {
                items: [
                    {
                        productId: 1,
                        quantity: 10
                    }
                ],
                freight: 50,
                paymentMethod: "boleto"
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.errors).to.exist;
            expect(resposta.body.errors[0].message).to.equal('Token inválido');
        });

        it('Erro no Checkout com produto inexistente retorna erro', async () => {
            const mutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                        userId
                        valorFinal
                        paymentMethod
                        freight
                        items {
                            productId
                            quantity
                        }
                    }
                }
            `;

            const variables = {
                items: [
                    {
                        productId: 999, // Produto que não existe
                        quantity: 10
                    }
                ],
                freight: 50,
                paymentMethod: "boleto"
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.errors).to.exist;
            expect(resposta.body.errors[0].message).to.equal('Produto não encontrado');
        });

        it('5% de desconto no valor total se pagar com cartão', async () => {
            const mutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!, $cardData: CardDataInput) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod, cardData: $cardData) {
                        userId
                        valorFinal
                        paymentMethod
                        freight
                        items {
                            productId
                            quantity
                        }
                    }
                }
            `;

            const variables = {
                items: [
                    {
                        productId: 2, // Produto B - R$200
                        quantity: 10
                    }
                ],
                freight: 0,
                paymentMethod: "credit_card",
                cardData: {
                    number: "4111111111111111",
                    name: "Warlley Freitas",
                    expiry: "12/30",
                    cvv: "123"
                }
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.data.checkout).to.have.property('paymentMethod', 'credit_card');

            // Valor esperado: (200 * 10) * 0.95 + 0 = 1900
            const expectedValue = (200 * 10) * 0.95;
            expect(resposta.body.data.checkout.valorFinal).to.equal(expectedValue);
        });

        it('Checkout com cartão sem dados do cartão retorna erro', async () => {
            const mutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                        userId
                        valorFinal
                        paymentMethod
                        freight
                        items {
                            productId
                            quantity
                        }
                    }
                }
            `;

            const variables = {
                items: [
                    {
                        productId: 1,
                        quantity: 1
                    }
                ],
                freight: 10,
                paymentMethod: "credit_card"
                // cardData não fornecido
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.errors).to.exist;
            expect(resposta.body.errors[0].message).to.equal('Dados do cartão obrigatórios para pagamento com cartão');
        });

        it('Resposta do checkout contém valor final', async () => {
            const mutation = `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                        userId
                        valorFinal
                        paymentMethod
                        freight
                        items {
                            productId
                            quantity
                        }
                    }
                }
            `;

            const variables = {
                items: [
                    {
                        productId: 1, // Produto A - R$100
                        quantity: 10
                    }
                ],
                freight: 10,
                paymentMethod: "boleto"
            };

            const resposta = await request(process.env.BASE_URL_GRAPHQL || 'http://localhost:4000')
                .post('/graphql')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    query: mutation,
                    variables: variables
                });

            expect(resposta.status).to.equal(200);
            expect(resposta.body.data.checkout).to.have.property('valorFinal');

            // Valor esperado: (100 * 10) + 10 = 1010
            const expectedValue = (100 * 10) + 10;
            expect(resposta.body.data.checkout.valorFinal).to.equal(expectedValue);
        });

        afterEach(() => {
            // Cleanup se necessário
        });
    });
});
