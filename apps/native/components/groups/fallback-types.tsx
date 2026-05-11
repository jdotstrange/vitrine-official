import {
  Trophy,
  Layers,
  Gamepad2,
  Sparkles,
  Shirt,
  Watch,
  Coins,
  Palette,
  Music,
} from 'lucide-react-native';
import type { CategoryType } from '@/lib/contexts/category-context';

export const FALLBACK_TYPES: CategoryType[] = [
  {
    id: '1',
    code: 'sports',
    title: 'Sports',
    thumbnail: '',
    icon: Trophy,
    categories: [
      { id: '1-1', code: 'baseball', title: 'Baseball', thumbnail: '', icon: Trophy, subcategories: [] },
      { id: '1-2', code: 'basketball', title: 'Basketball', thumbnail: '', icon: Trophy, subcategories: [] },
      { id: '1-3', code: 'football', title: 'Football', thumbnail: '', icon: Trophy, subcategories: [] },
    ],
  },
  {
    id: '2',
    code: 'trading-cards',
    title: 'Trading Cards',
    thumbnail: '',
    icon: Layers,
    categories: [
      { id: '2-1', code: 'pokemon', title: 'Pokemon', thumbnail: '', icon: Gamepad2, subcategories: [] },
      { id: '2-2', code: 'mtg', title: 'Magic: The Gathering', thumbnail: '', icon: Sparkles, subcategories: [] },
      { id: '2-3', code: 'yugioh', title: 'Yu-Gi-Oh!', thumbnail: '', icon: Layers, subcategories: [] },
    ],
  },
  {
    id: '3',
    code: 'fashion',
    title: 'Fashion',
    thumbnail: '',
    icon: Shirt,
    categories: [
      { id: '3-1', code: 'sneakers', title: 'Sneakers', thumbnail: '', icon: Shirt, subcategories: [] },
      { id: '3-2', code: 'streetwear', title: 'Streetwear', thumbnail: '', icon: Shirt, subcategories: [] },
      { id: '3-3', code: 'vintage', title: 'Vintage', thumbnail: '', icon: Shirt, subcategories: [] },
    ],
  },
  {
    id: '4',
    code: 'watches',
    title: 'Watches',
    thumbnail: '',
    icon: Watch,
    categories: [
      { id: '4-1', code: 'rolex', title: 'Rolex', thumbnail: '', icon: Watch, subcategories: [] },
      { id: '4-2', code: 'omega', title: 'Omega', thumbnail: '', icon: Watch, subcategories: [] },
      { id: '4-3', code: 'vintage-watches', title: 'Vintage', thumbnail: '', icon: Watch, subcategories: [] },
    ],
  },
  {
    id: '5',
    code: 'gaming',
    title: 'Gaming',
    thumbnail: '',
    icon: Gamepad2,
    categories: [
      { id: '5-1', code: 'retro', title: 'Retro Gaming', thumbnail: '', icon: Gamepad2, subcategories: [] },
      { id: '5-2', code: 'consoles', title: 'Consoles', thumbnail: '', icon: Gamepad2, subcategories: [] },
    ],
  },
  {
    id: '6',
    code: 'coins',
    title: 'Coins & Currency',
    thumbnail: '',
    icon: Coins,
    categories: [
      { id: '6-1', code: 'us-coins', title: 'US Coins', thumbnail: '', icon: Coins, subcategories: [] },
      { id: '6-2', code: 'world-coins', title: 'World Coins', thumbnail: '', icon: Coins, subcategories: [] },
    ],
  },
  {
    id: '7',
    code: 'art',
    title: 'Art',
    thumbnail: '',
    icon: Palette,
    categories: [
      { id: '7-1', code: 'prints', title: 'Prints', thumbnail: '', icon: Palette, subcategories: [] },
      { id: '7-2', code: 'original', title: 'Original Art', thumbnail: '', icon: Palette, subcategories: [] },
    ],
  },
  {
    id: '8',
    code: 'music',
    title: 'Music',
    thumbnail: '',
    icon: Music,
    categories: [
      { id: '8-1', code: 'vinyl', title: 'Vinyl Records', thumbnail: '', icon: Music, subcategories: [] },
      { id: '8-2', code: 'memorabilia', title: 'Memorabilia', thumbnail: '', icon: Music, subcategories: [] },
    ],
  },
];
