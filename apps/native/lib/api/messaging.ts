/**
 * Messaging API Client
 * Handles all messaging/community operations via Supabase Edge Functions
 */

import { getAuthToken } from './config';
import { logger } from '../logger';

// Supabase Edge Functions URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const log = logger.create('API');

log.debug('Config:', {
  supabaseUrl: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  anonKeyLength: SUPABASE_ANON_KEY.length,
});

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen_at?: string;
}

export type ConversationOriginType = 'listing' | 'profile' | 'group' | 'search';

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  other_user?: User;
  name?: string;
  description?: string;
  cover_image_url?: string;
  visibility?: 'public' | 'private';
  tier?: 'private_user' | 'public_user' | 'public_official';
  category_type?: string;
  category_code?: string;
  is_official?: boolean;
  member_count?: number;
  online_count?: number;
  created_by?: { id: string; name: string; avatar_url: string | null };
  created_at: string;
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
  is_muted: boolean;
  is_pinned: boolean;
  is_accepted: boolean;
  your_role?: 'owner' | 'admin' | 'member';
  joined_at?: string;
  updated_at?: string;
  origin_type?: ConversationOriginType | null;
  origin_collectible_id?: string | null;
  origin_collectible?: {
    id: string;
    title: string;
    primary_photo_url: string | null;
  } | null;
}

export type MessageType = 'text' | 'system' | 'discussion' | 'collection_share' | 'showcase_share' | 'legit_check';

export interface Message {
  id: string;
  conversation_id?: string;
  sender: User;
  content: string | null;
  message_type: MessageType;
  post_title?: string | null;
  attached_collectible?: {
    id: string;
    title: string;
    primary_photo_url: string | null;
    value: number | null;
  } | null;
  attached_showcase?: {
    id: string;
    title: string;
    cover_image_url: string | null;
  } | null;
  attached_media_urls?: string[] | null;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  } | null;
  reactions?: {
    emoji: string;
    count: number;
    users: { id: string; name: string }[];
    you_reacted: boolean;
  }[];
  created_at: string;
  edited_at?: string;
  system_event_type?: string;
  system_event_data?: Record<string, unknown>;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  member_count: number;
  online_count: number;
  is_official: boolean;
  category_type: string;
  category_code?: string;
  is_joined: boolean;
}

export interface GroupMember {
  user_id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member';
  is_online: boolean;
  joined_at: string;
}

export interface MessagingSettings {
  dm_privacy: 'everyone' | 'followers' | 'nobody';
  show_read_receipts: boolean;
  show_online_status: boolean;
}

// =============================================================================
// API HELPERS
// =============================================================================

async function callEdgeFunction<T>(
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    params?: Record<string, string>;
    body?: Record<string, unknown>;
  } = {}
): Promise<T> {
  const { method = 'GET', params, body } = options;
  const token = await getAuthToken();
  
  log.debug(`Calling ${functionName}:`, {
    method,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
  });
  
  let url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url = `${url}?${queryString}`;
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    log.warn(`No auth token available for ${functionName}`);
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    log.error(`${functionName} failed:`, {
      status: response.status,
      error: data.error || data.message,
      data,
    });
    throw new Error(data.error || data.message || `API error: ${response.status}`);
  }
  
  return data as T;
}

// =============================================================================
// CONVERSATIONS API
// =============================================================================

/**
 * Create or get existing DM conversation
 */
export async function createDM(
  recipientId: string,
  origin?: { type: ConversationOriginType; collectible_id?: string }
): Promise<{
  conversation: Conversation;
}> {
  const body: Record<string, unknown> = { recipient_id: recipientId };
  if (origin) {
    body.origin_type = origin.type;
    if (origin.collectible_id) body.origin_collectible_id = origin.collectible_id;
  }
  return callEdgeFunction('conversations-create-dm', {
    method: 'POST',
    body,
  });
}

/**
 * Get list of user's conversations (inbox)
 */
export async function getConversations(options: {
  type?: 'all' | 'direct' | 'group';
  filter?: 'all' | 'unread' | 'requests';
  limit?: number;
  cursor?: string;
} = {}): Promise<{
  conversations: Conversation[];
  next_cursor: string | null;
  has_more: boolean;
}> {
  const params: Record<string, string> = {};
  if (options.type) params.type = options.type;
  if (options.filter) params.filter = options.filter;
  if (options.limit) params.limit = options.limit.toString();
  if (options.cursor) params.cursor = options.cursor;
  
  return callEdgeFunction('conversations-list', { params });
}

