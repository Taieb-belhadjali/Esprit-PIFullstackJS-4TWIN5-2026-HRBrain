import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { ReadingMaskProvider, useReadingMask } from '../app/context/ReadingMaskContext'

describe('ReadingMaskContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('ReadingMaskProvider', () => {
    it('should provide default enabled as false', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })
      expect(result.current.enabled).toBe(false)
    })

    it('should provide default maskHeight as 60', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })
      expect(result.current.maskHeight).toBe(60)
    })

    it('should provide default opacity as 0.6', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })
      expect(result.current.opacity).toBe(0.6)
    })

    it('should load enabled from localStorage', () => {
      localStorage.setItem('hrbrain_reading_mask', 'true')
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })
      expect(result.current.enabled).toBe(true)
    })

    it('should load maskHeight from localStorage', () => {
      localStorage.setItem('hrbrain_mask_height', '80')
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })
      expect(result.current.maskHeight).toBe(80)
    })

    it('should load opacity from localStorage', () => {
      localStorage.setItem('hrbrain_mask_opacity', '0.8')
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })
      expect(result.current.opacity).toBe(0.8)
    })

    it('should update enabled and persist to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })

      act(() => { result.current.setEnabled(true) })

      expect(result.current.enabled).toBe(true)
      expect(localStorage.getItem('hrbrain_reading_mask')).toBe('true')
    })

    it('should update maskHeight and persist to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })

      act(() => { result.current.setMaskHeight(100) })

      expect(result.current.maskHeight).toBe(100)
      expect(localStorage.getItem('hrbrain_mask_height')).toBe('100')
    })

    it('should update opacity and persist to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })

      act(() => { result.current.setOpacity(0.9) })

      expect(result.current.opacity).toBe(0.9)
      expect(localStorage.getItem('hrbrain_mask_opacity')).toBe('0.9')
    })

    it('should toggle enabled from true to false', () => {
      localStorage.setItem('hrbrain_reading_mask', 'true')
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })

      act(() => { result.current.setEnabled(false) })

      expect(result.current.enabled).toBe(false)
      expect(localStorage.getItem('hrbrain_reading_mask')).toBe('false')
    })
  })

  describe('useReadingMask', () => {
    it('should return default context values when used outside provider', () => {
      const { result } = renderHook(() => useReadingMask())
      expect(result.current.enabled).toBe(false)
      expect(result.current.maskHeight).toBe(60)
      expect(result.current.opacity).toBe(0.6)
    })

    it('should expose all setter functions', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReadingMaskProvider>{children}</ReadingMaskProvider>
      )
      const { result } = renderHook(() => useReadingMask(), { wrapper })
      expect(typeof result.current.setEnabled).toBe('function')
      expect(typeof result.current.setMaskHeight).toBe('function')
      expect(typeof result.current.setOpacity).toBe('function')
    })
  })
})
