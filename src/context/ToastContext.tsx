import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
    type?: ToastType;
    duration?: number;
    title?: string;
}

interface ToastContextType {
    showToast: (message: string, options?: ToastOptions) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<{ message: string; type: ToastType; title?: string } | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, options: ToastOptions = {}) => {
        // Clear any existing timeout to prevent premature dismissal
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        setToast({
            message,
            type: options.type || 'info',
            title: options.title
        });

        if (options.duration !== 0) {
            timeoutRef.current = setTimeout(() => {
                setToast(null);
                timeoutRef.current = null;
            }, options.duration || 3000);
        }
    }, []);

    const hideToast = useCallback(() => setToast(null), []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {toast && (
                <View style={[styles.container, { top: insets.top + 10 }]}>
                    <Animated.View
                        entering={FadeInUp.springify()}
                        exiting={FadeOutUp}
                        style={[styles.toast, styles[toast.type]]}
                    >
                        <View style={styles.iconContainer}>
                            {toast.type === 'success' && <CheckCircle color="#FFF" size={24} />}
                            {toast.type === 'error' && <XCircle color="#FFF" size={24} />}
                            {toast.type === 'info' && <Info color="#FFF" size={24} />}
                            {toast.type === 'warning' && <AlertTriangle color="#FFF" size={24} />}
                        </View>
                        <View style={styles.contentContainer}>
                            {toast.title && <Text style={styles.title}>{toast.title}</Text>}
                            <Text style={styles.message}>{toast.message}</Text>
                        </View>
                        <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
                            <X color="#FFF" size={18} />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 99999, // Super high z-index
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    contentContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    title: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    message: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        padding: 4,
        opacity: 0.8,
    },
    // Variants
    success: { backgroundColor: '#2ECC71' },
    error: { backgroundColor: '#E74C3C' },
    info: { backgroundColor: '#3498DB' },
    warning: { backgroundColor: '#F1C40F' },
});
