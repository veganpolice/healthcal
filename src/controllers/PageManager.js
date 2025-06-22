/**
 * Manages page navigation and visibility
 */
export class PageManager {
  constructor() {
    this.currentPage = 'welcome';
    this.pages = new Map();
  }

  async initialize() {
    // Register all pages
    const pageElements = document.querySelectorAll('.page');
    pageElements.forEach(page => {
      this.pages.set(page.id.replace('-page', ''), page);
    });

    // Show initial page
    this.showPage(this.currentPage);
  }

  /**
   * Show a specific page
   * @param {string} pageId - The page identifier
   */
  showPage(pageId) {
    if (!this.pages.has(pageId)) {
      console.warn(`Page '${pageId}' not found`);
      return;
    }

    // Hide all pages
    this.pages.forEach(page => {
      page.classList.remove('active');
    });

    // Show target page
    const targetPage = this.pages.get(pageId);
    targetPage.classList.add('active');
    this.currentPage = pageId;

    // Emit page change event
    this.emit('pageChanged', { from: this.currentPage, to: pageId });
  }

  /**
   * Get current page
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Simple event emitter
   */
  emit(event, data) {
    document.dispatchEvent(new CustomEvent(`pageManager:${event}`, { detail: data }));
  }

  on(event, callback) {
    document.addEventListener(`pageManager:${event}`, callback);
  }
}