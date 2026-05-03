import { describe, it, expect } from 'vitest'
import { translations } from '../api/translations'

describe('Translations', () => {
  it('should have English translations', () => {
    expect(translations.en).toBeDefined()
  })

  it('should have French translations', () => {
    expect(translations.fr).toBeDefined()
  })

  it('should have all required keys in English', () => {
    const requiredKeys = [
      'settings',
      'home',
      'employees',
      'departments',
      'skills',
      'activities',
      'recommendations',
      'analytics',
      'profile',
      'logout',
    ]
    requiredKeys.forEach((key) => {
      expect(translations.en).toHaveProperty(key)
    })
  })

  it('should have all required keys in French', () => {
    const requiredKeys = [
      'settings',
      'home',
      'employees',
      'departments',
      'skills',
      'activities',
      'recommendations',
      'analytics',
      'profile',
      'logout',
    ]
    requiredKeys.forEach((key) => {
      expect(translations.fr).toHaveProperty(key)
    })
  })

  it('should have same keys in English and French', () => {
    const enKeys = Object.keys(translations.en).sort()
    const frKeys = Object.keys(translations.fr).sort()
    expect(enKeys).toEqual(frKeys)
  })

  it('should have non-empty values in English', () => {
    Object.entries(translations.en).forEach(([key, value]) => {
      expect(value, `Key "${key}" should not be empty`).toBeTruthy()
    })
  })

  it('should have correct English navigation labels', () => {
    expect(translations.en.home).toBe('Home')
    expect(translations.en.employees).toBe('Employees')
    expect(translations.en.departments).toBe('Departments')
    expect(translations.en.skills).toBe('Skills')
    expect(translations.en.logout).toBe('Logout')
  })

  it('should have correct French navigation labels', () => {
    expect(translations.fr.home).toBe('Accueil')
    expect(translations.fr.employees).toBe('Employés')
    expect(translations.fr.departments).toBe('Départements')
    expect(translations.fr.logout).toBe('Déconnexion')
  })

  it('should support multiple languages', () => {
    const supportedLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'ru']
    supportedLanguages.forEach((lang) => {
      expect(translations).toHaveProperty(lang)
    })
  })
})
