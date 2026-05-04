import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { LanguageProvider, useLanguage } from '../app/context/LanguageContext'

describe('LanguageContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('LanguageProvider', () => {
    it('should provide default language as en', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider>{children}</LanguageProvider>
      )
      const { result } = renderHook(() => useLanguage(), { wrapper })
      expect(result.current.language).toBe('en')
    })

    it('should provide custom initial language', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider initialLanguage="fr">{children}</LanguageProvider>
      )
      const { result } = renderHook(() => useLanguage(), { wrapper })
      expect(result.current.language).toBe('fr')
    })

    it('should update language when setLanguage is called', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider>{children}</LanguageProvider>
      )
      const { result } = renderHook(() => useLanguage(), { wrapper })

      act(() => {
        result.current.setLanguage('fr')
      })

      expect(result.current.language).toBe('fr')
    })

    it('should persist language to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider>{children}</LanguageProvider>
      )
      const { result } = renderHook(() => useLanguage(), { wrapper })

      act(() => {
        result.current.setLanguage('ar')
      })

      expect(localStorage.getItem('hrbrain_language')).toBe('ar')
    })

    it('should call onLanguageChange callback when language changes', () => {
      const onLanguageChange = vi.fn()
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider onLanguageChange={onLanguageChange}>{children}</LanguageProvider>
      )
      const { result } = renderHook(() => useLanguage(), { wrapper })

      act(() => {
        result.current.setLanguage('de')
      })

      expect(onLanguageChange).toHaveBeenCalledWith('de')
    })

    it('should not call onLanguageChange when not provided', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider>{children}</LanguageProvider>
      )
      const { result } = renderHook(() => useLanguage(), { wrapper })

      // Should not throw
      act(() => {
        result.current.setLanguage('es')
      })

      expect(result.current.language).toBe('es')
    })
  })

  describe('useLanguage', () => {
    it('should return default context values when used outside provider', () => {
      const { result } = renderHook(() => useLanguage())
      expect(result.current.language).toBe('en')
      expect(typeof result.current.setLanguage).toBe('function')
    })

    it('should expose setLanguage function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider>{children}</LanguageProvider>
      )
      const { result } = renderHook(() => useLanguage(), { wrapper })
      expect(typeof result.current.setLanguage).toBe('function')
    })

    it('should support multiple language changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider>{children}</LanguageProvider>
      )
      const { result } = renderHook(() => useLanguage(), { wrapper })

      act(() => { result.current.setLanguage('fr') })
      expect(result.current.language).toBe('fr')

      act(() => { result.current.setLanguage('ar') })
      expect(result.current.language).toBe('ar')

      act(() => { result.current.setLanguage('en') })
      expect(result.current.language).toBe('en')
    })
  })
})
