import api from './api';

const authService = {
  // Connexion utilisateur
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        Email: email,
        MotDePasse: password,
      });
      return response.data; // contient { user, token }
    } catch (error) {
      console.error('Erreur login:', error);
      throw error.response?.data?.message || 'Server error';
    }
  },

  // Déconnexion utilisateur
  logout: async () => {
    try {
      await api.post('/auth/logout');
      return true;
    } catch (error) {
      console.error('Erreur logout:', error);
      return false;
    }
  }
};

export default authService;
