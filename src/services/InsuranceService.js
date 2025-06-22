import { perplexityService } from './PerplexityService.js';

/**
 * Handles insurance document processing and data extraction
 */
export class InsuranceService {
  constructor() {
    this.demoData = {
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
   * Process insurance document using Perplexity AI with text extraction
   * @param {File} file - The insurance document
   * @returns {Promise<Object>} Extracted insurance data with AI analysis
   */
  async processDocument(file) {
    console.log('Processing insurance document with PDF text extraction and Perplexity AI analysis:', file.name);
    
    try {
      // Step 1: Extract text from the file (PDF, image, or text)
      console.log('Step 1: Extracting text from document...');
      const documentText = await perplexityService.extractTextFromFile(file);
      console.log('Text extraction completed. Length:', documentText.length);
      console.log('First 500 characters:', documentText.substring(0, 500));
      
      // Step 2: Analyze with Perplexity AI using the extracted text
      console.log('Step 2: Analyzing extracted text with Perplexity AI...');
      const analysisResult = await perplexityService.analyzeInsuranceDocument(documentText);
      console.log('Perplexity AI Analysis completed:', analysisResult);
      
      // Step 3: Enhance the result with additional processing
      return this.enhanceAnalysisResult(analysisResult, file, documentText);
    } catch (error) {
      console.error('Document processing failed:', error);
      // Fallback to demo data with error information
      const fallback = this.getDemoData();
      fallback.aiError = error.message;
      fallback.aiSummary = `Document processing failed: ${error.message}\n\nUsing demo data instead. Please ensure your file is a valid insurance document and try again.`;
      return fallback;
    }
  }

  /**
   * Enhance analysis result with additional processing
   * @param {Object} analysisResult - Result from Perplexity AI
   * @param {File} file - Original file
   * @param {string} extractedText - The extracted text
   * @returns {Object} Enhanced analysis data
   */
  enhanceAnalysisResult(analysisResult, file, extractedText) {
    const enhanced = {
      ...analysisResult,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        processedAt: new Date().toISOString(),
        extractedTextLength: extractedText.length
      },
      extractedText: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : ''), // Store first 1000 chars for reference
      aiProcessed: true,
      confidence: analysisResult.confidence || this.calculateConfidence(analysisResult)
    };

    // Ensure we have at least some basic categories
    if (!enhanced.healthCategories || enhanced.healthCategories.length === 0) {
      console.warn('No health categories found in AI analysis, using demo data categories');
      enhanced.healthCategories = this.demoData.healthCategories;
      enhanced.coverage = this.demoData.coverage;
      enhanced.confidence = 'low';
      enhanced.aiSummary = (enhanced.aiSummary || '') + '\n\nNote: No specific health categories were identified in the document. Using default categories for demonstration.';
    }

    return enhanced;
  }

  /**
   * Calculate confidence score for the analysis
   * @param {Object} analysisResult - Analysis result
   * @returns {string} Confidence level
   */
  calculateConfidence(analysisResult) {
    let score = 0;
    
    // Check if we have plan name and policy number
    if (analysisResult.planName && analysisResult.planName !== 'Health Insurance Plan') score += 20;
    if (analysisResult.policyNumber && !analysisResult.policyNumber.startsWith('POLICY-')) score += 20;
    
    // Check health categories
    if (analysisResult.healthCategories && analysisResult.healthCategories.length > 0) {
      score += 30;
      
      // Bonus for detailed category information
      const detailedCategories = analysisResult.healthCategories.filter(cat => 
        cat.coveragePercentage && cat.annualLimit !== undefined
      );
      score += (detailedCategories.length / analysisResult.healthCategories.length) * 30;
    }
    
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Get demo insurance data
   * @returns {Object} Demo insurance data
   */
  getDemoData() {
    return {
      ...this.demoData,
      aiProcessed: false,
      confidence: 'demo',
      aiSummary: "Demo mode - using sample insurance data. Upload a real policy document to see Perplexity AI analysis with PDF text extraction."
    };
  }

  /**
   * Validate insurance coverage for a service
   * @param {string} serviceType - Type of healthcare service
   * @param {Object} analysisData - Analysis data (optional, uses demo if not provided)
   * @returns {Object} Coverage information
   */
  getCoverage(serviceType, analysisData = null) {
    const data = analysisData || this.demoData;
    
    // First check in healthCategories
    if (data.healthCategories) {
      const category = data.healthCategories.find(cat => 
        cat.category === serviceType.toLowerCase() || 
        cat.displayName.toLowerCase().includes(serviceType.toLowerCase())
      );
      
      if (category && category.covered) {
        return {
          covered: true,
          percentage: category.coveragePercentage,
          limit: category.annualLimit,
          frequency: category.frequency
        };
      }
    }
    
    // Fallback to legacy coverage object
    const coverage = data.coverage && data.coverage[serviceType.toLowerCase()];
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
   * @param {Object} analysisData - Analysis data (optional)
   * @returns {Object} Cost breakdown
   */
  calculateCost(serviceType, baseCost, analysisData = null) {
    const coverage = this.getCoverage(serviceType, analysisData);
    
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

  /**
   * Generate dynamic questionnaire based on analysis
   * @param {Object} analysisData - Insurance analysis data
   * @returns {Array} Dynamic questionnaire questions
   */
  generateQuestionnaire(analysisData) {
    if (!analysisData || !analysisData.healthCategories) {
      return null; // Use default questionnaire
    }

    return perplexityService.generateDynamicQuestionnaire(analysisData.healthCategories);
  }
}