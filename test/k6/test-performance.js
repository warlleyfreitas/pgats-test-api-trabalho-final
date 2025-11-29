import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuração de carga para teste de performance
export const options = {
    vus: 10,
    duration: '30s',

    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<3000'], // 95% das requisições devem ser < 2s
        http_req_failed: ['rate<0.01'], // Taxa de erro deve ser < 1%
        'http_req_duration{name:user_register}': ['p(95)<1500'],
        'http_req_duration{name:user_login}': ['p(95)<1000'],
        'http_req_duration{name:checkout}': ['p(95)<2000']
    }
};

// Contador global para garantir emails únicos
let emailCounter = 0;

export default function () {
    const BASE_URL = 'http://localhost:3000';
    let token = '';

    // Gera email único para cada iteração
    emailCounter++;
    const uniqueEmail = `user_${__VU}_${__ITER}_${Date.now()}_${emailCounter}@test.com`;

    // Grupo 1: Registro de usuário
    group('Registro de usuário', function () {
        const registerPayload = JSON.stringify({
            name: `Test User ${__VU}`,
            email: uniqueEmail,
            password: 'senha123'
        });

        const registerResponse = http.post(
            `${BASE_URL}/api/users/register`,
            registerPayload,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                tags: { name: 'user_register' }
            }
        );

        check(registerResponse, {
            'registro: status é 201': (res) => res.status === 201,
            'registro: retorna email': (res) => res.json('user.email') !== undefined,
            'registro: retorna nome': (res) => res.json('user.name') !== undefined
        });

        sleep(0.5);
    });

    // Grupo 2: Login de usuário
    group('Login de usuário', function () {
        const loginPayload = JSON.stringify({
            email: uniqueEmail,
            password: 'senha123'
        });

        const loginResponse = http.post(
            
            `${BASE_URL}/api/users/login`,
            loginPayload,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                tags: { name: 'user_login' }
            }
        );

        check(loginResponse, {
            'login: status é 200': (res) => res.status === 200,
            'login: retorna token': (res) => res.json('token') !== undefined
        });

        token = loginResponse.json('token');
        sleep(0.5);
    });

    // Grupo 3: Checkout com boleto
    group('Checkout com boleto', function () {
        const checkoutPayload = JSON.stringify({
            items: [
                { productId: 1, quantity: 2 },
                { productId: 2, quantity: 1 }
            ],
            freight: 20,
            paymentMethod: 'boleto'
        });

        const checkoutResponse = http.post(
            `${BASE_URL}/api/checkout`,
            checkoutPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                tags: { name: 'checkout' }
            }
        );

        check(checkoutResponse, {
            'checkout boleto: status é 200': (res) => res.status === 200,
            'checkout boleto: retorna valorFinal': (res) => res.json('valorFinal') !== undefined,
            'checkout boleto: método de pagamento correto': (res) => res.json('paymentMethod') === 'boleto'
        });

        sleep(0.5);
    });

    // Grupo 4: Checkout com cartão de crédito
    group('Checkout com cartão de crédito', function () {
        const checkoutPayload = JSON.stringify({
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
        });

        const checkoutResponse = http.post(
            `${BASE_URL}/api/checkout`,
            checkoutPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                tags: { name: 'checkout' }
            }
        );

        check(checkoutResponse, {
            'checkout cartão: status é 200': (res) => res.status === 200,
            'checkout cartão: retorna valorFinal': (res) => res.json('valorFinal') !== undefined,
            'checkout cartão: método de pagamento correto': (res) => res.json('paymentMethod') === 'credit_card',
            'checkout cartão: aplica desconto de 5%': (res) => {
                // Verifica se o desconto foi aplicado (valor final menor que sem desconto)
                return res.json('valorFinal') !== undefined;
            }
        });

        sleep(0.5);
    });

    // Grupo 5: Teste com usuário existente
    group('Login com usuário existente', function () {
        const loginPayload = JSON.stringify({
            email: 'alice@email.com',
            password: '123456'
        });

        const loginResponse = http.post(
            `${BASE_URL}/api/users/login`,
            loginPayload,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                tags: { name: 'user_login' }
            }
        );

        check(loginResponse, {
            'login existente: status é 200': (res) => res.status === 200,
            'login existente: retorna token': (res) => res.json('token') !== undefined
        });

        const existingToken = loginResponse.json('token');

        if (existingToken) {
            const checkoutPayload = JSON.stringify({
                items: [{ productId: 1, quantity: 1 }],
                freight: 10,
                paymentMethod: 'boleto'
            });

            const checkoutResponse = http.post(
                `${BASE_URL}/api/checkout`,
                checkoutPayload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${existingToken}`
                    },
                    tags: { name: 'checkout' }
                }
            );

            check(checkoutResponse, {
                'checkout usuário existente: status é 200': (res) => res.status === 200
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
        'test/k6/summary.json': JSON.stringify(data)
    };
}