import { churchPhotos, formatDate, formatTime, parish, parishDateTime, useAnnouncements, useEvents } from '@parish/core';
import type { Href } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage, useLocalized } from '@/i18n';

export interface Story {
  id: string;
  /** Small line above the title: "News" or the event's date and time. */
  label: string;
  title: string;
  body: string;
  image: number;
  href: Href;
}

const pictures = [...churchPhotos.map((p) => p.source), parish.images.patron.source];

/** The parish's announcements, then its coming events, as full-screen stories. */
export function useStories(): Story[] {
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  const announcements = useAnnouncements().data ?? [];
  const now = Date.now();
  const events = (useEvents().data ?? []).filter((e) => Date.parse(e.startsAt) >= now - 3 * 3_600_000).slice(0, 4);

  const news: Story[] = announcements.slice(0, 5).map((a) => ({
    id: `a-${a.id}`,
    label: t('stories.news'),
    title: text(a.title),
    body: text(a.body),
    image: 0,
    href: { pathname: '/announcement/[id]', params: { id: a.id } },
  }));
  const coming: Story[] = events.map((e) => {
    const { date, time } = parishDateTime(e.startsAt);
    return {
      id: `e-${e.id}`,
      label: `${formatDate(date, language)} · ${formatTime(time, language)}`,
      title: text(e.title),
      body: [text(e.description), e.place ? text(e.place) : ''].filter(Boolean).join('\n\n'),
      image: 0,
      href: { pathname: '/event/[id]', params: { id: e.id } },
    };
  });
  return [...news, ...coming].map((story, index) => ({ ...story, image: pictures[index % pictures.length] }));
}

// Which stories have been opened, for this session; seen ones lose their golden ring.
const seen = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

export function markSeen(id: string) {
  if (seen.has(id)) return;
  seen.add(id);
  version++;
  listeners.forEach((listener) => listener());
}

export function useSeen(): (id: string) => boolean {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
  );
  return (id) => seen.has(id);
}
