# React Native Chat System

This chat system is based on the Next.js chat implementation with mobile-first design.

## Structure

```
chat/
├── index.tsx                    # Main chat page (contacts list)
├── [contactId].tsx             # Conversations with specific contact
├── [contactId]/
│   └── [conversationId].tsx   # Messages in specific conversation
└── components/
    ├── ChatLayout.tsx          # Main layout component (mobile/desktop)
    ├── LeftPanel.tsx           # Contacts panel
    ├── MiddlePanel.tsx         # Conversations panel
    └── RightPanel.tsx          # Messages panel
```

## Navigation Flow

### Mobile (< 768px width)

1. `/chat` - Shows contacts list
2. `/chat/[contactId]` - Shows conversations with selected contact
3. `/chat/[contactId]/[conversationId]` - Shows messages in conversation

### Desktop/Tablet (≥ 768px width)

- Shows all three panels side by side
- Same routing but panels update in place

## Features

- ✅ Mobile-optimized layout with proper navigation
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Real-time message sending with optimistic updates
- ✅ Contact search and filtering
- ✅ Conversation search and filtering
- ✅ Unread message badges
- ✅ Message bubbles with proper styling
- ✅ Keyboard avoiding view for better UX
- ✅ Back navigation on mobile
- ✅ Safe area handling

## Mobile Navigation

The mobile layout uses conditional rendering based on the route:

- No `contactId` → Show contacts panel
- Has `contactId` but no `conversationId` → Show conversations panel
- Has both → Show messages panel

Back button navigation:

- From messages → Back to conversations
- From conversations → Back to contacts

## API Integration

Currently uses the mock API from `api/chatapi.tsx`. The system processes raw messages into:

- **Contacts**: Unique users you've chatted with
- **Conversations**: Message threads between you and each contact
- **Messages**: Individual messages within conversations

## Styling

- Consistent mobile-first design
- iOS-style message bubbles
- Material Design icons (Ionicons)
- Responsive text sizes and spacing
- Touch-friendly button sizes (44px minimum)

## Performance

- Optimistic UI updates for instant feedback
- Efficient FlatList rendering for large message lists
- Proper keyboard handling
- Smooth animations and transitions

## Next Steps

1. Connect to real backend API (replace mock data)
2. Add message status indicators (sent/delivered/read)
3. Add typing indicators
4. Add message reactions
5. Add file/image attachments
6. Add voice messages
7. Add push notifications
8. Add message search within conversations
