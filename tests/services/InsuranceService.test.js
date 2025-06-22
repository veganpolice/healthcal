import { describe, it, expect, beforeEach } from 'vitest'
import { InsuranceService } from '../../src/services/InsuranceService.js'

describe('InsuranceService', () => {
  let service

  beforeEach(() => {
    service = new InsuranceService()
  })

  describe('getDemoData', () => {
    it('should return demo insurance data', () => {
      const data = service.getDemoData()
      expect(data).toHaveProperty('planName')
      expect(data).toHaveProperty('policyNumber')
      expect(data).toHaveProperty('coverage')
      expect(data.planName).toBe('BC Health Plus Premium')
      expect(data.policyNumber).toBe('HP-2024-789123')
    })
  })

  describe('processDocument', () => {
    it('should process document and return demo data', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const result = await service.processDocument(file)
      expect(result).toEqual(service.getDemoData())
    })
  })

  describe('getCoverage', () => {
    it('should return coverage for dental service', () => {
      const coverage = service.getCoverage('dental')
      expect(coverage.covered).toBe(true)
      expect(coverage.percentage).toBe(80)
      expect(coverage.limit).toBe(1500)
    })

    it('should return no coverage for unsupported service', () => {
      const coverage = service.getCoverage('unsupported')
      expect(coverage.covered).toBe(false)
      expect(coverage.percentage).toBe(0)
      expect(coverage.limit).toBe(0)
    })
  })

  describe('calculateCost', () => {
    it('should calculate cost with insurance coverage', () => {
      const cost = service.calculateCost('dental', 100)
      expect(cost.baseCost).toBe(100)
      expect(cost.insuranceCoverage).toBe(80)
      expect(cost.userCost).toBe(20)
      expect(cost.coveragePercentage).toBe(80)
    })

    it('should calculate cost without coverage', () => {
      const cost = service.calculateCost('unsupported', 100)
      expect(cost.baseCost).toBe(100)
      expect(cost.insuranceCoverage).toBe(0)
      expect(cost.userCost).toBe(100)
      expect(cost.coveragePercentage).toBe(0)
    })
  })
})