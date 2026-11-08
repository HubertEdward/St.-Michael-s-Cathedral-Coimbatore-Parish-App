import { addDays, formatDate, parishClock } from '@stmichaels/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/i18n';

/** The current time, refreshed every minute so "next Mass" moves on by itself. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** "Today", "Tomorrow" or "Sun, 9 Nov" for a Coimbatore date. */
export function useDayLabel(): (date: string) => string {
  const { t } = useTranslation();
  const language = useLanguage();
  const today = parishClock(new Date()).date;
  return (date) =>
    date === today ? t('common.today') : date === addDays(today, 1) ? t('common.tomorrow') : formatDate(date, language);
}
