/**
 * Fields API
 * Handles fetching field configurations for categories
 * 
 * Now uses direct Supabase queries instead of Railway backend
 */

import { supabase } from '@/lib/supabase';
import { logger } from '../logger';

const log = logger.create('API');

/**
 * Field Option
 */
export interface FieldOption {
  value: string;
  label: string;
  order: number;
  visible: boolean;
}

/**
 * Resolved Field (from API)
 */
export interface ResolvedField {
  id: string;
  level: 'type' | 'category' | 'subcategory';
  fieldType: string;
  label: string;
  required: boolean;
  placeholder?: string;
  sectionTitle?: string;
  order: number;
  options?: FieldOption[];
  minValue?: number;
  maxValue?: number;
  step?: number;
  unit?: string;
}

/**
 * Resolved Fields Response
 */
export interface ResolvedFieldsResponse {
  path: string;
  fields: ResolvedField[];
}

/**
 * Resolve fields for a category path
 * 
 * @param typeCode - Type code (e.g., "baseball")
 * @param categoryCode - Category code (e.g., "jersey")
 * @param subcategoryCode - Optional subcategory code
 * @returns Resolved fields with all configurations
 */
export async function resolveFields(
  typeCode: string,
  categoryCode: string,
  subcategoryCode?: string
): Promise<ResolvedFieldsResponse> {
  log.debug('Resolving fields for:', { typeCode, categoryCode, subcategoryCode });

  try {
    // Get type ID from code
    const { data: typeData, error: typeError } = await supabase
      .from('category_types')
      .select('id')
      .eq('code', typeCode)
      .single();

    if (typeError || !typeData) {
      log.error('Type not found:', typeCode);
      throw new Error(`Type not found: ${typeCode}`);
    }

    // Get category ID from code
    const { data: categoryData, error: categoryError } = await supabase
      .from('category_categories')
      .select('id')
      .eq('code', categoryCode)
      .single();

    if (categoryError || !categoryData) {
      log.error('Category not found:', categoryCode);
      throw new Error(`Category not found: ${categoryCode}`);
    }

    // Get subcategory ID if provided
    let subcategoryId: string | null = null;
    if (subcategoryCode) {
      const { data: subcategoryData } = await supabase
        .from('category_subcategories')
        .select('id')
        .eq('code', subcategoryCode)
        .single();
      subcategoryId = subcategoryData?.id || null;
    }

    const resolvedFields: ResolvedField[] = [];

    // Fetch type-level fields
    const { data: typeFields, error: typeFieldsError } = await supabase
      .from('field_type_mappings')
      .select(`
        field_id,
        field_order,
        is_required,
        fields (
          id,
          field_type,
          field_label,
          placeholder,
          section_title
        )
      `)
      .eq('type_id', typeData.id)
      .order('field_order', { ascending: true });

    if (typeFieldsError) {
      log.error('Error fetching type fields:', typeFieldsError);
    }

    // Process type-level fields
    for (const mapping of (typeFields || []) as FieldMappingRow[]) {
      if (!mapping.fields) continue;

      const resolvedField = await buildResolvedField(
        mapping.fields,
        'type',
        mapping.field_order,
        mapping.is_required,
        typeCode,
        categoryCode
      );
      resolvedFields.push(resolvedField);
    }

    // Fetch category-level fields
    const { data: categoryFields, error: categoryFieldsError } = await supabase
      .from('field_category_mappings')
      .select(`
        field_id,
        field_order,
        is_required,
        fields (
          id,
          field_type,
          field_label,
          placeholder,
          section_title
        )
      `)
      .eq('category_id', categoryData.id)
      .order('field_order', { ascending: true });

    if (categoryFieldsError) {
      log.error('Error fetching category fields:', categoryFieldsError);
    }

    // Process category-level fields
    for (const mapping of (categoryFields || []) as FieldMappingRow[]) {
      if (!mapping.fields) continue;

      const resolvedField = await buildResolvedField(
        mapping.fields,
        'category',
        mapping.field_order,
        mapping.is_required,
        typeCode,
        categoryCode
      );
      resolvedFields.push(resolvedField);
    }

    // Fetch subcategory-level fields if applicable
    if (subcategoryId) {
      const { data: subcategoryFields, error: subcategoryFieldsError } = await supabase
        .from('field_subcategory_mappings')
        .select(`
          field_id,
          field_order,
          is_required,
          fields (
            id,
            field_type,
            field_label,
            placeholder,
            section_title
          )
        `)
        .eq('subcategory_id', subcategoryId)
        .order('field_order', { ascending: true });

      if (subcategoryFieldsError) {
        log.error('Error fetching subcategory fields:', subcategoryFieldsError);
      }

      // Process subcategory-level fields
      for (const mapping of (subcategoryFields || []) as FieldMappingRow[]) {
        if (!mapping.fields) continue;

        const resolvedField = await buildResolvedField(
          mapping.fields,
          'subcategory',
          mapping.field_order,
          mapping.is_required,
          typeCode,
          categoryCode
        );
        resolvedFields.push(resolvedField);
      }
    }

    // Sort all fields by order
    resolvedFields.sort((a, b) => a.order - b.order);

    const path = subcategoryCode 
      ? `${typeCode}/${categoryCode}/${subcategoryCode}`
      : `${typeCode}/${categoryCode}`;

    log.debug('Resolved fields:', {
      path,
      fieldCount: resolvedFields.length,
    });

    return {
      path,
      fields: resolvedFields,
    };
  } catch (error) {
    log.error('Error resolving fields:', error);
    throw error;
  }
}

