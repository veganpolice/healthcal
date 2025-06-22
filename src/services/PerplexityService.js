import { pdfTextExtractor } from './PDFTextExtractor.js';

/**
 * Service for integrating with Perplexity AI to analyze insurance documents
 */
export class PerplexityService {
  constructor() {
    // Use hardcoded API key as requested
    this.apiKey = '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';
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    
    // Log API key status for debugging
    if (this.apiKey) {
      console.log('✅ Perplexity API key configured (hardcoded)');
    } else {
      console.warn('⚠️ Perplexity API key not found.');
    }
  }

  /**
   * Extract text from file for analysis
   * @param {File} file - The uploaded file
   * @returns {Promise<string>} Extracted text content
   */
  async extractTextFromFile(file) {
    console.log('📄 Extracting text from file:', file.name, file.type);
    
    if (file.type === 'text/plain') {
      console.log('📝 Processing text file directly');
      try {
        const text = await this.readFileAsText(file);
        console.log('✅ Text file read successfully, length:', text.length, 'characters');
        return text;
      } catch (error) {
        console.error('❌ Text file reading failed:', error);
        throw new Error(`Failed to read text file: ${error.message}`);
      }
    } else if (file.type === 'application/pdf') {
      console.log('📄 Processing PDF file with PDF text extractor');
      try {
        const text = await pdfTextExtractor.extractText(file);
        console.log('✅ PDF text extraction successful, length:', text.length, 'characters');
        return text;
      } catch (error) {
        console.error('❌ PDF text extraction failed:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
    } else if (file.type.startsWith('image/')) {
      console.log('🖼️ Processing image file with OCR simulation');
      try {
        const text = await pdfTextExtractor.extractTextFromImage(file);
        console.log('✅ Image OCR simulation completed');
        return text;
      } catch (error) {
        console.error('❌ Image text extraction failed:', error);
        throw new Error(`Failed to extract text from image: ${error.message}`);
      }
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF, TXT, or image file.`);
    }
  }

  /**
   * Read file as text
   * @param {File} file - The file to read
   * @returns {Promise<string>} File content as text
   */
  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Analyze insurance policy document text to extract health categories
   * @param {string} documentText - The text content of the insurance document
   * @returns {Promise<Object>} Analysis results with health categories and coverage details
   */
  async analyzeInsuranceDocument(documentText) {
    if (!this.apiKey) {
      console.warn('⚠️ Perplexity API key not configured. Using fallback analysis.');
      return this.getFallbackAnalysis();
    }

    try {
      console.log('🤖 Sending request to Perplexity AI with hardcoded key...');
      console.log('📊 Document text length:', documentText.length, 'characters');
      console.log('🔑 Using hardcoded API key for analysis');
      
      const prompt = this.buildAnalysisPrompt(documentText);
      
      const requestBody = {
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
      };

      console.log('📡 Making API request to Perplexity with hardcoded key...');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Perplexity API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Perplexity API error:', response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Perplexity API response received successfully');
      
      const analysisText = data.choices[0]?.message?.content;
      
      if (!analysisText) {
        throw new Error('No analysis content received from Perplexity');
      }

      console.log('📋 Analysis text received from Perplexity (first 500 chars):', analysisText.substring(0, 500) + '...');
      return this.parseAnalysisResponse(analysisText);
    } catch (error) {
      console.error('❌ Perplexity analysis failed:', error);
      // Return fallback with error information
      const fallback = this.getFallbackAnalysis();
      fallback.aiError = error.message;
      fallback.aiSummary = `AI Analysis failed: ${error.message}\n\nUsing demo data instead. The hardcoded API key may be invalid or expired.`;
      return fallback;
    }
  }

  /**
   * Build the analysis prompt for Perplexity AI
   * @param {string} documentText - The insurance document text
   * @returns {string} The formatted prompt
   */
  buildAnalysisPrompt(documentText) {
    return `
Analyze this insurance document and extract all voluntary health benefits that the user can use each year. 

Please provide a detailed analysis in the following format:

**PLAN INFORMATION:**
- Plan Name: [extract plan name]
- Policy Number: [extract policy number if available]

**HEALTH BENEFITS SUMMARY:**
For each benefit found, list:
- Benefit name
- Coverage percentage (if mentioned)
- Annual maximum/limit (if mentioned)
- Frequency/restrictions (if mentioned)

**DOCUMENT TEXT:**
${documentText}

Please focus on benefits like:
- Dental care (cleanings, checkups, procedures)
- Vision care (eye exams, glasses, contacts)
- Physiotherapy/Physical therapy
- Massage therapy
- Mental health services
- Chiropractic care
- Naturopathic medicine
- Acupuncture
- Podiatry
- Any other voluntary health services

Provide clear, organized information that a user can easily understand.
`;
  }

  /**
   * Parse the analysis response from Perplexity AI
   * @param {string} analysisText - The raw response text
   * @returns {Object} Parsed analysis data
   */
  parseAnalysisResponse(analysisText) {
    try {
      // Parse the textual response into structured data
      return this.parseTextualResponse(analysisText);
    } catch (error) {
      console.error('❌ Failed to parse Perplexity response:', error);
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

    // Extract plan information
    let planName = 'AI-Analyzed Health Insurance Plan';
    let policyNumber = 'AI-ANALYZED-' + Date.now();

    const planNameMatch = text.match(/Plan Name:\s*([^\n]+)/i);
    if (planNameMatch) {
      planName = planNameMatch[1].trim();
    }

    const policyMatch = text.match(/Policy Number:\s*([^\n]+)/i);
    if (policyMatch) {
      policyNumber = policyMatch[1].trim();
    }

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
      planName: planName,
      policyNumber: policyNumber,
      healthCategories: categories,
      coverage: coverage,
      aiSummary: aiSummary,
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
      aiSummary: "Demo mode - using sample insurance data. The hardcoded API key may not be configured properly.",
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