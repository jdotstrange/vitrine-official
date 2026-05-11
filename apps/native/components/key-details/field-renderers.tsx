import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { BottomSheetPicker } from '../ui/bottom-sheet-picker';
import type {
  TextField,
  TextAreaField,
  ListField,
  SingleSelectField,
  MultiSelectField,
  ToggleField,
  DropdownField,
} from '@/lib/field-configs';

export type FieldValue = string | string[] | boolean;

interface FieldRendererProps {
  field: TextField | TextAreaField | ListField | SingleSelectField | MultiSelectField | ToggleField | DropdownField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  error?: string;
  hasStoredValue?: boolean;
}

function StoredDot() {
  return (
    <View style={{
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.holoGreen,
      marginLeft: 6,
      marginBottom: 1,
    }} />
  );
}

// Text Field
export function TextFieldRenderer({ field, value, onChange, hasStoredValue }: FieldRendererProps) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>
        {hasStoredValue && <StoredDot />}
      </View>
      <View style={styles.inputWrapper}>
        <View style={styles.inputOverlay} />
        <TextInput
          style={styles.input}
          value={value || ''}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor={colors.mutedForeground}
          maxLength={field.maxLength}
          accessibilityLabel={field.label}
        />
      </View>
    </View>
  );
}

// TextArea Field
export function TextAreaFieldRenderer({ field, value, onChange, hasStoredValue }: FieldRendererProps) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>
        {hasStoredValue && <StoredDot />}
      </View>
      <View style={styles.inputWrapper}>
        <View style={styles.inputOverlay} />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={value || ''}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor={colors.mutedForeground}
          maxLength={field.maxLength}
          multiline
          numberOfLines={field.rows || 4}
          textAlignVertical="top"
          accessibilityLabel={field.label}
        />
      </View>
    </View>
  );
}

