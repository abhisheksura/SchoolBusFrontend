# 🖥️ School Bus Tracker — React Frontend AI Context
> **Platform:** Web (React + TypeScript)
> **Target Roles:** SCHOOL_ADMIN, BRANCH_ADMIN (and SUPER_ADMIN where noted)
> **Last Updated:** March 2026
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
| UI component library | shadcn/ui (Radix + Tailwind) |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Maps | React Leaflet (live bus tracking) |
| Charts | Recharts |
| Notifications | Sonner (toast) |
| Date handling | date-fns |
| Icons | Lucide React |

---

## 🔐 Auth Flow

### JWT Strategy
- `POST /api/v1/auth/login` → stores `access_token` in memory (Zustand), `refresh_token` in `httpOnly` cookie (or `localStorage` if no cookie support)
- Access token expires in **30 minutes** — Axios interceptor silently refreshes via `POST /api/v1/auth/refresh`
- On 401 response → call refresh → retry original request → on refresh failure, redirect to `/login`
- `POST /api/v1/auth/logout` on explicit logout — also clear Zustand + cookie

### Auth Store (Zustand)
```typescript
interface AuthStore {
  user: MeResponse | null        // from GET /api/v1/auth/me
  accessToken: string | null
  roles: RoleResponse[]
  setAuth: (token: string, user: MeResponse) => void
  clearAuth: () => void
  hasRole: (role: RoleName) => boolean
  getSchoolIds: () => number[]
  getBranchIds: (schoolId: number) => number[]
}
```

### Role-based Route Guards
- `<RequireRole role="SCHOOL_ADMIN" />` — wraps protected routes
- Redirect to `/unauthorized` if role check fails
- `SUPER_ADMIN` bypasses all school/branch scope checks

---

## 📁 Project Structure

```
src/
├── api/                    # All API calls, grouped by domain
│   ├── client.ts           # Axios instance + interceptors
│   ├── auth.ts
│   ├── schools.ts
│   ├── fleet.ts
│   ├── drivers.ts
│   ├── gps.ts
│   ├── routes.ts
│   ├── trips.ts
│   ├── students.ts
│   ├── assignments.ts
│   ├── attendance.ts
│   └── notifications.ts
├── components/
│   ├── ui/                 # shadcn/ui re-exports
│   ├── layout/             # AppShell, Sidebar, Header, PageHeader
│   ├── tables/             # Reusable DataTable wrapper
│   ├── forms/              # Reusable FormField, Select, DatePicker
│   └── shared/             # StatusBadge, EmptyState, LoadingSpinner
├── features/               # Feature-specific components + hooks
│   ├── auth/
│   ├── schools/
│   ├── fleet/
│   ├── drivers/
│   ├── gps/
│   ├── routes/
│   ├── trips/
│   ├── students/
│   ├── assignments/
│   ├── attendance/
│   └── notifications/
├── hooks/                  # Shared custom hooks
│   ├── useAuth.ts
│   ├── usePagination.ts
│   └── useDebounce.ts
├── pages/                  # Route-level page components
│   ├── dashboard/
│   ├── schools/
│   ├── fleet/
│   ├── drivers/
│   ├── gps/
│   ├── routes/
│   ├── trips/
│   ├── students/
│   ├── assignments/
│   ├── attendance/
│   └── notifications/
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts
├── types/                  # TypeScript interfaces mirroring API responses
│   └── api.ts
└── utils/
    ├── formatters.ts       # Date, status label, phone formatters
    └── constants.ts        # BASE_URL, PAGE_SIZE defaults
```

---

## 🔌 API Integration Conventions

### Base Axios Client (`api/client.ts`)
```typescript
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Request — attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response — silent refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      const newToken = await refreshAccessToken()
      error.config.headers.Authorization = `Bearer ${newToken}`
      return api(error.config)
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

### Common Query Pattern
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['drivers', 'list', { schoolId, branchId, page, activeOnly }],
  queryFn: () => getDrivers({ school_id: schoolId, branch_id: branchId, page, active_only: activeOnly }),
})
```

---

## 📊 Pages & Features

### Dashboard (`/dashboard`)
- Summary cards: total buses, active trips today, total students, pending leaves
- Today's trips timeline (status chip per trip)
- Recent notifications list

### Schools (`/schools`) — SUPER_ADMIN + SCHOOL_ADMIN
- Table: school name, is_active, branch count, actions
- Create/Edit school via slide-over form
- Drill-in to branches list

### Branches (`/schools/:schoolId/branches`)
- Table: branch name, phone, email, is_active
- Create/Edit branch form

### Fleet — Buses (`/fleet/buses`)
- Table: bus_number, capacity, is_active, current GPS device
- Create/Edit bus form
- Link to current device assignment inline

