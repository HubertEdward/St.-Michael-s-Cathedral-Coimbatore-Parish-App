import { formatDate, formatTime, useCertificateRequests, useIntentions, useServices } from '@stmichaels/core';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { StatusChip } from '@/components/StatusChip';
import { useLanguage } from '@/i18n';

/** Requests made from this phone (in Phase 1 they are stored only on the device). */
export default function MyRequests() {
  const { t } = useTranslation();
  const language = useLanguage();
  const intentions = useIntentions();
  const certificates = useCertificateRequests();
  const services = useServices();
  const none = (intentions.data?.length ?? 0) + (certificates.data?.length ?? 0) === 0;

  return (
    <Screen onRefresh={() => Promise.all([intentions.refetch(), certificates.refetch()])}>
      {none && <Text variant="bodyLarge">{t('requests.empty')}</Text>}

      {!!intentions.data?.length && <Text variant="titleLarge">{t('requests.intentions')}</Text>}
      {intentions.data?.map((i) => {
        const service = services.data?.find((s) => s.id === i.serviceId);
        return (
          <Card key={i.id} mode="outlined">
            <Card.Content style={{ gap: 6 }}>
              <StatusChip status={i.status} />
              <Text variant="titleMedium">{i.names}</Text>
              <Text variant="bodyMedium">
                {t(`intention.types.${i.type}`)} · {formatDate(i.massDate, language)}
                {service ? ` · ${formatTime(service.time, language)}` : ''}
              </Text>
            </Card.Content>
          </Card>
        );
      })}

      {!!certificates.data?.length && <Text variant="titleLarge">{t('requests.certificates')}</Text>}
      {certificates.data?.map((c) => (
        <Card key={c.id} mode="outlined">
          <Card.Content style={{ gap: 6 }}>
            <StatusChip status={c.status} />
            <Text variant="titleMedium">{t(`certificate.kinds.${c.kind}`)}</Text>
            <Text variant="bodyMedium">{c.personName}</Text>
            {c.officeNote && <Text variant="bodyMedium">{c.officeNote}</Text>}
          </Card.Content>
        </Card>
      ))}

      <Notice text={t('requests.previewNote')} />
    </Screen>
  );
}
