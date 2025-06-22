// Application State
let currentPage = 'welcome';
let currentQuestionIndex = 0;
let userAnswers = {};
let appointments = [];
let currentAppointment = null;

// Sample data from the provided JSON
const sampleInsuranceData = {
  planName: "BC Health Plus Premium",
  coverage: {
    dental: {percentage: 80, annualLimit: 1500},
    physiotherapy: {percentage: 100, annualLimit: 2000},
    massage: {percentage: 80, annualLimit: 500},
    vision: {percentage: 100, frequency: "Every 2 years"}
  }
};

const sampleProviders = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    specialty: "Physiotherapist",
    clinic: "Vancouver Wellness Clinic",
    rating: 4.8,
    languages: ["English", "Mandarin"],
    address: "1234 Main St, Vancouver, BC",
    phone: "(604) 555-0123"
  },
  {
    id: 2,
    name: "Dr. Michael Rodriguez",
    specialty: "Dentist",
    clinic: "Downtown Dental Care",
    rating: 4.9,
    languages: ["English", "Spanish"],
    address: "567 Granville St, Vancouver, BC",
    phone: "(604) 555-0456"
  },
  {
    id: 3,
    name: "Lisa Thompson",
    specialty: "Registered Massage Therapist",
    clinic: "Healing Hands Massage",
    rating: 4.7,
    languages: ["English", "French"],
    address: "890 Robson St, Vancouver, BC",
    phone: "(604) 555-0789"
  }
];

// Questionnaire data
const questions = [
  {
    id: 1,
    question: "What time of day do you prefer for medical appointments?",
    type: "radio",
    options: [
      "Morning (8AM - 12PM)",
      "Afternoon (12PM - 5PM)", 
      "Evening (5PM - 8PM)",
      "No preference"
    ],
    key: "timePreference"
  },
  {
    id: 2,
    question: "Which healthcare services are most important to you? (Select all that apply)",
    type: "checkbox",
    options: [
      "Dental care",
      "Physiotherapy",
      "Massage therapy",
      "Vision care",
      "Mental health",
      "Preventive care"
    ],
    key: "importantServices"
  },
  {
    id: 3,
    question: "How often would you like preventive care appointments?",
    type: "slider",
    min: 1,
    max: 4,
    labels: ["Once per year", "Twice per year", "3 times per year", "4 times per year"],
    key: "preventiveCareFrequency"
  },
  {
    id: 4,
    question: "Do you have any current health concerns or conditions?",
    type: "textarea",
    placeholder: "Please describe any current health issues, chronic conditions, or specific areas of concern...",
    key: "healthConcerns"
  },
  {
    id: 5,
    question: "How far are you willing to travel for appointments?",
    type: "slider",
    min: 5,
    max: 50,
    labels: ["5 km", "15 km", "30 km", "50+ km"],
    key: "travelDistance"
  },
  {
    id: 6,
    question: "Do you have a preference for provider gender?",
    type: "radio",
    options: [
      "Female providers preferred",
      "Male providers preferred",
      "No preference"
    ],
    key: "providerGender"
  },
  {
    id: 7,
    question: "Are there any language preferences for your healthcare providers?",
    type: "radio",
    options: [
      "English only",
      "English and French",
      "English and Mandarin",
      "English and Spanish",
      "No preference"
    ],
    key: "languagePreference"
  },
  {
    id: 8,
    question: "Are you interested in alternative or complementary therapies?",
    type: "radio",
    options: [
      "Very interested",
      "Somewhat interested",
      "Not interested",
      "Open to suggestions"
    ],
    key: "alternativeTherapies"
  }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  generateSampleAppointments();
}

function setupEventListeners() {
  // File upload events
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  
  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
  }

  // Modal close events
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
      closeModal();
      closeChangeModal();
      closeSuccessModal();
    }
  });
}

// Page Navigation
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show selected page
  const targetPage = document.getElementById(pageId + '-page');
  if (targetPage) {
    targetPage.classList.add('active');
    currentPage = pageId;
  }
}

function startProcess() {
  showPage('upload');
}

// File Upload Handling
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
}

function handleFileDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

function processFile(file) {
  // Validate file
  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    alert('Please upload a PDF, JPG, or PNG file.');
    return;
  }
  
  if (file.size > maxSize) {
    alert('File size must be less than 10MB.');
    return;
  }
  
  startProcessing();
}

// Add demo function to simulate file processing
function startProcessing() {
  // Hide upload area and show processing
  document.getElementById('uploadArea').classList.add('hidden');
  document.getElementById('processingSection').classList.remove('hidden');
  
  // Simulate AI processing
  setTimeout(() => {
    document.getElementById('processingSection').classList.add('hidden');
    document.getElementById('extractedInfo').classList.remove('hidden');
    document.getElementById('extractedInfo').classList.add('fade-in');
  }, 3000);
}

// Add demo button function
function tryDemo() {
  startProcessing();
}

function proceedToQuestionnaire() {
  showPage('questionnaire');
  startQuestionnaire();
}

// Questionnaire Logic
function startQuestionnaire() {
  currentQuestionIndex = 0;
  userAnswers = {};
  displayQuestion();
  updateProgress();
}

