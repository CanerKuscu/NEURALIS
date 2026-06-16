/**
 * NEURALIS - Screen Time Self-Report Service
 * Voluntary self-report model for screen time awareness.
 *
 * WHY SELF-REPORT?
 * iOS Sandboxing and Screen Time API restrictions make it impossible
 * to monitor other apps in the background. Android UsageStatsManager
 * requires special permissions most users won't grant.
 *
 * Instead, we empower users to voluntarily check in about their
 * screen time and receive motivational nudges.
 */

import * as Notifications from './safeNotifications';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const BRAIN_ROT_THRESHOLD_MINUTES = 60;

// Motivational messages (shown after self-report)
const MOTIVATION_MESSAGES = [
  { level: 'good', emoji: '🌟', message: 'Harika! Ekran süren kontrol altında. Böyle devam!' },
  { level: 'good', emoji: '🦊', message: 'Shadow Fox senle gurur duyuyor! Beynini koruyor musun.' },
  {
    level: 'warning',
    emoji: '⚠️',
    message: 'Dikkat! Biraz fazla scroll yapmış olabilirsin. Bir mola ver?',
  },
  {
    level: 'warning',
    emoji: '🧠',
    message: 'Beynin seni uyarıyor: daha az scroll, daha çok öğren!',
  },
  {
    level: 'critical',
    emoji: '🔥',
    message: "Tehlike bölgesi! Ekran süren yüksek. Neuralis'e dön ve beynini besle!",
  },
  {
    level: 'critical',
    emoji: '💀',
    message: 'Beyin çürümesi riski! Her dakika öğrenmek için bir fırsat. Şimdi başla!',
  },
  {
    level: 'critical',
    emoji: '🚨',
    message: "Acil durum! Potansiyelini scrolling'e harcama. Büyüklük seni bekliyor!",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SelfReportEntry {
  appName: string;
  minutes: number;
  reportedAt: string;
}

export interface DailyCheckInData {
  date: string;
  totalReportedMinutes: number;
  entries: SelfReportEntry[];
  level: 'good' | 'warning' | 'critical';
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class DopamineMonitorService {
  private todayData: DailyCheckInData | null = null;
  private currentUserId: string | null = null;

  /**
   * Initialize with user ID (no background monitoring)
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    await this.loadTodayData();
  }

  /**
   * Kept for backward compatibility — does nothing now
   * (useNeuralisCore calls this, safe to no-op)
   */
  startMonitoring(_userId: string): void {
    this.currentUserId = _userId;
    console.log('[DopamineMonitor] Self-report mode active (no background monitoring)');
  }

  /**
   * Kept for backward compatibility — does nothing now
   */
  stopMonitoring(): void {
    console.log('[DopamineMonitor] Stopped');
  }

  /**
   * User voluntarily reports screen time usage
   */
  async selfReportUsage(
    appName: string,
    minutes: number,
  ): Promise<{
    message: string;
    emoji: string;
    level: 'good' | 'warning' | 'critical';
    totalMinutesToday: number;
  }> {
    if (!this.todayData) {
      await this.loadTodayData();
    }

    const entry: SelfReportEntry = {
      appName,
      minutes,
      reportedAt: new Date().toISOString(),
    };

    if (!this.todayData) {
      this.todayData = {
        date: this.getToday(),
        totalReportedMinutes: 0,
        entries: [],
        level: 'good',
      };
    }

    this.todayData.entries.push(entry);
    this.todayData.totalReportedMinutes += minutes;
    this.todayData.level = this.calculateLevel(this.todayData.totalReportedMinutes);

    // Save to Supabase
    await this.saveTodayData();

    // Get motivational message
    const msg = this.getMotivationMessage(this.todayData.level);

    return {
      message: msg.message,
      emoji: msg.emoji,
      level: this.todayData.level,
      totalMinutesToday: this.todayData.totalReportedMinutes,
    };
  }

  /**
   * Get a daily check-in reminder message
   */
  getDailyCheckInReminder(): { title: string; body: string } {
    return {
      title: '🦊 Günlük Check-in Zamanı!',
      body: "Bugün ne kadar scroll yaptın? Bildirmek için Neuralis'i aç!",
    };
  }

  /**
   * Get today's self-reported data
   */
  async getTodayData(): Promise<DailyCheckInData | null> {
    if (!this.todayData) {
      await this.loadTodayData();
    }
    return this.todayData;
  }

  /**
   * Get total brain rot minutes today
   */
  getBrainRotMinutesToday(): number {
    return this.todayData?.totalReportedMinutes || 0;
  }

  /**
   * Check if user should be warned
   */
  shouldWarn(): boolean {
    return (this.todayData?.totalReportedMinutes || 0) >= BRAIN_ROT_THRESHOLD_MINUTES * 0.8;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  private calculateLevel(totalMinutes: number): 'good' | 'warning' | 'critical' {
    if (totalMinutes >= BRAIN_ROT_THRESHOLD_MINUTES) return 'critical';
    if (totalMinutes >= BRAIN_ROT_THRESHOLD_MINUTES * 0.5) return 'warning';
    return 'good';
  }

  private getMotivationMessage(level: string) {
    const options = MOTIVATION_MESSAGES.filter((m) => m.level === level);
    return options[Math.floor(Math.random() * options.length)] || MOTIVATION_MESSAGES[0];
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async loadTodayData(): Promise<void> {
    if (!this.currentUserId) return;
    const today = this.getToday();

    try {
      const { data } = await supabase
        .from('screen_time_reports')
        .select('*')
        .eq('user_id', this.currentUserId)
        .eq('date', today)
        .maybeSingle();

      if (data) {
        this.todayData = {
          date: data.date,
          totalReportedMinutes: data.total_minutes || 0,
          entries: data.entries || [],
          level: this.calculateLevel(data.total_minutes || 0),
        };
      } else {
        this.todayData = {
          date: today,
          totalReportedMinutes: 0,
          entries: [],
          level: 'good',
        };
      }
    } catch {
      // Table may not exist yet — start fresh
      this.todayData = {
        date: today,
        totalReportedMinutes: 0,
        entries: [],
        level: 'good',
      };
    }
  }

  private async saveTodayData(): Promise<void> {
    if (!this.currentUserId || !this.todayData) return;

    try {
      await supabase.from('screen_time_reports').upsert(
        {
          user_id: this.currentUserId,
          date: this.todayData.date,
          total_minutes: this.todayData.totalReportedMinutes,
          entries: this.todayData.entries,
          level: this.todayData.level,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' },
      );
    } catch (err) {
      console.warn('[DopamineMonitor] Failed to save report:', err);
    }
  }

  /**
   * Schedule a daily check-in notification
   */
  async scheduleDailyCheckIn(): Promise<void> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      const reminder = this.getDailyCheckInReminder();

      // CALENDAR trigger is NOT supported on Android; use DAILY instead
      const trigger =
        Platform.OS === 'android'
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: 20, // 8 PM daily
              minute: 0,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour: 20, // 8 PM daily
              minute: 0,
              repeats: true,
            };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: 'default',
        },
        trigger,
      });
    } catch (err) {
      console.warn('[DopamineMonitor] Failed to schedule check-in:', err);
    }
  }
}

export const dopamineMonitorService = new DopamineMonitorService();
export default dopamineMonitorService;
