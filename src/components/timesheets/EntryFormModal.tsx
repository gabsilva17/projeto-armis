import type { EntryInput } from '@/src/hooks/useTimesheets';
import { SelectField } from '@/src/components/ui/SelectField';
import { TextField } from '@/src/components/ui/TextField';
import { Colors, Spacing, Typography, useTheme } from '@/src/theme';
import { HIT_SLOP } from '@/src/constants/ui.constants';
import { useSlideUpModalAnimation } from '@/src/hooks/useSlideUpModalAnimation';
import { useEffect, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import i18n from '@/src/i18n';
import { ALL_STATUSES } from './timesheetsConstants';

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
const MAX_PROJECT_LENGTH = 80;
const MAX_TASK_LENGTH = 120;
const MIN_HOURS = 0.25;
const MAX_HOURS = 24;

interface EntryValidationErrors {
  project?: string;
  task?: string;
  hours?: string;
}

interface EntryTouchedFields {
  project: boolean;
  task: boolean;
  hours: boolean;
}

const INITIAL_TOUCHED_FIELDS: EntryTouchedFields = {
  project: false,
  task: false,
  hours: false,
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function parseHours(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function validateEntryInput(form: EntryInput, hoursInput: string): EntryValidationErrors {
  const errors: EntryValidationErrors = {};
  const normalizedProject = normalizeWhitespace(form.project);
  const normalizedTask = normalizeWhitespace(form.task);
  const parsedHours = parseHours(hoursInput);

  if (!normalizedProject) {
    errors.project = i18n.t('timesheets:validation.projectRequired');
  } else if (normalizedProject.length > MAX_PROJECT_LENGTH) {
    errors.project = i18n.t('timesheets:validation.projectMaxLength', { max: MAX_PROJECT_LENGTH });
  } else if (!/[\p{L}\p{N}]/u.test(normalizedProject)) {
    errors.project = i18n.t('timesheets:validation.projectAlphanumeric');
  }

  if (!normalizedTask) {
    errors.task = i18n.t('timesheets:validation.taskRequired');
  } else if (normalizedTask.length > MAX_TASK_LENGTH) {
    errors.task = i18n.t('timesheets:validation.taskMaxLength', { max: MAX_TASK_LENGTH });
  } else if (!/[\p{L}\p{N}]/u.test(normalizedTask)) {
    errors.task = i18n.t('timesheets:validation.taskAlphanumeric');
  }

  if (!hoursInput.trim()) {
    errors.hours = i18n.t('timesheets:validation.hoursRequired');
  } else if (parsedHours === null) {
    errors.hours = i18n.t('timesheets:validation.hoursInvalidFormat');
  } else if (parsedHours < MIN_HOURS || parsedHours > MAX_HOURS) {
    errors.hours = i18n.t('timesheets:validation.hoursRange', { min: MIN_HOURS, max: MAX_HOURS });
  }

  return errors;
}

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
  const { t } = useTranslation('timesheets');
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<EntryInput>(initial);
  const [hoursInput, setHoursInput] = useState(initial.hours === 0 ? '' : String(initial.hours));
  const [touched, setTouched] = useState<EntryTouchedFields>(INITIAL_TOUCHED_FIELDS);
  const { mounted, slideY, backdropOpacity, animateClose } = useSlideUpModalAnimation({
    visible,
    screenHeight: SCREEN_HEIGHT,
  });

  const validationErrors = useMemo(
    () => validateEntryInput(form, hoursInput),
    [form, hoursInput]
  );
  const isSaveDisabled = Object.keys(validationErrors).length > 0;

  useEffect(() => {
    if (visible) {
      setForm(initial);
      setHoursInput(initial.hours === 0 ? '' : String(initial.hours));
      setTouched(INITIAL_TOUCHED_FIELDS);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => animateClose(onCancel);

  const handleSave = () => {
    if (isSaveDisabled) {
      setTouched({ project: true, task: true, hours: true });
      return;
    }

    const parsedHours = parseHours(hoursInput);
    if (parsedHours === null) return;

    const sanitized: EntryInput = {
      project: normalizeWhitespace(form.project),
      task: normalizeWhitespace(form.task),
      hours: Number(parsedHours.toFixed(2)),
      status: form.status,
    };

    onSave(sanitized);
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
            style={[styles.saveBtn, { backgroundColor: colors.black }, isSaveDisabled && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.75}
          >
            <Text style={[styles.saveBtnText, { color: colors.white }]}>{t('common:save')}</Text>
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
                label={t('form.project')}
                value={form.project}
                onChangeText={(v) => {
                  setTouched((current) => ({ ...current, project: true }));
                  setForm((f) => ({ ...f, project: v }));
                }}
                onBlur={() => setTouched((current) => ({ ...current, project: true }))}
                placeholder={t('form.projectPlaceholder')}
                returnKeyType="next"
                maxLength={MAX_PROJECT_LENGTH}
                errorText={touched.project ? validationErrors.project : undefined}
              />
            </View>

            <View style={styles.field}>
              <TextField
                label={t('form.task')}
                value={form.task}
                onChangeText={(v) => {
                  setTouched((current) => ({ ...current, task: true }));
                  setForm((f) => ({ ...f, task: v }));
                }}
                onBlur={() => setTouched((current) => ({ ...current, task: true }))}
                placeholder={t('form.taskPlaceholder')}
                returnKeyType="next"
                maxLength={MAX_TASK_LENGTH}
                errorText={touched.task ? validationErrors.task : undefined}
              />
            </View>

            <View style={styles.field}>
              <TextField
                label={t('form.hours')}
                value={hoursInput}
                onChangeText={(v) => {
                  setTouched((current) => ({ ...current, hours: true }));
                  setHoursInput(v);
                  const parsed = parseHours(v);
                  if (parsed !== null) {
                    setForm((f) => ({ ...f, hours: parsed }));
                  } else if (!v.trim()) {
                    setForm((f) => ({ ...f, hours: 0 }));
                  }
                }}
                onBlur={() => setTouched((current) => ({ ...current, hours: true }))}
                keyboardType="decimal-pad"
                placeholder={t('form.hoursPlaceholder')}
                returnKeyType="done"
                errorText={touched.hours ? validationErrors.hours : undefined}
              />
            </View>

            <View style={styles.field}>
              <SelectField
                label={t('form.status')}
                value={form.status}
                placeholder="Select..."
                options={ALL_STATUSES}
                getOptionLabel={(status) => t(`status.${status}`)}
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
                  <Text style={[styles.navActionText, { color: colors.textSecondary }]}>{t('common:duplicate')}</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity style={styles.navAction} onPress={handleDelete} activeOpacity={0.75}>
                  <TrashIcon size={22} color={colors.error} />
                  <Text style={[styles.navActionText, { color: colors.error }]}>{t('common:delete')}</Text>
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
