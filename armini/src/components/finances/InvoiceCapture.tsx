import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useTopbarRefresh } from '@/src/hooks/useTopbarRefresh';
import { Colors, Spacing, Typography } from '@/src/theme';
import { CheckIcon, ReceiptIcon, SparkleIcon } from 'phosphor-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { CaptureButtons } from './CaptureButtons';
import { PhotoPreview } from './PhotoPreview';
import { SubmitButton } from './SubmitButton';
import { useInvoiceCapture } from '@/src/hooks/useInvoiceCapture';
import type { InvoiceData } from '@/src/types/finances.types';

const SUBMIT_SCROLL_TOP_OFFSET = Spacing[5];

function InvoiceDataRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

function InvoiceDataCard({ data }: { data: InvoiceData }) {
  const hasLineItems = data.lineItems.length > 0;

  return (
    <View style={styles.dataCard}>
      <Text style={styles.dataCardTitle}>Extracted Data</Text>

      {data.summary && (
        <Text style={styles.summaryText}>{data.summary}</Text>
      )}

      <InvoiceDataRow label="Vendor" value={data.vendor} />
      <InvoiceDataRow label="Invoice #" value={data.invoiceNumber} />
      <InvoiceDataRow label="Date" value={data.date} />
      <InvoiceDataRow
        label="Total"
        value={data.totalAmount ? `${data.totalAmount} ${data.currency ?? ''}`.trim() : null}
      />
      <InvoiceDataRow label="Tax/VAT" value={data.taxAmount} />

      {hasLineItems && (
        <View style={styles.lineItemsSection}>
          <Text style={styles.lineItemsTitle}>Line Items</Text>
          {data.lineItems.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <Text style={styles.lineItemDesc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.lineItemAmount}>{item.amount}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function InvoiceCapture() {
  const scrollRef = useRef<ScrollView>(null);
  const submitSectionYRef = useRef(0);
  const previousPhotoUriRef = useRef<string | null>(null);

  const {
    photoUri,
    isSubmitting,
    isSuccess,
    isError,
    referenceId,
    invoiceData,
    error,
    takePhoto,
    pickFromLibrary,
    clearPhoto,
    submitInvoice,
    reset,
  } = useInvoiceCapture();

  const handleRefresh = useCallback(() => {
    reset();
  }, [reset]);

  const handleSubmitSectionLayout = useCallback((event: LayoutChangeEvent) => {
    submitSectionYRef.current = event.nativeEvent.layout.y;
  }, []);

  useEffect(() => {
    if (photoUri && photoUri !== previousPhotoUriRef.current) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, submitSectionYRef.current - SUBMIT_SCROLL_TOP_OFFSET),
          animated: true,
        });
      }, 100);

      previousPhotoUriRef.current = photoUri;
      return () => clearTimeout(timer);
    }

    previousPhotoUriRef.current = photoUri;
  }, [photoUri]);

  useTopbarRefresh(handleRefresh);

  if (isSuccess) {
    return (
      <ScrollView
        contentContainerStyle={styles.successContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <CheckIcon size={36} color={Colors.white} />
          </View>

          <View style={styles.successTitleRow}>
            <Text style={styles.successTitle}>Invoice Processed</Text>
            <SparkleIcon size={18} color={Colors.textPrimary} weight="fill" />
          </View>

          <View style={styles.referencePill}>
            <Text style={styles.referenceLabel}>Reference</Text>
            <Text style={styles.successRef}>{referenceId}</Text>
          </View>
        </View>

        {invoiceData && <InvoiceDataCard data={invoiceData} />}

        <Button
          variant="secondary"
          onPress={reset}
          label="Submit Another"
          style={styles.newButton}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Capture and submit invoices</Text>
        <Text style={styles.heroSubtitle}>
          Use camera or gallery, review extracted fields, and submit in seconds.
        </Text>
      </View>

      {!photoUri ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={ReceiptIcon}
            title="No invoice selected"
            subtitle="Take a photo or choose one from your library to get started."
          />
        </View>
      ) : (
        <PhotoPreview uri={photoUri} onRemove={clearPhoto} />
      )}

      <CaptureButtons
        hasPhoto={!!photoUri}
        onTakePhoto={takePhoto}
        onPickLibrary={pickFromLibrary}
      />

      {photoUri && (
        <View onLayout={handleSubmitSectionLayout}>
          <Text style={styles.sectionTitle}>Submit</Text>
          <SubmitButton
            onPress={submitInvoice}
            isLoading={isSubmitting}
            disabled={!photoUri || isSubmitting}
          />
        </View>
      )}

      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Submission failed</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[16],
  },
  heroSection: {
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[1],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  heroEyebrow: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    marginHorizontal: Spacing[1],
    marginBottom: Spacing[4],
    minHeight: 280,
  },
  successContent: {
    flexGrow: 1,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[16],
  },
  successHeader: {
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[4],
    alignItems: 'center',
    gap: Spacing[3],
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  successTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  successTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  referencePill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  successRef: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  newButton: {
    marginTop: Spacing[4],
    marginHorizontal: Spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[3],
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  sectionPill: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  sectionPillText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  dataCard: {
    marginHorizontal: Spacing[6],
    marginTop: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing[5],
    gap: Spacing[3],
  },
  dataCardTitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  summaryText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing[2],
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
  },
  dataValue: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: Spacing[4],
  },
  lineItemsSection: {
    marginTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing[3],
    gap: Spacing[2],
  },
  lineItemsTitle: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemDesc: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing[3],
  },
  lineItemAmount: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
  },
  errorText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    marginHorizontal: Spacing[6],
    marginTop: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[1],
  },
  errorTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