function displayQuestion() {
  const question = questions[currentQuestionIndex];
  const container = document.getElementById('questionContainer');
  
  let html = `<div class="question">
    <h3>${question.question}</h3>
    <div class="question-options">`;
  
  switch (question.type) {
    case 'radio':
      question.options.forEach((option, index) => {
        html += `
          <label class="checkbox-item">
            <input type="radio" name="question_${question.id}" value="${option}" 
                   onchange="handleAnswer('${question.key}', this.value)">
            <span>${option}</span>
          </label>`;
      });
      break;
      
    case 'checkbox':
      html += '<div class="checkbox-group">';
      question.options.forEach((option, index) => {
        html += `
          <label class="checkbox-item">
            <input type="checkbox" value="${option}" 
                   onchange="handleCheckboxAnswer('${question.key}', this.value, this.checked)">
            <span>${option}</span>
          </label>`;
      });
      html += '</div>';
      break;
      
    case 'slider':
      html += `
        <div class="slider-container">
          <div class="slider-labels">
            <span>${question.labels[0]}</span>
            <span>${question.labels[question.labels.length - 1]}</span>
          </div>
          <input type="range" class="slider" min="${question.min}" max="${question.max}" 
                 value="${question.min}" oninput="handleSliderAnswer('${question.key}', this.value)">
          <div class="slider-value" id="slider-value-${question.id}">
            ${question.labels[0]}
          </div>
        </div>`;
      break;
      
    case 'textarea':
      html += `
        <textarea class="form-control" rows="4" placeholder="${question.placeholder}"
                  onchange="handleAnswer('${question.key}', this.value)"></textarea>`;
      break;
  }
  
  html += '</div></div>';
  container.innerHTML = html;
  
  // Update navigation buttons
  document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
  document.getElementById('nextBtn').textContent = 
    currentQuestionIndex === questions.length - 1 ? 'Generate My Schedule' : 'Next';
}

function handleAnswer(key, value) {
  userAnswers[key] = value;
}

function handleCheckboxAnswer(key, value, checked) {
  if (!userAnswers[key]) {
    userAnswers[key] = [];
  }
  
  if (checked) {
    userAnswers[key].push(value);
  } else {
    userAnswers[key] = userAnswers[key].filter(item => item !== value);
  }
}

function handleSliderAnswer(key, value) {
  const question = questions[currentQuestionIndex];
  const index = Math.min(parseInt(value) - question.min, question.labels.length - 1);
  const label = question.labels[index];
  
  userAnswers[key] = value;
  document.getElementById(`slider-value-${question.id}`).textContent = label;
}

function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion();
    updateProgress();
  } else {
    // Generate schedule
    generateSchedule();
  }
}

function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    displayQuestion();
    updateProgress();
  }
}

function updateProgress() {
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  document.getElementById('progressFill').style.width = progress + '%';
  document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
  document.getElementById('totalQuestions').textContent = questions.length;
}

function generateSchedule() {
  showPage('calendar');
  generateCalendar();
}

// Calendar Generation
function generateSampleAppointments() {
  appointments = [
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

function generateCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  let html = '';
  
  months.forEach((month, index) => {
    const monthAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.getMonth() === index;
    });
    
    html += `
      <div class="month-card">
        <div class="month-header">
          <h4>${month} 2025</h4>
        </div>
        <div class="month-body">`;
    
    if (monthAppointments.length > 0) {
      monthAppointments.forEach(appointment => {
        const date = new Date(appointment.date);
        html += `
          <div class="appointment-item" onclick="showAppointmentDetails(${appointment.id})">
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
  });
  
  calendarGrid.innerHTML = html;
}

// Modal Functions
function showAppointmentDetails(appointmentId) {
  const appointment = appointments.find(apt => apt.id === appointmentId);
  if (!appointment) return;
  
  currentAppointment = appointment;
  const provider = sampleProviders.find(p => p.name === appointment.provider) || 
                  {name: appointment.provider, specialty: "Healthcare Provider", rating: 4.5, 
                   clinic: "Medical Clinic", address: "Vancouver, BC", phone: "(604) 555-0000"};
  
  const modal = document.getElementById('appointmentModal');
  const modalBody = document.getElementById('modalBody');
  
  const date = new Date(appointment.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  modalBody.innerHTML = `
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
  
  document.getElementById('modalTitle').textContent = appointment.type;
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('appointmentModal').classList.remove('active');
}

function acceptAppointment() {
  if (currentAppointment) {
    currentAppointment.status = 'accepted';
    alert('Appointment accepted! You will receive a confirmation email shortly.');
    closeModal();
  }
}

function requestChanges() {
  closeModal();
  document.getElementById('changeModal').classList.add('active');
}

function closeChangeModal() {
  document.getElementById('changeModal').classList.remove('active');
}

function submitChanges() {
  const preferredDate = document.getElementById('preferredDate').value;
  const preferredTime = document.getElementById('preferredTime').value;
  const alternativeProvider = document.getElementById('alternativeProvider').value;
  const notes = document.getElementById('changeNotes').value;
  
  closeChangeModal();
  
  // Show success message
  alert('Change request submitted successfully! The provider will contact you within 24 hours.');
}

function sendToProvider() {
  if (currentAppointment) {
    closeModal();
    
    // Generate tracking number
    const trackingNumber = 'HS' + Math.random().toString(36).substr(2, 9).toUpperCase();
    document.getElementById('trackingNumber').textContent = trackingNumber;
    
    document.getElementById('successModal').classList.add('active');
    
    // Simulate status updates
    setTimeout(() => {
      const statusItems = document.querySelectorAll('.status-item');
      if (statusItems[1]) statusItems[1].classList.add('active');
    }, 2000);
    
    setTimeout(() => {
      const statusItems = document.querySelectorAll('.status-item');
      if (statusItems[2]) statusItems[2].classList.add('active');
    }, 4000);
  }
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('active');
}

function generateNewSchedule() {
  // Randomize appointment dates slightly
  appointments.forEach(appointment => {
    const originalDate = new Date(appointment.date);
    const randomDays = Math.floor(Math.random() * 14) - 7; // +/- 7 days
    originalDate.setDate(originalDate.getDate() + randomDays);
    appointment.date = originalDate.toISOString().split('T')[0];
  });
  
  generateCalendar();
  alert('New schedule generated based on your preferences!');
}