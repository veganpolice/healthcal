/**
 * Handles file upload validation and processing
 */
export class FileUploadService {
  constructor() {
    this.validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
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
        error: 'Please upload a PDF, JPG, or PNG file.' 
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