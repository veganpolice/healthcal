import { ProviderService } from '../services/ProviderService.js';

/**
 * Handles modal dialogs and interactions
 */
export class ModalController {
  constructor() {
    this.providerService = new ProviderService();
    this.currentAppointment = null;
  }

  async initialize() {
    this.setupModalHandlers();
  }

  setupModalHandlers() {
    // Modal close handlers
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeAllModals();
      }
    });

    // Close buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', this.closeAllModals.bind(this));
    });

    // Action buttons
    this.setupActionButtons();
  }

  setupActionButtons() {
    // Accept appointment
    const acceptBtn = document.querySelector('[onclick="acceptAppointment()"]');
    if (acceptBtn) {
      acceptBtn.removeAttribute('onclick');
      acceptBtn.addEventListener('click', this.acceptAppointment.bind(this));
    }

    // Request changes
    const changesBtn = document.querySelector('[onclick="requestChanges()"]');
    if (changesBtn) {
      changesBtn.removeAttribute('onclick');
      changesBtn.addEventListener('click', this.requestChanges.bind(this));
    }

    // Send to provider
    const sendBtn = document.querySelector('[onclick="sendToProvider()"]');
    if (sendBtn) {
      sendBtn.removeAttribute('onclick');
      sendBtn.addEventListener('click', this.sendToProvider.bind(this));
    }

    // Submit changes
    const submitBtn = document.querySelector('[onclick="submitChanges()"]');
    if (submitBtn) {
      submitBtn.removeAttribute('onclick');
      submitBtn.addEventListener('click', this.submitChanges.bind(this));
    }
  }

  showAppointmentDetails(appointment) {
    this.currentAppointment = appointment;
    const provider = this.providerService.getProviderByName(appointment.provider);
    
    const modal = document.getElementById('appointmentModal');
    const modalBody = document.getElementById('modalBody');
    const modalTitle = document.getElementById('modalTitle');
    
    if (!modal || !modalBody || !modalTitle) return;

    modalTitle.textContent = appointment.type;
    modalBody.innerHTML = this.renderAppointmentDetails(appointment, provider);
    modal.classList.add('active');
  }

  renderAppointmentDetails(appointment, provider) {
    const date = new Date(appointment.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <div class="provider-info">
        <div class="provider-photo">👨‍⚕️</div>
        <div class="provider-details">
          <h4>${provider.name}</h4>
          <p>${provider.specialty}</p>
          <p>${provider.clinic}</p>
          <div class="rating">
            <span>⭐ ${provider.rating}</span>
          </div>
          <p>📍 ${provider.address}</p>
          <p>📞 ${provider.phone}</p>
        </div>
      </div>
      
      <div class="appointment-details">
        <div class="detail-item">
          <div class="detail-label">Date & Time</div>
          <p class="detail-value">${formattedDate}<br>10:00 AM</p>
        </div>
        <div class="detail-item">
          <div class="detail-label">Duration</div>
          <p class="detail-value">${appointment.duration}</p>
        </div>
        <div class="detail-item">
          <div class="detail-label">Estimated Cost</div>
          <p class="detail-value">${appointment.estimatedCost}</p>
        </div>
        <div class="detail-item">
          <div class="detail-label">Status</div>
          <p class="detail-value">${appointment.status}</p>
        </div>
      </div>
    `;
  }

  acceptAppointment() {
    if (this.currentAppointment) {
      this.currentAppointment.status = 'accepted';
      alert('Appointment accepted! You will receive a confirmation email shortly.');
      this.closeAllModals();
    }
  }

  requestChanges() {
    this.closeModal('appointmentModal');
    this.showModal('changeModal');
  }

  sendToProvider() {
    if (this.currentAppointment) {
      this.closeModal('appointmentModal');
      
      // Generate tracking number
      const trackingNumber = 'HS' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const trackingElement = document.getElementById('trackingNumber');
      if (trackingElement) {
        trackingElement.textContent = trackingNumber;
      }
      
      this.showModal('successModal');
      this.simulateStatusUpdates();
    }
  }

  submitChanges() {
    const formData = this.getChangeFormData();
    console.log('Submitting changes:', formData);
    
    this.closeModal('changeModal');
    alert('Change request submitted successfully! The provider will contact you within 24 hours.');
  }

  getChangeFormData() {
    return {
      preferredDate: document.getElementById('preferredDate')?.value,
      preferredTime: document.getElementById('preferredTime')?.value,
      alternativeProvider: document.getElementById('alternativeProvider')?.value,
      notes: document.getElementById('changeNotes')?.value
    };
  }

  simulateStatusUpdates() {
    setTimeout(() => {
      const statusItems = document.querySelectorAll('.status-item');
      if (statusItems[1]) statusItems[1].classList.add('active');
    }, 2000);
    
    setTimeout(() => {
      const statusItems = document.querySelectorAll('.status-item');
      if (statusItems[2]) statusItems[2].classList.add('active');
    }, 4000);
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
  }
}