import { describe, it, expect, vi, beforeEach } from 'vitest'

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
import { extractSkills } from '../api/nlpApi'

describe('nlpApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractSkills', () => {
    it('should call API.post with correct endpoint and description', async () => {
      const mockResponse = {
        data: { skills: ['JavaScript', 'React', 'Node.js'] },
      }
      vi.mocked(API.post).mockResolvedValue(mockResponse)

      const result = await extractSkills('Expert JavaScript developer with React experience')

      expect(API.post).toHaveBeenCalledWith('/nlp/extract-skills', {
        description: 'Expert JavaScript developer with React experience',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle empty description', async () => {
      vi.mocked(API.post).mockResolvedValue({ data: { skills: [] } })

      await extractSkills('')

      expect(API.post).toHaveBeenCalledWith('/nlp/extract-skills', {
        description: '',
      })
    })

    it('should throw error when API fails', async () => {
      vi.mocked(API.post).mockRejectedValue(new Error('NLP service unavailable'))

      await expect(extractSkills('test')).rejects.toThrow('NLP service unavailable')
    })

    it('should return extracted skills from response', async () => {
      const skills = ['Python', 'Machine Learning', 'TensorFlow']
      vi.mocked(API.post).mockResolvedValue({ data: { skills } })

      const result = await extractSkills('Data scientist with ML expertise')

      expect(result.data.skills).toEqual(skills)
    })
  })
})
