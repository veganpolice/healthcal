import { FileUploadService } from '../services/FileUploadService.js';
import { InsuranceService } from '../services/InsuranceService.js';
import { userPreferencesService } from '../services/UserPreferencesService.js';

/**
 * Handles insurance document upload and processing
 */
export class UploadController {
  constructor() {
    this.fileUploadService = new FileUploadService();
    this.insuranceService = new InsuranceService();
    this.eventListeners = new Map();
    this.isDemoMode = false;
    this.extractedData = null;
    this.dynamicQuestionnaire = null;
  }

  async initialize() {
    this.setupUploadHandlers();
    await this.loadPreviousData();
  }

  /**
   * Load previously saved upload data
   */
  async loadPreviousData() {
    try {
      const savedData = await userPreferencesService.getPreferences(
        userPreferencesService.steps.UPLOAD
      );
      
      if (savedData && savedData.preferences) {
        console.log('Loading previous upload data');
        this.extractedData = savedData.preferences.extractedData;
        this.dynamicQuestionnaire = savedData.preferences.dynamicQuestionnaire;
        
        // If we have previous data, show the results
        if (this.extractedData) {
          this.showResults(this.extractedData);
        }
      }
    } catch (error) {
      console.error('Failed to load previous upload data:', error);
    }
  }

  setupUploadHandlers() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const demoButton = document.getElementById('demo-btn');

