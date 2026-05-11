// Field configuration types for dynamic key details forms
// Now supports fetching from API with fallback to mock data

import { resolveFields, type ResolvedField } from './api/fields';
import { logger } from './logger';

const log = logger.create('FieldConfigs');

export interface BaseField {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

export interface TextField extends BaseField {
  type: 'text';
  maxLength?: number;
}

export interface TextAreaField extends BaseField {
  type: 'textarea';
  maxLength?: number;
  rows?: number;
}

export interface ListField extends BaseField {
  type: 'list';
  maxItems?: number;
}

export interface SingleSelectField extends BaseField {
  type: 'single-select';
  options: { value: string; label: string }[];
}

export interface MultiSelectField extends BaseField {
  type: 'multi-select';
  options: { value: string; label: string }[];
  maxSelections?: number;
}

export interface ToggleField extends BaseField {
  type: 'toggle';
  description?: string;
}

export interface DropdownField extends BaseField {
  type: 'dropdown';
  options: { value: string; label: string }[];
  searchable?: boolean;
}

export interface SectionBreak {
  type: 'section-break';
  title?: string;
}

export type FieldConfig =
  | TextField
  | TextAreaField
  | ListField
  | SingleSelectField
  | MultiSelectField
  | ToggleField
  | DropdownField
  | SectionBreak;

// Parse fields into steps based on section breaks
export function parseFieldsIntoSteps(
  fields: FieldConfig[],
): { title?: string; fields: Exclude<FieldConfig, SectionBreak>[] }[] {
  const steps: { title?: string; fields: Exclude<FieldConfig, SectionBreak>[] }[] = [];
  let currentStep: { title?: string; fields: Exclude<FieldConfig, SectionBreak>[] } = {
    title: 'Authentication & Provenance',
    fields: [],
  };

  fields.forEach((field) => {
    if (field.type === 'section-break') {
      if (currentStep.fields.length > 0) {
        steps.push(currentStep);
      }
      currentStep = { title: field.title, fields: [] };
    } else {
      currentStep.fields.push(field);
    }
  });

  if (currentStep.fields.length > 0) {
    steps.push(currentStep);
  }

  return steps;
}

/**
 * Transform API field type to local FieldConfig type
 */
function mapApiFieldType(apiType: string): FieldConfig['type'] | null {
  const typeMap: Record<string, FieldConfig['type']> = {
    text: 'text',
    textarea: 'textarea',
    textList: 'list',
    toggle: 'toggle',
    radio: 'single-select',
    multiselect: 'multi-select',
    dropdown: 'dropdown',
    slider: 'text', // Slider can be represented as text for now
    number: 'text', // Number fields as text with numeric keyboard
    section: 'section-break',
  };
  return typeMap[apiType] || null;
}

/**
 * Transform API response to FieldConfig array
 */
function transformApiFields(fields: ResolvedField[]): FieldConfig[] {
  const configs: FieldConfig[] = [];
  let currentSectionTitle: string | undefined = undefined;

  // Group fields by level for section breaks
  let lastLevel: string | undefined = undefined;

  for (const field of fields) {
    // Add section break when level changes
    if (lastLevel && field.level !== lastLevel) {
      const sectionTitle = field.level === 'category' ? 'Category Details' : 
                          field.level === 'subcategory' ? 'Additional Details' : undefined;
      if (sectionTitle) {
        configs.push({ type: 'section-break', title: sectionTitle });
      }
    }
    lastLevel = field.level;

    // Handle section type fields
    if (field.fieldType === 'section') {
      configs.push({
        type: 'section-break',
        title: field.sectionTitle || field.label,
      });
      continue;
    }

    const mappedType = mapApiFieldType(field.fieldType);
    if (!mappedType || mappedType === 'section-break') continue;

    // Build the field config based on type
    const baseConfig = {
      id: field.id,
      label: field.label,
      required: field.required,
      placeholder: field.placeholder,
    };

    // Filter visible options only
    const visibleOptions = field.options
      ?.filter(opt => opt.visible !== false)
      ?.map(opt => ({ value: opt.value, label: opt.label })) || [];

    switch (mappedType) {
      case 'text':
        configs.push({ ...baseConfig, type: 'text' });
        break;
      case 'textarea':
        configs.push({ ...baseConfig, type: 'textarea' });
        break;
      case 'list':
        configs.push({ ...baseConfig, type: 'list' });
        break;
      case 'toggle':
        configs.push({ ...baseConfig, type: 'toggle' });
        break;
      case 'single-select':
        configs.push({ ...baseConfig, type: 'single-select', options: visibleOptions });
        break;
      case 'multi-select':
        configs.push({ ...baseConfig, type: 'multi-select', options: visibleOptions });
        break;
      case 'dropdown':
        configs.push({ ...baseConfig, type: 'dropdown', options: visibleOptions, searchable: true });
        break;
    }
  }

  return configs;
}

/**
 * Fetch field configurations from API
 * Falls back to mock data on error
 */
export async function getFieldConfigs(
  type: string,
  category: string,
  subcategory?: string
): Promise<FieldConfig[]> {
  try {
    const response = await resolveFields(type, category, subcategory);
    
    if (response.fields && response.fields.length > 0) {
      return transformApiFields(response.fields);
    }
    
    // No fields configured, return empty array
    log.debug(`No fields configured for ${type}/${category}${subcategory ? '/' + subcategory : ''}`);
    return [];
  } catch (error) {
    log.error('Failed to fetch field configs:', error);
    // Fall back to mock data
    return getMockFieldConfigs(type, category);
  }
}

// Mock field configurations - kept as fallback
export function getMockFieldConfigs(type: string, category: string): FieldConfig[] {
  // Example for Baseball -> Jersey
  // In production, this would be: GET /api/field-configs/:type/:category
  return [
    // Step 1: Authentication & Provenance
    {
      id: 'grading_service',
      type: 'dropdown',
      label: 'Grading Service',
      options: [
        { value: 'psa', label: 'PSA' },
        { value: 'bgs', label: 'BGS' },
        { value: 'sgc', label: 'SGC' },
        { value: 'cgc', label: 'CGC' },
        { value: 'none', label: 'Ungraded' },
      ],
      searchable: true,
    },
    { id: 'grade', type: 'text', label: 'Grade', placeholder: 'e.g., 10, 9.5, Gem Mint' },
    { id: 'cert_number', type: 'text', label: 'Certificate Number', placeholder: 'Enter cert number' },
    {
      id: 'authenticated',
      type: 'toggle',
      label: 'Authenticated',
      description: 'Item has been professionally authenticated',
    },
    { type: 'section-break', title: 'Item Specifications' },

    // Step 2: Specifications
    { id: 'year', type: 'text', label: 'Year', placeholder: 'e.g., 1999' },
    {
      id: 'brand',
      type: 'dropdown',
      label: 'Brand / Manufacturer',
      options: [
        { value: 'nike', label: 'Nike' },
        { value: 'mitchell_ness', label: 'Mitchell & Ness' },
        { value: 'majestic', label: 'Majestic' },
        { value: 'rawlings', label: 'Rawlings' },
        { value: 'wilson', label: 'Wilson' },
        { value: 'other', label: 'Other' },
      ],
      searchable: true,
    },
    {
      id: 'edition',
      type: 'single-select',
      label: 'Edition',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'limited', label: 'Limited Edition' },
        { value: 'special', label: 'Special Release' },
        { value: 'anniversary', label: 'Anniversary Edition' },
      ],
    },
    {
      id: 'size',
      type: 'single-select',
      label: 'Size',
      options: [
        { value: 'xs', label: 'XS' },
        { value: 's', label: 'S' },
        { value: 'm', label: 'M' },
        { value: 'l', label: 'L' },
        { value: 'xl', label: 'XL' },
        { value: 'xxl', label: '2XL' },
      ],
    },
    { type: 'section-break', title: 'Additional Details' },

    // Step 3: Additional Details
    { id: 'player', type: 'text', label: 'Player Name', placeholder: 'e.g., Babe Ruth' },
    { id: 'team', type: 'text', label: 'Team', placeholder: 'e.g., New York Yankees' },
    { id: 'signatures', type: 'list', label: 'Signatures', maxItems: 10 },
    {
      id: 'features',
      type: 'multi-select',
      label: 'Special Features',
      options: [
        { value: 'game_worn', label: 'Game Worn' },
        { value: 'autographed', label: 'Autographed' },
        { value: 'patch', label: 'Patch' },
        { value: 'inscription', label: 'Inscription' },
        { value: 'photo_matched', label: 'Photo Matched' },
      ],
      maxSelections: 5,
    },
    {
      id: 'notes',
      type: 'textarea',
      label: 'Additional Notes',
      placeholder: 'Any other details about this item...',
      rows: 4,
    },
  ];
}
