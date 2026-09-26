import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type UILanguage =
  | 'English'
  | 'Hindi'
  | 'Spanish'
  | 'Portuguese'
  | 'French'
  | 'German'
  | 'Japanese'
  | 'Korean'
  | 'Arabic';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
];

export interface LanguageConfig {
  code: UILanguage;
  label: string;
  native: string;
  flag: string;
}

export const SUPPORTED_UI_LANGUAGES: LanguageConfig[] = [
  { code: 'English', label: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'Hindi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'Spanish', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'Portuguese', label: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'French', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'German', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'Japanese', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'Korean', label: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'Arabic', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
];

// UI Translation Dictionary for core headers, CTAs, and labels
const UI_TRANSLATIONS: Record<UILanguage, Record<string, string>> = {
  English: {
    heroTitle: 'Create Better Content. Faster. With AI.',
    heroSubtitle: 'Turn one idea into scripts, scenes, SEO, thumbnails, and complete content calendars in minutes.',
    startFree: 'Start Creating Free',
    viewPricing: 'View Pricing & Plans',
    watchDemo: 'Watch Demo / Interactive Preview',
    agentHome: 'CreatorNova AI Agent',
    agentSubtitle: 'Tell CreatorNova what you want to create.',
    askNova: 'Ask CreatorNova',
    voiceCommand: 'Voice Command',
    brandKit: 'Use My Brand Kit',
    contentCalendar: 'Content Calendar',
    seriesCreator: 'Series Creator',
    characterLibrary: 'Character Library',
    repurposeAI: 'Repurpose With AI',
    comparePlans: 'Compare Plans',
    mostPopular: 'Most Popular',
    bestValue: 'Best Value',
    perMonth: '/month',
    perYear: '/year',
    monthlyBilling: 'Monthly',
    yearlyBilling: 'Yearly',
    creditsRemaining: 'Credits Remaining',
    confirmGen: 'Confirm Generation',
    estimatedCredits: 'Estimated Credits',
  },
  Hindi: {
    heroTitle: 'बेहतर कंटेंट बनाएं। तेज़ी से। AI के साथ।',
    heroSubtitle: 'एक ही आइडिया से स्क्रिप्ट, सीन्स, एसईओ, थंबनेल और पूरा कंटेंट कैलेंडर मिनटों में तैयार करें।',
    startFree: 'मुफ़्त में शुरू करें',
    viewPricing: 'प्लान और कीमतें देखें',
    watchDemo: 'डेमो / पूर्वावलोकन देखें',
    agentHome: 'क्रिएटरनोवा AI एजेंट',
    agentSubtitle: 'क्रिएटरनोवा को बताएं कि आप क्या बनाना चाहते हैं।',
    askNova: 'क्रिएटरनोवा से पूछें',
    voiceCommand: 'आवाज से कमांड दें',
    brandKit: 'मेरा ब्रांड किट इस्तेमाल करें',
    contentCalendar: 'कंटेंट कैलेंडर',
    seriesCreator: 'सीरीज़ क्रिएटर',
    characterLibrary: 'कैरेक्टर लाइब्रेरी',
    repurposeAI: 'AI से दोबारा उपयोग करें',
    comparePlans: 'प्लान्स की तुलना करें',
    mostPopular: 'सबसे लोकप्रिय',
    bestValue: 'सर्वश्रेष्ठ मूल्य',
    perMonth: '/महीना',
    perYear: '/साल',
    monthlyBilling: 'मासिक',
    yearlyBilling: 'वार्षिक',
    creditsRemaining: 'शेष क्रेडिट्स',
    confirmGen: 'जेनरेशन की पुष्टि करें',
    estimatedCredits: 'अनुमानित क्रेडिट्स',
  },
  Spanish: {
    heroTitle: 'Crea mejor contenido. Más rápido. Con IA.',
    heroSubtitle: 'Convierte una idea en guiones, escenas, SEO, miniaturas y calendarios completos en minutos.',
    startFree: 'Empezar Gratis',
    viewPricing: 'Ver Planes y Precios',
    watchDemo: 'Ver Demo Interactiva',
    agentHome: 'Agente IA CreatorNova',
    agentSubtitle: 'Dile a CreatorNova qué deseas crear.',
    askNova: 'Preguntar a CreatorNova',
    voiceCommand: 'Comando de Voz',
    brandKit: 'Usar Mi Brand Kit',
    contentCalendar: 'Calendario de Contenido',
    seriesCreator: 'Creador de Series',
    characterLibrary: 'Biblioteca de Personajes',
    repurposeAI: 'Reutilizar con IA',
    comparePlans: 'Comparar Planes',
    mostPopular: 'Más Popular',
    bestValue: 'Mejor Valor',
    perMonth: '/mes',
    perYear: '/año',
    monthlyBilling: 'Mensual',
    yearlyBilling: 'Anual',
    creditsRemaining: 'Créditos Restantes',
    confirmGen: 'Confirmar Generación',
    estimatedCredits: 'Créditos Estimados',
  },
  Portuguese: {
    heroTitle: 'Crie Conteúdo Melhor. Mais Rápido. Com IA.',
    heroSubtitle: 'Transforme uma ideia em roteiros, cenas, SEO, miniaturas e calendários em minutos.',
    startFree: 'Comece Grátis',
    viewPricing: 'Ver Planos e Preços',
    watchDemo: 'Ver Demonstração',
    agentHome: 'Agente IA CreatorNova',
    agentSubtitle: 'Diga ao CreatorNova o que você deseja criar.',
    askNova: 'Perguntar ao CreatorNova',
    voiceCommand: 'Comando de Voz',
    brandKit: 'Usar Meu Brand Kit',
    contentCalendar: 'Calendário de Conteúdo',
    seriesCreator: 'Criador de Séries',
    characterLibrary: 'Biblioteca de Personagens',
    repurposeAI: 'Adaptar com IA',
    comparePlans: 'Comparar Planos',
    mostPopular: 'Mais Popular',
    bestValue: 'Melhor Custo-Benefício',
    perMonth: '/mês',
    perYear: '/ano',
    monthlyBilling: 'Mensal',
    yearlyBilling: 'Anual',
    creditsRemaining: 'Créditos Restantes',
    confirmGen: 'Confirmar Geração',
    estimatedCredits: 'Créditos Estimados',
  },
  French: {
    heroTitle: 'Créez un meilleur contenu. Plus vite. Avec l’IA.',
    heroSubtitle: 'Transformez une idée en scripts, scènes, SEO, miniatures et calendrier complet en minutes.',
    startFree: 'Commencer Gratuitement',
    viewPricing: 'Voir les Tarifs',
    watchDemo: 'Voir la Démo',
    agentHome: 'Agent IA CreatorNova',
    agentSubtitle: 'Dites à CreatorNova ce que vous voulez créer.',
    askNova: 'Demander à CreatorNova',
    voiceCommand: 'Commande Vocale',
    brandKit: 'Utiliser Mon Brand Kit',
    contentCalendar: 'Calendrier de Contenu',
    seriesCreator: 'Créateur de Séries',
    characterLibrary: 'Bibliothèque de Personnages',
    repurposeAI: 'Adapter avec l’IA',
    comparePlans: 'Comparer les Offres',
    mostPopular: 'Le Plus Populaire',
    bestValue: 'Meilleure Offre',
    perMonth: '/mois',
    perYear: '/an',
    monthlyBilling: 'Mensuel',
    yearlyBilling: 'Annuel',
    creditsRemaining: 'Crédits Restants',
    confirmGen: 'Confirmer la Génération',
    estimatedCredits: 'Crédits Estimés',
  },
  German: {
    heroTitle: 'Besseren Content erstellen. Schneller. Mit KI.',
    heroSubtitle: 'Verwandeln Sie eine Idee in Skripte, Szenen, SEO, Thumbnails und Redaktionspläne in Minuten.',
    startFree: 'Kostenlos starten',
    viewPricing: 'Preise & Tarife',
    watchDemo: 'Demo ansehen',
    agentHome: 'CreatorNova KI-Agent',
    agentSubtitle: 'Sagen Sie CreatorNova, was Sie erstellen möchten.',
    askNova: 'CreatorNova fragen',
    voiceCommand: 'Sprachbefehl',
    brandKit: 'Mein Brand Kit nutzen',
    contentCalendar: 'Content-Kalender',
    seriesCreator: 'Serien-Ersteller',
    characterLibrary: 'Charakter-Bibliothek',
    repurposeAI: 'Mit KI umwidmen',
    comparePlans: 'Tarife vergleichen',
    mostPopular: 'Am beliebtesten',
    bestValue: 'Bester Wert',
    perMonth: '/Monat',
    perYear: '/Jahr',
    monthlyBilling: 'Monatlich',
    yearlyBilling: 'Jährlich',
    creditsRemaining: 'Verbleibende Credits',
    confirmGen: 'Generierung bestätigen',
    estimatedCredits: 'Geschätzte Credits',
  },
  Japanese: {
    heroTitle: 'より良いコンテンツを。より速く。AIと共に。',
    heroSubtitle: '1つのアイデアから台本、シーン、SEO、サムネイル、コンテンツカレンダーを瞬時に生成。',
    startFree: '無料で始める',
    viewPricing: '料金プランを見る',
    watchDemo: 'デモを見る',
    agentHome: 'CreatorNova AIエージェント',
    agentSubtitle: '何を作成したいかCreatorNovaに伝えてください。',
    askNova: 'CreatorNovaに依頼',
    voiceCommand: '音声コマンド',
    brandKit: 'ブランドキットを使用',
    contentCalendar: 'コンテンツカレンダー',
    seriesCreator: 'シリーズクリエイター',
    characterLibrary: 'キャラクターライブラリ',
    repurposeAI: 'AIで再活用',
    comparePlans: 'プランを比較',
    mostPopular: '一番人気',
    bestValue: 'お得なプラン',
    perMonth: '/月',
    perYear: '/年',
    monthlyBilling: '月払い',
    yearlyBilling: '年払い',
    creditsRemaining: '残りクレジット',
    confirmGen: '生成を確認',
    estimatedCredits: '推定クレジット',
  },
  Korean: {
    heroTitle: '더 나은 콘텐츠를 더 빠르게. AI와 함께.',
    heroSubtitle: '단 하나의 아이디어로 스크립트, 씬 분할, SEO, 썸네일, 캘린더를 몇 분 만에 완성하세요.',
    startFree: '무료로 시작하기',
    viewPricing: '요금제 보기',
    watchDemo: '인터랙티브 데모 보기',
    agentHome: 'CreatorNova AI 에이전트',
    agentSubtitle: '만들고 싶은 콘텐츠를 CreatorNova에 알려주세요.',
    askNova: 'CreatorNova에게 요청',
    voiceCommand: '음성 명령',
    brandKit: '내 브랜드 키트 사용',
    contentCalendar: '콘텐츠 캘린더',
    seriesCreator: '시리즈 크리에이터',
    characterLibrary: '캐릭터 라이브러리',
    repurposeAI: 'AI로 콘텐츠 리퍼포징',
    comparePlans: '요금제 비교',
    mostPopular: '가장 인기 있는 요금제',
    bestValue: '최고 가치',
    perMonth: '/월',
    perYear: '/년',
    monthlyBilling: '월간 결제',
    yearlyBilling: '연간 결제',
    creditsRemaining: '남은 크레딧',
    confirmGen: '생성 확인',
    estimatedCredits: '예상 크레딧',
  },
  Arabic: {
    heroTitle: 'أنشئ محتوى أفضل. أسرع. باستخدام الذكاء الاصطناعي.',
    heroSubtitle: 'حوّل فكرة واحدة إلى نصوص ومشاهد وتحسين محركات البحث وصور مصغرة وجداول نشر في دقائق.',
    startFree: 'ابدأ مجاناً',
    viewPricing: 'عرض الباقات والأسعار',
    watchDemo: 'مشاهدة العرض التوضيحي',
    agentHome: 'وكيل CreatorNova الذكي',
    agentSubtitle: 'أخبر CreatorNova بما تريد إنشاؤه.',
    askNova: 'اسأل CreatorNova',
    voiceCommand: 'أمر صوتي',
    brandKit: 'استخدم هويتي البصرية',
    contentCalendar: 'تقويم المحتوى',
    seriesCreator: 'صانع السلاسل',
    characterLibrary: 'مكتبة الشخصيات',
    repurposeAI: 'إعادة تدوير المحتوى',
    comparePlans: 'مقارنة الخطط',
    mostPopular: 'الأكثر شعبية',
    bestValue: 'أفضل قيمة',
    perMonth: '/شهرياً',
    perYear: '/سنوياً',
    monthlyBilling: 'شهري',
    yearlyBilling: 'سنوي',
    creditsRemaining: 'الرصيد المتبقي',
    confirmGen: 'تأكيد التوليد',
    estimatedCredits: 'الرصيد المقدر',
  },
};

interface LocaleContextType {
  currency: CurrencyCode;
  currencySymbol: string;
  setCurrency: (c: CurrencyCode) => void;
  uiLanguage: UILanguage;
  setUiLanguage: (lang: UILanguage) => void;
  formatPrice: (amount: number, overrideSymbol?: string) => string;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // India-first default currency: INR ₹
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem('creatornova_currency') as CurrencyCode) || 'INR';
  });

  const [uiLanguage, setUiLanguageState] = useState<UILanguage>(() => {
    return (localStorage.getItem('creatornova_ui_lang') as UILanguage) || 'English';
  });

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem('creatornova_currency', c);
  };

  const setUiLanguage = (l: UILanguage) => {
    setUiLanguageState(l);
    localStorage.setItem('creatornova_ui_lang', l);
  };

  const activeCurrencyConfig =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[0];

  const formatPrice = (amount: number, overrideSymbol?: string) => {
    const symbol = overrideSymbol || activeCurrencyConfig.symbol;
    if (amount === 0) return `${symbol}0`;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const t = (key: string): string => {
    const langDict = UI_TRANSLATIONS[uiLanguage] || UI_TRANSLATIONS.English;
    return langDict[key] || UI_TRANSLATIONS.English[key] || key;
  };

  return (
    <LocaleContext.Provider
      value={{
        currency,
        currencySymbol: activeCurrencyConfig.symbol,
        setCurrency,
        uiLanguage,
        setUiLanguage,
        formatPrice,
        t,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
