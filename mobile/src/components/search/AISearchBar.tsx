import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, Search, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

interface AISearchBarProps {
  onSearch: (query: string) => void;
  onAISearch: (query: string) => void;
  isLoading?: boolean;
}

export function AISearchBar({ onSearch, onAISearch, isLoading }: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);

  const handleSubmit = () => {
    if (!query.trim()) return;
    if (isAIMode) {
      onAISearch(query.trim());
    } else {
      onSearch(query.trim());
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Search size={20} color={colors.text.muted} strokeWidth={1.5} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={isAIMode ? 'Describe what you\'re looking for...' : 'Search tutors...'}
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X size={18} color={colors.text.muted} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        {isLoading && <ActivityIndicator size="small" color={colors.primary.blue} />}
      </View>
      <TouchableOpacity
        onPress={() => setIsAIMode(!isAIMode)}
        style={[styles.aiToggle, isAIMode && styles.aiToggleActive]}
      >
        <Sparkles size={18} color={isAIMode ? colors.white : colors.primary.blue} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.low,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.text.body,
  },
  aiToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiToggleActive: {
    backgroundColor: colors.primary.blue,
  },
});
