/**
 * DailyCardService — Günlük Bilgi Kartı
 *
 * Her gün kullanıcıya 1 bilgi kartı gösterir.
 * Push notification ile hatırlatma yapar.
 * Kart kategorileri: Bilim, Tarih, Dil, Matematik, Genel Kültür
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DailyCard {
  id: string;
  /** Başlık */
  title: string;
  /** Ana bilgi/içerik */
  content: string;
  /** Kategori */
  category: DailyCardCategory;
  /** Ek detay bilgi */
  detail?: string;
  /** Fun fact */
  funFact?: string;
  /** Emoji ikonu */
  emoji: string;
  /** İlgili konu */
  relatedTopic?: string;
  /** Kaynak */
  source?: string;
  /** Tarih */
  date: string;
  /** Okundu mu */
  isRead: boolean;
  /** Favorilere eklendi mi */
  isFavorite: boolean;
}

export type DailyCardCategory =
  | 'science'
  | 'history'
  | 'language'
  | 'math'
  | 'culture'
  | 'technology'
  | 'nature'
  | 'space';

export const CARD_CATEGORIES: {
  key: DailyCardCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: 'science', label: 'Bilim', emoji: '🔬', color: '#3498DB' },
  { key: 'history', label: 'Tarih', emoji: '📜', color: '#E67E22' },
  { key: 'language', label: 'Dil', emoji: '📝', color: '#2ECC71' },
  { key: 'math', label: 'Matematik', emoji: '🔢', color: '#9B59B6' },
  { key: 'culture', label: 'Genel Kültür', emoji: '🌍', color: '#1ABC9C' },
  { key: 'technology', label: 'Teknoloji', emoji: '💻', color: '#34495E' },
  { key: 'nature', label: 'Doğa', emoji: '🌿', color: '#27AE60' },
  { key: 'space', label: 'Uzay', emoji: '🚀', color: '#2C3E50' },
];

// ═══════════════════════════════════════════════════════════════════════════
// BUILT-IN CARDS DATABASE (Turkish)
// ═══════════════════════════════════════════════════════════════════════════

