/**
 * @jest-environment jsdom
 */

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

import * as Haptics from 'expo-haptics';
import { haptics } from '@/lib/haptics';

describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('light', () => {
    it('should not call haptics on web', () => {
      haptics.light();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('medium', () => {
    it('should not call haptics on web', () => {
      haptics.medium();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('heavy', () => {
    it('should not call haptics on web', () => {
      haptics.heavy();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    it('should not call haptics on web', () => {
      haptics.selection();
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('should not call haptics on web', () => {
      haptics.success();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('warning', () => {
    it('should not call haptics on web', () => {
      haptics.warning();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should not call haptics on web', () => {
      haptics.error();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });
});
