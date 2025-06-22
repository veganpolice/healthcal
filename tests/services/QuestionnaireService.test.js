import { describe, it, expect, beforeEach } from 'vitest'
import { QuestionnaireService } from '../../src/services/QuestionnaireService.js'

describe('QuestionnaireService', () => {
  let service

  beforeEach(() => {
    service = new QuestionnaireService()
  })

  describe('getQuestions', () => {
    it('should return array of questions', () => {
      const questions = service.getQuestions()
      expect(Array.isArray(questions)).toBe(true)
      expect(questions.length).toBeGreaterThan(0)
      expect(questions[0]).toHaveProperty('id')
      expect(questions[0]).toHaveProperty('question')
      expect(questions[0]).toHaveProperty('type')
    })
  })

  describe('getQuestionById', () => {
    it('should return question by ID', () => {
      const question = service.getQuestionById(1)
      expect(question).toBeTruthy()
      expect(question.id).toBe(1)
    })

    it('should return null for non-existent ID', () => {
      const question = service.getQuestionById(999)
      expect(question).toBe(null)
    })
  })

  describe('validateAnswers', () => {
    it('should validate answers successfully when no required questions', () => {
      const answers = { timePreference: 'Morning' }
      const result = service.validateAnswers(answers)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('processAnswers', () => {
    it('should process and normalize answers', () => {
      const rawAnswers = {
        timePreference: 'Morning',
        importantServices: ['Dental care'],
        preventiveCareFrequency: '2'
      }
      const processed = service.processAnswers(rawAnswers)
      expect(processed.timePreference).toBe('Morning')
      expect(processed.preventiveCareFrequency).toBe(2)
    })
  })

  describe('normalizeAnswer', () => {
    it('should normalize slider answer to integer', () => {
      const question = { type: 'slider' }
      const result = service.normalizeAnswer(question, '3')
      expect(result).toBe(3)
    })

    it('should normalize checkbox answer to array', () => {
      const question = { type: 'checkbox' }
      const result = service.normalizeAnswer(question, 'option1')
      expect(result).toEqual(['option1'])
    })

    it('should trim textarea answer', () => {
      const question = { type: 'textarea' }
      const result = service.normalizeAnswer(question, '  text  ')
      expect(result).toBe('text')
    })
  })
})