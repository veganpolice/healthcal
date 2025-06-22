import { DatabaseService } from './DatabaseService.js';

/**
 * Manages healthcare provider data
 */
export class ProviderService {
  constructor() {
    this.sampleProviders = [
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
      },
      {
        id: 4,
        name: "Dr. Amanda Foster",
        specialty: "Optometrist",
        clinic: "Clear Vision Eye Care",
        rating: 4.6,
        languages: ["English"],
        address: "456 Oak St, Vancouver, BC",
        phone: "(604) 555-0321"
      },
      {
        id: 5,
        name: "Dr. Jennifer Kim",
        specialty: "Family Physician",
        clinic: "Vancouver Family Medical",
        rating: 4.5,
        languages: ["English", "Korean"],
        address: "789 Pine St, Vancouver, BC",
        phone: "(604) 555-0654"
      }
    ];
  }

  /**
   * Get all providers
   * @returns {Promise<Array>} Array of providers
   */
  async getProviders() {
    if (DatabaseService.isConnected()) {
      const { data, error } = await DatabaseService.query('providers', {
        select: '*',
        order: { column: 'rating', ascending: false }
      });

      if (error) {
        console.error('Failed to fetch providers from database:', error);
        return this.sampleProviders;
      }

      return data || this.sampleProviders;
    }

    return this.sampleProviders;
  }

  /**
   * Get provider by name
   * @param {string} name - Provider name
   * @returns {Object} Provider object
   */
  getProviderByName(name) {
    return this.sampleProviders.find(p => p.name === name) || {
      name: name,
      specialty: "Healthcare Provider",
      rating: 4.5,
      clinic: "Medical Clinic",
      address: "Vancouver, BC",
      phone: "(604) 555-0000",
      languages: ["English"]
    };
  }

  /**
   * Search providers by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Filtered providers
   */
  async searchProviders(criteria) {
    const providers = await this.getProviders();
    
    return providers.filter(provider => {
      // Filter by specialty
      if (criteria.specialty && !provider.specialty.toLowerCase().includes(criteria.specialty.toLowerCase())) {
        return false;
      }

      // Filter by language
      if (criteria.language && !provider.languages.some(lang => 
        lang.toLowerCase().includes(criteria.language.toLowerCase()))) {
        return false;
      }

      // Filter by minimum rating
      if (criteria.minRating && provider.rating < criteria.minRating) {
        return false;
      }

      // Filter by location (simplified - would need proper geo-coding)
      if (criteria.location && !provider.address.toLowerCase().includes(criteria.location.toLowerCase())) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get providers by specialty
   * @param {string} specialty - Provider specialty
   * @returns {Promise<Array>} Filtered providers
   */
  async getProvidersBySpecialty(specialty) {
    return this.searchProviders({ specialty });
  }

  /**
   * Get top-rated providers
   * @param {number} limit - Number of providers to return
   * @returns {Promise<Array>} Top-rated providers
   */
  async getTopRatedProviders(limit = 5) {
    const providers = await this.getProviders();
    return providers
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
}