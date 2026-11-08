import type { RequestStatus } from '@parish/core';
import { Chip, useTheme } from 'react-native-paper';

export const statusLabel: Record<RequestStatus, string> = {
  submitted: 'New',
  approved: 'Approved',
  declined: 'Declined',
  completed: 'Completed',
};

export function StatusChip({ status }: { status: RequestStatus }) {
  const theme = useTheme();
  const colors: Record<RequestStatus, string> = {
    submitted: theme.colors.secondaryContainer,
    approved: theme.colors.tertiaryContainer,
    completed: theme.colors.surfaceVariant,
    declined: theme.colors.errorContainer,
  };
  return (
    <Chip compact style={{ backgroundColor: colors[status], alignSelf: 'flex-start' }}>
      {statusLabel[status]}
    </Chip>
  );
}
