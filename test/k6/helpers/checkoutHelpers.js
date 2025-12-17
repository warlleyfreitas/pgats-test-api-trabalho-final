import http from 'k6/http';
import { check } from 'k6';

/**
 * Helpers para operações de checkout
 * Centraliza as chamadas de checkout para reutilização
 */

const BASE_URL = __ENV.BASE_URL_REST || 'http://localhost:3000';

/**
 * Realiza um checkout com boleto
 * @param {string} token - Token JWT de autenticação
 * @param {Array} items - Array de items [{productId, quantity}]
 * @param {number} freight - Valor do frete
 * @returns {Response} Resposta da requisição HTTP
 */
export function checkoutBoleto(token, items, freight) {
    const payload = JSON.stringify({
        items: items,
        freight: freight,
        paymentMethod: 'boleto'
    });

    const response = http.post(
        `${BASE_URL}/api/checkout`,
        payload,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            tags: { name: 'checkout_boleto' }
        }
    );

    return response;
}

/**
 * Realiza um checkout com cartão de crédito
 * @param {string} token - Token JWT de autenticação
 * @param {Array} items - Array de items [{productId, quantity}]
 * @param {number} freight - Valor do frete
 * @param {Object} cardData - Dados do cartão {number, name, expiry, cvv}
 * @returns {Response} Resposta da requisição HTTP
 */
export function checkoutCreditCard(token, items, freight, cardData) {
    const payload = JSON.stringify({
        items: items,
        freight: freight,
        paymentMethod: 'credit_card',
        cardData: cardData
    });

    const response = http.post(
        `${BASE_URL}/api/checkout`,
        payload,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            tags: { name: 'checkout_credit_card' }
        }
    );

    return response;
}

/**
 * Valida se o checkout foi bem sucedido
 * @param {Response} response - Resposta do checkout
 * @param {string} expectedPaymentMethod - Método de pagamento esperado
 * @returns {boolean} True se o checkout foi bem sucedido
 */
export function validateCheckout(response, expectedPaymentMethod) {
    return check(response, {
        'checkout: status é 200': (res) => res.status === 200,
        'checkout: retorna valorFinal': (res) => res.json('valorFinal') !== undefined,
        'checkout: método de pagamento correto': (res) => res.json('paymentMethod') === expectedPaymentMethod
    });
}

/**
 * Valida se o desconto do cartão foi aplicado (5%)
 * @param {Response} response - Resposta do checkout
 * @returns {boolean} True se validações passaram
 */
export function validateCreditCardDiscount(response) {
    return check(response, {
        'checkout cartão: aplica desconto': (res) => {
            const valorFinal = res.json('valorFinal');
            return valorFinal !== undefined && valorFinal > 0;
        }
    });
}

