import type { RequestStatus } from '@stmichaels/core';
import { Chip, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export function StatusChip({ status }: { status: RequestStatus }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors: Record<RequestStatus, string> = {
    submitted: theme.colors.secondaryContainer,
    approved: theme.colors.tertiaryContainer,
    completed: theme.colors.surfaceVariant,
    declined: theme.colors.errorContainer,
  };
  return (
    <Chip compact style={{ backgroundColor: colors[status], alignSelf: 'flex-start' }}>
      {t(`requests.status.${status}`)}
    </Chip>
  );
}
