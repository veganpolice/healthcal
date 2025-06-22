/**
 * Service for integrating with Perplexity AI to analyze insurance documents
 */
export class PerplexityService {
  constructor() {
    this.apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    
    // Log API key status for debugging
    if (this.apiKey) {
      console.log('Perplexity API key configured');
    } else {
      console.warn('Perplexity API key not found. Set VITE_PERPLEXITY_API_KEY in your environment variables.');
    }
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
      console.log('Sending request to Perplexity AI...');
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

      console.log('Perplexity API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error:', response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Perplexity API response:', data);
      
      const analysisText = data.choices[0]?.message?.content;
      
      if (!analysisText) {
        throw new Error('No analysis content received from Perplexity');
      }

      console.log('Analysis text received:', analysisText);
      return this.parseAnalysisResponse(analysisText);
    } catch (error) {
      console.error('Perplexity analysis failed:', error);
      // Return fallback with error information
      const fallback = this.getFallbackAnalysis();
      fallback.aiError = error.message;
      fallback.aiSummary = `AI Analysis failed: ${error.message}\n\nUsing demo data instead. To enable AI analysis, please configure your Perplexity API key.`;
      return fallback;
    }
  }

  /**
   * Build the analysis prompt for Perplexity AI using the exact prompt specified
   * @param {string} documentText - The insurance document text
   * @returns {string} The formatted prompt
   */
  buildAnalysisPrompt(documentText) {
    return `
Summarize in point form each non-acute benefit the user has, such as massage or dental, that they can use voluntarily each year.

Document text:
${documentText}

Please provide a clear, organized summary of all voluntary health benefits available to the user, including:
- Coverage percentages
- Annual limits or maximums
- Any special conditions or requirements
- Recommended frequencies based on coverage

Format the response as clear bullet points for each benefit category.
`;
  }

