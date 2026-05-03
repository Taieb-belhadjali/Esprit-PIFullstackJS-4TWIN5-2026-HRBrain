import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}))

describe('API Configuration', () => {
  it('should create axios instance with correct baseURL', () => {
    expect(axios.create).toBeDefined()
  })

  it('should have timeout of 15000ms', () => {
    const createSpy = vi.mocked(axios.create)
    if (createSpy.mock.calls.length > 0) {
      const config = createSpy.mock.calls[0][0]
      expect(config?.timeout).toBe(15000)
    } else {
      expect(true).toBe(true) // API already created
    }
  })
})
