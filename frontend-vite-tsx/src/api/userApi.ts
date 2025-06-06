import axiosInstance from './axiosInstance';

import type { User } from '../interfaces';

export const fetchUserProfile = async (): Promise<User> => {
  const response = await axiosInstance.get<User>('/users/me');
  return response.data;
};