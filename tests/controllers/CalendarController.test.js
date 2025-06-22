import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CalendarController } from '../../src/controllers/CalendarController.js'

// Mock the services
vi.mock('../../src/services/AppointmentService.js', () => ({
  AppointmentService: vi.fn(() => ({
    getAppointments: vi.fn(() => Promise.resolve([
      {
        id: 1,
        date: '2025-01-15',
        type: 'Dental Cleaning',
        provider: 'Dr. Test',
        category: 'dental'
      }
    ]))
  }))
}))

vi.mock('../../src/services/SchedulingService.js', () => ({
  SchedulingService: vi.fn(() => ({
    generateSchedule: vi.fn(() => [
      {
        id: 1,
        date: '2025-01-15',
        type: 'Dental Cleaning',
        provider: 'Dr. Test',
        category: 'dental'
      }
    ]),
    regenerateSchedule: vi.fn(() => Promise.resolve([
      {
        id: 1,
        date: '2025-01-20',
        type: 'Dental Cleaning',
        provider: 'Dr. Test',
        category: 'dental'
      }
    ]))
  }))
}))

describe('CalendarController', () => {
  let controller

  beforeEach(() => {
    controller = new CalendarController()
    // Reset DOM
    document.body.innerHTML = `
      <div id="calendarGrid"></div>
    `
  })

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(controller.initialize()).resolves.not.toThrow()
    })
  })

  describe('loadAppointments', () => {
    it('should load appointments and render calendar', async () => {
      await controller.loadAppointments()
      
      expect(controller.appointments).toHaveLength(1)
      expect(controller.appointments[0].type).toBe('Dental Cleaning')
    })
  })

  describe('generateSchedule', () => {
    it('should generate schedule from user answers', () => {
      const userAnswers = {
        importantServices: ['Dental care'],
        timePreference: 'Morning'
      }
      
      controller.generateSchedule(userAnswers)
      
      expect(controller.appointments).toHaveLength(1)
      expect(controller.appointments[0].type).toBe('Dental Cleaning')
    })
  })

  describe('renderCalendar', () => {
    it('should render calendar grid', () => {
      controller.appointments = [
        {
          id: 1,
          date: '2025-01-15',
          type: 'Dental Cleaning',
          provider: 'Dr. Test',
          category: 'dental'
        }
      ]
      
      controller.renderCalendar()
      
      const calendarGrid = document.getElementById('calendarGrid')
      expect(calendarGrid.innerHTML).toContain('January 2025')
      expect(calendarGrid.innerHTML).toContain('Dental Cleaning')
    })
  })

  describe('renderMonthCard', () => {
    it('should render month card with appointments', () => {
      const appointments = [
        {
          id: 1,
          date: '2025-01-15',
          type: 'Dental Cleaning',
          provider: 'Dr. Test',
          category: 'dental'
        }
      ]
      
      const html = controller.renderMonthCard('January', appointments)
      
      expect(html).toContain('January 2025')
      expect(html).toContain('Dental Cleaning')
      expect(html).toContain('appointment-dot dental')
    })

    it('should render empty month card', () => {
      const html = controller.renderMonthCard('February', [])
      
      expect(html).toContain('February 2025')
      expect(html).toContain('No appointments scheduled')
    })
  })

  describe('generateNewSchedule', () => {
    it('should regenerate schedule', async () => {
      // Set up initial appointments
      controller.appointments = [
        {
          id: 1,
          date: '2025-01-15',
          type: 'Dental Cleaning',
          provider: 'Dr. Test',
          category: 'dental'
        }
      ]
      
      // Mock alert to avoid actual alert dialog
      global.alert = vi.fn()
      
      await controller.generateNewSchedule()
      
      expect(controller.appointments).toHaveLength(1)
      expect(controller.appointments[0].date).toBe('2025-01-20') // New date from mock
      expect(global.alert).toHaveBeenCalledWith('New schedule generated based on your preferences!')
    })
  })

  describe('event system', () => {
    it('should emit appointment selected event', () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent')
      const appointment = { id: 1, type: 'Test' }
      
      controller.emit('appointmentSelected', appointment)
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'calendarController:appointmentSelected'
        })
      )
    })
  })
})