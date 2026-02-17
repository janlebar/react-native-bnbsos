# Better Auth Mobile Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Mobile App                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  UI Layer    │────────▶│ Auth Context │                  │
│  │ (Screens)    │         │              │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                          │
│                                   ▼                          │
│  ┌──────────────────────────────────────────────┐           │
│  │         Secure Storage                       │           │
│  │  • Access Token (JWT, 20s)                   │           │
│  │  • Refresh Token (JWT, 30d)                  │           │
│  │  • User Data (cached)                        │           │
│  └──────────────────────────────────────────────┘           │
│                                   │                          │
│                                   ▼                          │
│  ┌──────────────────────────────────────────────┐           │
│  │     Authenticated Fetch / Axios              │           │
│  │  • Auto token injection                      │           │
│  │  • Auto token refresh                        │           │
│  │  • Request/Response interceptors             │           │
│  └──────────────┬───────────────────────────────┘           │
│                 │                                            │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  │ HTTPS / JWT Bearer Token
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Backend                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────┐           │
│  │           Better Auth                        │           │
│  │  • JWT Plugin                                │           │
│  │  • Expo Plugin                               │           │
│  │  • 2FA Plugin                                │           │
│  └──────────────┬───────────────────────────────┘           │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────┐           │
│  │        Mobile API Routes                     │           │
│  │  /api/mobile/auth/*                          │           │
│  │  /api/mobile/contractors/*                   │           │
│  │  /api/mobile/chat/*                          │           │
│  └──────────────┬───────────────────────────────┘           │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────┐           │
│  │          Prisma ORM                          │           │
│  └──────────────┬───────────────────────────────┘           │
│                 │                                            │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
│  • Users & Sessions                                          │
│  • Contractors                                               │
│  • Conversations & Messages                                  │
│  • JWKS (JWT Keys)                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌──────────────┐
│ Mobile App   │
│ Login Screen │
└──────┬───────┘
       │
       │ 1. POST /api/mobile/auth/login
       │    { email, password }
       │
       ▼
┌────────────────────────┐
│ Next.js Backend        │
│ /api/mobile/auth/login │
├────────────────────────┤
│ 2. Verify credentials  │
│ 3. Generate tokens:    │
│    • Access (20s)      │
│    • Refresh (30d)     │
│ 4. Create session      │
└──────┬─────────────────┘
       │
       │ Returns:
       │ {
       │   user: {...},
       │   token: "eyJ...",
       │   refreshToken: "eyJ..."
       │ }
       │
       ▼
┌──────────────────────┐
│ Mobile App           │
│ Secure Storage       │
├──────────────────────┤
│ 5. Save tokens       │
│ 6. Save user data    │
│ 7. Update context    │
│ 8. Navigate to home  │
└──────────────────────┘
```

---

## Token Refresh Flow

```
Time: 0s                    Time: 20s                   Time: 21s
────────────────────────────────────────────────────────────────▶

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Access Token │         │ Token        │         │ New Token    │
│ Generated    │────────▶│ Expires      │────────▶│ Generated    │
└──────────────┘         └──────────────┘         └──────────────┘
                                  │
                                  │ User makes API call
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ API Call Fails  │
                         │ 401 Unauthorized│
                         └────────┬────────┘
                                  │
                                  │ Axios Interceptor
                                  │
                                  ▼
                         ┌─────────────────────────┐
                         │ POST /api/mobile/auth/  │
                         │ refresh                 │
                         │ { refreshToken }        │
                         └────────┬────────────────┘
                                  │
                                  │ Returns new tokens
                                  │
                                  ▼
                         ┌─────────────────────────┐
                         │ 1. Save new tokens      │
                         │ 2. Retry original call  │
                         │    with new token       │
                         └─────────────────────────┘
```

---

## API Request Flow with Token Injection

```
┌─────────────────┐
│ Mobile App      │
│ User Action     │
└────────┬────────┘
         │
         │ Example: api.get('/contractors')
         │
         ▼
┌──────────────────────────────┐
│ Axios Request Interceptor    │
├──────────────────────────────┤
│ 1. Get access token from     │
│    secure storage             │
│ 2. Add to headers:            │
│    Authorization:             │
│    Bearer eyJ...              │
└────────┬─────────────────────┘
         │
         │ HTTPS Request
         │ with JWT token
         │
         ▼
┌──────────────────────────────┐
│ Next.js Backend              │
│ Mobile API Route             │
├──────────────────────────────┤
│ 1. Extract Bearer token      │
│ 2. Verify JWT signature      │
│ 3. Check expiration          │
│ 4. Extract user ID           │
│ 5. Fetch data                │
└────────┬─────────────────────┘
         │
         │ Response or 401
         │
         ▼
┌──────────────────────────────┐
│ Axios Response Interceptor   │
├──────────────────────────────┤
│ If 401:                      │
│   1. Try token refresh       │
│   2. Retry request           │
│ If 200:                      │
│   1. Return data             │
└────────┬─────────────────────┘
         │
         │ Data returned to app
         │
         ▼
┌─────────────────┐
│ Mobile App      │
│ Update UI       │
└─────────────────┘
```

---

## Data Models

### User (Better Auth Schema)

```typescript
{
  id: string (cuid)
  name: string | null
  email: string (unique)
  emailVerified: Date | null
  image: string | null
  role: "USER" | "ADMIN"
  isTwoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
  
  // Relations
  contractor?: Contractor
  sessions: Session[]
  conversations: Conversation[]
  accounts: Account[]
}
```

### Session (Better Auth)

```typescript
{
  id: string (cuid)
  token: string (unique)
  userId: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
}
```

### JWT Token Payload

**Access Token (20s expiry):**
```typescript
{
  userId: string
  email: string
  isContractor: boolean
  type: "access"
  iat: number  // issued at
  exp: number  // expiration
}
```

**Refresh Token (30d expiry):**
```typescript
{
  userId: string
  email: string
  isContractor: boolean
  type: "refresh"
  iat: number
  exp: number
}
```

---

## Security Considerations

### Token Storage
✅ **Secure Storage** - Uses platform-specific secure storage
  - iOS: Keychain
  - Android: Keystore
  - Web: LocalStorage (less secure, for development only)

### Token Transmission
✅ **HTTPS** - All API calls use HTTPS in production
✅ **Bearer Token** - Standard Authorization header
✅ **CORS** - Configured for mobile origins

### Token Lifetime
✅ **Short Access Token** - 20 seconds (limits exposure)
✅ **Long Refresh Token** - 30 days (user convenience)
✅ **Automatic Refresh** - Seamless for user

### Token Validation
✅ **JWT Signature** - Cryptographically signed (EdDSA/Ed25519)
✅ **Expiration Check** - Server validates timestamp
✅ **User Verification** - Checks user exists in DB

---

## Error Handling

### Authentication Errors

```
401 Unauthorized
├─ Access token expired
│  └─▶ Auto refresh ─▶ Retry
│
├─ Refresh token expired
│  └─▶ Clear storage ─▶ Redirect to login
│
└─ Invalid credentials
   └─▶ Show error message
```

### Network Errors

```
Network Request Failed
├─ Backend not reachable
│  └─▶ Show offline message
│
├─ Timeout
│  └─▶ Retry with exponential backoff
│
└─ CORS error
   └─▶ Check backend CORS configuration
```

---

## State Management

```
┌─────────────────────────────────────┐
│         Auth Context                │
├─────────────────────────────────────┤
│ State:                              │
│  • user: User | null                │
│  • isLoading: boolean               │
│  • isAuthenticated: boolean         │
│                                     │
│ Methods:                            │
│  • signIn(user)                     │
│  • signOut()                        │
│  • checkAuth()                      │
│  • refreshSession()                 │
└─────────────────────────────────────┘
         │
         │ Provides to all components
         │
         ▼
┌─────────────────────────────────────┐
│        UI Components                │
│  • LoginForm                        │
│  • Home Screen                      │
│  • Chat Screen                      │
│  • Profile Screen                   │
└─────────────────────────────────────┘
```

---

## Performance Optimizations

### 1. Token Caching
- Access token cached in memory during app session
- Reduces secure storage reads
- Faster API calls

### 2. User Data Caching
- User data cached in secure storage
- Fast app startup (no need to fetch from server)
- Validated on app start

### 3. Automatic Token Refresh
- Refresh happens in background
- User never sees authentication failures
- No interruption to user experience

### 4. Request Deduplication
- Multiple simultaneous API calls during refresh
- Only one refresh request made
- Other requests wait for refresh completion

---

## Monitoring & Debugging

### Console Logs

```typescript
// Authentication
"🔑 Login successful"
"🔑 Token refresh successful"
"🔑 Logout successful"

// API Calls
"📡 API Request: GET /api/mobile/contractors"
"📡 API Response: 200"
"📡 Token refresh triggered"

// Errors
"❌ Login failed: Invalid credentials"
"❌ Token refresh failed: Refresh token expired"
"❌ API call failed: Network error"
```

### Error Tracking

Recommended: Integrate Sentry or similar
```typescript
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "your-dsn",
  // Track auth errors
  beforeSend(event) {
    if (event.exception) {
      console.error(event.exception);
    }
    return event;
  },
});
```

---

## Testing Strategy

### Unit Tests
- Token storage functions
- Token validation
- API helpers

### Integration Tests
- Login flow
- Token refresh flow
- Logout flow
- API calls with authentication

### E2E Tests
- Complete user journey
- Login → Use app → Logout
- Token expiration handling
- Network error recovery

---

## Deployment Checklist

### Development
- [x] Local Next.js backend running
- [x] Mobile app configured with localhost
- [x] Token refresh endpoint implemented
- [x] CORS configured for localhost

### Staging
- [ ] Staging backend deployed
- [ ] Mobile app configured with staging URL
- [ ] All mobile endpoints implemented
- [ ] CORS configured for staging
- [ ] SSL/TLS certificates configured
- [ ] Test with TestFlight (iOS) / Internal Testing (Android)

### Production
- [ ] Production backend deployed
- [ ] Mobile app configured with production URL
- [ ] All endpoints tested and working
- [ ] CORS configured for production
- [ ] Rate limiting configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup
- [ ] App submitted to App Store / Play Store

---

## Scalability Considerations

### Token Management
- Consider token rotation for enhanced security
- Implement token blacklisting for logout
- Add device tracking for sessions

### API Performance
- Implement caching for contractor lists
- Add pagination for conversations
- Use Redis for session storage (high traffic)

### Database Optimization
- Add indexes on frequently queried fields
- Implement connection pooling
- Consider read replicas for high read volume

---

**Architecture Status:** ✅ Designed & Implemented (React Native)
**Backend Status:** 🔴 Partial (Auth endpoints) | 🔴 Missing (Chat, Contractor endpoints)
