/**
 * @jest-environment jsdom
 */

import { useSettingsStore, type WeightUnit, type ThemeMode } from '@/stores/settings-store';

// Mock the MUSCLE_GROUPS import
jest.mock('@/constants/muscle-groups', () => ({
  MUSCLE_GROUPS: [
    { id: 'chest', name: 'Chest', shortName: 'CHEST', defaultWeeklyTarget: 16 },
    { id: 'back', name: 'Back', shortName: 'BACK', defaultWeeklyTarget: 18 },
  ],
}));

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSettingsStore.getState().resetAllSettings();
  });

  describe('default values', () => {
    it('should have correct default values', () => {
      const state = useSettingsStore.getState();
      
      expect(state.weightUnit).toBe('lbs');
      expect(state.defaultRestDuration).toBe(90);
      expect(state.autoStartTimer).toBe(true);
      expect(state.hapticsEnabled).toBe(true);
      expect(state.notificationsEnabled).toBe(true);
      expect(state.theme).toBe('dark');
    });

    it('should have default volume targets from muscle groups', () => {
      const state = useSettingsStore.getState();
      
      expect(state.volumeTargets.chest).toBe(16);
      expect(state.volumeTargets.back).toBe(18);
    });
  });

  describe('setWeightUnit', () => {
    it('should update weight unit to kg', () => {
      const { setWeightUnit } = useSettingsStore.getState();
      
      setWeightUnit('kg');
      
      expect(useSettingsStore.getState().weightUnit).toBe('kg');
    });

    it('should update weight unit back to lbs', () => {
      const { setWeightUnit } = useSettingsStore.getState();
      
      setWeightUnit('kg');
      setWeightUnit('lbs');
      
      expect(useSettingsStore.getState().weightUnit).toBe('lbs');
    });
  });

  describe('setDefaultRestDuration', () => {
    it('should update rest duration', () => {
      const { setDefaultRestDuration } = useSettingsStore.getState();
      
      setDefaultRestDuration(120);
      
      expect(useSettingsStore.getState().defaultRestDuration).toBe(120);
    });

    it('should handle zero rest duration', () => {
      const { setDefaultRestDuration } = useSettingsStore.getState();
      
      setDefaultRestDuration(0);
      
      expect(useSettingsStore.getState().defaultRestDuration).toBe(0);
    });
  });

  describe('setAutoStartTimer', () => {
    it('should disable auto start timer', () => {
      const { setAutoStartTimer } = useSettingsStore.getState();
      
      setAutoStartTimer(false);
      
      expect(useSettingsStore.getState().autoStartTimer).toBe(false);
    });

    it('should enable auto start timer', () => {
      const { setAutoStartTimer, setAutoStartTimer: disable } = useSettingsStore.getState();
      
      disable(false);
      setAutoStartTimer(true);
      
      expect(useSettingsStore.getState().autoStartTimer).toBe(true);
    });
  });

  describe('setHapticsEnabled', () => {
    it('should disable haptics', () => {
      const { setHapticsEnabled } = useSettingsStore.getState();
      
      setHapticsEnabled(false);
      
      expect(useSettingsStore.getState().hapticsEnabled).toBe(false);
    });
  });

  describe('setNotificationsEnabled', () => {
    it('should disable notifications', () => {
      const { setNotificationsEnabled } = useSettingsStore.getState();
      
      setNotificationsEnabled(false);
      
      expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('should update theme to light', () => {
      const { setTheme } = useSettingsStore.getState();
      
      setTheme('light');
      
      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('should update theme to system', () => {
      const { setTheme } = useSettingsStore.getState();
      
      setTheme('system');
      
      expect(useSettingsStore.getState().theme).toBe('system');
    });

    it('should update theme back to dark', () => {
      const { setTheme } = useSettingsStore.getState();
      
      setTheme('light');
      setTheme('dark');
      
      expect(useSettingsStore.getState().theme).toBe('dark');
    });
  });

  describe('setVolumeTarget', () => {
    it('should update volume target for a muscle group', () => {
      const { setVolumeTarget } = useSettingsStore.getState();
      
      setVolumeTarget('chest', 20);
      
      expect(useSettingsStore.getState().volumeTargets.chest).toBe(20);
    });

    it('should clamp volume target to maximum of 30', () => {
      const { setVolumeTarget } = useSettingsStore.getState();
      
      setVolumeTarget('chest', 50);
      
      expect(useSettingsStore.getState().volumeTargets.chest).toBe(30);
    });

    it('should clamp volume target to minimum of 0', () => {
      const { setVolumeTarget } = useSettingsStore.getState();
      
      setVolumeTarget('chest', -10);
      
      expect(useSettingsStore.getState().volumeTargets.chest).toBe(0);
    });

    it('should handle boundary values correctly', () => {
      const { setVolumeTarget } = useSettingsStore.getState();
      
      setVolumeTarget('chest', 30);
      expect(useSettingsStore.getState().volumeTargets.chest).toBe(30);
      
      setVolumeTarget('chest', 0);
      expect(useSettingsStore.getState().volumeTargets.chest).toBe(0);
    });
  });

  describe('resetVolumeTargets', () => {
    it('should reset volume targets to defaults', () => {
      const { setVolumeTarget, resetVolumeTargets } = useSettingsStore.getState();
      
      setVolumeTarget('chest', 25);
      resetVolumeTargets();
      
      expect(useSettingsStore.getState().volumeTargets.chest).toBe(16);
      expect(useSettingsStore.getState().volumeTargets.back).toBe(18);
    });
  });

  describe('resetAllSettings', () => {
    it('should reset all settings to defaults', () => {
      const { 
        setWeightUnit, 
        setDefaultRestDuration, 
        setAutoStartTimer, 
        setHapticsEnabled, 
        setNotificationsEnabled,
        setTheme,
        setVolumeTarget,
        resetAllSettings 
      } = useSettingsStore.getState();
      
      // Change all settings
      setWeightUnit('kg');
      setDefaultRestDuration(180);
      setAutoStartTimer(false);
      setHapticsEnabled(false);
      setNotificationsEnabled(false);
      setTheme('light');
      setVolumeTarget('chest', 30);
      
      // Reset
      resetAllSettings();
      
      // Verify all are back to defaults
      const state = useSettingsStore.getState();
      expect(state.weightUnit).toBe('lbs');
      expect(state.defaultRestDuration).toBe(90);
      expect(state.autoStartTimer).toBe(true);
      expect(state.hapticsEnabled).toBe(true);
      expect(state.notificationsEnabled).toBe(true);
      expect(state.theme).toBe('dark');
      expect(state.volumeTargets.chest).toBe(16);
    });
  });
});
