import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' }/* ,
    { value: 'it', label: 'Italiano' },
    { value: 'tlh', label: 'Klingon' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Русский' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'sk', label: 'Slovenský' },
    { value: 'ro', label: 'Română' } */
  ];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const getCurrentLanguageLabel = () => {
    return languages.find(lang => lang.value === i18n.language)?.label || i18n.language;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{t('common.language')}:</span>
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-28">
          <SelectValue placeholder={getCurrentLanguageLabel()}>
            {getCurrentLanguageLabel()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
