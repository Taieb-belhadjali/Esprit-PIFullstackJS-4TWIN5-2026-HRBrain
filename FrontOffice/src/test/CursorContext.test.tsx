import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { CursorProvider, useCursor } from '../app/context/CursorContext'

describe('CursorContext', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset classList
    document.documentElement.classList.remove('cursor-large', 'cursor-xlarge')
    vi.clearAllMocks()
  })

  describe('CursorProvider', () => {
    it('should provide default cursor size as normal', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })
      expect(result.current.cursorSize).toBe('normal')
    })

    it('should load cursor size from localStorage', () => {
      localStorage.setItem('hrbrain_cursor_size', 'large')
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })
      expect(result.current.cursorSize).toBe('large')
    })

    it('should update cursor size when setCursorSize is called', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })

      act(() => {
        result.current.setCursorSize('large')
      })

      expect(result.current.cursorSize).toBe('large')
    })

    it('should persist cursor size to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })

      act(() => {
        result.current.setCursorSize('xlarge')
      })

      expect(localStorage.getItem('hrbrain_cursor_size')).toBe('xlarge')
    })

    it('should add cursor-large class to documentElement when size is large', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })

      act(() => {
        result.current.setCursorSize('large')
      })

      expect(document.documentElement.classList.contains('cursor-large')).toBe(true)
      expect(document.documentElement.classList.contains('cursor-xlarge')).toBe(false)
    })

    it('should add cursor-xlarge class to documentElement when size is xlarge', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })

      act(() => {
        result.current.setCursorSize('xlarge')
      })

      expect(document.documentElement.classList.contains('cursor-xlarge')).toBe(true)
      expect(document.documentElement.classList.contains('cursor-large')).toBe(false)
    })

    it('should remove cursor classes when size is normal', () => {
      document.documentElement.classList.add('cursor-large')
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })

      act(() => {
        result.current.setCursorSize('normal')
      })

      expect(document.documentElement.classList.contains('cursor-large')).toBe(false)
      expect(document.documentElement.classList.contains('cursor-xlarge')).toBe(false)
    })

    it('should switch from large to xlarge correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })

      act(() => { result.current.setCursorSize('large') })
      expect(document.documentElement.classList.contains('cursor-large')).toBe(true)

      act(() => { result.current.setCursorSize('xlarge') })
      expect(document.documentElement.classList.contains('cursor-large')).toBe(false)
      expect(document.documentElement.classList.contains('cursor-xlarge')).toBe(true)
    })
  })

  describe('useCursor', () => {
    it('should return default context values when used outside provider', () => {
      const { result } = renderHook(() => useCursor())
      expect(result.current.cursorSize).toBe('normal')
      expect(typeof result.current.setCursorSize).toBe('function')
    })

    it('should expose setCursorSize function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CursorProvider>{children}</CursorProvider>
      )
      const { result } = renderHook(() => useCursor(), { wrapper })
      expect(typeof result.current.setCursorSize).toBe('function')
    })
  })
})
