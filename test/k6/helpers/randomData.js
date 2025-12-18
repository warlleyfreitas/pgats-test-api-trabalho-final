import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

/**
 * CONCEITO: FAKER - Geração de Dados Aleatórios para Testes
 * 
 * Este módulo implementa o conceito de "Faker" através de funções que geram
 * dados realistas e aleatórios para testes de performance. Utiliza k6-utils,
 * uma biblioteca oficial do K6 para geração de dados aleatórios.
 */

/**
 * Gera um email aleatório único
 * @returns {string} Email aleatório
 */
export function randomEmail() {
    const domains = ['example.com', 'test.com', 'mail.com', 'demo.org'];
    const username = randomString(8).toLowerCase();
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
}

/**
 * Gera um nome completo aleatório
 * @returns {string} Nome completo
 */
export function randomName() {
    const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Ferreira', 'Costa', 'Alves', 'Rocha', 'Pereira'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
}

/**
 * Gera uma senha aleatória
 * @returns {string} Senha aleatória
 */
export function randomPassword() {
    return randomString(12);
}

/**
 * Gera um número de cartão de crédito válido para testes
 * @returns {string} Número de cartão de teste
 */
export function randomCreditCard() {
    const testCards = [
        '4111111111111111',
        '5555555555554444',
        '378282246310005'
    ];
    return testCards[Math.floor(Math.random() * testCards.length)];
}

/**
 * Gera um CVV aleatório
 * @returns {string} CVV de 3 dígitos
 */
export function randomCVV() {
    return String(randomIntBetween(100, 999));
}

/**
 * Gera uma data de expiração futura para cartão
 * @returns {string} Data no formato MM/YY
 */
export function randomCardExpiry() {
    const currentYear = new Date().getFullYear();
    const futureYear = currentYear + randomIntBetween(1, 5);
    const month = String(randomIntBetween(1, 12)).padStart(2, '0');
    const year = String(futureYear).slice(-2);
    return `${month}/${year}`;
}

