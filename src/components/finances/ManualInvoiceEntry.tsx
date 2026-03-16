import { Button } from '@/src/components/ui/Button';
import { Colors, Spacing, Typography, useTheme } from '@/src/theme';
import { useFinancesStore } from '@/src/stores/useFinancesStore';
import type { ManualExpenseEntry, ManualExpenseForm } from '@/src/types/finances.types';
import { CheckIcon, CaretDownIcon, PlusIcon, XIcon, TrashIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRODUCTIVE_PROJECT_OPTIONS = ['Digital Hub', 'Internal R&D', 'ARMIS Platform'];
const PARTNER_PROJECT_OPTIONS = ['None', 'Client Project A', 'Client Project B'];
const EXPENSE_TYPE_OPTIONS = ['Travel', 'Meal', 'Accommodation', 'Office Supplies'];
const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP'];

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

function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${month}/${day}/${year}`;
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: string[];
  helperText?: string;
  onChange: (value: string) => void;
}

function SelectField({
  label,
  required,
  value,
  placeholder,
  options,
  helperText,
  onChange,
}: SelectFieldProps) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const showLabel = label.trim().length > 0;

  return (
    <View style={styles.fieldBlock}>
      {showLabel ? (
        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
          {label}
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.selectTrigger, { borderBottomColor: colors.border }]}
        activeOpacity={0.75}
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.selectTriggerText, { color: colors.textPrimary }, !value && { color: colors.textMuted }]}>
          {value || placeholder}
        </Text>
        <CaretDownIcon size={16} color={colors.textMuted} style={open && styles.caretOpen} />
      </TouchableOpacity>

      {open && (
        <View style={[styles.selectMenu, { borderColor: colors.border, backgroundColor: colors.background }]}> 
          {options.map((option, index) => {
            const isSelected = option === value;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectItem,
                  index < options.length - 1 && [styles.selectItemBorder, { borderBottomColor: colors.border }],
                ]}
                onPress={() => {
                  onChange(option === 'None' ? '' : option);
                  setOpen(false);
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.selectItemText, { color: colors.textSecondary }, isSelected && [styles.selectItemTextActive, { color: colors.textPrimary }]]}>{option}</Text>
                {isSelected ? <CheckIcon size={14} weight="bold" color={colors.textPrimary} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {helperText ? <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text> : null}
    </View>
  );
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
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<ManualExpenseForm>(EMPTY_FORM);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const isEditMode = !!initialEntry;

  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const isSaveDisabled = useMemo(() => {
    return (
      !form.date.trim() ||
      !form.productiveProject.trim() ||
      !form.expenseType.trim() ||
      !form.quantity.trim() ||
      !form.unitValue.trim() ||
      !form.currency.trim()
    );
  }, [form]);

  useEffect(() => {
    if (visible) {
      const initialForm = initialEntry ?? EMPTY_FORM;
      setForm(initialForm);
      // Tentar parsear a data guardada para pré-selecionar no picker
      if (initialEntry?.date) {
        const [month, day, year] = initialEntry.date.split('/').map(Number);
        const parsed = new Date(year, month - 1, day);
        setSelectedDate(isNaN(parsed.getTime()) ? new Date() : parsed);
      } else {
        setSelectedDate(new Date());
      }
      setShowDatePicker(false);
      setMounted(true);
    }
  }, [visible, initialEntry]);

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
  }, [mounted, visible, backdropOpacity, slideY]);

  const closeAnimated = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }),
    ]).start(() => {
      setMounted(false);
      callback();
    });
  };

  const handleCancel = () => closeAnimated(onClose);

  const handleFillRandom = () => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
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
    if (isSaveDisabled) return;
    onSave(form);
    closeAnimated(onClose);
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !date) return;

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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
            disabled={isSaveDisabled}
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
            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Date<Text style={styles.requiredMark}> *</Text></Text>
              <TouchableOpacity
                style={[styles.inputPressable, { borderBottomColor: colors.border }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Select expense date"
              >
                <Text style={[styles.selectTriggerText, { color: colors.textPrimary }, !form.date && { color: colors.textMuted }]}>
                  {form.date || 'mm/dd/yyyy'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && Platform.OS === 'ios' ? (
                <View style={[styles.iosDatePickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                  />
                  <TouchableOpacity
                    style={styles.iosDatePickerDoneBtn}
                    onPress={() => setShowDatePicker(false)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm date"
                  >
                    <Text style={[styles.iosDatePickerDoneText, { color: colors.textPrimary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {showDatePicker && Platform.OS === 'android' ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              ) : null}
            </View>

            <SelectField
              label="Productive Project"
              required
              value={form.productiveProject}
              placeholder="Select..."
              options={PRODUCTIVE_PROJECT_OPTIONS}
              helperText="Select the project of the company you belong to."
              onChange={(value) => setForm((current) => ({ ...current, productiveProject: value }))}
            />

            <SelectField
              label="Partner Project"
              value={form.partnerProject}
              placeholder="Select..."
              options={PARTNER_PROJECT_OPTIONS}
              helperText="Fill in only if the expense belongs to a partner company."
              onChange={(value) => setForm((current) => ({ ...current, partnerProject: value }))}
            />

            <SelectField
              label="Expense Type"
              required
              value={form.expenseType}
              placeholder="Select..."
              options={EXPENSE_TYPE_OPTIONS}
              onChange={(value) => setForm((current) => ({ ...current, expenseType: value }))}
            />

            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Quantity<Text style={styles.requiredMark}> *</Text></Text>
              <TextInput
                style={[styles.input, { borderBottomColor: colors.border, color: colors.textPrimary }]}
                value={form.quantity}
                onChangeText={(value) => setForm((current) => ({ ...current, quantity: value }))}
                placeholder="1"
                keyboardType="number-pad"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldBlock, styles.flexOne]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Unit Value<Text style={styles.requiredMark}> *</Text></Text>
                <TextInput
                  style={[styles.input, { borderBottomColor: colors.border, color: colors.textPrimary }]}
                  value={form.unitValue}
                  onChangeText={(value) => setForm((current) => ({ ...current, unitValue: value }))}
                  placeholder="Unit Value"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.fieldBlock, styles.currencyField]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Currency<Text style={styles.requiredMark}> *</Text></Text>
                <SelectField
                  label=""
                  value={form.currency}
                  placeholder="EUR"
                  options={CURRENCY_OPTIONS}
                  onChange={(value) => setForm((current) => ({ ...current, currency: value }))}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Observations</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderBottomColor: colors.border, color: colors.textPrimary }]}
                value={form.observations}
                onChangeText={(value) => setForm((current) => ({ ...current, observations: value }))}
                placeholder="Observations"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.checkboxRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Expense in Representation of?</Text>
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
                onPress={() => closeAnimated(() => { onDelete(); onClose(); })}
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

  return (
    <View style={[styles.pageContainer, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Manual Expenses</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Manually register your expenses using the form below.</Text>
        </View>

        <Button
          label="New expense"
          onPress={() => setNewModalVisible(true)}
          icon={<PlusIcon size={16} color={colors.white} weight="bold" />}
          accessibilityLabel="Open form to add a new expense"
        />

        <View style={styles.entriesSection}>
          <Text style={[styles.entriesTitle, { color: colors.textSecondary }]}>Recent entries</Text>

          {entries.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No expenses submitted yet.</Text>
          ) : (
            entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[styles.entryRow, { borderBottomColor: colors.border }]}
                onPress={() => setEditingEntry(entry)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Edit expense ${entry.expenseType || 'Expense'}`}
              >
                <View style={styles.entryTextBlock}>
                  <Text style={[styles.entryPrimary, { color: colors.textPrimary }]}>{entry.expenseType || 'Expense'}</Text>
                  <Text style={[styles.entrySecondary, { color: colors.textSecondary }]}>{entry.productiveProject} • {entry.date}</Text>
                </View>
                <Text style={[styles.entryAmount, { color: colors.textPrimary }]}>{entry.unitValue} {entry.currency}</Text>
              </TouchableOpacity>
            ))
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
    gap: Spacing[2],
  },
  pageTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  entriesSection: {
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  entriesTitle: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  emptyText: {
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    paddingVertical: Spacing[2],
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing[3],
    gap: Spacing[4],
  },
  entryTextBlock: {
    flex: 1,
    gap: Spacing[1],
  },
  entryPrimary: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  entrySecondary: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  entryAmount: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
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
  inputPressable: {
    minHeight: 42,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: Colors.border,
    paddingHorizontal: 0,
    paddingVertical: Spacing[2] + 2,
    justifyContent: 'center',
  },
  iosDatePickerWrap: {
    marginTop: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  iosDatePickerDoneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  iosDatePickerDoneText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 110,
    paddingTop: Spacing[2] + 2,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  helperText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  selectTrigger: {
    minHeight: 42,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: Colors.border,
    paddingHorizontal: 0,
    paddingVertical: Spacing[2] + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectTriggerText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  caretOpen: {
    transform: [{ rotate: '180deg' }],
  },
  selectMenu: {
    marginTop: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  selectItem: {
    minHeight: 42,
    paddingHorizontal: Spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  selectItemText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  selectItemTextActive: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
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
