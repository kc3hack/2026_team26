import axios from 'axios';

const baseUrl = (import.meta.env.VITE_API_URL as string) || 'https://test.sheeplab.net/api';

const apiClient = axios.create({
  baseURL: baseUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
})

export default apiClient;
