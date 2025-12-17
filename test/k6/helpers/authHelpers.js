import http from 'k6/http';
import { check } from 'k6';

/**
 * Helpers para autenticação de usuários
 * Centraliza as chamadas de registro e login para reutilização
 */

const BASE_URL = __ENV.BASE_URL_REST || 'http://localhost:3000';

/**
 * Registra um novo usuário na API REST
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @param {string} name - Nome do usuário
 * @returns {Response} Resposta da requisição HTTP
 */
export function register(email, password, name) {
    const payload = JSON.stringify({
        name: name,
        email: email,
        password: password
    });

    const response = http.post(
        `${BASE_URL}/api/users/register`,
        payload,
        {
            headers: {
                'Content-Type': 'application/json'
            },
            tags: { name: 'user_register' }
        }
    );

    return response;
}

/**
 * Realiza login de um usuário na API REST
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Response} Resposta da requisição HTTP contendo o token
 */
export function login(email, password) {
    const payload = JSON.stringify({
        email: email,
        password: password
    });

    const response = http.post(
        `${BASE_URL}/api/users/login`,
        payload,
        {
            headers: {
                'Content-Type': 'application/json'
            },
            tags: { name: 'user_login' }
        }
    );

    return response;
}

/**
 * Valida se o registro foi bem sucedido
 * @param {Response} response - Resposta do registro
 * @returns {boolean} True se o registro foi bem sucedido
 */
export function validateRegister(response) {
    return check(response, {
        'registro: status é 201': (res) => res.status === 201,
        'registro: retorna user': (res) => res.json('user') !== undefined,
        'registro: retorna email': (res) => res.json('user.email') !== undefined,
        'registro: retorna nome': (res) => res.json('user.name') !== undefined
    });
}

/**
 * Valida se o login foi bem sucedido
 * @param {Response} response - Resposta do login
 * @returns {boolean} True se o login foi bem sucedido
 */
export function validateLogin(response) {
    return check(response, {
        'login: status é 200': (res) => res.status === 200,
        'login: retorna token': (res) => res.json('token') !== undefined
    });
}

