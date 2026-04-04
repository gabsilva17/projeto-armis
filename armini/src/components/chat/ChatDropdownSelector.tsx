import { Spacing, Typography, useTheme } from '@/src/theme';
import { CaretDownIcon, MagnifyingGlassIcon } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ChatDropdown } from '@/src/types/chat.types';

interface ChatDropdownSelectorProps {
  dropdown: ChatDropdown;
  onSelect: (value: string) => void;
}

const SEARCH_THRESHOLD = 6;

export function ChatDropdownSelector({ dropdown, onSelect }: ChatDropdownSelectorProps) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const searchable = dropdown.options.length >= SEARCH_THRESHOLD;

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return dropdown.options;
    const query = search.toLowerCase().trim();
    return dropdown.options.filter((o) => o.label.toLowerCase().includes(query));
  }, [dropdown.options, search, searchable]);

  const handleToggle = () => {
    setOpen((prev) => {
      if (prev) setSearch('');
      return !prev;
    });
  };

  const handleSelect = (value: string) => {
    setSearch('');
    setOpen(false);
    onSelect(value);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.75}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={dropdown.label}
      >
        <Text style={[styles.triggerText, { color: colors.textMuted }]}>
          {dropdown.label}
        </Text>
        <CaretDownIcon size={16} color={colors.textMuted} style={open && styles.caretOpen} />
      </TouchableOpacity>

      {open && (
        <View style={[styles.menu, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {searchable && (
            <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
              <MagnifyingGlassIcon size={14} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          )}
          {filteredOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.item,
                index < filteredOptions.length - 1 && [styles.itemBorder, { borderBottomColor: colors.border }],
              ]}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.75}
            >
              <Text style={[styles.itemText, { color: colors.textPrimary }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          {searchable && filteredOptions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No results</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[3],
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: 12,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
    flexShrink: 1,
  },
  caretOpen: {
    transform: [{ rotate: '180deg' }],
  },
  menu: {
    marginTop: Spacing[2],
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    paddingVertical: Spacing[1],
  },
  item: {
    minHeight: 42,
    paddingHorizontal: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyState: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