    if (uploadArea && fileInput) {
      // Remove inline handlers
      uploadArea.removeAttribute('onclick');
      
      // Set up proper event handlers
      uploadArea.addEventListener('click', (e) => {
        // Don't trigger file input if we're in demo mode or if the click came from demo button
        if (!this.isDemoMode && !e.target.closest('#demo-btn')) {
          fileInput.click();
        }
      });
      uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
      uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
      uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
      fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    if (demoButton) {
      demoButton.removeAttribute('onclick');
      demoButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleDemo();
      });
      console.log('Demo button handler attached');
    } else {
      console.error('Demo button not found with ID: demo-btn');
    }

    // Continue button
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.removeAttribute('onclick');
      continueBtn.addEventListener('click', async () => {
        await this.saveUploadData();
        this.emit('uploadComplete', {
          extractedData: this.extractedData,
          dynamicQuestionnaire: this.dynamicQuestionnaire
        });
      });
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  }

  handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  async processFile(file) {
    try {
      console.log('🚀 Starting real file processing with AI analysis');
      console.log('📄 File details:', {
        name: file.name,
        type: file.type,
        size: Math.round(file.size / 1024) + ' KB'
      });
      
      // Validate file
      const validation = this.fileUploadService.validateFile(file);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }

      // Start processing
      this.showProcessing();

      try {
        // Process with insurance service - this will now wait for real text extraction and AI analysis
        console.log('🤖 Calling InsuranceService.processDocument for real AI analysis');
        const extractedData = await this.insuranceService.processDocument(file);
        console.log('✅ AI analysis completed successfully:', extractedData);
        
        this.extractedData = extractedData;

        // Generate dynamic questionnaire based on analysis
        this.dynamicQuestionnaire = this.insuranceService.generateQuestionnaire(extractedData);
        console.log('📋 Generated dynamic questionnaire:', this.dynamicQuestionnaire);

        // Save the upload data
        await this.saveUploadData(file.name, file.type, file.size);
        
        // Show results with AI analysis information
        this.showResults(extractedData);
      } catch (analysisError) {
        console.error('❌ AI analysis failed:', analysisError);
        this.hideProcessing();
        
        // Show user-friendly error message
        alert(`Document analysis failed: ${analysisError.message}\n\nPlease try:\n- Uploading a text file (.txt) with your insurance information\n- Ensuring the document contains readable text\n- Using the demo mode to see how the system works`);
      }
    } catch (error) {
      console.error('❌ File processing failed:', error);
      alert(`Failed to process document: ${error.message}. Please try again.`);
      this.hideProcessing();
    }
  }

  handleDemo() {
    console.log('🎭 Demo button clicked - using demo data');
    
    // Set demo mode flag
    this.isDemoMode = true;
    
    // Skip file upload entirely and go straight to processing
    this.showProcessing();
    
    // Simulate processing delay
    setTimeout(async () => {
      const demoData = this.insuranceService.getDemoData();
      this.extractedData = demoData;
      
      // Generate dynamic questionnaire for demo data
      this.dynamicQuestionnaire = this.insuranceService.generateQuestionnaire(demoData);
      
      // Save the demo data
      await this.saveUploadData('demo-policy.pdf', 'application/pdf', 0, true);
      
      this.showResults(demoData);
      // Reset demo mode after showing results
      this.isDemoMode = false;
    }, 3000);
  }

  /**
   * Save upload data to user preferences
   */
  async saveUploadData(fileName = null, fileType = null, fileSize = null, isDemo = false) {
    try {
      const uploadData = {
        extractedData: this.extractedData,
        dynamicQuestionnaire: this.dynamicQuestionnaire,
        fileInfo: fileName ? {
          name: fileName,
          type: fileType,
          size: fileSize,
          isDemo: isDemo
        } : null,
        completedAt: new Date().toISOString()
      };

      const result = await userPreferencesService.savePreferences(
        userPreferencesService.steps.UPLOAD,
        uploadData
      );

      if (result.success) {
        console.log('Upload data saved successfully');
      } else {
        console.warn('Failed to save upload data:', result.error);
      }
    } catch (error) {
      console.error('Error saving upload data:', error);
    }
  }

  showProcessing() {
    console.log('📊 Showing processing section for real AI analysis');
    
    // Hide the upload area completely
    const uploadArea = document.getElementById('uploadArea');
    const processingSection = document.getElementById('processingSection');
    
    if (uploadArea) {
      uploadArea.classList.add('hidden');
    }
    
    if (processingSection) {
      processingSection.classList.remove('hidden');
      
      // Update processing text to mention real AI analysis
      const processingText = processingSection.querySelector('p');
      if (processingText) {
        processingText.textContent = 'Extracting text and analyzing with Perplexity AI...';
      }
      
      // Update the heading to mention AI
      const processingHeading = processingSection.querySelector('h3');
      if (processingHeading) {
        processingHeading.textContent = 'AI Processing Your Document...';
      }
    }
  }

  hideProcessing() {
    const processingSection = document.getElementById('processingSection');
    const uploadArea = document.getElementById('uploadArea');
    
    if (processingSection) {
      processingSection.classList.add('hidden');
    }
    
    if (uploadArea) {
      uploadArea.classList.remove('hidden');
    }
  }

  showResults(data) {
    console.log('📊 Showing results section with AI analysis data');
    
    // Hide processing section
    const processingSection = document.getElementById('processingSection');
    if (processingSection) {
      processingSection.classList.add('hidden');
    }
    
    // Update results section with AI analysis information
    this.updateResultsDisplay(data);
    
    // Show results section
    const resultsSection = document.getElementById('extractedInfo');
    if (resultsSection) {
      resultsSection.classList.remove('hidden');
      resultsSection.classList.add('fade-in');
    }
  }

  /**
   * Update the results display with AI analysis information
   */
  updateResultsDisplay(data) {
    const resultsSection = document.getElementById('extractedInfo');
    if (!resultsSection) return;

    // Update the title to indicate AI processing
    const title = resultsSection.querySelector('h3');
    if (title) {
      if (data.aiProcessed) {
        title.innerHTML = `
          <span>Perplexity AI Analysis Results</span>
          <span class="confidence-badge confidence-${data.confidence}">${data.confidence} confidence</span>
        `;
      } else {
        title.innerHTML = `
          <span>Demo Insurance Information</span>
          <span class="confidence-badge confidence-demo">demo mode</span>
        `;
      }
    }

    // Update info cards with health categories
    const infoCards = resultsSection.querySelector('.info-cards');
    if (infoCards && data.coverage) {
      let cardsHtml = '';
      
      // Plan details card
      cardsHtml += `
        <div class="card">
          <div class="card__body">
            <h4>Plan Details</h4>
            <p><strong>Plan Name:</strong> ${data.planName}</p>
            <p><strong>Policy Number:</strong> ${data.policyNumber}</p>
            ${data.aiProcessed ? '<p><strong>Analysis:</strong> Perplexity AI</p>' : '<p><strong>Mode:</strong> Demo Data</p>'}
          </div>
        </div>
      `;

      // Coverage cards
      Object.keys(data.coverage).forEach(coverageType => {
        const coverage = data.coverage[coverageType];
        const displayName = this.getDisplayName(coverageType);
        
        cardsHtml += `
          <div class="card">
            <div class="card__body">
              <h4>${displayName}</h4>
              <p><strong>Coverage:</strong> ${coverage.percentage}%</p>
              ${coverage.annualLimit ? `<p><strong>Annual Limit:</strong> $${coverage.annualLimit.toLocaleString()}</p>` : ''}
              ${coverage.frequency ? `<p><strong>Frequency:</strong> ${coverage.frequency}</p>` : ''}
            </div>
          </div>
        `;
      });

      infoCards.innerHTML = cardsHtml;
    }

    // Add AI analysis summary if available
    if (data.aiSummary) {
      const aiSummary = document.createElement('div');
      aiSummary.className = 'ai-summary';
      aiSummary.innerHTML = `
        <div class="card">
          <div class="card__body">
            <h4>🤖 ${data.aiProcessed ? 'Perplexity AI Analysis' : 'Demo Mode Information'}</h4>
            <div style="white-space: pre-line; font-size: var(--font-size-sm); line-height: 1.6;">
              ${data.aiSummary}
            </div>
            <div class="ai-powered-by">
              ${data.aiProcessed ? 'Powered by Perplexity AI' : 'Demo Mode - Upload a real document for AI analysis'}
            </div>
          </div>
        </div>
      `;
      
      if (infoCards) {
        infoCards.appendChild(aiSummary);
      }
    }
  }

  getDisplayName(coverageType) {
    const displayNames = {
      dental: 'Dental Care',
      physiotherapy: 'Physiotherapy',
      massage: 'Massage Therapy',
      vision: 'Vision Care',
      medical: 'Medical Care'
    };
    return displayNames[coverageType] || coverageType;
  }

  // Event system
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`uploadController:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`uploadController:${event}`, callback);
  }
}