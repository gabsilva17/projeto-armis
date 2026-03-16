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
  const isEditMode = !!initialEntry;
  const { mounted, slideY, backdropOpacity, animateClose } = useSlideUpModalAnimation({
    visible,
    screenHeight: SCREEN_HEIGHT,
  });

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
    if (isSaveDisabled) return;
    onSave(form);
    animateClose(onClose);
  };

  const handleDateChange = (date: Date) => {
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
            <DateField
              label="Date"
              required
              value={form.date}
              placeholder="mm/dd/yyyy"
              selectedDate={selectedDate}
              accessibilityLabel="Select expense date"
              onChangeDate={handleDateChange}
            />

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
              optionToValue={(option) => (option === 'None' ? '' : option)}
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
              <TextField
                label="Quantity"
                required
                value={form.quantity}
                onChangeText={(value) => setForm((current) => ({ ...current, quantity: value }))}
                placeholder="1"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldBlock, styles.flexOne]}>
                <TextField
                  label="Unit Value"
                  required
                  value={form.unitValue}
                  onChangeText={(value) => setForm((current) => ({ ...current, unitValue: value }))}
                  placeholder="Unit Value"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.fieldBlock, styles.currencyField]}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Currency<Text style={styles.requiredMark}> *</Text></Text>
                <SelectField
                  value={form.currency}
                  placeholder="EUR"
                  options={CURRENCY_OPTIONS}
                  accessibilityLabel="Currency"
                  onChange={(value) => setForm((current) => ({ ...current, currency: value }))}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <TextField
                label="Observations"
                value={form.observations}
                onChangeText={(value) => setForm((current) => ({ ...current, observations: value }))}
                placeholder="Observations"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={styles.textArea}
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
