import { vi } from 'vitest'

// Mock DOM APIs that might not be available in jsdom
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}))

// Setup DOM
document.body.innerHTML = `
  <div id="uploadArea"></div>
  <div id="fileInput"></div>
  <div id="demo-btn"></div>
  <div id="continue-btn"></div>
  <div id="get-started-btn"></div>
  <div id="processingSection" class="hidden"></div>
  <div id="extractedInfo" class="hidden"></div>
  <div id="questionContainer"></div>
  <div id="progressFill"></div>
  <div id="currentQuestion"></div>
  <div id="totalQuestions"></div>
  <div id="prevBtn"></div>
  <div id="nextBtn"></div>
  <div id="calendarGrid"></div>
  <div id="appointmentModal" class="modal"></div>
  <div id="modalBody"></div>
  <div id="modalTitle"></div>
`