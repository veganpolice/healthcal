import { AppointmentService } from './AppointmentService.js';
import { ProviderService } from './ProviderService.js';
import { InsuranceService } from './InsuranceService.js';

/**
 * Handles appointment scheduling logic and optimization
 */
export class SchedulingService {
  constructor() {
    this.appointmentService = new AppointmentService();
    this.providerService = new ProviderService();
    this.insuranceService = new InsuranceService();
    
    // Define category mapping for provider selection
    this.categoryMap = {
      'dental': 'Dentist',
      'vision': 'Optometrist',
      'physio': 'Physiotherapist',
      'massage': 'Massage Therapist',
      'medical': 'Family Physician'
    };
  }

  /**
   * Generate optimized schedule based on user preferences
   * @param {Object} userAnswers - User questionnaire answers
   * @returns {Array} Generated appointments
   */
  generateSchedule(userAnswers) {
    const baseSchedule = this.getBaseScheduleTemplate();
    const optimizedSchedule = this.optimizeSchedule(baseSchedule, userAnswers);
    
    return optimizedSchedule.map((appointment, index) => ({
      ...appointment,
      id: index + 1
    }));
  }

  /**
   * Get base schedule template
   * @returns {Array} Base appointment template
   */
  getBaseScheduleTemplate() {
    return [
      {
        type: "Dental Cleaning",
        category: "dental",
        duration: "60 minutes",
        frequency: "every 6 months",
        priority: "high"
      },
      {
        type: "Eye Exam",
        category: "vision",
        duration: "45 minutes",
        frequency: "every 2 years",
        priority: "medium"
      },
      {
        type: "Annual Physical",
        category: "medical",
        duration: "30 minutes",
        frequency: "yearly",
        priority: "high"
      },
      {
        type: "Physiotherapy Assessment",
        category: "physio",
        duration: "45 minutes",
        frequency: "as needed",
        priority: "medium"
      },
      {
        type: "Massage Therapy",
        category: "massage",
        duration: "60 minutes",
        frequency: "monthly",
        priority: "low"
      }
    ];
  }

