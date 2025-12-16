# Authentication Integration Documentation

## Overview

This document describes the complete frontend authentication integration with the backend API. The implementation follows best practices for JWT-based authentication in React applications.

## Architecture

### Components Overview

```
src/
├── config/
│   └── api.ts                    # API configuration and endpoints
├── contexts/
│   └── auth-context.tsx          # Authentication state management
├── services/
│   ├── api.service.ts            # Base API service with interceptors
│   └── auth.service.ts           # Authentication-specific API calls
├── lib/
│   └── token-storage.ts          # JWT token storage utilities
├── types/
│   └── auth.ts                   # TypeScript type definitions
└── components/
    └── router/
        └── protected-route.tsx   # Route protection wrapper

```

## Key Features

### ✅ Implemented Features

1. **JWT Authentication**
   - Access token and refresh token management
   - Automatic token injection in API requests
   - Automatic token refresh on 401 errors
   - Secure token storage in localStorage

2. **Login Flow**
   - Username or phone number authentication
   - Password validation
   - Error handling with user-friendly messages
   - Loading states and disabled form during submission
   - Redirect to intended page after login

3. **Protected Routes**
   - Automatic redirect to login for unauthenticated users
   - Loading spinner during authentication check
   - Preserve intended destination URL

4. **User State Management**
   - Global authentication state via React Context
   - Automatic user data loading on app initialization
   - User profile display in navigation

5. **Logout Functionality**
   - Clear tokens and user state
   - Redirect to login page

6. **Error Handling**
   - API error interception and formatting
   - User-friendly error messages
   - Toast notifications for success/error states

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:8080
```

### API Endpoints (Backend)

The integration uses the following backend endpoints:

- `POST /api/users/auth/login/` - User login
- `POST /api/users/auth/token/refresh/` - Refresh access token
- `GET /api/users/auth/me/` - Get current user profile
- `POST /api/users/auth/add-user/` - Add new user (superuser only)
- `GET /api/users/auth/list/` - List users (superuser only)
- `POST /api/users/auth/disable-user/{id}/` - Disable user (superuser only)

## Usage Guide

### Using the Auth Context

```tsx
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  // Check if user is authenticated
  if (isAuthenticated) {
    return <div>Welcome, {user?.username}!</div>
  }

  return <div>Please log in</div>
}
```

### Creating Protected Routes

Protected routes are automatically configured in `src/config/routes.tsx`:

```tsx
{
  path: "/dashboard",
  element: (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
```

### Making Authenticated API Calls

```tsx
import { apiService } from '@/services/api.service'

// GET request
const data = await apiService.get('/api/users/suppliers/')

// POST request
const result = await apiService.post('/api/users/suppliers/', {
  company_name: "ABC Corp",
  full_name: "John Doe",
  phone_number: "+998901234567"
})

// PATCH request
const updated = await apiService.patch('/api/users/suppliers/1/', {
  company_name: "New Name"
})

// DELETE request
await apiService.delete('/api/users/suppliers/1/')
```

### Error Handling

```tsx
import { ApiException } from '@/services/api.service'

try {
  await apiService.post('/api/users/auth/login/', credentials)
} catch (error) {
  if (error instanceof ApiException) {
    // Handle API errors
    console.log('Status:', error.status)
    console.log('Data:', error.data)
    
    if (error.status === 401) {
      // Handle unauthorized
    } else if (error.status === 400) {
      // Handle validation errors
    }
  }
}
```

## Authentication Flow

### Login Process

1. User submits login form with username/phone and password
2. `authService.login()` sends POST request to `/api/users/auth/login/`
3. On success:
   - Tokens are stored in localStorage
   - User data is stored in auth context
   - User is redirected to dashboard or intended page
4. On error:
   - Error message is displayed to user
   - Form remains enabled for retry

### Token Refresh

1. API request returns 401 Unauthorized
2. `apiService` automatically calls `/api/users/auth/token/refresh/`
3. If refresh succeeds:
   - New access token is stored
   - Original request is retried with new token
4. If refresh fails:
   - Tokens are cleared
   - User is redirected to login

### Logout Process

1. User clicks logout button
2. `authContext.logout()` is called
3. Tokens are removed from localStorage
4. Auth state is cleared
5. User is redirected to login page

## Security Considerations

### Token Storage

- Tokens are stored in localStorage (suitable for SPAs)
- For higher security requirements, consider using httpOnly cookies

### Token Expiration

- Access tokens are short-lived (backend configured)
- Automatic refresh prevents session interruption
- Failed refresh triggers re-authentication

### CORS Configuration

Ensure backend allows requests from frontend origin:

```python
# Django settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative port
]

CORS_ALLOW_CREDENTIALS = True
```

## API Service Features

### Automatic Token Injection

All authenticated requests automatically include the JWT token:

```
Authorization: Bearer <access_token>
```

### Request Timeout

Requests timeout after 30 seconds (configurable in `api.service.ts`)

### Error Standardization

All API errors are thrown as `ApiException` with:
- `status`: HTTP status code
- `data`: Error details from backend
- `message`: Error message

## Type Definitions

### User Type

```typescript
interface User {
  id: number
  username: string
  phone_number: string
  first_name: string
  last_name: string
  is_superuser?: boolean
  is_active?: boolean
}
```

### Auth Context State

```typescript
interface AuthContextState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshUserData: () => Promise<void>
}
```

## Testing Authentication

### Manual Testing

1. Start the backend server:
   ```bash
   # Ensure backend is running on http://localhost:8080
   ```

2. Start the frontend dev server:
   ```bash
   npm run dev
   ```

3. Navigate to `http://localhost:5173/dashboard`
   - Should redirect to `/auth/sign-in`

