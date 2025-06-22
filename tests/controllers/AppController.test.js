import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppController } from '../../src/controllers/AppController.js'

// Mock all the controller dependencies
vi.mock('../../src/controllers/PageManager.js', () => ({
  PageManager: vi.fn(() => ({
    initialize: vi.fn(() => Promise.resolve()),
    showPage: vi.fn()
  }))
}))

vi.mock('../../src/controllers/NavigationController.js', () => ({
  NavigationController: vi.fn(() => ({
    initialize: vi.fn(() => Promise.resolve())
  }))
}))

vi.mock('../../src/controllers/UploadController.js', () => ({
  UploadController: vi.fn(() => ({
    initialize: vi.fn(() => Promise.resolve()),
    on: vi.fn()
  }))
}))

vi.mock('../../src/controllers/QuestionnaireController.js', () => ({
  QuestionnaireController: vi.fn(() => ({
    initialize: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    start: vi.fn()
  }))
}))

vi.mock('../../src/controllers/CalendarController.js', () => ({
  CalendarController: vi.fn(() => ({
    initialize: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    generateSchedule: vi.fn()
  }))
}))

vi.mock('../../src/controllers/ModalController.js', () => ({
  ModalController: vi.fn(() => ({
    initialize: vi.fn(() => Promise.resolve()),
    showAppointmentDetails: vi.fn()
  }))
}))

describe('AppController', () => {
  let appController

  beforeEach(() => {
    appController = new AppController()
  })

  describe('initialize', () => {
    it('should initialize all controllers', async () => {
      await appController.initialize()
      
      expect(appController.controllers.pageManager).toBeDefined()
      expect(appController.controllers.navigation).toBeDefined()
      expect(appController.controllers.upload).toBeDefined()
      expect(appController.controllers.questionnaire).toBeDefined()
      expect(appController.controllers.calendar).toBeDefined()
      expect(appController.controllers.modal).toBeDefined()
      expect(appController.isInitialized).toBe(true)
    })

    it('should not initialize twice', async () => {
      await appController.initialize()
      const firstPageManager = appController.controllers.pageManager
      
      await appController.initialize()
      expect(appController.controllers.pageManager).toBe(firstPageManager)
    })

    it('should handle initialization errors', async () => {
      // Mock one controller to throw an error
      const { PageManager } = await import('../../src/controllers/PageManager.js')
      PageManager.mockImplementation(() => ({
        initialize: vi.fn(() => Promise.reject(new Error('Test error')))
      }))
      
      await expect(appController.initialize()).rejects.toThrow('Test error')
    })
  })

  describe('setupControllerCommunication', () => {
    it('should set up event listeners between controllers', async () => {
      await appController.initialize()
      
      // Verify that event listeners were set up
      expect(appController.controllers.upload.on).toHaveBeenCalledWith(
        'uploadComplete',
        expect.any(Function)
      )
      expect(appController.controllers.questionnaire.on).toHaveBeenCalledWith(
        'questionnaireComplete',
        expect.any(Function)
      )
      expect(appController.controllers.calendar.on).toHaveBeenCalledWith(
        'appointmentSelected',
        expect.any(Function)
      )
    })
  })

  describe('getController', () => {
    it('should return specific controller', async () => {
      await appController.initialize()
      
      const pageManager = appController.getController('pageManager')
      expect(pageManager).toBe(appController.controllers.pageManager)
    })

    it('should return undefined for non-existent controller', async () => {
      await appController.initialize()
      
      const nonExistent = appController.getController('nonExistent')
      expect(nonExistent).toBeUndefined()
    })
  })
})