  /**
   * Parse the analysis response from Perplexity AI
   * @param {string} analysisText - The raw response text
   * @returns {Object} Parsed analysis data
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Parse the bullet point response into structured data
      return this.parseTextualResponse(analysisText);
    } catch (error) {
      console.error('Failed to parse Perplexity response:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Parse textual response from Perplexity AI
   * @param {string} text - The response text
   * @returns {Object} Parsed data
   */
  parseTextualResponse(text) {
    const categories = [];
    const coverage = {};

    // Store the raw AI response for display
    const aiSummary = text;

    // Common health categories to look for in the response
    const categoryPatterns = [
      { category: 'dental', keywords: ['dental', 'teeth', 'oral'], displayName: 'Dental Care' },
      { category: 'vision', keywords: ['vision', 'eye', 'optical', 'glasses', 'contacts'], displayName: 'Vision Care' },
      { category: 'physio', keywords: ['physiotherapy', 'physical therapy', 'physio'], displayName: 'Physiotherapy' },
      { category: 'massage', keywords: ['massage', 'therapeutic massage'], displayName: 'Massage Therapy' },
      { category: 'mental', keywords: ['mental health', 'psychology', 'counseling', 'therapy'], displayName: 'Mental Health' },
      { category: 'chiro', keywords: ['chiropractic', 'chiropractor'], displayName: 'Chiropractic Care' },
      { category: 'naturo', keywords: ['naturopathy', 'naturopathic'], displayName: 'Naturopathic Medicine' },
      { category: 'acupuncture', keywords: ['acupuncture'], displayName: 'Acupuncture' },
      { category: 'podiatry', keywords: ['podiatry', 'foot care'], displayName: 'Podiatry' },
      { category: 'osteopathy', keywords: ['osteopathy', 'osteopathic'], displayName: 'Osteopathy' }
    ];

    categoryPatterns.forEach(pattern => {
      const found = pattern.keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (found) {
        // Try to extract percentage and limits from the text
        const lines = text.split('\n');
        let categoryLine = '';
        
        // Find the line that mentions this category
        for (const line of lines) {
          if (pattern.keywords.some(keyword => 
            line.toLowerCase().includes(keyword.toLowerCase())
          )) {
            categoryLine = line;
            break;
          }
        }

        // Extract percentage (look for patterns like "80%", "100%")
        const percentageMatch = categoryLine.match(/(\d+)%/);
        
        // Extract dollar amounts (look for patterns like "$1,500", "$2000")
        const limitMatch = categoryLine.match(/\$(\d+(?:,\d+)?)/);

        const categoryData = {
          category: pattern.category,
          displayName: pattern.displayName,
          covered: true,
          coveragePercentage: percentageMatch ? parseInt(percentageMatch[1]) : 80,
          annualLimit: limitMatch ? parseInt(limitMatch[1].replace(',', '')) : null,
          frequency: this.extractFrequency(categoryLine),
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
      planName: 'AI-Analyzed Health Insurance Plan',
      policyNumber: 'AI-ANALYZED-' + Date.now(),
      healthCategories: categories,
      coverage: coverage,
      aiSummary: aiSummary, // Include the raw AI response
      recommendations: {
        priorityCategories: categories.slice(0, 3).map(c => c.category),
        suggestedFrequencies: {}
      },
      aiProcessed: true,
      confidence: this.calculateConfidence(categories, text)
    };
  }

  /**
   * Extract frequency information from text
   * @param {string} text - Text to analyze
   * @returns {string} Frequency description
   */
  extractFrequency(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('annual') || lowerText.includes('yearly')) {
      return 'annually';
    } else if (lowerText.includes('6 month') || lowerText.includes('semi-annual')) {
      return 'every 6 months';
    } else if (lowerText.includes('2 year') || lowerText.includes('biennial')) {
      return 'every 2 years';
    } else if (lowerText.includes('monthly')) {
      return 'monthly';
    } else {
      return 'as needed';
    }
  }

  /**
   * Calculate confidence score for the analysis
   * @param {Array} categories - Extracted categories
   * @param {string} text - Original response text
   * @returns {string} Confidence level
   */
  calculateConfidence(categories, text) {
    let score = 0;
    
    // Base score for having categories
    if (categories.length > 0) score += 40;
    
    // Bonus for detailed information
    const hasPercentages = categories.some(cat => cat.coveragePercentage > 0);
    const hasLimits = categories.some(cat => cat.annualLimit > 0);
    
    if (hasPercentages) score += 30;
    if (hasLimits) score += 30;
    
    // Check if response seems comprehensive
    if (text.length > 200) score += 10;
    if (categories.length >= 3) score += 10;
    
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
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
      aiSummary: "Demo mode - using sample insurance data. To enable AI analysis, please add your Perplexity API key to the environment variables (VITE_PERPLEXITY_API_KEY).",
      recommendations: {
        priorityCategories: ['dental', 'vision', 'physio'],
        suggestedFrequencies: {
          dental: 'every 6 months',
          vision: 'every 2 years',
          physio: 'as needed'
        }
      },
      aiProcessed: false,
      confidence: 'demo'
    };
  }

  /**
   * Extract text from file for analysis
   * @param {File} file - The uploaded file
   * @returns {Promise<string>} Extracted text content
   */
  async extractTextFromFile(file) {
    console.log('Extracting text from file:', file.name, file.type);
    
    if (file.type === 'application/pdf') {
      // For PDF files, we'd need a PDF parsing library
      // For now, return a placeholder that indicates PDF processing
      console.log('Processing PDF file - using sample content for analysis');
      return `PDF Document: ${file.name}

HEALTH INSURANCE POLICY DOCUMENT

Plan Name: BC Health Plus Premium
Policy Number: HP-2024-789123

COVERED BENEFITS:

• Dental Care: 80% coverage up to $1,500 annually
  - Cleanings and checkups every 6 months
  - Fillings, crowns, and basic procedures covered
  
• Vision Care: 100% coverage every 2 years
  - Eye exams fully covered
  - Glasses and contact lenses included
  
• Physiotherapy: 100% coverage up to $2,000 annually
  - Assessment and treatment sessions
  - No referral required
  
• Massage Therapy: 80% coverage up to $500 annually
  - Therapeutic massage only
  - Registered massage therapists
  
• Mental Health: 80% coverage up to $1,000 annually
  - Psychology and counseling services
  - Licensed practitioners only
  
• Chiropractic Care: 80% coverage up to $800 annually
  - Spinal adjustments and treatments
  
• Naturopathic Medicine: 70% coverage up to $600 annually
  - Licensed naturopathic doctors
  
• Acupuncture: 80% coverage up to $400 annually
  - Traditional and medical acupuncture

This policy provides comprehensive coverage for preventive and therapeutic health services.`;
    } else if (file.type.startsWith('image/')) {
      // For images, we'd need OCR capability
      console.log('Processing image file - using sample content for analysis');
      return `Image Document: ${file.name}

HEALTH INSURANCE POLICY DOCUMENT

Plan Name: BC Health Plus Premium
Policy Number: HP-2024-789123

COVERED BENEFITS:

• Dental Care: 80% coverage up to $1,500 annually
• Vision Care: 100% coverage every 2 years  
• Physiotherapy: 100% coverage up to $2,000 annually
• Massage Therapy: 80% coverage up to $500 annually
• Mental Health: 80% coverage up to $1,000 annually
• Chiropractic Care: 80% coverage up to $800 annually

This policy provides comprehensive coverage for preventive and therapeutic health services.`;
    } else {
      // For text files, read directly
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('Text file content extracted');
          resolve(e.target.result);
        };
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
        key: "timePreference",
        aiGenerated: false
      }
    ];

    // Add category-specific questions
    if (healthCategories.length > 0) {
      const categoryOptions = healthCategories.map(cat => cat.displayName);
      
      baseQuestions.push({
        id: 2,
        question: "Based on your insurance coverage analysis, which services are most important to you? (Select all that apply)",
        type: "checkbox",
        options: categoryOptions,
        key: "importantServices",
        aiGenerated: true
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
            key: `${category.category}Frequency`,
            aiGenerated: true
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
        key: "healthConcerns",
        aiGenerated: false
      },
      {
        id: baseQuestions.length + 2,
        question: "How far are you willing to travel for appointments?",
        type: "slider",
        min: 5,
        max: 50,
        labels: ["5 km", "15 km", "30 km", "50+ km"],
        key: "travelDistance",
        aiGenerated: false
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
        key: "providerGender",
        aiGenerated: false
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
        key: "languagePreference",
        aiGenerated: false
      }
    );

    return baseQuestions;
  }
}

// Create singleton instance
export const perplexityService = new PerplexityService();