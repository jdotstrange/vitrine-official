import type { Conversation, Group, Message } from './api/messaging';

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

// =============================================================================
// MOCK DM CONVERSATIONS
// =============================================================================

export const MOCK_DM_CONVERSATIONS: Conversation[] = [
  {
    id: 'dm-1',
    type: 'direct',
    other_user: {
      id: 'u-1',
      name: 'Marcus Chen',
      username: 'marcuscollects',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      is_online: true,
    },
    created_at: daysAgo(14),
    last_message: { content: 'That Jordan 1 is heat. Would you take $320?', created_at: minutesAgo(3) },
    unread_count: 2,
    is_muted: false,
    is_pinned: true,
    is_accepted: true,
    origin_type: 'listing',
    origin_collectible: { id: 'c-1', title: 'Air Jordan 1 Chicago', primary_photo_url: null },
  },
  {
    id: 'dm-2',
    type: 'direct',
    other_user: {
      id: 'u-2',
      name: 'Alyssa Rivera',
      username: 'alyssacards',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      is_online: true,
    },
    created_at: daysAgo(5),
    last_message: { content: 'I just pulled a Wemby auto from a hobby box!!', created_at: minutesAgo(12) },
    unread_count: 1,
    is_muted: false,
    is_pinned: false,
    is_accepted: true,
  },
  {
    id: 'dm-3',
    type: 'direct',
    other_user: {
      id: 'u-3',
      name: 'Jayden Park',
      username: 'jaydenwatches',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      is_online: false,
      last_seen_at: hoursAgo(2),
    },
    created_at: daysAgo(30),
    last_message: { content: 'Shipped the Speedmaster today, tracking incoming', created_at: hoursAgo(4) },
    unread_count: 0,
    is_muted: false,
    is_pinned: true,
    is_accepted: true,
    origin_type: 'listing',
    origin_collectible: { id: 'c-2', title: 'Omega Speedmaster Professional', primary_photo_url: null },
  },
  {
    id: 'dm-4',
    type: 'direct',
    other_user: {
      id: 'u-4',
      name: 'Tara Okonkwo',
      username: 'taravintage',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      is_online: false,
      last_seen_at: daysAgo(1),
    },
    created_at: daysAgo(7),
    last_message: { content: 'Thanks for the trade! Both items arrived safe', created_at: daysAgo(1) },
    unread_count: 0,
    is_muted: false,
    is_pinned: false,
    is_accepted: true,
  },
  {
    id: 'dm-5',
    type: 'direct',
    other_user: {
      id: 'u-5',
      name: 'Diego Salazar',
      username: 'diegoflips',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
      is_online: true,
    },
    created_at: daysAgo(3),
    last_message: { content: 'Do you have any other Dunks in a size 10?', created_at: hoursAgo(6) },
    unread_count: 1,
    is_muted: false,
    is_pinned: false,
    is_accepted: true,
    origin_type: 'profile',
  },
  {
    id: 'dm-6',
    type: 'direct',
    other_user: {
      id: 'u-6',
      name: 'KickzKing99',
      username: 'kickzking99',
      avatar_url: null,
      is_online: false,
      last_seen_at: daysAgo(3),
    },
    created_at: daysAgo(2),
    last_message: { content: 'Hey I saw your collection, would love to connect', created_at: daysAgo(2) },
    unread_count: 1,
    is_muted: false,
    is_pinned: false,
    is_accepted: false,
  },
  {
    id: 'dm-7',
    type: 'direct',
    other_user: {
      id: 'u-7',
      name: 'Samira Patel',
      username: 'samiracollects',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
      is_online: false,
      last_seen_at: hoursAgo(8),
    },
    created_at: daysAgo(10),
    last_message: { content: 'The PSA 10 came back! So hyped', created_at: daysAgo(2) },
    unread_count: 0,
    is_muted: true,
    is_pinned: false,
    is_accepted: true,
  },
];

