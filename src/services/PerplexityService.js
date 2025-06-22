/**
 * Service for integrating with Perplexity AI to analyze insurance documents
 */
export class PerplexityService {
  constructor() {
    this.apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
  }

  /**
   * Analyze insurance policy document text to extract health categories
   * @param {string} documentText - The text content of the insurance document
   * @returns {Promise<Object>} Analysis results with health categories and coverage details
   */
  async analyzeInsuranceDocument(documentText) {
    if (!this.apiKey) {
      console.warn('Perplexity API key not configured. Using fallback analysis.');
      return this.getFallbackAnalysis();
    }

    try {
      const prompt = this.buildAnalysisPrompt(documentText);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert insurance policy analyzer. Analyze insurance documents and extract health coverage categories with precise details.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content;
      
      if (!analysisText) {
        throw new Error('No analysis content received from Perplexity');
      }

      return this.parseAnalysisResponse(analysisText);
    } catch (error) {
      console.error('Perplexity analysis failed:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Build the analysis prompt for Perplexity AI
   * @param {string} documentText - The insurance document text
   * @returns {string} The formatted prompt
   */
  buildAnalysisPrompt(documentText) {
    return `
Analyze this insurance policy document and extract the following information in JSON format:

1. Health coverage categories available (e.g., dental, vision, physiotherapy, massage therapy, mental health, etc.)
2. Coverage percentages for each category
3. Annual limits or maximums for each category
4. Any special conditions or requirements
5. Recommended appointment frequencies based on coverage

Document text:
${documentText}

Please respond with a JSON object in this exact format:
{
  "planName": "extracted plan name",
  "policyNumber": "extracted policy number",
  "healthCategories": [
    {
      "category": "dental",
      "displayName": "Dental Care",
      "covered": true,
      "coveragePercentage": 80,
      "annualLimit": 1500,
      "frequency": "every 6 months",
      "services": ["cleanings", "checkups", "fillings"],
      "priority": "high"
    }
  ],
  "additionalBenefits": [],
  "recommendations": {
    "priorityCategories": ["dental", "vision"],
    "suggestedFrequencies": {
      "dental": "every 6 months",
      "vision": "annually"
    }
  }
}

Focus on identifying all health-related coverage categories, even if they're not explicitly listed as separate benefits. Look for coverage under general medical, paramedical, or wellness benefits.
`;
  }

  /**
   * Parse the analysis response from Perplexity AI
   * @param {string} analysisText - The raw response text
   * @returns {Object} Parsed analysis data
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return this.validateAndEnhanceAnalysis(jsonData);
      }
      
      // If no JSON found, parse manually
      return this.parseTextualResponse(analysisText);
    } catch (error) {
      console.error('Failed to parse Perplexity response:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Validate and enhance the analysis data
   * @param {Object} analysisData - Raw analysis data
   * @returns {Object} Enhanced analysis data
   */
  validateAndEnhanceAnalysis(analysisData) {
    const enhanced = {
      planName: analysisData.planName || 'Health Insurance Plan',
      policyNumber: analysisData.policyNumber || 'POLICY-' + Date.now(),
      healthCategories: [],
      coverage: {},
      recommendations: analysisData.recommendations || {}
    };

    // Process health categories
    if (analysisData.healthCategories && Array.isArray(analysisData.healthCategories)) {
      analysisData.healthCategories.forEach(category => {
        if (category.covered) {
          enhanced.healthCategories.push({
            category: category.category,
            displayName: category.displayName,
            covered: true,
            coveragePercentage: category.coveragePercentage || 80,
            annualLimit: category.annualLimit || null,
            frequency: category.frequency || 'as needed',
            services: category.services || [],
            priority: category.priority || 'medium'
          });

          // Add to coverage object for backward compatibility
          enhanced.coverage[category.category] = {
            percentage: category.coveragePercentage || 80,
            annualLimit: category.annualLimit || null,
            frequency: category.frequency
          };
        }
      });
    }

    return enhanced;
  }

  /**
   * Parse textual response when JSON parsing fails
   * @param {string} text - The response text
   * @returns {Object} Parsed data
   */
  parseTextualResponse(text) {
    const categories = [];
    const coverage = {};

    // Common health categories to look for
    const categoryPatterns = [
      { category: 'dental', keywords: ['dental', 'teeth', 'oral'], displayName: 'Dental Care' },
      { category: 'vision', keywords: ['vision', 'eye', 'optical'], displayName: 'Vision Care' },
      { category: 'physio', keywords: ['physiotherapy', 'physical therapy', 'physio'], displayName: 'Physiotherapy' },
      { category: 'massage', keywords: ['massage', 'therapeutic massage'], displayName: 'Massage Therapy' },
      { category: 'mental', keywords: ['mental health', 'psychology', 'counseling'], displayName: 'Mental Health' },
      { category: 'chiro', keywords: ['chiropractic', 'chiropractor'], displayName: 'Chiropractic Care' },
      { category: 'naturo', keywords: ['naturopathy', 'naturopathic'], displayName: 'Naturopathic Medicine' }
    ];

    categoryPatterns.forEach(pattern => {
      const found = pattern.keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (found) {
        // Try to extract percentage and limits
        const percentageMatch = text.match(new RegExp(`${pattern.keywords[0]}.*?(\\d+)%`, 'i'));
        const limitMatch = text.match(new RegExp(`${pattern.keywords[0]}.*?\\$(\\d+(?:,\\d+)?)`, 'i'));

        const categoryData = {
          category: pattern.category,
          displayName: pattern.displayName,
          covered: true,
          coveragePercentage: percentageMatch ? parseInt(percentageMatch[1]) : 80,
          annualLimit: limitMatch ? parseInt(limitMatch[1].replace(',', '')) : null,
          frequency: 'as needed',
          services: [],
          priority: 'medium'
        };

        categories.push(categoryData);
        coverage[pattern.category] = {
          percentage: categoryData.coveragePercentage,
          annualLimit: categoryData.annualLimit
        };
      }
    });

    return {
      planName: 'Analyzed Health Insurance Plan',
      policyNumber: 'ANALYZED-' + Date.now(),
      healthCategories: categories,
      coverage: coverage,
      recommendations: {
        priorityCategories: categories.slice(0, 3).map(c => c.category),
        suggestedFrequencies: {}
      }
    };
  }

  /**
   * Get fallback analysis when Perplexity is unavailable
   * @returns {Object} Default analysis data
   */
  getFallbackAnalysis() {
    return {
      planName: "BC Health Plus Premium",
      policyNumber: "HP-2024-789123",
      healthCategories: [
        {
          category: 'dental',
          displayName: 'Dental Care',
          covered: true,
          coveragePercentage: 80,
          annualLimit: 1500,
          frequency: 'every 6 months',
          services: ['cleanings', 'checkups', 'fillings'],
          priority: 'high'
        },
        {
          category: 'vision',
          displayName: 'Vision Care',
          covered: true,
          coveragePercentage: 100,
          annualLimit: null,
          frequency: 'every 2 years',
          services: ['eye exams', 'glasses', 'contacts'],
          priority: 'medium'
        },
        {
          category: 'physio',
          displayName: 'Physiotherapy',
          covered: true,
          coveragePercentage: 100,
          annualLimit: 2000,
          frequency: 'as needed',
          services: ['assessments', 'treatments'],
          priority: 'medium'
        },
        {
          category: 'massage',
          displayName: 'Massage Therapy',
          covered: true,
          coveragePercentage: 80,
          annualLimit: 500,
          frequency: 'monthly',
          services: ['therapeutic massage'],
          priority: 'low'
        }
      ],
      coverage: {
        dental: { percentage: 80, annualLimit: 1500 },
        vision: { percentage: 100, frequency: "Every 2 years" },
        physiotherapy: { percentage: 100, annualLimit: 2000 },
        massage: { percentage: 80, annualLimit: 500 }
      },
      recommendations: {
        priorityCategories: ['dental', 'vision', 'physio'],
        suggestedFrequencies: {
          dental: 'every 6 months',
          vision: 'every 2 years',
          physio: 'as needed'
        }
      }
    };
  }

  /**
   * Extract text from file for analysis
   * @param {File} file - The uploaded file
   * @returns {Promise<string>} Extracted text content
   */
  async extractTextFromFile(file) {
    if (file.type === 'application/pdf') {
      // For PDF files, we'd need a PDF parsing library
      // For now, return a placeholder that indicates PDF processing
      return `PDF Document: ${file.name}\n\nThis is a placeholder for PDF text extraction. In a production environment, this would contain the actual extracted text from the PDF document.`;
    } else if (file.type.startsWith('image/')) {
      // For images, we'd need OCR capability
      return `Image Document: ${file.name}\n\nThis is a placeholder for OCR text extraction. In a production environment, this would contain text extracted from the image using OCR technology.`;
    } else {
      // For text files, read directly
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
  }

  /**
   * Generate dynamic questionnaire based on identified health categories
   * @param {Array} healthCategories - The identified health categories
   * @returns {Array} Dynamic questionnaire questions
   */
  generateDynamicQuestionnaire(healthCategories) {
    const baseQuestions = [
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
      }
    ];

    // Add category-specific questions
    if (healthCategories.length > 0) {
      const categoryOptions = healthCategories.map(cat => cat.displayName);
      
      baseQuestions.push({
        id: 2,
        question: "Based on your insurance coverage, which services are most important to you? (Select all that apply)",
        type: "checkbox",
        options: categoryOptions,
        key: "importantServices"
      });

      // Add frequency questions for covered categories
      healthCategories.forEach((category, index) => {
        if (category.frequency !== 'as needed') {
          baseQuestions.push({
            id: baseQuestions.length + 1,
            question: `How often would you like ${category.displayName.toLowerCase()} appointments?`,
            type: "radio",
            options: [
              "As recommended by insurance",
              "More frequently",
              "Less frequently",
              "Only when needed"
            ],
            key: `${category.category}Frequency`
          });
        }
      });
    }

    // Add remaining standard questions
    baseQuestions.push(
      {
        id: baseQuestions.length + 1,
        question: "Do you have any current health concerns or conditions?",
        type: "textarea",
        placeholder: "Please describe any current health issues, chronic conditions, or specific areas of concern...",
        key: "healthConcerns"
      },
      {
        id: baseQuestions.length + 2,
        question: "How far are you willing to travel for appointments?",
        type: "slider",
        min: 5,
        max: 50,
        labels: ["5 km", "15 km", "30 km", "50+ km"],
        key: "travelDistance"
      },
      {
        id: baseQuestions.length + 3,
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
        id: baseQuestions.length + 4,
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
      }
    );

    return baseQuestions;
  }
}

// Create singleton instance
export const perplexityService = new PerplexityService();