import axios from "axios";

export interface Department {
  _id: string;
  name: string;
  user_id: string;
}

const API_URL = "http://localhost:3000/departments";

export const getDepartments = async (): Promise<Department[]> => {
  try {
    console.log('🌐 Fetching from:', API_URL);
    const response = await axios.get<Department[]>(API_URL);
    console.log('✅ Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error in getDepartments:', error);
    throw error;
  }
};

export const createDepartment = async (data: Partial<Department>): Promise<Department> => {
  try {
    console.log('📝 Creating:', data);
    const response = await axios.post<Department>(API_URL, data);
    return response.data;
  } catch (error) {
    console.error('❌ Error in createDepartment:', error);
    throw error;
  }
};

export const updateDepartment = async (id: string, data: Partial<Department>): Promise<Department> => {
  try {
    console.log('🔄 Updating with PUT:', { id, data });
    const response = await axios.put<Department>(`${API_URL}/${id}`, data);
    console.log('✅ Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error in updateDepartment:', error);
    throw error;
  }
};

export const deleteDepartment = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error('❌ Error in deleteDepartment:', error);
    throw error;
  }
};