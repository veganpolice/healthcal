import { perplexityService } from './PerplexityService.js';

/**
 * Handles insurance document processing and data extraction
 */
export class InsuranceService {
  constructor() {
    this.demoData = {
      planName: "BC Health Plus Premium",
      policyNumber: "HP-2024-789123",
      coverage: {
        dental: { percentage: 80, annualLimit: 1500 },
        physiotherapy: { percentage: 100, annualLimit: 2000 },
        massage: { percentage: 80, annualLimit: 500 },
        vision: { percentage: 100, frequency: "Every 2 years" }
      },
      aiProcessed: false,
      confidence: 'demo',
      aiSummary: "Demo mode - using sample insurance data. To enable AI analysis, please add your Perplexity API key to the environment variables (VITE_PERPLEXITY_API_KEY)."
    };
  }

  /**
   * Process insurance document (main entry point)
   * @param {File} file - The insurance document
   * @returns {Promise<Object>} Extracted insurance data
   */
  async processDocument(file) {
    console.log('🔍 Processing insurance document:', file.name, file.type);
    
    try {
      // Extract text from the document using PerplexityService
      console.log('📄 Extracting text from document...');
      const documentText = await perplexityService.extractTextFromFile(file);
      
      if (!documentText || documentText.trim().length < 50) {
        throw new Error('Unable to extract sufficient text from document. Please ensure the document contains readable text.');
      }
      
      console.log('✅ Text extraction successful, length:', documentText.length, 'characters');
      console.log('📋 First 200 characters:', documentText.substring(0, 200) + '...');
      
      // Analyze the extracted text with Perplexity AI
      console.log('🤖 Analyzing document with Perplexity AI...');
      const analysisResult = await perplexityService.analyzeInsuranceDocument(documentText);
      
      console.log('✅ AI analysis completed:', analysisResult);
      
      // Transform the analysis result to match our expected format
      const processedData = this.transformAnalysisResult(analysisResult, file);
      
      console.log('📊 Final processed data:', processedData);
      return processedData;
      
    } catch (error) {
      console.error('❌ Error processing document:', error);
      
      // Return enhanced error information
      const fallbackData = this.getFallbackAnalysis();
      fallbackData.aiError = error.message;
      fallbackData.aiSummary = `Document processing failed: ${error.message}\n\nPlease try:\n• Uploading a text file (.txt) with your insurance information\n• Ensuring the document contains readable text\n• Using the demo mode to see how the system works`;
      
      throw error; // Re-throw to let the controller handle the error display
    }
  }

  /**
   * Transform Perplexity analysis result to our expected format
   * @param {Object} analysisResult - Result from Perplexity AI
   * @param {File} file - Original file
   * @returns {Object} Transformed data
   */
  transformAnalysisResult(analysisResult, file) {
    // If analysis has healthCategories, use the new format
    if (analysisResult.healthCategories) {
      return {
        planName: analysisResult.planName || 'AI-Analyzed Insurance Plan',
        policyNumber: analysisResult.policyNumber || 'AI-EXTRACTED-' + Date.now(),
        coverage: this.convertHealthCategoriesToCoverage(analysisResult.healthCategories),
        healthCategories: analysisResult.healthCategories,
        aiProcessed: analysisResult.aiProcessed || true,
        confidence: analysisResult.confidence || 'medium',
        aiSummary: analysisResult.aiSummary || 'Document analyzed successfully with AI',
        recommendations: analysisResult.recommendations,
        fileInfo: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      };
    }
    
    // Fallback to old format if needed
    return {
      planName: analysisResult.planName || 'AI-Analyzed Insurance Plan',
      policyNumber: analysisResult.policyNumber || 'AI-EXTRACTED-' + Date.now(),
      coverage: analysisResult.coverage || {},
      aiProcessed: true,
      confidence: 'medium',
      aiSummary: analysisResult.aiSummary || 'Document analyzed with AI',
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    };
  }

