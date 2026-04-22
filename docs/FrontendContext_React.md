# 🖥️ School Bus Tracker — React Frontend AI Context
> **Platform:** Web (React + TypeScript)
> **Target Roles:** SCHOOL_ADMIN, BRANCH_ADMIN (and SUPER_ADMIN where noted)
> **Last Updated:** April 2026
> Attach this file at the start of every new conversation about the React frontend.

---

## 📌 Project Overview

This is the **admin web dashboard** for the School Bus Tracker system. It is consumed by:

| Role | Can See / Do |
|---|---|
| `SUPER_ADMIN` | All schools, all branches, all data — global oversight |
| `SCHOOL_ADMIN` | Their school only — all branches within it |
| `BRANCH_ADMIN` | Their branch only — buses, drivers, routes, students, trips |

The backend is a FastAPI REST API running at a configurable base URL. All data is paginated, scoped to the user's school/branch via JWT claims, and uses soft deletes (`is_active = false`).

---

## 🛠️ Tech Stack (Decided)

| Concern | Decision |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Routing | React Router v6 (file-based layout pattern) |
| State management | Zustand (auth + global UI state), TanStack Query v5 (server state) |
| HTTP client | Axios with request/response interceptors for JWT |
| UI component library | Custom components (Tailwind only) |
| Styling | Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Maps | React Leaflet (live bus tracking) |
| Charts | Recharts |
| Notifications | Sonner (toast) |
| Date handling | date-fns |
| Icons | Lucide React |


---

## 🎨 Design System (NEW)

### Color Scheme - Yellow & Blue Theme
Inspired by Smallcase design with school bus branding:

```css
:root {
    /* Primary - School Bus Yellow */
    --primary: 45 93% 47%;              /* #F5C518 */
    --primary-foreground: 222 47% 11%;  /* Dark text on yellow */
    
    /* Secondary - Smallcase Blue */
    --secondary: 217 91% 60%;           /* #4A90E2 */
    --secondary-foreground: 0 0% 100%;  /* White text on blue */
    
    /* Neutral Colors */
    --background: 0 0% 100%;            /* White */
    --foreground: 222 47% 11%;          /* Near black */
    --border: 214 32% 91%;              /* Light gray */
    --muted: 210 40% 96%;               /* Very light gray */
    --muted-foreground: 215 16% 47%;    /* Medium gray */
}
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Features**: Proper ligatures and kerning enabled

### Component Styling Standards
All interactive components follow these patterns:

```css
/* Inputs */
.input-base {
    height: 48px (h-12);
    padding: 12px 16px (px-4 py-3);
    border: 2px solid;
    border-radius: 12px (rounded-xl);
    transition: all 200ms;
}

/* Buttons */
.btn-primary {
    background: var(--primary);
    color: var(--primary-foreground);
    padding: 12px 24px (px-6 py-3);
    border-radius: 12px (rounded-xl);
    font-weight: 600;
    transition: all 200ms;
}

/* Cards */
.card {
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: 16px (rounded-2xl);
    box-shadow: sm;
}

