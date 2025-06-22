import { DatabaseService } from './DatabaseService.js';
import { authService } from './AuthService.js';

/**
 * Handles appointment scheduling logic and optimization
 */
export class SchedulingService {
  constructor() {
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
   * Generate optimized schedule based on user preferences using backend function
   * @param {Object} userAnswers - User questionnaire answers
   * @returns {Promise<Array>} Generated appointments
   */
  async generateSchedule(userAnswers) {
    const client = DatabaseService.getClient();
    if (!client) {
      console.warn('Database not connected. Using local generation.');
      return this.generateLocalSchedule(userAnswers);
    }

    try {
      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-schedule`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAnswers })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      console.log('Schedule generated successfully:', result.message);
      return result.data || [];
    } catch (error) {
      console.error('Failed to generate schedule via backend:', error);
      // Fallback to local generation
      return this.generateLocalSchedule(userAnswers);
    }
  }

  /**
   * Get existing schedule from backend
   * @returns {Promise<Array>} Existing appointments
   */
  async getSchedule() {
    const client = DatabaseService.getClient();
    if (!client) {
      console.warn('Database not connected. Using sample data.');
      return this.getSampleSchedule();
    }

    try {
      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-schedule`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to fetch schedule from backend:', error);
      // Fallback to sample data
      return this.getSampleSchedule();
    }
  }

  /**
   * Local fallback schedule generation
   * @param {Object} userAnswers - User questionnaire answers
   * @returns {Array} Generated appointments
   */
  generateLocalSchedule(userAnswers) {
    const baseSchedule = this.getBaseScheduleTemplate();
    const optimizedSchedule = this.optimizeSchedule(baseSchedule, userAnswers);
    
    return optimizedSchedule.map((appointment, index) => ({
      ...appointment,
      id: index + 1
    }));
  }

  /**
   * Get base schedule template with more comprehensive appointments
   * @returns {Array} Base appointment template
   */
  getBaseScheduleTemplate() {
    return [
      // Dental appointments
      {
        type: "Dental Cleaning",
        category: "dental",
        duration: "60 minutes",
        frequency: "every 6 months",
        priority: "high"
      },
      {
        type: "Dental Checkup",
        category: "dental",
        duration: "45 minutes",
        frequency: "every 6 months",
        priority: "high"
      },
      // Vision care
      {
        type: "Eye Exam",
        category: "vision",
        duration: "45 minutes",
        frequency: "every 2 years",
        priority: "medium"
      },
      {
        type: "Vision Screening",
        category: "vision",
        duration: "30 minutes",
        frequency: "yearly",
        priority: "medium"
      },
      // Medical appointments
      {
        type: "Annual Physical",
        category: "medical",
        duration: "45 minutes",
        frequency: "yearly",
        priority: "high"
      },
      {
        type: "Blood Work",
        category: "medical",
        duration: "20 minutes",
        frequency: "yearly",
        priority: "high"
      },
      {
        type: "Preventive Screening",
        category: "medical",
        duration: "30 minutes",
        frequency: "yearly",
        priority: "medium"
      },
      // Physiotherapy
      {
        type: "Physiotherapy Assessment",
        category: "physio",
        duration: "60 minutes",
        frequency: "as needed",
        priority: "medium"
      },
      {
        type: "Physiotherapy Session",
        category: "physio",
        duration: "45 minutes",
        frequency: "monthly",
        priority: "medium"
      },
      // Massage therapy
      {
        type: "Massage Therapy",
        category: "massage",
        duration: "60 minutes",
        frequency: "monthly",
        priority: "low"
      },
      {
        type: "Therapeutic Massage",
        category: "massage",
        duration: "90 minutes",
        frequency: "quarterly",
        priority: "low"
      },
      // Mental health
      {
        type: "Mental Health Consultation",
        category: "mental",
        duration: "50 minutes",
        frequency: "quarterly",
        priority: "medium"
      },
      // Chiropractic
      {
        type: "Chiropractic Assessment",
        category: "chiro",
        duration: "45 minutes",
        frequency: "as needed",
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
    
    // Map service categories to user selections
    const serviceMap = {
      'dental': 'Dental care',
      'vision': 'Vision care',
      'physio': 'Physiotherapy',
      'massage': 'Massage therapy',
      'medical': 'Preventive care',
      'mental': 'Mental health',
      'chiro': 'Chiropractic care'
    };

    // Always include high priority appointments (medical, dental)
    const shouldInclude = template.priority === 'high' || 
                         importantServices.includes(serviceMap[template.category]) ||
                         importantServices.length === 0; // Include all if no preferences set

    if (!shouldInclude) {
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
        // Generate appointments throughout the year (every 2-3 months)
        for (let i = 0; i < 6; i++) {
          const month = i * 2; // Every 2 months
          dates.push(this.getOptimalDate(new Date(year, month, 15), timePreference));
        }
        break;
      case 'quarterly':
        // Generate 4 appointments throughout the year
        for (let i = 0; i < 4; i++) {
          const month = i * 3; // March, June, September, December
          dates.push(this.getOptimalDate(new Date(year, month, 15), timePreference));
        }
        break;
      case 'as needed':
        // Generate 2-3 appointments for assessment and follow-ups
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
    // Sample providers for fallback
    const providers = [
      { name: 'Dr. Sarah Chen', specialty: 'Physiotherapist', languages: ['English', 'Mandarin'] },
      { name: 'Dr. Michael Rodriguez', specialty: 'Dentist', languages: ['English', 'Spanish'] },
      { name: 'Lisa Thompson', specialty: 'Massage Therapist', languages: ['English', 'French'] },
      { name: 'Dr. Amanda Foster', specialty: 'Optometrist', languages: ['English'] },
      { name: 'Dr. Jennifer Kim', specialty: 'Family Physician', languages: ['English', 'Korean'] }
    ];

    // Filter by category using the class property
    const categoryProviders = providers.filter(provider => {
      const expectedSpecialty = this.categoryMap[category];
      return provider.specialty.includes(expectedSpecialty);
    });

    if (categoryProviders.length === 0) {
      return providers[0]; // Fallback
    }

    return categoryProviders[0];
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
      'medical': 200,
      'mental': 180,
      'chiro': 90
    };

    const baseCost = baseCosts[category] || 100;
    
    // Sample insurance coverage
    const coverage = {
      'dental': { percentage: 80 },
      'vision': { percentage: 100 },
      'physio': { percentage: 100 },
      'massage': { percentage: 80 },
      'medical': { percentage: 100 },
      'mental': { percentage: 80 },
      'chiro': { percentage: 80 }
    };

    const serviceCoverage = coverage[category];
    if (!serviceCoverage) {
      return `$${baseCost} (no coverage)`;
    }

    const insurancePays = (baseCost * serviceCoverage.percentage) / 100;
    const userPays = baseCost - insurancePays;

    if (userPays === 0) {
      return "$0 (fully covered)";
    } else {
      return `$${Math.round(userPays)} (after insurance)`;
    }
  }

  /**
   * Get sample schedule for fallback
   * @returns {Array} Sample appointments
   */
  getSampleSchedule() {
    return [
      {
        id: 1,
        date: "2025-01-15",
        type: "Dental Cleaning",
        provider: "Dr. Michael Rodriguez",
        duration: "60 minutes",
        estimated_cost: "$30 (after insurance)",
        status: "proposed",
        category: "dental"
      },
      {
        id: 2,
        date: "2025-01-28",
        type: "Eye Exam",
        provider: "Dr. Amanda Foster",
        duration: "45 minutes",
        estimated_cost: "$0 (fully covered)",
        status: "proposed",
        category: "vision"
      },
      {
        id: 3,
        date: "2025-03-10",
        type: "Annual Physical",
        provider: "Dr. Jennifer Kim",
        duration: "45 minutes",
        estimated_cost: "$0 (fully covered)",
        status: "proposed",
        category: "medical"
      }
    ];
  }

  /**
   * Regenerate schedule with variations
   * @param {Array} currentAppointments - Current appointments
   * @returns {Promise<Array>} New schedule
   */
  async regenerateSchedule(currentAppointments) {
    // Use the backend function to regenerate
    return await this.generateSchedule({});
  }
}