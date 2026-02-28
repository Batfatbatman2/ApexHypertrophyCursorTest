import { useTimerStore } from '../stores/timer-store';

jest.mock('@/lib/haptics', () => ({
  haptics: { light: jest.fn(), medium: jest.fn(), heavy: jest.fn(), selection: jest.fn() },
}));

describe('Timer Store', () => {
  beforeEach(() => {
    useTimerStore.setState({
      isActive: false,
      isPaused: false,
      totalSeconds: 90,
      remainingSeconds: 0,
      selectedDuration: 90,
    });
  });

  it('starts timer with correct values', () => {
    useTimerStore.getState().start(120);
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.totalSeconds).toBe(120);
    expect(state.remainingSeconds).toBe(120);
    expect(state.selectedDuration).toBe(120);
  });

  it('pauses and resumes', () => {
    useTimerStore.getState().start(90);
    useTimerStore.getState().pause();
    expect(useTimerStore.getState().isPaused).toBe(true);
    useTimerStore.getState().resume();
    expect(useTimerStore.getState().isPaused).toBe(false);
  });

  it('skips timer', () => {
    useTimerStore.getState().start(90);
    useTimerStore.getState().skip();
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.remainingSeconds).toBe(0);
  });

  it('extends timer', () => {
    useTimerStore.getState().start(90);
    useTimerStore.getState().extend(15);
    const state = useTimerStore.getState();
    expect(state.remainingSeconds).toBe(105);
    expect(state.totalSeconds).toBe(105);
  });

  it('decrements on tick', () => {
    useTimerStore.getState().start(90);
    useTimerStore.getState().tick();
    expect(useTimerStore.getState().remainingSeconds).toBe(89);
  });

  it('does not tick when paused', () => {
    useTimerStore.getState().start(90);
    useTimerStore.getState().pause();
    useTimerStore.getState().tick();
    expect(useTimerStore.getState().remainingSeconds).toBe(90);
  });

  it('does not tick when inactive', () => {
    useTimerStore.getState().tick();
    expect(useTimerStore.getState().remainingSeconds).toBe(0);
  });

  it('stops at zero', () => {
    useTimerStore.getState().start(1);
    useTimerStore.getState().tick();
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.remainingSeconds).toBe(0);
  });

  it('resets all state', () => {
    useTimerStore.getState().start(90);
    useTimerStore.getState().reset();
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.remainingSeconds).toBe(0);
  });
});
