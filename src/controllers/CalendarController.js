import { AppointmentService } from '../services/AppointmentService.js';
import { SchedulingService } from '../services/SchedulingService.js';

/**
 * Handles calendar display and appointment management
 */
export class CalendarController {
  constructor() {
    this.appointmentService = new AppointmentService();
    this.schedulingService = new SchedulingService();
    this.appointments = [];
  }

  async initialize() {
    this.setupCalendarHandlers();
    await this.loadAppointments();
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

  generateSchedule(userAnswers) {
    try {
      this.appointments = this.schedulingService.generateSchedule(userAnswers);
      this.renderCalendar();
    } catch (error) {
      console.error('Failed to generate schedule:', error);
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
      this.appointments = await this.schedulingService.regenerateSchedule(this.appointments);
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