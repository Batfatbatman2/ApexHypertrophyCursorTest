import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Card } from '../../components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>,
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('renders with default variant', () => {
    const { toJSON } = render(
      <Card>
        <Text>Default</Text>
      </Card>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with highlighted variant', () => {
    const { toJSON } = render(
      <Card variant="highlighted">
        <Text>Highlighted</Text>
      </Card>,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('applies custom padding', () => {
    const { toJSON } = render(
      <Card padding={0}>
        <Text>No padding</Text>
      </Card>,
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });
});
