# API Checkout Rest e GraphQL

Se você é aluno da Pós-Graduação em Automação de Testes de Software (Turma 2), faça um fork desse repositório e boa sorte em seu trabalho de conclusão da disciplina.

## Instalação

```bash
npm install express jsonwebtoken swagger-ui-express apollo-server-express graphql
```

## Exemplos de chamadas

### REST

#### Registro de usuário
```bash
curl -X POST http://localhost:3000/api/users/register \
	-H "Content-Type: application/json" \
	-d '{"name":"Novo Usuário","email":"novo@email.com","password":"senha123"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
	-H "Content-Type: application/json" \
	-d '{"email":"novo@email.com","password":"senha123"}'
```

#### Checkout (boleto)
```bash
curl -X POST http://localhost:3000/api/checkout \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <TOKEN_JWT>" \
	-d '{
		"items": [{"productId":1,"quantity":2}],
		"freight": 20,
		"paymentMethod": "boleto"
	}'
```

#### Checkout (cartão de crédito)
```bash
curl -X POST http://localhost:3000/api/checkout \
	-H "Content-Type: application/json" \
	-H "Authorization: Bearer <TOKEN_JWT>" \
	-d '{
		"items": [{"productId":2,"quantity":1}],
		"freight": 15,
		"paymentMethod": "credit_card",
		"cardData": {
			"number": "4111111111111111",
			"name": "Nome do Titular",
			"expiry": "12/30",
			"cvv": "123"
		}
	}'
```

### GraphQL

#### Registro de usuário
Mutation:
```graphql
mutation Register($name: String!, $email: String!, $password: String!) {
  register(name: $name, email: $email, password: $password) {
    email
    name
  }
}

Variables:
{
  "name": "Julio",
  "email": "julio@abc.com",
  "password": "123456"
}
```

#### Login
Mutation:
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
  }
}

Variables:
{
  "email": "alice@email.com",
  "password": "123456"
}
```


#### Checkout (boleto)
Mutation (envie o token JWT no header Authorization: Bearer <TOKEN_JWT>):
```graphql
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

Variables:
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ],
  "freight": 10,
  "paymentMethod": "boleto"
}
```

#### Checkout (cartão de crédito)
Mutation (envie o token JWT no header Authorization: Bearer <TOKEN_JWT>):
```graphql
mutation {
	checkout(
		items: [{productId: 2, quantity: 1}],
		freight: 15,
		paymentMethod: "credit_card",
		cardData: {
			number: "4111111111111111",
			name: "Nome do Titular",
			expiry: "12/30",
			cvv: "123"
		}
	) {
		valorFinal
		paymentMethod
		freight
		items { productId quantity }
	}
}

Variables:
{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ],
  "freight": 10,
  "paymentMethod": "credit_card",
  "cardData": {
    "cvv": "123",
    "expiry": "10/04",
    "name": "Julio Costa",
    "number": "1234432112344321"
  }
}
```

#### Consulta de usuários
Query:
```graphql
query Users {
  users {
    email
    name
  }
}
```

## Como rodar

### REST
```bash
node rest/server.js
```
Acesse a documentação Swagger em [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### GraphQL
```bash
node graphql/app.js
```
Acesse o playground GraphQL em [http://localhost:4000/graphql](http://localhost:4000/graphql)

## Endpoints REST
- POST `/api/users/register` — Registro de usuário
- POST `/api/users/login` — Login (retorna token JWT)
- POST `/api/checkout` — Checkout (requer token JWT)

## Regras de Checkout
- Só pode fazer checkout com token JWT válido
- Informe lista de produtos, quantidades, valor do frete, método de pagamento e dados do cartão se necessário
- 5% de desconto no valor total se pagar com cartão
- Resposta do checkout contém valor final

## Banco de dados
- Usuários e produtos em memória (veja arquivos em `src/models`)

## Testes

### Testes Unitários e de Integração
- Para testes automatizados, importe o `app` de `rest/app.js` ou `graphql/app.js` sem o método `listen()`
- Execute os testes com: `npm test`
- Testes de controller: `npm run test-controller`
- Testes externos REST: `npm run test-external-rest`
- Testes externos GraphQL: `npm run test-external-graphql`

### Testes de Performance (K6)

⚡ **Novos testes de performance com K6!**

#### Instalação do K6
```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (Chocolatey)
choco install k6
```

#### Executar Testes de Performance

**Importante:** Inicie o servidor antes de executar os testes!

```bash
# 1. Inicie o servidor REST (Terminal 1)
npm run start-rest

