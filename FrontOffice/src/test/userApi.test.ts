import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  apiGet: vi.fn(),
}))

import API from '../api/api'
import { userApi } from '../api/userApi'

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('getLanguages', () => {
    it('should call API.get with correct endpoint', async () => {
      const mockLanguages = [{ code: 'en' }, { code: 'fr' }]
      vi.mocked(API.get).mockResolvedValue({ data: mockLanguages })

      const result = await userApi.getLanguages()

      expect(API.get).toHaveBeenCalledWith('/users/settings/languages')
      expect(result).toEqual(mockLanguages)
    })

    it('should return empty array when no languages', async () => {
      vi.mocked(API.get).mockResolvedValue({ data: [] })

      const result = await userApi.getLanguages()
      expect(result).toEqual([])
    })

    it('should throw error when API fails', async () => {
      vi.mocked(API.get).mockRejectedValue(new Error('Network Error'))

      await expect(userApi.getLanguages()).rejects.toThrow('Network Error')
    })
  })

  describe('updateLanguage', () => {
    it('should throw error when user is not authenticated', async () => {
      localStorage.setItem('hrbrain_auth', JSON.stringify({}))

      await expect(userApi.updateLanguage('fr')).rejects.toThrow('User not authenticated')
    })

    it('should call API.put with correct endpoint when user is authenticated', async () => {
      localStorage.setItem(
        'hrbrain_auth',
        JSON.stringify({ user: { id: 'user-123' } }),
      )
      vi.mocked(API.put).mockResolvedValue({ data: {} })

      await userApi.updateLanguage('fr')

      expect(API.put).toHaveBeenCalledWith('/users/user-123', { language: 'fr' })
    })

    it('should throw error when localStorage is empty', async () => {
      await expect(userApi.updateLanguage('fr')).rejects.toThrow('User not authenticated')
    })
  })
})
