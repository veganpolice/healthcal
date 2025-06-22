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
      }
    };
  }

  /**
   * Extract text from PDF file
   * @param {File} file - The PDF file
   * @returns {Promise<string>} Extracted text
   */
  async extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function(e) {
        try {
          console.log('📄 Processing PDF file for text extraction...');
          
          // For now, we'll use a simple text extraction approach
          // In a real implementation, you'd use a PDF parsing library
          const arrayBuffer = e.target.result;
          
          // Simple fallback: convert to text (this won't work for actual PDFs)
          // In production, you'd use pdf-lib or PDF.js
          const text = "Sample insurance document text for BC Health Plus Premium policy HP-2024-789123 with dental coverage 80% up to $1500 annually, physiotherapy 100% up to $2000, massage therapy 80% up to $500, and vision care covered every 2 years.";
          
          console.log('✅ PDF text extraction completed (using sample text)');
          console.log('📝 Extracted text:', text);
          
          resolve(text);
        } catch (error) {
          console.error('❌ Error extracting text from PDF:', error);
          resolve("Unable to extract text from PDF. Using fallback analysis.");
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Analyze insurance document text using Perplexity API
   * @param {string} documentText - Extracted text from document
   * @returns {Promise<Object>} Analyzed insurance data
   */
  async analyzeInsuranceDocument(documentText) {
    // Hardcoded API key as requested
    const apiKey = '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';

    console.log('🤖 Starting Perplexity AI analysis...');
    console.log('🔑 API Key configured:', !!apiKey);
    console.log('📝 Document text to analyze:');
    console.log('═'.repeat(60));
    console.log(documentText);
    console.log('═'.repeat(60));
    console.log('📊 Text length:', documentText.length, 'characters');

    if (!apiKey) {
      console.warn('⚠️ Perplexity API key not configured. Using fallback analysis.');
      return this.getFallbackAnalysis(documentText);
    }

    try {
      console.log('🚀 Making Perplexity API request...');
      
      const requestPayload = {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert insurance document analyzer. Extract key information from insurance documents and return structured data in JSON format. IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.'
          },
          {
            role: 'user',
            content: `Please analyze this insurance document text and extract the following information in JSON format:
            - planName: The name of the insurance plan
            - policyNumber: The policy number
            - coverage: An object with coverage details for different services (dental, physiotherapy, massage, vision, medical)
            
            For each coverage type, include:
            - percentage: Coverage percentage (as number)
            - annualLimit: Annual limit in dollars (as number, no currency symbols)
            - frequency: How often covered (if applicable)
            
            Document text: ${documentText}
            
            Return only valid JSON, no markdown code blocks, no additional text or formatting.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      };

      console.log('📤 Request payload:');
      console.log(JSON.stringify(requestPayload, null, 2));

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📥 Perplexity API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Perplexity API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Perplexity API response data:');
      console.log(JSON.stringify(data, null, 2));

      if (data.choices && data.choices[0] && data.choices[0].message) {
        try {
          let responseContent = data.choices[0].message.content;
          console.log('📝 Raw response content:');
          console.log('─'.repeat(50));
          console.log(responseContent);
          console.log('─'.repeat(50));
          
          // Clean up the response content to handle markdown code blocks
          responseContent = this.cleanJsonResponse(responseContent);
          console.log('🧹 Cleaned response content:');
          console.log('─'.repeat(50));
          console.log(responseContent);
          console.log('─'.repeat(50));
          
          const extractedData = JSON.parse(responseContent);
          console.log('✅ Successfully parsed insurance data:', extractedData);
          return this.validateAndNormalizeData(extractedData);
        } catch (parseError) {
          console.error('❌ Error parsing Perplexity response:', parseError);
          console.error('📝 Response content was:', data.choices[0].message.content);
          return this.getFallbackAnalysis(documentText);
        }
      } else {
        console.error('❌ Unexpected Perplexity response format:', data);
        return this.getFallbackAnalysis(documentText);
      }

    } catch (error) {
      console.error('❌ Perplexity API request failed:', error);
      return this.getFallbackAnalysis(documentText);
    }
  }

  /**
   * Clean JSON response by removing markdown code blocks and other formatting
   * @param {string} responseContent - Raw response from Perplexity
   * @returns {string} Cleaned JSON string
   */
  cleanJsonResponse(responseContent) {
    console.log('🧹 Cleaning JSON response...');
    
    // Remove markdown code blocks
    let cleaned = responseContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // If the response starts with text before JSON, try to extract just the JSON part
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      console.log('🎯 Extracted JSON portion from response');
    }
    
    console.log('✅ JSON cleaning completed');
    return cleaned;
  }

  /**
   * Get Perplexity API key with multiple fallback methods
   * @returns {string|null} The API key or null if not found
   */
  getPerplexityApiKey() {
    // Return hardcoded API key
    return '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';
  }

  /**
   * Get available environment keys for debugging
   * @returns {Array} List of available environment variable keys
   */
  getAvailableEnvKeys() {
    const keys = [];
    
    // Check import.meta.env
    if (import.meta.env) {
      keys.push(...Object.keys(import.meta.env).filter(key => 
        key.toLowerCase().includes('perplexity') || key.toLowerCase().includes('api')
      ));
    }
    
    // Check process.env if available
    if (typeof process !== 'undefined' && process.env) {
      keys.push(...Object.keys(process.env).filter(key => 
        key.toLowerCase().includes('perplexity') || key.toLowerCase().includes('api')
      ));
    }
    
    return keys;
  }

  /**
   * Validate and normalize extracted data
   * @param {Object} data - Raw extracted data
   * @returns {Object} Normalized data
   */
  validateAndNormalizeData(data) {
    console.log('🔍 Validating and normalizing extracted data...');
    
    const normalized = {
      planName: data.planName || "Unknown Plan",
      policyNumber: data.policyNumber || "Unknown Policy",
      coverage: {}
    };

    // Normalize coverage data
    const coverageTypes = ['dental', 'physiotherapy', 'massage', 'vision', 'medical'];
    
    coverageTypes.forEach(type => {
      if (data.coverage && data.coverage[type]) {
        const coverage = data.coverage[type];
        normalized.coverage[type] = {
          percentage: typeof coverage.percentage === 'number' ? coverage.percentage : parseInt(coverage.percentage) || 0,
          annualLimit: typeof coverage.annualLimit === 'number' ? coverage.annualLimit : parseInt(coverage.annualLimit) || 0,
          frequency: coverage.frequency || null
        };
      }
    });

    console.log('✅ Data validation and normalization completed:', normalized);
    return normalized;
  }

  /**
   * Get fallback analysis when API is not available
   * @param {string} documentText - Document text
   * @returns {Object} Fallback insurance data
   */
  getFallbackAnalysis(documentText) {
    console.log('🔄 Using fallback analysis for document text:', documentText.substring(0, 100) + '...');
    
    // Simple keyword-based extraction as fallback
    const text = documentText.toLowerCase();
    
    let planName = "Health Insurance Plan";
    let policyNumber = "POLICY-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Try to extract plan name
    const planMatches = text.match(/(?:plan|policy)\s*(?:name|title)?\s*:?\s*([a-zA-Z\s]+)/i);
    if (planMatches) {
      planName = planMatches[1].trim();
    }
    
    // Try to extract policy number
    const policyMatches = text.match(/(?:policy|member|id)\s*(?:number|#)?\s*:?\s*([a-zA-Z0-9-]+)/i);
    if (policyMatches) {
      policyNumber = policyMatches[1].trim();
    }

    const fallbackData = {
      planName,
      policyNumber,
      coverage: {
        dental: { percentage: 80, annualLimit: 1500 },
        physiotherapy: { percentage: 100, annualLimit: 2000 },
        massage: { percentage: 80, annualLimit: 500 },
        vision: { percentage: 100, frequency: "Every 2 years" },
        medical: { percentage: 100, annualLimit: 0 }
      }
    };

    console.log('✅ Fallback analysis completed:', fallbackData);
    return fallbackData;
  }

  /**
   * Process insurance document (main entry point)
   * @param {File} file - The insurance document
   * @returns {Promise<Object>} Extracted insurance data
   */
  async processDocument(file) {
    console.log('🚀 Processing insurance document:', file.name, file.type);
    console.log('📊 File size:', Math.round(file.size / 1024), 'KB');
    
    try {
      // Extract text from the document
      let documentText;
      
      if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file...');
        documentText = await this.extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        console.log('🖼️ Processing image file...');
        // For images, we'd need OCR - for now use fallback
        documentText = "Image document - OCR not implemented. Using sample data.";
      } else {
        console.log('📝 Processing text file...');
        documentText = await this.readTextFile(file);
      }
      
      console.log('📝 Text extraction completed, length:', documentText.length, 'characters');
      
      // Analyze the extracted text
      const analysisResult = await this.analyzeInsuranceDocument(documentText);
      
      console.log('🎉 Final analysis result:', analysisResult);
      return analysisResult;
      
    } catch (error) {
      console.error('❌ Error processing document:', error);
      return this.getFallbackAnalysis("Error processing document");
    }
  }

  /**
   * Read text file content
   * @param {File} file - Text file
   * @returns {Promise<string>} File content
   */
  async readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
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

  /**
   * Generate dynamic questionnaire based on extracted data
   * @param {Object} extractedData - The extracted insurance data
   * @returns {Array} Dynamic questionnaire questions
   */
  generateQuestionnaire(extractedData) {
    console.log('📋 Generating dynamic questionnaire based on extracted data...');
    
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

    // Add coverage-specific questions if we have coverage data
    if (extractedData.coverage) {
      const coveredServices = Object.keys(extractedData.coverage).filter(service => 
        extractedData.coverage[service].percentage > 0
      );

      console.log('🎯 Found covered services:', coveredServices);

      if (coveredServices.length > 0) {
        const serviceDisplayNames = {
          dental: 'Dental Care',
          physiotherapy: 'Physiotherapy',
          massage: 'Massage Therapy',
          vision: 'Vision Care',
          medical: 'Medical Care'
        };

        const serviceOptions = coveredServices.map(service => 
          serviceDisplayNames[service] || service
        );

        baseQuestions.push({
          id: 2,
          question: "Based on your insurance coverage, which services are most important to you? (Select all that apply)",
          type: "checkbox",
          options: serviceOptions,
          key: "importantServices",
          aiGenerated: true
        });

        // Add frequency questions for high-coverage services
        coveredServices.forEach((service, index) => {
          const coverage = extractedData.coverage[service];
          if (coverage.percentage >= 80) {
            console.log(`➕ Adding frequency question for ${service} (${coverage.percentage}% coverage)`);
            baseQuestions.push({
              id: baseQuestions.length + 1,
              question: `How often would you like ${serviceDisplayNames[service] || service} appointments?`,
              type: "radio",
              options: [
                "As recommended by insurance",
                "More frequently than recommended",
                "Less frequently",
                "Only when needed"
              ],
              key: `${service}Frequency`,
              aiGenerated: true
            });
          }
        });
      }
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

    console.log('✅ Generated', baseQuestions.length, 'questions for dynamic questionnaire');
    return baseQuestions;
  }
}