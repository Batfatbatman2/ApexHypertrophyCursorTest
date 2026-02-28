import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple storage with caching for performance
// For production, consider using react-native-mmkv for better performance

const storageCache: Record<string, string> = {};

export const appStorage = {
  getString: (key: string): string | undefined => {
    return storageCache[key] ?? undefined;
  },

  set: (key: string, value: string): void => {
    storageCache[key] = value;
    AsyncStorage.setItem(key, value).catch(console.warn);
  },

  getBoolean: (key: string): boolean | undefined => {
    const val = storageCache[key];
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  },

  setBoolean: (key: string, value: boolean): void => {
    appStorage.set(key, value ? 'true' : 'false');
  },

  getNumber: (key: string): number | undefined => {
    const val = storageCache[key];
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
      const keys = await AsyncStorage.getAllKeys();
      if (keys && keys.length > 0) {
        for (const key of keys) {
          const value = await AsyncStorage.getItem(key);
          if (value !== null) {
            storageCache[key] = value;
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
