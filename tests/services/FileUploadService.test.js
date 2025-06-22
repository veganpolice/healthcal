import { describe, it, expect, beforeEach } from 'vitest'
import { FileUploadService } from '../../src/services/FileUploadService.js'

describe('FileUploadService', () => {
  let service

  beforeEach(() => {
    service = new FileUploadService()
  })

  describe('validateFile', () => {
    it('should return invalid for null file', () => {
      const result = service.validateFile(null)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('No file provided')
    })

    it('should return invalid for unsupported file type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const result = service.validateFile(file)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Please upload a PDF, JPG, or PNG file.')
    })

    it('should return invalid for file too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'test.pdf', { 
        type: 'application/pdf' 
      })
      const result = service.validateFile(largeFile)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('File size must be less than 10MB.')
    })

    it('should return valid for supported PDF file', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const result = service.validateFile(file)
      expect(result.isValid).toBe(true)
    })

    it('should return valid for supported image file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = service.validateFile(file)
      expect(result.isValid).toBe(true)
    })
  })

  describe('fileToBase64', () => {
    it('should convert file to base64', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const result = await service.fileToBase64(file)
      expect(result).toMatch(/^data:text\/plain;base64,/)
    })
  })

  describe('uploadFile', () => {
    it('should return success for file upload placeholder', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const result = await service.uploadFile(file)
      expect(result.success).toBe(true)
      expect(result.url).toBe(null)
    })
  })
})