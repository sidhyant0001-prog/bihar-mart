import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Language = "en" | "hi";

const translations = {
  en: {
    nav: {
      brandName: "Patna Complex",
      properties: "Properties",
      login: "Login",
      register: "Register",
      logout: "Logout",
      dashboard: "Dashboard",
    },
    home: {
      title: "Find Your Space in Patna Complex",
      subtitle: "Premium residential flats, thriving commercial shops, and bustling markets — all managed with transparency and care.",
      browse: "Browse Properties",
      portal: "Tenant Portal",
    },
    properties: {
      title: "Available Properties",
      subtitle: "Discover your perfect space in Patna Complex",
      stats: {
        total: "Total Properties",
        occupied: "Occupied",
        avgRent: "Avg. Rent",
        forSale: "For Sale",
      },
      filters: {
        search: "Search properties...",
        allTypes: "All Types",
        flat: "Flat",
        shop: "Shop",
        grocery: "Grocery Store",
        market: "Market",
        allStatus: "All Status",
        available: "Available",
        occupied: "Occupied",
        forSale: "For Sale",
        under10k: "Under ₹10,000",
        range10to20k: "₹10,000–₹20,000",
        above20k: "Above ₹20,000",
        allPrices: "All Prices",
        gridView: "Grid",
        mapView: "Map",
        clearFilters: "Clear Filters",
      },
      card: {
        viewDetails: "View Details",
        perMonth: "/mo",
        floor: "Floor",
        sqft: "sq.ft.",
        bhk: "BHK",
        sale: "Sale",
      },
      noResults: "No properties match your filters.",
      loading: "Loading properties...",
      mapTitle: "Properties on Map",
      mapNote: "Click a marker to view property details",
    },
    auth: {
      login: {
        title: "Welcome Back",
        subtitle: "Login to manage your property",
        email: "Email",
        password: "Password",
        emailPlaceholder: "email@example.com",
        passwordPlaceholder: "Enter your password",
        btn: "Login",
        loading: "Logging in...",
        noAccount: "Don't have an account?",
        register: "Register",
        successTitle: "Login successful",
        failTitle: "Login failed",
      },
      register: {
        title: "Create an Account",
        subtitle: "Join Patna Complex to find or manage your property",
        name: "Full Name",
        namePlaceholder: "Rahul Sharma",
        email: "Email",
        emailPlaceholder: "rahul@example.com",
        password: "Password",
        role: "I am a...",
        rolePlaceholder: "Select a role",
        buyer: "Prospective Buyer/Tenant",
        tenant: "Current Resident (Flat)",
        shopkeeper: "Current Shopkeeper",
        btn: "Register",
        loading: "Creating account...",
        hasAccount: "Already have an account?",
        login: "Login",
        successTitle: "Registration successful",
        failTitle: "Registration failed",
      },
    },
    detail: {
      type: "Type",
      size: "Size",
      bhk: "BHK",
      floor: "Floor",
      ground: "Ground",
      description: "Description",
      noDesc: "No description provided.",
      noImage: "No Image Available",
      sale: "Sale",
      perMonth: "/mo",
      inquire: "Send Inquiry",
      inquiryTitle: "Interested in this property?",
      inquirySubtitle: "Fill in your details and we will get back to you shortly.",
      yourName: "Your Name",
      yourEmail: "Your Email",
      yourPhone: "Phone Number",
      message: "Message",
      messagePlaceholder: "I am interested in this property...",
      send: "Send Inquiry",
      sending: "Sending...",
      notFound: "Property not found.",
      loading: "Loading...",
    },
    status: {
      available: "Available",
      occupied: "Occupied",
      for_sale: "For Sale",
      under_maintenance: "Maintenance",
    },
    types: {
      flat: "Flat",
      shop: "Shop",
      grocery_store: "Grocery Store",
      market: "Market",
    },
  },
  hi: {
    nav: {
      brandName: "पटना कॉम्प्लेक्स",
      properties: "संपत्तियाँ",
      login: "लॉगिन",
      register: "पंजीकरण",
      logout: "लॉगआउट",
      dashboard: "डैशबोर्ड",
    },
    home: {
      title: "पटना कॉम्प्लेक्स में अपनी जगह खोजें",
      subtitle: "प्रीमियम आवासीय फ्लैट, व्यावसायिक दुकानें और बाजार — सब पारदर्शिता और देखभाल के साथ प्रबंधित।",
      browse: "संपत्तियाँ देखें",
      portal: "किरायेदार पोर्टल",
    },
    properties: {
      title: "उपलब्ध संपत्तियाँ",
      subtitle: "पटना कॉम्प्लेक्स में अपना परफेक्ट स्थान खोजें",
      stats: {
        total: "कुल संपत्तियाँ",
        occupied: "अधिकृत",
        avgRent: "औसत किराया",
        forSale: "बिक्री हेतु",
      },
      filters: {
        search: "संपत्तियाँ खोजें...",
        allTypes: "सभी प्रकार",
        flat: "फ्लैट",
        shop: "दुकान",
        grocery: "किराना स्टोर",
        market: "बाजार",
        allStatus: "सभी स्थिति",
        available: "उपलब्ध",
        occupied: "अधिकृत",
        forSale: "बिक्री हेतु",
        under10k: "₹10,000 से कम",
        range10to20k: "₹10,000–₹20,000",
        above20k: "₹20,000 से अधिक",
        allPrices: "सभी मूल्य",
        gridView: "ग्रिड",
        mapView: "मैप",
        clearFilters: "फ़िल्टर हटाएं",
      },
      card: {
        viewDetails: "विवरण देखें",
        perMonth: "/माह",
        floor: "मंजिल",
        sqft: "वर्ग फुट",
        bhk: "BHK",
        sale: "बिक्री",
      },
      noResults: "कोई संपत्ति आपके फ़िल्टर से मेल नहीं खाती।",
      loading: "संपत्तियाँ लोड हो रही हैं...",
      mapTitle: "मैप पर संपत्तियाँ",
      mapNote: "संपत्ति विवरण देखने के लिए मार्कर पर क्लिक करें",
    },
    auth: {
      login: {
        title: "वापस स्वागत है",
        subtitle: "अपनी संपत्ति प्रबंधित करने के लिए लॉगिन करें",
        email: "ईमेल",
        password: "पासवर्ड",
        emailPlaceholder: "ईमेल@example.com",
        passwordPlaceholder: "पासवर्ड दर्ज करें",
        btn: "लॉगिन करें",
        loading: "लॉगिन हो रहा है...",
        noAccount: "खाता नहीं है?",
        register: "पंजीकरण करें",
        successTitle: "लॉगिन सफल",
        failTitle: "लॉगिन विफल",
      },
      register: {
        title: "खाता बनाएं",
        subtitle: "पटना कॉम्प्लेक्स में जुड़ने के लिए पंजीकरण करें",
        name: "पूरा नाम",
        namePlaceholder: "राहुल शर्मा",
        email: "ईमेल",
        emailPlaceholder: "rahul@example.com",
        password: "पासवर्ड",
        role: "मैं हूँ...",
        rolePlaceholder: "भूमिका चुनें",
        buyer: "संभावित खरीदार/किरायेदार",
        tenant: "वर्तमान निवासी (फ्लैट)",
        shopkeeper: "वर्तमान दुकानदार",
        btn: "पंजीकरण करें",
        loading: "खाता बन रहा है...",
        hasAccount: "पहले से खाता है?",
        login: "लॉगिन करें",
        successTitle: "पंजीकरण सफल",
        failTitle: "पंजीकरण विफल",
      },
    },
    detail: {
      type: "प्रकार",
      size: "आकार",
      bhk: "BHK",
      floor: "मंजिल",
      ground: "भूतल",
      description: "विवरण",
      noDesc: "कोई विवरण उपलब्ध नहीं।",
      noImage: "कोई छवि उपलब्ध नहीं",
      sale: "बिक्री",
      perMonth: "/माह",
      inquire: "पूछताछ करें",
      inquiryTitle: "इस संपत्ति में रुचि है?",
      inquirySubtitle: "अपना विवरण भरें और हम जल्द संपर्क करेंगे।",
      yourName: "आपका नाम",
      yourEmail: "आपका ईमेल",
      yourPhone: "फोन नंबर",
      message: "संदेश",
      messagePlaceholder: "मुझे इस संपत्ति में रुचि है...",
      send: "पूछताछ भेजें",
      sending: "भेजा जा रहा है...",
      notFound: "संपत्ति नहीं मिली।",
      loading: "लोड हो रहा है...",
    },
    status: {
      available: "उपलब्ध",
      occupied: "अधिकृत",
      for_sale: "बिक्री हेतु",
      under_maintenance: "रखरखाव",
    },
    types: {
      flat: "फ्लैट",
      shop: "दुकान",
      grocery_store: "किराना स्टोर",
      market: "बाजार",
    },
  },
};

export type Translations = typeof translations.en;

interface LanguageContextType {
  lang: Language;
  t: Translations;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("realty_lang") as Language) || "en";
  });

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "hi" : "en";
      localStorage.setItem("realty_lang", next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
