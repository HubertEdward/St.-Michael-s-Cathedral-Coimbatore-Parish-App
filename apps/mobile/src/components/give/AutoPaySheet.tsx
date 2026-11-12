import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Display } from '@/components/design/Display';
import { GradientButton } from '@/components/design/GradientButton';
import { SuccessMark } from '@/components/design/SuccessMark';
import { radius } from '@/components/design/tokens';

type Step = 'review' | 'waiting' | 'done';

interface Props {
  visible: boolean;
  /** "₹500 every month on day 5, starting Wed, 10 Dec" */
  summary: string;
  maxAmount: string;
  onApprove: () => Promise<unknown>;
  onClose: () => void;
}

/**
 * Stands in for the UPI app's mandate approval. In the live app the payment gateway opens the
 * person's UPI app here; in the preview a short wait plays out the same steps and no money moves.
 */
export function AutoPaySheet({ visible, summary, maxAmount, onApprove, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [step, setStep] = useState<Step>('review');

  const approve = async () => {
    setStep('waiting');
    await new Promise((resolve) => setTimeout(resolve, 1600));
    await onApprove();
    setStep('done');
  };

  const close = () => {
    setStep('review');
    onClose();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={step === 'waiting' ? undefined : close}
        dismissable={step !== 'waiting'}
        contentContainerStyle={[styles.sheet, { backgroundColor: theme.dark ? theme.colors.elevation.level3 : '#FFFFFF' }]}>
        {step === 'done' ? (
          <View style={styles.center}>
            <SuccessMark />
            <Display size={30} style={styles.centerText}>
              {t('give.doneTitle')}
            </Display>
            <Text variant="bodyLarge" style={styles.centerText}>
              {t('give.done')}
            </Text>
            <Button mode="contained" onPress={close} contentStyle={styles.button} style={styles.full}>
              {t('give.close')}
            </Button>
          </View>
        ) : (
          <View style={styles.body}>
            <View style={styles.header}>
              <Icon source="cellphone-check" size={32} color={theme.colors.primary} />
              <Display size={28} style={styles.flex}>
                {t('give.sheetTitle')}
              </Display>
            </View>
            <Text variant="titleMedium">{summary}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('give.sheetBody', { amount: maxAmount })}
            </Text>
            {step === 'waiting' ? (
              <View style={styles.waiting}>
                <ActivityIndicator />
                <Text variant="bodyLarge">{t('give.approving')}</Text>
              </View>
            ) : (
              <View style={styles.buttons}>
                <GradientButton label={t('give.approve')} icon="check" onPress={approve} />
                <Button onPress={close}>{t('give.cancel')}</Button>
              </View>
            )}
          </View>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: { margin: 20, borderRadius: radius.card, padding: 24, maxWidth: 480, width: '90%', alignSelf: 'center' },
  body: { gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  buttons: { gap: 8, marginTop: 4 },
  button: { height: 52 },
  center: { alignItems: 'center', gap: 14 },
  centerText: { textAlign: 'center' },
  full: { alignSelf: 'stretch' },
});
