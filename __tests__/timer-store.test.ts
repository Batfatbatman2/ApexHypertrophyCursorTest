/**
 * @jest-environment jsdom
 */

// Mock haptics
jest.mock('@/lib/haptics', () => ({
  haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    selection: jest.fn(),
  },
}));

import { useTimerStore } from '@/stores/timer-store';
import { haptics } from '@/lib/haptics';

describe('useTimerStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useTimerStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('default values', () => {
    it('should have correct default values', () => {
      const state = useTimerStore.getState();
      
      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.totalSeconds).toBe(90);
      expect(state.remainingSeconds).toBe(0);
      expect(state.selectedDuration).toBe(90);
    });
  });

  describe('start', () => {
    it('should start timer with given seconds', () => {
      const { start } = useTimerStore.getState();
      
      start(60);
      
      const state = useTimerStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.totalSeconds).toBe(60);
      expect(state.remainingSeconds).toBe(60);
      expect(state.selectedDuration).toBe(60);
    });

    it('should start timer with default 90 seconds', () => {
      const { start } = useTimerStore.getState();
      
      start(90);
      
      const state = useTimerStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.remainingSeconds).toBe(90);
    });
  });

  describe('pause', () => {
    it('should pause the timer', () => {
      const { start, pause } = useTimerStore.getState();
      
      start(60);
      pause();
      
      expect(useTimerStore.getState().isPaused).toBe(true);
    });
  });

  describe('resume', () => {
    it('should resume the timer', () => {
      const { start, pause, resume } = useTimerStore.getState();
      
      start(60);
      pause();
      resume();
      
      expect(useTimerStore.getState().isPaused).toBe(false);
    });
  });

  describe('skip', () => {
    it('should skip and stop the timer', () => {
      const { start, skip } = useTimerStore.getState();
      
      start(60);
      skip();
      
      const state = useTimerStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.remainingSeconds).toBe(0);
    });

    it('should trigger haptics on skip', () => {
      const { start, skip } = useTimerStore.getState();
      
      start(60);
      skip();
      
      expect(haptics.light).toHaveBeenCalled();
    });
  });

  describe('extend', () => {
    it('should extend timer by given seconds', () => {
      const { start, extend } = useTimerStore.getState();
      
      start(60);
      extend(30);
      
      const state = useTimerStore.getState();
      expect(state.remainingSeconds).toBe(90);
      expect(state.totalSeconds).toBe(90);
    });

    it('should handle multiple extensions', () => {
      const { start, extend } = useTimerStore.getState();
      
      start(60);
      extend(30);
      extend(15);
      
      expect(useTimerStore.getState().remainingSeconds).toBe(105);
    });
  });

  describe('setDuration', () => {
    it('should set duration and reset remaining time', () => {
      const { start, setDuration, tick } = useTimerStore.getState();
      
      start(60);
      // Simulate some ticks
      for (let i = 0; i < 10; i++) {
        tick();
      }
      
      setDuration(120);
      
      const state = useTimerStore.getState();
      expect(state.totalSeconds).toBe(120);
      expect(state.remainingSeconds).toBe(120);
      expect(state.selectedDuration).toBe(120);
    });

    it('should trigger selection haptics', () => {
      const { setDuration } = useTimerStore.getState();
      
      setDuration(120);
      
      expect(haptics.selection).toHaveBeenCalled();
    });
  });

  describe('tick', () => {
    it('should decrement remaining seconds when active and not paused', () => {
      const { start, tick } = useTimerStore.getState();
      
      start(60);
      tick();
      
      expect(useTimerStore.getState().remainingSeconds).toBe(59);
    });

    it('should not tick when paused', () => {
      const { start, pause, tick } = useTimerStore.getState();
      
      start(60);
      pause();
      tick();
      
      expect(useTimerStore.getState().remainingSeconds).toBe(60);
    });

    it('should not tick when not active', () => {
      const { tick } = useTimerStore.getState();
      
      tick();
      
      expect(useTimerStore.getState().remainingSeconds).toBe(0);
    });

    it('should trigger light haptics at 10 seconds', () => {
      const { start, tick } = useTimerStore.getState();
      
      start(12);
      tick(); // 11
      tick(); // 10 - should trigger
      
      expect(haptics.light).toHaveBeenCalledTimes(1);
    });

    it('should trigger medium haptics at 5 seconds', () => {
      const { start, tick } = useTimerStore.getState();
      
      start(7);
      for (let i = 0; i < 2; i++) tick(); // 5 - should trigger
      
      expect(haptics.medium).toHaveBeenCalledTimes(1);
    });

    it('should stop timer at 0 seconds', () => {
      const { start, tick } = useTimerStore.getState();
      
      start(2);
      tick(); // 1
      tick(); // 0 - should stop
      
      const state = useTimerStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.remainingSeconds).toBe(0);
    });

    it('should trigger heavy haptics when timer ends', () => {
      const { start, tick } = useTimerStore.getState();
      
      start(2);
      tick();
      tick();
      
      expect(haptics.heavy).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset timer state', () => {
      const { start, extend, reset } = useTimerStore.getState();
      
      start(120);
      extend(60);
      reset();
      
      const state = useTimerStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.remainingSeconds).toBe(0);
    });
  });
});
