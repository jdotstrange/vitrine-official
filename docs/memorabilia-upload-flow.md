# Memorabilia Upload Flow - Architecture Documentation

## Overview

This document describes the complete memorabilia upload flow, component architecture, state management, and API integration points. Use this as a reference when wiring the backend.

## User Flow

### 1. Initial Upload Flow
```
Upload Entry Screen
  ↓ (Select "Memorabilia")
Memorabilia Type Selector
  ↓ (Select Type: e.g., "Baseball")
Category Selector (filtered by type)
  ↓ (Select Category: e.g., "Jersey")
MemorabiliaDetailsForm (Initial Form)
  ↓ (Fill: Photos, Title, Value, Status, Showcase, Tags)
  ↓ (Submit)
Upload Progress Screen
  ↓ (100% complete)
Success Screen (Initial)
  ├─→ "Add Details" → KeyDetailsModal
  └─→ "View in My Collection" → Collectible Detail Page
```

### 2. Key Details Flow (Modal)
```
Success Screen
  ↓ (Click "Add Details")
KeyDetailsModal Opens
  ↓ (Step 1: Authentication & Provenance)
  ↓ (Step 2: Item Specifications)
  ↓ (Step 3: Additional Details)
  ↓ (Click "Save Details")
Success State in Modal
  ↓ (Click "Done")
Modal Closes → Navigate to Collectible Detail
```

## Component Architecture

### Core Components

#### 1. `MemorabiliaTypeSelector`
**Location:** `components/memorabilia-type-selector.tsx`
**Purpose:** Handles type and category selection
**State:**
- `step`: 'type' | 'category'
- `selectedType`: Type object
- `searchQuery`: string
**Navigation:** Routes to `/upload/memorabilia/[type]/[category]` (without `/details`)

#### 2. `MemorabiliaDetailsForm`
**Location:** `components/memorabilia-details-form.tsx`
**Purpose:** Initial collectible form (core data entry)
**State:**
- `images`: ImageItem[]
- `title`: string
- `value`: string
- `status`: ListingStatus
- `selectedShowcase`: Showcase | null
- `tags`: string[]
- `uploadState`: 'form' | 'uploading' | 'success'
- `uploadProgress`: number
- `showKeyDetailsModal`: boolean
**Key Functions:**
- `handleImageSelect()`: Opens image picker
- `handleSubmit()`: Simulates upload, shows progress, then success
- `handleAddDetails()`: Opens KeyDetailsModal
- `handleAddToCollection()`: Navigates to collectible detail page
**API Integration Point:**
- `handleSubmit()` should POST to `/api/collectibles` with:
  ```typescript
  {
    type: string,
    category: string,
    images: File[],
    title: string,
    value: number,
    status: ListingStatus,
    showcaseId?: string,
    tags: string[]
  }
  ```
- Response should include `collectibleId` for use in KeyDetailsModal

#### 3. `KeyDetailsModal`
**Location:** `components/key-details-modal.tsx`
**Purpose:** Dynamic multi-step form for specifications and provenance
**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `type`: string
- `category`: string
- `collectibleId?: string`
- `onSuccess?: () => void`
**State:**
- `currentStepIndex`: number
- `formData`: Record<string, any>
- `showSuccess`: boolean
**Key Functions:**
- `handleSubmit()`: Should POST to `/api/collectibles/:id/key-details`
- `handleSuccessClose()`: Resets form, calls `onSuccess`, closes modal
**API Integration Point:**
- `handleSubmit()` should POST to `/api/collectibles/:collectibleId/key-details` with:
  ```typescript
  {
    // Dynamic fields based on type/category
    grading_service?: string,
    grade?: string,
    cert_number?: string,
    authenticated?: boolean,
    year?: string,
    brand?: string,
    // ... etc (see field-configs.ts)
  }
  ```

#### 4. `KeyDetailsSuccess`
**Location:** `components/key-details-success.tsx`
**Purpose:** Success screen after key details are saved
**Note:** Currently used as a route, but could be integrated into modal

### Supporting Components

