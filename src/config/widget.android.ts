/**
 * NEURALIS - Android Widget Configuration
 * AppWidget Configuration for Home Screen Widget
 *
 * NOTE: This file defines the widget structure.
 * The actual Kotlin/Java implementation must be added to the Android native project.
 *
 * To implement:
 * 1. Create AppWidgetProvider in android/app/src/main/java
 * 2. Add widget layout XML
 * 3. Register in AndroidManifest.xml
 * 4. Use the Kotlin code below as reference
 */

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const ANDROID_WIDGET_CONFIG = {
  // Widget Provider Class
  providerClass: 'com.neuralis.app.widget.NeuralisWidgetProvider',

  // Widget Sizes
  sizes: {
    small: { minWidth: 110, minHeight: 110 },
    medium: { minWidth: 250, minHeight: 110 },
  },

  // Shared Preferences
  prefsName: 'NeuralisWidgetPrefs',

  // Data Keys
  dataKeys: {
    streakCount: 'streak_count',
    foxStatus: 'fox_status',
    countdownText: 'countdown_text',
    foxEmoji: 'fox_emoji',
    taskCompleted: 'task_completed',
    accentColor: 'accent_color',
    lastUpdated: 'last_updated',
  },

  // Update Interval
  updateIntervalMs: 60000, // 1 minute
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ANDROID MANIFEST ADDITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const ANDROID_MANIFEST_ADDITIONS = `
<!-- Add inside <application> tag in AndroidManifest.xml -->

<receiver
    android:name=".widget.NeuralisWidgetProvider"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/neuralis_widget_info" />
</receiver>
`;

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET INFO XML
// ═══════════════════════════════════════════════════════════════════════════

export const WIDGET_INFO_XML = `
<!-- res/xml/neuralis_widget_info.xml -->
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:targetCellWidth="2"
    android:targetCellHeight="2"
    android:updatePeriodMillis="60000"
    android:initialLayout="@layout/neuralis_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:previewImage="@drawable/widget_preview"
    android:description="@string/widget_description" />
`;

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET LAYOUT XML
// ═══════════════════════════════════════════════════════════════════════════

export const WIDGET_LAYOUT_XML = `
<!-- res/layout/neuralis_widget.xml -->
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:background="@drawable/widget_background"
    android:padding="12dp">

    <!-- Fox Emoji -->
    <TextView
        android:id="@+id/fox_emoji"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="🦊"
        android:textSize="40sp" />

    <!-- Streak Count -->
    <LinearLayout
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical"
        android:layout_marginTop="8dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="🔥"
            android:textSize="24sp" />

        <TextView
            android:id="@+id/streak_count"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="42"
            android:textSize="32sp"
            android:textColor="@color/accent_green"
            android:fontFamily="sans-serif-medium"
            android:layout_marginStart="4dp" />
    </LinearLayout>

    <!-- Countdown -->
    <TextView
        android:id="@+id/countdown_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="12:34:56"
        android:textSize="16sp"
        android:textColor="#CCCCCC"
        android:fontFamily="monospace"
        android:layout_marginTop="4dp" />

    <!-- Status -->
    <TextView
        android:id="@+id/status_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Shadow Fox Happy"
        android:textSize="10sp"
        android:textColor="#888888"
        android:layout_marginTop="4dp" />

</LinearLayout>
`;

// ═══════════════════════════════════════════════════════════════════════════
// KOTLIN WIDGET PROVIDER CODE REFERENCE
// ═══════════════════════════════════════════════════════════════════════════

export const KOTLIN_WIDGET_CODE = `
// NeuralisWidgetProvider.kt
// Add to: android/app/src/main/java/com/neuralis/app/widget/

package com.neuralis.app.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.widget.RemoteViews
import com.neuralis.app.R

class NeuralisWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "NeuralisWidgetPrefs"
        const val KEY_STREAK_COUNT = "streak_count"
        const val KEY_FOX_STATUS = "fox_status"
        const val KEY_COUNTDOWN_TEXT = "countdown_text"
        const val KEY_FOX_EMOJI = "fox_emoji"
        const val KEY_TASK_COMPLETED = "task_completed"
        const val KEY_ACCENT_COLOR = "accent_color"

        private val STATUS_COLORS = mapOf(
            "happy" to "#00FF88",
            "tense" to "#FFD700",
            "fading" to "#A020F0",
            "critical" to "#FF4444",
            "dead" to "#444444"
        )

        private val STATUS_EMOJIS = mapOf(
            "happy" to "🦊",
            "tense" to "🦊⚡",
            "fading" to "🦊💀",
            "critical" to "☠️🦊",
            "dead" to "💀"
        )
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        
        val streakCount = prefs.getInt(KEY_STREAK_COUNT, 0)
        val foxStatus = prefs.getString(KEY_FOX_STATUS, "happy") ?: "happy"
        val countdownText = prefs.getString(KEY_COUNTDOWN_TEXT, "--:--") ?: "--:--"
        val taskCompleted = prefs.getBoolean(KEY_TASK_COMPLETED, false)
        
        val foxEmoji = STATUS_EMOJIS[foxStatus] ?: "🦊"
        val accentColor = STATUS_COLORS[foxStatus] ?: "#00FF88"

        val views = RemoteViews(context.packageName, R.layout.neuralis_widget)
        
        // Update views
        views.setTextViewText(R.id.fox_emoji, foxEmoji)
        views.setTextViewText(R.id.streak_count, streakCount.toString())
        views.setTextViewText(R.id.countdown_text, if (taskCompleted) "✓" else countdownText)
        views.setTextViewText(R.id.status_text, getStatusText(foxStatus))
        
        // Set colors
        views.setTextColor(R.id.streak_count, Color.parseColor(accentColor))
        views.setTextColor(R.id.countdown_text, 
            if (taskCompleted) Color.parseColor("#00FF88") else Color.parseColor("#CCCCCC"))

        // Set click intent to open app
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = android.app.PendingIntent.getActivity(
            context, 0, intent, 
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun getStatusText(status: String): String {
        return when (status) {
            "happy" -> "Shadow Fox Happy"
            "tense" -> "Shadow Fox Tense"
            "fading" -> "Shadow Fox Fading"
            "critical" -> "CRITICAL STATE"
            "dead" -> "Streak Lost"
            else -> status
        }
    }

    override fun onEnabled(context: Context) {
        // Widget enabled for the first time
    }

    override fun onDisabled(context: Context) {
        // Last widget removed
    }
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET BACKGROUND DRAWABLE
// ═══════════════════════════════════════════════════════════════════════════

export const WIDGET_BACKGROUND_XML = `
<!-- res/drawable/widget_background.xml -->
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#0D0D0D" />
    <corners android:radius="16dp" />
    <stroke
        android:width="1dp"
        android:color="#333333" />
</shape>
`;

// ═══════════════════════════════════════════════════════════════════════════
// COLORS XML
// ═══════════════════════════════════════════════════════════════════════════

export const COLORS_XML = `
<!-- res/values/colors.xml additions -->
<color name="accent_green">#00FF88</color>
<color name="accent_yellow">#FFD700</color>
<color name="accent_purple">#A020F0</color>
<color name="accent_red">#FF4444</color>
<color name="widget_background">#0D0D0D</color>
`;

export default ANDROID_WIDGET_CONFIG;
