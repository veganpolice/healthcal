import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuestionnaireController } from '../../src/controllers/QuestionnaireController.js'

// Mock the service
vi.mock('../../src/services/QuestionnaireService.js', () => ({
  QuestionnaireService: vi.fn(() => ({
    getQuestions: vi.fn(() => [
      {
        id: 1,
        question: 'Test question?',
        type: 'radio',
        options: ['Option 1', 'Option 2'],
        key: 'testKey'
      },
      {
        id: 2,
        question: 'Test question 2?',
        type: 'checkbox',
        options: ['Option A', 'Option B'],
        key: 'testKey2'
      }
    ])
  }))
}))

describe('QuestionnaireController', () => {
  let controller

  beforeEach(() => {
    controller = new QuestionnaireController()
    // Reset DOM
    document.body.innerHTML = `
      <div id="questionContainer"></div>
      <div id="progressFill"></div>
      <span id="currentQuestion">1</span>
      <span id="totalQuestions">2</span>
      <button id="prevBtn">Previous</button>
      <button id="nextBtn">Next</button>
    `
  })

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(controller.initialize()).resolves.not.toThrow()
    })
  })

  describe('start', () => {
    it('should reset state and display first question', () => {
      controller.start()
      
      expect(controller.currentQuestionIndex).toBe(0)
      expect(Object.keys(controller.userAnswers)).toHaveLength(0)
      
      const questionContainer = document.getElementById('questionContainer')
      expect(questionContainer.innerHTML).toContain('Test question?')
    })
  })

  describe('displayQuestion', () => {
    it('should render question content', () => {
      controller.start()
      
      const questionContainer = document.getElementById('questionContainer')
      expect(questionContainer.innerHTML).toContain('Test question?')
      expect(questionContainer.innerHTML).toContain('Option 1')
      expect(questionContainer.innerHTML).toContain('Option 2')
    })
  })

  describe('navigation', () => {
    it('should navigate to next question', () => {
      controller.start()
      expect(controller.currentQuestionIndex).toBe(0)
      
      controller.nextQuestion()
      expect(controller.currentQuestionIndex).toBe(1)
    })

    it('should navigate to previous question', () => {
      controller.start()
      controller.nextQuestion() // Go to question 2
      expect(controller.currentQuestionIndex).toBe(1)
      
      controller.previousQuestion()
      expect(controller.currentQuestionIndex).toBe(0)
    })

    it('should not go below 0 for previous', () => {
      controller.start()
      controller.previousQuestion()
      expect(controller.currentQuestionIndex).toBe(0)
    })
  })

  describe('updateProgress', () => {
    it('should update progress indicators', () => {
      controller.start()
      controller.updateProgress()
      
      const progressFill = document.getElementById('progressFill')
      const currentQuestion = document.getElementById('currentQuestion')
      const totalQuestions = document.getElementById('totalQuestions')
      
      expect(progressFill.style.width).toBe('50%') // 1 of 2 questions
      expect(currentQuestion.textContent).toBe('1')
      expect(totalQuestions.textContent).toBe('2')
    })
  })

  describe('renderQuestion', () => {
    it('should render radio question', () => {
      const question = {
        id: 1,
        question: 'Test radio?',
        type: 'radio',
        options: ['Yes', 'No'],
        key: 'testRadio'
      }
      
      const html = controller.renderQuestion(question)
      expect(html).toContain('Test radio?')
      expect(html).toContain('type="radio"')
      expect(html).toContain('Yes')
      expect(html).toContain('No')
    })

    it('should render checkbox question', () => {
      const question = {
        id: 2,
        question: 'Test checkbox?',
        type: 'checkbox',
        options: ['Option A', 'Option B'],
        key: 'testCheckbox'
      }
      
      const html = controller.renderQuestion(question)
      expect(html).toContain('Test checkbox?')
      expect(html).toContain('type="checkbox"')
      expect(html).toContain('Option A')
      expect(html).toContain('Option B')
    })

    it('should render slider question', () => {
      const question = {
        id: 3,
        question: 'Test slider?',
        type: 'slider',
        min: 1,
        max: 5,
        labels: ['Low', 'Medium', 'High'],
        key: 'testSlider'
      }
      
      const html = controller.renderQuestion(question)
      expect(html).toContain('Test slider?')
      expect(html).toContain('type="range"')
      expect(html).toContain('min="1"')
      expect(html).toContain('max="5"')
    })

    it('should render textarea question', () => {
      const question = {
        id: 4,
        question: 'Test textarea?',
        type: 'textarea',
        placeholder: 'Enter text...',
        key: 'testTextarea'
      }
      
      const html = controller.renderQuestion(question)
      expect(html).toContain('Test textarea?')
      expect(html).toContain('<textarea')
      expect(html).toContain('Enter text...')
    })
  })

  describe('event system', () => {
    it('should emit completion event', () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent')
      controller.completeQuestionnaire()
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'questionnaireController:questionnaireComplete'
        })
      )
    })
  })
})