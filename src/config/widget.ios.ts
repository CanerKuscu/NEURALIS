/**
 * NEURALIS - iOS Widget Configuration
 * WidgetKit Configuration for Home Screen Widget
 * 
 * NOTE: This file defines the widget structure.
 * The actual Swift implementation must be added to the iOS native project.
 * 
 * To implement:
 * 1. Create a Widget Extension in Xcode
 * 2. Add App Group for data sharing
 * 3. Use the Swift code below as reference
 */

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const IOS_WIDGET_CONFIG = {
    // Widget Extension Name
    extensionName: 'NeuralisWidget',

    // App Group Identifier (for sharing data between app and widget)
    appGroupId: 'group.com.neuralis.app',

    // Widget Kinds
    kinds: {
        small: 'NeuralisWidgetSmall',
        medium: 'NeuralisWidgetMedium',
    },

    // Data Keys (stored in UserDefaults via App Group)
    dataKeys: {
        streakCount: 'streak_count',
        foxStatus: 'fox_status',
        countdownSeconds: 'countdown_seconds',
        taskCompleted: 'task_completed',
        accentColor: 'accent_color',
        locale: 'locale',
    },

    // Refresh Timeline
    refreshInterval: 15, // minutes
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SWIFT WIDGET CODE REFERENCE
// ═══════════════════════════════════════════════════════════════════════════

export const SWIFT_WIDGET_CODE = `
// NeuralisWidget.swift
// Add this to your iOS Widget Extension

import WidgetKit
import SwiftUI

// MARK: - Data Model
struct NeuralisEntry: TimelineEntry {
    let date: Date
    let streakCount: Int
    let foxStatus: String
    let countdownText: String
    let foxEmoji: String
    let accentColor: Color
    let taskCompleted: Bool
}

// MARK: - Provider
struct NeuralisProvider: TimelineProvider {
    let appGroupId = "group.com.neuralis.app"
    
    func placeholder(in context: Context) -> NeuralisEntry {
        NeuralisEntry(
            date: Date(),
            streakCount: 42,
            foxStatus: "happy",
            countdownText: "12:34:56",
            foxEmoji: "🦊",
            accentColor: .green,
            taskCompleted: false
        )
    }
    
    func getSnapshot(in context: Context, completion: @escaping (NeuralisEntry) -> Void) {
        completion(getEntry())
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<NeuralisEntry>) -> Void) {
        let entry = getEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func getEntry() -> NeuralisEntry {
        let defaults = UserDefaults(suiteName: appGroupId)
        
        let streakCount = defaults?.integer(forKey: "streak_count") ?? 0
        let foxStatus = defaults?.string(forKey: "fox_status") ?? "happy"
        let countdownText = defaults?.string(forKey: "countdown_text") ?? "--:--"
        let foxEmoji = defaults?.string(forKey: "fox_emoji") ?? "🦊"
        let taskCompleted = defaults?.bool(forKey: "task_completed") ?? false
        let accentHex = defaults?.string(forKey: "accent_color") ?? "#00FF88"
        
        return NeuralisEntry(
            date: Date(),
            streakCount: streakCount,
            foxStatus: foxStatus,
            countdownText: countdownText,
            foxEmoji: foxEmoji,
            accentColor: Color(hex: accentHex),
            taskCompleted: taskCompleted
        )
    }
}

// MARK: - Small Widget View
struct NeuralisWidgetSmallView: View {
    let entry: NeuralisEntry
    
    var body: some View {
        ZStack {
            Color.black
            
            VStack(spacing: 8) {
                // Fox Emoji
                Text(entry.foxEmoji)
                    .font(.system(size: 40))
                
                // Streak Count
                HStack(spacing: 4) {
                    Text("🔥")
                    Text("\\(entry.streakCount)")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(entry.accentColor)
                }
                
                // Countdown
                Text(entry.countdownText)
                    .font(.system(size: 16, weight: .medium, design: .monospaced))
                    .foregroundColor(entry.taskCompleted ? .green : entry.accentColor)
            }
        }
    }
}

// MARK: - Medium Widget View
struct NeuralisWidgetMediumView: View {
    let entry: NeuralisEntry
    
    var body: some View {
        ZStack {
            Color.black
            
            HStack(spacing: 20) {
                // Left: Fox
                VStack {
                    Text(entry.foxEmoji)
                        .font(.system(size: 50))
                    Text(localizedStatus(entry.foxStatus))
                        .font(.caption)
                        .foregroundColor(entry.accentColor)
                }
                
                // Divider
                Rectangle()
                    .fill(entry.accentColor.opacity(0.3))
                    .frame(width: 1)
                
                // Right: Stats
                VStack(alignment: .leading, spacing: 8) {
                    // Streak
                    HStack {
                        Text("🔥")
                        Text("\\(entry.streakCount) days")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(entry.accentColor)
                    }
                    
                    // Countdown
                    HStack {
                        Text("⏱️")
                        Text(entry.countdownText)
                            .font(.system(size: 18, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    // Task Status
                    Text(entry.taskCompleted ? "✓ Complete" : "⚡ Task Pending")
                        .font(.caption)
                        .foregroundColor(entry.taskCompleted ? .green : .orange)
                }
            }
            .padding()
        }
    }
    
    private func localizedStatus(_ status: String) -> String {
        switch status {
        case "happy": return "Shadow Fox Happy"
        case "tense": return "Shadow Fox Tense"
        case "fading": return "Shadow Fox Fading"
        case "critical": return "CRITICAL"
        case "dead": return "Streak Lost"
        default: return status
        }
    }
}

// MARK: - Widget Configuration
@main
struct NeuralisWidget: Widget {
    let kind: String = "NeuralisWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NeuralisProvider()) { entry in
            if #available(iOS 17.0, *) {
                NeuralisWidgetSmallView(entry: entry)
                    .containerBackground(.black, for: .widget)
            } else {
                NeuralisWidgetSmallView(entry: entry)
                    .background(Color.black)
            }
        }
        .configurationDisplayName("Neuralis Streak")
        .description("Track your Shadow Fox and streak status")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}
`;

export default IOS_WIDGET_CONFIG;
