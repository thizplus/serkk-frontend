# 🔐 Phase 1: Foundation & Authentication

**Duration:** Week 1 (5-7 days)
**Priority:** 🔴 Critical
**Status:** 📝 Planning

---

## 🎯 Objectives

1. Setup authentication infrastructure
2. Implement login/register functionality
3. Create protected routes middleware
4. Setup user session management
5. Handle authentication state globally

---

## 📋 Tasks Breakdown

### Step 1.1: Authentication Context & State Management
**Duration:** 1 day
**Files to Create/Modify:**
- [ ] `lib/contexts/AuthContext.tsx`
- [ ] `lib/hooks/useAuth.ts`
- [ ] `app/layout.tsx` (add AuthProvider)

**Implementation:**
```typescript
// lib/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
```

**Checklist:**
- [ ] สร้าง AuthContext
- [ ] สร้าง AuthProvider component
- [ ] Implement useAuth hook
- [ ] เพิ่ม AuthProvider ใน root layout
- [ ] Setup localStorage token management
- [ ] Handle token refresh logic

---

### Step 1.2: Login Page Implementation
**Duration:** 1 day
**Files to Modify:**
- [ ] `app/login/page.tsx`
- [ ] `components/login-form.tsx`

**Features:**
- [ ] Email/Password login form
- [ ] Form validation (React Hook Form + Zod)
- [ ] Error handling & display
- [ ] Loading states
- [ ] "Remember me" checkbox
- [ ] "Forgot password" link (placeholder)
- [ ] Redirect to home after successful login
- [ ] Google OAuth button (prepare for future)

**Implementation Steps:**
1. ✅ หน้า login/page.tsx มีอยู่แล้ว (SSR)
2. Update login-form.tsx:
   ```typescript
   - Connect to authService.login()
   - Handle form submission
   - Add validation with zod
   - Show loading state
   - Handle errors with toast
   - Redirect after success
   ```

**Validation Rules:**
- Email: required, valid email format
- Password: required, min 8 characters

---

### Step 1.3: Register Page Implementation
**Duration:** 1 day
**Files to Modify:**
- [ ] `app/register/page.tsx`
- [ ] `components/register-form.tsx`

**Features:**
- [ ] Registration form (email, username, password, displayName)
- [ ] Form validation
- [ ] Password strength indicator
- [ ] Confirm password field
- [ ] Error handling & display
- [ ] Loading states
- [ ] Auto-login after successful registration
- [ ] Redirect to home
- [ ] Link to login page

**Implementation Steps:**
1. ✅ หน้า register/page.tsx มีอยู่แล้ว (SSR)
2. Update register-form.tsx:
   ```typescript
   - Connect to authService.register()
   - Handle form submission
   - Add validation with zod
   - Password confirmation validation
   - Show loading state
   - Handle errors with toast
   - Auto-login after registration
   - Redirect after success
   ```

**Validation Rules:**
- Email: required, valid email format
- Username: required, min 3 chars, max 50 chars, alphanumeric + underscore
- Password: required, min 8 chars
- Confirm Password: must match password
- Display Name: optional, max 100 chars

---

### Step 1.4: Protected Routes Middleware
**Duration:** 1 day
**Files to Create:**
- [ ] `middleware.ts` (root level)
- [ ] `lib/utils/auth-helpers.ts`

**Implementation:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register');
  const isProtectedPage = !isAuthPage &&
                          request.nextUrl.pathname !== '/';

  // Redirect logic
  if (!token && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Protected Routes:**
- `/create-post`
- `/edit-post/*`
- `/my-posts`
- `/profile/edit`
- `/notifications`
- `/saved`

**Public Routes:**
- `/`
- `/login`
- `/register`
- `/post/*`
- `/profile/*` (view only)
- `/search`

---

### Step 1.5: User Session Management
**Duration:** 1 day
**Files to Create/Modify:**
- [ ] `lib/utils/session.ts`
- [ ] Update `lib/services/http-client.ts`

**Features:**
- [ ] Persist auth token in localStorage
- [ ] Auto-inject token in API requests
- [ ] Handle 401 unauthorized responses
- [ ] Auto-redirect to login on token expiry
- [ ] Token refresh mechanism (if backend supports)

**Implementation:**
```typescript
// lib/utils/session.ts
export const sessionManager = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    // Also set in cookie for middleware
    document.cookie = `auth_token=${token}; path=/; max-age=604800`;
  },

  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  clearToken: () => {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; max-age=0';
  },

  isAuthenticated: () => {
    return !!sessionManager.getToken();
  }
};
```

---

### Step 1.6: User Profile Data Fetching
**Duration:** 0.5 day
**Files to Modify:**
- [ ] `lib/contexts/AuthContext.tsx`

**Features:**
- [ ] Fetch user profile after login
- [ ] Cache user data in context
- [ ] Provide user data to all components

**Implementation:**
```typescript
const fetchUserProfile = async () => {
  if (!token) return;

  try {
    const response = await userService.getProfile();
    if (response.success) {
      setUser(response.data);
    }
  } catch (error) {
    console.error('Failed to fetch user profile', error);
    handleLogout();
  }
};
```

---

### Step 1.7: UI Components & Navigation Updates
**Duration:** 0.5 day
**Files to Modify:**
- [ ] `components/nav-user.tsx`
- [ ] `components/app-sidebar.tsx`

**Features:**
- [ ] Show user info when logged in
- [ ] Show login/register buttons when logged out
- [ ] Logout button
- [ ] Profile link
- [ ] Update navigation based on auth state

---

## ✅ Definition of Done

### Functional Requirements
- [ ] Users can register with email/username/password
- [ ] Users can login with email/password
- [ ] Users can logout
- [ ] Protected pages redirect to login if not authenticated
- [ ] Login/Register pages redirect to home if already authenticated
- [ ] User session persists across page refreshes
- [ ] Token is automatically injected in all API requests
- [ ] User is auto-logged out on token expiry

### Technical Requirements
- [ ] All forms have proper validation
- [ ] Error messages are user-friendly in Thai
- [ ] Loading states are shown during API calls
- [ ] Success/error toasts are displayed
- [ ] Code follows TypeScript best practices
- [ ] No console errors or warnings
- [ ] Mobile responsive

### Testing Checklist
- [ ] ✅ Register with valid data → Success
- [ ] ✅ Register with existing email → Error message
- [ ] ✅ Login with correct credentials → Success
- [ ] ✅ Login with wrong credentials → Error message
- [ ] ✅ Access protected page without login → Redirect to login
- [ ] ✅ Access login page when logged in → Redirect to home
- [ ] ✅ Logout → Clear session, redirect to home
- [ ] ✅ Refresh page when logged in → Stay logged in
- [ ] ✅ Token expiry → Auto logout

---

## 🔧 Development Tools & Libraries

### Required Packages
```bash
npm install react-hook-form zod @hookform/resolvers
npm install js-cookie @types/js-cookie
```

### Optional Packages
```bash
npm install zustand  # If you prefer Zustand over Context API
```

---

## 📝 Code Examples

### Login Form with Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('เข้าสู่ระบบสำเร็จ!');
      router.push('/');
    } catch (error) {
      toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Token not persisting
**Solution:** Check localStorage and cookie implementation

### Issue 2: Redirect loop
**Solution:** Check middleware logic and auth state

### Issue 3: CORS errors
**Solution:** Verify backend CORS settings

---

## 🔜 Next Steps

After completing Phase 1, proceed to:
→ **Phase 2: Core Content** (`02-phase2-core-content.md`)
- Implement post feed
- Create post functionality
- Post detail page
