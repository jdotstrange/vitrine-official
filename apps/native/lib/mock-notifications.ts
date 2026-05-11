// Notification types and mock data

export type NotificationType =
  | 'new_follower'
  | 'follow_suggestion'
  | 'new_message'
  | 'group_mention'
  | 'group_invite'
  | 'tracking_alert'
  | 'new_item_from_followed'
  | 'someone_tracked_your_item'
  | 'collectible_view_milestone'
  | 'showcase_view_milestone'
  | 'track_milestone';

export type NotificationCategory = 'all' | 'social' | 'collection' | 'milestones';

export type CollectibleStatus = 'sell' | 'trade' | 'collection';

export interface Notification {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  users?: {
    id: string;
    name: string;
    avatar: string;
  }[];
  totalCount?: number;
  collectible?: {
    id: string;
    title: string;
    image: string;
  };
  showcase?: {
    id: string;
    title: string;
    image: string;
  };
  group?: {
    id: string;
    name: string;
    image: string;
  };
  milestone?: number;
  newStatus?: CollectibleStatus;
  messagePreview?: string;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'collectible_view_milestone',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    collectible: {
      id: '1',
      title: '1952 Topps Mickey Mantle #311',
      image: '/michael-jordan-card.jpg',
    },
    milestone: 500,
  },
  {
    id: '2',
    type: 'track_milestone',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    collectible: {
      id: '2',
      title: 'PSA 10 Charizard Base Set',
      image: '/charizard-pokemon-card-holographic.jpg',
    },
    milestone: 50,
  },
  {
    id: '3',
    type: 'showcase_view_milestone',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    showcase: {
      id: '1',
      title: 'Vintage Baseball Collection',
      image: '/placeholder.svg?height=80&width=80',
    },
    milestone: 1000,
  },
  {
    id: '4',
    type: 'new_follower',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    users: [
      { id: '1', name: 'Sarah Chen', avatar: '/pokemon-card-collector-avatar.jpg' },
      { id: '2', name: 'Mike Rodriguez', avatar: '/sneaker-collector-avatar.png' },
      { id: '3', name: 'Emma Wilson', avatar: '/watch-collector-avatar.jpg' },
    ],
    totalCount: 5,
  },
  {
    id: '5',
    type: 'new_follower',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    user: {
      id: '4',
      name: 'Jake Thompson',
      username: 'jakecollects',
      avatar: '/pokemon-card-collector-avatar.jpg',
    },
  },
  {
    id: '6',
    type: 'follow_suggestion',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    user: {
      id: '5',
      name: 'Vintage Vault',
      username: 'vintagevault',
      avatar: '/pokemon-card-collector-avatar.jpg',
    },
  },
  {
    id: '7',
    type: 'group_mention',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
    user: {
      id: '6',
      name: 'Alex Kim',
      username: 'alexk',
      avatar: '/pokemon-card-collector-avatar.jpg',
    },
    group: {
      id: '1',
      name: 'Baseball Cards HQ',
      image: '/placeholder.svg?height=48&width=48',
    },
    messagePreview: "Hey @you, check out this card I found...",
  },
  {
    id: '8',
    type: 'group_invite',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    user: {
      id: '7',
      name: 'RetroCollector',
      username: 'retrocollector',
      avatar: '/pokemon-card-collector-avatar.jpg',
    },
    group: {
      id: '2',
      name: 'Vintage Gaming Finds',
      image: '/placeholder.svg?height=48&width=48',
    },
  },
  {
    id: '9',
    type: 'tracking_alert',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
    collectible: {
      id: '3',
      title: 'Air Jordan 1 Chicago OG',
      image: '/air-jordan-1-chicago-og-sneaker.jpg',
    },
    newStatus: 'sell',
  },
  {
    id: '9b',
    type: 'tracking_alert',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35),
    collectible: {
      id: '6',
      title: 'Vintage Rolex Daytona',
      image: '/rolex-daytona-paul-newman-dial.jpg',
    },
    newStatus: 'trade',
  },
  {
    id: '10',
    type: 'new_item_from_followed',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
    user: {
      id: '8',
      name: 'CardKing',
      username: 'cardking',
      avatar: '/pokemon-card-collector-avatar.jpg',
    },
    collectible: {
      id: '4',
      title: '2023 Topps Chrome Ohtani Auto',
      image: '/placeholder.svg?height=80&width=80',
    },
  },
  {
    id: '11',
    type: 'someone_tracked_your_item',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    users: [
      { id: '9', name: 'CollectorPro', avatar: '/pokemon-card-collector-avatar.jpg' },
      { id: '10', name: 'VintageHunter', avatar: '/pokemon-card-collector-avatar.jpg' },
    ],
    totalCount: 8,
    collectible: {
      id: '5',
      title: 'Rolex Submariner 5513',
      image: '/rolex-daytona-paul-newman-dial.jpg',
    },
  },
];

export function getNotificationCategory(type: NotificationType): NotificationCategory {
  switch (type) {
    case 'new_follower':
    case 'follow_suggestion':
      return 'social';
    case 'new_message':
    case 'group_mention':
    case 'group_invite':
      return 'social';
    case 'tracking_alert':
    case 'new_item_from_followed':
    case 'someone_tracked_your_item':
      return 'collection';
    case 'collectible_view_milestone':
    case 'showcase_view_milestone':
    case 'track_milestone':
      return 'milestones';
    default:
      return 'all';
  }
}
