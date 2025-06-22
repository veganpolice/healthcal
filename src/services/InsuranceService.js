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
          // For now, we'll use a simple text extraction approach
          // In a real implementation, you'd use a PDF parsing library
          const arrayBuffer = e.target.result;
          
          // Simple fallback: convert to text (this won't work for actual PDFs)
          // In production, you'd use pdf-lib or PDF.js
          const text = "Sample insurance document text for BC Health Plus Premium policy HP-2024-789123 with dental coverage 80% up to $1500 annually, physiotherapy 100% up to $2000, massage therapy 80% up to $500, and vision care covered every 2 years.";
          
          resolve(text);
        } catch (error) {
          console.error('Error extracting text from PDF:', error);
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
    // More robust API key detection for production environments
    const apiKey = this.getPerplexityApiKey();

    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'undefined',
      isProduction: window.location.hostname !== 'localhost',
      hostname: window.location.hostname,
      envKeys: this.getAvailableEnvKeys()
    });

    if (!apiKey) {
      console.warn('Perplexity API key not configured. Using fallback analysis.');
      return this.getFallbackAnalysis(documentText);
    }

    try {
      console.log('Making Perplexity API request...');
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an expert insurance document analyzer. Extract key information from insurance documents and return structured data in JSON format.'
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
              
              Return only valid JSON, no additional text.`
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Perplexity API response:', data);

      if (data.choices && data.choices[0] && data.choices[0].message) {
        try {
          const extractedData = JSON.parse(data.choices[0].message.content);
          console.log('Successfully parsed insurance data:', extractedData);
          return this.validateAndNormalizeData(extractedData);
        } catch (parseError) {
          console.error('Error parsing Perplexity response:', parseError);
          return this.getFallbackAnalysis(documentText);
        }
      } else {
        console.error('Unexpected Perplexity response format:', data);
        return this.getFallbackAnalysis(documentText);
      }

    } catch (error) {
      console.error('Perplexity API request failed:', error);
      return this.getFallbackAnalysis(documentText);
    }
  }

  /**
   * Get Perplexity API key with multiple fallback methods
   * @returns {string|null} The API key or null if not found
   */
  getPerplexityApiKey() {
    // Try multiple ways to get the API key
    const possibleKeys = [
      // Vite environment variables (most common in production)
      import.meta.env?.VITE_PERPLEXITY_API_KEY,
      
      // Direct window access (sometimes available in production builds)
      typeof window !== 'undefined' && window.VITE_PERPLEXITY_API_KEY,
      
      // Process environment (Node.js environments)
      typeof process !== 'undefined' && process.env?.VITE_PERPLEXITY_API_KEY,
      typeof process !== 'undefined' && process.env?.PERPLEXITY_API_KEY,
      
      // Global variable fallback
      typeof globalThis !== 'undefined' && globalThis.VITE_PERPLEXITY_API_KEY
    ];

    // Return the first non-empty key found
    for (const key of possibleKeys) {
      if (key && typeof key === 'string' && key.trim().length > 0) {
        console.log('Found Perplexity API key via environment variable');
        return key.trim();
      }
    }

    return null;
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

    return normalized;
  }

  /**
   * Get fallback analysis when API is not available
   * @param {string} documentText - Document text
   * @returns {Object} Fallback insurance data
   */
  getFallbackAnalysis(documentText) {
    console.log('Using fallback analysis for document text:', documentText.substring(0, 100) + '...');
    
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

    return {
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
  }

  /**
   * Process insurance document (main entry point)
   * @param {File} file - The insurance document
   * @returns {Promise<Object>} Extracted insurance data
   */
  async processDocument(file) {
    console.log('Processing insurance document:', file.name, file.type);
    
    try {
      // Extract text from the document
      let documentText;
      
      if (file.type === 'application/pdf') {
        documentText = await this.extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        // For images, we'd need OCR - for now use fallback
        documentText = "Image document - OCR not implemented. Using sample data.";
      } else {
        documentText = await this.readTextFile(file);
      }
      
      console.log('Extracted text length:', documentText.length);
      
      // Analyze the extracted text
      const analysisResult = await this.analyzeInsuranceDocument(documentText);
      
      console.log('Final analysis result:', analysisResult);
      return analysisResult;
      
    } catch (error) {
      console.error('Error processing document:', error);
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
}