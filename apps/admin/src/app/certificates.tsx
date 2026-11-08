import {
  formatDate,
  parishDateTime,
  useCertificateRequests,
  useUpdateCertificateRequest,
  type CertificateKind,
  type CertificateRequest,
  type RequestStatus,
} from '@stmichaels/core';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Dialog, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { Page } from '@/components/Page';
import { StatusChip, statusLabel } from '@/components/StatusChip';

const kindLabel: Record<CertificateKind, string> = {
  baptism: 'Baptism',
  'first-communion': 'First Holy Communion',
  confirmation: 'Confirmation',
  marriage: 'Marriage',
};

type Filter = 'open' | 'all';

export default function Certificates() {
  const requests = useCertificateRequests();
  const update = useUpdateCertificateRequest();
  const [filter, setFilter] = useState<Filter>('open');
  const [deciding, setDeciding] = useState<{ request: CertificateRequest; status: RequestStatus } | null>(null);
  const [note, setNote] = useState('');
  const shown = (requests.data ?? []).filter((r) => filter === 'all' || r.status === 'submitted' || r.status === 'approved');

  const decide = (request: CertificateRequest, status: RequestStatus) => {
    setNote(request.officeNote ?? '');
    setDeciding({ request, status });
  };

  return (
    <Page
      title="Certificate requests"
      description="Check each request against the parish register. The note is shown to the parishioner in the app.">
      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        buttons={[
          { value: 'open', label: 'Open' },
          { value: 'all', label: 'All' },
        ]}
      />
      {shown.length === 0 && <Text variant="bodyMedium">No requests here.</Text>}
      {shown.map((r) => (
        <Card key={r.id} mode="outlined">
          <Card.Title
            title={`${kindLabel[r.kind]} · ${r.personName}`}
            subtitle={`Requested ${formatDate(parishDateTime(r.createdAt).date, 'en')} by ${r.requesterName}, ${r.phone}`}
            titleVariant="titleMedium"
          />
          <Card.Content style={{ gap: 4 }}>
            <StatusChip status={r.status} />
            <Text variant="bodyMedium">
              {[
                r.sacramentDate && `Date of sacrament: ${r.sacramentDate}`,
                r.fatherName && `Father: ${r.fatherName}`,
                r.motherName && `Mother: ${r.motherName}`,
                `Purpose: ${r.purpose}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {r.officeNote && <Text variant="bodyMedium">Office note: {r.officeNote}</Text>}
          </Card.Content>
          <Card.Actions>
            {r.status === 'submitted' && <Button onPress={() => decide(r, 'declined')}>Decline</Button>}
            {r.status === 'submitted' && (
              <Button mode="contained-tonal" onPress={() => decide(r, 'approved')}>
                Approve
              </Button>
            )}
            {r.status === 'approved' && (
              <Button mode="contained-tonal" onPress={() => decide(r, 'completed')}>
                Mark collected
              </Button>
            )}
          </Card.Actions>
        </Card>
      ))}

      <Portal>
        <Dialog visible={!!deciding} onDismiss={() => setDeciding(null)} style={{ maxWidth: 520, width: '92%', alignSelf: 'center' }}>
          <Dialog.Title>{deciding ? `${statusLabel[deciding.status]}: ${deciding.request.personName}` : ''}</Dialog.Title>
          <Dialog.Content>
            <View style={{ gap: 8 }}>
              <Text variant="bodyMedium">Note for the parishioner (optional), e.g. when to collect.</Text>
              <TextInput mode="outlined" value={note} onChangeText={setNote} multiline />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeciding(null)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => {
                if (deciding) update.mutate([deciding.request.id, deciding.status, note]);
                setDeciding(null);
              }}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Page>
  );
}
