/**
 * Storage Factory
 *
 * Manages registration and retrieval of storage adapters.
 * Provides a centralized way to access different storage providers.
 */

import type { StorageAdapter, StorageProvider } from './StorageAdapter';
import { SupabaseStorageAdapter } from './adapters/SupabaseStorageAdapter';

/**
 * Factory for managing storage adapters
 */
export class StorageFactory {
  private static adapters = new Map<StorageProvider, StorageAdapter>();
  private static initialized = false;

  /**
   * Register a storage adapter
   * @param provider Provider identifier
   * @param adapter Adapter instance
   */
  static register(provider: StorageProvider, adapter: StorageAdapter): void {
    this.adapters.set(provider, adapter);
  }

  /**
   * Get a registered storage adapter
   * @param provider Provider identifier
   * @returns Storage adapter instance
   * @throws Error if provider is not registered
   */
  static getAdapter(provider: StorageProvider): StorageAdapter {
    if (!this.initialized) {
      this.initialize();
    }

    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(
        `Storage adapter '${provider}' not registered. Available adapters: ${Array.from(
          this.adapters.keys()
        ).join(', ')}`
      );
    }
    return adapter;
  }

  /**
   * Get the default storage adapter based on environment configuration
   * @returns Default storage adapter
   */
  static getDefaultAdapter(): StorageAdapter {
    if (!this.initialized) {
      this.initialize();
    }

    const provider =
      (process.env.DEFAULT_STORAGE_PROVIDER as StorageProvider) || 'supabase';
    return this.getAdapter(provider);
  }

  /**
   * Initialize and register all available storage adapters
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    // Register Supabase adapter (primary storage)
    this.register('supabase', new SupabaseStorageAdapter());

    this.initialized = true;

    // Log initialization
    console.log(
      `[StorageFactory] Initialized with adapters: ${Array.from(
        this.adapters.keys()
      ).join(', ')}`
    );

    // Verify default adapter is configured (async check, don't block)
    this.verifyDefaultAdapter();
  }

  /**
   * Verify that the default adapter is properly configured
   * (runs async, logs warnings but doesn't throw)
   */
  private static async verifyDefaultAdapter(): Promise<void> {
    try {
      const defaultAdapter = this.getDefaultAdapter();
      const isConfigured = await defaultAdapter.isConfigured();

      if (!isConfigured) {
        console.warn(
          `[StorageFactory] Default storage provider '${defaultAdapter.name}' is not properly configured. Uploads may fail.`
        );
      } else {
        console.log(
          `[StorageFactory] Default storage provider '${defaultAdapter.name}' is configured and ready.`
        );
      }
    } catch (error) {
      console.error(
        '[StorageFactory] Error verifying default adapter:',
        error
      );
    }
  }

  /**
   * Get all registered adapter names
   * @returns Array of registered provider names
   */
  static getRegisteredProviders(): StorageProvider[] {
    if (!this.initialized) {
      this.initialize();
    }
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a provider is registered
   * @param provider Provider identifier
   * @returns true if registered, false otherwise
   */
  static isRegistered(provider: StorageProvider): boolean {
    if (!this.initialized) {
      this.initialize();
    }
    return this.adapters.has(provider);
  }

  /**
   * Clear all registered adapters (for testing)
   */
  static reset(): void {
    this.adapters.clear();
    this.initialized = false;
  }
}

// Auto-initialize when module is loaded
StorageFactory.initialize();
