import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

/**
 * Helper para gerar dados aleatórios
 * Simula o comportamento do Faker para geração de dados de teste
 */

/**
 * Gera um email aleatório único
 * @returns {string} Email no formato user_<timestamp>_<random>@test.com
 */
export function randomEmail() {
    const timestamp = Date.now();
    const random = randomString(8);
    return `user_${timestamp}_${random}@test.com`;
}

/**
 * Gera um nome aleatório
 * @returns {string} Nome no formato "Test User <random>"
 */
export function randomName() {
    const names = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry'];
    const surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Ferreira', 'Costa', 'Alves'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
    return `${randomName} ${randomSurname}`;
}

/**
 * Gera uma senha aleatória
 * @returns {string} Senha de 8 caracteres
 */
export function randomPassword() {
    return randomString(8);
}

/**
 * Gera um número de cartão de crédito válido para testes
 * @returns {string} Número de cartão de teste
 */
export function randomCreditCard() {
    const testCards = [
        '4111111111111111', // Visa
        '5555555555554444', // Mastercard
        '378282246310005'   // American Express
    ];
    return testCards[Math.floor(Math.random() * testCards.length)];
}

/**
 * Gera um CVV aleatório
 * @returns {string} CVV de 3 dígitos
 */
export function randomCVV() {
    return String(Math.floor(Math.random() * 900) + 100);
}

/**
 * Gera uma data de expiração futura para cartão
 * @returns {string} Data no formato MM/YY
 */
export function randomCardExpiry() {
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const year = String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 1).slice(-2);
    return `${month}/${year}`;
}

