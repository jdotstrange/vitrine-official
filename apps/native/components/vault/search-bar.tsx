import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

import { useTheme, RADII, TYPE } from '@/lib/design';

/**
 * SearchBar — V3 text-input primitive for search/filter surfaces.
 *
 * Distinct from a generic TextField: the leading search glyph and the
 * trailing clear affordance are part of the component's identity. If a
 * surface needs an input without those, it should build its own input, not
 * bend this one.
 *
 * Styling: sheet-filled frost rectangle, matching the Collector Profile V3
 * toolbar pattern. This is the canonical V3 search control for collection,
 * showcase, and search surfaces.
 *
 * Imperative ref: exposes `focus()` and `blur()` so parent surfaces can
 * drive focus programmatically (e.g. Market Surface's drawer transition).
 */

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onFocus?: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onBlur?: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmit?: () => void;
  style?: ViewStyle;
}

export interface SearchBarHandle {
  focus: () => void;
  blur: () => void;
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(function SearchBar(
  {
    value,
    onChange,
    onClear,
    onFocus,
    onBlur,
    placeholder = 'Search',
    autoFocus = false,
    returnKeyType = 'search',
    onSubmit,
    style,
  },
  ref,
) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur:  () => inputRef.current?.blur(),
  }));

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }, style]}>
      <Search size={16} color={colors.textSecondary} strokeWidth={1.75} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { color: colors.textPrimary }]}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={handleClear}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={({ pressed }) => [
            styles.clearButton,
            { backgroundColor: colors.textSecondary },
            pressed && styles.clearPressed,
          ]}
        >
          <X size={11} color={colors.textInverse} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: RADII.medium,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 14,
    padding: 0,
    includeFontPadding: false,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPressed: {
    opacity: 0.75,
  },
});
