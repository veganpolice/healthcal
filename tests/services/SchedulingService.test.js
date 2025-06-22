import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SchedulingService } from '../../src/services/SchedulingService.js'

describe('SchedulingService', () => {
  let service

  beforeEach(() => {
    service = new SchedulingService()
  })

  describe('generateSchedule', () => {
    it('should generate schedule based on user preferences', () => {
      const userAnswers = {
        importantServices: ['Dental care', 'Vision care'],
        timePreference: 'Morning (8AM - 12PM)',
        languagePreference: 'English only'
      }
      
      const schedule = service.generateSchedule(userAnswers)
      expect(Array.isArray(schedule)).toBe(true)
      expect(schedule.length).toBeGreaterThan(0)
      
      schedule.forEach(appointment => {
        expect(appointment).toHaveProperty('id')
        expect(appointment).toHaveProperty('date')
        expect(appointment).toHaveProperty('type')
        expect(appointment).toHaveProperty('provider')
        expect(appointment).toHaveProperty('category')
      })
    })

    it('should filter appointments based on important services', () => {
      const userAnswers = {
        importantServices: ['Dental care'],
        timePreference: 'Morning (8AM - 12PM)'
      }
      
      const schedule = service.generateSchedule(userAnswers)
      const dentalAppointments = schedule.filter(apt => apt.category === 'dental')
      expect(dentalAppointments.length).toBeGreaterThan(0)
    })
  })

  describe('getBaseScheduleTemplate', () => {
    it('should return base schedule template', () => {
      const template = service.getBaseScheduleTemplate()
      expect(Array.isArray(template)).toBe(true)
      expect(template.length).toBeGreaterThan(0)
      
      template.forEach(item => {
        expect(item).toHaveProperty('type')
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('duration')
        expect(item).toHaveProperty('frequency')
        expect(item).toHaveProperty('priority')
      })
    })
  })

  describe('generateAppointmentDates', () => {
    it('should generate dates for every 6 months frequency', () => {
      const dates = service.generateAppointmentDates('every 6 months', 2025, {})
      expect(dates).toHaveLength(2)
      
      const months = dates.map(date => date.getMonth())
      expect(months).toContain(0) // January
      expect(months).toContain(5) // June
    })

    it('should generate dates for yearly frequency', () => {
      const dates = service.generateAppointmentDates('yearly', 2025, {})
      expect(dates).toHaveLength(1)
    })

    it('should generate dates for monthly frequency', () => {
      const dates = service.generateAppointmentDates('monthly', 2025, {})
      expect(dates).toHaveLength(4)
    })
  })

  describe('calculateAppointmentCost', () => {
    it('should calculate cost with insurance', () => {
      const cost = service.calculateAppointmentCost('Dental Cleaning', 'dental')
      expect(typeof cost).toBe('string')
      expect(cost).toMatch(/\$\d+/)
    })
  })

  describe('regenerateSchedule', () => {
    it('should regenerate schedule with variations', async () => {
      const currentAppointments = [
        {
          id: 1,
          date: '2025-01-15',
          type: 'Dental Cleaning',
          provider: 'Dr. Test',
          category: 'dental'
        }
      ]
      
      const newSchedule = await service.regenerateSchedule(currentAppointments)
      expect(Array.isArray(newSchedule)).toBe(true)
      expect(newSchedule).toHaveLength(currentAppointments.length)
      
      // Dates should be different (within reasonable range)
      const originalDate = new Date(currentAppointments[0].date)
      const newDate = new Date(newSchedule[0].date)
      const daysDiff = Math.abs((newDate - originalDate) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBeLessThanOrEqual(14) // Within 2 weeks
    })
  })
})