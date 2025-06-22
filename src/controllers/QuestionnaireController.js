import { QuestionnaireService } from '../services/QuestionnaireService.js';
import { userPreferencesService } from '../services/UserPreferencesService.js';

/**
 * Handles the health preferences questionnaire as a single page form
 */
export class QuestionnaireController {
  constructor() {
    this.questionnaireService = new QuestionnaireService();
    this.userAnswers = {};
    this.dynamicQuestions = null;
    this.hasExistingPreferences = false;
  }

  async initialize() {
    this.setupQuestionnaireHandlers();
    await this.loadPreviousAnswers();
  }

  /**
   * Load previously saved questionnaire answers
   */
  async loadPreviousAnswers() {
    try {
      const savedData = await userPreferencesService.getPreferences(
        userPreferencesService.steps.QUESTIONNAIRE
      );
      
      if (savedData && savedData.preferences && savedData.preferences.answers) {
        console.log('Loading previous questionnaire answers');
        this.userAnswers = savedData.preferences.answers;
        this.dynamicQuestions = savedData.preferences.dynamicQuestions;
        this.hasExistingPreferences = true;
        
        console.log('Found existing preferences, will show update mode');
      } else {
        console.log('No existing preferences found, will show save mode');
        this.hasExistingPreferences = false;
      }
    } catch (error) {
      console.error('Failed to load previous questionnaire answers:', error);
      this.hasExistingPreferences = false;
    }
  }

  setupQuestionnaireHandlers() {
    // Form submission handler will be set up when form is created
  }

  /**
   * Start questionnaire with optional dynamic questions
   * @param {Array} dynamicQuestions - Questions generated from AI analysis
   */
  start(dynamicQuestions = null) {
    // Use dynamic questions if provided, otherwise use stored or default
    if (dynamicQuestions) {
      this.dynamicQuestions = dynamicQuestions;
    }

    this.displayForm();
  }

  /**
   * Get the current set of questions (dynamic or default)
   */
  getQuestions() {
    return this.dynamicQuestions || this.questionnaireService.getQuestions();
  }

  /**
   * Display the complete form with all questions
   */
  displayForm() {
    const container = document.getElementById('questionContainer');
    if (!container) return;

    const questions = this.getQuestions();
    
    // Create form HTML
    let formHtml = `
      <form id="preferences-form" class="preferences-form">
        <div class="form-sections">
    `;

    // Group questions into sections for better organization
    const sections = this.groupQuestionsIntoSections(questions);
    
    sections.forEach(section => {
      formHtml += `
        <div class="form-section">
          <h3 class="section-title">${section.title}</h3>
          <div class="section-questions">
      `;
      
      section.questions.forEach(question => {
        formHtml += this.renderQuestion(question);
      });
      
      formHtml += `
          </div>
        </div>
      `;
    });

    // Add form actions
    const buttonText = this.hasExistingPreferences ? 'Update Preferences' : 'Save Preferences';
    const buttonClass = this.hasExistingPreferences ? 'btn--secondary' : 'btn--primary';
    
    formHtml += `
        </div>
        <div class="form-actions">
          <button type="submit" class="btn ${buttonClass} btn--lg">
            ${buttonText}
          </button>
          ${this.hasExistingPreferences ? '<button type="button" class="btn btn--outline" id="reset-preferences">Reset to Defaults</button>' : ''}
        </div>
      </form>
    `;

    container.innerHTML = formHtml;
    
    // Set up form handlers and restore values
    this.setupFormHandlers();
    this.restoreFormValues();
    
    // Update the page title and remove progress indicators
    this.updatePageHeader();
  }

  /**
   * Group questions into logical sections
   */
  groupQuestionsIntoSections(questions) {
    const sections = [
      {
        title: 'Appointment Preferences',
        questions: questions.filter(q => 
          q.key === 'timePreference' || 
          q.key === 'travelDistance' ||
          q.key === 'providerGender' ||
          q.key === 'languagePreference'
        )
      },
      {
        title: 'Healthcare Services',
        questions: questions.filter(q => 
          q.key === 'importantServices' ||
          q.key.includes('Frequency') ||
          q.key === 'alternativeTherapies'
        )
      },
      {
        title: 'Health Information',
        questions: questions.filter(q => 
          q.key === 'healthConcerns' ||
          q.key === 'preventiveCareFrequency'
        )
      }
    ];

    // Add any remaining questions to the first section
    const assignedQuestions = sections.flatMap(s => s.questions);
    const remainingQuestions = questions.filter(q => !assignedQuestions.includes(q));
    if (remainingQuestions.length > 0) {
      sections[0].questions.push(...remainingQuestions);
    }

    return sections.filter(section => section.questions.length > 0);
  }

