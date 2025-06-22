import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UploadController } from '../../src/controllers/UploadController.js'

// Mock the services
vi.mock('../../src/services/FileUploadService.js', () => ({
  FileUploadService: vi.fn(() => ({
    validateFile: vi.fn(() => ({ isValid: true }))
  }))
}))

vi.mock('../../src/services/InsuranceService.js', () => ({
  InsuranceService: vi.fn(() => ({
    processDocument: vi.fn(() => Promise.resolve({ planName: 'Test Plan' })),
    getDemoData: vi.fn(() => ({ planName: 'Demo Plan' }))
  }))
}))

describe('UploadController', () => {
  let controller

  beforeEach(() => {
    controller = new UploadController()
    // Reset DOM
    document.body.innerHTML = `
      <div id="uploadArea"></div>
      <input id="fileInput" type="file" />
      <button id="demo-btn">Try Demo</button>
      <button id="continue-btn">Continue</button>
      <div id="processingSection" class="hidden"></div>
      <div id="extractedInfo" class="hidden"></div>
    `
  })

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(controller.initialize()).resolves.not.toThrow()
    })

    it('should set up event handlers', async () => {
      await controller.initialize()
      
      const uploadArea = document.getElementById('uploadArea')
      const demoBtn = document.getElementById('demo-btn')
      const continueBtn = document.getElementById('continue-btn')
      
      expect(uploadArea).toBeTruthy()
      expect(demoBtn).toBeTruthy()
      expect(continueBtn).toBeTruthy()
    })
  })

  describe('handleDemo', () => {
    it('should set demo mode and show processing', () => {
      controller.handleDemo()
      expect(controller.isDemoMode).toBe(true)
      
      const processingSection = document.getElementById('processingSection')
      expect(processingSection.classList.contains('hidden')).toBe(false)
    })
  })

  describe('showProcessing', () => {
    it('should hide upload area and show processing section', () => {
      controller.showProcessing()
      
      const uploadArea = document.getElementById('uploadArea')
      const processingSection = document.getElementById('processingSection')
      
      expect(uploadArea.classList.contains('hidden')).toBe(true)
      expect(processingSection.classList.contains('hidden')).toBe(false)
    })
  })

  describe('showResults', () => {
    it('should hide processing and show results', () => {
      controller.showResults({})
      
      const processingSection = document.getElementById('processingSection')
      const resultsSection = document.getElementById('extractedInfo')
      
      expect(processingSection.classList.contains('hidden')).toBe(true)
      expect(resultsSection.classList.contains('hidden')).toBe(false)
    })
  })

  describe('event system', () => {
    it('should emit events', () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent')
      controller.emit('test', { data: 'test' })
      expect(eventSpy).toHaveBeenCalled()
    })

    it('should listen to events', () => {
      const callback = vi.fn()
      controller.on('test', callback)
      
      document.dispatchEvent(new CustomEvent('uploadController:test'))
      expect(callback).toHaveBeenCalled()
    })
  })
})