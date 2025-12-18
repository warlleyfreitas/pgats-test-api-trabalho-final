import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { SharedArray } from 'k6/data';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ============ HELPERS ============
import { randomEmail, randomName, randomPassword, randomCreditCard, randomCVV, randomCardExpiry } from './helpers/randomData.js';
import { register, login, validateRegister, validateLogin } from './helpers/authHelpers.js';
import { checkoutBoleto, checkoutCreditCard, validateCheckout, validateCreditCardDiscount } from './helpers/checkoutHelpers.js';

// ============ VARIÁVEIS DE AMBIENTE ============
const BASE_URL = __ENV.BASE_URL_REST || 'http://localhost:3000';

// ============ DATA-DRIVEN TESTING com SharedArray ============
const products = new SharedArray('products', function () {
    return JSON.parse(open('./data/products.json'));
});

const existingUsers = new SharedArray('existing_users', function () {
    return JSON.parse(open('./data/users.json'));
});

// ============ TRENDS CUSTOMIZADOS ============
const registerDuration = new Trend('custom_register_duration');
const loginDuration = new Trend('custom_login_duration');
const checkoutDuration = new Trend('custom_checkout_duration');

// ============ COUNTERS ============
const checkoutSuccessCounter = new Counter('checkout_success_count');
const checkoutErrorCounter = new Counter('checkout_error_count');

// ============ CONFIGURAÇÃO COM STAGES ============
export const options = {
    stages: [
        { duration: '10s', target: 5 },   // Ramp up para 5 usuários
        { duration: '20s', target: 10 },  // Ramp up para 10 usuários
        { duration: '30s', target: 10 },  // Mantém 10 usuários
        { duration: '10s', target: 15 },  // Spike para 15 usuários
        { duration: '10s', target: 5 },   // Ramp down para 5 usuários
        { duration: '10s', target: 0 }    // Ramp down para 0
    ],

    // ============ THRESHOLDS ============
    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<3000'], // 95% das requisições devem ser < 2s
        http_req_failed: ['rate<0.01'], // Taxa de erro deve ser < 1%
        'http_req_duration{name:user_register}': ['p(95)<1500'],
        'http_req_duration{name:user_login}': ['p(95)<1000'],
        'http_req_duration{name:checkout_boleto}': ['p(95)<2000'],
        'http_req_duration{name:checkout_credit_card}': ['p(95)<2000'],

        // Thresholds customizados para Trends
        'custom_register_duration': ['p(95)<1500'],
        'custom_login_duration': ['p(95)<1000'],
        'custom_checkout_duration': ['p(95)<2000'],

        // Thresholds para Counters
        'checkout_success_count': ['count>50'],
        'checkout_error_count': ['count<5']
    }
};

