'use client'
import { useEffect, useState } from 'react';
import '../i18n/config';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    setIsI18nInitialized(true);
  }, []);

  if (!isI18nInitialized) {
    return null;
  }

  return <>{children}</>;
}