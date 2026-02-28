import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../../components/ui/Badge';

describe('Badge', () => {
  it('renders label text', () => {
    const { getByText } = render(<Badge label="ACTIVE" />);
    expect(getByText('ACTIVE')).toBeTruthy();
  });

  it('renders with accent variant by default', () => {
    const { toJSON } = render(<Badge label="TEST" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders all standard variants without error', () => {
    const variants = [
      'accent',
      'success',
      'warning',
      'error',
      'muted',
      'outlined',
      'outlinedMuted',
    ] as const;
    for (const variant of variants) {
      const { getByText } = render(<Badge label={variant.toUpperCase()} variant={variant} />);
      expect(getByText(variant.toUpperCase())).toBeTruthy();
    }
  });

  it('renders custom variant with color', () => {
    const { getByText } = render(<Badge label="CUSTOM" variant="custom" color="#FF0000" />);
    expect(getByText('CUSTOM')).toBeTruthy();
  });

  it('renders in both sizes', () => {
    const { getByText: getSm } = render(<Badge label="SM" size="sm" />);
    expect(getSm('SM')).toBeTruthy();

    const { getByText: getMd } = render(<Badge label="MD" size="md" />);
    expect(getMd('MD')).toBeTruthy();
  });
});