  /**
   * Update page header to reflect single form mode
   */
  updatePageHeader() {
    const progressHeader = document.querySelector('.progress-header');
    if (progressHeader) {
      const title = this.hasExistingPreferences ? 'Update Your Health Preferences' : 'Set Your Health Preferences';
      const subtitle = this.hasExistingPreferences ? 
        'Review and update your healthcare preferences below.' :
        'Tell us about your healthcare preferences to create your personalized schedule.';
      
      progressHeader.innerHTML = `
        <h2>${title}</h2>
        <p class="text-secondary">${subtitle}</p>
      `;
    }
  }

  /**
   * Render a single question
   */
  renderQuestion(question) {
    let html = `
      <div class="question-item" data-question-key="${question.key}">
        <label class="question-label">
          ${question.question}
          ${question.aiGenerated ? '<span class="ai-indicator">🤖 AI-customized</span>' : ''}
        </label>
        <div class="question-input">
    `;
    
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
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }

  renderRadioOptions(question) {
    return question.options.map(option => `
      <label class="radio-option">
        <input type="radio" name="${question.key}" value="${option}" data-key="${question.key}">
        <span class="radio-label">${option}</span>
      </label>
    `).join('');
  }

  renderCheckboxOptions(question) {
    return `
      <div class="checkbox-group">
        ${question.options.map(option => `
          <label class="checkbox-option">
            <input type="checkbox" name="${question.key}" value="${option}" data-key="${question.key}">
            <span class="checkbox-label">${option}</span>
          </label>
        `).join('')}
      </div>
    `;
  }

  renderSliderOption(question) {
    return `
      <div class="slider-container">
        <div class="slider-labels">
          <span>${question.labels[0]}</span>
          <span>${question.labels[question.labels.length - 1]}</span>
        </div>
        <input type="range" class="slider" name="${question.key}" 
               min="${question.min}" max="${question.max}" 
               value="${question.min}" data-key="${question.key}">
        <div class="slider-value" id="slider-value-${question.id}">
          ${question.labels[0]}
        </div>
      </div>
    `;
  }

  renderTextareaOption(question) {
    return `
      <textarea class="form-control" name="${question.key}" rows="4" 
                placeholder="${question.placeholder}" data-key="${question.key}"></textarea>
    `;
  }

