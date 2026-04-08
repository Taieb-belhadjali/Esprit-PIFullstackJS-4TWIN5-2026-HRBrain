import API from "../../../api/api";

export interface Department {
  _id: string;
  name: string;
  managerIds: string[];
}

export const getDepartments = async (): Promise<Department[]> => {
  const response = await API.get<Department[]>('/departments');
  return response.data;
};

export const createDepartment = async (
  data: Pick<Department, 'name' | 'managerIds'>,
): Promise<Department> => {
  const response = await API.post<Department>('/departments', data);
  return response.data;
};

export const updateDepartment = async (
  id: string,
  data: Partial<Pick<Department, 'name' | 'managerIds'>>,
): Promise<Department> => {
  const response = await API.patch<Department>(`/departments/${id}`, data);
  return response.data;
};

export const deleteDepartment = async (id: string): Promise<void> => {
  await API.delete(`/departments/${id}`);
};
