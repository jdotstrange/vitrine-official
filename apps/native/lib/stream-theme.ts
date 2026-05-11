import type { DeepPartial } from 'stream-chat-expo';
import type { Theme } from 'stream-chat-expo';
import { colors } from '@/lib/colors';

export const vitrineStreamTheme: DeepPartial<Theme> = {
  colors: {
    accent_blue: colors.primary,
    accent_green: colors.success,
    accent_red: colors.destructive,
    bg_gradient_end: colors.background,
    bg_gradient_start: colors.background,
    black: colors.foreground,
    border: colors.border,
    grey: colors.mutedForeground,
    grey_dark: '#8A8A82',
    grey_gainsboro: colors.surfaceElevated,
    grey_whisper: colors.card,
    icon_background: colors.surfaceElevated,
    white: colors.background,
    white_smoke: colors.card,
    white_snow: colors.surfaceElevated,
    static_black: '#000000',
    static_white: '#FFFFFF',
    text_high_emphasis: colors.foreground,
    text_low_emphasis: colors.mutedForeground,
    overlay: 'rgba(0, 0, 0, 0.7)',
    transparent: 'transparent',
  },

  channelListMessenger: {
    flatList: {
      backgroundColor: colors.background,
    },
    flatListContent: {
      backgroundColor: colors.background,
    },
  },

  channelPreview: {
    container: {
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    contentContainer: {
      backgroundColor: colors.background,
    },
    title: {
      color: colors.foreground,
      fontWeight: '600',
      fontSize: 15,
    },
    message: {
      container: {},
    },
    date: {
      color: colors.mutedForeground,
      fontSize: 12,
    },
    unreadContainer: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: colors.primaryForeground,
      fontSize: 11,
      fontWeight: '700',
    },
    row: {
      gap: 12,
    },
  },

  messageSimple: {
    content: {
      container: {
        borderWidth: 0,
        borderRadiusL: 16,
        borderRadiusS: 16,
      },
      containerInner: {
        borderWidth: 0,
        borderRadius: 16,
      },
      receiverMessageBackgroundColor: colors.primary,
      markdown: {
        text: {
          color: colors.primaryForeground,
          fontSize: 15,
          lineHeight: 21,
        },
      },
      metaText: {
        color: 'rgba(12, 12, 16, 0.55)',
        fontSize: 11,
      },
      textContainer: {
        onlyEmojiMarkdown: {
          text: { fontSize: 36 },
        },
      },
    },
    card: {
      container: {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderRadius: 12,
      },
      footer: {
        description: { color: colors.mutedForeground },
        title: { color: colors.foreground },
      },
    },
    gallery: {
      galleryContainer: {
        borderRadius: 12,
        overflow: 'hidden',
      },
    },
    reactionListBottom: {
      contentContainer: {},
      item: {
        unfilledBackgroundColor: colors.surfaceElevated,
        filledBackgroundColor: 'rgba(211, 255, 195, 0.15)',
        iconFillColor: colors.primary,
        iconUnFillColor: colors.mutedForeground,
      },
    },
    file: {
      container: {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderRadius: 12,
      },
      title: {
        color: colors.foreground,
      },
      fileSize: {
        color: colors.mutedForeground,
      },
    },
    pinnedHeader: {
      container: {
        backgroundColor: colors.surfaceElevated,
      },
      label: {
        color: colors.mutedForeground,
      },
    },
    status: {
      checkAllIcon: {
        pathFill: colors.primary,
      },
      checkIcon: {
        pathFill: colors.mutedForeground,
      },
      readByCount: {
        color: colors.primary,
        fontSize: 11,
      },
    },
  },

  messageInput: {
    container: {
      backgroundColor: colors.background,
      borderTopColor: 'transparent',
      borderTopWidth: 0,
      paddingTop: 10,
      paddingBottom: 20,
      paddingHorizontal: 12,
    },
    composerContainer: {
      alignItems: 'center',
    },
    inputBoxContainer: {
      backgroundColor: colors.surfaceElevated,
      borderColor: 'transparent',
      borderRadius: 22,
      borderWidth: 0,
      paddingHorizontal: 14,
      minHeight: 46,
    },
    inputBox: {
      color: colors.foreground,
      fontSize: 16,
      lineHeight: 22,
      paddingTop: 10,
      paddingBottom: 10,
    },
    sendButtonContainer: {
      marginLeft: 0,
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    suggestions: {
      command: {
        container: { backgroundColor: colors.card },
        title: { color: colors.foreground },
        args: { color: colors.mutedForeground },
      },
      header: {
        container: { backgroundColor: colors.card, borderBottomColor: colors.border },
        title: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600' },
      },
      mention: {
        container: { backgroundColor: colors.card },
        name: { color: colors.foreground, fontWeight: '600' },
        tag: { color: colors.mutedForeground },
      },
    },
    suggestionsListContainer: {
      container: {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
      },
    },
  },

  messageList: {
    container: {
      backgroundColor: colors.background,
    },
    contentContainer: {
      backgroundColor: colors.background,
    },
    messageSystem: {
      container: {
        paddingVertical: 8,
      },
      text: {
        color: colors.mutedForeground,
        fontSize: 12,
      },
      dateText: {
        color: colors.mutedForeground,
        fontSize: 12,
      },
      line: {
        backgroundColor: colors.border,
      },
    },
    scrollToBottomButton: {
      container: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 20,
        width: 40,
        height: 40,
      },
      chevronColor: colors.foreground,
    },
    typingIndicatorContainer: {
      backgroundColor: colors.background,
    },
  },

  loadingIndicator: {
    container: {
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.mutedForeground,
    },
  },

  emptyStateIndicator: {
    channelContainer: {
      backgroundColor: colors.background,
    },
    channelTitle: {
      color: colors.foreground,
      fontSize: 16,
      fontWeight: '600',
    },
    channelDetails: {
      color: colors.mutedForeground,
      fontSize: 14,
    },
    messageContainer: {
      backgroundColor: colors.background,
    },
    messageTitle: {
      color: colors.mutedForeground,
      fontSize: 14,
    },
  },

  typingIndicator: {
    container: {
      backgroundColor: colors.background,
    },
    text: {
      color: colors.mutedForeground,
      fontSize: 12,
    },
  },

  dateHeader: {
    container: {
      backgroundColor: 'transparent',
      height: 28,
      paddingHorizontal: 0,
      paddingVertical: 4,
    },
    text: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },
  },

  inlineDateSeparator: {
    container: {
      backgroundColor: 'transparent',
      height: 28,
      paddingHorizontal: 0,
      paddingVertical: 4,
    },
    text: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '600' as const,
    },
  },

  messageMenu: {
    actionList: {
      container: {
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
      },
    },
    actionListItem: {
      container: {
        backgroundColor: colors.card,
      },
      title: {
        color: colors.foreground,
      },
    },
    reactionPicker: {
      container: {
        backgroundColor: colors.card,
        borderRadius: 24,
      },
    },
    reactionButton: {
      unfilledColor: colors.mutedForeground,
      filledColor: colors.primary,
      unfilledBackgroundColor: 'transparent',
      filledBackgroundColor: 'rgba(211, 255, 195, 0.15)',
    },
  },

  reply: {
    container: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderRadius: 12,
    },
    messageContainer: {},
    markdownStyles: {
      text: { color: colors.mutedForeground, fontSize: 13 },
    },
  },

  imageGallery: {
    backgroundColor: colors.background,
    header: {
      container: { backgroundColor: colors.background },
      usernameText: { color: colors.foreground, fontWeight: '600' },
      dateText: { color: colors.mutedForeground },
    },
    footer: {
      container: { backgroundColor: colors.background },
      imageCountText: { color: colors.foreground },
    },
  },

  avatar: {
    BASE_AVATAR_SIZE: 40,
    container: {},
    image: {
      borderRadius: 20,
    },
  },

  bottomSheetModal: {
    container: {
      backgroundColor: colors.card,
    },
    contentContainer: {
      backgroundColor: colors.card,
    },
    handle: {
      backgroundColor: colors.mutedForeground,
    },
  },
};