// ============ FUNÇÃO PRINCIPAL DE TESTE ============
export default function () {
    // ============ GROUPS - Registro de novo usuário ============
    group('Registro de usuário', function () {
        const userEmail = randomEmail();  // Faker simulado
        const userName = randomName();     // Faker simulado
        const userPassword = randomPassword(); // Faker simulado

        const response = register(userEmail, userPassword, userName); // Helper

        // Trend customizado
        registerDuration.add(response.timings.duration);

        // Checks
        validateRegister(response); // Helper de validação

        // Reaproveitamento de resposta para próximos grupos
        const token = response.json('user') ? login(userEmail, userPassword).json('token') : null;

        if (token) {
            testarCheckoutComNovoUsuario(token); // Helper interno
        }

        sleep(0.5);
    });

    // ============ GROUPS - Data-Driven Testing com usuários existentes ============
    group('Login com usuário existente (Data-Driven)', function () {
        const userData = existingUsers[__VU % existingUsers.length]; // Data-Driven Testing

        const response = login(userData.email, userData.password); // Helper

        // Trend customizado
        loginDuration.add(response.timings.duration);

        // Checks
        const loginSuccess = validateLogin(response); // Helper de validação

        // Reaproveitamento de resposta
        const token = response.json('token');

        if (loginSuccess && token) {
            testarCheckoutComUsuarioExistente(token); // Helper interno
        }

        sleep(0.5);
    });

    // ============ GROUPS - Checkout com dados variados (Data-Driven) ============
    group('Checkout com produtos variados (Data-Driven)', function () {
        const userEmail = randomEmail();
        const userName = randomName();
        const userPassword = randomPassword();

        const registerResponse = register(userEmail, userPassword, userName);

        if (registerResponse.status === 201) {
            const loginResponse = login(userEmail, userPassword);
            const token = loginResponse.json('token');

            if (token) {
                // Data-Driven: usa produto do array SharedArray
                const product = products[__ITER % products.length];
                const items = [{ productId: product.productId, quantity: product.quantity }];

                const checkoutResponse = checkoutBoleto(token, items, randomIntBetween(10, 30)); // Helper

                // Trend customizado
                checkoutDuration.add(checkoutResponse.timings.duration);

                // Checks
                const success = validateCheckout(checkoutResponse, 'boleto'); // Helper de validação

                // Counters
                if (success) {
                    checkoutSuccessCounter.add(1);
                } else {
                    checkoutErrorCounter.add(1);
                }
            }
        }

        sleep(0.5);
    });
}

// ============ HELPER INTERNO - Teste de checkout com novo usuário ============
function testarCheckoutComNovoUsuario(token) {
    group('Checkout com boleto - Novo usuário', function () {
        const items = [
            { productId: randomIntBetween(1, 2), quantity: randomIntBetween(1, 3) }
        ];

        const response = checkoutBoleto(token, items, 20); // Helper

        // Trend customizado
        checkoutDuration.add(response.timings.duration);

        // Checks
        const success = validateCheckout(response, 'boleto'); // Helper de validação

        // Counters
        if (success) {
            checkoutSuccessCounter.add(1);
        } else {
            checkoutErrorCounter.add(1);
        }
    });

    group('Checkout com cartão - Novo usuário', function () {
        const items = [
            { productId: 1, quantity: 2 }
        ];

        const cardData = {
            number: randomCreditCard(),    // Faker simulado
            name: randomName(),            // Faker simulado
            expiry: randomCardExpiry(),    // Faker simulado
            cvv: randomCVV()               // Faker simulado
        };

        const response = checkoutCreditCard(token, items, 15, cardData); // Helper

        // Trend customizado
        checkoutDuration.add(response.timings.duration);

        // Checks
        validateCheckout(response, 'credit_card'); // Helper de validação
        validateCreditCardDiscount(response); // Helper de validação específica

        // Counters
        if (response.status === 200) {
            checkoutSuccessCounter.add(1);
        } else {
            checkoutErrorCounter.add(1);
        }
    });
}

// ============ HELPER INTERNO - Teste de checkout com usuário existente ============
function testarCheckoutComUsuarioExistente(token) {
    group('Checkout usuário existente', function () {
        // Data-Driven: usa produto do array SharedArray
        const product = products[__VU % products.length];
        const items = [{ productId: product.productId, quantity: product.quantity }];

        const response = checkoutBoleto(token, items, 10); // Helper

        // Trend customizado
        checkoutDuration.add(response.timings.duration);

        // Checks
        const success = check(response, {
            'checkout usuário existente: status é 200': (res) => res.status === 200
        });

        // Counters
        if (success) {
            checkoutSuccessCounter.add(1);
        } else {
            checkoutErrorCounter.add(1);
        }
    });
}

export function handleSummary(data) {
    const summary = {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'test/k6/summary.json': JSON.stringify(data)
    };

    try {
        summary['test/k6/report.html'] = htmlReport(data);
    } catch (e) {
        console.error('Failed to generate HTML report:', e);
    }

    return summary;
}
