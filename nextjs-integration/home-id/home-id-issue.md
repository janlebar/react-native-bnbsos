# Contractor Detail API Endpoint Issue

## Problem Summary

The Expo app is experiencing a **500 Internal Server Error** when calling the contractor detail API endpoint:

```
GET http://localhost:3000/api/mobile/contractors/15
[HTTP/1.1 500 Internal Server Error]
```

The frontend code is correctly implemented and sending proper requests. The issue is in the Next.js backend API endpoint.

---

## Current Status

- ✅ **Frontend Implementation**: Complete and working
- ✅ **API Client**: Properly configured with authentication
- ❌ **Backend API Endpoint**: Returning 500 error

---

## Request Details (From Expo App)

### Endpoint
```
GET /api/mobile/contractors/{id}
```

### Request Headers
The Expo app sends the following headers:
```
Content-Type: application/json
Authorization: Bearer <access_token>  // Optional - included if user is authenticated
```

### Request Example
```typescript
// From: api/contractorsApi.ts
const response = await api.get<ContractorDetail>(
  `/api/mobile/contractors/${id}`
);
```

### Authentication
- **Optional**: The endpoint should work for both authenticated and unauthenticated users
- **When authenticated**: Returns full contact information (email, phone)
- **When not authenticated**: Returns empty string for `phone` and `null` for `user.email`

---

## Expected Response Format

The Expo app expects a `ContractorDetail` object with the following structure:

### TypeScript Interface (From Expo App)

```typescript
// types/home.ts
export interface ContractorDetail extends Contractor {
  reviews: Review[];
}

export interface Contractor {
  id: number;
  uid: string;                    // Same as userId
  name: string;
  specializations: string[];
  city: string;
  rating: number;                  // 0-10
  description?: string | null;
  certifications: string[];
  yearsOfExperience?: number | null;
  availability?: string;
  address: string;
  phone?: string;                  // Empty string "" if not authenticated
  imageId?: string | null;         // Profile image URL
  backgroundImageUrl?: string | null;
  contractorLatitude?: number | null;
  contractorLongitude?: number | null;
  premiumPlacement?: boolean;
  placementTier?: "VERIFIED" | "CITY_FIRST" | "PROFESSION_FIRST" | "TOP_FIVE";
  placementExpiresAt?: string | null;  // ISO date string
  selectedPosition?: number | null;    // 1-8
  user?: {
    email?: string | null;         // null if not authenticated
  };
}

export interface Review {
  id: number;                      // Must be number, not string
  comment: string;
  rating: number;                   // 0-10
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
  user: {
    name: string | null;            // "Anonymous" if null
    image?: string | null;
  };
}
```

### Expected JSON Response (200 Success)

```json
{
  "id": 15,
  "uid": "user-uuid-here",
  "name": "Contractor Name",
  "specializations": ["plumbing", "heating"],
  "city": "Miami",
  "rating": 8,
  "description": "Contractor description text...",
  "certifications": ["Licensed Plumber", "EPA Certified"],
  "yearsOfExperience": 15,
  "availability": "Monday-Friday, 8am-6pm",
  "address": "123 Main St",
  "phone": "555-1234",                    // "" if not authenticated
  "imageId": "https://example.com/avatar.jpg",
  "backgroundImageUrl": "https://example.com/bg.jpg",
  "contractorLatitude": 40.7128,
  "contractorLongitude": -74.0060,
  "premiumPlacement": true,
  "placementTier": "VERIFIED",            // or "CITY_FIRST" | "PROFESSION_FIRST" | "TOP_FIVE" | null
  "placementExpiresAt": "2026-12-31T23:59:59.000Z",
  "selectedPosition": 1,
  "user": {
    "email": "contractor@example.com"     // null if not authenticated
  },
  "reviews": [
    {
      "id": 1,                            // Must be number, not string
      "comment": "Great service!",
      "rating": 9,
      "createdAt": "2026-02-15T10:00:00.000Z",
      "updatedAt": "2026-02-15T10:00:00.000Z",
      "user": {
        "name": "Jane Doe",               // or null for "Anonymous"
        "image": "https://example.com/user.jpg"
      }
    }
  ]
}
```

---

## Error Response Formats

### 400 Bad Request
```json
{
  "error": "Invalid contractor ID"
}
```