### Drivers (`/drivers`)
- Table: name, phone, license_number, is_active
- Create/Edit driver form with phone validation

### GPS Devices (`/gps/devices`)
- Table: IMEI, is_active, currently assigned bus
- Register device form
- Assign/Unassign device to bus — confirmation dialog

### Routes (`/routes`)
- List view: route_code, route_name, is_active
- Detail view: route with ordered stop list (PICKUP tab + DROPOFF tab)
- Add/remove stops with drag-to-reorder for stop_sequence
- Stop management: create/edit stop with lat/lng map picker

### Trips (`/trips`)
- Filterable table: date picker, route filter, status filter
- Create trip: select route + date + trip_type + optional bus/driver
- Status transition buttons: `Start Trip`, `Complete Trip`, `Cancel Trip`
- Live tracking view: Leaflet map showing bus position in real time
  - Polls `GET /api/v1/trips/trips/{trip_id}/live-status` every 5 seconds when IN_PROGRESS

### Students (`/students`)
- Table: name, grade, section, admission_number, is_active
- Create/Edit student (links to user_id)
- Parent management tab: list linked parents, add/remove/update relationship
- Leave requests tab: list requests, approve/reject with status badge

### Assignments (`/assignments`)
- Assign student to route form: student picker + route picker + stop picker + trip_type
- View by student or by route (toggle)
- Deactivate assignment

### Attendance (`/attendance`)
- Filter by trip → show all students + attendance status
- Filter by student → show history across trips
- Correct attendance status (BRANCH_ADMIN only)

### Notifications (`/notifications`)
- User's own inbox: unread count badge in header
- Mark as read inline
- Admin audit view: filter by type, status, user, trip

---

## 🎨 UI/UX Conventions

### Layout
- Collapsible sidebar with role-aware nav items
- Breadcrumb on every page
- `PageHeader` component: title + primary action button

### Tables (TanStack Table v8)
- Server-side pagination — never load all records
- Sortable columns where applicable
- Row actions: Edit (pencil), Deactivate (trash with confirm dialog)
- `active_only` toggle in toolbar — admins only

### Forms (React Hook Form + Zod)
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

### Status Badges
```typescript
// Map backend enum values to display labels + colors
const TRIP_STATUS_COLORS = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED:   'bg-gray-100 text-gray-600',
  CANCELLED:   'bg-red-100 text-red-700',
}
```

### Confirmation Dialogs
- All destructive actions (deactivate, unassign, reject leave) require a confirmation `AlertDialog`

### Error Handling
- `422` validation errors → extract `detail` array → show per-field errors
- `404` → show inline "Not found" state
- `409` conflict → show specific toast (e.g. "Bus number already taken")
- `403` → show "You don't have permission" toast
- Network errors → show retry button

---

## 🗂️ TypeScript Types (`types/api.ts`)

Mirror every backend response schema:

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

| Rule | Detail |
|---|---|
| Never store access token in localStorage | Keep in Zustand memory — persists across re-renders, clears on tab close |
| Always pass `school_id` + `branch_id` | Required on every scoped list endpoint as query params |
| Invalidate on mutation | After every create/update/delete: `queryClient.invalidateQueries(['domain'])` |
| Active-only toggle | Only show `active_only=false` option to `SCHOOL_ADMIN`+ — enforce in UI |
| Role guard every page | Use `<RequireRole>` wrapper — never rely on API returning 403 as the only guard |
| Zod on all forms | Every form field must have a Zod validator matching the backend constraint |
| No direct date manipulation | Always use `date-fns` — never `new Date()` arithmetic inline |
| Live tracking polling | Use `refetchInterval: 5000` on TanStack Query — only when trip is `IN_PROGRESS` |
| Leaflet map lazy-loaded | React Leaflet has SSR issues — always lazy import the map component |

---

## ❓ Open Decisions (React Frontend)

| # | Decision | Status | Notes |
|---|---|---|---|
| 1 | Token storage — memory vs localStorage | ⏳ Pending | Memory safer (no XSS risk), but lost on refresh. Consider `sessionStorage` |
| 2 | Real-time notifications — polling vs WebSocket | ⏳ Pending | Poll `GET /notifications/` every 30s initially |
| 3 | Live tracking update interval | ⏳ Pending | 5s feels right — may need to be configurable |
| 4 | Map provider — Leaflet vs Google Maps | ⏳ Pending | Leaflet is free and open, Google adds cost |
| 5 | i18n / multi-language support | ⏳ Pending | `react-i18next` if needed |
| 6 | Dark mode | ⏳ Pending | Tailwind `dark:` classes + `next-themes` or CSS variable approach |
