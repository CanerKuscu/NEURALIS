/**
 * @file StateViews component tests
 *
 * Tests LoadingState, EmptyState, ErrorState, and OfflineState
 * to ensure they render correctly and respond to user interactions.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  OfflineState,
} from '../../src/components/ui/StateViews';

describe('StateViews', () => {
  // ─── LoadingState ─────────────────────────────────────────────────────
  describe('LoadingState', () => {
    it('renders with default message', async () => {
      const { getByText } = await render(<LoadingState />);
      expect(getByText('Loading...')).toBeTruthy();
    });

    it('renders with custom message', async () => {
      const { getByText } = await render(<LoadingState message="Yükleniyor..." />);
      expect(getByText('Yükleniyor...')).toBeTruthy();
    });
  });

  // ─── EmptyState ────────────────────────────────────────────────────────
  describe('EmptyState', () => {
    it('renders title and subtitle', async () => {
      const { getByText } = await render(
        <EmptyState title="No Data" subtitle="Nothing to show here" />,
      );
      expect(getByText('No Data')).toBeTruthy();
      expect(getByText('Nothing to show here')).toBeTruthy();
    });

    it('renders action button and triggers callback', async () => {
      const onAction = jest.fn();
      const { getByText } = await render(
        <EmptyState title="Empty" actionLabel="Add Item" onAction={onAction} />,
      );
      fireEvent.press(getByText('Add Item'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not render action button when no callback', async () => {
      const { queryByText } = await render(<EmptyState title="Empty" actionLabel="Add Item" />);
      expect(queryByText('Add Item')).toBeNull();
    });
  });

  // ─── ErrorState ────────────────────────────────────────────────────────
  describe('ErrorState', () => {
    it('renders default error message', async () => {
      const { getByText } = await render(<ErrorState />);
      expect(getByText('Oops!')).toBeTruthy();
      expect(getByText('Something went wrong')).toBeTruthy();
    });

    it('renders custom error message', async () => {
      const { getByText } = await render(<ErrorState message="Network error" />);
      expect(getByText('Network error')).toBeTruthy();
    });

    it('renders retry button and fires callback', async () => {
      const onRetry = jest.fn();
      const { getByText } = await render(<ErrorState onRetry={onRetry} />);
      fireEvent.press(getByText('Try Again'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button without callback', async () => {
      const { queryByText } = await render(<ErrorState />);
      expect(queryByText('Try Again')).toBeNull();
    });
  });

  // ─── OfflineState ─────────────────────────────────────────────────────
  describe('OfflineState', () => {
    it('renders no connection message', async () => {
      const { getByText } = await render(<OfflineState />);
      expect(getByText('No Connection')).toBeTruthy();
    });

    it('renders retry button and fires callback', async () => {
      const onRetry = jest.fn();
      const { getByText } = await render(<OfflineState onRetry={onRetry} />);
      fireEvent.press(getByText('Retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
