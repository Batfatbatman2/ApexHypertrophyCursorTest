import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';

jest.mock('@/lib/haptics', () => ({
  haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('react-native-reanimated', () => ({
  default: { call: jest.fn() },
  useSharedValue: jest.fn((v) => ({ value: v })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((v) => v),
  createAnimatedComponent: (component: unknown) => component,
}));

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(<Button title="Press Me" />);
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Go" onPress={onPress} />);
    fireEvent.press(getByText('Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with accessibility role', () => {
    const { getByRole } = render(<Button title="Accessible" />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('renders with accessibility label matching title', () => {
    const { getByLabelText } = render(<Button title="Submit" />);
    expect(getByLabelText('Submit')).toBeTruthy();
  });
});