// List Field (for signatures, etc.)
export function ListFieldRenderer({ field, value, onChange, hasStoredValue }: FieldRendererProps) {
  const [inputValue, setInputValue] = useState('');
  const items: string[] = Array.isArray(value) ? value : [];

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      if (!field.maxItems || items.length < field.maxItems) {
        onChange([...items, trimmed]);
        setInputValue('');
      }
    }
  };

  const removeItem = (item: string) => {
    onChange(items.filter((i) => i !== item));
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>
        {hasStoredValue && <StoredDot />}
      </View>
      <View style={styles.listContainer}>
        <View style={styles.inputOverlay} />
        
        {items.length > 0 && (
          <View style={styles.listItems}>
            {items.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{item}</Text>
                <TouchableOpacity
                  onPress={() => removeItem(item)}
                  style={styles.listItemRemove}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item}`}
                >
                  <X size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.listInputRow}>
          <TextInput
            style={styles.listInput}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={field.placeholder || 'Add item...'}
            placeholderTextColor={colors.mutedForeground}
            onSubmitEditing={addItem}
            returnKeyType="done"
            accessibilityLabel={`Add ${field.label}`}
          />
          <TouchableOpacity
            onPress={addItem}
            style={[styles.addItemButton, (!inputValue.trim() || (field.maxItems && items.length >= field.maxItems)) && styles.addItemButtonDisabled]}
            disabled={!inputValue.trim() || (field.maxItems && items.length >= field.maxItems)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Add ${field.label} item`}
          >
            <Plus size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Single Select Field
export function SingleSelectFieldRenderer({ field, value, onChange, hasStoredValue }: FieldRendererProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const selectedOption = field.options.find((opt) => opt.value === value);

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>
        {hasStoredValue && <StoredDot />}
      </View>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setIsPickerOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Select ${field.label}`}
      >
        <View style={styles.inputOverlay} />
        <Text style={[styles.selectButtonText, !selectedOption && styles.selectButtonTextPlaceholder]}>
          {selectedOption?.label || field.placeholder || 'Select...'}
        </Text>
        <ChevronDown size={20} color={colors.mutedForeground} />
      </TouchableOpacity>

      <BottomSheetPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        options={field.options}
        selectedValue={value || ''}
        onSelect={onChange}
        label={field.label}
      />
    </View>
  );
}

// Multi Select Field
export function MultiSelectFieldRenderer({ field, value, onChange, hasStoredValue }: FieldRendererProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const selectedValues: string[] = Array.isArray(value) ? value : [];
  const selectedOptions = field.options.filter((opt) => selectedValues.includes(opt.value));

  const toggleOption = (optionValue: string) => {
    const current: string[] = Array.isArray(value) ? value : [];
    if (current.includes(optionValue)) {
      onChange(current.filter((v) => v !== optionValue));
    } else {
      if (!field.maxSelections || current.length < field.maxSelections) {
        onChange([...current, optionValue]);
      }
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
          {field.maxSelections && (
            <Text style={styles.maxSelections}>
              {' '}({selectedValues.length}/{field.maxSelections})
            </Text>
          )}
        </Text>
        {hasStoredValue && <StoredDot />}
      </View>

      {selectedOptions.length > 0 && (
        <View style={styles.multiSelectChips}>
          {selectedOptions.map((option) => (
            <View key={option.value} style={styles.multiSelectChip}>
              <Text style={styles.multiSelectChipText}>{option.label}</Text>
              <TouchableOpacity
                onPress={() => toggleOption(option.value)}
                style={styles.multiSelectChipRemove}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${option.label}`}
              >
                <X size={12} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setIsPickerOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Select ${field.label} options`}
      >
        <View style={styles.inputOverlay} />
        <Text style={styles.selectButtonText}>
          {selectedOptions.length === 0
            ? field.placeholder || 'Select options...'
            : `Add ${selectedOptions.length === field.options.length ? 'more' : 'another'} option`}
        </Text>
        <ChevronDown size={20} color={colors.mutedForeground} />
      </TouchableOpacity>

      <BottomSheetPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        options={field.options}
        selectedValue={selectedValues[0] || ''}
        onSelect={(val) => toggleOption(val)}
        label={field.label}
      />
    </View>
  );
}

// Toggle Field
export function ToggleFieldRenderer({ field, value, onChange, hasStoredValue }: FieldRendererProps) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.toggleContainer}>
        <View style={styles.toggleLabelContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            {hasStoredValue && <StoredDot />}
          </View>
          {field.description && (
            <Text style={styles.toggleDescription}>{field.description}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.toggle, value && styles.toggleActive]}
          onPress={() => onChange(!value)}
          activeOpacity={0.7}
          accessibilityRole="switch"
          accessibilityLabel={field.label}
        >
          <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Dropdown Field
export function DropdownFieldRenderer({ field, value, onChange, hasStoredValue }: FieldRendererProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const selectedOption = field.options.find((opt) => opt.value === value);

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>
        {hasStoredValue && <StoredDot />}
      </View>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setIsPickerOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Select ${field.label}`}
      >
        <View style={styles.inputOverlay} />
        <Text style={[styles.selectButtonText, !selectedOption && styles.selectButtonTextPlaceholder]}>
          {selectedOption?.label || field.placeholder || 'Select...'}
        </Text>
        <ChevronDown size={20} color={colors.mutedForeground} />
      </TouchableOpacity>

      <BottomSheetPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        options={field.options}
        selectedValue={value || ''}
        onSelect={onChange}
        label={field.label}
        searchable={field.searchable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  required: {
    color: colors.primary,
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: colors.foreground,
    position: 'relative',
    zIndex: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  listContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  listItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary + '1A',
    borderColor: colors.primary + '4D',
    borderWidth: 1,
  },
  listItemText: {
    fontSize: 14,
    color: colors.primary,
  },
  listItemRemove: {
    padding: 2,
  },
  listInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 1,
  },
  listInput: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
    paddingVertical: 0,
  },
  addItemButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.primary + '1A',
  },
  addItemButtonDisabled: {
    opacity: 0.5,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.foreground,
    position: 'relative',
    zIndex: 1,
  },
  selectButtonTextPlaceholder: {
    color: colors.mutedForeground,
  },
  multiSelectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  multiSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary + '1A',
    borderColor: colors.primary + '4D',
    borderWidth: 1,
  },
  multiSelectChipText: {
    fontSize: 14,
    color: colors.primary,
  },
  multiSelectChipRemove: {
    padding: 2,
  },
  maxSelections: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.mutedForeground,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    backgroundColor: colors.background,
    alignSelf: 'flex-end',
  },
});
