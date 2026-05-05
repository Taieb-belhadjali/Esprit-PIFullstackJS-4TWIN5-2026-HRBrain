import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the API module
vi.mock('../api/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  apiGet: vi.fn(),
}))

import API from '../api/api'
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api/employeeApi'

describe('EmployeeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEmployees', () => {
    it('should call API.get with /users endpoint', async () => {
      const mockEmployees = [
        { _id: '1', name: 'John Doe', email: 'john@example.com' },
        { _id: '2', name: 'Jane Doe', email: 'jane@example.com' },
      ]
      vi.mocked(API.get).mockResolvedValue({ data: mockEmployees })

      const result = await getEmployees()

      expect(API.get).toHaveBeenCalledWith('/users', expect.objectContaining({ params: expect.objectContaining({ page: 1, limit: 50 }) }))
      expect(result.data).toEqual(mockEmployees)
    })

    it('should return empty array when no employees', async () => {
      vi.mocked(API.get).mockResolvedValue({ data: [] })

      const result = await getEmployees()

      expect(result.data).toEqual([])
    })
  })

  describe('createEmployee', () => {
    it('should call API.post with employee data', async () => {
      const newEmployee = {
        name: 'New Employee',
        email: 'new@example.com',
        role: 'EMPLOYEE',
      }
      vi.mocked(API.post).mockResolvedValue({ data: { _id: '3', ...newEmployee } })

      await createEmployee(newEmployee)

      expect(API.post).toHaveBeenCalledWith('/users', newEmployee)
    })

    it('should return created employee with ID', async () => {
      const newEmployee = { name: 'Test', email: 'test@test.com' }
      const createdEmployee = { _id: '123', ...newEmployee }
      vi.mocked(API.post).mockResolvedValue({ data: createdEmployee })

      const result = await createEmployee(newEmployee)

      expect(result.data._id).toBe('123')
    })
  })

  describe('updateEmployee', () => {
    it('should call API.put with employee ID and data', async () => {
      const updateData = { name: 'Updated Name' }
      vi.mocked(API.put).mockResolvedValue({ data: { _id: '1', ...updateData } })

      await updateEmployee('1', updateData)

      expect(API.put).toHaveBeenCalledWith('/users/1', updateData)
    })

    it('should use correct URL with employee ID', async () => {
      vi.mocked(API.put).mockResolvedValue({ data: {} })

      await updateEmployee('abc123', { name: 'Test' })

      expect(API.put).toHaveBeenCalledWith('/users/abc123', { name: 'Test' })
    })
  })

  describe('deleteEmployee', () => {
    it('should call API.delete with employee ID', async () => {
      vi.mocked(API.delete).mockResolvedValue({ data: {} })

      await deleteEmployee('1')

      expect(API.delete).toHaveBeenCalledWith('/users/1')
    })

    it('should use correct URL with employee ID', async () => {
      vi.mocked(API.delete).mockResolvedValue({ data: {} })

      await deleteEmployee('xyz789')

      expect(API.delete).toHaveBeenCalledWith('/users/xyz789')
    })
  })
})