### 404 Not Found
```json
{
  "error": "Contractor not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

**Note**: The Expo app extracts the `error` field from the response to display to users.

---

## What Needs to Be Checked/Implemented in Next.js API

### 1. Verify API Route Exists
**File**: `app/api/mobile/contractors/[id]/route.ts`

Check if this file exists and is properly configured.

### 2. Authentication Handling
The endpoint should:
- Accept requests with or without `Authorization: Bearer <token>` header
- Use `getCurrentAuthUser()` for dual authentication (JWT or cookies)
- Gate contact information based on authentication status:
  - **Authenticated**: Return actual `phone` and `user.email` values
  - **Not authenticated**: Return `phone: ""` and `user.email: null`

### 3. Database Query
Ensure the query:
- Fetches contractor by numeric `id` (not string)
- Includes all required fields from the `ContractorDetail` interface
- Joins with `reviews` table to include reviews array
- Handles missing/null values gracefully

### 4. Review Data Format
**Critical**: Ensure `reviews.id` is returned as a **number**, not a string. The Expo app expects:
```typescript
reviews: {
  id: number;  // NOT string
  ...
}[]
```

### 5. Error Handling
Implement proper error handling:
- **Invalid ID** (non-numeric, negative, zero): Return 400 with error message
- **Contractor not found**: Return 404 with error message
- **Database errors**: Catch and return 500 with error message
- **Authentication errors**: Should not block the request (endpoint is public)

### 6. CORS Configuration
Ensure CORS headers are set for mobile access:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 7. Response Serialization
Ensure:
- All dates are serialized as ISO strings
- Null values are properly handled (not undefined)
- Arrays are always returned (empty array `[]` if no reviews)
- Numbers are returned as numbers (not strings)

---

## Common Issues to Check

### Issue 1: Missing Reviews Join
If reviews are not being included, check the database query includes:
```sql
LEFT JOIN reviews ON reviews.contractorId = contractor.id
```

### Issue 2: Review ID Type Mismatch
If `reviews.id` is being returned as a string, ensure it's cast to number:
```typescript
reviews: reviews.map(review => ({
  ...review,
  id: Number(review.id)  // Ensure it's a number
}))
```

### Issue 3: Missing Fields
Verify all fields from `ContractorDetail` interface are included:
- `uid` (user ID)
- `placementTier` (can be null)
- `placementExpiresAt` (can be null)
- `selectedPosition` (can be null)
- `contractorLatitude` and `contractorLongitude` (can be null)

### Issue 4: Authentication Gating
Ensure contact information is properly gated:
```typescript
const isAuthenticated = !!user; // From getCurrentAuthUser()

return {
  ...contractor,
  phone: isAuthenticated ? contractor.phone : "",
  user: {
    email: isAuthenticated ? contractor.user.email : null
  }
};
```

### Issue 5: Database Connection
Check if the database connection is working and the query executes successfully.

### Issue 6: Missing Error Handling
Ensure try-catch blocks are in place:
```typescript
try {
  // Database query
} catch (error) {
  console.error("Error fetching contractor:", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
```

---

## Testing Checklist

- [ ] API route exists at `app/api/mobile/contractors/[id]/route.ts`
- [ ] Endpoint accepts GET requests
- [ ] Endpoint handles numeric ID parameter
- [ ] Returns 400 for invalid IDs (non-numeric, negative, zero)
- [ ] Returns 404 for non-existent contractors
- [ ] Returns 200 with full contractor data for valid IDs
- [ ] Includes `reviews` array (empty if no reviews)
- [ ] `reviews[].id` is a number (not string)
- [ ] Contact info gated by authentication
- [ ] CORS headers are set
- [ ] Error responses include `error` field
- [ ] All required fields are present in response
- [ ] Null/optional fields are handled correctly
- [ ] Dates are ISO strings
- [ ] Database query doesn't throw errors

---

## Debugging Steps

1. **Check Next.js server logs** when the request is made
2. **Verify the API route file exists** and exports a GET handler
3. **Test the endpoint directly** using curl or Postman:
   ```bash
   curl -X GET http://localhost:3000/api/mobile/contractors/15 \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json"
   ```
4. **Check database** to ensure contractor with ID 15 exists
5. **Review the database query** for syntax errors or missing joins
6. **Check authentication logic** - ensure it doesn't throw errors for unauthenticated requests
7. **Verify response serialization** - ensure all data types match the expected format

---

## Reference: Expo App Code

### API Client
**File**: `api/contractorsApi.ts`
```typescript
async fetchContractorById(id: number): Promise<ContractorDetail> {
  const response = await api.get<ContractorDetail>(
    `/api/mobile/contractors/${id}`
  );
  return response.data;
}
```

### Type Definitions
**File**: `types/home.ts`
- See `ContractorDetail` and `Review` interfaces above

### Component Usage
**File**: `app/(auth)/contractors/[id].tsx`
- Calls `contractorsService.fetchContractorById(contractorId)`
- Expects `ContractorDetail` with `reviews` array
- Handles errors and displays them to users

---

## Next Steps

1. **Locate the API route file** in the Next.js app
2. **Review the implementation** against the requirements above
3. **Fix any issues** found (missing fields, type mismatches, error handling)
4. **Test the endpoint** with the contractor ID that's failing (15)
5. **Verify the response format** matches the expected TypeScript interface
6. **Test with both authenticated and unauthenticated requests**

---

**Last Updated**: Based on Expo app implementation and error logs  
**Status**: Backend API endpoint needs debugging/fixing  
**Priority**: High - Blocks contractor detail page functionality
