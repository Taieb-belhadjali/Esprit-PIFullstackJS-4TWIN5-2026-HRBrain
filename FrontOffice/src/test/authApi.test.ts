import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the API module
vi.mock('../api/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  apiGet: vi.fn(),
}))

import API from '../api/api'
import { login, changePassword } from '../api/authApi'

describe('AuthApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should call API.post with correct endpoint and credentials', async () => {
      const mockResponse = {
        data: {
          token: 'mock.jwt.token',
          user: { id: '1', email: 'test@example.com' },
        },
      }
      vi.mocked(API.post).mockResolvedValue(mockResponse)

      const result = await login('test@example.com', 'password123')

      expect(API.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should call API.post with email and password', async () => {
      vi.mocked(API.post).mockResolvedValue({ data: {} })

      await login('user@test.com', 'mypassword')

      expect(API.post).toHaveBeenCalledTimes(1)
      expect(API.post).toHaveBeenCalledWith('/auth/login', {
        email: 'user@test.com',
        password: 'mypassword',
      })
    })

    it('should throw error when API call fails', async () => {
      const error = new Error('Network Error')
      vi.mocked(API.post).mockRejectedValue(error)

      await expect(login('test@example.com', 'wrong')).rejects.toThrow('Network Error')
    })
  })

  describe('changePassword', () => {
    it('should call API.post with correct endpoint and token', async () => {
      const mockResponse = { data: { message: 'Password changed' } }
      vi.mocked(API.post).mockResolvedValue(mockResponse)

      const result = await changePassword('newPassword123', 'jwt.token.here')

      expect(API.post).toHaveBeenCalledWith(
        '/auth/change-password',
        { newPassword: 'newPassword123' },
        { headers: { Authorization: 'Bearer jwt.token.here' } },
      )
      expect(result).toEqual(mockResponse)
    })

    it('should include Authorization header with Bearer token', async () => {
      vi.mocked(API.post).mockResolvedValue({ data: {} })

      await changePassword('newPass', 'mytoken')

      const callArgs = vi.mocked(API.post).mock.calls[0]
      expect(callArgs[2]).toEqual({
        headers: { Authorization: 'Bearer mytoken' },
      })
    })
  })
})
