import { type ListingStatus } from './status-utils';

export interface MockCollectible {
  id: string;
  title: string;
  listedAt: Date | string | number;
  price: string;
  image: string;
  collector: string;
  collectorAvatar?: string;
  tracks?: number;
  views?: number;
  status: ListingStatus;
  description?: string;
  condition?: string;
  authenticity?: string;
  provenance?: string;
  type?: string;
  category?: string;
  subcategory?: string;
  visibility?: 'public' | 'private';
  tags?: string[];
}

// Mock collectible data mapped by ID
export const MOCK_COLLECTIBLES: Record<string, MockCollectible> = {
  '1': {
    id: '1',
    title: 'Jordan 1 Chicago',
    listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    price: '$2,850',
    image: '/air-jordan-1-chicago-og-sneaker.jpg',
    collector: 'Alex Rivera',
    collectorAvatar: '/collector-avatar.png',
    tracks: 2800,
    views: 1200,
    status: 'FOR_SALE',
    description: 'Classic Air Jordan 1 High OG in the iconic Chicago colorway. Deadstock condition, never worn.',
    type: 'Sneakers',
    category: 'Basketball',
    subcategory: 'Retro',
    visibility: 'public',
    tags: ['Jordan', 'Basketball', 'OG'],
  },
  '2': {
    id: '2',
    title: 'Charizard 1st Ed',
    listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
    price: '$8,200',
    image: '/charizard-pokemon-card-holographic.jpg',
    collector: 'Marcus Chen',
    collectorAvatar: '/diverse-group-avatars.png',
    tracks: 5600,
    views: 3200,
    status: 'FOR_TRADE',
    description: '1999 Pokemon Base Set Charizard Holo 1st Edition. Looking for specific vintage cards in return.',
    type: 'Cards',
    category: 'Pokemon',
    subcategory: 'Base Set',
    visibility: 'public',
    tags: ['Pokemon', '1st Edition', 'Holo'],
  },
  '3': {
    id: '3',
    title: 'Rolex Daytona',
    listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    price: '$12,500',
    image: '/rolex-daytona-paul-newman-dial.jpg',
    collector: 'Sarah Johnson',
    collectorAvatar: '/collector-avatar.png',
    tracks: 3900,
    views: 2100,
    status: 'FOR_SALE',
    description: 'Vintage Rolex Daytona in excellent condition. Full box and papers included.',
    type: 'Watches',
    category: 'Luxury',
    subcategory: 'Vintage',
    visibility: 'public',
    tags: ['Rolex', 'Vintage', 'Luxury'],
  },
  '4': {
    id: '4',
    title: 'MJ Rookie PSA 10',
    listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21), // 3 weeks ago
    price: '$15,000',
    image: '/michael-jordan-card.jpg',
    collector: 'Alex Rivera',
    collectorAvatar: '/collector-avatar.png',
    tracks: 4200,
    views: 2800,
    status: 'SELL_TRADE',
    description: '1986 Fleer Michael Jordan Rookie Card graded PSA 10 Gem Mint. Open to cash offers or high-value trades.',
    type: 'Cards',
    category: 'Basketball',
    subcategory: 'Rookie Cards',
    visibility: 'public',
    tags: ['Michael Jordan', 'Rookie', 'PSA 10'],
  },
  '5': {
    id: '5',
    title: 'NB 550 Vintage',
    listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    price: '$425',
    image: '/new-balance-550.jpg',
    collector: 'Alex Rivera',
    collectorAvatar: '/collector-avatar.png',
    tracks: 1900,
    views: 800,
    status: 'SELL_TRADE',
    description: 'New Balance 550 in vintage colorway. Lightly worn, excellent condition.',
    type: 'Sneakers',
    category: 'Lifestyle',
    subcategory: 'Retro',
    visibility: 'public',
    tags: ['New Balance', 'Vintage', 'Lifestyle'],
  },
  '6': {
    id: '6',
    title: 'Patek Philippe Nautilus',
    listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 1 month ago
    price: '$145,000',
    image: '/luxury-watch.jpg',
    collector: 'David Kim',
    collectorAvatar: '/diverse-group-avatars.png',
    tracks: 6200,
    views: 4500,
    status: 'NFST',
    description: 'Patek Philippe Nautilus 5711/1A. Not for sale or trade - personal collection piece.',
    type: 'Watches',
    category: 'Luxury',
    subcategory: 'Modern',
    visibility: 'public',
    tags: ['Patek Philippe', 'Luxury', 'Not For Sale'],
  },
  '7': {
    id: '7',
    title: 'Travis Scott AJ1 Low',
    listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    price: '$1,200',
    image: '/abstract-sneakers.png',
    collector: 'Alex Rivera',
    collectorAvatar: '/collector-avatar.png',
    tracks: 3500,
    views: 1800,
    status: 'FOR_SALE',
    description: 'Travis Scott x Air Jordan 1 Low. Deadstock, size 10.5.',
    type: 'Sneakers',
    category: 'Collaboration',
    subcategory: 'Modern',
    visibility: 'public',
    tags: ['Travis Scott', 'Jordan', 'Collaboration'],
  },
  '8': {
    id: '8',
    title: 'LeBron Rookie PSA 10',
    listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    price: '$52,000',
    image: '/lebron-rookie-card.jpg',
    collector: 'James Wilson',
    collectorAvatar: '/diverse-group-avatars.png',
    tracks: 4800,
    views: 3100,
    status: 'FOR_TRADE',
    description: '2003 LeBron James Rookie Card graded PSA 10. Looking for specific high-value cards in return.',
    type: 'Cards',
    category: 'Basketball',
    subcategory: 'Rookie Cards',
    visibility: 'public',
    tags: ['LeBron James', 'Rookie', 'PSA 10'],
  },
};

