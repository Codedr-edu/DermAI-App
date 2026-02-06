import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import vi from './locales/vi.json';

// Lấy ngôn ngữ của thiết bị
// expo-localization trả về danh sách locales, lấy cái đầu tiên
const getDeviceLanguage = () => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    return locales[0].languageCode;
  }
  return 'en';
};

const language = getDeviceLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: language || 'en', // Ngôn ngữ mặc định theo thiết bị
    fallbackLng: 'en',     // Nếu không tìm thấy ngôn ngữ thì dùng tiếng Anh
    interpolation: {
      escapeValue: false, // React đã tự escape XSS
    },
    compatibilityJSON: 'v4',
  });

export default i18n;
