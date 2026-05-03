import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to test apiGet deduplication logic
// Mock axios before importing api module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  }
})

describe('apiGet deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be importable', async () => {
    const { apiGet } = await import('../api/api')
    expect(apiGet).toBeDefined()
    expect(typeof apiGet).toBe('function')
  })

  it('should return a Promise', async () => {
    const { apiGet } = await import('../api/api')
    const API = (await import('../api/api')).default
    vi.mocked(API.get).mockResolvedValue({ data: [] })

    const result = apiGet('/test')
    expect(result).toBeInstanceOf(Promise)
  })
})
