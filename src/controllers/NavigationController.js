/**
 * Handles navigation between pages
 */
export class NavigationController {
  constructor(pageManager) {
    this.pageManager = pageManager;
  }

  async initialize() {
    this.setupNavigationHandlers();
  }

  setupNavigationHandlers() {
    // Header navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const page = e.target.textContent.toLowerCase();
        const pageMap = {
          'home': 'welcome',
          'upload': 'upload',
          'preferences': 'questionnaire',
          'calendar': 'calendar'
        };
        
        if (pageMap[page]) {
          this.pageManager.showPage(pageMap[page]);
        }
      });
    });

    // Get Started button
    const getStartedBtn = document.querySelector('[onclick="startProcess()"]');
    if (getStartedBtn) {
      getStartedBtn.removeAttribute('onclick');
      getStartedBtn.addEventListener('click', () => {
        this.pageManager.showPage('upload');
      });
    }
  }
}