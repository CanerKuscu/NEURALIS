/**
 * NEURALIS - Error Boundary
 *
 * Catches uncaught JavaScript errors in the component tree and displays
 * a graceful fallback UI instead of crashing the app to a white screen.
 *
 * Usage: Wrap <Stack /> or any critical subtree.
 * <ErrorBoundary><Stack /></ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { captureError } from '../config/sentry';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
    /** Components to render when no error is present */
    children: ReactNode;
    /** Optional custom fallback UI */
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });

        // Log to your crash reporting service in production
        if (__DEV__) {
            console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        } else {
            // Report to Sentry
            captureError(error, {
                tags: { source: 'ErrorBoundary' },
                extras: {
                    componentStack: errorInfo?.componentStack?.substring(0, 2000),
                },
                level: 'fatal',
            });
        }
    }

    /** Reset the boundary so the user can retry */
    private handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback takes precedence
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>🦊</Text>
                    <Text style={styles.title}>Oops! Something went wrong</Text>
                    <Text style={styles.message}>
                        Don't worry — your progress is saved. Try restarting the screen.
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>

                    {/* Show error details only in development */}
                    {__DEV__ && this.state.error && (
                        <ScrollView style={styles.debugContainer}>
                            <Text style={styles.debugTitle}>Debug Info:</Text>
                            <Text style={styles.debugText}>
                                {this.state.error.toString()}
                            </Text>
                            {this.state.errorInfo?.componentStack && (
                                <Text style={styles.debugText}>
                                    {this.state.errorInfo.componentStack}
                                </Text>
                            )}
                        </ScrollView>
                    )}
                </View>
            );
        }

        return this.props.children;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#0D0D0D',
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        color: '#AAAAAA',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        maxWidth: 300,
    },
    button: {
        backgroundColor: '#58CC02',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    debugContainer: {
        maxHeight: 200,
        width: '100%',
        marginTop: 16,
        padding: 12,
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
    },
    debugTitle: {
        color: '#FF6B6B',
        fontWeight: '700',
        marginBottom: 4,
    },
    debugText: {
        color: '#888888',
        fontSize: 11,
        fontFamily: 'monospace',
    },
});

export default ErrorBoundary;
