"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type Language = "en" | "am" | "om";

const translations: Record<string, Record<Language, string>> = {
  // Nav
  "nav.dashboard": { en: "Dashboard", am: "ዳሽቦርድ", om: "Daashboordii" },
  "nav.donate": { en: "Donate", am: "ለግሱ", om: "Arjooma" },
  "nav.aserat": { en: "Aserat", am: "ዓሥራት", om: "Asiraa" },
  "nav.history": { en: "History", am: "ታሪክ", om: "Seenaa" },
  "nav.profile": { en: "Profile", am: "መገለጫ", om: "Profaayilii" },
  "nav.notifications": { en: "Alerts", am: "ማሳወቂያ", om: "Beeksisa" },
  "nav.selet": { en: "Selet", am: "ስለት", om: "Silxii" },
  "nav.gbir": { en: "Gbir", am: "ግብር", om: "Gibira" },
  "nav.aiChat": { en: "AI Chat", am: "AI ቻት", om: "AI Chat" },

  // Dashboard
  "dash.welcome": {
    en: "God Bless You",
    am: "እግዚአብሔር ይባርክህ",
    om: "Waaqni si haa eebbisu",
  },
  "dash.totalDonated": {
    en: "Total Donated",
    am: "ጠቅላላ ልገሳ",
    om: "Waliigala Arjoomaa",
  },
  "dash.campaigns": {
    en: "Active Campaigns",
    am: "ንቁ ዘመቻዎች",
    om: "Duulaawwan Hojii irra jiran",
  },
  "dash.aserat": {
    en: "Aserat Paid",
    am: "ዓሥራት ተከፍሏል",
    om: "Asiraan Kaffalame",
  },
  "dash.selet": {
    en: "Active Selet",
    am: "ንቁ ስለት",
    om: "Silxii Hojii irra jiru",
  },
  "dash.quickActions": {
    en: "Quick Actions",
    am: "ፈጣን ድርጊቶች",
    om: "Tarkaanfii Ariifataa",
  },
  "dash.reminders": { en: "Reminders", am: "ማስታወሻዎች", om: "Yaadannoo" },
  "dash.recentActivity": {
    en: "Recent Activity",
    am: "የቅርብ ጊዜ እንቅስቃሴ",
    om: "Sochiiwwan Dhiyoo",
  },
  "dash.memberSince": { en: "Member since", am: "አባል ከ", om: "Miseensa" },

  // Donate
  "donate.title": { en: "Campaigns", am: "ዘመቻዎች", om: "Duulaawwan" },
  "donate.search": {
    en: "Search campaigns...",
    am: "ዘመቻዎችን ይፈልጉ...",
    om: "Duulaawwan barbaadi...",
  },
  "donate.raised": { en: "Raised", am: "ተሰብስቧል", om: "Walitti qabame" },
  "donate.goal": { en: "Goal", am: "ግብ", om: "Kaayyoo" },
  "donate.donateNow": { en: "Donate Now", am: "አሁን ለግሱ", om: "Amma Arjoomi" },
  "donate.donateItems": {
    en: "Donate Items",
    am: "ዕቃዎችን ይለግሱ",
    om: "Meeshaalee Arjoomi",
  },
  "donate.all": { en: "All", am: "ሁሉም", om: "Hunda" },
  "donate.education": { en: "Education", am: "ትምህርት", om: "Barnoota" },
  "donate.health": { en: "Health", am: "ጤና", om: "Fayyaa" },
  "donate.building": { en: "Building", am: "ግንባታ", om: "Ijaarsa" },

  // Aserat
  "aserat.title": { en: "Aserat (Tithe)", am: "ዓሥራት", om: "Asiraa (Tithe)" },
  "aserat.income": { en: "Monthly Income", am: "ወርሃዊ ገቢ", om: "Galii Ji'aa" },
  "aserat.amount": {
    en: "Tithe Amount (10%)",
    am: "የዓሥራት መጠን (10%)",
    om: "Hanga Asiraa (10%)",
  },
  "aserat.pay": { en: "Pay Aserat", am: "ዓሥራት ይክፈሉ", om: "Asiraa Kaffali" },
  "aserat.history": {
    en: "Payment History",
    am: "የክፍያ ታሪክ",
    om: "Seenaa Kaffaltii",
  },

  // History
  "history.title": {
    en: "Donation History",
    am: "የልገሳ ታሪክ",
    om: "Seenaa Arjoomaa",
  },
  "history.export": { en: "Export", am: "ላክ", om: "Ergii" },
  "history.all": { en: "All", am: "ሁሉም", om: "Hunda" },
  "history.donations": { en: "Donations", am: "ልገሳዎች", om: "Arjoomaawwan" },
  "history.tithes": { en: "Tithes", am: "ዓሥራት", om: "Asiraa" },
  "history.vows": { en: "Vows", am: "ስለት", om: "Silxii" },

  // Profile
  "profile.title": {
    en: "Profile & Settings",
    am: "መገለጫ እና ቅንብሮች",
    om: "Profaayilii fi Qindaa'ina",
  },
  "profile.personalInfo": {
    en: "Personal Info",
    am: "የግል መረጃ",
    om: "Odeeffannoo Dhuunfaa",
  },
  "profile.language": { en: "Language", am: "ቋንቋ", om: "Afaan" },
  "profile.payment": {
    en: "Payment Methods",
    am: "የክፍያ ዘዴዎች",
    om: "Mala Kaffaltii",
  },
  "profile.security": { en: "Security", am: "ደህንነት", om: "Nageenya" },

  // Selet
  "selet.title": { en: "Selet (Vows)", am: "ስለት", om: "Silxii" },
  "selet.createVow": {
    en: "Create New Vow",
    am: "አዲስ ስለት ይፍጠሩ",
    om: "Silxii Haaraa Uumi",
  },
  "selet.progress": { en: "Progress", am: "ሂደት", om: "Adeemsa" },
  "selet.payInstallment": {
    en: "Pay Installment",
    am: "ክፍያ ይፈጽሙ",
    om: "Kaffaltii Raawwadhi",
  },

  // Gbir
  "gbir.title": { en: "Gbir (Annual)", am: "ግብር", om: "Gibira" },
  "gbir.status": { en: "Annual Status", am: "ዓመታዊ ሁኔታ", om: "Haala Waggaa" },
  "gbir.payNow": { en: "Pay Now", am: "አሁን ይክፈሉ", om: "Amma Kaffali" },

  // AI Chat
  "aiChat.title": {
    en: "Church Assistant",
    am: "Tsedk",
    om: "Gargaaraa Waldaa",
  },
  "aiChat.placeholder": {
    en: "Ask about church services...",
    am: "Ask about church services...",
    om: "Waa'ee tajaajila waldaa gaafadhu...",
  },

  // Common
  "common.birr": { en: "ETB", am: "ብር", om: "ETB" },
  "common.save": { en: "Save", am: "ያስቀምጡ", om: "Kuusii" },
  "common.cancel": { en: "Cancel", am: "ሰርዝ", om: "Haquu" },
  "common.viewAll": { en: "View All", am: "ሁሉንም ይመልከቱ", om: "Hunda Ilaali" },
  "common.search": { en: "Search...", am: "ይፈልጉ...", om: "Barbaadi..." },
};

type I18nContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === "undefined") return "am";
    const saved = localStorage.getItem("app-lang");
    return (saved as Language) || "am";
  });

  const changeLang = useCallback((l: Language) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem("app-lang", l);
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[key]?.[lang] || key;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
