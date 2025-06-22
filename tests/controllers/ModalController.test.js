import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModalController } from '../../src/controllers/ModalController.js'

// Mock the service
vi.mock('../../src/services/ProviderService.js', () => ({
  ProviderService: vi.fn(() => ({
    getProviderByName: vi.fn(() => ({
      name: 'Dr. Test',
      specialty: 'Test Specialty',
      clinic: 'Test Clinic',
      rating: 4.5,
      address: 'Test Address',
      phone: '555-0123'
    }))
  }))
}))

describe('ModalController', () => {
  let controller

  beforeEach(() => {
    controller = new ModalController()
    // Reset DOM
    document.body.innerHTML = `
      <div id="appointmentModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modalTitle">Title</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div id="modalBody">Body</div>
        </div>
      </div>
      <div id="changeModal" class="modal"></div>
      <div id="successModal" class="modal">
        <span id="trackingNumber"></span>
        <div class="status-timeline">
          <div class="status-item"></div>
          <div class="status-item"></div>
          <div class="status-item"></div>
        </div>
      </div>
      <input id="preferredDate" />
      <select id="preferredTime"></select>
      <select id="alternativeProvider"></select>
      <textarea id="changeNotes"></textarea>
    `
  })

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(controller.initialize()).resolves.not.toThrow()
    })
  })

  describe('showAppointmentDetails', () => {
    it('should show appointment modal with details', () => {
      const appointment = {
        id: 1,
        type: 'Dental Cleaning',
        provider: 'Dr. Test',
        date: '2025-01-15',
        duration: '60 minutes',
        estimatedCost: '$100',
        status: 'proposed'
      }
      
      controller.showAppointmentDetails(appointment)
      
      const modal = document.getElementById('appointmentModal')
      const modalTitle = document.getElementById('modalTitle')
      const modalBody = document.getElementById('modalBody')
      
      expect(modal.classList.contains('active')).toBe(true)
      expect(modalTitle.textContent).toBe('Dental Cleaning')
      expect(modalBody.innerHTML).toContain('Dr. Test')
      expect(modalBody.innerHTML).toContain('60 minutes')
    })
  })

  describe('renderAppointmentDetails', () => {
    it('should render appointment details HTML', () => {
      const appointment = {
        date: '2025-01-15',
        duration: '60 minutes',
        estimatedCost: '$100',
        status: 'proposed'
      }
      
      const provider = {
        name: 'Dr. Test',
        specialty: 'Dentist',
        clinic: 'Test Clinic',
        rating: 4.5,
        address: 'Test Address',
        phone: '555-0123'
      }
      
      const html = controller.renderAppointmentDetails(appointment, provider)
      
      expect(html).toContain('Dr. Test')
      expect(html).toContain('Dentist')
      expect(html).toContain('Test Clinic')
      expect(html).toContain('4.5')
      expect(html).toContain('60 minutes')
      expect(html).toContain('$100')
    })
  })

  describe('acceptAppointment', () => {
    it('should accept appointment and show alert', () => {
      global.alert = vi.fn()
      
      controller.currentAppointment = {
        id: 1,
        status: 'proposed'
      }
      
      controller.acceptAppointment()
      
      expect(controller.currentAppointment.status).toBe('accepted')
      expect(global.alert).toHaveBeenCalledWith('Appointment accepted! You will receive a confirmation email shortly.')
    })
  })

  describe('requestChanges', () => {
    it('should close appointment modal and show change modal', () => {
      controller.requestChanges()
      
      const appointmentModal = document.getElementById('appointmentModal')
      const changeModal = document.getElementById('changeModal')
      
      expect(appointmentModal.classList.contains('active')).toBe(false)
      expect(changeModal.classList.contains('active')).toBe(true)
    })
  })

  describe('sendToProvider', () => {
    it('should generate tracking number and show success modal', () => {
      controller.currentAppointment = { id: 1 }
      
      controller.sendToProvider()
      
      const successModal = document.getElementById('successModal')
      const trackingNumber = document.getElementById('trackingNumber')
      
      expect(successModal.classList.contains('active')).toBe(true)
      expect(trackingNumber.textContent).toMatch(/^HS[A-Z0-9]{9}$/)
    })
  })

  describe('getChangeFormData', () => {
    it('should collect form data', () => {
      document.getElementById('preferredDate').value = '2025-01-20'
      document.getElementById('preferredTime').value = 'Morning'
      document.getElementById('alternativeProvider').value = 'Any'
      document.getElementById('changeNotes').value = 'Test notes'
      
      const formData = controller.getChangeFormData()
      
      expect(formData.preferredDate).toBe('2025-01-20')
      expect(formData.preferredTime).toBe('Morning')
      expect(formData.alternativeProvider).toBe('Any')
      expect(formData.notes).toBe('Test notes')
    })
  })

  describe('modal management', () => {
    it('should show modal', () => {
      controller.showModal('appointmentModal')
      
      const modal = document.getElementById('appointmentModal')
      expect(modal.classList.contains('active')).toBe(true)
    })

    it('should close modal', () => {
      const modal = document.getElementById('appointmentModal')
      modal.classList.add('active')
      
      controller.closeModal('appointmentModal')
      expect(modal.classList.contains('active')).toBe(false)
    })

    it('should close all modals', () => {
      const appointmentModal = document.getElementById('appointmentModal')
      const changeModal = document.getElementById('changeModal')
      
      appointmentModal.classList.add('active')
      changeModal.classList.add('active')
      
      controller.closeAllModals()
      
      expect(appointmentModal.classList.contains('active')).toBe(false)
      expect(changeModal.classList.contains('active')).toBe(false)
    })
  })
})