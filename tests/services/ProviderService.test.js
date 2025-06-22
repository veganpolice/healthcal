import { describe, it, expect, beforeEach } from 'vitest'
import { ProviderService } from '../../src/services/ProviderService.js'

describe('ProviderService', () => {
  let service

  beforeEach(() => {
    service = new ProviderService()
  })

  describe('getProviders', () => {
    it('should return array of providers', async () => {
      const providers = await service.getProviders()
      expect(Array.isArray(providers)).toBe(true)
      expect(providers.length).toBeGreaterThan(0)
      expect(providers[0]).toHaveProperty('id')
      expect(providers[0]).toHaveProperty('name')
      expect(providers[0]).toHaveProperty('specialty')
    })
  })

  describe('getProviderByName', () => {
    it('should return provider by name', () => {
      const provider = service.getProviderByName('Dr. Sarah Chen')
      expect(provider).toBeTruthy()
      expect(provider.name).toBe('Dr. Sarah Chen')
    })

    it('should return default provider for unknown name', () => {
      const provider = service.getProviderByName('Unknown Doctor')
      expect(provider).toBeTruthy()
      expect(provider.name).toBe('Unknown Doctor')
      expect(provider.specialty).toBe('Healthcare Provider')
    })
  })

  describe('searchProviders', () => {
    it('should filter providers by specialty', async () => {
      const providers = await service.searchProviders({ specialty: 'Dentist' })
      expect(Array.isArray(providers)).toBe(true)
      providers.forEach(provider => {
        expect(provider.specialty.toLowerCase()).toContain('dentist')
      })
    })

    it('should filter providers by language', async () => {
      const providers = await service.searchProviders({ language: 'Spanish' })
      expect(Array.isArray(providers)).toBe(true)
      providers.forEach(provider => {
        expect(provider.languages.some(lang => 
          lang.toLowerCase().includes('spanish')
        )).toBe(true)
      })
    })

    it('should filter providers by minimum rating', async () => {
      const providers = await service.searchProviders({ minRating: 4.8 })
      expect(Array.isArray(providers)).toBe(true)
      providers.forEach(provider => {
        expect(provider.rating).toBeGreaterThanOrEqual(4.8)
      })
    })
  })

  describe('getProvidersBySpecialty', () => {
    it('should return providers by specialty', async () => {
      const providers = await service.getProvidersBySpecialty('Physiotherapist')
      expect(Array.isArray(providers)).toBe(true)
      providers.forEach(provider => {
        expect(provider.specialty.toLowerCase()).toContain('physiotherapist')
      })
    })
  })

  describe('getTopRatedProviders', () => {
    it('should return top rated providers', async () => {
      const providers = await service.getTopRatedProviders(3)
      expect(Array.isArray(providers)).toBe(true)
      expect(providers.length).toBeLessThanOrEqual(3)
      
      // Check that providers are sorted by rating (descending)
      for (let i = 1; i < providers.length; i++) {
        expect(providers[i-1].rating).toBeGreaterThanOrEqual(providers[i].rating)
      }
    })
  })
})