// =============================================================================
// MOCK JOINED GROUPS (Conversation type='group')
// =============================================================================

export const MOCK_YOUR_GROUPS: Conversation[] = [
  {
    id: 'grp-1',
    type: 'group',
    name: 'Sneaker Vault',
    description: 'The ultimate sneakerhead community. Share pickups, discuss releases, and trade heat.',
    cover_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=200&fit=crop',
    visibility: 'public',
    category_type: 'fashion',
    is_official: true,
    member_count: 4_280,
    online_count: 312,
    created_at: daysAgo(180),
    last_message: { content: 'Just copped the Travis Scott Lows for retail!!', created_at: minutesAgo(8) },
    unread_count: 14,
    is_muted: false,
    is_pinned: true,
    is_accepted: true,
    your_role: 'member',
  },
  {
    id: 'grp-2',
    type: 'group',
    name: 'Wax Rippers',
    description: 'Sports card breaks, pulls, and market talk. All sports welcome.',
    cover_image_url: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=400&h=200&fit=crop',
    visibility: 'public',
    category_type: 'trading-cards',
    is_official: false,
    member_count: 1_890,
    online_count: 147,
    created_at: daysAgo(90),
    last_message: { content: 'PSA turnaround times just dropped to 45 days', created_at: minutesAgo(23) },
    unread_count: 6,
    is_muted: false,
    is_pinned: false,
    is_accepted: true,
    your_role: 'member',
  },
  {
    id: 'grp-3',
    type: 'group',
    name: 'Watch Collectors Club',
    description: 'Horology enthusiasts sharing wrist shots, discussing movements, and tracking market trends.',
    cover_image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=200&fit=crop',
    visibility: 'public',
    category_type: 'watches',
    is_official: false,
    member_count: 732,
    online_count: 48,
    created_at: daysAgo(60),
    last_message: { content: 'New Rolex GMT just hit the AD. Who got the call?', created_at: hoursAgo(1) },
    unread_count: 0,
    is_muted: false,
    is_pinned: false,
    is_accepted: true,
    your_role: 'admin',
  },
  {
    id: 'grp-4',
    type: 'group',
    name: 'Pokémon TCG Traders',
    description: 'Buy, sell, trade Pokémon cards. Legit checks welcome.',
    cover_image_url: 'https://images.unsplash.com/photo-1613771404721-1f92b2b4a36c?w=400&h=200&fit=crop',
    visibility: 'public',
    category_type: 'trading-cards',
    is_official: true,
    member_count: 6_120,
    online_count: 489,
    created_at: daysAgo(365),
    last_message: { content: 'Charizard VMAX alt art went for $800 on last sale', created_at: hoursAgo(3) },
    unread_count: 0,
    is_muted: true,
    is_pinned: false,
    is_accepted: true,
    your_role: 'member',
  },
  {
    id: 'grp-5',
    type: 'group',
    name: 'Vintage Finds',
    description: 'Pre-2000 collectibles only. Retro sneakers, vintage watches, classic cards.',
    cover_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=200&fit=crop',
    visibility: 'public',
    category_type: 'memorabilia',
    is_official: false,
    member_count: 315,
    online_count: 22,
    created_at: daysAgo(45),
    last_message: { content: 'Found a DS pair of 1985 Bred 1s at a garage sale', created_at: daysAgo(1) },
    unread_count: 3,
    is_muted: false,
    is_pinned: false,
    is_accepted: true,
    your_role: 'owner',
  },
];

// =============================================================================
// MOCK DISCOVER GROUPS
// =============================================================================