interface FieldRecord {
  id: string;
  field_type: string;
  field_label: string;
  placeholder: string | null;
  section_title: string | null;
}

interface FieldMappingRow {
  field_id: string;
  field_order: number;
  is_required: boolean;
  fields: FieldRecord | null;
}

interface OptionVisibility {
  visible_for: string[] | null;
  hidden_for: string[] | null;
}

/**
 * Build a resolved field with options and slider config
 */
async function buildResolvedField(
  field: FieldRecord,
  level: 'type' | 'category' | 'subcategory',
  order: number,
  required: boolean,
  typeCode: string,
  categoryCode: string
): Promise<ResolvedField> {
  const resolvedField: ResolvedField = {
    id: field.id,
    level,
    fieldType: field.field_type,
    label: field.field_label,
    required,
    placeholder: field.placeholder || undefined,
    sectionTitle: field.section_title || undefined,
    order,
  };

  // Fetch options for dropdown, radio, multiselect fields
  if (['dropdown', 'radio', 'multiselect'].includes(field.field_type)) {
    const { data: options, error: optionsError } = await supabase
      .from('category_field_options')
      .select(`
        id,
        option_value,
        option_label,
        option_order,
        category_field_option_visibility (
          visible_for,
          hidden_for
        )
      `)
      .eq('field_id', field.id)
      .order('option_order', { ascending: true });

    if (!optionsError && options) {
      interface OptionRow {
        id: string;
        option_value: string;
        option_label: string;
        option_order: number;
        category_field_option_visibility: OptionVisibility[] | null;
      }

      resolvedField.options = (options as OptionRow[]).map(opt => {
        const visibility = opt.category_field_option_visibility?.[0];
        let visible = true;
        
        if (visibility) {
          const visibleFor = visibility.visible_for || [];
          const hiddenFor = visibility.hidden_for || [];
          
          if (hiddenFor.includes(typeCode) || hiddenFor.includes(categoryCode)) {
            visible = false;
          }
          else if (visibleFor.length > 0 && 
                   !visibleFor.includes(typeCode) && 
                   !visibleFor.includes(categoryCode)) {
            visible = false;
          }
        }

        return {
          value: opt.option_value,
          label: opt.option_label,
          order: opt.option_order,
          visible,
        };
      }).filter(opt => opt.visible);
    }
  }

  // Fetch slider config
  if (field.field_type === 'slider') {
    const { data: sliderConfig, error: sliderError } = await supabase
      .from('category_field_slider_config')
      .select('min_value, max_value, step, unit')
      .eq('field_id', field.id)
      .single();

    if (!sliderError && sliderConfig) {
      resolvedField.minValue = Number(sliderConfig.min_value);
      resolvedField.maxValue = Number(sliderConfig.max_value);
      resolvedField.step = Number(sliderConfig.step);
      resolvedField.unit = sliderConfig.unit || undefined;
    }
  }

  return resolvedField;
}