/* Role Buttons (Login Page) */
.role-button {
    border: 2px solid var(--border);
    border-radius: 12px (rounded-xl);
    padding: 16px;
    transition: all 200ms;
}
.role-button:hover {
    border-color: var(--primary);
    background: var(--primary) / 0.05;
}
.role-button-selected {
    border-color: var(--primary);
    background: var(--primary) / 0.1;
}
```

---

## 🔐 Auth Flow

### JWT Strategy
- `POST /api/v1/auth/login` → stores `access_token` in sessionStorage (Zustand persist)
- Access token expires in **30 minutes** — Axios interceptor redirects to login on 401
- On 401 response → clear auth state and redirect to `/auth/login`
- `POST /api/v1/auth/logout` on explicit logout — also clear Zustand + sessionStorage

### ⚠️ CONFLICT NOTE - Token Storage:
- **Original Plan**: Access token in memory, refresh token in httpOnly cookie
- **Current Implementation**: Both tokens stored in sessionStorage via Zustand persist
- **Reason**: Simpler implementation, no cookie complexity
- **Trade-off**: Less secure (vulnerable to XSS) but easier to implement
- **Future**: Consider moving to httpOnly cookie for production

### ⚠️ CONFLICT NOTE - Token Refresh:
- **Original Plan**: Silent token refresh on 401
- **Current Implementation**: Redirect to login on 401
- **Reason**: Backend refresh endpoint not yet implemented
- **Impact**: Users must re-login after 30 minutes
- **Future**: Implement refresh token flow when backend supports it

### Auth Store (Zustand)

**Current Implementation:**
```typescript
interface AuthStore {
  accessToken: string | null
  user: TokenPayload | null      // Decoded from JWT
  isAuthenticated: boolean
  setAuth: (token: string) => void
  clearAuth: () => void
  hasRole: (role: UserRole) => boolean
  isTokenValid: () => boolean
}

interface TokenPayload {
  sub: string
  user_id: number
  user_name: string
  role: UserRole
  school_id?: number
  branch_id?: number
  exp: number
}
```

**Original Plan (not yet implemented):**
```typescript
interface AuthStore {
  user: MeResponse | null        // from GET /api/v1/auth/me
  accessToken: string | null
  roles: RoleResponse[]          // Multiple roles per user
  setAuth: (token: string, user: MeResponse) => void
  clearAuth: () => void
  hasRole: (role: RoleName) => boolean
  getSchoolIds: () => number[]
  getBranchIds: (schoolId: number) => number[]
}
```

### ⚠️ CONFLICT NOTE - Auth Store:
- **Original**: Stores full `MeResponse` with multiple roles array
- **Current**: Stores decoded JWT `TokenPayload` with single role
- **Impact**: Current implementation assumes one role per user
- **Future**: Expand to support multiple roles when backend implements `/auth/me` endpoint

### Role-based Route Guards
- `<AuthGuard>` — checks `isAuthenticated` and token validity
- `<RoleGuard allowedRoles={['SCHOOL_ADMIN', 'BRANCH_ADMIN']}>` — checks user role
- Redirect to `/unauthorized` if role check fails
- `SUPER_ADMIN` bypasses all school/branch scope checks

---

## 📁 Project Structure

**Current Implementation:**
```
src/
├── main.tsx                    # Vite entry point
├── app/                        # App bootstrap
│   ├── App.tsx                 # Root component with auth setup
│   ├── providers.tsx           # BrowserRouter + QueryClientProvider
│   └── routes.tsx              # All route definitions + guards
├── features/                   # Feature-based modules
│   └── auth/                   # ✅ COMPLETE
│       ├── components/
│       │   ├── BrandingCard.tsx     # 60% left panel
│       │   ├── LoginCard.tsx        # Right panel wrapper
│       │   ├── LoginForm.tsx        # Form with role selection
│       │   └── RoleButton.tsx       # Selectable role button
│       ├── pages/
│       │   └── LoginPage.tsx        # Login orchestrator
│       ├── api.ts              # Login API call
│       ├── store.ts            # Zustand auth store (sessionStorage)
│       ├── types.ts            # Auth TypeScript types
│       └── index.ts            # Public exports
├── shared/
│   ├── components/
│   │   ├── AuthGuard.tsx       # Auth protection wrapper
│   │   └── RoleGuard.tsx       # Role-based protection
│   └── lib/
│       ├── api.ts              # Axios instance + JWT interceptor
│       └── queryClient.ts      # TanStack Query config
└── styles/
    └── globals.css             # Tailwind + yellow/blue theme + reusable classes
```

---

## 🔌 API Integration Conventions

### Base Axios Client (`shared/lib/api.ts`)

```typescript
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  withCredentials: true 
})