  /**
   * Optimize schedule based on user preferences
   * @param {Array} baseSchedule - Base schedule template
   * @param {Object} userAnswers - User preferences
   * @returns {Array} Optimized schedule
   */
  optimizeSchedule(baseSchedule, userAnswers) {
    const optimized = [];
    const currentYear = new Date().getFullYear();
    
    baseSchedule.forEach(template => {
      const appointments = this.generateAppointmentsFromTemplate(template, userAnswers, currentYear);
      optimized.push(...appointments);
    });

    // Sort by date
    return optimized.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Generate specific appointments from template
   * @param {Object} template - Appointment template
   * @param {Object} userAnswers - User preferences
   * @param {number} year - Target year
   * @returns {Array} Generated appointments
   */
  generateAppointmentsFromTemplate(template, userAnswers, year) {
    const appointments = [];
    const importantServices = userAnswers.importantServices || [];
    
    // Skip if user didn't select this service as important
    const serviceMap = {
      'dental': 'Dental care',
      'vision': 'Vision care',
      'physio': 'Physiotherapy',
      'massage': 'Massage therapy',
      'medical': 'Preventive care'
    };

    if (!importantServices.includes(serviceMap[template.category])) {
      return appointments;
    }

    // Generate appointments based on frequency
    const dates = this.generateAppointmentDates(template.frequency, year, userAnswers);
    
    dates.forEach(date => {
      const provider = this.selectOptimalProvider(template.category, userAnswers);
      const cost = this.calculateAppointmentCost(template.type, template.category);
      
      appointments.push({
        date: date.toISOString().split('T')[0],
        type: template.type,
        provider: provider.name,
        duration: template.duration,
        estimatedCost: cost,
        status: "proposed",
        category: template.category
      });
    });

    return appointments;
  }

  /**
   * Generate appointment dates based on frequency
   * @param {string} frequency - Appointment frequency
   * @param {number} year - Target year
   * @param {Object} userAnswers - User preferences
   * @returns {Array} Array of dates
   */
  generateAppointmentDates(frequency, year, userAnswers) {
    const dates = [];
    const timePreference = userAnswers.timePreference || "No preference";
    
    switch (frequency) {
      case 'every 6 months':
        dates.push(
          this.getOptimalDate(new Date(year, 0, 15), timePreference),
          this.getOptimalDate(new Date(year, 5, 15), timePreference)
        );
        break;
      case 'yearly':
        dates.push(this.getOptimalDate(new Date(year, 5, 20), timePreference));
        break;
      case 'every 2 years':
        if (year % 2 === 1) { // Only odd years for biennial appointments
          dates.push(this.getOptimalDate(new Date(year, 0, 28), timePreference));
        }
        break;
      case 'monthly':
        // Generate 4 appointments throughout the year
        for (let i = 0; i < 4; i++) {
          const month = i * 3 + 3; // March, June, September, December
          dates.push(this.getOptimalDate(new Date(year, month, 15), timePreference));
        }
        break;
      case 'as needed':
        // Generate 2 appointments for assessment and follow-up
        dates.push(
          this.getOptimalDate(new Date(year, 2, 10), timePreference),
          this.getOptimalDate(new Date(year, 7, 14), timePreference)
        );
        break;
    }

    return dates;
  }

  /**
   * Get optimal date based on user time preference
   * @param {Date} baseDate - Base date
   * @param {string} timePreference - User's time preference
   * @returns {Date} Optimized date
   */
  getOptimalDate(baseDate, timePreference) {
    // Add some randomization to avoid clustering
    const randomDays = Math.floor(Math.random() * 14) - 7; // +/- 7 days
    const optimizedDate = new Date(baseDate);
    optimizedDate.setDate(optimizedDate.getDate() + randomDays);
    
    // Ensure it's a weekday for most appointments
    while (optimizedDate.getDay() === 0 || optimizedDate.getDay() === 6) {
      optimizedDate.setDate(optimizedDate.getDate() + 1);
    }
    
    return optimizedDate;
  }

  /**
   * Select optimal provider based on user preferences
   * @param {string} category - Service category
   * @param {Object} userAnswers - User preferences
   * @returns {Object} Selected provider
   */
  selectOptimalProvider(category, userAnswers) {
    const providerService = new ProviderService();
    const providers = providerService.sampleProviders;
    
    // Filter by category using the class property
    const categoryProviders = providers.filter(provider => {
      const expectedSpecialty = this.categoryMap[category];
      return provider.specialty.includes(expectedSpecialty);
    });

    if (categoryProviders.length === 0) {
      return providers[0]; // Fallback
    }

    // Apply user preferences
    let filteredProviders = categoryProviders;

    // Language preference
    if (userAnswers.languagePreference && userAnswers.languagePreference !== "No preference") {
      const preferredLang = userAnswers.languagePreference.split(' and ')[1];
      if (preferredLang) {
        const langFiltered = filteredProviders.filter(p => 
          p.languages.includes(preferredLang)
        );
        if (langFiltered.length > 0) {
          filteredProviders = langFiltered;
        }
      }
    }

    // Return highest rated provider from filtered list
    return filteredProviders.sort((a, b) => b.rating - a.rating)[0];
  }

  /**
   * Calculate appointment cost with insurance
   * @param {string} appointmentType - Type of appointment
   * @param {string} category - Service category
   * @returns {string} Formatted cost string
   */
  calculateAppointmentCost(appointmentType, category) {
    const baseCosts = {
      'dental': 150,
      'vision': 120,
      'physio': 85,
      'massage': 120,
      'medical': 200
    };

    const baseCost = baseCosts[category] || 100;
    const costBreakdown = this.insuranceService.calculateCost(category, baseCost);

    if (costBreakdown.userCost === 0) {
      return "$0 (fully covered)";
    } else {
      return `$${Math.round(costBreakdown.userCost)} (after insurance)`;
    }
  }

  /**
   * Regenerate schedule with variations
   * @param {Array} currentAppointments - Current appointments
   * @returns {Array} New schedule
   */
  async regenerateSchedule(currentAppointments) {
    // Create variations of current schedule
    const newSchedule = currentAppointments.map(appointment => {
      const originalDate = new Date(appointment.date);
      const randomDays = Math.floor(Math.random() * 14) - 7; // +/- 7 days
      const newDate = new Date(originalDate);
      newDate.setDate(newDate.getDate() + randomDays);
      
      // Ensure weekday
      while (newDate.getDay() === 0 || newDate.getDay() === 6) {
        newDate.setDate(newDate.getDate() + 1);
      }
      
      return {
        ...appointment,
        date: newDate.toISOString().split('T')[0]
      };
    });

    return newSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}