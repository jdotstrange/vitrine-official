/**
 * Icon Mapper
 * Maps category codes/names to Lucide icons
 */

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

/**
 * Icon mapping based on category codes or names
 */
const iconMap: Record<string, LucideIcon> = {
  // Sports types
  baseball: CircleDot,
  basketball: CircleDot,
  football: CircleDot,
  soccer: CircleDot,
  hockey: Trophy,
  
  // Categories
  jersey: Shirt,
  helmet: Trophy,
  ball: CircleDot,
  bat: Trophy,
  glove: Shirt,
  photo: Gem,
  memorabilia: Sparkles,
  shoes: Footprints,
  sneakers: Footprints,
  puck: CircleDot,
  stick: Trophy,
  cleats: Footprints,
  
  // Other types
  sneakers: Footprints,
  watches: Watch,
  watch: Watch,
  gaming: Gamepad2,
  music: Music,
  movies: Clapperboard,
  toys: Sparkles,
  automotive: Car,
  
  // Brand/other categories
  jordan: Footprints,
  nike: Footprints,
  adidas: Footprints,
  yeezy: Footprints,
  rolex: Watch,
  omega: Watch,
  patek: Watch,
  cartier: Watch,
  console: Gamepad2,
  controller: Gamepad2,
  handheld: Gamepad2,
  vinyl: Music,
  instrument: Music,
  concert: Music,
  props: Clapperboard,
  costumes: Shirt,
  posters: Gem,
  signed: Gem,
  action: Sparkles,
  lego: Gem,
  funko: Sparkles,
  vintage: Gem,
  diecast: Car,
  parts: Gem,
  other: Sparkles,
};

/**
 * Get icon for a category code or name
 */
export function getIconForCategory(codeOrName: string): LucideIcon {
  const key = codeOrName.toLowerCase().replace(/\s+/g, '-');
  return iconMap[key] || Sparkles; // Default to Sparkles
}
