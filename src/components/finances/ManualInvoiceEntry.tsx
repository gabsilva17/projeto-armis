import { Button } from '@/src/components/ui/Button';
import { DateField } from '@/src/components/ui/DateField';
import { SelectField } from '@/src/components/ui/SelectField';
import { TextField } from '@/src/components/ui/TextField';
import {
  CURRENCY_OPTIONS,
  EXPENSE_TYPE_OPTIONS,
  PARTNER_PROJECT_OPTIONS,
  PRODUCTIVE_PROJECT_OPTIONS,
} from '@/src/constants/formOptions.constants';
import { HIT_SLOP } from '@/src/constants/ui.constants';
import { Colors, Spacing, Typography, useTheme } from '@/src/theme';
import { useFinancesStore } from '@/src/stores/useFinancesStore';
import type { ManualExpenseEntry, ManualExpenseForm } from '@/src/types/finances.types';
import { CheckIcon, PlusIcon, XIcon, TrashIcon } from 'phosphor-react-native';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useSlideUpModalAnimation } from '@/src/hooks/useSlideUpModalAnimation';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMPTY_FORM: ManualExpenseForm = {
  date: '',
  productiveProject: '',
  partnerProject: '',
  expenseType: '',
  quantity: '1',
  unitValue: '',
  currency: 'EUR',
  observations: '',
  expenseRepresentation: false,
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_OBSERVATIONS_LENGTH = 300;
const MAX_UNIT_VALUE = 100000;
const MAX_QUANTITY = 1000;

interface ManualInvoiceValidationErrors {
  date?: string;
  productiveProject?: string;
  expenseType?: string;
  quantity?: string;
  unitValue?: string;
  currency?: string;
  observations?: string;
}

interface ManualInvoiceTouchedFields {
  date: boolean;
  productiveProject: boolean;
  expenseType: boolean;
  quantity: boolean;
  unitValue: boolean;
  currency: boolean;
  observations: boolean;
}

const INITIAL_TOUCHED_FIELDS: ManualInvoiceTouchedFields = {
  date: false,
  productiveProject: false,
  expenseType: false,
  quantity: false,
  unitValue: false,
  currency: false,
  observations: false,
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function isValidDateString(value: string): boolean {
  const trimmed = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) return false;

  const month = Number.parseInt(match[1], 10);
  const day = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() + 1 === month &&
    parsed.getDate() === day
  );
}

