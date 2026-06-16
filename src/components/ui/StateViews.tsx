/**
 * Reusable Loading and Empty State Components
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw, Inbox, WifiOff } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = COLORS.primary,
}) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} color={color} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

interface EmptyStateProps {
  icon?: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => (
  <View style={styles.container}>
    <View style={styles.iconContainer}>
      <Icon size={64} color="#BDC3C7" />
    </View>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {actionLabel && onAction && (
      <TouchableOpacity style={styles.actionButton} onPress={onAction}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong',
  onRetry,
  retryLabel = 'Try Again',
}) => (
  <View style={styles.container}>
    <View style={[styles.iconContainer, styles.errorIcon]}>
      <AlertCircle size={64} color="#E74C3C" />
    </View>
    <Text style={styles.title}>Oops!</Text>
    <Text style={styles.subtitle}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <RefreshCw size={18} color="#FFF" />
        <Text style={styles.retryText}>{retryLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

interface OfflineStateProps {
  onRetry?: () => void;
}

export const OfflineState: React.FC<OfflineStateProps> = ({ onRetry }) => (
  <View style={styles.container}>
    <View style={[styles.iconContainer, styles.offlineIcon]}>
      <WifiOff size={64} color="#7F8C8D" />
    </View>
    <Text style={styles.title}>No Connection</Text>
    <Text style={styles.subtitle}>Please check your internet connection and try again</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <RefreshCw size={18} color="#FFF" />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  errorIcon: {
    opacity: 0.9,
  },
  offlineIcon: {
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default { LoadingState, EmptyState, ErrorState, OfflineState };
