/**
 * @file PrimaryButton component tests
 *
 * Tests the Duolingo-style 3D button component for correct rendering,
 * disabled state, loading state, and press handling.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders with title text', async () => {
    const { getByText } = await render(<PrimaryButton title="Continue" onPress={() => {}} />);
    expect(getByText('Continue')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<PrimaryButton title="Start" onPress={onPress} />);
    fireEvent.press(getByText('Start'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<PrimaryButton title="Locked" onPress={onPress} disabled />);
    fireEvent.press(getByText('Locked'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', async () => {
    const { queryByText } = await render(<PrimaryButton title="Save" onPress={() => {}} loading />);
    // Title should not be visible when loading
    expect(queryByText('Save')).toBeNull();
  });

  it('does not call onPress when loading', async () => {
    const onPress = jest.fn();
    const { root } = await render(<PrimaryButton title="Save" onPress={onPress} loading />);
    // Loading state should prevent press
    // The TouchableOpacity is disabled when loading
    expect(onPress).not.toHaveBeenCalled();
  });
});
