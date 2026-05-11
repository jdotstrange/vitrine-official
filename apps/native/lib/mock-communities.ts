// Mock data for communities/groups

export interface MockMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  isOnline: boolean;
  joinedAt: string;
}

export interface MockGroup {
  groupId: string;
  groupName: string;
  groupImage: string;
  description: string;
  memberCount: number;
  onlineCount: number;
  isPublic: boolean;
  isOfficial?: boolean;
  createdAt: string;
  type?: string;
  category?: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  isMuted?: boolean;
  isJoined?: boolean;
  rules?: string[];
  mutualMembers?: {
    count: number;
    avatars: string[];
  };
  recentTopics?: string[];
  admin?: {
    name: string;
    avatar: string;
  };
}

// Demo members data
export const MOCK_MEMBERS: MockMember[] = [
  {
    id: '1',
    name: 'Marcus Chen',
    username: '@marcusc',
    avatar: '/asian-man-collector.jpg',
    role: 'owner',
    isOnline: true,
    joinedAt: 'Jan 2024',
  },
  {
    id: '2',
    name: 'Sarah Williams',
    username: '@sarahw',
    avatar: '/woman-vintage-collector.jpg',
    role: 'admin',
    isOnline: true,
    joinedAt: 'Feb 2024',
  },
  {
    id: '3',
    name: 'Jake Thompson',
    username: '@jaket',
    avatar: '/young-man-sneaker-collector.jpg',
    role: 'admin',
    isOnline: false,
    joinedAt: 'Feb 2024',
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    username: '@emilyr',
    avatar: '/woman-luxury-watch-collector.jpg',
    role: 'member',
    isOnline: true,
    joinedAt: 'Mar 2024',
  },
  {
    id: '5',
    name: 'Mike Davis',
    username: '@miked',
    avatar: '/man-pokemon-card-collector.jpg',
    role: 'member',
    isOnline: false,
    joinedAt: 'Mar 2024',
  },
  {
    id: '6',
    name: 'Lisa Park',
    username: '@lisap',
    avatar: '/woman-sneaker-collector.jpg',
    role: 'member',
    isOnline: true,
    joinedAt: 'Apr 2024',
  },
  {
    id: '7',
    name: 'Chris Taylor',
    username: '@christ',
    avatar: '/person-retro-gaming.jpg',
    role: 'member',
    isOnline: false,
    joinedAt: 'Apr 2024',
  },
];

// Mock groups data
export const MOCK_GROUPS: Record<string, MockGroup> = {
  '1': {
    groupId: '1',
    groupName: 'Baseball Cards HQ',
    groupImage: '/baseball-cards-collection-vintage.jpg',
    description:
      'The ultimate hub for baseball card collectors. Share your finds, discuss market trends, and connect with fellow enthusiasts.',
    memberCount: 2847,
    onlineCount: 234,
    isPublic: true,
    isOfficial: true,
    createdAt: 'January 2024',
    type: 'Baseball',
    category: 'Trading Cards',
    isAdmin: true,
    isOwner: false,
    isJoined: false,
    rules: [
      'Be respectful to all members',
      'No spam or self-promotion',
      'Keep discussions relevant to baseball cards',
      'Follow community guidelines',
    ],
    mutualMembers: {
      count: 12,
      avatars: ['/asian-man-collector.jpg', '/woman-vintage-collector.jpg', '/young-man-sneaker-collector.jpg'],
    },
    recentTopics: ['PSA Grading Tips', 'Market Trends', 'New Releases'],
    admin: {
      name: 'Marcus Chen',
      avatar: '/asian-man-collector.jpg',
    },
  },
  '2': {
    groupId: '2',
    groupName: 'Sneaker Drops',
    groupImage: '/sneaker-collection-nike-jordan.jpg',
    description:
      'First alerts on limited releases, legit checks, and sneaker culture discussion. Stay ahead of the game.',
    memberCount: 5621,
    onlineCount: 567,
    isPublic: true,
    isOfficial: false,
    createdAt: 'March 2024',
    type: 'Sneakers',
    category: 'Limited Edition',
    isAdmin: false,
    isOwner: false,
    isJoined: false,
  },
};

// Get mock group by ID
export function getMockGroup(groupId: string): MockGroup {
  return (
    MOCK_GROUPS[groupId] || {
      groupId,
      groupName: 'Community Group',
      groupImage: '/placeholder.svg',
      description: 'A community for collectors.',
      memberCount: 100,
      onlineCount: 10,
      isPublic: true,
      isOfficial: false,
      createdAt: '2024',
      type: 'General',
      isAdmin: false,
      isOwner: false,
      isJoined: false,
    }
  );
}

// Mock user connections for invite
export const MOCK_CONNECTIONS = [
  { id: '1', name: 'Mike Chen', username: '@mikec', avatar: '/asian-man-collector.jpg', type: 'Baseball Cards' },
  { id: '2', name: 'Sarah Johnson', username: '@sarahj', avatar: '/woman-vintage-collector.jpg', type: 'Vintage Toys' },
  { id: '3', name: 'James Wilson', username: '@jamesw', avatar: '/young-man-sneaker-collector.jpg', type: 'Sneakers' },
  { id: '4', name: 'Emily Davis', username: '@emilyd', avatar: '/woman-sneaker-collector.jpg', type: 'Sneakers' },
  { id: '5', name: 'Alex Kim', username: '@alexk', avatar: '/person-retro-gaming.jpg', type: 'Gaming' },
  { id: '6', name: 'Maria Garcia', username: '@mariag', avatar: '/woman-luxury-watch-collector.jpg', type: 'Watches' },
];