/**
 * Get single conversation details
 */
export async function getConversation(conversationId: string): Promise<{
  conversation: Conversation;
}> {
  return callEdgeFunction('conversations-get', {
    params: { conversation_id: conversationId },
  });
}

/**
 * Accept a message request or group invite
 */
export async function acceptConversation(conversationId: string): Promise<{
  success: boolean;
}> {
  return callEdgeFunction('conversations-accept', {
    method: 'POST',
    params: { conversation_id: conversationId },
  });
}

/**
 * Decline a message request or group invite
 */
export async function declineConversation(conversationId: string): Promise<{
  success: boolean;
}> {
  return callEdgeFunction('conversations-decline', {
    method: 'POST',
    params: { conversation_id: conversationId },
  });
}

/**
 * Update conversation settings (mute/pin)
 */
export async function updateConversationSettings(
  conversationId: string,
  settings: { is_muted?: boolean; is_pinned?: boolean }
): Promise<{
  success: boolean;
  is_muted: boolean;
  is_pinned: boolean;
}> {
  return callEdgeFunction('conversations-settings', {
    method: 'PATCH',
    params: { conversation_id: conversationId },
    body: settings,
  });
}

/**
 * Mark conversation as read
 */
export async function markAsRead(
  conversationId: string,
  lastReadMessageId?: string
): Promise<{
  success: boolean;
  last_read_at: string;
}> {
  const params: Record<string, string> = { conversation_id: conversationId };
  if (lastReadMessageId) params.last_read_message_id = lastReadMessageId;
  
  return callEdgeFunction('conversations-mark-read', {
    method: 'POST',
    params,
  });
}

/**
 * Leave a group conversation
 */
export async function leaveConversation(conversationId: string): Promise<{
  success: boolean;
}> {
  return callEdgeFunction('conversations-leave', {
    method: 'POST',
    params: { conversation_id: conversationId },
  });
}

// =============================================================================
// MESSAGES API
// =============================================================================

/**
 * Send a message
 */
export async function sendMessage(options: {
  conversation_id: string;
  content?: string;
  message_type?: MessageType;
  post_title?: string;
  media_urls?: string[];
  collectible_id?: string;
  showcase_id?: string;
  reply_to_message_id?: string;
  mentioned_user_ids?: string[];
}): Promise<{
  message: Message;
}> {
  return callEdgeFunction('messages-send', {
    method: 'POST',
    body: options,
  });
}

/**
 * Get messages for a conversation
 */
export async function getMessages(options: {
  conversation_id: string;
  limit?: number;
  before?: string;
  after?: string;
}): Promise<{
  messages: Message[];
  has_more: boolean;
}> {
  const params: Record<string, string> = {
    conversation_id: options.conversation_id,
  };
  if (options.limit) params.limit = options.limit.toString();
  if (options.before) params.before = options.before;
  if (options.after) params.after = options.after;
  
  return callEdgeFunction('messages-list', { params });
}

/**
 * Edit a message (within 15 minute window)
 */
export async function editMessage(
  messageId: string,
  content: string
): Promise<{
  message: { id: string; content: string; edited_at: string };
}> {
  return callEdgeFunction('messages-edit', {
    method: 'PATCH',
    params: { message_id: messageId },
    body: { content },
  });
}

/**
 * Delete a message
 */
export async function deleteMessage(
  messageId: string,
  forEveryone: boolean = false
): Promise<{
  success: boolean;
}> {
  return callEdgeFunction('messages-delete', {
    method: 'DELETE',
    params: { 
      message_id: messageId,
      for: forEveryone ? 'everyone' : 'me',
    },
  });
}

/**
 * Add reaction to a message
 */
export async function addReaction(
  messageId: string,
  emoji: string
): Promise<{
  success: boolean;
  reaction_count: number;
}> {
  return callEdgeFunction('messages-reactions', {
    method: 'POST',
    params: { message_id: messageId, emoji },
  });
}

/**
 * Remove reaction from a message
 */
