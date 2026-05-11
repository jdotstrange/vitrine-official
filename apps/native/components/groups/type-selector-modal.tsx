import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { ArrowLeft, X, Check, Layers, ChevronRight, Search } from 'lucide-react-native';
import { SearchBar } from '../search-bar';
import { colors } from '@/lib/colors';
import type { CategoryType, Category } from '@/lib/contexts/category-context';

export interface TypeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  modalStep: 'types' | 'categories';
  onBack: () => void;
  selectedType: CategoryType | null;
  categoriesLoading: boolean;
  filteredTypes: CategoryType[];
  filteredCategories: Category[];
  categoryTypesCount: number;
  modalSearchQuery: string;
  onSearchChange: (text: string) => void;
  onTypeSelect: (type: CategoryType) => void;
  onCategorySelect: (category?: { code: string; title: string }) => void;
}

export function TypeSelectorModal({
  visible,
  onClose,
  modalStep,
  onBack,
  selectedType,
  categoriesLoading,
  filteredTypes,
  filteredCategories,
  categoryTypesCount,
  modalSearchQuery,
  onSearchChange,
  onTypeSelect,
  onCategorySelect,
}: TypeSelectorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              {modalStep === 'categories' && (
                <TouchableOpacity
                  onPress={onBack}
                  style={styles.modalBackButton}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ArrowLeft size={16} color={colors.foreground} />
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {modalStep === 'types' ? 'Select Type' : selectedType?.title || 'Select Category'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close type selector"
            >
              <X size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.modalSearch}>
            <SearchBar
              value={modalSearchQuery}
              onChange={onSearchChange}
              placeholder={modalStep === 'types' ? 'Search types...' : 'Search categories...'}
              showClear
            />
          </View>

          {/* List */}
          <ScrollView
            style={styles.modalList}
            contentContainerStyle={styles.modalListContent}
            showsVerticalScrollIndicator={false}
          >
            {categoriesLoading ? (
              <View style={styles.modalEmpty}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalEmptyText}>Loading categories...</Text>
              </View>
            ) : modalStep === 'types' ? (
              <>
                {filteredTypes.length > 0 ? (
                  filteredTypes.map((type) => {
                    const Icon = type.icon || Layers;
                    return (
                      <TouchableOpacity
                        key={type.code}
                        onPress={() => onTypeSelect(type)}
                        style={styles.modalItem}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${type.title} type`}
                      >
                        <View style={styles.modalItemIcon}>
                          <Icon size={20} color={colors.mutedForeground} />
                        </View>
                        <View style={styles.modalItemText}>
                          <Text style={styles.modalItemTitle}>{type.title}</Text>
                          <Text style={styles.modalItemSubtitle}>{type.categories?.length || 0} categories</Text>
                        </View>
                        <ChevronRight size={20} color="rgba(153, 153, 170, 0.6)" />
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.modalEmpty}>
                    <Search size={32} color="rgba(153, 153, 170, 0.3)" />
                    <Text style={styles.modalEmptyText}>
                      {categoryTypesCount === 0 ? 'No categories available' : 'No types found'}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {/* Skip category option */}
                <TouchableOpacity
                  onPress={() => onCategorySelect()}
                  style={[styles.modalItem, styles.modalItemSkip]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Skip category selection"
                >
                  <View style={[styles.modalItemIcon, styles.modalItemIconSkip]}>
                    <Check size={20} color={colors.primary} />
                  </View>
                  <View style={styles.modalItemText}>
                    <Text style={[styles.modalItemTitle, styles.modalItemTitleSkip]}>
                      Skip - Use type only
                    </Text>
                    <Text style={styles.modalItemSubtitle}>Category is optional</Text>
                  </View>
                </TouchableOpacity>

                {filteredCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <TouchableOpacity
                      key={category.code}
                      onPress={() => onCategorySelect({ code: category.code, title: category.title })}
                      style={styles.modalItem}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${category.title} category`}
                    >
                      <View style={[styles.modalItemIcon, styles.modalItemIconSelected]}>
                        <Icon size={20} color={colors.primary} />
                      </View>
                      <View style={styles.modalItemText}>
                        <Text style={styles.modalItemTitle}>{category.title}</Text>
                      </View>
                      <ChevronRight size={20} color="rgba(153, 153, 170, 0.6)" />
                    </TouchableOpacity>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <View style={styles.modalEmpty}>
                    <Search size={32} color="rgba(153, 153, 170, 0.3)" />
                    <Text style={styles.modalEmptyText}>No categories found</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 448,
    maxHeight: '80%',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 70, 0.5)',
    overflow: 'hidden',
    flexDirection: 'column',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalBackButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearch: {
    padding: 8,
    paddingBottom: 16,
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  modalListContent: {
    paddingBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 70, 0.3)',
    backgroundColor: 'rgba(25, 25, 35, 0.9)',
    marginBottom: 8,
    marginHorizontal: 8,
  },
  modalItemSkip: {
    borderColor: colors.primary + '4D',
    backgroundColor: colors.primary + '0D',
  },
  modalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 30, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 70, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemIconSkip: {
    backgroundColor: colors.primary + '33',
    borderColor: colors.primary + '4D',
  },
  modalItemIconSelected: {
    backgroundColor: colors.primary + '1A',
    borderColor: colors.primary + '33',
  },
  modalItemText: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  modalItemTitleSkip: {
    color: colors.primary,
  },
  modalItemSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  modalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  modalEmptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 12,
  },
});
