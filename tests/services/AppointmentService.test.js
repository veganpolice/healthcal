import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppointmentService } from '../../src/services/AppointmentService.js'
import { DatabaseService } from '../../src/services/DatabaseService.js'

// Mock DatabaseService
vi.mock('../../src/services/DatabaseService.js', () => ({
  DatabaseService: {
    isConnected: vi.fn(() => false),
    query: vi.fn(),
    insert: vi.fn(),
    update: vi.fn()
  }
}))

describe('AppointmentService', () => {
  let service

  beforeEach(() => {
    service = new AppointmentService()
    vi.clearAllMocks()
  })

  describe('getAppointments', () => {
    it('should return sample appointments when database not connected', async () => {
      DatabaseService.isConnected.mockReturnValue(false)
      const appointments = await service.getAppointments()
      expect(Array.isArray(appointments)).toBe(true)
      expect(appointments.length).toBeGreaterThan(0)
      expect(appointments[0]).toHaveProperty('id')
      expect(appointments[0]).toHaveProperty('date')
      expect(appointments[0]).toHaveProperty('type')
    })

    it('should return database appointments when connected', async () => {
      const mockData = [{ id: 1, date: '2025-01-01', type: 'Test' }]
      DatabaseService.isConnected.mockReturnValue(true)
      DatabaseService.query.mockResolvedValue({ data: mockData, error: null })
      
      const appointments = await service.getAppointments()
      expect(appointments).toEqual(mockData)
    })
  })

  describe('getAppointmentById', () => {
    it('should return appointment by ID', async () => {
      const appointment = await service.getAppointmentById(1)
      expect(appointment).toBeTruthy()
      expect(appointment.id).toBe(1)
    })

    it('should return null for non-existent ID', async () => {
      const appointment = await service.getAppointmentById(999)
      expect(appointment).toBe(null)
    })
  })

  describe('createAppointment', () => {
    it('should create appointment in demo mode', async () => {
      DatabaseService.isConnected.mockReturnValue(false)
      const appointmentData = {
        date: '2025-01-01',
        type: 'Test Appointment',
        provider: 'Dr. Test'
      }
      
      const result = await service.createAppointment(appointmentData)
      expect(result).toHaveProperty('id')
      expect(result.status).toBe('proposed')
      expect(result.type).toBe('Test Appointment')
    })
  })

  describe('getAppointmentsByDateRange', () => {
    it('should filter appointments by date range', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')
      
      const appointments = await service.getAppointmentsByDateRange(startDate, endDate)
      expect(Array.isArray(appointments)).toBe(true)
      
      // Check that all returned appointments are within the date range
      appointments.forEach(apt => {
        const aptDate = new Date(apt.date)
        expect(aptDate >= startDate && aptDate <= endDate).toBe(true)
      })
    })
  })

  describe('getAppointmentsByCategory', () => {
    it('should filter appointments by category', async () => {
      const appointments = await service.getAppointmentsByCategory('dental')
      expect(Array.isArray(appointments)).toBe(true)
      
      appointments.forEach(apt => {
        expect(apt.category).toBe('dental')
      })
    })
  })
})