export async function removeReaction(
  messageId: string,
  emoji: string
): Promise<{
  success: boolean;
  reaction_count: number;
}> {
  return callEdgeFunction('messages-reactions', {
    method: 'DELETE',
    params: { message_id: messageId, emoji },
  });
}

// =============================================================================
// POST VOTES API (Legit Check)
// =============================================================================

export interface PostVoteCounts {
  message_id: string;
  legit_count: number;
  suspect_count: number;
  your_vote: 'legit' | 'suspect' | null;
}

/**
 * Get vote counts for a legit check post
 */
export async function getPostVotes(messageId: string): Promise<PostVoteCounts> {
  return callEdgeFunction('post-votes', {
    params: { message_id: messageId },
  });
}

/**
 * Cast or update a vote on a legit check post
 */
export async function castPostVote(
  messageId: string,
  vote: 'legit' | 'suspect'
): Promise<{ success: boolean; vote: string }> {
  return callEdgeFunction('post-votes', {
    method: 'POST',
    params: { message_id: messageId },
    body: { vote },
  });
}

/**
 * Remove your vote from a legit check post
 */
export async function removePostVote(messageId: string): Promise<{ success: boolean }> {
  return callEdgeFunction('post-votes', {
    method: 'DELETE',
    params: { message_id: messageId },
  });
}

// =============================================================================
// GROUPS API
// =============================================================================

/**
 * Create a new group
 */
export async function createGroup(options: {
  name: string;
  description?: string;
  cover_image_url?: string;
  visibility: 'public' | 'private';
  category_type?: string;
  category_code?: string;
  invited_user_ids?: string[];
}): Promise<{
  conversation: Conversation;
}> {
  return callEdgeFunction('groups-create', {
    method: 'POST',
    body: options,
  });
}

/**
 * Join a public group
 */
export async function joinGroup(groupId: string): Promise<{
  success: boolean;
  conversation_id: string;
  your_role: 'member';
}> {
  const { ensurePublicUserExists } = await import('@/lib/supabase');
  await ensurePublicUserExists();
  return callEdgeFunction('groups-join', {
    method: 'POST',
    params: { group_id: groupId },
  });
}

/**
 * Discover public groups
 */
export async function discoverGroups(options: {
  search?: string;
  category_type?: string;
  category_code?: string;
  sort?: 'trending' | 'newest' | 'largest';
  limit?: number;
  cursor?: string;
} = {}): Promise<{
  groups: Group[];
  next_cursor: string | null;
  has_more: boolean;
}> {
  const params: Record<string, string> = {};
  if (options.search) params.search = options.search;
  if (options.category_type) params.category_type = options.category_type;
  if (options.category_code) params.category_code = options.category_code;
  if (options.sort) params.sort = options.sort;
  if (options.limit) params.limit = options.limit.toString();
  if (options.cursor) params.cursor = options.cursor;
  
  return callEdgeFunction('groups-discover', { params });
}

/**
 * Get group members
 */
export async function getGroupMembers(options: {
  group_id: string;
  role?: 'owner' | 'admin' | 'member' | 'all';
  search?: string;
  limit?: number;
}): Promise<{
  members: GroupMember[];
  total_count: number;
  has_more: boolean;
}> {
  const params: Record<string, string> = { group_id: options.group_id };
  if (options.role) params.role = options.role;
  if (options.search) params.search = options.search;
  if (options.limit) params.limit = options.limit.toString();
  
  return callEdgeFunction('groups-members', { params });
}

/**
 * Invite users to a group
 */
export async function inviteToGroup(
  groupId: string,
  userIds: string[]
): Promise<{
  invited: string[];
  failed: { user_id: string; reason: string }[];
}> {
  return callEdgeFunction('groups-members', {
    method: 'POST',
    params: { group_id: groupId },
    body: { user_ids: userIds },
  });
}

/**
 * Update member role or kick
 */
export async function updateGroupMember(options: {
  group_id: string;
  user_id: string;
  role?: 'admin' | 'member';
  action?: 'kick' | 'ban';
}): Promise<{
  success: boolean;
}> {
  return callEdgeFunction('groups-members', {
    method: 'PATCH',
    params: { group_id: options.group_id },
    body: { 
      user_id: options.user_id,
      role: options.role,
      action: options.action,
    },
  });
}

