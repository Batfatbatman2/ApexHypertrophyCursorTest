// Simple storage with caching for performance
// For production, consider using react-native-mmkv for better performance
// Web uses localStorage, React Native uses AsyncStorage

// Detect if we're in a browser environment
const isWeb = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// In-memory cache for both environments
const storageCache: Record<string, string> = {};

// Web storage implementation using localStorage
const webStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage setItem failed:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage removeItem failed:', e);
    }
  },
};

// AsyncStorage import - works on both web (with polyfill) and native
let AsyncStorage: any;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  // If AsyncStorage is not available, use web storage
  AsyncStorage = webStorage;
}

export const appStorage = {
  getString: (key: string): string | undefined | null => {
    // First check cache
    if (storageCache[key] !== undefined) {
      return storageCache[key];
    }
    // On web, also check localStorage
    if (isWeb) {
      const val = webStorage.getItem(key);
      if (val !== null) {
        storageCache[key] = val;
        return val;
      }
      // Key not found - return undefined for zustand compatibility
      return undefined;
    }
    return undefined;
  },

  set: (key: string, value: string): void => {
    storageCache[key] = value;
    // Save to AsyncStorage (web polyfill or native)
    AsyncStorage.setItem(key, value).catch(console.warn);
  },

  getBoolean: (key: string): boolean | undefined => {
    const val = appStorage.getString(key);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  },

  setBoolean: (key: string, value: boolean): void => {
    appStorage.set(key, value ? 'true' : 'false');
  },

  getNumber: (key: string): number | undefined => {
    const val = appStorage.getString(key);
    if (!val) return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : num;
  },

  setNumber: (key: string, value: number): void => {
    appStorage.set(key, value.toString());
  },

  delete: (key: string): void => {
    delete storageCache[key];
    AsyncStorage.removeItem(key).catch(console.warn);
  },

  getAllKeys: (): string[] => {
    return Object.keys(storageCache);
  },

  // Load specific keys into cache (call on app start for needed keys)
  loadKeys: async (keys: string[]): Promise<void> => {
    try {
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          storageCache[key] = value;
        }
      }
    } catch (e) {
      console.warn('Storage loadKeys failed:', e);
    }
  },

  // Initialize - loads common app keys
  initialize: async (): Promise<void> => {
    try {
      if (isWeb) {
        // On web, load all keys from localStorage
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            storageCache[key] = value;
          }
        }
      } else {
        // On native, use AsyncStorage
        const keys = await AsyncStorage.getAllKeys();
        if (keys && keys.length > 0) {
          for (const key of keys) {
            const value = await AsyncStorage.getItem(key);
            if (value !== null) {
              storageCache[key] = value;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Storage init failed:', e);
    }
  },
};

// Legacy export for compatibility
export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    return appStorage.getString(key) ?? null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    appStorage.set(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    appStorage.delete(key);
  },
};
