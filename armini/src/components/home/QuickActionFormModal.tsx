import { Button } from '@/src/components/ui/Button';
import { SelectField } from '@/src/components/ui/SelectField';
import { TextField } from '@/src/components/ui/TextField';
import {
  ACTION_TYPE_LABELS,
  ACTION_TYPE_OPTIONS,
  MAX_DESCRIPTION_LENGTH,
  MAX_PROMPT_LENGTH,
  MAX_TITLE_LENGTH,
  NAVIGABLE_ROUTES,
  NAVIGABLE_ROUTE_VALUES,
} from '@/src/constants/quickActions.constants';
import { useSlideUpModalAnimation } from '@/src/hooks/useSlideUpModalAnimation';
import { useQuickActionsStore } from '@/src/stores/useQuickActionsStore';
import { Spacing, Typography, useTheme } from '@/src/theme';
import type { QuickAction, QuickActionType } from '@/src/types/quickActions.types';
import { XIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickActionFormModalProps {
  visible: boolean;
  /** Quando definido, o modal abre em modo de edição */
  editAction?: QuickAction | null;
  onClose: () => void;
}

export function QuickActionFormModal({ visible, editAction, onClose }: QuickActionFormModalProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const addAction = useQuickActionsStore((s) => s.addAction);
  const updateAction = useQuickActionsStore((s) => s.updateAction);
  const scrollRef = useRef<ScrollView>(null);

  const isEditing = !!editAction;

  const { mounted, slideY, backdropOpacity, animateClose } = useSlideUpModalAnimation({
    visible,
    screenHeight: SCREEN_HEIGHT,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<QuickActionType>('navigate');
  const [route, setRoute] = useState('');
  const [chatPrompt, setChatPrompt] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Preencher formulário quando entra em modo edição
  useEffect(() => {
    if (visible && editAction) {
      setTitle(editAction.title);
      setDescription(editAction.description);
      setActionType(editAction.type);
      setRoute(editAction.route ?? '');
      setChatPrompt(editAction.chatPrompt ?? '');
    }
  }, [visible, editAction]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const canSave =
    title.trim().length > 0 &&
    (actionType === 'navigate'
      ? route.length > 0
      : actionType === 'chat-prompt'
        ? chatPrompt.trim().length > 0
        : true);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setActionType('navigate');
    setRoute('');
    setChatPrompt('');
  };

  const handleClose = () => {
    Keyboard.dismiss();
    animateClose(() => {
      resetForm();
      onClose();
    });
  };

  const handleSave = () => {
    if (!canSave) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type: actionType,
      route: actionType === 'navigate' ? route : undefined,
      chatPrompt: actionType === 'chat-prompt' ? chatPrompt.trim() : undefined,
    };

    if (isEditing) {
      updateAction(editAction.id, payload);
    } else {
      addAction(payload);
    }

    Keyboard.dismiss();
    animateClose(() => {
      resetForm();
      onClose();
    });
  };

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: 'rgba(0,0,0,0.5)' }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom + Spacing[4],
              transform: [{ translateY: slideY }],
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {isEditing ? 'Edit Quick Action' : 'New Quick Action'}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <XIcon size={20} weight="bold" color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextField
              label="Title"
              required
              placeholder="e.g. Submit invoice"
              value={title}
              onChangeText={(t) => setTitle(t.slice(0, MAX_TITLE_LENGTH))}
              maxLength={MAX_TITLE_LENGTH}
              accessibilityLabel="Quick action title"
            />

            <TextField
              label="Description"
              placeholder="Optional short description"
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, MAX_DESCRIPTION_LENGTH))}
              maxLength={MAX_DESCRIPTION_LENGTH}
              accessibilityLabel="Quick action description"
            />

            <SelectField
              label="Action type"
              required
              value={ACTION_TYPE_LABELS[actionType]}
              placeholder="Select action type"
              options={[...ACTION_TYPE_OPTIONS]}
              getOptionLabel={(opt) => ACTION_TYPE_LABELS[opt]}
              optionToValue={(opt) => opt}
              onChange={(val) => setActionType(val as QuickActionType)}
              searchable={false}
              accessibilityLabel="Action type"
            />

            {actionType === 'navigate' ? (
              <SelectField
                label="Destination"
                required
                value={NAVIGABLE_ROUTES.find((r) => r.value === route)?.label ?? ''}
                placeholder="Select screen"
                options={NAVIGABLE_ROUTE_VALUES}
                getOptionLabel={(opt) => NAVIGABLE_ROUTES.find((r) => r.value === opt)?.label ?? opt}
                optionToValue={(opt) => opt}
                onChange={setRoute}
                searchable={false}
                accessibilityLabel="Destination screen"
              />
            ) : null}

            {actionType === 'chat-prompt' ? (
              <TextField
                label="Chat prompt"
                required
                placeholder="e.g. Show me this week's hours"
                value={chatPrompt}
                onChangeText={(t) => setChatPrompt(t.slice(0, MAX_PROMPT_LENGTH))}
                maxLength={MAX_PROMPT_LENGTH}
                multiline
                numberOfLines={3}
                accessibilityLabel="Chat prompt text"
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            ) : null}

            <View style={styles.buttonRow}>
              <Button label="Save" onPress={handleSave} disabled={!canSave} />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.bold,
  },
  formContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[4],
    gap: Spacing[5],
  },
  buttonRow: {
    marginTop: Spacing[2],
  },
});
