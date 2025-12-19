/**
 * Storage Integration Tests
 *
 * Basic tests to verify the storage adapter pattern is working correctly
 */

import { StorageFactory } from '../StorageFactory';
import type { StorageProvider } from '../StorageAdapter';

describe('Storage Integration', () => {
  beforeEach(() => {
    // Reset factory before each test
    StorageFactory.reset();
    StorageFactory.initialize();
  });

  describe('StorageFactory', () => {
    it('should initialize with Supabase adapter', () => {
      const providers = StorageFactory.getRegisteredProviders();
      expect(providers).toContain('supabase');
    });

    it('should get default adapter', () => {
      const adapter = StorageFactory.getDefaultAdapter();
      expect(adapter).toBeDefined();
      expect(adapter.name).toBe('supabase');
    });

    it('should get specific adapter', () => {
      const adapter = StorageFactory.getAdapter('supabase');
      expect(adapter).toBeDefined();
      expect(adapter.name).toBe('supabase');
    });

    it('should throw error for unregistered provider', () => {
      expect(() => {
        StorageFactory.getAdapter('nonexistent' as StorageProvider);
      }).toThrow();
    });

    it('should check if provider is registered', () => {
      expect(StorageFactory.isRegistered('supabase')).toBe(true);
      expect(StorageFactory.isRegistered('nonexistent' as StorageProvider)).toBe(false);
    });
  });

  describe('SupabaseStorageAdapter', () => {
    it('should have correct name', () => {
      const adapter = StorageFactory.getAdapter('supabase');
      expect(adapter.name).toBe('supabase');
    });

    it('should implement all required methods', () => {
      const adapter = StorageFactory.getAdapter('supabase');
      expect(typeof adapter.upload).toBe('function');
      expect(typeof adapter.delete).toBe('function');
      expect(typeof adapter.exists).toBe('function');
      expect(typeof adapter.getPublicUrl).toBe('function');
      expect(typeof adapter.getSignedUrl).toBe('function');
      expect(typeof adapter.getMetadata).toBe('function');
      expect(typeof adapter.isConfigured).toBe('function');
    });

    it('should check if configured', async () => {
      const adapter = StorageFactory.getAdapter('supabase');
      const isConfigured = await adapter.isConfigured();
      expect(typeof isConfigured).toBe('boolean');
    });
  });
});