  /**
   * Convert health categories array to coverage object
   * @param {Array} healthCategories - Array of health categories
   * @returns {Object} Coverage object
   */
  convertHealthCategoriesToCoverage(healthCategories) {
    const coverage = {};
    
    healthCategories.forEach(category => {
      if (category.covered) {
        coverage[category.category] = {
          percentage: category.coveragePercentage,
          annualLimit: category.annualLimit,
          frequency: category.frequency
        };
      }
    });
    
    return coverage;
  }

  /**
   * Get fallback analysis when AI is not available
   * @returns {Object} Fallback insurance data
   */
  getFallbackAnalysis() {
    return {
      planName: "BC Health Plus Premium",
      policyNumber: "HP-2024-789123",
      coverage: {
        dental: { percentage: 80, annualLimit: 1500 },
        vision: { percentage: 100, frequency: "Every 2 years" },
        physiotherapy: { percentage: 100, annualLimit: 2000 },
        massage: { percentage: 80, annualLimit: 500 }
      },
      aiProcessed: false,
      confidence: 'demo',
      aiSummary: "AI analysis not available. Using demo data. To enable AI analysis, please configure your Perplexity API key.",
      recommendations: {
        priorityCategories: ['dental', 'vision', 'physiotherapy'],
        suggestedFrequencies: {
          dental: 'every 6 months',
          vision: 'every 2 years',
          physiotherapy: 'as needed'
        }
      }
    };
  }

  /**
   * Generate dynamic questionnaire based on extracted data
   * @param {Object} extractedData - Extracted insurance data
   * @returns {Array} Dynamic questionnaire questions
   */
  generateQuestionnaire(extractedData) {
    // Use PerplexityService to generate dynamic questionnaire
    if (extractedData.healthCategories) {
      return perplexityService.generateDynamicQuestionnaire(extractedData.healthCategories);
    }
    
    // Fallback to basic questionnaire
    return this.getBasicQuestionnaire();
  }

  /**
   * Get basic questionnaire when dynamic generation is not available
   * @returns {Array} Basic questionnaire questions
   */
  getBasicQuestionnaire() {
    return [
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
        key: "importantServices",
        aiGenerated: false
      },
      {
        id: 3,
        question: "Do you have any current health concerns or conditions?",
        type: "textarea",
        placeholder: "Please describe any current health issues, chronic conditions, or specific areas of concern...",
        key: "healthConcerns",
        aiGenerated: false
      },
      {
        id: 4,
        question: "How far are you willing to travel for appointments?",
        type: "slider",
        min: 5,
        max: 50,
        labels: ["5 km", "15 km", "30 km", "50+ km"],
        key: "travelDistance",
        aiGenerated: false
      }
    ];
  }

  /**
   * Get demo insurance data
   * @returns {Object} Demo insurance data
   */
  getDemoData() {
    return this.demoData;
  }

  /**
   * Validate insurance coverage for a service
   * @param {string} serviceType - Type of healthcare service
   * @returns {Object} Coverage information
   */
  getCoverage(serviceType) {
    const coverage = this.demoData.coverage[serviceType.toLowerCase()];
    if (!coverage) {
      return { covered: false, percentage: 0, limit: 0 };
    }

    return {
      covered: true,
      percentage: coverage.percentage,
      limit: coverage.annualLimit || null,
      frequency: coverage.frequency || null
    };
  }

  /**
   * Calculate estimated cost after insurance
   * @param {string} serviceType - Type of service
   * @param {number} baseCost - Base cost of service
   * @returns {Object} Cost breakdown
   */
  calculateCost(serviceType, baseCost) {
    const coverage = this.getCoverage(serviceType);
    
    if (!coverage.covered) {
      return {
        baseCost,
        insuranceCoverage: 0,
        userCost: baseCost,
        coveragePercentage: 0
      };
    }

    const insuranceCoverage = (baseCost * coverage.percentage) / 100;
    const userCost = baseCost - insuranceCoverage;

    return {
      baseCost,
      insuranceCoverage,
      userCost,
      coveragePercentage: coverage.percentage
    };
  }
}