#### Field Configuration System
**Location:** `lib/field-configs.ts`
**Purpose:** Defines dynamic field configurations based on type/category
**Key Functions:**
- `getMockFieldConfigs(type, category)`: Returns field configs (should fetch from API)
- `parseFieldsIntoSteps(fields)`: Organizes fields into multi-step flow
**API Integration Point:**
- Replace `getMockFieldConfigs` with:
  ```typescript
  async function getFieldConfigs(type: string, category: string) {
    const response = await fetch(`/api/field-configs/${type}/${category}`);
    return response.json();
  }
  ```

#### Field Renderers
**Location:** `components/key-details/field-renderers.tsx`
**Purpose:** Renders different field types (text, textarea, dropdown, etc.)
**Field Types:**
- TextFieldRenderer
- TextAreaFieldRenderer
- ListFieldRenderer (for signatures, etc.)
- SingleSelectFieldRenderer
- MultiSelectFieldRenderer
- ToggleFieldRenderer
- DropdownFieldRenderer

## State Management

### Initial Upload State
```typescript
// MemorabiliaDetailsForm
{
  images: ImageItem[],           // Selected images
  title: string,                 // Collectible title
  value: string,                 // Monetary value
  status: ListingStatus,         // NFST | FOR_SALE | FOR_TRADE | SELL_TRADE
  selectedShowcase: Showcase | null,
  tags: string[],                // User-defined tags
  uploadState: 'form' | 'uploading' | 'success',
  uploadProgress: number,        // 0-100
  showKeyDetailsModal: boolean
}
```

### Key Details State
```typescript
// KeyDetailsModal
{
  currentStepIndex: number,      // Current step in multi-step form
  formData: Record<string, any>, // All field values keyed by field.id
  showSuccess: boolean           // Success state within modal
}
```

## Data Flow

### Initial Upload
1. User selects type/category → Routes to `MemorabiliaDetailsForm`
2. User fills form → State stored in component
3. User submits → `handleSubmit()` called
4. **API Call Needed:** POST `/api/collectibles`
   - Request body: form data
   - Response: `{ collectibleId: string, ... }`
5. Store `collectibleId` for use in KeyDetailsModal
6. Show success screen

### Key Details Flow
1. User clicks "Add Details" → `setShowKeyDetailsModal(true)`
2. Modal opens with `type`, `category`, `collectibleId`
3. **API Call Needed:** GET `/api/field-configs/:type/:category`
   - Returns field configurations for this type/category
4. User fills multi-step form → State stored in modal
5. User submits final step → `handleSubmit()` called
6. **API Call Needed:** POST `/api/collectibles/:collectibleId/key-details`
   - Request body: `formData` object
   - Response: success confirmation
7. Show success state in modal
8. User clicks "Done" → Modal closes, `onSuccess()` called
9. Navigate to collectible detail page

## Route Structure

### Active Routes
- `/upload` → Upload entry screen
- `/upload/memorabilia/[type]/[category]` → MemorabiliaDetailsForm (initial form)
- `/collectible/[id]` → Collectible detail page

### Modal-Based (No Routes)
- KeyDetailsModal → Opened via state, not routing
- Success states → Handled within components

### Catch-All Route
**Location:** `app/[...unmatched].tsx`
**Purpose:** Handles routes that Expo Router doesn't discover
**Handles:**
- `/upload/memorabilia/[type]/[category]` → MemorabiliaDetailsForm
- `/upload/memorabilia/[type]/[category]/details` → KeyDetailsForm (route-based, but modal preferred)
- `/upload/memorabilia/[type]/[category]/details/success` → KeyDetailsSuccess (route-based)

## Key Architectural Decisions

### 1. Modal vs. Route for Key Details
**Decision:** Use Modal (`KeyDetailsModal`)
**Reasoning:**
- Prevents swipe-back gesture issues
- Keeps context (success screen visible in background)
- Reusable for editing existing collectibles
- Cleaner separation: upload flow vs. edit/update operations

### 2. Success Screen Separation
**Decision:** Two separate success screens
**Reasoning:**
- Initial success: After core data upload
- Key details success: After specifications/provenance added
- Different contexts, different user journeys

### 3. Dynamic Field Configuration
**Decision:** Field configs fetched based on type/category
**Reasoning:**
- Different memorabilia types need different fields
- Baseball jersey needs different fields than trading card
- Allows backend to control form structure
- Supports future extensibility

