import type { EntryInput } from '@/src/hooks/useTimesheets';
import { SelectField } from '@/src/components/ui/SelectField';
import { TextField } from '@/src/components/ui/TextField';
import { Colors, Spacing, Typography, useTheme } from '@/src/theme';
import { HIT_SLOP } from '@/src/constants/ui.constants';
import { useSlideUpModalAnimation } from '@/src/hooks/useSlideUpModalAnimation';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CopySimpleIcon, TrashIcon, XIcon } from 'phosphor-react-native';
import { ALL_STATUSES, STATUS_LABELS } from './timesheetsConstants';

interface EntryFormModalProps {
  visible: boolean;
  initial: EntryInput;
  title: string;
  onSave: (input: EntryInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onDuplicate?: (input: EntryInput) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function EntryFormModal({
  visible,
  initial,
  title,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
}: EntryFormModalProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<EntryInput>(initial);
  const { mounted, slideY, backdropOpacity, animateClose } = useSlideUpModalAnimation({
    visible,
    screenHeight: SCREEN_HEIGHT,
  });

  useEffect(() => {
    if (visible) {
      setForm(initial);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => animateClose(onCancel);

  const handleSave = () => {
    if (!form.project || !form.task) return;
    onSave(form);
    animateClose(onCancel);
  };

  const handleDelete = () => {
    onDelete?.();
    animateClose(onCancel);
  };

  const handleDuplicate = () => {
    onDuplicate?.(form);
    animateClose(onCancel);
  };

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />

      <Animated.View style={[styles.container, { transform: [{ translateY: slideY }], backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleClose}
            hitSlop={HIT_SLOP.md}
          >
            <XIcon size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.black }, (!form.project || !form.task) && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.75}
          >
            <Text style={[styles.saveBtnText, { color: colors.white }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <TextField
                label="Project"
                value={form.project}
                onChangeText={(v) => setForm((f) => ({ ...f, project: v }))}
                placeholder="e.g. ARMIS Platform"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <TextField
                label="Task"
                value={form.task}
                onChangeText={(v) => setForm((f) => ({ ...f, task: v }))}
                placeholder="e.g. Frontend development"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <TextField
                label="Hours"
                value={form.hours === 0 ? '' : String(form.hours)}
                onChangeText={(v) => {
                  const n = parseFloat(v);
                  if (!isNaN(n)) setForm((f) => ({ ...f, hours: n }));
                  else if (v === '') setForm((f) => ({ ...f, hours: 0 }));
                }}
                keyboardType="decimal-pad"
                placeholder="8"
                returnKeyType="done"
              />
            </View>

            <View style={styles.field}>
              <SelectField
                label="Status"
                value={form.status}
                placeholder="Select..."
                options={ALL_STATUSES}
                getOptionLabel={(status) => STATUS_LABELS[status as (typeof ALL_STATUSES)[number]]}
                onChange={(status) => setForm((current) => ({ ...current, status: status as EntryInput['status'] }))}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Navbar */}
        {(onDelete || onDuplicate) && (
          <View style={[styles.bottomNav, { paddingBottom: insets.bottom + Spacing[2], borderTopColor: colors.border, backgroundColor: colors.background }]}> 
            <View style={styles.bottomNavInner}>
              {onDuplicate && (
                <TouchableOpacity style={styles.navAction} onPress={handleDuplicate} activeOpacity={0.75}>
                  <CopySimpleIcon size={22} color={colors.textSecondary} />
                  <Text style={[styles.navActionText, { color: colors.textSecondary }]}>Duplicate</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity style={styles.navAction} onPress={handleDelete} activeOpacity={0.75}>
                  <TrashIcon size={22} color={colors.error} />
                  <Text style={[styles.navActionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  saveBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: Spacing[6],
    gap: Spacing[5],
  },
  field: { gap: Spacing[2] },
  // Bottom nav
  bottomNav: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing[3],
  },
  bottomNavInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing[6],
  },
  navAction: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[2],
  },
  navActionText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
  },
});
