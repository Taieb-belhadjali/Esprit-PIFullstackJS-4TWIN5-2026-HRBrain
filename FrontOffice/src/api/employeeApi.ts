import API from "./api.ts";

export interface EmployeePage {
  data:  any[];
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

/**
 * Fetches a paginated list of employees.
 * @param page   - 1-based page number (default 1)
 * @param limit  - items per page (default 50)
 * @param role   - optional role filter (EMPLOYEE | MANAGER | HR | All)
 * @param search - optional search string (name or email)
 */
export const getEmployees = (
  page  = 1,
  limit = 50,
  role?: string,
  search?: string,
) => {
  const params: Record<string, any> = { page, limit };
  if (role   && role   !== 'All') params.role   = role;
  if (search && search.trim())    params.search = search.trim();
  return API.get<EmployeePage>('/users', { params, timeout: 30000 });
};

// CREATE employee
export const createEmployee = (data: any) =>
  API.post("/users", data);

// UPDATE employee
export const updateEmployee = (id: string, data: any) =>
  API.put(`/users/${id}`, data);

// DELETE employee
export const deleteEmployee = (id: string) =>
  API.delete(`/users/${id}`);