export const MOCK_TRENDING_GROUPS: Group[] = [
  {
    id: 'disc-1',
    name: 'NBA Rookie Watch',
    description: 'Track the hottest NBA rookies and their card values in real-time.',
    cover_image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop',
    member_count: 3_420,
    online_count: 267,
    is_official: false,
    category_type: 'trading-cards',
    is_joined: false,
  },
  {
    id: 'disc-2',
    name: 'Grail Hunters',
    description: 'The hunt for holy grails in sneakers, watches, and beyond.',
    cover_image_url: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=200&fit=crop',
    member_count: 5_780,
    online_count: 412,
    is_official: true,
    category_type: 'fashion',
    category_code: 'streetwear',
    is_joined: false,
  },
  {
    id: 'disc-3',
    name: 'F1 Memorabilia',
    description: 'Formula 1 race-used helmets, suits, and collectible memorabilia.',
    cover_image_url: 'https://images.unsplash.com/photo-1541744573515-478083e8e6c0?w=400&h=200&fit=crop',
    member_count: 890,
    online_count: 53,
    is_official: false,
    category_type: 'sports',
    is_joined: false,
  },
];

export const MOCK_NEWEST_GROUPS: Group[] = [
  {
    id: 'new-1',
    name: 'Jujutsu Kaisen Cards',
    description: 'Bandai JJK card game discussion, trades, and box breaks.',
    cover_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=200&fit=crop',
    member_count: 124,
    online_count: 31,
    is_official: false,
    category_type: 'trading-cards',
    category_code: 'pokemon',
    is_joined: false,
  },
  {
    id: 'new-2',
    name: 'Moonswatch Collectors',
    description: 'Swatch x Omega MoonSwatch enthusiasts. All 11 missions.',
    cover_image_url: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400&h=200&fit=crop',
    member_count: 456,
    online_count: 28,
    is_official: false,
    category_type: 'watches',
    category_code: 'omega',
    is_joined: false,
  },
  {
    id: 'new-3',
    name: 'SB Dunk Archive',
    description: 'A living archive of every Nike SB Dunk ever released.',
    cover_image_url: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=400&h=200&fit=crop',
    member_count: 87,
    online_count: 9,
    is_official: false,
    category_type: 'fashion',
    category_code: 'sneakers',
    is_joined: true,
  },
  {
    id: 'new-4',
    name: 'One Piece TCG Hub',
    description: 'Bandai One Piece card game pulls, decks, and trades.',
    cover_image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=200&fit=crop',
    member_count: 203,
    online_count: 44,
    is_official: false,
    category_type: 'trading-cards',
    category_code: 'pokemon',
    is_joined: false,
  },
  {
    id: 'new-5',
    name: 'Vintage Jersey Club',
    description: 'Authentic vintage NBA, NFL, and MLB jerseys.',
    cover_image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop',
    member_count: 67,
    online_count: 5,
    is_official: false,
    category_type: 'sports',
    category_code: 'basketball',
    is_joined: false,
  },
];

export const MOCK_OFFICIAL_GROUPS: Group[] = [
  {
    id: 'off-1',
    name: 'Vitrine Marketplace',
    description: 'Official trading hub. Buy and sell with confidence.',
    cover_image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
    member_count: 12_400,
    online_count: 1_230,
    is_official: true,
    category_type: 'fashion',
    is_joined: true,
  },
  {
    id: 'off-2',
    name: 'Vitrine Card Market',
    description: 'Official sports and TCG card trading community.',
    cover_image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=200&fit=crop',
    member_count: 8_900,
    online_count: 678,
    is_official: true,
    category_type: 'trading-cards',
    is_joined: false,
  },
];

// =============================================================================
// MOCK RECOMMENDED GROUPS (for Discover "For You" section)
// =============================================================================

export interface RecommendedGroup extends Group {
  recommendation_reason: string;
}

export const MOCK_RECOMMENDED_GROUPS: RecommendedGroup[] = [
  {
    ...MOCK_TRENDING_GROUPS[0],
    recommendation_reason: 'Popular with trading card collectors',
  },
  {
    ...MOCK_TRENDING_GROUPS[1],
    recommendation_reason: '12 of your connections are here',
  },
  {
    ...MOCK_TRENDING_GROUPS[2],
    recommendation_reason: 'Matches your collection',
  },
  {
    ...MOCK_NEWEST_GROUPS[0],
    recommendation_reason: 'Growing fast — 200% this week',
  },
];