const CARD_DATABASE: Omit<DailyCard, 'id' | 'date' | 'isRead' | 'isFavorite'>[] = [
  {
    title: 'Işık Hızı',
    content:
      'Işık saniyede yaklaşık 300.000 km hızla yol alır. Bu, bir saniyede dünyayı 7.5 kez dolaşabilecek hızdır.',
    category: 'science',
    emoji: '⚡',
    funFact: "Güneş ışığı Dünya'ya 8 dakika 20 saniyede ulaşır.",
    detail: 'Evrendeki en hızlı şey ışıktır ve hiçbir madde bu hıza ulaşamaz.',
  },
  {
    title: 'Pi Sayısı',
    content:
      'Pi (π) sayısı, bir çemberin çevresinin çapına oranıdır ve yaklaşık 3.14159 değerindedir. İrrasyonel bir sayıdır.',
    category: 'math',
    emoji: '🥧',
    funFact: '14 Mart (3/14) Pi Günü olarak kutlanır.',
    detail: 'Pi sayısının tam değeri sonsuza kadar devam eder ve hiçbir düzeni yoktur.',
  },
  {
    title: "İstanbul'un Fethi",
    content:
      "1453 yılında Fatih Sultan Mehmet, İstanbul'u fethederek Bizans İmparatorluğu'na son verdi.",
    category: 'history',
    emoji: '🏰',
    funFact: 'Mehmet II fetih sırasında sadece 21 yaşındaydı.',
    detail: 'Gemilerin karadan yürütülmesi tarihin en büyük askeri deha örneklerinden biridir.',
  },
  {
    title: 'DNA Çift Sarmal',
    content:
      "DNA molekülü çift sarmal yapısındadır. Watson ve Crick 1953'te bu yapıyı keşfettiler.",
    category: 'science',
    emoji: '🧬',
    funFact: "İnsan DNA'sının %99.9'u diğer tüm insanlarla aynıdır.",
    detail: "Bir hücredeki tüm DNA'yı uzatsanız yaklaşık 2 metre uzunluğunda olurdu.",
  },
  {
    title: 'Altın Oran',
    content:
      'Altın oran (φ = 1.618...) doğada, sanatta ve mimaride sıkça karşılaşılan matematiksel bir orandır.',
    category: 'math',
    emoji: '🌻',
    funFact: 'Ayçiçeği tohumları altın orana göre dizilir.',
    detail: 'Fibonacci dizisinde ardışık sayıların oranı altın orana yakınsar.',
  },
  {
    title: "Türkçe'nin Kökeni",
    content:
      'Türkçe, Altay dil ailesine ait Oğuz grubundan bir dildir. 8000 yıldan fazla tarihi vardır.',
    category: 'language',
    emoji: '📖',
    funFact: 'Türkçe dünyada en çok konuşulan 20 dilden biridir.',
    detail: "Orhun Yazıtları (8. yüzyıl) Türkçe'nin bilinen en eski yazılı eserleridir.",
  },
  {
    title: 'Kara Delikler',
    content:
      'Kara delikler, ışığın bile kaçamayacağı kadar güçlü çekim alanına sahip kozmik nesnelerdir.',
    category: 'space',
    emoji: '🕳️',
    funFact: "En yakın kara delik Dünya'dan 1.560 ışık yılı uzaktadır.",
    detail:
      "Samanyolu'nun merkezinde 4 milyon güneş kütlesinde bir süperkütleli kara delik vardır.",
  },
  {
    title: 'Fotosentez',
    content: 'Bitkiler güneş ışığını kullanarak CO2 ve suyu glikoz ve oksijene dönüştürür.',
    category: 'nature',
    emoji: '🌱',
    funFact: "Dünyadaki oksijenin %50-80'i okyanus fitoplanktonları tarafından üretilir.",
    detail: '6CO2 + 6H2O + ışık → C6H12O6 + 6O2',
  },
  {
    title: 'Yapay Zeka',
    content: 'Yapay zeka, makinelerin insan benzeri öğrenme ve karar verme yeteneği kazanmasıdır.',
    category: 'technology',
    emoji: '🤖',
    funFact: "İlk yapay zeka programı 1956'da yazıldı.",
    detail:
      "Derin öğrenme, YZ'nin en güçlü alt dallarından biridir ve sinir ağı mimarisini kullanır.",
  },
  {
    title: 'Roma İmparatorluğu',
    content:
      "Roma İmparatorluğu MÖ 27'den MS 476'ya kadar sürdü ve Batı medeniyetinin temelini attı.",
    category: 'history',
    emoji: '🏛️',
    funFact: "Roma'nın toplam nüfusu zirve noktasında 56 milyon civarındaydı.",
    detail: 'Roma hukuku, yolları ve mühendisliği modern dünyayı hâlâ etkiler.',
  },
  {
    title: 'Görelilik Teorisi',
    content: "Einstein'ın E=mc² formülü, kütle ve enerjinin birbirine dönüşebileceğini gösterir.",
    category: 'science',
    emoji: '🌌',
    funFact: 'GPS uyduları görelilik düzeltmesi olmadan günde 10 km hata yapardı.',
    detail: 'Zaman, hız arttıkça yavaşlar (zaman genişlemesi).',
  },
  {
    title: 'Amazon Yağmur Ormanı',
    content:
      "Amazon, dünyanın en büyük tropikal yağmur ormanıdır ve Dünya'daki oksijenin %6'sını üretir.",
    category: 'nature',
    emoji: '🌳',
    funFact: "Amazon'da yaklaşık 390 milyar ağaç vardır.",
    detail: '2.5 milyon böcek türü, 40.000 bitki türü ve 1.300 kuş türü barındırır.',
  },
  {
    title: 'Blockchain',
    content:
      'Blockchain, merkezi olmayan, dağıtık ve değiştirilemez bir dijital defter teknolojisidir.',
    category: 'technology',
    emoji: '⛓️',
    funFact: "İlk Bitcoin bloğu 3 Ocak 2009'da oluşturuldu.",
    detail:
      'Blockchain sadece kripto para değil, tedarik zinciri ve oy verme sistemlerinde de kullanılır.',
  },
  {
    title: 'Osmanlı Mimarisi',
    content: "Mimar Sinan, 400'den fazla eser tasarladı. Süleymaniye Camii başyapıtı kabul edilir.",
    category: 'culture',
    emoji: '🕌',
    funFact: 'Sinan 50 yaşında baş mimar oldu ve 98 yaşına kadar çalıştı.',
    detail: 'Selimiye Camii, Sinan\'ın "ustalık eseri" olarak tanıttığı yapıdır.',
  },
  {
    title: 'Kuantum Dolanıklık',
    content: 'İki kuantum parçacığı, mesafe fark etmeksizin birbirini anında etkileyebilir.',
    category: 'science',
    emoji: '🔮',
    funFact: 'Einstein buna "uzaktaki ürkütücü etki" demişti.',
    detail:
      'Kuantum bilgisayarlar bu prensibi kullanarak klasik bilgisayarlardan katlanarak hızlı çalışır.',
  },
  {
    title: 'Sıfırın İcadı',
    content:
      "Sıfır kavramı ilk olarak Hintli matematikçi Brahmagupta tarafından 628'de tanımlandı.",
    category: 'math',
    emoji: '0️⃣',
    funFact: 'Romalılar sıfır kavramına sahip değildi.',
    detail: 'Sıfır, modern matematik ve bilgisayar biliminin temelidir (binary: 0 ve 1).',
  },
  {
    title: 'Mars Gezegeni',
    content:
      'Mars, Güneş Sistemi\'nin 4. gezegenidir. "Kızıl Gezegen" demir oksit (pas) nedeniyle kırmızıdır.',
    category: 'space',
    emoji: '🔴',
    funFact: "Mars'ta Olympus Mons, güneş sistemindeki en büyük yanardağdır (21.9 km).",
    detail: "NASA'nın Perseverance rover'ı Mars'ta yaşam izleri arıyor.",
  },
  {
    title: 'Etimoloji',
    content:
      '"Robot" kelimesi Çekçe "robota" (zorunlu iş) kelimesinden gelir. İlk kez 1920\'de kullanıldı.',
    category: 'language',
    emoji: '📚',
    funFact: '"Kahve" kelimesi Arapça "qahwah" dan Türkçe\'ye, oradan tüm dünyaya yayıldı.',
    detail:
      'Her kelimenin bir hikayesi vardır. Etimoloji, kelimelerin kökenini inceleyen bilim dalıdır.',
  },
  {
    title: 'İnsan Beyni',
    content: 'İnsan beyni yaklaşık 86 milyar nöron içerir ve günde 70.000 düşünce üretir.',
    category: 'science',
    emoji: '🧠',
    funFact: "Beyin vücudun %2'si ağırlığında ama enerjinin %20'sini kullanır.",
    detail: "Beyin sinyal hızı saatte 432 km'ye ulaşabilir.",
  },
  {
    title: 'Fibonacci Dizisi',
    content: 'Her sayı kendinden önceki iki sayının toplamıdır: 0, 1, 1, 2, 3, 5, 8, 13, 21...',
    category: 'math',
    emoji: '🐚',
    funFact: 'Fibonacci dizisi tavşan üremesini modellemek için oluşturuldu.',
    detail:
      'Doğada yaprakların dizilimi, deniz kabuklarının spirali Fibonacci dizisini takip eder.',
  },
];

