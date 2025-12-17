import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuração de carga para teste de performance GraphQL
export const options = {
    vus: 10,
    duration: '30s',

    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<3000'],
        http_req_failed: ['rate<0.01'],
        'http_req_duration{name:graphql_register}': ['p(95)<1500'],
        'http_req_duration{name:graphql_login}': ['p(95)<1000'],
        'http_req_duration{name:graphql_checkout}': ['p(95)<2000'],
        'http_req_duration{name:graphql_users}': ['p(95)<1000']
    }
};

let emailCounter = 0;

export default function () {
    const GRAPHQL_URL = 'http://localhost:4000/graphql';
    let token = '';

    emailCounter++;
    const uniqueEmail = `user_graphql_${__VU}_${__ITER}_${Date.now()}_${emailCounter}@test.com`;

    // Grupo 1: Registro de usuário via GraphQL
    group('GraphQL - Registro de usuário', function () {
        const registerMutation = {
            query: `
                mutation Register($name: String!, $email: String!, $password: String!) {
                    register(name: $name, email: $email, password: $password) {
                        email
                        name
                    }
                }
            `,
            variables: {
                name: `Test User GraphQL ${__VU}`,
                email: uniqueEmail,
                password: 'senha123'
            }
        };

        const registerResponse = http.post(
            GRAPHQL_URL,
            JSON.stringify(registerMutation),
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                tags: { name: 'graphql_register' }
            }
        );

        check(registerResponse, {
            'graphql registro: status é 200': (res) => res.status === 200,
            'graphql registro: sem erros': (res) => !res.json('errors'),
            'graphql registro: retorna email': (res) => res.json('data.register.email') !== undefined,
            'graphql registro: retorna nome': (res) => res.json('data.register.name') !== undefined
        });

        sleep(0.5);
    });

    // Grupo 2: Login via GraphQL
    group('GraphQL - Login de usuário', function () {
        const loginMutation = {
            query: `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                    }
                }
            `,
            variables: {
                email: uniqueEmail,
                password: 'senha123'
            }
        };

        const loginResponse = http.post(
            GRAPHQL_URL,
            JSON.stringify(loginMutation),
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                tags: { name: 'graphql_login' }
            }
        );

        check(loginResponse, {
            'graphql login: status é 200': (res) => res.status === 200,
            'graphql login: sem erros': (res) => !res.json('errors'),
            'graphql login: retorna token': (res) => res.json('data.login.token') !== undefined
        });

        token = loginResponse.json('data.login.token');
        sleep(0.5);
    });

    // Grupo 3: Checkout com boleto via GraphQL
    group('GraphQL - Checkout com boleto', function () {
        const checkoutMutation = {
            query: `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!, $cardData: CardDataInput) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod, cardData: $cardData) {
                        freight
                        items {
                            productId
                            quantity
                        }
                        paymentMethod
                        userId
                        valorFinal
                    }
                }
            `,
            variables: {
                items: [
                    { productId: 1, quantity: 2 },
                    { productId: 2, quantity: 1 }
                ],
                freight: 20,
                paymentMethod: 'boleto'
            }
        };

        const checkoutResponse = http.post(
            GRAPHQL_URL,
            JSON.stringify(checkoutMutation),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                tags: { name: 'graphql_checkout' }
            }
        );

        check(checkoutResponse, {
            'graphql checkout boleto: status é 200': (res) => res.status === 200,
            'graphql checkout boleto: sem erros': (res) => !res.json('errors'),
            'graphql checkout boleto: retorna valorFinal': (res) => res.json('data.checkout.valorFinal') !== undefined,
            'graphql checkout boleto: método correto': (res) => res.json('data.checkout.paymentMethod') === 'boleto'
        });

        sleep(0.5);
    });

    // Grupo 4: Checkout com cartão de crédito via GraphQL
    group('GraphQL - Checkout com cartão', function () {
        const checkoutMutation = {
            query: `
                mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!, $cardData: CardDataInput) {
                    checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod, cardData: $cardData) {
                        freight
                        items {
                            productId
                            quantity
                        }
                        paymentMethod
                        userId
                        valorFinal
                    }
                }
            `,
            variables: {
                items: [
                    { productId: randomIntBetween(1, 2), quantity: randomIntBetween(1, 3) }
                ],
                freight: 15,
                paymentMethod: 'credit_card',
                cardData: {
                    number: '4111111111111111',
                    name: 'Test User',
                    expiry: '12/30',
                    cvv: '123'
                }
            }
        };

        const checkoutResponse = http.post(
            GRAPHQL_URL,
            JSON.stringify(checkoutMutation),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                tags: { name: 'graphql_checkout' }
            }
        );

        check(checkoutResponse, {
            'graphql checkout cartão: status é 200': (res) => res.status === 200,
            'graphql checkout cartão: sem erros': (res) => !res.json('errors'),
            'graphql checkout cartão: retorna valorFinal': (res) => res.json('data.checkout.valorFinal') !== undefined,
            'graphql checkout cartão: método correto': (res) => res.json('data.checkout.paymentMethod') === 'credit_card'
        });

        sleep(0.5);
    });

    // Grupo 5: Consulta de usuários via GraphQL
    group('GraphQL - Consulta de usuários', function () {
        const usersQuery = {
            query: `
                query Users {
                    users {
                        email
                        name
                    }
                }
            `
        };

        const usersResponse = http.post(
            GRAPHQL_URL,
            JSON.stringify(usersQuery),
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                tags: { name: 'graphql_users' }
            }
        );

        check(usersResponse, {
            'graphql users: status é 200': (res) => res.status === 200,
            'graphql users: sem erros': (res) => !res.json('errors'),
            'graphql users: retorna lista': (res) => Array.isArray(res.json('data.users'))
        });

        sleep(0.5);
    });

    // Grupo 6: Login com usuário existente
    group('GraphQL - Login usuário existente', function () {
        const loginMutation = {
            query: `
                mutation Login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                    }
                }
            `,
            variables: {
                email: 'alice@email.com',
                password: '123456'
            }
        };

        const loginResponse = http.post(
            GRAPHQL_URL,
            JSON.stringify(loginMutation),
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                tags: { name: 'graphql_login' }
            }
        );

        check(loginResponse, {
            'graphql login existente: status é 200': (res) => res.status === 200,
            'graphql login existente: retorna token': (res) => res.json('data.login.token') !== undefined
        });

        const existingToken = loginResponse.json('data.login.token');

        if (existingToken) {
            const checkoutMutation = {
                query: `
                    mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!) {
                        checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod) {
                            valorFinal
                            paymentMethod
                        }
                    }
                `,
                variables: {
                    items: [{ productId: 1, quantity: 1 }],
                    freight: 10,
                    paymentMethod: 'boleto'
                }
            };

            const checkoutResponse = http.post(
                GRAPHQL_URL,
                JSON.stringify(checkoutMutation),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${existingToken}`
                    },
                    tags: { name: 'graphql_checkout' }
                }
            );

            check(checkoutResponse, {
                'graphql checkout existente: status é 200': (res) => res.status === 200,
                'graphql checkout existente: sem erros': (res) => !res.json('errors')
            });
        }

        sleep(0.5);
    });

    // Simula tempo de pensamento do usuário
    group('Simulando pensamento do usuário', function () {
        sleep(1);
    });
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'test/k6/summary-graphql.json': JSON.stringify(data),
        'test/k6/report-graphql.html': htmlReport(data)
    };
}