  /**
   * Set up form event handlers
   */
  setupFormHandlers() {
    const form = document.getElementById('preferences-form');
    if (!form) return;

    // Form submission handler
    form.addEventListener('submit', this.handleFormSubmit.bind(this));

    // Radio button handlers
    const radioInputs = form.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.userAnswers[e.target.dataset.key] = e.target.value;
        console.log('Radio changed:', e.target.dataset.key, '=', e.target.value);
      });
    });

    // Checkbox handlers
    const checkboxInputs = form.querySelectorAll('input[type="checkbox"]');
    checkboxInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        if (!this.userAnswers[key]) this.userAnswers[key] = [];
        
        if (e.target.checked) {
          this.userAnswers[key].push(e.target.value);
        } else {
          this.userAnswers[key] = this.userAnswers[key].filter(item => item !== e.target.value);
        }
        console.log('Checkbox changed:', key, '=', this.userAnswers[key]);
      });
    });

    // Slider handlers
    const sliderInputs = form.querySelectorAll('input[type="range"]');
    sliderInputs.forEach(input => {
      const question = this.getQuestions().find(q => q.key === input.dataset.key);
      
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
        console.log('Slider changed:', key, '=', value);
      });
    });

    // Textarea handlers
    const textareaInputs = form.querySelectorAll('textarea');
    textareaInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.userAnswers[e.target.dataset.key] = e.target.value;
        console.log('Textarea changed:', e.target.dataset.key, '=', e.target.value);
      });
    });

    // Reset button handler
    const resetBtn = document.getElementById('reset-preferences');
    if (resetBtn) {
      resetBtn.addEventListener('click', this.handleReset.bind(this));
    }
  }

  /**
   * Restore form values from saved preferences
   */
  restoreFormValues() {
    if (!this.hasExistingPreferences || Object.keys(this.userAnswers).length === 0) {
      console.log('No existing preferences to restore');
      return;
    }

    console.log('Restoring form values:', this.userAnswers);

    const form = document.getElementById('preferences-form');
    if (!form) return;

    Object.keys(this.userAnswers).forEach(key => {
      const value = this.userAnswers[key];
      console.log('Restoring:', key, '=', value);
      
      // Handle radio buttons
      const radioInput = form.querySelector(`input[type="radio"][data-key="${key}"][value="${value}"]`);
      if (radioInput) {
        radioInput.checked = true;
        console.log('Restored radio:', key, '=', value);
      }

      // Handle checkboxes
      if (Array.isArray(value)) {
        value.forEach(val => {
          const checkboxInput = form.querySelector(`input[type="checkbox"][data-key="${key}"][value="${val}"]`);
          if (checkboxInput) {
            checkboxInput.checked = true;
            console.log('Restored checkbox:', key, '=', val);
          }
        });
      }

      // Handle sliders
      const sliderInput = form.querySelector(`input[type="range"][data-key="${key}"]`);
      if (sliderInput) {
        sliderInput.value = value;
        // Trigger input event to update display
        sliderInput.dispatchEvent(new Event('input'));
        console.log('Restored slider:', key, '=', value);
      }

      // Handle textareas
      const textareaInput = form.querySelector(`textarea[data-key="${key}"]`);
      if (textareaInput) {
        textareaInput.value = value;
        console.log('Restored textarea:', key, '=', value);
      }
    });
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      console.log('Submitting form with answers:', this.userAnswers);
      
      // Save or update preferences
      const result = await this.savePreferences();
      
      if (result.success) {
        const message = this.hasExistingPreferences ? 
          'Preferences updated successfully!' : 
          'Preferences saved successfully!';
        
        // Show success message
        this.showSuccessMessage(message);
        
        // Update state
        this.hasExistingPreferences = true;
        
        // Update button text
        const submitBtn = document.querySelector('#preferences-form button[type="submit"]');
        if (submitBtn) {
          submitBtn.textContent = 'Update Preferences';
          submitBtn.className = submitBtn.className.replace('btn--primary', 'btn--secondary');
        }
        
        // Navigate to calendar after successful save/update
        setTimeout(() => {
          this.emit('questionnaireComplete', this.userAnswers);
        }, 1500);
      } else {
        this.showErrorMessage('Failed to save preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      this.showErrorMessage('An error occurred while saving preferences.');
    }
  }

  /**
   * Handle reset to defaults
   */
  async handleReset() {
    if (confirm('Are you sure you want to reset all preferences to defaults? This action cannot be undone.')) {
      try {
        // Clear saved preferences
        await userPreferencesService.deletePreferences(userPreferencesService.steps.QUESTIONNAIRE);
        
        // Reset local state
        this.userAnswers = {};
        this.hasExistingPreferences = false;
        
        // Reload the form
        this.displayForm();
        
        this.showSuccessMessage('Preferences reset to defaults.');
      } catch (error) {
        console.error('Error resetting preferences:', error);
        this.showErrorMessage('Failed to reset preferences.');
      }
    }
  }

  /**
   * Save current preferences
   */
  async savePreferences() {
    try {
      const preferencesData = {
        answers: this.userAnswers,
        dynamicQuestions: this.dynamicQuestions,
        completed: true,
        completedAt: new Date().toISOString(),
        formMode: true // Flag to indicate this was saved via form mode
      };

      if (this.hasExistingPreferences) {
        return await userPreferencesService.updatePreferences(
          userPreferencesService.steps.QUESTIONNAIRE,
          preferencesData
        );
      } else {
        return await userPreferencesService.savePreferences(
          userPreferencesService.steps.QUESTIONNAIRE,
          preferencesData
        );
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    // Create and show a temporary success message
    const messageEl = document.createElement('div');
    messageEl.className = 'success-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-success);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 1000;
      box-shadow: var(--shadow-md);
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    // Create and show a temporary error message
    const messageEl = document.createElement('div');
    messageEl.className = 'error-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-error);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 1000;
      box-shadow: var(--shadow-md);
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }

  // Event system
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`questionnaireController:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`questionnaireController:${event}`, callback);
  }
}