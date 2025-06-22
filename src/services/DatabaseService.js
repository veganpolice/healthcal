import { createClient } from '@supabase/supabase-js';

/**
 * Database service for Supabase integration
 */
export class DatabaseService {
  static instance = null;
  static client = null;

  static async initialize() {
    if (this.instance) return this.instance;

    try {
      // Initialize Supabase client
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found. Running in demo mode.');
        this.client = null;
      } else {
        this.client = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized');
      }

      this.instance = new DatabaseService();
      return this.instance;
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  static getClient() {
    return this.client;
  }

  static isConnected() {
    return this.client !== null;
  }

  /**
   * Generic query method
   */
  static async query(table, options = {}) {
    if (!this.client) {
      console.warn('Database not connected. Using mock data.');
      return { data: [], error: null };
    }

    try {
      let query = this.client.from(table);

      if (options.select) query = query.select(options.select);
      if (options.filter) {
        if (Array.isArray(options.filter) && options.filter.length === 3) {
          const [column, operator, value] = options.filter;
          query = query.filter(column, operator, value);
        }
      }
      if (options.order) query = query.order(options.order.column, { ascending: options.order.ascending });
      if (options.limit) query = query.limit(options.limit);
      if (options.delete) {
        // Handle delete operations
        if (options.filter) {
          const [column, operator, value] = options.filter;
          query = query.delete().filter(column, operator, value);
        } else {
          query = query.delete();
        }
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      console.error('Database query failed:', error);
      return { data: null, error };
    }
  }

  /**
   * Generic insert method
   */
  static async insert(table, data) {
    if (!this.client) {
      console.warn('Database not connected. Cannot insert data.');
      return { data: null, error: 'Database not connected' };
    }

    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      return { data: result, error };
    } catch (error) {
      console.error('Database insert failed:', error);
      return { data: null, error };
    }
  }

  /**
   * Generic update method
   */
  static async update(table, id, data) {
    if (!this.client) {
      console.warn('Database not connected. Cannot update data.');
      return { data: null, error: 'Database not connected' };
    }

    try {
      const { data: result, error } = await this.client
        .from(table)
        .update(data)
        .eq('id', id)
        .select();

      return { data: result, error };
    } catch (error) {
      console.error('Database update failed:', error);
      return { data: null, error };
    }
  }
}