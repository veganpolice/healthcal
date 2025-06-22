import { QuestionnaireService } from '../services/QuestionnaireService.js';

/**
 * Handles the health preferences questionnaire
 */
export class QuestionnaireController {
  constructor() {
    this.questionnaireService = new QuestionnaireService();
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
  }

  async initialize() {
    this.setupQuestionnaireHandlers();
  }

  setupQuestionnaireHandlers() {
    // Navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
      prevBtn.removeAttribute('onclick');
      prevBtn.addEventListener('click', this.previousQuestion.bind(this));
    }

    if (nextBtn) {
      nextBtn.removeAttribute('onclick');
      nextBtn.addEventListener('click', this.nextQuestion.bind(this));
    }
  }

  start() {
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.displayQuestion();
    this.updateProgress();
  }

  displayQuestion() {
    const questions = this.questionnaireService.getQuestions();
    const question = questions[this.currentQuestionIndex];
    const container = document.getElementById('questionContainer');
    
    if (!container || !question) return;

    container.innerHTML = this.renderQuestion(question);
    this.setupQuestionHandlers(question);
    this.updateNavigationButtons();
  }

  renderQuestion(question) {
    let html = `<div class="question">
      <h3>${question.question}</h3>
      <div class="question-options">`;
    
    switch (question.type) {
      case 'radio':
        html += this.renderRadioOptions(question);
        break;
      case 'checkbox':
        html += this.renderCheckboxOptions(question);
        break;
      case 'slider':
        html += this.renderSliderOption(question);
        break;
      case 'textarea':
        html += this.renderTextareaOption(question);
        break;
    }
    
    html += '</div></div>';
    return html;
  }

  renderRadioOptions(question) {
    return question.options.map(option => `
      <label class="checkbox-item">
        <input type="radio" name="question_${question.id}" value="${option}" 
               data-key="${question.key}">
        <span>${option}</span>
      </label>
    `).join('');
  }

  renderCheckboxOptions(question) {
    let html = '<div class="checkbox-group">';
    html += question.options.map(option => `
      <label class="checkbox-item">
        <input type="checkbox" value="${option}" data-key="${question.key}">
        <span>${option}</span>
      </label>
    `).join('');
    html += '</div>';
    return html;
  }

  renderSliderOption(question) {
    return `
      <div class="slider-container">
        <div class="slider-labels">
          <span>${question.labels[0]}</span>
          <span>${question.labels[question.labels.length - 1]}</span>
        </div>
        <input type="range" class="slider" min="${question.min}" max="${question.max}" 
               value="${question.min}" data-key="${question.key}">
        <div class="slider-value" id="slider-value-${question.id}">
          ${question.labels[0]}
        </div>
      </div>
    `;
  }

  renderTextareaOption(question) {
    return `
      <textarea class="form-control" rows="4" placeholder="${question.placeholder}"
                data-key="${question.key}"></textarea>
    `;
  }

  setupQuestionHandlers(question) {
    const container = document.getElementById('questionContainer');
    
    // Radio buttons
    const radioInputs = container.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.userAnswers[e.target.dataset.key] = e.target.value;
      });
    });

    // Checkboxes
    const checkboxInputs = container.querySelectorAll('input[type="checkbox"]');
    checkboxInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        if (!this.userAnswers[key]) this.userAnswers[key] = [];
        
        if (e.target.checked) {
          this.userAnswers[key].push(e.target.value);
        } else {
          this.userAnswers[key] = this.userAnswers[key].filter(item => item !== e.target.value);
        }
      });
    });

    // Sliders
    const sliderInputs = container.querySelectorAll('input[type="range"]');
    sliderInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const key = e.target.dataset.key;
        const value = e.target.value;
        const index = Math.min(parseInt(value) - question.min, question.labels.length - 1);
        const label = question.labels[index];
        
        this.userAnswers[key] = value;
        const valueDisplay = document.getElementById(`slider-value-${question.id}`);
        if (valueDisplay) {
          valueDisplay.textContent = label;
        }
      });
    });

    // Textarea
    const textareaInputs = container.querySelectorAll('textarea');
    textareaInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.userAnswers[e.target.dataset.key] = e.target.value;
      });
    });
  }

  nextQuestion() {
    const questions = this.questionnaireService.getQuestions();
    
    if (this.currentQuestionIndex < questions.length - 1) {
      this.currentQuestionIndex++;
      this.displayQuestion();
      this.updateProgress();
    } else {
      this.completeQuestionnaire();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.displayQuestion();
      this.updateProgress();
    }
  }

  updateProgress() {
    const questions = this.questionnaireService.getQuestions();
    const progress = ((this.currentQuestionIndex + 1) / questions.length) * 100;
    
    const progressFill = document.getElementById('progressFill');
    const currentQuestion = document.getElementById('currentQuestion');
    const totalQuestions = document.getElementById('totalQuestions');
    
    if (progressFill) progressFill.style.width = progress + '%';
    if (currentQuestion) currentQuestion.textContent = this.currentQuestionIndex + 1;
    if (totalQuestions) totalQuestions.textContent = questions.length;
  }

  updateNavigationButtons() {
    const questions = this.questionnaireService.getQuestions();
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.disabled = this.currentQuestionIndex === 0;
    if (nextBtn) {
      nextBtn.textContent = this.currentQuestionIndex === questions.length - 1 
        ? 'Generate My Schedule' 
        : 'Next';
    }
  }

  completeQuestionnaire() {
    this.emit('questionnaireComplete', this.userAnswers);
  }

  // Event system
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`questionnaireController:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`questionnaireController:${event}`, callback);
  }
}