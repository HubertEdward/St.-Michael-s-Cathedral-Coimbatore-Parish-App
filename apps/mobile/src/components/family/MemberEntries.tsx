import type { MemberInput } from '@parish/core';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Eyebrow } from '@/components/design/Eyebrow';
import { Panel } from '@/components/design/Panel';
import { MemberFields, newMember } from './MemberForm';

/**
 * Several family members entered together, each in its own card, with a button for one more.
 * Used inside a FormProvider whose values hold `members: MemberInput[]`. With `keepOne`, the last card stays.
 */
export function MemberEntries({ keepOne = false }: { keepOne?: boolean }) {
  const { t } = useTranslation();
  const { control } = useFormContext<{ members: MemberInput[] }>();
  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  return (
    <>
      {fields.map((field, index) => (
        <Panel key={field.id}>
          <View style={styles.top}>
            <Eyebrow>{t('member.personNumber', { number: index + 1 })}</Eyebrow>
            {!(keepOne && fields.length === 1) && (
              <IconButton icon="close" size={20} accessibilityLabel={t('member.removeEntry')} onPress={() => remove(index)} style={styles.close} />
            )}
          </View>
          <MemberFields prefix={`members.${index}.`} />
        </Panel>
      ))}
      <Button mode="outlined" icon="account-plus" onPress={() => append(newMember)}>
        {fields.length === 0 ? t('account.addMember') : t('member.addAnother')}
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  close: { margin: 0 },
});
