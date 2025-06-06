import axios from 'axios';
import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from '../utils/authUtils';

const API_BASE_URL = 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 Access Token
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理 Token 刷新
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // 如果是 401 错误且不是登录请求，且之前没有重试过
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/token/refresh`, null, {
            params: { refresh_token: refreshToken } // 将 refresh_token 作为查询参数发送
          });
          const { access_token: newAccessToken } = response.data;
          setAuthTokens(newAccessToken, refreshToken); // 更新新的 Access Token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest); // 使用新的 Access Token 重新发送原请求
        } catch (refreshError) {
          console.error("Failed to refresh token:", refreshError);
          clearAuthTokens(); // 刷新失败则清除所有 token
          window.location.href = '/login'; // 重定向到登录页
          return Promise.reject(refreshError);
        }
      } else {
        clearAuthTokens(); // 没有 refresh token 则清除所有 token
        window.location.href = '/login'; // 重定向到登录页
      }
    }
    return Promise.reject(error);
  }
);

// 登录请求函数 (不通过拦截器，因为登录时还没有 token)
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

// 刷新 Token 函数
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
    console.error("Refresh token failed directly:", error);
    clearAuthTokens();
    return false;
  }
};

// 注册用户
export const registerUser = async (username: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/register`, { username, password });
  return response.data;
};

export interface User {
  username: string;
  id: number;
}

// 获取用户信息
export const fetchUserProfile = async (): Promise<User> => {
  const response = await axiosInstance.get<User>(`${API_BASE_URL}/users/me`);
  return response.data;
};

export default axiosInstance;