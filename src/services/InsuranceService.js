/**
 * Handles insurance-related calculations and processing
 */
export class InsuranceService {
  constructor() {
    // Define coverage rates for different service categories
    this.coverageRates = {
      'dental': 0.8,      // 80% coverage
      'vision': 0.7,      // 70% coverage
      'physio': 0.85,     // 85% coverage
      'massage': 0.0,     // 0% coverage (typically not covered)
      'medical': 0.9      // 90% coverage
    };

    // Define annual maximums for different categories
    this.annualMaximums = {
      'dental': 1500,
      'vision': 500,
      'physio': 2000,
      'massage': 0,
      'medical': 10000
    };
  }

  /**
   * Calculate cost breakdown for an appointment
   * @param {string} category - Service category
   * @param {number} baseCost - Base cost of the service
   * @returns {Object} Cost breakdown
   */
  calculateCost(category, baseCost) {
    const coverageRate = this.coverageRates[category] || 0;
    const insuranceCoverage = baseCost * coverageRate;
    const userCost = baseCost - insuranceCoverage;

    return {
      baseCost,
      insuranceCoverage,
      userCost,
      coverageRate
    };
  }

  /**
   * Process insurance document (placeholder for future implementation)
   * @param {File} document - Insurance document file
   * @returns {Object} Processed insurance information
   */
  async processDocument(document) {
    // Placeholder implementation
    return {
      success: true,
      message: "Document processed successfully",
      coverage: this.getDemoData()
    };
  }

  /**
   * Generate questionnaire based on insurance information
   * @param {Object} insuranceData - Insurance information
   * @returns {Array} Questionnaire items
   */
  generateQuestionnaire(insuranceData) {
    return [
      {
        id: 'coverage_verification',
        question: 'Would you like us to verify your insurance coverage?',
        type: 'boolean',
        required: false
      },
      {
        id: 'preferred_providers',
        question: 'Do you have preferred healthcare providers?',
        type: 'text',
        required: false
      }
    ];
  }

  /**
   * Get demo insurance data
   * @returns {Object} Demo insurance information
   */
  getDemoData() {
    return {
      provider: "Demo Health Insurance",
      planType: "Premium Plan",
      coverage: this.coverageRates,
      maximums: this.annualMaximums,
      deductible: 500,
      deductibleMet: 200
    };
  }

  /**
   * Check if service is covered by insurance
   * @param {string} category - Service category
   * @returns {boolean} Whether service is covered
   */
  isCovered(category) {
    return (this.coverageRates[category] || 0) > 0;
  }

  /**
   * Get coverage percentage for a service category
   * @param {string} category - Service category
   * @returns {number} Coverage percentage (0-100)
   */
  getCoveragePercentage(category) {
    return (this.coverageRates[category] || 0) * 100;
  }

  /**
   * Calculate annual cost projection
   * @param {Array} appointments - List of appointments
   * @returns {Object} Annual cost breakdown
   */
  calculateAnnualCosts(appointments) {
    let totalBaseCost = 0;
    let totalInsuranceCoverage = 0;
    let totalUserCost = 0;

    const costsByCategory = {};

    appointments.forEach(appointment => {
      const baseCost = this.parseEstimatedCost(appointment.estimatedCost);
      const costBreakdown = this.calculateCost(appointment.category, baseCost);

      totalBaseCost += costBreakdown.baseCost;
      totalInsuranceCoverage += costBreakdown.insuranceCoverage;
      totalUserCost += costBreakdown.userCost;

      if (!costsByCategory[appointment.category]) {
        costsByCategory[appointment.category] = {
          baseCost: 0,
          insuranceCoverage: 0,
          userCost: 0,
          count: 0
        };
      }

      costsByCategory[appointment.category].baseCost += costBreakdown.baseCost;
      costsByCategory[appointment.category].insuranceCoverage += costBreakdown.insuranceCoverage;
      costsByCategory[appointment.category].userCost += costBreakdown.userCost;
      costsByCategory[appointment.category].count += 1;
    });

    return {
      total: {
        baseCost: totalBaseCost,
        insuranceCoverage: totalInsuranceCoverage,
        userCost: totalUserCost
      },
      byCategory: costsByCategory
    };
  }

  /**
   * Parse estimated cost string to number
   * @param {string} estimatedCost - Estimated cost string
   * @returns {number} Parsed cost
   */
  parseEstimatedCost(estimatedCost) {
    if (typeof estimatedCost === 'number') return estimatedCost;
    
    // Extract number from strings like "$150 (after insurance)" or "$0 (fully covered)"
    const match = estimatedCost.match(/\$(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}