### 4. Multi-Step Form
**Decision:** Organize fields into logical steps
**Reasoning:**
- Better UX for long forms
- Progress indication
- Validation per step
- Section breaks organize related fields

## API Integration Checklist

### When Wiring Backend:

#### 1. Initial Upload Endpoint
- [ ] Create `POST /api/collectibles`
- [ ] Accept: images, title, value, status, showcaseId, tags, type, category
- [ ] Return: `{ collectibleId: string, ... }`
- [ ] Update `handleSubmit()` in `MemorabiliaDetailsForm` to call API
- [ ] Store `collectibleId` from response
- [ ] Pass `collectibleId` to `KeyDetailsModal`

#### 2. Field Configuration Endpoint
- [ ] Create `GET /api/field-configs/:type/:category`
- [ ] Return: Array of `FieldConfig` objects
- [ ] Update `getMockFieldConfigs()` in `lib/field-configs.ts`
- [ ] Handle loading states
- [ ] Handle error states

#### 3. Key Details Endpoint
- [ ] Create `POST /api/collectibles/:id/key-details`
- [ ] Accept: Dynamic object based on field configs
- [ ] Validate required fields
- [ ] Return: Success confirmation
- [ ] Update `handleSubmit()` in `KeyDetailsModal` to call API
- [ ] Handle loading states
- [ ] Handle error states

#### 4. Image Upload
- [ ] Determine image upload strategy (multipart/form-data, presigned URLs, etc.)
- [ ] Update `handleImageSelect()` to upload images
- [ ] Store image URLs/IDs in form state
- [ ] Handle upload progress
- [ ] Handle upload errors

#### 5. Showcase Management
- [ ] Create `GET /api/showcases` (for showcase selection)
- [ ] Create `POST /api/showcases` (for creating new showcase)
- [ ] Update showcase selection modal to use API
- [ ] Handle showcase creation

## Data Models

### Collectible (Initial Upload)
```typescript
interface Collectible {
  id: string;
  type: string;
  category: string;
  images: string[]; // URLs or IDs
  title: string;
  value: number;
  status: ListingStatus;
  showcaseId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Key Details (Dynamic)
```typescript
interface KeyDetails {
  collectibleId: string;
  // Dynamic fields based on type/category
  grading_service?: string;
  grade?: string;
  cert_number?: string;
  authenticated?: boolean;
  year?: string;
  brand?: string;
  // ... etc
}
```

### Field Configuration
```typescript
interface FieldConfig {
  id: string;
  type: 'text' | 'textarea' | 'list' | 'single-select' | 'multi-select' | 'toggle' | 'dropdown' | 'section-break';
  label: string;
  required?: boolean;
  placeholder?: string;
  // Type-specific fields
  options?: { value: string; label: string }[];
  maxLength?: number;
  maxItems?: number;
  maxSelections?: number;
  searchable?: boolean;
  // etc.
}
```

## Error Handling

### Current State
- Basic error handling in image picker (permissions)
- No API error handling yet

### Needed When Wiring
- Network error handling
- Validation error display
- Retry mechanisms
- Loading states
- Error boundaries

## Testing Considerations

### Manual Testing Flow
1. Select type → category
2. Upload images
3. Fill initial form
4. Submit → Verify API call
5. Success screen → Open modal
6. Fill key details → Verify API call
7. Complete → Verify navigation

### Edge Cases to Handle
- Network failures during upload
- Partial form submission
- Image upload failures
- Field validation errors
- Modal closing during form fill
- Back navigation prevention

## Future Enhancements

### Edit Existing Collectible
- Reuse `KeyDetailsModal` component
- Pre-populate with existing data
- Update endpoint instead of create
- Same modal UX, different API calls

### Draft Saving
- Auto-save form state
- Resume from draft
- Clear draft on completion

### Bulk Upload
- Multiple items at once
- Batch API calls
- Progress tracking

## Notes

- The modal approach eliminates swipe-back issues completely
- Field configurations are dynamic and backend-controlled
- Success screens are intentionally separate for different contexts
- The flow is designed to be extensible for other collectible types (trading cards, etc.)