# 2. Execute os testes K6 REST (Terminal 2)
npm run test-k6-rest

# Para testes GraphQL
npm run start-graphql  # Terminal 1
npm run test-k6-graphql  # Terminal 2

# Executar todos os testes K6
npm run test-k6-all
```

#### Cenários Testados
- ✅ Registro de usuários
- ✅ Login e autenticação JWT
- ✅ Checkout com boleto
- ✅ Checkout com cartão de crédito (com desconto de 5%)
- ✅ Testes com diferentes fases de carga (stages)
- ✅ Validação de performance (95% das requisições < 2s)

#### Conceitos K6 Implementados

Todos os 11 conceitos obrigatórios foram implementados no arquivo `test/k6/api-rest-performance.test.js`:

##### 1. Thresholds

O código abaixo demonstra o uso de **Thresholds** para definir critérios de sucesso/falha do teste:

```javascript
// test/k6/api-rest-performance.test.js
export const options = {
    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<3000'],
        http_req_failed: ['rate<0.01'],
        'http_req_duration{name:user_register}': ['p(95)<1500'],
        'http_req_duration{name:user_login}': ['p(95)<1000'],
        'checkout_success_count': ['count>50']
    }
};
```

##### 2. Checks

O código abaixo está armazenado no arquivo `test/k6/helpers/authHelpers.js` e demonstra o uso de **Checks** para validação de respostas:

```javascript
// test/k6/helpers/authHelpers.js
export function validateRegister(response) {
    return check(response, {
        'registro: status é 201': (res) => res.status === 201,
        'registro: retorna user': (res) => res.json('user') !== undefined,
        'registro: retorna email': (res) => res.json('user.email') !== undefined,
        'registro: retorna nome': (res) => res.json('user.name') !== undefined
    });
}
```

##### 3. Helpers

O código abaixo demonstra o uso de **Helpers** - funções reutilizáveis importadas de módulos externos:

```javascript
// test/k6/api-rest-performance.test.js
import { register, login, validateRegister, validateLogin } from './helpers/authHelpers.js';
import { checkoutBoleto, checkoutCreditCard } from './helpers/checkoutHelpers.js';
import { randomEmail, randomName, randomPassword } from './helpers/randomData.js';

// Uso no teste
const userEmail = randomEmail();
const response = register(userEmail, randomPassword(), randomName());
validateRegister(response);
```

##### 4. Trends

O código abaixo demonstra o uso de **Trends** - métricas customizadas para rastrear valores específicos:

```javascript
// test/k6/api-rest-performance.test.js
import { Trend } from 'k6/metrics';

const registerDuration = new Trend('custom_register_duration');
const loginDuration = new Trend('custom_login_duration');
const checkoutDuration = new Trend('custom_checkout_duration');

// Uso no teste
group('Registro de usuário', function () {
    const response = register(userEmail, userPassword, userName);
    registerDuration.add(response.timings.duration); // Adiciona ao Trend
    validateRegister(response);
});
```

##### 5. Faker

O código abaixo está armazenado no arquivo `test/k6/helpers/randomData.js` e demonstra o uso de **Faker** (simulado) para gerar dados aleatórios:

```javascript
// test/k6/helpers/randomData.js
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export function randomEmail() {
    const timestamp = Date.now();
    const random = randomString(8);
    return `user_${timestamp}_${random}@test.com`;
}

export function randomName() {
    const names = ['Alice', 'Bob', 'Carol', 'David', 'Eve'];
    const surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima'];
    return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
}

export function randomCreditCard() {
    const testCards = ['4111111111111111', '5555555555554444', '378282246310005'];
    return testCards[Math.floor(Math.random() * testCards.length)];
}
```

##### 6. Variável de Ambiente

O código abaixo demonstra o uso de **Variáveis de Ambiente** para configurar URLs dinamicamente:

```javascript
// test/k6/api-rest-performance.test.js
const BASE_URL = __ENV.BASE_URL_REST || 'http://localhost:3000';

