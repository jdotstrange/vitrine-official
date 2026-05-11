import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { useState, useMemo } from 'react';
import { X, Plus, Check, Sparkles } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../search-bar';

export interface ShowcaseOption {
  id: string;
  name: string;
  itemCount: number;
}

interface ShowcasePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: ShowcaseOption | null;
  onSelect: (showcase: ShowcaseOption | null) => void;
  showcases: ShowcaseOption[];
}

export function ShowcasePickerModal({
  isOpen,
  onClose,
  selected,
  onSelect,
  showcases,
}: ShowcasePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    return showcases.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [showcases, search]);

  const handleClose = () => {
    setSearch('');
    setShowCreate(false);
    setNewName('');
    onClose();
  };

  const handleCreate = () => {
    if (newName.trim()) {
      const newShowcase: ShowcaseOption = {
        id: Math.random().toString(36).substring(7),
        name: newName.trim(),
        itemCount: 0,
      };
      onSelect(newShowcase);
      handleClose();
    }
  };

  const handleSelect = (showcase: ShowcaseOption) => {
    onSelect(showcase);
    handleClose();
  };

  const handleSelectNone = () => {
    onSelect(null);
    handleClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      accessibilityViewIsModal
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.overlay} />
        <View style={[styles.content, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <X size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.title}>Select Showcase</Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.searchContainer}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search showcases..."
              showClear
            />
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {!showCreate ? (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => setShowCreate(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Create new showcase"
              >
                <View style={styles.listItemIcon}>
                  <Plus size={20} color={colors.primary} />
                </View>
                <Text style={styles.listItemTextPrimary}>Create New Showcase</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.listItem}>
                <View style={styles.createInputRow}>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputOverlay} />
                    <TextInput
                      style={styles.input}
                      placeholder="Showcase name..."
                      placeholderTextColor={colors.mutedForeground}
                      value={newName}
                      onChangeText={setNewName}
                      autoFocus
                      accessibilityLabel="Showcase name"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.createButton, !newName.trim() && styles.createButtonDisabled]}
                    onPress={handleCreate}
                    disabled={!newName.trim()}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Create showcase"
                  >
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {filtered.map((showcase) => (
              <TouchableOpacity
                key={showcase.id}
                style={styles.listItem}
                onPress={() => handleSelect(showcase)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Select ${showcase.name} showcase`}
              >
                <View style={styles.listItemIcon}>
                  <Sparkles size={20} color={colors.mutedForeground} />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemText}>{showcase.name}</Text>
                  <Text style={styles.listItemSubtext}>{showcase.itemCount} items</Text>
                </View>
                {selected?.id === showcase.id && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.listItem}
              onPress={handleSelectNone}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="No showcase"
            >
              <Text style={[styles.listItemText, { color: colors.mutedForeground }]}>No showcase</Text>
              {selected === null && <Check size={20} color={colors.primary} />}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  spacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 16,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  listItemTextPrimary: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  listItemSubtext: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  createInputRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  inputContainer: {
    flex: 1,
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
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
});