function parsePositiveInteger(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseMoney(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function validateManualInvoiceForm(form: ManualExpenseForm): ManualInvoiceValidationErrors {
  const errors: ManualInvoiceValidationErrors = {};
  const quantity = parsePositiveInteger(form.quantity);
  const unitValue = parseMoney(form.unitValue);

  if (!isValidDateString(form.date)) {
    errors.date = 'Select a valid date.';
  }

  if (!form.productiveProject.trim()) {
    errors.productiveProject = 'Productive project is required.';
  } else if (!(PRODUCTIVE_PROJECT_OPTIONS as readonly string[]).includes(form.productiveProject)) {
    errors.productiveProject = 'Select a valid productive project.';
  }

  if (!form.expenseType.trim()) {
    errors.expenseType = 'Expense type is required.';
  } else if (!(EXPENSE_TYPE_OPTIONS as readonly string[]).includes(form.expenseType)) {
    errors.expenseType = 'Select a valid expense type.';
  }

  if (!form.currency.trim()) {
    errors.currency = 'Currency is required.';
  } else if (!(CURRENCY_OPTIONS as readonly string[]).includes(form.currency)) {
    errors.currency = 'Select a valid currency.';
  }

  if (quantity === null) {
    errors.quantity = 'Quantity must be a whole number.';
  } else if (quantity < 1 || quantity > MAX_QUANTITY) {
    errors.quantity = `Quantity must be between 1 and ${MAX_QUANTITY}.`;
  }

  if (unitValue === null) {
    errors.unitValue = 'Use a valid value with up to 2 decimals.';
  } else if (unitValue <= 0 || unitValue > MAX_UNIT_VALUE) {
    errors.unitValue = `Unit value must be greater than 0 and at most ${MAX_UNIT_VALUE}.`;
  }

  if (form.observations.trim().length > MAX_OBSERVATIONS_LENGTH) {
    errors.observations = `Observations must have at most ${MAX_OBSERVATIONS_LENGTH} characters.`;
  }

  return errors;
}

function sanitizeManualInvoiceForm(form: ManualExpenseForm): ManualExpenseForm {
  const quantity = parsePositiveInteger(form.quantity) ?? 1;
  const unitValue = parseMoney(form.unitValue) ?? 0;

  return {
    ...form,
    date: form.date.trim(),
    productiveProject: normalizeWhitespace(form.productiveProject),
    partnerProject: normalizeWhitespace(form.partnerProject),
    expenseType: normalizeWhitespace(form.expenseType),
    quantity: String(quantity),
    unitValue: unitValue.toFixed(2),
    currency: form.currency.trim(),
    observations: form.observations.trim(),
  };
}

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${month}/${day}/${year}`;
}

interface ManualInvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (form: ManualExpenseForm) => void;
  initialEntry?: ManualExpenseForm;
  onDelete?: () => void;
}

function ManualInvoiceModal({ visible, onClose, onSave, initialEntry, onDelete }: ManualInvoiceModalProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<ManualExpenseForm>(EMPTY_FORM);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [touched, setTouched] = useState<ManualInvoiceTouchedFields>(INITIAL_TOUCHED_FIELDS);
  const isEditMode = !!initialEntry;
  const { mounted, slideY, backdropOpacity, animateClose } = useSlideUpModalAnimation({
    visible,
    screenHeight: SCREEN_HEIGHT,
  });

  const validationErrors = useMemo(() => validateManualInvoiceForm(form), [form]);
  const isSaveDisabled = Object.keys(validationErrors).length > 0;

  useEffect(() => {
    if (visible) {
      const initialForm = initialEntry ?? EMPTY_FORM;
      setForm(initialForm);
      setTouched(INITIAL_TOUCHED_FIELDS);
      // Tentar parsear a data guardada para pré-selecionar no picker
      if (initialEntry?.date) {
        const [month, day, year] = initialEntry.date.split('/').map(Number);
        const parsed = new Date(year, month - 1, day);
        setSelectedDate(isNaN(parsed.getTime()) ? new Date() : parsed);
      } else {
        setSelectedDate(new Date());
      }
    }
  }, [visible, initialEntry]);

  const handleCancel = () => animateClose(onClose);

  const handleFillRandom = () => {
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000);
    setSelectedDate(randomDate);
    setForm({
      date: formatDate(randomDate),
      productiveProject: pick(PRODUCTIVE_PROJECT_OPTIONS),
      partnerProject: Math.random() > 0.5 ? pick(PARTNER_PROJECT_OPTIONS.slice(1)) : '',
      expenseType: pick(EXPENSE_TYPE_OPTIONS),
      quantity: String(Math.floor(Math.random() * 5) + 1),
      unitValue: (Math.random() * 200 + 5).toFixed(2),
      currency: pick(CURRENCY_OPTIONS),
      observations: Math.random() > 0.5 ? 'Test expense generated automatically.' : '',
      expenseRepresentation: Math.random() > 0.7,
    });
  };

  const handleSave = () => {
    if (isSaveDisabled) {
      setTouched({
        date: true,
        productiveProject: true,
        expenseType: true,
        quantity: true,
        unitValue: true,
        currency: true,
        observations: true,
      });
      return;
    }

    onSave(sanitizeManualInvoiceForm(form));
    animateClose(onClose);
  };

  const handleDateChange = (date: Date) => {
    setTouched((current) => ({ ...current, date: true }));
    setSelectedDate(date);
    setForm((current) => ({ ...current, date: formatDate(date) }));
  };

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={handleCancel}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />

      <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideY }], backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleCancel}
            hitSlop={HIT_SLOP.md}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
          >
            <XIcon size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{isEditMode ? 'Edit Expense' : 'New Expense'}</Text>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.black }, isSaveDisabled && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Save expense"
          >
            <Text style={[styles.saveBtnText, { color: colors.white }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.debugBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} onPress={handleFillRandom} activeOpacity={0.7}>
          <Text style={[styles.debugBarText, { color: colors.textMuted }]}>⚡ Fill with random data</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView style={styles.modalContentWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + Spacing[8] }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <DateField
              label="Date"
              required
              value={form.date}
              placeholder="mm/dd/yyyy"
              selectedDate={selectedDate}
              accessibilityLabel="Select expense date"
              onChangeDate={handleDateChange}
              errorText={touched.date ? validationErrors.date : undefined}
            />

            <SelectField
              label="Productive Project"
              required
              value={form.productiveProject}
              placeholder="Select..."
              options={PRODUCTIVE_PROJECT_OPTIONS}
              helperText="Select the project of the company you belong to."
              onChange={(value) => {
                setTouched((current) => ({ ...current, productiveProject: true }));
                setForm((current) => ({ ...current, productiveProject: value }));
              }}
              errorText={touched.productiveProject ? validationErrors.productiveProject : undefined}
            />

            <SelectField
              label="Partner Project"
              value={form.partnerProject}
              placeholder="Select..."
              options={PARTNER_PROJECT_OPTIONS}
              helperText="Fill in only if the expense belongs to a partner company."
              optionToValue={(option) => (option === 'None' ? '' : option)}
              onChange={(value) => setForm((current) => ({ ...current, partnerProject: value }))}
            />

            <SelectField
              label="Expense Type"
              required
              value={form.expenseType}
              placeholder="Select..."
              options={EXPENSE_TYPE_OPTIONS}
              onChange={(value) => {
                setTouched((current) => ({ ...current, expenseType: true }));
                setForm((current) => ({ ...current, expenseType: value }));
              }}
              errorText={touched.expenseType ? validationErrors.expenseType : undefined}
            />

            <View style={styles.fieldBlock}>
              <TextField
                label="Quantity"
                required
                value={form.quantity}
                onChangeText={(value) => {
                  setTouched((current) => ({ ...current, quantity: true }));
                  setForm((current) => ({ ...current, quantity: value }));
                }}
                onBlur={() => setTouched((current) => ({ ...current, quantity: true }))}
                placeholder="1"
                keyboardType="number-pad"
                errorText={touched.quantity ? validationErrors.quantity : undefined}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldBlock, styles.flexOne]}>
                <TextField
                  label="Unit Value"
                  required
                  value={form.unitValue}
                  onChangeText={(value) => {
                    setTouched((current) => ({ ...current, unitValue: true }));
                    setForm((current) => ({ ...current, unitValue: value }));
                  }}
                  onBlur={() => setTouched((current) => ({ ...current, unitValue: true }))}
                  placeholder="Unit Value"
                  keyboardType="decimal-pad"
                  errorText={touched.unitValue ? validationErrors.unitValue : undefined}
                />
              </View>

              <View style={[styles.fieldBlock, styles.currencyField]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Currency<Text style={styles.requiredMark}> *</Text></Text>
                <SelectField
                  value={form.currency}
                  placeholder="EUR"
                  options={CURRENCY_OPTIONS}
                  accessibilityLabel="Currency"
                  onChange={(value) => {
                    setTouched((current) => ({ ...current, currency: true }));
                    setForm((current) => ({ ...current, currency: value }));
                  }}
                  errorText={touched.currency ? validationErrors.currency : undefined}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <TextField
                label="Observations"
                value={form.observations}
                onChangeText={(value) => {
                  setTouched((current) => ({ ...current, observations: true }));
                  setForm((current) => ({ ...current, observations: value }));
                }}
                onBlur={() => setTouched((current) => ({ ...current, observations: true }))}
                placeholder="Observations"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={styles.textArea}
                maxLength={MAX_OBSERVATIONS_LENGTH}
                errorText={touched.observations ? validationErrors.observations : undefined}
                helperText={`${form.observations.length}/${MAX_OBSERVATIONS_LENGTH}`}
              />
            </View>

            <View style={styles.checkboxRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Expense in Representation of?</Text>
              <Pressable
                style={[styles.checkbox, { borderColor: colors.border, backgroundColor: colors.surface }, form.expenseRepresentation && [styles.checkboxChecked, { backgroundColor: colors.black, borderColor: colors.black }]]}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    expenseRepresentation: !current.expenseRepresentation,
                  }))
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.expenseRepresentation }}
              >
                {form.expenseRepresentation ? <CheckIcon size={14} color={colors.white} weight="bold" /> : null}
              </Pressable>
            </View>

            {isEditMode && onDelete ? (
              <TouchableOpacity
                style={[styles.deleteBtn, { borderColor: colors.error }]}
                onPress={() => animateClose(() => { onDelete(); onClose(); })}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Delete expense"
              >
                <TrashIcon size={16} color={colors.error} weight="bold" />
                <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete expense</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

export function ManualInvoiceEntry() {
  const colors = useTheme();
  const [newModalVisible, setNewModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ManualExpenseEntry | null>(null);
  const { entries, addEntry, updateEntry, deleteEntry } = useFinancesStore();

  const totalValue = useMemo(() => {
    return entries.reduce((acc, entry) => acc + (parseFloat(entry.unitValue) || 0), 0).toFixed(2);
  }, [entries]);

  return (
    <View style={[styles.pageContainer, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Manual Expenses</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Manually register your expenses using the form below.</Text>
          </View>
        </View>

        <View style={styles.summaryBlock}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
          <View style={styles.summaryValueRow}>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{totalValue}</Text>
            <Text style={[styles.summaryCurrency, { color: colors.textMuted }]}>EUR</Text>
          </View>
        </View>

        <Button
          label="New expense"
          onPress={() => setNewModalVisible(true)}
          icon={<PlusIcon size={16} color={colors.white} weight="bold" />}
          accessibilityLabel="Open form to add a new expense"
        />

        <View style={styles.entriesSection}>
          <View style={styles.entriesHeader}>
            <Text style={[styles.entriesTitle, { color: colors.textSecondary }]}>Recent entries</Text>
            {entries.length > 0 && (
              <Text style={[styles.entriesCount, { color: colors.textMuted }]}>{entries.length}</Text>
            )}
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <EmptyState 
                icon={null} 
                title="No expenses yet" 
                subtitle="Your manually added expenses will appear here." 
              />
            </View>
          ) : (
            <View style={[styles.entriesList, { borderTopColor: colors.border }]}> 
              {entries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.entryRow, { borderBottomColor: colors.border }]}
                  onPress={() => setEditingEntry(entry)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit expense ${entry.expenseType || 'Expense'}`}
                >
                  <View style={[styles.entryStatusBar, { backgroundColor: colors.black }]} />

                  <View style={styles.entryInfo}>
                    <Text style={[styles.entryTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {entry.expenseType || 'Expense'}
                    </Text>
                    <Text style={[styles.entrySubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {entry.productiveProject}
                    </Text>
                  </View>

                  <View style={styles.entryRight}>
                    <Text style={[styles.entryAmount, { color: colors.textPrimary }]} numberOfLines={1}>
                      {entry.unitValue} {entry.currency}
                    </Text>
                    <Text style={[styles.entryDate, { color: colors.textMuted }]} numberOfLines={1}>
                      {entry.date}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ManualInvoiceModal
        visible={newModalVisible}
        onClose={() => setNewModalVisible(false)}
        onSave={addEntry}
      />

      <ManualInvoiceModal
        visible={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        initialEntry={editingEntry ?? undefined}
        onSave={(form) => {
          if (editingEntry) updateEntry(editingEntry.id, form);
        }}
        onDelete={() => {
          if (editingEntry) deleteEntry(editingEntry.id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  pageContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[16],
    gap: Spacing[5],
  },
  pageHeader: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[2],
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: Typography.size['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  summaryBlock: {
    gap: 4,
    marginBottom: Spacing[2],
  },
  summaryLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  summaryValue: {
    fontSize: Typography.size['3xl'],
    fontFamily: Typography.fontFamily.bold,
  },
  summaryCurrency: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: 4,
  },
  entriesSection: {
    gap: Spacing[4],
    marginTop: Spacing[4],
    flex: 1,
  },
  entriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[1],
  },
  entriesTitle: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  entriesCount: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  emptyStateContainer: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'center',
  },
  entriesList: {
    borderTopWidth: 1,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  entryStatusBar: {
    width: 3,
    height: 28,
    borderRadius: 2,
  },
  entryInfo: {
    flex: 1,
    gap: 3,
  },
  entryTitle: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  entrySubtitle: {
    fontSize: Typography.size.xs,
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: 3,
    maxWidth: 130,
  },
  entryAmount: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.bold,
  },
  entryDate: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
  },

  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  saveBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.black,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  modalContentWrapper: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
    gap: Spacing[4],
  },
  debugBar: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  debugBarText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  fieldBlock: {
    gap: Spacing[2],
  },
  fieldLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  requiredMark: {
    color: Colors.error,
    fontFamily: Typography.fontFamily.bold,
  },
  input: {
    minHeight: 42,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: Colors.border,
    paddingHorizontal: 0,
    paddingVertical: Spacing[2] + 2,
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: 'transparent',
  },
  textArea: {
    minHeight: 110,
    paddingTop: Spacing[2] + 2,
  },
  rowFields: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  flexOne: {
    flex: 1,
  },
  currencyField: {
    width: 140,
  },
  checkboxRow: {
    gap: Spacing[2],
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    marginTop: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.error,
  },
});
