# React Native Chat System

This chat system is based on the Next.js chat implementation with mobile-first design and complete authentication integration.

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

## Authentication System

### ✅ Implemented

- **AuthContext** (`lib/auth-context.tsx`): Complete TypeScript authentication state management
- **ProtectedRoute** (`components/ProtectedRoute.tsx`): Authentication guard for protected pages
- **Session-based authentication**: No CSRF tokens needed for authenticated operations
- **OAuth integration**: Google and Apple OAuth support with proper callbacks
- **Automatic auth checking**: App checks session status on startup
- **Proper error handling**: Graceful fallbacks for auth failures

### Authentication Flow

1. **App Start**: AuthProvider checks session automatically
2. **Login**: User signs in → AuthContext updates → Navigate to protected route
3. **Protected Routes**: ProtectedRoute checks auth → Redirect to login if not authenticated
4. **Chat Operations**: All API calls use session cookies (no CSRF needed)
5. **Logout**: AuthContext clears user → Redirect to login

## Navigation Flow

### Mobile (< 768px width)

1. `/chat` - Shows contacts list
2. `/chat/[contactId]` - Shows conversations with selected contact
3. `/chat/[contactId]/[conversationId]` - Shows messages in conversation

### Desktop/Tablet (≥ 768px width)

- Shows all three panels side by side
- Same routing but panels update in place

## Features

### ✅ Implemented

- ✅ **Complete authentication system** with session management
- ✅ **Mobile-optimized layout** with proper navigation
- ✅ **Responsive design** (mobile/tablet/desktop)
- ✅ **Real-time message sending** with optimistic updates
- ✅ **Contact search and filtering**
- ✅ **Conversation search and filtering**
- ✅ **Unread message badges**
- ✅ **Message bubbles** with proper styling
- ✅ **Keyboard avoiding view** for better UX
- ✅ **Back navigation** on mobile
- ✅ **Safe area handling**
- ✅ **OAuth integration** (Google & Apple)
- ✅ **Protected routes** with authentication guards
- ✅ **Session-based API calls** (no CSRF tokens)

## Mobile Navigation

The mobile layout uses conditional rendering based on the route:

- No `contactId` → Show contacts panel
- Has `contactId` but no `conversationId` → Show conversations panel
- Has both → Show messages panel

Back button navigation:

- From messages → Back to conversations
- From conversations → Back to contacts

## API Integration

### ✅ React Native Side (Complete)

- **Session-based authentication**: All API calls use `withCredentials: true`
- **Clean API client**: `api/chatapi.tsx` with proper TypeScript interfaces
- **Error handling**: Comprehensive error management
- **Optimistic updates**: Instant UI feedback for better UX

### 🔄 Next.js Backend (Needs Implementation)

The following API endpoints need to be implemented in your Next.js backend:

#### Authentication Endpoints

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/session
GET  /api/auth/csrf (for initial login only)
```

#### Mobile OAuth Endpoints

```
GET  /api/auth/mobile/signin/[provider] (google, apple)
GET  /api/auth/mobile/callback/[provider]
POST /api/auth/mobile/verify
POST /api/auth/token
```

#### Chat Endpoints

```
GET  /api/chat/conversations
GET  /api/chat/conversations/contractor/[contractorId]
GET  /api/chat/conversations/[conversationId]
GET  /api/chat/contacts
GET  /api/chat/contacts/with-conversations
POST /api/chat/messages
POST /api/chat/conversations
PUT  /api/chat/conversations/[conversationId]/read
DELETE /api/chat/messages/[messageId]
GET  /api/chat/unread-count
GET  /api/chat/conversations/search
GET  /api/chat/conversations/contractor/[contractorId]/current
```

## Database Schema

The chat system expects the following Prisma schema structure:

```prisma
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  // ... other fields
}

model Contractor {
  id              Int      @id @default(autoincrement())
  name            String
  city            String
  specializations String[]
  rating          Float
  imageUrl        String?
  // ... other fields
}

model Conversation {
  id           String   @id @default(cuid())
  userId       String
  contractorId Int
  startedAt    DateTime @default(now())
  subject      String?
  Chat         ChatMessage[]
  Contractor   Contractor @relation(fields: [contractorId], references: [id])
  User         User @relation(fields: [userId], references: [id])
}

model ChatMessage {
  id             String   @id @default(cuid())
  subject        String
  text           String
  date           DateTime @default(now())
  read           Boolean  @default(false)
  deleted        Boolean  @default(false)
  labels         String[]
  sender_id      String?
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  User           User? @relation(fields: [sender_id], references: [id])
}
```

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

## Security

- **Session-based authentication**: HTTP-only cookies managed by NextAuth
- **No CSRF tokens needed**: For authenticated operations
- **Protected routes**: Automatic redirect for unauthorized access
- **OAuth security**: Proper state management and token verification

## Next Steps

### 🔄 Backend Implementation (Next.js)

1. **Implement NextAuth.js** with Google and Apple providers
2. **Create chat API routes** using the endpoints listed above
3. **Set up Prisma** with the provided schema
4. **Implement mobile OAuth flow** endpoints
5. **Add session management** with proper cookie handling
6. **Set up CSRF protection** for login endpoints only

### 🚀 Frontend Enhancements

1. Add message status indicators (sent/delivered/read)
2. Add typing indicators
3. Add message reactions
4. Add file/image attachments
5. Add voice messages
6. Add push notifications
7. Add message search within conversations
8. Add real-time updates with WebSocket
9. Add offline message queuing
10. Add message encryption

## Environment Variables

Required for the React Native app:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Apple OAuth
APPLE_CLIENT_SECRET=your_apple_client_secret

# App Configuration
EXPO_PUBLIC_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SCHEME=nativebnbsos://

# JWT (for temporary tokens)
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

## Testing

1. **Authentication**: Test login/logout flow
2. **OAuth**: Test Google and Apple sign-in
3. **Protected Routes**: Verify unauthorized access redirects
4. **Chat Functionality**: Test message sending and receiving
5. **Mobile Navigation**: Test panel switching on mobile
6. **Responsive Design**: Test on different screen sizes