const STORAGE_KEY_CARDS = '@neuralis_daily_cards';
const STORAGE_KEY_HISTORY = '@neuralis_daily_card_history';
const STORAGE_KEY_FAVORITES = '@neuralis_daily_card_favorites';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class DailyCardService {
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /** Bugünün kartını al */
  async getTodayCard(): Promise<DailyCard> {
    const today = this.getToday();

    // Bugün zaten bir kart var mı?
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CARDS);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.date === today) return stored.card;
      }
    } catch {}

    // Geçmiş kartları al (tekrar göstermemek için)
    const history = await this.getHistory();
    const usedIds = new Set(history.map((h) => h.title));

    // Kullanılmamış kart seç
    let pool = CARD_DATABASE.filter((c) => !usedIds.has(c.title));
    if (pool.length === 0) pool = CARD_DATABASE; // Hepsi gösterildi, baştan başla

    const selected = pool[Math.floor(Math.random() * pool.length)];
    const favorites = await this.getFavorites();

    const card: DailyCard = {
      ...selected,
      id: `dc_${today}`,
      date: today,
      isRead: false,
      isFavorite: favorites.includes(`dc_${today}`),
    };

    await AsyncStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify({ date: today, card }));
    return card;
  }

  /** Kartı okundu olarak işaretle */
  async markAsRead(): Promise<void> {
    const today = this.getToday();
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CARDS);
      if (raw) {
        const stored = JSON.parse(raw);
        stored.card.isRead = true;
        await AsyncStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(stored));

        // Geçmişe ekle
        const history = await this.getHistory();
        history.push(stored.card);
        await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(-60))); // Son 60 gün
      }
    } catch {}
  }

  /** Favorilere ekle/çıkar */
  async toggleFavorite(cardId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    const idx = favorites.indexOf(cardId);
    if (idx >= 0) {
      favorites.splice(idx, 1);
    } else {
      favorites.push(cardId);
    }
    await AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
    return idx < 0; // true = eklendi, false = çıkarıldı
  }

  /** Favori kartları al */
  async getFavorites(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_FAVORITES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Geçmiş kartları al */
  async getHistory(): Promise<DailyCard[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Notification kartı içeriği */
  async getNotificationContent(): Promise<{ title: string; body: string }> {
    const card = await this.getTodayCard();
    return {
      title: `📚 ${card.title}`,
      body: card.content.slice(0, 100) + (card.content.length > 100 ? '...' : ''),
    };
  }
}

export const dailyCardService = new DailyCardService();
export default dailyCardService;
