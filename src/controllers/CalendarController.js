import { AppointmentService } from '../services/AppointmentService.js';
import { SchedulingService } from '../services/SchedulingService.js';
import { userPreferencesService } from '../services/UserPreferencesService.js';

/**
 * Handles calendar display and appointment management
 */
export class CalendarController {
  constructor() {
    this.appointmentService = new AppointmentService();
    this.schedulingService = new SchedulingService();
    this.appointments = [];
    this.generatedSchedule = null;
  }

  async initialize() {
    this.setupCalendarHandlers();
    await this.loadAppointments();
    await this.loadPreviousSchedule();
  }

  /**
   * Load previously generated schedule
   */
  async loadPreviousSchedule() {
    try {
      const savedData = await userPreferencesService.getPreferences(
        userPreferencesService.steps.SCHEDULE
      );
      
      if (savedData && savedData.preferences && savedData.preferences.schedule) {
        console.log('Loading previous schedule');
        this.generatedSchedule = savedData.preferences.schedule;
        this.appointments = this.generatedSchedule;
        this.renderCalendar();
      }
    } catch (error) {
      console.error('Failed to load previous schedule:', error);
    }
  }

  setupCalendarHandlers() {
    // Generate new schedule button
    const generateBtn = document.querySelector('[onclick="generateNewSchedule()"]');
    if (generateBtn) {
      generateBtn.removeAttribute('onclick');
      generateBtn.addEventListener('click', this.generateNewSchedule.bind(this));
    }
  }

  async loadAppointments() {
    try {
      this.appointments = await this.appointmentService.getAppointments();
      this.renderCalendar();
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  }

  async generateSchedule(userAnswers) {
    try {
      this.appointments = this.schedulingService.generateSchedule(userAnswers);
      this.generatedSchedule = this.appointments;
      
      // Save the generated schedule
      await this.saveSchedule(userAnswers);
      
      this.renderCalendar();
    } catch (error) {
      console.error('Failed to generate schedule:', error);
    }
  }

  /**
   * Save generated schedule to user preferences
   */
  async saveSchedule(userAnswers = null) {
    try {
      const scheduleData = {
        schedule: this.generatedSchedule,
        userAnswers: userAnswers,
        generatedAt: new Date().toISOString(),
        appointmentCount: this.generatedSchedule ? this.generatedSchedule.length : 0
      };

      const result = await userPreferencesService.savePreferences(
        userPreferencesService.steps.SCHEDULE,
        scheduleData
      );

      if (result.success) {
        console.log('Schedule saved successfully');
      } else {
        console.warn('Failed to save schedule:', result.error);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  }

  renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let html = '';
    
    months.forEach((month, index) => {
      const monthAppointments = this.appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === index;
      });
      
      html += this.renderMonthCard(month, monthAppointments);
    });
    
    calendarGrid.innerHTML = html;
    this.setupAppointmentHandlers();
  }

  renderMonthCard(month, appointments) {
    let html = `
      <div class="month-card">
        <div class="month-header">
          <h4>${month} 2025</h4>
        </div>
        <div class="month-body">`;
    
    if (appointments.length > 0) {
      appointments.forEach(appointment => {
        const date = new Date(appointment.date);
        html += `
          <div class="appointment-item" data-appointment-id="${appointment.id}">
            <div class="appointment-dot ${appointment.category}"></div>
            <div class="appointment-info">
              <div class="appointment-date">${date.getDate()}</div>
              <p class="appointment-type">${appointment.type}</p>
            </div>
          </div>`;
      });
    } else {
      html += '<p class="text-secondary">No appointments scheduled</p>';
    }
    
    html += '</div></div>';
    return html;
  }

  setupAppointmentHandlers() {
    const appointmentItems = document.querySelectorAll('.appointment-item');
    appointmentItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const appointmentId = parseInt(e.currentTarget.dataset.appointmentId);
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
          this.emit('appointmentSelected', appointment);
        }
      });
    });
  }

  async generateNewSchedule() {
    try {
      // Get the previous user answers to regenerate with same preferences
      const questionnaireData = await userPreferencesService.getPreferences(
        userPreferencesService.steps.QUESTIONNAIRE
      );
      
      let userAnswers = {};
      if (questionnaireData && questionnaireData.preferences && questionnaireData.preferences.answers) {
        userAnswers = questionnaireData.preferences.answers;
      }

      this.appointments = await this.schedulingService.regenerateSchedule(this.appointments);
      this.generatedSchedule = this.appointments;
      
      // Save the new schedule
      await this.saveSchedule(userAnswers);
      
      this.renderCalendar();
      alert('New schedule generated based on your preferences!');
    } catch (error) {
      console.error('Failed to generate new schedule:', error);
      alert('Failed to generate new schedule. Please try again.');
    }
  }

  // Event system
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`calendarController:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`calendarController:${event}`, callback);
  }
}