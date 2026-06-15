# Mağaza Görselleri Rehberi (Store Screenshots)

## Gerekli Ekran Görüntüleri

### iOS — App Store Connect
| Cihaz             | Çözünürlük       | Min | Maks |
|--------------------|------------------|-----|------|
| iPhone 6.7"        | 1290 × 2796 px   | 3   | 10   |
| iPhone 6.5"        | 1284 × 2778 px   | 3   | 10   |
| iPad Pro 12.9" (*)  | 2048 × 2732 px   | 3   | 10   |

> (*) iPad zorunlu değil ama `supportsTablet: true` varsa önerilir.

### Android — Google Play Console
| Tür                | Çözünürlük        | Min | Maks |
|---------------------|-------------------|-----|------|
| Telefon             | 1080 × 1920+ px  | 2   | 8    |
| 7" Tablet (*)       | 1200 × 1920 px   | —   | 8    |
| 10" Tablet (*)      | 1600 × 2560 px   | —   | 8    |

---

## Önerilen Ekranlar (6 adet)

1. **Ana Sayfa / Dashboard** — Streak, XP, günlük hedef
2. **Ders Ekranı** — Aktif bir quiz sorusu
3. **Brain Map / İlerleme** — Nöral harita veya istatistikler
4. **Liderlik Tablosu** — Liga sıralaması
5. **AI Chat / Asistan** — AI ile etkileşim
6. **Premium / Mağaza** — Premium özellikler

---

## Ekran Görüntüsü Alma

### Yöntem 1: Expo ile Simülatörde

```bash
# iOS Simulator (macOS)
npx expo run:ios
# Cmd + S → Masaüstüne kaydeder

# Android Emulator
npx expo run:android
# Emulator toolbar → 📷 butonu
```

### Yöntem 2: Gerçek Cihaz

```bash
# iPhone: Güç + Ses Açma tuşu
# Android: Güç + Ses Kısma tuşu
```

### Yöntem 3: Fastlane ile Otomatik (İleri Seviye)

```bash
# iOS
fastlane snapshot

# Android
fastlane screengrab
```

---

## Ek Gerekli Görseller

### App Store
- **App Icon**: 1024 × 1024 px (alfa kanalsız, köşeler yuvarlak yapılmaz)
- **Feature Graphic**: Yok (App Store bunu istemez)

### Google Play
- **App Icon**: 512 × 512 px (32-bit PNG, alfa kanalsız)
- **Feature Graphic**: 1024 × 500 px (zorunlu)
- **Promo Video**: YouTube linki (opsiyonel ama önerilir)

---

## İpuçları

- Durum çubuğundaki saat, pil vb. temiz olsun (simülatörde otomatik)
- Karanlık tema ekran görüntüleri için `userInterfaceStyle: "dark"` zaten aktif
- Her ekran görüntüsüne kısa bir açıklama metni (caption) ekleyin
- Görselleri Figma, Canva veya [Screenshots Pro](https://screenshots.pro) ile çerçeve içine alabilirsiniz
- PNG formatı tercih edin (JPEG'den daha net)

---

## Dosya Yapısı Önerisi

```
store-assets/
├── ios/
│   ├── 6.7-inch/
│   │   ├── 01-dashboard.png
│   │   ├── 02-lesson.png
│   │   └── ...
│   └── 6.5-inch/
├── android/
│   ├── phone/
│   └── tablet/
├── feature-graphic.png
└── promo-banner.png
```
