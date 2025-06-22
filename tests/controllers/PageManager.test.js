import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PageManager } from '../../src/controllers/PageManager.js'

describe('PageManager', () => {
  let pageManager

  beforeEach(() => {
    pageManager = new PageManager()
    // Reset DOM
    document.body.innerHTML = `
      <div id="welcome-page" class="page active"></div>
      <div id="upload-page" class="page"></div>
      <div id="questionnaire-page" class="page"></div>
      <div id="calendar-page" class="page"></div>
    `
  })

  describe('initialize', () => {
    it('should initialize and register pages', async () => {
      await pageManager.initialize()
      
      expect(pageManager.pages.size).toBe(4)
      expect(pageManager.pages.has('welcome')).toBe(true)
      expect(pageManager.pages.has('upload')).toBe(true)
      expect(pageManager.pages.has('questionnaire')).toBe(true)
      expect(pageManager.pages.has('calendar')).toBe(true)
    })

    it('should set initial page to welcome', async () => {
      await pageManager.initialize()
      expect(pageManager.currentPage).toBe('welcome')
    })
  })

  describe('showPage', () => {
    beforeEach(async () => {
      await pageManager.initialize()
    })

    it('should show target page and hide others', () => {
      pageManager.showPage('upload')
      
      const welcomePage = document.getElementById('welcome-page')
      const uploadPage = document.getElementById('upload-page')
      
      expect(welcomePage.classList.contains('active')).toBe(false)
      expect(uploadPage.classList.contains('active')).toBe(true)
      expect(pageManager.currentPage).toBe('upload')
    })

    it('should warn for non-existent page', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      pageManager.showPage('nonexistent')
      
      expect(consoleSpy).toHaveBeenCalledWith("Page 'nonexistent' not found")
      consoleSpy.mockRestore()
    })

    it('should emit page change event', () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent')
      
      pageManager.showPage('upload')
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pageManager:pageChanged'
        })
      )
    })
  })

  describe('getCurrentPage', () => {
    it('should return current page', async () => {
      await pageManager.initialize()
      expect(pageManager.getCurrentPage()).toBe('welcome')
      
      pageManager.showPage('upload')
      expect(pageManager.getCurrentPage()).toBe('upload')
    })
  })

  describe('event system', () => {
    it('should emit events', () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent')
      pageManager.emit('test', { data: 'test' })
      expect(eventSpy).toHaveBeenCalled()
    })

    it('should listen to events', () => {
      const callback = vi.fn()
      pageManager.on('test', callback)
      
      document.dispatchEvent(new CustomEvent('pageManager:test'))
      expect(callback).toHaveBeenCalled()
    })
  })
})