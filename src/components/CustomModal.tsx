/**
 * CustomModal - Modern replacement for Alert.alert
 * Supports: confirm, info, error, success, premium-upsell types
 * Animated with spring effects, blur background
 */
import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { X, CheckCircle, AlertTriangle, Info, Crown, ShieldAlert } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ModalType = 'confirm' | 'info' | 'error' | 'success' | 'premium' | 'warning';

export interface ModalButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

export interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  type?: ModalType;
  title: string;
  message?: string;
  icon?: React.ReactNode;
  buttons?: ModalButton[];
  /** If true, tapping backdrop will close */
  dismissable?: boolean;
}

const MODAL_COLORS = {
  bg: '#1A2C34',
  card: '#243B44',
  text: '#FFFFFF',
  textSecondary: '#AFAFAF',
  primary: '#58CC02',
  primaryDark: '#4CAD02',
  red: '#FF4B4B',
  gold: '#FFC800',
  blue: '#1CB0F6',
  purple: '#CE82FF',
  border: '#3C4D56',
  overlay: 'rgba(0,0,0,0.75)',
};

const TYPE_CONFIG: Record<
  ModalType,
  { color: string; IconComponent: React.FC<any>; iconColor: string; bgColor: string }
> = {
  confirm: {
    color: MODAL_COLORS.blue,
    IconComponent: Info,
    iconColor: MODAL_COLORS.blue,
    bgColor: 'rgba(28,176,246,0.15)',
  },
  info: {
    color: MODAL_COLORS.blue,
    IconComponent: Info,
    iconColor: MODAL_COLORS.blue,
    bgColor: 'rgba(28,176,246,0.15)',
  },
  error: {
    color: MODAL_COLORS.red,
    IconComponent: ShieldAlert,
    iconColor: MODAL_COLORS.red,
    bgColor: 'rgba(255,75,75,0.15)',
  },
  success: {
    color: MODAL_COLORS.primary,
    IconComponent: CheckCircle,
    iconColor: MODAL_COLORS.primary,
    bgColor: 'rgba(88,204,2,0.15)',
  },
  premium: {
    color: MODAL_COLORS.gold,
    IconComponent: Crown,
    iconColor: MODAL_COLORS.gold,
    bgColor: 'rgba(255,200,0,0.15)',
  },
  warning: {
    color: MODAL_COLORS.gold,
    IconComponent: AlertTriangle,
    iconColor: MODAL_COLORS.gold,
    bgColor: 'rgba(255,200,0,0.15)',
  },
};

export function CustomModal({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  icon,
  buttons,
  dismissable = true,
}: CustomModalProps) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.85, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dismissable) onClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, dismissable, onClose]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const config = TYPE_CONFIG[type];
  const IconComp = config.IconComponent;

  const defaultButtons: ModalButton[] = buttons || [
    { text: 'OK', onPress: onClose, style: 'primary' },
  ];

  const getButtonStyle = (btnStyle?: string) => {
    switch (btnStyle) {
      case 'cancel':
        return {
          backgroundColor: MODAL_COLORS.card,
          borderWidth: 1,
          borderColor: MODAL_COLORS.border,
        };
      case 'destructive':
        return { backgroundColor: MODAL_COLORS.red };
      case 'primary':
        return { backgroundColor: config.color };
      default:
        return { backgroundColor: config.color };
    }
  };

  const getButtonTextColor = (btnStyle?: string) => {
    if (btnStyle === 'cancel') return MODAL_COLORS.textSecondary;
    if (btnStyle === 'primary' && type === 'premium') return '#000';
    return '#FFF';
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={dismissable ? onClose : undefined}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          <TouchableOpacity activeOpacity={1}>
            {/* Close button */}
            {dismissable && (
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
                <X size={20} color={MODAL_COLORS.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
              {icon || <IconComp size={32} color={config.iconColor} />}
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            {message && <Text style={styles.message}>{message}</Text>}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              {defaultButtons.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.button,
                    getButtonStyle(btn.style),
                    defaultButtons.length === 1 && { flex: 1 },
                  ]}
                  onPress={() => {
                    btn.onPress();
                    if (btn.style === 'cancel') onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, { color: getButtonTextColor(btn.style) }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Hook for easy usage ───
interface ModalState {
  visible: boolean;
  type: ModalType;
  title: string;
  message?: string;
  icon?: React.ReactNode;
  buttons?: ModalButton[];
  dismissable?: boolean;
}

const initialState: ModalState = {
  visible: false,
  type: 'info',
  title: '',
};

export function useModal() {
  const [state, setState] = React.useState<ModalState>(initialState);

  const show = useCallback((opts: Omit<ModalState, 'visible'>) => {
    setState({ ...opts, visible: true });
  }, []);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const confirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = 'OK',
      cancelText?: string,
    ) => {
      show({
        type: 'confirm',
        title,
        message,
        buttons: [
          { text: cancelText || 'İptal', onPress: () => hide(), style: 'cancel' },
          {
            text: confirmText,
            onPress: () => {
              hide();
              onConfirm();
            },
            style: 'primary',
          },
        ],
      });
    },
    [show, hide],
  );

  const info = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      show({
        type: 'info',
        title,
        message,
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              hide();
              onOk?.();
            },
            style: 'primary',
          },
        ],
      });
    },
    [show, hide],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      show({
        type: 'error',
        title,
        message,
        buttons: [{ text: 'OK', onPress: hide, style: 'primary' }],
      });
    },
    [show, hide],
  );

  const success = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      show({
        type: 'success',
        title,
        message,
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              hide();
              onOk?.();
            },
            style: 'primary',
          },
        ],
      });
    },
    [show, hide],
  );

  const premium = useCallback(
    (title: string, message: string, onUpgrade: () => void) => {
      show({
        type: 'premium',
        title,
        message,
        icon: <Crown size={32} color={MODAL_COLORS.gold} />,
        buttons: [
          { text: 'İptal', onPress: hide, style: 'cancel' },
          {
            text: 'Premium',
            onPress: () => {
              hide();
              onUpgrade();
            },
            style: 'primary',
          },
        ],
      });
    },
    [show, hide],
  );

  return {
    modalState: state,
    modalProps: {
      visible: state.visible,
      onClose: hide,
      type: state.type,
      title: state.title,
      message: state.message,
      icon: state.icon,
      buttons: state.buttons,
      dismissable: state.dismissable ?? true,
    } as CustomModalProps,
    show,
    hide,
    confirm,
    info,
    error,
    success,
    premium,
  };
}

export default React.memo(CustomModal);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: MODAL_COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: MODAL_COLORS.bg,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MODAL_COLORS.border,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    padding: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: MODAL_COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: MODAL_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
