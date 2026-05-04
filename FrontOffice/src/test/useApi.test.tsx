import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Mock the API module
vi.mock('../api/api', () => ({
  default: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  apiGet: vi.fn(),
}))

import API from '../api/api'
import { useApi, useApiParallel } from '../app/hooks/useApi'

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial loading state', () => {
    vi.mocked(API.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useApi('/users'))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should return data on successful fetch', async () => {
    const mockData = [{ id: 1, name: 'John' }]
    vi.mocked(API.get).mockResolvedValue({ data: mockData })

    const { result } = renderHook(() => useApi('/users'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should return error on failed fetch with response message', async () => {
    vi.mocked(API.get).mockRejectedValue({
      message: 'Network Error',
      response: { data: { message: 'Server Error' } },
    })

    const { result } = renderHook(() => useApi('/users'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Server Error')
  })

  it('should not fetch when skip is true', () => {
    const { result } = renderHook(() => useApi('/users', { skip: true }))
    expect(result.current.loading).toBe(false)
    expect(API.get).not.toHaveBeenCalled()
  })

  it('should refetch when refetch is called', async () => {
    const mockData = [{ id: 1 }]
    vi.mocked(API.get).mockResolvedValue({ data: mockData })

    const { result } = renderHook(() => useApi('/users'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(API.get).toHaveBeenCalledTimes(1)

    act(() => { result.current.refetch() })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(API.get).toHaveBeenCalledTimes(2)
  })

  it('should expose refetch function', () => {
    vi.mocked(API.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useApi('/users'))
    expect(typeof result.current.refetch).toBe('function')
  })

  it('should handle network error without response', async () => {
    vi.mocked(API.get).mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useApi('/users'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network Error')
  })

  it('should use fallback error message when no message available', async () => {
    vi.mocked(API.get).mockRejectedValue({})

    const { result } = renderHook(() => useApi('/users'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Erreur réseau')
  })
})

describe('useApiParallel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial loading state', () => {
    vi.mocked(API.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useApiParallel(['/users', '/skills']))
    expect(result.current.loading).toBe(true)
    expect(result.current.results).toEqual([null, null])
    expect(result.current.error).toBeNull()
  })

  it('should return data from all URLs on success', async () => {
    const users = [{ id: 1 }]
    const skills = [{ id: 2 }]
    vi.mocked(API.get)
      .mockResolvedValueOnce({ data: users })
      .mockResolvedValueOnce({ data: skills })

    const { result } = renderHook(() => useApiParallel(['/users', '/skills']))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.results[0]).toEqual(users)
    expect(result.current.results[1]).toEqual(skills)
    expect(result.current.error).toBeNull()
  })

  it('should return error when any request fails', async () => {
    vi.mocked(API.get).mockRejectedValue({
      message: 'Network Error',
      response: { data: { message: 'Parallel Error' } },
    })

    const { result } = renderHook(() => useApiParallel(['/users', '/skills']))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Parallel Error')
  })

  it('should not fetch when skip is true', () => {
    const { result } = renderHook(() => useApiParallel(['/users'], { skip: true }))
    expect(result.current.loading).toBe(false)
    expect(API.get).not.toHaveBeenCalled()
  })

  it('should refetch when refetch is called', async () => {
    vi.mocked(API.get).mockResolvedValue({ data: [] })

    const { result } = renderHook(() => useApiParallel(['/users']))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(API.get).toHaveBeenCalledTimes(1)

    act(() => { result.current.refetch() })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(API.get).toHaveBeenCalledTimes(2)
  })

  it('should expose refetch function', () => {
    vi.mocked(API.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useApiParallel(['/users']))
    expect(typeof result.current.refetch).toBe('function')
  })
})
