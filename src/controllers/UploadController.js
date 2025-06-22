import { FileUploadService } from '../services/FileUploadService.js';
import { InsuranceService } from '../services/InsuranceService.js';

/**
 * Handles insurance document upload and processing
 */
export class UploadController {
  constructor() {
    this.fileUploadService = new FileUploadService();
    this.insuranceService = new InsuranceService();
    this.eventListeners = new Map();
    this.isDemoMode = false; // Add flag to track demo mode
  }

  async initialize() {
    this.setupUploadHandlers();
  }

  setupUploadHandlers() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const demoButton = document.getElementById('demo-btn');

    if (uploadArea && fileInput) {
      // Remove inline handlers
      uploadArea.removeAttribute('onclick');
      
      // Set up proper event handlers with demo mode check
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

    // Continue button - use the correct ID from the HTML
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.removeAttribute('onclick');
      continueBtn.addEventListener('click', () => {
        this.emit('uploadComplete');
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
      // Validate file
      const validation = this.fileUploadService.validateFile(file);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }

      // Start processing
      this.showProcessing();

      // Process with insurance service
      const extractedData = await this.insuranceService.processDocument(file);
      
      // Show results
      this.showResults(extractedData);
    } catch (error) {
      console.error('File processing failed:', error);
      alert('Failed to process document. Please try again.');
      this.hideProcessing();
    }
  }

  handleDemo() {
    console.log('Demo button clicked - starting demo flow');
    
    // Set demo mode flag
    this.isDemoMode = true;
    
    // Skip file upload entirely and go straight to processing
    this.showProcessing();
    
    // Simulate processing delay
    setTimeout(() => {
      const demoData = this.insuranceService.getDemoData();
      this.showResults(demoData);
      // Reset demo mode after showing results
      this.isDemoMode = false;
    }, 2000);
  }

  showProcessing() {
    console.log('Showing processing section');
    
    // Hide the upload area completely
    const uploadArea = document.getElementById('uploadArea');
    const processingSection = document.getElementById('processingSection');
    
    if (uploadArea) {
      uploadArea.classList.add('hidden');
    }
    
    if (processingSection) {
      processingSection.classList.remove('hidden');
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
    console.log('Showing results section');
    
    // Hide processing section
    const processingSection = document.getElementById('processingSection');
    if (processingSection) {
      processingSection.classList.add('hidden');
    }
    
    // Show results section
    const resultsSection = document.getElementById('extractedInfo');
    if (resultsSection) {
      resultsSection.classList.remove('hidden');
      resultsSection.classList.add('fade-in');
    }
  }

  // Event system
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`uploadController:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`uploadController:${event}`, callback);
  }
}