4. Login with valid credentials:
   - Username or phone number
   - Password

5. After successful login:
   - Should redirect to dashboard
   - User info should appear in sidebar
   - Protected routes should be accessible

6. Test logout:
   - Click user menu in sidebar
   - Click "Log out"
   - Should redirect to login page

### Testing Token Refresh

1. Login successfully
2. Wait for access token to expire (or manually delete it from localStorage)
3. Make any API request
4. Should automatically refresh and retry the request

## Troubleshooting

### Login Fails with Network Error

- **Check**: Backend server is running on `http://localhost:8080`
- **Check**: CORS is properly configured on backend
- **Check**: `.env` file has correct `VITE_API_BASE_URL`

### Token Refresh Loop

- **Check**: Refresh token endpoint is working
- **Check**: Refresh token hasn't expired
- **Solution**: Clear localStorage and login again

### User Not Persisting After Refresh

- **Check**: Tokens are being stored in localStorage
- **Check**: `AuthProvider` is wrapping the app in `App.tsx`
- **Check**: `/api/users/auth/me/` endpoint is accessible

### Protected Routes Not Working

- **Check**: Routes are wrapped with `<ProtectedRoute>`
- **Check**: `AuthProvider` is initialized before Router
- **Check**: Browser console for any errors

## Future Enhancements

### Planned Features

- [ ] Remember me functionality
- [ ] Password reset flow (backend endpoint pending)
- [ ] Two-factor authentication
- [ ] Session timeout warning
- [ ] Refresh token rotation
- [ ] Account registration flow

### Recommended Improvements

1. **Security**
   - Implement httpOnly cookies for token storage
   - Add CSRF protection
   - Implement rate limiting on login attempts

2. **User Experience**
   - Add "Stay logged in" checkbox
   - Show session expiration countdown
   - Add biometric authentication support

3. **Monitoring**
   - Add authentication analytics
   - Log failed login attempts
   - Track user session duration

## Related Documentation

- [Users API Documentation](../docs/users/USERS_API.md)
- [Users Quick Reference](../docs/users/USERS_QUICK_REFERENCE.md)
- [Backend API Overview](../docs/users/README.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend API documentation
3. Check browser console for detailed errors
4. Verify network requests in browser DevTools
