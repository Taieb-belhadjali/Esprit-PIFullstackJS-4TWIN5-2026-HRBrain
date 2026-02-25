// src/app/components/departments/departmentService.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/departments'; // NestJS backend

export const getDepartments = () => axios.get(API_URL);
export const createDepartment = (department: { name: string; user_id: string }) =>
  axios.post(API_URL, department);
export const updateDepartment = (id: string, department: { name: string }) =>
  axios.put(`${API_URL}/${id}`, department);
export const deleteDepartment = (id: string) => axios.delete(`${API_URL}/${id}`);