// =============================================================================
// MOCK MESSAGES (for conversation thread previews)
// =============================================================================

const mockUser = (id: string, name: string, avatar: string | null = null, online = false) => ({
  id,
  name,
  username: name.toLowerCase().replace(/\s/g, ''),
  avatar_url: avatar,
  is_online: online,
});

export const MOCK_DM_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    conversation_id: 'dm-1',
    sender: mockUser('u-1', 'Marcus Chen', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', true),
    content: 'Hey, I saw your Air Jordan 1 Chicago listing. Is it still available?',
    message_type: 'text',
    created_at: hoursAgo(3),
  },
  {
    id: 'msg-2',
    conversation_id: 'dm-1',
    sender: mockUser('current', 'You'),
    content: 'Yeah it is! Size 10, worn twice. Asking $350.',
    message_type: 'text',
    created_at: hoursAgo(2.5),
  },
  {
    id: 'msg-3',
    conversation_id: 'dm-1',
    sender: mockUser('u-1', 'Marcus Chen', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', true),
    content: 'Nice. Can I see some more pics of the sole and the toe box?',
    message_type: 'text',
    created_at: hoursAgo(2),
  },
  {
    id: 'msg-4',
    conversation_id: 'dm-1',
    sender: mockUser('current', 'You'),
    content: null,
    message_type: 'text',
    attached_media_urls: [
      'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    ],
    created_at: hoursAgo(1.8),
  },
  {
    id: 'msg-5',
    conversation_id: 'dm-1',
    sender: mockUser('current', 'You'),
    content: 'Here you go. Minimal creasing, soles are clean.',
    message_type: 'text',
    created_at: hoursAgo(1.7),
  },
  {
    id: 'msg-6',
    conversation_id: 'dm-1',
    sender: mockUser('u-1', 'Marcus Chen', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', true),
    content: 'That Jordan 1 is heat. Would you take $320?',
    message_type: 'text',
    created_at: minutesAgo(3),
    reactions: [{ emoji: '🔥', count: 1, users: [{ id: 'current', name: 'You' }], you_reacted: true }],
  },
];

export const MOCK_GROUP_MESSAGES: Message[] = [
  {
    id: 'gmsg-1',
    conversation_id: 'grp-1',
    sender: mockUser('u-10', 'Jake Wilson', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'),
    content: null,
    message_type: 'discussion',
    post_title: 'Which Travis Scott collab holds value best long-term?',
    created_at: hoursAgo(5),
    reactions: [
      { emoji: '🔥', count: 12, users: [], you_reacted: false },
      { emoji: '👍', count: 8, users: [], you_reacted: true },
    ],
  },
  {
    id: 'gmsg-2',
    conversation_id: 'grp-1',
    sender: mockUser('u-11', 'Nina Lopez', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'),
    content: 'Just copped the Travis Scott Lows for retail!! W or L?',
    message_type: 'discussion',
    post_title: 'Retail W on Travis Scott Jordan 1 Low',
    attached_media_urls: [
      'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=600&h=400&fit=crop',
    ],
    created_at: minutesAgo(45),
    reactions: [
      { emoji: '🔥', count: 24, users: [], you_reacted: true },
      { emoji: '❤️', count: 9, users: [], you_reacted: false },
    ],
  },
  {
    id: 'gmsg-3',
    conversation_id: 'grp-1',
    sender: mockUser('u-12', 'D\'Angelo Harris'),
    content: 'Can someone legit check these for me? Got them from a local seller. The stitching on the left pair looks slightly off compared to my retails.',
    message_type: 'legit_check',
    post_title: 'LC: Jordan 4 Military Black - stitching concern',
    attached_media_urls: [
      'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
    ],
    created_at: minutesAgo(20),
  },
  {
    id: 'gmsg-4',
    conversation_id: 'grp-1',
    sender: mockUser('u-13', 'Priya Sharma', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'),
    content: 'Sharing my latest pickup from the Vitrine marketplace. This Omega has been on my wish list for two years.',
    message_type: 'collection_share',
    post_title: 'Finally got the grail!',
    attached_collectible: {
      id: 'c-100',
      title: 'Omega Speedmaster Moonwatch Professional',
      primary_photo_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=300&fit=crop',
      value: 6800,
    },
    created_at: hoursAgo(1),
    reactions: [
      { emoji: '🔥', count: 31, users: [], you_reacted: false },
      { emoji: '😍', count: 15, users: [], you_reacted: true },
    ],
  },
  {
    id: 'gmsg-5',
    conversation_id: 'grp-1',
    sender: mockUser('u-1', 'Marcus Chen', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', true),
    content: 'Great pickup! The hesalite crystal is 👌',
    message_type: 'text',
    reply_to: { id: 'gmsg-4', content: 'Finally got the grail!', sender_name: 'Priya Sharma' },
    created_at: minutesAgo(40),
  },
  {
    id: 'gmsg-6',
    conversation_id: 'grp-1',
    sender: { id: 'system', name: 'System', username: 'system', avatar_url: null, is_online: false },
    content: 'Nina Lopez joined the group',
    message_type: 'system',
    created_at: hoursAgo(6),
  },
];

// =============================================================================
// MOCK ACTIVITY ITEMS (for heartbeat strip)
// =============================================================================

export interface ActivityItem {
  id: string;
  groupId: string;
  groupName: string;
  groupAvatar: string;
  userName: string;
  action: string;
  timeAgo: string;
}

export const MOCK_ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 'act-1', groupId: 'grp-1', groupName: 'Sneaker Vault', groupAvatar: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=100&h=100&fit=crop', userName: 'Marcus', action: 'posted in', timeAgo: '2m' },
  { id: 'act-2', groupId: 'grp-2', groupName: 'Card Breakers', groupAvatar: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=100&h=100&fit=crop', userName: 'Alyssa', action: 'shared a card in', timeAgo: '5m' },
  { id: 'act-3', groupId: 'grp-1', groupName: 'Sneaker Vault', groupAvatar: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=100&h=100&fit=crop', userName: "D'Angelo", action: 'asked for a legit check in', timeAgo: '12m' },
  { id: 'act-4', groupId: 'grp-3', groupName: 'Watch Collectors', groupAvatar: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100&h=100&fit=crop', userName: 'Jayden', action: 'posted in', timeAgo: '18m' },
  { id: 'act-5', groupId: 'grp-2', groupName: 'Card Breakers', groupAvatar: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=100&h=100&fit=crop', userName: 'Tara', action: 'shared a showcase in', timeAgo: '25m' },
  { id: 'act-6', groupId: 'grp-4', groupName: 'Jersey Exchange', groupAvatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&h=100&fit=crop', userName: 'Kai', action: 'posted in', timeAgo: '31m' },
  { id: 'act-7', groupId: 'grp-1', groupName: 'Sneaker Vault', groupAvatar: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=100&h=100&fit=crop', userName: 'Priya', action: 'replied in', timeAgo: '40m' },
  { id: 'act-8', groupId: 'grp-3', groupName: 'Watch Collectors', groupAvatar: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100&h=100&fit=crop', userName: 'Nina', action: 'joined', timeAgo: '1h' },
];

export function getMockMessagesForConversation(conversationId: string): Message[] {
  if (conversationId.startsWith('grp-')) return MOCK_GROUP_MESSAGES;
  if (conversationId === 'dm-1') return MOCK_DM_MESSAGES;
  return MOCK_DM_MESSAGES.map((m, i) => ({
    ...m,
    id: `${conversationId}-msg-${i}`,
    conversation_id: conversationId,
  }));
}
