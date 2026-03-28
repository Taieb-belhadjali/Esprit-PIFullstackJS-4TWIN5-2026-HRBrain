import axios from 'axios';

export interface Department {
  _id: string;
  name: string;
  user_id: string;
}

const API_URL = 'http://localhost:3000/departments';

export const getDepartments = async (): Promise<Department[]> => {
  const response = await axios.get<Department[]>(API_URL);
  return response.data;
};

export const createDepartment = async (
  data: Pick<Department, 'name' | 'user_id'>,
): Promise<Department> => {
  const response = await axios.post<Department>(API_URL, data);
  return response.data;
};

export const updateDepartment = async (
  id: string,
  data: Partial<Pick<Department, 'name' | 'user_id'>>,
): Promise<Department> => {
  const response = await axios.patch<Department>(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
