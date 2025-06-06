import axios from 'axios';
import { getRefreshToken, setAuthTokens, clearAuthTokens } from '../utils/authUtils';

const API_BASE_URL = 'http://localhost:8000';

export const loginUser = async (username: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  const response = await axios.post(`${API_BASE_URL}/token`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

export const refreshToken = async (): Promise<boolean> => {
  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) {
    return false;
  }
  try {
    const response = await axios.post(`${API_BASE_URL}/token/refresh`, null, {
      params: { refresh_token: storedRefreshToken }
    });
    const { access_token: newAccessToken } = response.data;
    setAuthTokens(newAccessToken, storedRefreshToken);
    return true;
  } catch (error) {
    clearAuthTokens();
    return false;
  }
};

export const registerUser = async (username: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/register`, { username, password });
  return response.data;
};

export const logoutUser = async () => {
  // 如果后端有登出接口，可以在这里调用
  // await axios.post(`${API_BASE_URL}/logout`);
  clearAuthTokens();
};

