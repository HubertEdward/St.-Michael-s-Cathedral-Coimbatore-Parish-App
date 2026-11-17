import { Button, Dialog, Portal, Text } from 'react-native-paper';

interface Props {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onDismiss: () => void;
  /** The confirming button; "Delete" unless the action is something else. */
  confirmLabel?: string;
}

export function ConfirmDialog({ visible, message, onConfirm, onDismiss, confirmLabel = 'Delete' }: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxWidth: 480, alignSelf: 'center', width: '90%' }}>
        <Dialog.Title>Are you sure?</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            onPress={() => {
              onConfirm();
              onDismiss();
            }}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
