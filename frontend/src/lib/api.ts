import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      const backendError = error.response.data.error;
      const message = backendError.message || 'Erro ao comunicar com o servidor.';
      return Promise.reject(new Error(message));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Servidor não respondeu. Tente novamente.'));
    }

    if (!error.response) {
      return Promise.reject(new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.'));
    }

    return Promise.reject(new Error(`Erro do servidor (${error.response.status}). Tente novamente.`));
  },
);
