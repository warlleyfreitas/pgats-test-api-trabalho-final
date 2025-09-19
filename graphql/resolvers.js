const users = require('../src/models/user');
const userService = require('../src/services/userService');
const checkoutService = require('../src/services/checkoutService');

module.exports = {
  Query: {
    users: () => users
  },
  Mutation: {
    register: (_, { name, email, password }) => {
      const user = userService.registerUser(name, email, password);
      if (!user) throw new Error('Email já cadastrado');
      return user;
    },
    login: (_, { email, password }) => {
      const user = userService.findUserByEmail(email);
      if (!user || user.password !== password) {
        throw new Error('Credenciais inválidas');
      }
      const authResult = userService.authenticate(email, password);
      return {
        token: authResult.token,
        user: { name: user.name, email: user.email }
      };
    },
    checkout: (_, { items, freight, paymentMethod, cardData }, context) => {
      const { userData } = context;
      if (!userData) throw new Error('Token inválido');
      const result = checkoutService.checkout(userData.id, items, freight, paymentMethod, cardData);
      return { ...result, valorFinal: result.total };
    }
  }
};
