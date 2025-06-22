import { DatabaseService } from './DatabaseService.js';

/**
 * Manages appointment data and operations
 */
export class AppointmentService {
  constructor() {
    this.sampleAppointments = [
      {
        id: 1,
        date: "2025-01-15",
        type: "Dental Cleaning",
        provider: "Dr. Michael Rodriguez",
        duration: "60 minutes",
        estimatedCost: "$120 (after insurance)",
        status: "proposed",
        category: "dental"
      },
      {
        id: 2,
        date: "2025-01-28",
        type: "Eye Exam",
        provider: "Dr. Amanda Foster",
        duration: "45 minutes",
        estimatedCost: "$0 (fully covered)",
        status: "proposed",
        category: "vision"
      },
      {
        id: 3,
        date: "2025-03-10",
        type: "Physiotherapy Assessment",
        provider: "Dr. Sarah Chen",
        duration: "45 minutes",
        estimatedCost: "$0 (fully covered)",
        status: "proposed",
        category: "physio"
      },
      {
        id: 4,
        date: "2025-04-22",
        type: "Massage Therapy",
        provider: "Lisa Thompson",
        duration: "60 minutes",
        estimatedCost: "$25 (after insurance)",
        status: "proposed",
        category: "massage"
      },
      {
        id: 5,
        date: "2025-06-18",
        type: "Dental Cleaning",
        provider: "Dr. Michael Rodriguez",
        duration: "60 minutes",
        estimatedCost: "$120 (after insurance)",
        status: "proposed",
        category: "dental"
      },
      {
        id: 6,
        date: "2025-06-25",
        type: "Annual Physical",
        provider: "Dr. Jennifer Kim",
        duration: "30 minutes",
        estimatedCost: "$0 (fully covered)",
        status: "proposed",
        category: "medical"
      },
      {
        id: 7,
        date: "2025-08-14",
        type: "Physiotherapy Follow-up",
        provider: "Dr. Sarah Chen",
        duration: "30 minutes",
        estimatedCost: "$0 (fully covered)",
        status: "proposed",
        category: "physio"
      },
      {
        id: 8,
        date: "2025-09-20",
        type: "Massage Therapy",
        provider: "Lisa Thompson",
        duration: "60 minutes",
        estimatedCost: "$25 (after insurance)",
        status: "proposed",
        category: "massage"
      },
      {
        id: 9,
        date: "2025-11-12",
        type: "Eye Exam",
        provider: "Dr. Amanda Foster",
        duration: "45 minutes",
        estimatedCost: "$0 (fully covered)",
        status: "proposed",
        category: "vision"
      },
      {
        id: 10,
        date: "2025-11-26",
        type: "Dental Cleaning",
        provider: "Dr. Michael Rodriguez",
        duration: "60 minutes",
        estimatedCost: "$120 (after insurance)",
        status: "proposed",
        category: "dental"
      },
      {
        id: 11,
        date: "2025-12-15",
        type: "Annual Physical Follow-up",
        provider: "Dr. Jennifer Kim",
        duration: "20 minutes",
        estimatedCost: "$0 (fully covered)",
        status: "proposed",
        category: "medical"
      }
    ];
  }

  /**
   * Get all appointments
   * @returns {Promise<Array>} Array of appointments
   */
  async getAppointments() {
    if (DatabaseService.isConnected()) {
      const { data, error } = await DatabaseService.query('appointments', {
        select: '*',
        order: { column: 'date', ascending: true }
      });

      if (error) {
        console.error('Failed to fetch appointments from database:', error);
        return this.sampleAppointments;
      }

      return data || this.sampleAppointments;
    }

    return this.sampleAppointments;
  }

  /**
   * Get appointment by ID
   * @param {number} id - Appointment ID
   * @returns {Promise<Object|null>} Appointment object or null
   */
  async getAppointmentById(id) {
    const appointments = await this.getAppointments();
    return appointments.find(apt => apt.id === id) || null;
  }

  /**
   * Create new appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointment(appointmentData) {
    if (DatabaseService.isConnected()) {
      const { data, error } = await DatabaseService.insert('appointments', appointmentData);
      
      if (error) {
        console.error('Failed to create appointment:', error);
        throw error;
      }

      return data[0];
    }

    // Mock creation for demo mode
    const newAppointment = {
      id: Date.now(),
      ...appointmentData,
      status: 'proposed'
    };

    this.sampleAppointments.push(newAppointment);
    return newAppointment;
  }

  /**
   * Update appointment
   * @param {number} id - Appointment ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointment(id, updates) {
    if (DatabaseService.isConnected()) {
      const { data, error } = await DatabaseService.update('appointments', id, updates);
      
      if (error) {
        console.error('Failed to update appointment:', error);
        throw error;
      }

      return data[0];
    }

    // Mock update for demo mode
    const appointmentIndex = this.sampleAppointments.findIndex(apt => apt.id === id);
    if (appointmentIndex !== -1) {
      this.sampleAppointments[appointmentIndex] = {
        ...this.sampleAppointments[appointmentIndex],
        ...updates
      };
      return this.sampleAppointments[appointmentIndex];
    }

    throw new Error('Appointment not found');
  }

  /**
   * Get appointments by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Filtered appointments
   */
  async getAppointmentsByDateRange(startDate, endDate) {
    const appointments = await this.getAppointments();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= startDate && aptDate <= endDate;
    });
  }

  /**
   * Get appointments by category
   * @param {string} category - Appointment category
   * @returns {Promise<Array>} Filtered appointments
   */
  async getAppointmentsByCategory(category) {
    const appointments = await this.getAppointments();
    return appointments.filter(apt => apt.category === category);
  }
}