export interface MockShowcase {
  id: string;
  title: string;
  description?: string;
  showcaseType: 'manual' | 'auto';
  visibility: 'public' | 'private';
  createdAt: Date | string | number;
  owner: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    followers: number;
  };
  stats: {
    totalItems: number;
    totalValue: string;
  };
  collectibles: Array<{
    id: string;
    image: string;
    title: string;
    collector: string;
    avatar?: string;
    tracks: number;
    comments?: number;
    type: string;
    subcategory: string;
    rarity?: string;
    value: string;
    name: string;
    addedAt: Date | string | number;
    priceChange?: string;
    status: ListingStatus;
  }>;
  images: string[];
}

// Mock showcase data mapped by ID
export const MOCK_SHOWCASES: Record<string, MockShowcase> = {
  'showcase-1': {
    id: 'showcase-1',
    title: 'Grail Collection',
    description: 'My most prized collectibles across all categories',
    showcaseType: 'auto',
    visibility: 'public',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
    owner: {
      id: 'user-1',
      name: 'Alex Rivera',
      username: '@alexcollects',
      avatar: '/collector-avatar.png',
      followers: 12400,
    },
    stats: {
      totalItems: 24,
      totalValue: '$847,500',
    },
    collectibles: [
      {
        id: '1',
        image: '/air-jordan-1-chicago-og-sneaker.jpg',
        title: "Air Jordan 1 High OG 'Chicago' 1985",
        collector: 'Alex Rivera',
        avatar: '/collector-avatar.png',
        tracks: 2847,
        comments: 156,
        type: 'Sneakers',
        subcategory: 'Basketball',
        rarity: 'Grail',
        value: '$12,500',
        name: "Air Jordan 1 High OG 'Chicago' 1985",
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
        priceChange: '+10%',
        status: 'NFST',
      },
      {
        id: '2',
        image: '/charizard-pokemon-card-holographic.jpg',
        title: '1999 Pokemon Base Set Charizard Holo PSA 10',
        collector: 'Alex Rivera',
        avatar: '/collector-avatar.png',
        tracks: 5621,
        comments: 423,
        type: 'Cards',
        subcategory: 'Pokemon',
        rarity: 'Gem Mint',
        value: '$420,000',
        name: '1999 Pokemon Base Set Charizard Holo PSA 10',
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
        priceChange: '-5%',
        status: 'FOR_SALE',
      },
      {
        id: '3',
        image: '/rolex-daytona-paul-newman-dial.jpg',
        title: "Rolex Daytona 'Paul Newman' Ref. 6239",
        collector: 'Alex Rivera',
        avatar: '/collector-avatar.png',
        tracks: 3892,
        comments: 287,
        type: 'Watches',
        subcategory: 'Luxury',
        rarity: 'Legendary',
        value: '$275,000',
        name: "Rolex Daytona 'Paul Newman' Ref. 6239",
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        priceChange: '+20%',
        status: 'FOR_TRADE',
      },
      {
        id: '4',
        image: '/michael-jordan-card.jpg',
        title: '1986 Fleer Michael Jordan Rookie PSA 10',
        collector: 'Alex Rivera',
        avatar: '/collector-avatar.png',
        tracks: 4156,
        comments: 312,
        type: 'Cards',
        subcategory: 'Basketball',
        rarity: 'Grail',
        value: '$125,000',
        name: '1986 Fleer Michael Jordan Rookie PSA 10',
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
        priceChange: '+15%',
        status: 'SELL_TRADE',
      },
    ],
    images: [
      '/air-jordan-1-chicago-og-sneaker.jpg',
      '/charizard-pokemon-card-holographic.jpg',
      '/rolex-daytona-paul-newman-dial.jpg',
      '/michael-jordan-card.jpg',
    ],
  },
  'showcase-2': {
    id: 'showcase-2',
    title: 'Pokemon Master Set',
    description: 'Complete 1st Edition Base Set, graded PSA 10.',
    showcaseType: 'auto',
    visibility: 'public',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120),
    owner: {
      id: 'user-2',
      name: 'Marcus Chen',
      username: '@marcusgrails',
      avatar: '/diverse-group-avatars.png',
      followers: 8500,
    },
    stats: {
      totalItems: 47,
      totalValue: '$500,000',
    },
    collectibles: [
      {
        id: '2',
        image: '/charizard-pokemon-card-holographic.jpg',
        title: '1999 Pokemon Base Set Charizard Holo PSA 10',
        collector: 'Marcus Chen',
        avatar: '/diverse-group-avatars.png',
        tracks: 5621,
        comments: 423,
        type: 'Cards',
        subcategory: 'Pokemon',
        rarity: 'Gem Mint',
        value: '$420,000',
        name: '1999 Pokemon Base Set Charizard Holo PSA 10',
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
        priceChange: '-5%',
        status: 'FOR_TRADE',
      },
      {
        id: '8',
        image: '/lebron-rookie-card.jpg',
        title: '2003 LeBron James Rookie PSA 10',
        collector: 'Marcus Chen',
        avatar: '/diverse-group-avatars.png',
        tracks: 4800,
        comments: 310,
        type: 'Cards',
        subcategory: 'Basketball',
        rarity: 'Gem Mint',
        value: '$52,000',
        name: '2003 LeBron James Rookie PSA 10',
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
        priceChange: '+12%',
        status: 'FOR_TRADE',
      },
    ],
    images: [
      '/charizard-pokemon-card-holographic.jpg',
      '/lebron-rookie-card.jpg',
      '/pokemon-cards-collection-display.jpg',
      '/michael-jordan-card.jpg',
    ],
  },
  'showcase-3': {
    id: 'showcase-3',
    title: 'Investment Pieces',
    description: 'High-value collectibles with strong appreciation potential',
    showcaseType: 'manual',
    visibility: 'public',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    owner: {
      id: 'user-1',
      name: 'Alex Rivera',
      username: '@alexcollects',
      avatar: '/collector-avatar.png',
      followers: 12400,
    },
    stats: {
      totalItems: 12,
      totalValue: '$120,300',
    },
    collectibles: [
      {
        id: '3',
        image: '/rolex-daytona-paul-newman-dial.jpg',
        title: "Rolex Daytona 'Paul Newman' Ref. 6239",
        collector: 'Alex Rivera',
        avatar: '/collector-avatar.png',
        tracks: 3892,
        comments: 287,
        type: 'Watches',
        subcategory: 'Luxury',
        rarity: 'Legendary',
        value: '$275,000',
        name: "Rolex Daytona 'Paul Newman' Ref. 6239",
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        priceChange: '+20%',
        status: 'FOR_TRADE',
      },
      {
        id: '6',
        image: '/luxury-watch.jpg',
        title: 'Patek Philippe Nautilus 5711/1A',
        collector: 'Alex Rivera',
        avatar: '/collector-avatar.png',
        tracks: 6200,
        comments: 450,
        type: 'Watches',
        subcategory: 'Luxury',
        rarity: 'Ultra Rare',
        value: '$145,000',
        name: 'Patek Philippe Nautilus 5711/1A',
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        priceChange: '+25%',
        status: 'NFST',
      },
    ],
    images: [
      '/rolex-daytona-paul-newman-dial.jpg',
      '/luxury-watch.jpg',
      '/charizard-pokemon-card-holographic.jpg',
      '/air-jordan-1-chicago-og-sneaker.jpg',
    ],
  },
  'showcase-4': {
    id: 'showcase-4',
    title: 'Sneakers $500+',
    description: 'Premium sneaker collection filtered by value',
    showcaseType: 'auto',
    visibility: 'public',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    owner: {
      id: 'user-1',
      name: 'Alex Rivera',
      username: '@alexcollects',
      avatar: '/collector-avatar.png',
      followers: 12400,
    },
    stats: {
      totalItems: 15,
      totalValue: '$12,540',
    },
    collectibles: [
      {
        id: '1',
        image: '/air-jordan-1-chicago-og-sneaker.jpg',
        title: "Air Jordan 1 High OG 'Chicago' 1985",
        collector: 'Alex Rivera',
        avatar: '/collector-avatar.png',
        tracks: 2847,
        comments: 156,
        type: 'Sneakers',
        subcategory: 'Basketball',
        rarity: 'Grail',
        value: '$12,500',
        name: "Air Jordan 1 High OG 'Chicago' 1985",
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
        priceChange: '+10%',
        status: 'NFST',
      },
      {
        id: '7',
        image: '/abstract-sneakers.png',
        title: 'Travis Scott AJ1 Low',
        collector: 'Alex Rivera',
        avatar: '/collector-avatar.png',
        tracks: 3500,
        comments: 180,
        type: 'Sneakers',
        subcategory: 'Collaboration',
        rarity: 'Limited',
        value: '$1,200',
        name: 'Travis Scott AJ1 Low',
        addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        priceChange: '+5%',
        status: 'FOR_SALE',
      },
    ],
    images: [
      '/air-jordan-1-chicago-og-sneaker.jpg',
      '/new-balance-550.jpg',
      '/abstract-sneakers.png',
      '/air-jordan-1-chicago-red-white-sneaker.jpg',
    ],
  },
};

// Helper function to get mock collectible by ID
export function getMockCollectible(id: string | number | undefined, isOwner: boolean = false): MockCollectible | null {
  const collectibleId = String(id || '1');
  const collectible = MOCK_COLLECTIBLES[collectibleId];
  
  if (!collectible) {
    // Return default if ID not found
    return MOCK_COLLECTIBLES['1'];
  }
  
  // If user owns it, update collector info to match current user
  if (isOwner) {
    return {
      ...collectible,
      collector: 'Alex Rivera',
      collectorAvatar: '/collector-avatar.png',
      visibility: collectible.visibility || 'public',
    };
  }
  
  return collectible;
}

// Helper function to get mock showcase by ID
// Current user is Alex Rivera (@alexcollects)
export function getMockShowcase(id: string | undefined): MockShowcase | null {
  if (!id) return null;
  
  const showcase = MOCK_SHOWCASES[id];
  
  if (!showcase) {
    // Return first showcase if ID not found
    return MOCK_SHOWCASES['showcase-1'] || null;
  }
  
  return showcase;
}
