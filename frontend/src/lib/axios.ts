import axios, { type AxiosInstance } from 'axios';
import type LogoutReq from '../types/request/logoutReq';
import type RefreshReq from '../types/request/refreshReq';
import type RefreshRes from '../types/response/refreshRes';

const baseURL = 'https://test.sheeplab.net/api';

class API {
  public apiClient: AxiosInstance;
  public authApiClient: AxiosInstance;
  public token: string = '';
  public refresh: string = '';

  constructor() {
    this.apiClient = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.authApiClient = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
    });
    this.refresh = localStorage.getItem('refresh_token') ?? '';
  }

  setToken(token: string) {
    this.token = token;
    this.authApiClient = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  }

  setRefreshToken(refresh: string) {
    this.refresh = refresh;
    localStorage.setItem('refresh_token', refresh);
  }

  async tokenRefresh() {
    const body: RefreshReq = {
      refresh_token: this.refresh,
    };
    const res = await this.apiClient.post<RefreshRes>('/auth/refresh', body);
    const data = res.data;
    this.setRefreshToken(data.refresh_token);
    this.setToken(data.access_token);
    return data;
  }

  async logout() {
    const body: LogoutReq = {
      refresh_token: this.refresh,
    };
    await this.apiClient.post('/auth/logout', body);
    this.refresh = '';
    this.token = '';
  }

  client() {
    return this.apiClient;
  }

  authClient() {
    return this.authApiClient;
  }
}

export default new API();