/**
 * Update group settings
 */
export async function updateGroup(
  groupId: string,
  settings: {
    name?: string;
    description?: string;
    cover_image_url?: string;
    visibility?: 'public' | 'private';
  }
): Promise<{
  conversation: Conversation;
}> {
  return callEdgeFunction('groups-update', {
    method: 'PATCH',
    params: { group_id: groupId },
    body: settings,
  });
}

// =============================================================================
// USER SETTINGS API
// =============================================================================

/**
 * Get messaging settings
 */
export async function getMessagingSettings(): Promise<MessagingSettings> {
  return callEdgeFunction('messaging-settings', { method: 'GET' });
}

/**
 * Update messaging settings
 */
export async function updateMessagingSettings(
  settings: Partial<MessagingSettings>
): Promise<{
  success: boolean;
  settings: MessagingSettings;
}> {
  return callEdgeFunction('messaging-settings', {
    method: 'PATCH',
    body: settings,
  });
}

/**
 * Block a user
 */
export async function blockUser(userId: string): Promise<{
  success: boolean;
}> {
  return callEdgeFunction('users-block', {
    method: 'POST',
    params: { user_id: userId },
  });
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string): Promise<{
  success: boolean;
}> {
  return callEdgeFunction('users-block', {
    method: 'DELETE',
    params: { user_id: userId },
  });
}

// =============================================================================
// REPORTS API
// =============================================================================

/**
 * Report content
 */
export async function reportContent(options: {
  type: 'message' | 'user' | 'group';
  target_id: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other';
  details?: string;
}): Promise<{
  report_id: string;
  success: boolean;
}> {
  return callEdgeFunction('reports-create', {
    method: 'POST',
    body: options,
  });
}

// =============================================================================
// RECENT CONTACTS API
// =============================================================================

export interface RecentContact {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  conversation_id?: string;
}

/**
 * Get recent DM contacts ordered by last message time
 */
export async function getRecentContacts(limit: number = 10): Promise<{
  contacts: RecentContact[];
}> {
  return callEdgeFunction('contacts-recent', {
    params: { limit: limit.toString() },
  });
}

// =============================================================================
// UNREAD COUNTS API
// =============================================================================

export interface UnreadCounts {
  dm_unread: number;
  group_unread: number;
}

/**
 * Get unread conversation counts for badge rendering
 */
export async function getUnreadCounts(): Promise<UnreadCounts> {
  return callEdgeFunction('unread-counts');
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format relative time
 */
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Format conversation preview
 */
export function formatConversationPreview(conversation: Conversation): string {
  if (!conversation.last_message?.content) return 'No messages yet';
  
  const preview = conversation.last_message.content;
  return preview.length > 50 ? `${preview.slice(0, 50)}...` : preview;
}

/**
 * Check if conversation has unread messages
 */
export function hasUnread(conversation: Conversation): boolean {
  return conversation.unread_count > 0 && !conversation.is_muted;
}

// =============================================================================
// MEDIA UPLOAD API
// =============================================================================

/**
 * Upload media file for messages
 */
export async function uploadMedia(
  file: { uri: string; type: string; name: string },
  options: { bucket?: string; folder?: string } = {}
): Promise<{
  url: string;
  optimized_url: string;
  thumbnail_url: string;
  path: string;
  size: number;
  type: string;
}> {
  const token = await getAuthToken();
  const url = `${SUPABASE_URL}/functions/v1/media-upload`;
  
  log.debug('Uploading media:', {
    fileName: file.name,
    hasToken: !!token,
    tokenLength: token?.length || 0,
  });
  
  const formData = new FormData();
  
  // React Native FormData expects { uri, type, name } - differs from web Blob/File
  type RNFormDataFile = { uri: string; type: string; name: string };
  formData.append('file', file as RNFormDataFile);
  
  if (options.bucket) formData.append('bucket', options.bucket);
  if (options.folder) formData.append('folder', options.folder);
  
  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    log.warn('No auth token available for media upload');
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    log.error('Media upload failed:', {
      status: response.status,
      error: data.error || data.message,
      data,
    });
    throw new Error(data.error || data.message || `Upload failed: ${response.status}`);
  }
  
  return data;
}
