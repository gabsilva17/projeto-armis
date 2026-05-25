import type { EntryInput } from '@/src/hooks/useTimesheets';
import { SelectField } from '@/src/components/ui/SelectField';
import { TextField } from '@/src/components/ui/TextField';
import { Colors, Spacing, Typography, useTheme } from '@/src/theme';
import { HIT_SLOP } from '@/src/constants/ui.constants';
import { useSlideUpModalAnimation } from '@/src/hooks/useSlideUpModalAnimation';
import {
  fetchProjects,
  fetchTasksForProject,
  type ProjectOption,
  type TaskOption,
} from '@/src/services/projects/projectsService';
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

function parseHours(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function validateEntryInput(
  form: EntryInput,
  hoursInput: string,
  projects: ProjectOption[],
  tasks: TaskOption[],
  projectsLoaded: boolean,
  tasksLoaded: boolean,
): EntryValidationErrors {
  const errors: EntryValidationErrors = {};
  const parsedHours = parseHours(hoursInput);

  if (!form.project.trim()) {
    errors.project = i18n.t('timesheets:validation.projectRequired');
  } else if (projectsLoaded && !projects.some((p) => p.description === form.project)) {
    errors.project = i18n.t('timesheets:validation.projectInvalid');
  }

  if (!form.task.trim()) {
    errors.task = i18n.t('timesheets:validation.taskRequired');
  } else if (tasksLoaded && !tasks.some((t) => t.name === form.task)) {
    errors.task = i18n.t('timesheets:validation.taskInvalid');
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
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const { mounted, slideY, backdropOpacity, animateClose } = useSlideUpModalAnimation({
    visible,
    screenHeight: SCREEN_HEIGHT,
  });

  const validationErrors = useMemo(
    () => validateEntryInput(form, hoursInput, projects, tasks, projectsLoaded, tasksLoaded),
    [form, hoursInput, projects, tasks, projectsLoaded, tasksLoaded]
  );
  const isSaveDisabled = Object.keys(validationErrors).length > 0;

  useEffect(() => {
    if (visible) {
      setForm(initial);
      setHoursInput(initial.hours === 0 ? '' : String(initial.hours));
      setTouched(INITIAL_TOUCHED_FIELDS);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch projects sempre que o modal abre. Não cacheamos entre aberturas
  // porque a lista pode mudar (projecto novo / encerrado); custo num localhost
  // mock é desprezável e o real backend é igualmente snappy para esta lista.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setProjectsLoading(true);
    setProjectsError(null);
    setProjectsLoaded(false);
    fetchProjects()
      .then((list) => {
        if (cancelled) return;
        setProjects(list);
        setProjectsLoaded(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProjectsError(err instanceof Error ? err.message : t('form.projectLoadFailed'));
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, t]);

  // Tasks dependem do projecto seleccionado. Quando a lista de projectos
  // ainda não chegou, ou o nome no form não bate com nenhum (edição com
  // dados stale), não fazemos fetch — o utilizador é forçado a (re)escolher.
  const selectedProject = useMemo(
    () => projects.find((p) => p.description === form.project),
    [projects, form.project],
  );

  useEffect(() => {
    if (!visible) return;
    if (!selectedProject) {
      setTasks([]);
      setTasksLoaded(false);
      setTasksError(null);
      return;
    }
    let cancelled = false;
    setTasksLoading(true);
    setTasksError(null);
    setTasksLoaded(false);
    fetchTasksForProject(selectedProject.code)
      .then((list) => {
        if (cancelled) return;
        setTasks(list);
        setTasksLoaded(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTasksError(err instanceof Error ? err.message : t('form.taskLoadFailed'));
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, selectedProject, t]);

  const handleClose = () => animateClose(onCancel);

  const handleSave = () => {
    if (isSaveDisabled) {
      setTouched({ project: true, task: true, hours: true });
      return;
    }

    const parsedHours = parseHours(hoursInput);
    if (parsedHours === null) return;

    const sanitized: EntryInput = {
      project: form.project,
      task: form.task,
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
              <SelectField
                label={t('form.project')}
                value={form.project}
                placeholder={
                  projectsLoading
                    ? t('form.projectLoading')
                    : t('form.projectPlaceholder')
                }
                options={projects.map((p) => p.description)}
                onChange={(value) => {
                  setTouched((current) => ({ ...current, project: true, task: true }));
                  // Trocar de projecto invalida a tarefa anterior.
                  setForm((f) => ({ ...f, project: value, task: '' }));
                }}
                errorText={
                  touched.project
                    ? projectsError ?? validationErrors.project
                    : undefined
                }
              />
            </View>

            <View style={styles.field}>
              <SelectField
                label={t('form.task')}
                value={form.task}
                placeholder={
                  !selectedProject
                    ? t('form.taskPlaceholderDisabled')
                    : tasksLoading
                      ? t('form.taskLoading')
                      : t('form.taskPlaceholder')
                }
                options={tasks.map((task) => task.name)}
                onChange={(value) => {
                  setTouched((current) => ({ ...current, task: true }));
                  setForm((f) => ({ ...f, task: value }));
                }}
                errorText={
                  touched.task
                    ? tasksError ?? validationErrors.task
                    : undefined
                }
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
