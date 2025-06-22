/**
 * Manages questionnaire data and logic
 */
export class QuestionnaireService {
  constructor() {
    this.questions = [
      {
        id: 1,
        question: "What time of day do you prefer for medical appointments?",
        type: "radio",
        options: [
          "Morning (8AM - 12PM)",
          "Afternoon (12PM - 5PM)", 
          "Evening (5PM - 8PM)",
          "No preference"
        ],
        key: "timePreference"
      },
      {
        id: 2,
        question: "Which healthcare services are most important to you? (Select all that apply)",
        type: "checkbox",
        options: [
          "Dental care",
          "Physiotherapy",
          "Massage therapy",
          "Vision care",
          "Mental health",
          "Preventive care"
        ],
        key: "importantServices"
      },
      {
        id: 3,
        question: "How often would you like preventive care appointments?",
        type: "slider",
        min: 1,
        max: 4,
        labels: ["Once per year", "Twice per year", "3 times per year", "4 times per year"],
        key: "preventiveCareFrequency"
      },
      {
        id: 4,
        question: "Do you have any current health concerns or conditions?",
        type: "textarea",
        placeholder: "Please describe any current health issues, chronic conditions, or specific areas of concern...",
        key: "healthConcerns"
      },
      {
        id: 5,
        question: "How far are you willing to travel for appointments?",
        type: "slider",
        min: 5,
        max: 50,
        labels: ["5 km", "15 km", "30 km", "50+ km"],
        key: "travelDistance"
      },
      {
        id: 6,
        question: "Do you have a preference for provider gender?",
        type: "radio",
        options: [
          "Female providers preferred",
          "Male providers preferred",
          "No preference"
        ],
        key: "providerGender"
      },
      {
        id: 7,
        question: "Are there any language preferences for your healthcare providers?",
        type: "radio",
        options: [
          "English only",
          "English and French",
          "English and Mandarin",
          "English and Spanish",
          "No preference"
        ],
        key: "languagePreference"
      },
      {
        id: 8,
        question: "Are you interested in alternative or complementary therapies?",
        type: "radio",
        options: [
          "Very interested",
          "Somewhat interested",
          "Not interested",
          "Open to suggestions"
        ],
        key: "alternativeTherapies"
      }
    ];
  }

  /**
   * Get all questions
   * @returns {Array} Array of question objects
   */
  getQuestions() {
    return this.questions;
  }

  /**
   * Get a specific question by ID
   * @param {number} id - Question ID
   * @returns {Object|null} Question object or null
   */
  getQuestionById(id) {
    return this.questions.find(q => q.id === id) || null;
  }

  /**
   * Validate user answers
   * @param {Object} answers - User answers object
   * @returns {Object} Validation result
   */
  validateAnswers(answers) {
    const errors = [];
    const requiredQuestions = this.questions.filter(q => q.required);

    requiredQuestions.forEach(question => {
      if (!answers[question.key]) {
        errors.push(`Question "${question.question}" is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process and normalize answers
   * @param {Object} rawAnswers - Raw user answers
   * @returns {Object} Processed answers
   */
  processAnswers(rawAnswers) {
    const processed = {};

    this.questions.forEach(question => {
      const answer = rawAnswers[question.key];
      
      if (answer !== undefined && answer !== null) {
        processed[question.key] = this.normalizeAnswer(question, answer);
      }
    });

    return processed;
  }

  /**
   * Normalize answer based on question type
   * @param {Object} question - Question object
   * @param {*} answer - Raw answer
   * @returns {*} Normalized answer
   */
  normalizeAnswer(question, answer) {
    switch (question.type) {
      case 'slider':
        return parseInt(answer);
      case 'checkbox':
        return Array.isArray(answer) ? answer : [answer];
      case 'textarea':
        return answer.trim();
      default:
        return answer;
    }
  }
}