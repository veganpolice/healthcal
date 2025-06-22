import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppController } from '../../src/controllers/AppController.js'

// Mock all dependencies for integration test
vi.mock('../../src/services/DatabaseService.js', () => ({
  DatabaseService: {
    initialize: vi.fn(() => Promise.resolve()),
    isConnected: vi.fn(() => false)
  }
}))

describe('Application Workflow Integration', () => {
  let appController

  beforeEach(() => {
    // Set up DOM for integration test
    document.body.innerHTML = `
      <div id="welcome-page" class="page active"></div>
      <div id="upload-page" class="page"></div>
      <div id="questionnaire-page" class="page"></div>
      <div id="calendar-page" class="page"></div>
      <div id="uploadArea"></div>
      <input id="fileInput" type="file" />
      <button id="demo-btn">Try Demo</button>
      <button id="continue-btn">Continue</button>
      <button id="get-started-btn">Get Started</button>
      <div id="processingSection" class="hidden"></div>
      <div id="extractedInfo" class="hidden"></div>
      <div id="questionContainer"></div>
      <div id="progressFill"></div>
      <span id="currentQuestion">1</span>
      <span id="totalQuestions">8</span>
      <button id="prevBtn">Previous</button>
      <button id="nextBtn">Next</button>
      <div id="calendarGrid"></div>
      <div id="appointmentModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modalTitle">Title</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div id="modalBody">Body</div>
        </div>
      </div>
    `
    
    appController = new AppController()
  })

  describe('Full Application Flow', () => {
    it('should initialize application successfully', async () => {
      await expect(appController.initialize()).resolves.not.toThrow()
      expect(appController.isInitialized).toBe(true)
    })

    it('should handle upload to questionnaire flow', async () => {
      await appController.initialize()
      
      // Simulate upload completion
      const uploadController = appController.getController('upload')
      const pageManager = appController.getController('pageManager')
      const questionnaireController = appController.getController('questionnaire')
      
      // Mock the methods we'll be calling
      pageManager.showPage = vi.fn()
      questionnaireController.start = vi.fn()
      
      // Trigger upload complete event
      document.dispatchEvent(new CustomEvent('uploadController:uploadComplete'))
      
      // Verify the flow
      expect(pageManager.showPage).toHaveBeenCalledWith('questionnaire')
      expect(questionnaireController.start).toHaveBeenCalled()
    })

    it('should handle questionnaire to calendar flow', async () => {
      await appController.initialize()
      
      const pageManager = appController.getController('pageManager')
      const calendarController = appController.getController('calendar')
      
      // Mock the methods
      pageManager.showPage = vi.fn()
      calendarController.generateSchedule = vi.fn()
      
      const mockAnswers = { timePreference: 'Morning' }
      
      // Trigger questionnaire complete event
      document.dispatchEvent(new CustomEvent('questionnaireController:questionnaireComplete', {
        detail: mockAnswers
      }))
      
      // Verify the flow - expect the detail payload, not the CustomEvent
      expect(pageManager.showPage).toHaveBeenCalledWith('calendar')
      expect(calendarController.generateSchedule).toHaveBeenCalledWith(mockAnswers)
    })

    it('should handle calendar to modal flow', async () => {
      await appController.initialize()
      
      const modalController = appController.getController('modal')
      modalController.showAppointmentDetails = vi.fn()
      
      const mockAppointment = { id: 1, type: 'Test Appointment' }
      
      // Trigger appointment selected event
      document.dispatchEvent(new CustomEvent('calendarController:appointmentSelected', {
        detail: mockAppointment
      }))
      
      // Verify the flow - expect the detail payload, not the CustomEvent
      expect(modalController.showAppointmentDetails).toHaveBeenCalledWith(mockAppointment)
    })
  })

  describe('Error Handling', () => {
    it('should handle controller initialization errors gracefully', async () => {
      // Create a fresh AppController instance for this test
      const errorAppController = new AppController()
      
      // Initialize first to create the controllers
      await errorAppController.initialize()
      
      // Now mock the pageManager's initialize method to throw an error
      vi.mocked(errorAppController.controllers.pageManager.initialize).mockImplementationOnce(() => {
        throw new Error('Mock initialization error')
      })
      
      // Reset initialization state to test error handling
      errorAppController.isInitialized = false
      
      await expect(errorAppController.initialize()).rejects.toThrow('Mock initialization error')
    })
  })
})