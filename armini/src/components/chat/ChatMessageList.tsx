import { useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { GreetingHeader } from './GreetingHeader';
import { SuggestionChips } from './SuggestionChips';
import { ChatDropdownSelector } from './ChatDropdownSelector';
import { ChatMessage } from './ChatMessage';
import { LoadingDots } from './LoadingDots';
import { Spacing, useTheme } from '@/src/theme';
import type { ChatDropdown, Message, SuggestionChip, ExpenseActionType } from '@/src/types/chat.types';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  greeting: string;
  messageOfDay: string;
  suggestions: SuggestionChip[];
  dropdown: ChatDropdown | null;
  onSuggestionSelect: (prompt: string) => void;
  onDropdownSelect: (value: string) => void;
  onExpenseAction?: (actionType: ExpenseActionType) => void;
}

export function ChatMessageList({
  messages,
  isLoading,
  greeting,
  messageOfDay,
  suggestions,
  dropdown,
  onSuggestionSelect,
  onDropdownSelect,
  onExpenseAction,
}: ChatMessageListProps) {
  const colors = useTheme();
  const listRef = useRef<FlatList>(null);

  const lastMessage = messages[messages.length - 1];
  const showSuggestions = !isLoading && lastMessage?.sender === 'ai';

  if (messages.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}> 
        <GreetingHeader greeting={greeting} messageOfDay={messageOfDay} />
        {isLoading ? <LoadingDots /> : null}
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChatMessage message={item} onExpenseAction={onExpenseAction} />}
      ListFooterComponent={
        <>
          {isLoading ? <LoadingDots /> : null}
          {showSuggestions && dropdown ? (
            <ChatDropdownSelector dropdown={dropdown} onSelect={onDropdownSelect} />
          ) : null}
          {showSuggestions ? (
            <SuggestionChips chips={suggestions} onSelect={onSuggestionSelect} />
          ) : null}
        </>
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      style={[styles.list, { backgroundColor: colors.background }]}
      maxToRenderPerBatch={10}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    paddingHorizontal: Spacing[1],
  },
  list: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing[5],
    paddingHorizontal: Spacing[1],
    paddingBottom: 16,
    flexGrow: 1,
  },
});
