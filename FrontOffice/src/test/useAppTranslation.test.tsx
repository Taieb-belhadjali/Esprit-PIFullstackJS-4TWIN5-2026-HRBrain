import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { useAppTranslation } from '../app/hooks/useAppTranslation'
import { LanguageProvider } from '../app/context/LanguageContext'

describe('useAppTranslation', () => {
  it('should return a function', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="en">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    expect(typeof result.current).toBe('function')
  })

  it('should return English translations by default', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="en">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    const t = result.current
    expect(t('settings')).toBe('Settings')
    expect(t('employees')).toBe('Employees')
    expect(t('logout')).toBe('Logout')
  })

  it('should return French translations when language is fr', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="fr">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    const t = result.current
    expect(t('settings')).toBe('Paramètres')
    expect(t('employees')).toBe('Employés')
    expect(t('logout')).toBe('Déconnexion')
  })

  it('should return Arabic translations when language is ar', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="ar">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    const t = result.current
    expect(t('settings')).toBe('الإعدادات')
    expect(t('logout')).toBe('تسجيل الخروج')
  })

  it('should return Spanish translations when language is es', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="es">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    const t = result.current
    expect(t('settings')).toBe('Configuración')
    expect(t('logout')).toBe('Cerrar sesión')
  })

  it('should return German translations when language is de', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="de">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    const t = result.current
    expect(t('settings')).toBe('Einstellungen')
    expect(t('logout')).toBe('Abmelden')
  })

  it('should return home translation key', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="en">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    expect(result.current('home')).toBe('Home')
  })

  it('should return dashboard translation', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="en">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    expect(result.current('dashboard')).toBe('Dashboard')
  })

  it('should return skills translation in French', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LanguageProvider initialLanguage="fr">{children}</LanguageProvider>
    )
    const { result } = renderHook(() => useAppTranslation(), { wrapper })
    expect(result.current('skills')).toBe('Compétences')
  })
})
