/**
 * Handles file upload validation and processing
 */
export class FileUploadService {
  constructor() {
    this.validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'text/plain'];
    this.maxSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Validate uploaded file
   * @param {File} file - The file to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (!this.validTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Please upload a PDF, JPG, PNG, or TXT file.' 
      };
    }

    if (file.size > this.maxSize) {
      return { 
        isValid: false, 
        error: 'File size must be less than 10MB.' 
      };
    }

    return { isValid: true };
  }

  /**
   * Convert file to base64 for processing
   * @param {File} file - The file to convert
   * @returns {Promise<string>} Base64 string
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Read file as text
   * @param {File} file - The file to read
   * @returns {Promise<string>} File content as text
   */
  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Get file information
   * @param {File} file - The file to analyze
   * @returns {Object} File information
   */
  getFileInfo(file) {
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeKB: Math.round(file.size / 1024),
      sizeMB: Math.round(file.size / (1024 * 1024) * 100) / 100,
      lastModified: new Date(file.lastModified)
    };
  }

  /**
   * Check if file is a text file
   * @param {File} file - The file to check
   * @returns {boolean} Whether file is text
   */
  isTextFile(file) {
    return file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
  }

  /**
   * Check if file is a PDF
   * @param {File} file - The file to check
   * @returns {boolean} Whether file is PDF
   */
  isPDFFile(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Check if file is an image
   * @param {File} file - The file to check
   * @returns {boolean} Whether file is image
   */
  isImageFile(file) {
    return file.type.startsWith('image/');
  }

  /**
   * Upload file to storage (placeholder for future implementation)
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file) {
    // TODO: Implement actual file upload to Supabase storage
    console.log('File upload not yet implemented:', file.name);
    return { success: true, url: null };
  }
}