import axios from "axios";
import API from "./api.ts";

// GET all employees
export const getEmployees = () => axios.get("http://localhost:3000/users");

// CREATE employee
export const createEmployee = (data:any) =>
  API.post("/users", data);

// UPDATE employee
export const updateEmployee = (id:string, data:any) =>
  API.put(`/users/${id}`, data);

// DELETE employee
export const deleteEmployee = (id:string) =>
  API.delete(`/users/${id}`);
