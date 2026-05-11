import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useRef } from 'react';
import { Search, Mic, X } from 'lucide-react-native';
import { colors } from '@/lib/colors';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  showVoice?: boolean;
  showClear?: boolean;
  onVoiceToggle?: (isListening: boolean) => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  showVoice = false,
  showClear = true,
  onVoiceToggle,
  autoFocus = false,
}: SearchBarProps) {
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleVoiceToggle = () => {
    const newListening = !isListening;
    setIsListening(newListening);
    onVoiceToggle?.(newListening);
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <View style={styles.inputContainer}>
      <Search size={17} color={colors.mutedForeground} />

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={isListening ? 'Listening...' : placeholder}
        placeholderTextColor={colors.mutedForeground}
        autoFocus={autoFocus}
        style={styles.input}
      />

      {showClear && value ? (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <View style={styles.clearIcon}>
            <X size={12} color={colors.background} strokeWidth={3} />
          </View>
        </TouchableOpacity>
      ) : null}

      {showVoice && (
        <TouchableOpacity
          onPress={handleVoiceToggle}
          style={[
            styles.voiceButton,
            isListening && styles.voiceButtonActive,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Mic
            size={15}
            color={isListening ? colors.accentForeground : colors.mutedForeground}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 16,
    minWidth: 0,
    padding: 0,
  },
  clearButton: {
    padding: 2,
  },
  clearIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.mutedForeground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    padding: 6,
    borderRadius: 10,
  },
  voiceButtonActive: {
    backgroundColor: colors.accent,
  },
});
