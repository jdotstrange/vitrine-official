import {
  Shirt,
  Watch,
  Footprints,
  Trophy,
  Gamepad2,
  Music,
  Clapperboard,
  Gem,
  Car,
  Sparkles,
  CircleDot,
  type LucideIcon,
} from 'lucide-react-native';

export interface CollectibleCategory {
  id: string;
  name: string;
  icon: LucideIcon;
}

export interface CollectibleType {
  id: string;
  name: string;
  icon: LucideIcon;
  categories: CollectibleCategory[];
}

// Canonical types and categories data
// In production, this would be fetched from an API
export const COLLECTIBLE_TYPES: CollectibleType[] = [
  {
    id: 'baseball',
    name: 'Baseball',
    icon: CircleDot,
    categories: [
      { id: 'jersey', name: 'Jersey', icon: Shirt },
      { id: 'helmet', name: 'Helmet', icon: Trophy },
      { id: 'ball', name: 'Signed Ball', icon: CircleDot },
      { id: 'bat', name: 'Bat', icon: Trophy },
      { id: 'glove', name: 'Glove', icon: Shirt },
      { id: 'photo', name: 'Signed Photo', icon: Gem },
      { id: 'memorabilia', name: 'Other', icon: Sparkles },
    ],
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: CircleDot,
    categories: [
      { id: 'jersey', name: 'Jersey', icon: Shirt },
      { id: 'ball', name: 'Signed Ball', icon: CircleDot },
      { id: 'shoes', name: 'Sneakers', icon: Footprints },
      { id: 'photo', name: 'Signed Photo', icon: Gem },
      { id: 'memorabilia', name: 'Other', icon: Sparkles },
    ],
  },
  {
    id: 'football',
    name: 'Football',
    icon: CircleDot,
    categories: [
      { id: 'jersey', name: 'Jersey', icon: Shirt },
      { id: 'helmet', name: 'Helmet', icon: Trophy },
      { id: 'ball', name: 'Signed Ball', icon: CircleDot },
      { id: 'photo', name: 'Signed Photo', icon: Gem },
      { id: 'memorabilia', name: 'Other', icon: Sparkles },
    ],
  },
  {
    id: 'hockey',
    name: 'Hockey',
    icon: Trophy,
    categories: [
      { id: 'jersey', name: 'Jersey', icon: Shirt },
      { id: 'helmet', name: 'Helmet', icon: Trophy },
      { id: 'puck', name: 'Signed Puck', icon: CircleDot },
      { id: 'stick', name: 'Stick', icon: Trophy },
      { id: 'photo', name: 'Signed Photo', icon: Gem },
      { id: 'memorabilia', name: 'Other', icon: Sparkles },
    ],
  },
  {
    id: 'soccer',
    name: 'Soccer',
    icon: CircleDot,
    categories: [
      { id: 'jersey', name: 'Jersey', icon: Shirt },
      { id: 'ball', name: 'Signed Ball', icon: CircleDot },
      { id: 'cleats', name: 'Cleats', icon: Footprints },
      { id: 'photo', name: 'Signed Photo', icon: Gem },
      { id: 'memorabilia', name: 'Other', icon: Sparkles },
    ],
  },
  {
    id: 'sneakers',
    name: 'Sneakers',
    icon: Footprints,
    categories: [
      { id: 'jordan', name: 'Jordan', icon: Footprints },
      { id: 'nike', name: 'Nike', icon: Footprints },
      { id: 'adidas', name: 'Adidas', icon: Footprints },
      { id: 'yeezy', name: 'Yeezy', icon: Footprints },
      { id: 'new-balance', name: 'New Balance', icon: Footprints },
      { id: 'other', name: 'Other Brand', icon: Sparkles },
    ],
  },
  {
    id: 'watches',
    name: 'Watches',
    icon: Watch,
    categories: [
      { id: 'rolex', name: 'Rolex', icon: Watch },
      { id: 'omega', name: 'Omega', icon: Watch },
      { id: 'patek', name: 'Patek Philippe', icon: Watch },
      { id: 'ap', name: 'Audemars Piguet', icon: Watch },
      { id: 'cartier', name: 'Cartier', icon: Watch },
      { id: 'other', name: 'Other Brand', icon: Sparkles },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: Gamepad2,
    categories: [
      { id: 'console', name: 'Console', icon: Gamepad2 },
      { id: 'controller', name: 'Controller', icon: Gamepad2 },
      { id: 'sealed-game', name: 'Sealed Game', icon: Gem },
      { id: 'handheld', name: 'Handheld', icon: Gamepad2 },
      { id: 'memorabilia', name: 'Memorabilia', icon: Sparkles },
    ],
  },
  {
    id: 'music',
    name: 'Music',
    icon: Music,
    categories: [
      { id: 'vinyl', name: 'Vinyl Records', icon: Music },
      { id: 'signed', name: 'Signed Items', icon: Gem },
      { id: 'instrument', name: 'Instruments', icon: Music },
      { id: 'concert', name: 'Concert Items', icon: Music },
      { id: 'memorabilia', name: 'Other', icon: Sparkles },
    ],
  },
  {
    id: 'movies',
    name: 'Movies & TV',
    icon: Clapperboard,
    categories: [
      { id: 'props', name: 'Props', icon: Clapperboard },
      { id: 'costumes', name: 'Costumes', icon: Shirt },
      { id: 'posters', name: 'Posters', icon: Gem },
      { id: 'signed', name: 'Signed Items', icon: Gem },
      { id: 'memorabilia', name: 'Memorabilia', icon: Sparkles },
    ],
  },
  {
    id: 'toys',
    name: 'Toys & Figures',
    icon: Sparkles,
    categories: [
      { id: 'action-figures', name: 'Action Figures', icon: Sparkles },
      { id: 'lego', name: 'LEGO', icon: Gem },
      { id: 'funko', name: 'Funko Pop', icon: Sparkles },
      { id: 'vintage', name: 'Vintage Toys', icon: Gem },
      { id: 'other', name: 'Other', icon: Sparkles },
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    icon: Car,
    categories: [
      { id: 'diecast', name: 'Diecast Models', icon: Car },
      { id: 'parts', name: 'Parts & Badges', icon: Gem },
      { id: 'signed', name: 'Signed Items', icon: Gem },
      { id: 'memorabilia', name: 'Memorabilia', icon: Sparkles },
    ],
  },
];

// Helper to get a type by ID
export function getTypeById(id: string): CollectibleType | undefined {
  return COLLECTIBLE_TYPES.find((t) => t.id === id);
}

// Helper to get a category by type and category ID
export function getCategoryById(typeId: string, categoryId: string): CollectibleCategory | undefined {
  const type = getTypeById(typeId);
  return type?.categories.find((c) => c.id === categoryId);
}

// Helper to get type name by ID
export function getTypeName(id: string): string {
  return getTypeById(id)?.name ?? id;
}

// Helper to get category name by IDs
export function getCategoryName(typeId: string, categoryId: string): string {
  return getCategoryById(typeId, categoryId)?.name ?? categoryId;
}
