import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';

interface Props {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  onSave: () => void;
  saving?: boolean;
  children: ReactNode;
}

/** A dialog that hosts an editing form, with Cancel and Save. */
export function FormDialog({ visible, title, onDismiss, onSave, saving, children }: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ maxWidth: 720, width: '92%', alignSelf: 'center', maxHeight: '90%' }}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={{ paddingVertical: 12, gap: 8 }}>{children}</ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button mode="contained" loading={saving} onPress={onSave}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