// Request — attach access token
api.interceptors.request.use((config) => {
  const token = getAccessToken()  // From auth helpers
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response — redirect on 401 (no refresh)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)
```

### Query Keys Convention
```typescript
// Format: [domain, resource, params]
['schools', 'list', { page, pageSize, activeOnly }]
['schools', 'detail', schoolId]
['students', 'list', { schoolId, branchId, page }]
['trips', 'live-status', tripId]
['notifications', 'my', { page, statusFilter }]
```

### Pagination Parameters
All list endpoints accept `school_id` and `branch_id` as query params. Always read these from the auth store:
```typescript
const { getSchoolIds, getBranchIds } = useAuth()
// SCHOOL_ADMIN: getSchoolIds() → [schoolId]
// SUPER_ADMIN:  getSchoolIds() → [] (pass no filter — API returns all)
```

### ⚠️ NOTE - School/Branch Filtering:
Current auth store doesn't have `getSchoolIds()` or `getBranchIds()` methods yet.
These will be added when implementing school/branch management features.

### Common Query Pattern
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['drivers', 'list', { schoolId, branchId, page, activeOnly }],
  queryFn: () => getDrivers({ school_id: schoolId, branch_id: branchId, page, active_only: activeOnly }),
})
```

---

## 📊 Pages & Features

#### Login Page (`/auth/login`)
- 60/40 split layout (branding left, form right)
- Yellow gradient branding panel with stats and features
- Role selection with 4 roles: Super Admin, School Admin, Branch Admin, Driver
- Username and password fields with proper spacing (no overlapping)
- Password visibility toggle
- Remember me checkbox
- Forgot password link
- Form validation and error handling
- Smooth hover states and transitions
- Responsive design (mobile-friendly)

#### Dashboard Placeholder (`/dashboard`)
- Protected route requiring authentication
- Basic placeholder layout
- Future: Summary cards, trip timeline, notifications

### 📋 Future Features

#### Dashboard (`/dashboard`)
- Summary cards: total buses, active trips today, total students, pending leaves
- Today's trips timeline (status chip per trip)
- Recent notifications list

#### Schools (`/schools`) — SUPER_ADMIN + SCHOOL_ADMIN
- Table: school name, is_active, branch count, actions
- Create/Edit school via slide-over form
- Drill-in to branches list

#### Branches (`/schools/:schoolId/branches`)
- Table: branch name, phone, email, is_active
- Create/Edit branch form

#### Fleet — Buses (`/fleet/buses`)
- Table: bus_number, capacity, is_active, current GPS device
- Create/Edit bus form
- Link to current device assignment inline

#### Drivers (`/drivers`)
- Table: name, phone, license_number, is_active
- Create/Edit driver form with phone validation

#### GPS Devices (`/gps/devices`)
- Table: IMEI, is_active, currently assigned bus
- Register device form
- Assign/Unassign device to bus — confirmation dialog

#### Routes (`/routes`)
- List view: route_code, route_name, is_active
- Detail view: route with ordered stop list (PICKUP tab + DROPOFF tab)
- Add/remove stops with drag-to-reorder for stop_sequence
- Stop management: create/edit stop with lat/lng map picker

#### Trips (`/trips`)
- Filterable table: date picker, route filter, status filter
- Create trip: select route + date + trip_type + optional bus/driver
- Status transition buttons: `Start Trip`, `Complete Trip`, `Cancel Trip`
- Live tracking view: Leaflet map showing bus position in real time
  - Polls `GET /api/v1/trips/trips/{trip_id}/live-status` every 5 seconds when IN_PROGRESS

#### Students (`/students`)
- Table: name, grade, section, admission_number, is_active
- Create/Edit student (links to user_id)
- Parent management tab: list linked parents, add/remove/update relationship
- Leave requests tab: list requests, approve/reject with status badge

#### Assignments (`/assignments`)
- Assign student to route form: student picker + route picker + stop picker + trip_type
- View by student or by route (toggle)
- Deactivate assignment

#### Attendance (`/attendance`)
- Filter by trip → show all students + attendance status
- Filter by student → show history across trips
- Correct attendance status (BRANCH_ADMIN only)

#### Notifications (`/notifications`)
- User's own inbox: unread count badge in header
- Mark as read inline
- Admin audit view: filter by type, status, user, trip

---

## 🎨 UI/UX Conventions

### Layout
- Collapsible sidebar with role-aware nav items **Not yet implemented**
- Breadcrumb on every page **Not yet implemented**
- `PageHeader` component: title + primary action button **Not yet implemented**

### Current Components (Login Page Only)

#### Reusable CSS Classes (in `globals.css`)
```css
.input-base       /* Standard input styling */
.btn-primary      /* Primary button styling */
.card             /* Card container styling */
.error-box        /* Error message styling */
.role-button      /* Role selection button */
.role-button-selected  /* Selected role state */
```

#### React Components
- `<BrandingCard />` - 60% left panel with yellow gradient
- `<LoginCard />` - Right panel wrapper with heading
- `<LoginForm />` - Form with role selection and inputs
- `<RoleButton />` - Individual role selection button
- `<AuthGuard />` - Route protection wrapper
- `<RoleGuard />` - Role-based route protection

### Tables (TanStack Table v8) - NOT YET IMPLEMENTED
- Server-side pagination — never load all records
- Sortable columns where applicable
- Row actions: Edit (pencil), Deactivate (trash with confirm dialog)
- `active_only` toggle in toolbar — admins only

### Forms (React Hook Form + Zod) - NOT YET IMPLEMENTED
```typescript
// Zod schema mirrors backend Pydantic schema exactly
const busCreateSchema = z.object({
  school_id: z.number().int().positive(),
  branch_id: z.number().int().positive(),
  bus_number: z.string().min(1).max(50),
  capacity:   z.number().int().positive(),
})
```
- Slide-over (Sheet) for create/edit — never full page navigation
- Field-level error messages from Zod
- Submit button shows loading state
- On success: invalidate affected query keys + show toast

### Status Badges - NOT YET IMPLEMENTED
```typescript
// Map backend enum values to display labels + colors
const TRIP_STATUS_COLORS = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED:   'bg-gray-100 text-gray-600',
  CANCELLED:   'bg-red-100 text-red-700',
}
```

### Confirmation Dialogs - NOT YET IMPLEMENTED
- All destructive actions (deactivate, unassign, reject leave) require a confirmation `AlertDialog`

### Error Handling

**Current Implementation (Basic):**
```typescript
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      if (Array.isArray(error.response.data.detail)) {
        return error.response.data.detail.map(e => e.msg || e.message).join(', ')
      }
      return error.response.data.detail
    }
    return error.message || 'Network error'
  }
  return 'An unexpected error occurred'
}
```

**Future Enhancement:**
- `422` validation errors → extract `detail` array → show per-field errors
- `404` → show inline "Not found" state
- `409` conflict → show specific toast (e.g. "Bus number already taken")
- `403` → show "You don't have permission" toast
- Network errors → show retry button

---

## 🗂️ TypeScript Types

### Current Implementation (`features/auth/types.ts`)
```typescript
export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'BRANCH_ADMIN' | 'DRIVER' | 'PARENT' | 'STUDENT';

export interface TokenPayload {
  sub: string;
  user_id: number;
  user_name: string;
  role: UserRole;
  school_id?: number;
  branch_id?: number;
  exp: number;
}

export interface LoginRequest {
  user_name: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
```

### Future Types (`types/api.ts`) - Mirror Backend Schemas

```typescript
// Auth
interface MeResponse {
  user_id: number; user_name: string; email: string | null
  phone: string | null; is_active: boolean
  created_at: string; updated_at: string
  roles: RoleResponse[]
}
interface RoleResponse {
  role_id: number; role_name: RoleName
  school_id: number | null; branch_id: number | null
  is_active: boolean; assigned_at: string
}
type RoleName = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'BRANCH_ADMIN' | 'DRIVER' | 'PARENT' | 'STUDENT'

// Pagination
interface PaginatedResponse<T> {
  items: T[]; total: number; page: number
  page_size: number; total_pages: number
}

// Enums
type TripStatus    = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type TripType      = 'PICKUP' | 'DROPOFF'
type AttendanceStatus = 'BOARDED' | 'DROPPED' | 'NO_SHOW'
type LeaveStatus   = 'PENDING' | 'APPROVED' | 'REJECTED'
type NotifStatus   = 'PENDING' | 'SENT' | 'FAILED' | 'READ'
type NotifType     = 'ATTENDANCE' | 'TRIP_START' | 'TRIP_END' | 'DELAY' | 'GENERAL'

// Domain responses (add all fields from backend schemas)
interface SchoolResponse { school_id: number; school_name: string; is_active: boolean; created_at: string; updated_at: string }
interface BranchResponse { branch_id: number; school_id: number; branch_name: string; branch_address: string | null; branch_phone: string | null; branch_email: string | null; is_active: boolean; created_at: string; updated_at: string }
interface BusResponse { bus_id: number; school_id: number; branch_id: number; bus_number: string; capacity: number; is_active: boolean; created_at: string; updated_at: string }
interface DriverResponse { driver_id: number; user_id: number | null; school_id: number; branch_id: number; first_name: string; last_name: string | null; phone: string | null; license_number: string | null; is_active: boolean; created_at: string; updated_at: string }
interface GPSDeviceResponse { device_id: number; school_id: number; branch_id: number; device_imei: string; is_active: boolean; created_at: string; updated_at: string }
interface TripResponse { trip_id: number; school_id: number; branch_id: number; route_id: number; bus_id: number | null; driver_id: number | null; service_date: string; trip_type: TripType; trip_status: TripStatus; actual_start_time: string | null; actual_end_time: string | null; created_at: string; updated_at: string }
interface TripLiveStatusResponse { live_status_id: number; trip_id: number; current_latitude: number; current_longitude: number; speed: number | null; heading: number | null; last_stop_id: number | null; last_updated: string }
interface StudentResponse { student_id: number; school_id: number; branch_id: number; user_id: number; first_name: string; last_name: string | null; grade: string | null; section: string | null; admission_number: string | null; is_active: boolean; created_at: string; updated_at: string }
interface NotificationResponse { notification_id: number; user_id: number; title: string; message: string; notification_type: NotifType; notification_status: NotifStatus; event_key: string | null; channel: string | null; sent_at: string }
```

---

## 🔑 Key Rules

| Rule | Detail | Status |
|---|---|---|---|
| Always pass `school_id` + `branch_id` | Required on every scoped list endpoint as query params | 📋 TODO |
| Invalidate on mutation | After every create/update/delete: `queryClient.invalidateQueries(['domain'])` | 📋 TODO |
| Active-only toggle | Only show `active_only=false` option to `SCHOOL_ADMIN`+ — enforce in UI | 📋 TODO |
| Role guard every page | Use `<AuthGuard>` and `<RoleGuard>` wrappers | ✅ DONE |
| Zod on all forms | Every form field must have a Zod validator matching the backend constraint | 📋 TODO |
| No direct date manipulation | Always use `date-fns` — never `new Date()` arithmetic inline | 📋 TODO |
| Live tracking polling | Use `refetchInterval: 5000` on TanStack Query — only when trip is `IN_PROGRESS` | 📋 TODO |
| Leaflet map lazy-loaded | React Leaflet has SSR issues — always lazy import the map component | 📋 TODO |
| **4-space indentation** | All code files use 4 spaces for indentation | ✅ DONE |
| **Yellow/Blue theme** | Primary yellow (#F5C518), Secondary blue (#4A90E2) | ✅ DONE |

---

## 🎯 Implementation Status

### ✅ Completed
1. **Project Setup**: Vite, React, TypeScript, Tailwind CSS
2. **Design System**: Yellow/blue color scheme, Inter font, reusable CSS classes
3. **Auth Module**: Complete login flow with JWT
4. **Auth Store**: Zustand with sessionStorage persistence
5. **API Client**: Axios with JWT interceptor
6. **Route Guards**: AuthGuard and RoleGuard components
7. **Login Page**: 60/40 split layout with branding and form
8. **Hover States**: Fixed and working properly
9. **Form Spacing**: No overlapping issues

### 🚧 In Progress
None currently

### 📋 To Do (Priority Order)
1. **Dashboard Layout**: Sidebar navigation, header, breadcrumbs
2. **Dashboard Page**: Summary cards, statistics, recent activity
3. **Schools Management**: CRUD operations for schools (SUPER_ADMIN only)
4. **Branches Management**: CRUD operations for branches
5. **Fleet Management**: Buses, drivers, GPS devices
6. **Route Planning**: Routes, stops, map integration
7. **Trip Management**: Scheduling, live tracking
8. **Student Management**: Students, parents, assignments
9. **Attendance Tracking**: Mark and view attendance
10. **Notifications**: Inbox and alerts

---

## ❓ Open Decisions (React Frontend)

| # | Decision | Status | Notes |
|---|---|---|---|
| 1 | Token storage — memory vs localStorage vs sessionStorage | ✅ **DECIDED: sessionStorage** | Using Zustand persist with sessionStorage |
| 2 | Token refresh implementation | ⏳ **Pending** | Currently no refresh, just logout on 401. Implement when backend ready |
| 3 | Real-time notifications — polling vs WebSocket | ⏳ Pending | Poll `GET /notifications/` every 30s initially |
| 4 | Live tracking update interval | ⏳ Pending | 5s feels right — may need to be configurable |
| 5 | Map provider — Leaflet vs Google Maps | ✅ **DECIDED: Leaflet** | Free, open-source, already in dependencies |
| 6 | i18n / multi-language support | ⏳ Pending | `react-i18next` if needed |
| 7 | Dark mode | ⏳ Pending | CSS variables already support dark mode, just need UI toggle |
| 8 | UI Component Library | ✅ **DECIDED: Custom components** | No shadcn/ui, building from scratch |
| 9 | Auth: Single role vs Multiple roles | ⚠️ **Conflict** | Backend may support multiple, current implementation assumes single |

---

## 🔄 Migration Notes (Original → Current)

### What Changed

1. **UI Components**: Switched from shadcn/ui to custom Tailwind components
2. **Token Storage**: Changed from memory-only to sessionStorage with Zustand persist
3. **Token Refresh**: Removed for now (redirect to login instead)
4. **Folder Structure**: Feature-based instead of domain-based
5. **Design System**: Added yellow/blue Smallcase-inspired theme
6. **Auth Flow**: Simplified to JWT decode only (no `/auth/me` call)

### What Stayed the Same

1. **Tech Stack**: React, TypeScript, Vite, TanStack Query, Axios, Zustand
2. **Backend Integration**: FastAPI REST API
3. **Route Guards**: Protected routes with role-based access
4. **Code Style**: 4-space indentation, functional components
5. **Future Features**: All planned pages and features remain the same

---

## 📚 Developer Notes

### Critical Files
- `src/styles/globals.css` - Contains all theme variables and reusable CSS classes
- `src/features/auth/store.ts` - Auth state management with sessionStorage
- `src/shared/lib/api.ts` - Axios configuration with JWT interceptor
- `src/app/routes.tsx` - All route definitions and guards

### Common Issues & Solutions

**Issue**: Hover states not working on role buttons
**Solution**: Ensure `.role-button` class has default `border-color` in CSS

**Issue**: Input icons overlapping with text
**Solution**: Icons need `z-10` and `pointer-events-none`, inputs need proper padding

**Issue**: Form elements too close together
**Solution**: Use `space-y-6` on form container, `mt-8` on submit button

**Issue**: Token expires and user gets logged out
**Solution**: Normal behavior - implement refresh token when backend supports it

---

## 🎓 Learning Resources

- [React Router v6 Docs](https://reactrouter.com)
- [TanStack Query v5 Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Docs](https://zod.dev)

---

**End of Frontend Context**