// Executar com variável de ambiente:
// k6 run -e BASE_URL_REST=https://api.production.com test/k6/api-rest-performance.test.js
```

##### 7. Stages

O código abaixo demonstra o uso de **Stages** para simular diferentes fases de carga:

```javascript
// test/k6/api-rest-performance.test.js
export const options = {
    stages: [
        { duration: '10s', target: 5 },   // Ramp up para 5 usuários
        { duration: '20s', target: 10 },  // Ramp up para 10 usuários
        { duration: '30s', target: 10 },  // Mantém 10 usuários (carga constante)
        { duration: '10s', target: 15 },  // Spike para 15 usuários
        { duration: '10s', target: 5 },   // Ramp down para 5 usuários
        { duration: '10s', target: 0 }    // Ramp down para 0
    ]
};
```

##### 8. Reaproveitamento de Resposta

O código abaixo demonstra o **Reaproveitamento de Resposta** entre requisições sequenciais:

```javascript
// test/k6/api-rest-performance.test.js
group('Registro de usuário', function () {
    const userEmail = randomEmail();
    const userPassword = randomPassword();
    const userName = randomName();
    
    // 1. Registra usuário
    const registerResponse = register(userEmail, userPassword, userName);
    validateRegister(registerResponse);
    
    // 2. REAPROVEITAMENTO: Usa dados do registro para fazer login
    const loginResponse = login(userEmail, userPassword);
    
    // 3. REAPROVEITAMENTO: Extrai token do login
    const token = loginResponse.json('token');
    
    // 4. REAPROVEITAMENTO: Usa token para autenticar checkout
    if (token) {
        const checkoutResponse = checkoutBoleto(token, items, 20);
        validateCheckout(checkoutResponse, 'boleto');
    }
});
```

##### 9. Uso de Token de Autenticação

O código abaixo está armazenado no arquivo `test/k6/helpers/checkoutHelpers.js` e demonstra o **Uso de Token de Autenticação JWT**:

```javascript
// test/k6/helpers/checkoutHelpers.js
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
                'Authorization': `Bearer ${token}` // Token JWT aqui
            },
            tags: { name: 'checkout_boleto' }
        }
    );

    return response;
}
```

##### 10. Data-Driven Testing

O código abaixo demonstra o uso de **Data-Driven Testing** com dados externos:

```javascript
// test/k6/api-rest-performance.test.js
import { SharedArray } from 'k6/data';

// Carrega dados de arquivos JSON
const products = new SharedArray('products', function () {
    return JSON.parse(open('./data/products.json'));
});

const existingUsers = new SharedArray('existing_users', function () {
    return JSON.parse(open('./data/users.json'));
});

// Uso no teste - cada VU usa um usuário diferente
group('Login com usuário existente (Data-Driven)', function () {
    const userData = existingUsers[__VU % existingUsers.length];
    const response = login(userData.email, userData.password);
    validateLogin(response);
});

// Uso no teste - cada iteração usa um produto diferente
group('Checkout com produtos variados (Data-Driven)', function () {
    const product = products[__ITER % products.length];
    const items = [{ 
        productId: product.productId, 
        quantity: product.quantity 
    }];
    const checkoutResponse = checkoutBoleto(token, items, 10);
});
```

##### 11. Groups

O código abaixo está armazenado no arquivo `test/k6/api-rest-performance.test.js` e demonstra o uso de **Groups** para organizar cenários de teste, fazendo uso de um Helper (função de login importada de outro script):

```javascript
// test/k6/api-rest-performance.test.js
import { login } from './helpers/authHelpers.js';

group('Login de usuário', function () {
    const response = login(email, password); // Helper importado
    
    check(response, {
        'login: status é 200': (res) => res.status === 200,
        'login: retorna token': (res) => res.json('token') !== undefined
    });
    
    token = response.json('token');
});

group('Checkout com boleto - Novo usuário', function () {
    const items = [{ productId: 1, quantity: 2 }];
    const response = checkoutBoleto(token, items, 20);
    validateCheckout(response, 'boleto');
});
```

#### Relatório HTML

Após a execução dos testes, um relatório HTML é gerado automaticamente em `test/k6/report.html`:

```javascript
// test/k6/api-rest-performance.test.js
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'test/k6/summary.json': JSON.stringify(data),
        'test/k6/report.html': htmlReport(data) // Relatório HTML
    };
}
```

Para visualizar: `open test/k6/report.html`

📖 **Documentação completa:** Veja `test/k6/README.md` para mais detalhes sobre cada conceito

## Documentação
- Swagger disponível em `/api-docs`
- Playground GraphQL disponível em `/graphql`

