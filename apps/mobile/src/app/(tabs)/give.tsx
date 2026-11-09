import { formatRupees, useMySubscriptions, useStartSubscription, type SubscriptionInput } from '@parish/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { ParallaxScreen } from '@/components/design/ParallaxScreen';
import { AutoPaySheet } from '@/components/give/AutoPaySheet';
import { ManageSubscription } from '@/components/give/ManageSubscription';
import { SetupForm, useSummary } from '@/components/give/SetupForm';
import { useLanguage } from '@/i18n';

/** Monthly offering by UPI AutoPay: set one up, or manage the one you have. No money moves in the preview. */
export default function Give() {
  const { t } = useTranslation();
  const language = useLanguage();
  const summary = useSummary();
  const mine = useMySubscriptions();
  const start = useStartSubscription();
  // The sheet lives here, not in the form, so its "thank you" step survives the form giving way to the card.
  const [pending, setPending] = useState<SubscriptionInput | null>(null);

  return (
    <ParallaxScreen height={320} eyebrow={t('give.eyebrow')} title={t('give.title')} subtitle={t('give.subtitle')}>
      <QueryState query={mine}>
        {(list) => {
          const current = list.find((s) => s.status !== 'cancelled');
          return current ? <ManageSubscription key={current.id} subscription={current} /> : <SetupForm onReview={setPending} />;
        }}
      </QueryState>
      <Notice text={t('give.preview')} icon="shield-check-outline" />
      <AutoPaySheet
        visible={pending !== null}
        summary={pending ? summary(pending) : ''}
        maxAmount={formatRupees(pending?.amount ?? 0, language)}
        onApprove={() => (pending ? start.mutateAsync([pending]) : Promise.resolve())}
        onClose={() => setPending(null)}
      />
    </ParallaxScreen>
  );
}
