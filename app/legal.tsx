/**
 * NEURALIS - Privacy Policy & Terms of Service
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';

type Tab = 'privacy' | 'terms';

/** Web URLs for store listing & external access */
const PRIVACY_URL = 'https://neuralis.app/privacy';
const TERMS_URL = 'https://neuralis.app/terms';

export default function LegalScreen() {
    const router = useRouter();
    const { tab } = useLocalSearchParams<{ tab?: string }>();
    const [activeTab, setActiveTab] = useState<Tab>(
        tab === 'terms' ? 'terms' : 'privacy'
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yasal</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
                    onPress={() => setActiveTab('privacy')}
                >
                    <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
                        Gizlilik Politikası
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
                    onPress={() => setActiveTab('terms')}
                >
                    <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
                        Kullanım Koşulları
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {activeTab === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}

                {/* External link for store reviewers */}
                <TouchableOpacity
                    style={styles.externalLink}
                    onPress={() => Linking.openURL(activeTab === 'privacy' ? PRIVACY_URL : TERMS_URL)}
                >
                    <ExternalLink size={14} color="#2ECC71" />
                    <Text style={styles.externalLinkText}>Tarayıcıda Aç</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Privacy Policy
// ─────────────────────────────────────────────────────────────────────────

function PrivacyPolicy() {
    return (
        <>
            <Text style={styles.title}>Gizlilik Politikası</Text>
            <Text style={styles.date}>Son güncelleme: 12 Şubat 2026</Text>

            <Section title="1. Toplanan Veriler">
                Neuralis, hizmetlerini sunabilmek için aşağıdaki verileri toplar:{'\n\n'}
                • <B>Hesap bilgileri:</B> E-posta adresi, kullanıcı adı, profil fotoğrafı{'\n'}
                • <B>Öğrenme verileri:</B> Ders ilerlemeleri, quiz sonuçları, çalışma süreleri{'\n'}
                • <B>Cihaz bilgileri:</B> İşletim sistemi, uygulama sürümü, dil tercihi{'\n'}
                • <B>Kullanım verileri:</B> Uygulama ile etkileşim istatistikleri
            </Section>

            <Section title="2. Verilerin Kullanımı">
                Toplanan veriler şu amaçlarla kullanılır:{'\n\n'}
                • Kişiselleştirilmiş öğrenme deneyimi sunmak{'\n'}
                • AI destekli zayıflık analizi ve öneriler oluşturmak{'\n'}
                • Uygulama performansını iyileştirmek{'\n'}
                • Güvenlik ve dolandırıcılık önleme{'\n'}
                • Yasal yükümlülüklere uymak
            </Section>

            <Section title="3. Veri Paylaşımı">
                Kişisel verileriniz üçüncü taraflarla <B>satılmaz</B>. Veriler yalnızca:{'\n\n'}
                • Hizmet sağlayıcılarla (Supabase altyapısı) işleme amacıyla{'\n'}
                • Yasal zorunluluk durumlarında yetkili makamlarla paylaşılır
            </Section>

            <Section title="4. Veri Güvenliği">
                Verileriniz endüstri standardı güvenlik önlemleriyle korunur:{'\n\n'}
                • Uçtan uca şifreleme (TLS 1.3){'\n'}
                • Kimlik bilgileri şifreli depolama (SecureStore){'\n'}
                • Row Level Security (RLS) ile veritabanı erişim kontrolü{'\n'}
                • Düzenli güvenlik denetimleri
            </Section>

            <Section title="5. Çocuk Gizliliği (COPPA)">
                Neuralis, 13 yaş altı kullanıcılardan bilerek kişisel veri toplamaz.
                Eğer 13 yaş altı bir kullanıcının veri paylaştığını öğrenirsek,
                bu verileri derhal sileriz.
            </Section>

            <Section title="6. Kullanıcı Hakları">
                Aşağıdaki haklara sahipsiniz:{'\n\n'}
                • Verilerinize erişim talep etme{'\n'}
                • Verilerinizin düzeltilmesini isteme{'\n'}
                • Hesabınızı ve tüm verilerinizi silme{'\n'}
                • Veri taşınabilirliği (dışa aktarma){'\n\n'}
                Bu hakları kullanmak için uygulama içi ayarlardan veya
                destek ekibimizle iletişime geçerek talep oluşturabilirsiniz.
            </Section>

            <Section title="7. İletişim">
                Gizlilik ile ilgili sorularınız için:{'\n'}
                📧 privacy@neuralis.app
            </Section>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Terms of Service
// ─────────────────────────────────────────────────────────────────────────

function TermsOfService() {
    return (
        <>
            <Text style={styles.title}>Kullanım Koşulları</Text>
            <Text style={styles.date}>Son güncelleme: 12 Şubat 2026</Text>

            <Section title="1. Kabul">
                Neuralis uygulamasını kullanarak bu Kullanım Koşullarını kabul etmiş
                olursunuz. Koşulları kabul etmiyorsanız uygulamayı kullanmayınız.
            </Section>

            <Section title="2. Hizmet Tanımı">
                Neuralis, yapay zeka destekli kişiselleştirilmiş bir öğrenme platformudur.
                Uygulama interaktif dersler, quiz'ler, ilerleme takibi ve sosyal
                öğrenme özellikleri sunar.
            </Section>

            <Section title="3. Hesap Sorumlulukları">
                • Hesap bilgilerinizin gizliliğinden siz sorumlusunuz{'\n'}
                • Hesabınızda gerçekleşen tüm aktivitelerden siz sorumlusunuz{'\n'}
                • Yetkisiz erişim durumunda derhal bizi bilgilendirmelisiniz{'\n'}
                • Her kullanıcı yalnızca bir hesap oluşturabilir
            </Section>

            <Section title="4. Premium Abonelik">
                • Premium özellikler aylık veya yıllık abonelikle sunulur{'\n'}
                • Abonelikler mevcut dönem sonunda otomatik yenilenir{'\n'}
                • İptal, yenileme tarihinden en az 24 saat önce yapılmalıdır{'\n'}
                • İadeler App Store / Google Play politikalarına tabidir{'\n'}
                • Ücretsiz deneme süresi içinde iptal edilirse ücret alınmaz
            </Section>

            <Section title="5. Kabul Edilebilir Kullanım">
                Aşağıdaki davranışlar yasaktır:{'\n\n'}
                • Uygulamayı yasadışı amaçlarla kullanmak{'\n'}
                • Diğer kullanıcılara zarar vermek, taciz veya spam{'\n'}
                • Sistem güvenliğini ihlal etmeye çalışmak{'\n'}
                • Uygulamayı tersine mühendislik yapmak{'\n'}
                • Sahte hesaplar oluşturmak veya bot kullanmak
            </Section>

            <Section title="6. Fikri Mülkiyet">
                Neuralis uygulamasının tüm içeriği, tasarımı ve kodu telif hakkı ile korunmaktadır.
                İçerik izinsiz kopyalanamaz, dağıtılamaz veya ticari amaçla kullanılamaz.
            </Section>

            <Section title="7. Sorumluluk Sınırlaması">
                Neuralis "olduğu gibi" sunulmaktadır. Hizmet kesintileri, veri kayıpları
                veya doğruluk hataları nedeniyle oluşabilecek doğrudan veya dolaylı
                zararlardan sorumlu değiliz. Uygulama eğitim amaçlıdır ve profesyonel
                tavsiye yerine geçmez.
            </Section>

            <Section title="8. Değişiklikler">
                Bu koşulları önceden bildirimde bulunarak değiştirme hakkını saklı tutarız.
                Değişiklikler uygulama içi bildirim ile duyurulacaktır.
            </Section>

            <Section title="9. İletişim">
                Sorularınız için:{'\n'}
                📧 support@neuralis.app
            </Section>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionBody}>{children}</Text>
        </View>
    );
}

function B({ children }: { children: React.ReactNode }) {
    return <Text style={styles.bold}>{children}</Text>;
}

// ─────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A1A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A2E',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A1A2E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#1A1A2E',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#2ECC71',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    date: {
        fontSize: 13,
        color: '#666',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2ECC71',
        marginBottom: 8,
    },
    sectionBody: {
        fontSize: 14,
        color: '#CCCCCC',
        lineHeight: 22,
    },
    bold: {
        fontWeight: '700',
        color: '#FFFFFF',
    },
    externalLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#1A1A2E',
    },
    externalLinkText: {
        color: '#2ECC71',
        fontSize: 13,
        fontWeight: '600',
    },
});
