import { useTheme } from '@/src/theme';
import { useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { GreetingHeader } from './GreetingHeader';
import { SuggestionChips } from './SuggestionChips';
import { ChatMessage } from './ChatMessage';
import { LoadingDots } from './LoadingDots';
import type { Message, SuggestionChip } from '@/src/types/chat.types';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  greeting: string;
  messageOfDay: string;
  suggestions: SuggestionChip[];
  onSuggestionSelect: (prompt: string) => void;
}

export function ChatMessageList({
  messages,
  isLoading,
  greeting,
  messageOfDay,
  suggestions,
  onSuggestionSelect,
}: ChatMessageListProps) {
  const colors = useTheme();
  const listRef = useRef<FlatList>(null);
  const showSuggestions = messages.length === 0;

  if (showSuggestions) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <GreetingHeader greeting={greeting} messageOfDay={messageOfDay} />
        <SuggestionChips chips={suggestions} onSelect={onSuggestionSelect} />
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChatMessage message={item} />}
      ListFooterComponent={isLoading ? <LoadingDots /> : null}
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
  },
  list: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
    flexGrow: 1,
  },
});
