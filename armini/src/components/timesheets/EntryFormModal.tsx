import type { EntryInput } from '@/src/hooks/useTimesheets';
import { Colors, Spacing, Typography, useTheme } from '@/src/theme';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretDownIcon, CheckIcon, CopySimpleIcon, TrashIcon, XIcon } from 'phosphor-react-native';
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
  const [mounted, setMounted] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setForm(initial);
      setStatusOpen(false);
      setMounted(true);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      slideY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideY, {
          toValue: 0,
          damping: 26,
          stiffness: 230,
          mass: 0.85,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [mounted, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateClose = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideY, {
        toValue: SCREEN_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      callback();
    });
  };

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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Project</Text>
              <TextInput
                style={[styles.input, { borderBottomColor: colors.border, color: colors.textPrimary }]}
                value={form.project}
                onChangeText={(v) => setForm((f) => ({ ...f, project: v }))}
                placeholder="e.g. ARMIS Platform"
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Task</Text>
              <TextInput
                style={[styles.input, { borderBottomColor: colors.border, color: colors.textPrimary }]}
                value={form.task}
                onChangeText={(v) => setForm((f) => ({ ...f, task: v }))}
                placeholder="e.g. Frontend development"
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Hours</Text>
              <TextInput
                style={[styles.input, { borderBottomColor: colors.border, color: colors.textPrimary }]}
                value={form.hours === 0 ? '' : String(form.hours)}
                onChangeText={(v) => {
                  const n = parseFloat(v);
                  if (!isNaN(n)) setForm((f) => ({ ...f, hours: n }));
                  else if (v === '') setForm((f) => ({ ...f, hours: 0 }));
                }}
                keyboardType="decimal-pad"
                placeholder="8"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Status</Text>
              <TouchableOpacity
                style={[styles.statusTrigger, { borderBottomColor: colors.border }]}
                onPress={() => setStatusOpen((o) => !o)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text style={[styles.statusTriggerText, { color: colors.textPrimary }]}>{STATUS_LABELS[form.status]}</Text>
                <CaretDownIcon size={15} color={colors.textMuted} style={statusOpen && styles.caretOpen} />
              </TouchableOpacity>

              {statusOpen && (
                <View style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
                  {ALL_STATUSES.map((s, i) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.dropdownItem, i < ALL_STATUSES.length - 1 && [styles.dropdownItemBorder, { borderBottomColor: colors.border }]]}
                      onPress={() => { setForm((f) => ({ ...f, status: s })); setStatusOpen(false); }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.textSecondary }, form.status === s && [styles.dropdownItemTextActive, { color: colors.textPrimary }]]}>
                        {STATUS_LABELS[s]}
                      </Text>
                      {form.status === s && <CheckIcon size={15} color={colors.textPrimary} weight="bold" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
  fieldLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    paddingVertical: Spacing[2] + 2,
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
  },
  statusTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    paddingVertical: Spacing[2] + 2,
  },
  statusTriggerText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
  },
  caretOpen: { transform: [{ rotate: '180deg' }] },
  dropdown: {
    marginTop: Spacing[2],
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  dropdownItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
  },
  dropdownItemTextActive: {
    fontFamily: Typography.fontFamily.medium,
  },
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
