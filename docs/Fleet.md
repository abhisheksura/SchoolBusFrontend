# 🚌 Fleet — Buses Domain Design Document
> Last Updated: April 2026
> Status: ✅ Fully implemented

---

## 📌 Overview

The buses sub-domain manages physical bus assets scoped to `(school_id, branch_id)`. It is the first implemented domain under `fleet/` and establishes the multi-tenant security pattern.

---

## 🔐 Multi-Tenant Security Model

### Role matrix

| Role | `school_id` in JWT | `branch_id` in JWT | Can see |
|---|---|---|---|
| `SUPER_ADMIN` | `null` | `null` | All buses across all schools |
| `SCHOOL_ADMIN` | set | `null` | All buses within their school |
| `BRANCH_ADMIN` | set | set | Only buses in their own branch |
| `DRIVER` / `PARENT` | set | set | Read-only, branch-scoped |

### Security pattern (used by all fleet sub-domains)

Security is enforced in exactly two layers:

**Router** — resolves `accessible_branch_ids` from `current_user`, validates `branch_id` + `school_id` combinations, enforces role requirements via `BranchAdminRequired` / `SuperAdminRequired` / `AnyAuthenticated`.

**Service** — checks `has_school_access` and `has_branch_access` before any mutation. Write violations return 403. Read violations return 404 (never reveal existence to other tenants).

**Repository** — scope-blind. Accepts pre-resolved `school_id` and `accessible_branch_ids` and applies them as `WHERE` clauses. Never contains role logic.

### `None` sentinel pattern

Both `school_id` and `accessible_branch_ids` use `None` to mean "no restriction":

| Value | Meaning |
|---|---|
| `school_id = None` | SUPER_ADMIN — no school filter on DB query |
| `accessible_branch_ids = None` | SUPER_ADMIN or SCHOOL_ADMIN — no branch filter |
| `accessible_branch_ids = [3, 7]` | BRANCH_ADMIN — restrict to these branch_ids |

### `branch_id` query param guard

`branch_id` is not globally unique — it is only unique within a school (`UNIQUE (branch_id, school_id)`). Sending `branch_id` without `school_id` would match the same `branch_id` across all schools. The router rejects this with `400` before it reaches the service.

---

## 🗄️ Table

```sql
buses
  bus_id      BIGSERIAL PK
  school_id   INT FK → schools.school_id (RESTRICT)
  branch_id   INT (part of composite FK)
  bus_number  VARCHAR(20) NOT NULL
  capacity    INT NOT NULL CHECK > 0
  is_active   BOOLEAN DEFAULT TRUE
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()

FOREIGN KEY (branch_id, school_id) → branches(branch_id, school_id) RESTRICT
UNIQUE (bus_number, school_id)
INDEX (school_id, branch_id)
```

- `bus_number` is unique per school, not globally — different schools can have the same bus number
- Soft delete only — `is_active = False`, never hard delete
- `ondelete="RESTRICT"` — prevents orphaned buses if school/branch is deleted

---

## 📁 File Structure

```
app/
├── fleet/
│   ├── __init__.py
│   ├── models.py       ← Bus ORM model with school/branch relationships + @property accessors
│   ├── schemas.py      ← BusCreate, BusUpdate, BusResponse (extends TenantResponse)
│   ├── repository.py   ← all DB queries
│   └── service.py      ← business logic
└── api/
    └── v1/
        └── fleet.py    ← FastAPI HTTP routes
```

---

## 🧩 Model (`fleet/models.py`)

### Key design decisions

**`school` relationship** uses `foreign_keys=[school_id]` — simple single-column FK.

**`branch` relationship** uses both `foreign_keys=[branch_id, school_id]` and an explicit `primaryjoin` string:
```python
primaryjoin="and_(Bus.branch_id == Branch.branch_id, Bus.school_id == Branch.school_id)"
```
The string form is required because SQLAlchemy cannot auto-resolve composite FK relationships without it. Using `foreign_keys` alone (or as a string) causes mapper resolution failure and `None` relationships at runtime.

**`@property` accessors** flatten `bus.school.school_name` → `bus.school_name` and `bus.branch.branch_name` → `bus.branch_name`. Pydantic's `from_attributes=True` reads these as regular attributes during `BusResponse.model_validate(bus)`. These properties raise `AttributeError` if called on a `Bus` fetched without `selectinload` — see repository split below.

---

## 📬 Schemas (`fleet/schemas.py`)

```python
BusCreate:
    branch_id : int (gt=0)           # school_id comes from URL — never in body
    bus_number: str (1-20 chars)
    capacity  : int (gt=0)

BusUpdate:
    bus_number: str | None
    capacity  : int | None
    is_active : bool | None
    branch_id : int | None           # SCHOOL_ADMIN/SUPER_ADMIN can move bus to another branch

BusResponse(TenantResponse):        # inherits school_id, school_name, branch_id, branch_name
    bus_id    : int
    bus_number: str
    capacity  : int
    is_active : bool
    created_at: datetime
    updated_at: datetime
```

`BusResponse` inherits from `TenantResponse` (defined in `core/schemas.py`):
```python
class TenantResponse(BaseModel):
    school_id  : int
    school_name: str
    branch_id  : int
    branch_name: str
```

This keeps the response flat — all tenant fields at the top level — while the definition lives in one place and is reused across all branch-scoped domain responses.

---

## 🗂️ Repository (`fleet/repository.py`)

### Split fetch pattern

Two `get_bus_by_bus_id` variants exist intentionally:

| Function | Relations loaded | Use when |
|---|---|---|
| `get_bus_by_bus_id` | No | Internal access checks before writes — only need `branch_id` |
| `get_bus_by_bus_id_with_relations` | Yes (`selectinload`) | Result serialized into `BusResponse` |

This avoids loading unnecessary joins on every service call. The service uses the plain version for pre-mutation checks, then the repo's write functions re-fetch with relations for the final response.

### All functions

```python
get_bus_by_bus_id(db, bus_id, school_id)                    → Bus          # no relations
get_bus_by_bus_id_with_relations(db, bus_id, school_id)     → Bus          # with relations
get_all_buses_by_branch(db, school_id, branch_id,
    accessible_branch_ids, limit, offset,
    active_only, search)                                    → tuple[list[Bus], int]
create_bus(db, school_id, branch_id, bus_number, capacity)  → Bus          # re-fetches with relations
update_bus_by_bus_id(db, bus_id, school_id, **kwargs)       → Bus          # RETURNING bus_id, re-fetch
deactivate_bus_by_bus_id(db, bus_id, school_id)             → Bus          # RETURNING bus_id, re-fetch
```

### `_with_relations` helper

```python
def _with_relations(query):
    return query.options(
        selectinload(Bus.school),
        selectinload(Bus.branch),
    )
```

Applied to all queries whose result goes into `BusResponse`. Not applied to internal-only fetches.

### RETURNING pattern (update/deactivate)

Both `update_bus_by_bus_id` and `deactivate_bus_by_bus_id` use `.returning(Bus.bus_id)` — just the PK — then call `get_bus_by_bus_id_with_relations` for the final response. This avoids stale identity map issues and correctly loads relations on the fresh fetch.

---

## ⚙️ Service (`fleet/service.py`)

### Access check pattern (all write functions)

```python
bus = await fleet_repo.get_bus_by_bus_id(db, bus_id, school_id)  # no relations needed
if not current_user.has_school_access(school_id):
    raise ForbiddenError()   # 403 — write endpoint
if not current_user.has_branch_access(school_id, bus.branch_id):
    raise ForbiddenError()   # 403 — write endpoint
```

Read violations use `BusNotFoundError` (404). Write violations use `ForbiddenError` (403).

### `create_bus` two-step branch validation

```python
if not current_user.has_branch_access(school_id, payload.branch_id):
    raise ForbiddenError()                                          # step 1 — role check
await school_repo.get_branch_by_branch_id(db, payload.branch_id, school_id)  # step 2 — DB ownership
```

Step 1 catches BRANCH_ADMIN sending a foreign `branch_id`. Step 2 catches SCHOOL_ADMIN sending a `branch_id` from a different school (passes role check but DB rejects it).

### `update_bus` branch change validation

Same two-step validation applied to `new_branch_id` if `branch_id` is in the update payload. Uses `bus.school_id` (from the fetched object) not the URL `school_id` — important for SUPER_ADMIN where URL `school_id` is `None`.

---

## 🌐 Routes (`api/v1/fleet.py`)

| Method | Path | Auth | Status | Notes |
|---|---|---|---|---|
| `POST` | `/schools/{school_id}/buses/` | `BranchAdminRequired` | `201` | Service enforces branch scope |
| `GET` | `/buses/` | `SuperAdminRequired` | `200` | Global list, `school_id` optional query param |
| `GET` | `/schools/{school_id}/buses/` | `AnyAuthenticated` | `200` | `has_school_access` checked in router |
| `GET` | `/schools/{school_id}/buses/{bus_id}` | `AnyAuthenticated` | `200` | Scope enforced in service |
| `PATCH` | `/schools/{school_id}/buses/{bus_id}` | `BranchAdminRequired` | `200` | Service enforces scope |
| `DELETE` | `/schools/{school_id}/buses/{bus_id}` | `BranchAdminRequired` | `200` | Soft delete, returns deactivated object |

### Query params (`GET /buses/` and `GET /schools/{school_id}/buses/`)

| Param | Type | Default | Notes |
|---|---|---|---|
| `branch_id` | `int \| None` | `None` | Requires `school_id` — rejected with 400 if sent alone |
| `search` | `str \| None` | `None` | ILIKE on `bus_number`, server-side, spans all pages |
| `active_only` | `bool` | `True` | Pass `false` to include inactive buses |
| `page` | `int` | `1` | 1-indexed |
| `page_size` | `int` | `20` | Max 100 |

---

## 🔑 Key Design Decisions

| Decision | Rationale |
|---|---|
| `BusResponse` inherits `TenantResponse` | Keeps response flat while sharing the 4-field tenant definition — future domains just inherit |
| `@property` on ORM model for `school_name`/`branch_name` | Pydantic `from_attributes=True` reads properties like attributes — no custom serializer needed |
| `primaryjoin` string on `branch` relationship | Composite FK relationships require explicit `primaryjoin` — `foreign_keys` alone causes mapper failure |
| Split `get_bus_by_bus_id` / `get_bus_by_bus_id_with_relations` | Avoids loading joins on every pre-mutation check — relations only loaded when result is serialized |
| RETURNING `Bus.bus_id` not `Bus` | Returning the full ORM object from UPDATE doesn't trigger relationship loading — cleaner to return PK and re-fetch |
| `branch_id` not in URL for detail routes | Client doesn't need to know the branch before fetching — fetch by `(bus_id, school_id)`, verify `bus.branch_id` in service |
| `branch_id` query param rejected without `school_id` | `branch_id` is not globally unique — `UNIQUE (branch_id, school_id)` means same ID exists across schools |
| Two-step branch validation on create and update | Role check alone is insufficient for SCHOOL_ADMIN — DB check confirms branch belongs to URL's school |
| SUPER_ADMIN uses `GET /buses/` not `GET /schools/{id}/buses/` | SUPER_ADMIN has no school binding in JWT — global endpoint accepts optional `school_id` query param |

---

## 🐛 Known Issues / Fixes Applied

| Issue | Fix | File |
|---|---|---|
| `branch` relationship returning `None` | Added explicit `primaryjoin` string to composite FK relationship | `fleet/models.py` |
| `school_name`/`branch_name` missing from `BusResponse` | Added `@property` accessors on `Bus` model to flatten nested relationships | `fleet/models.py` |
| `school_id` in `BusCreate` body | Removed — `school_id` comes from URL path param only, never request body | `fleet/schemas.py` |
| `getBuses` calling wrong endpoint (`/fleet/buses/?school_id=`) | Split endpoint by role — SUPER_ADMIN uses `/fleet/buses/`, others use `/fleet/schools/{id}/buses/` | `buses/api/index.ts` |
| Client-side search filtering only current page | `debouncedSearch` passed to `getBuses` as query param, backend applies `ILIKE` | `repository.py`, `BusesPage.tsx` |
| SCHOOL_ADMIN branch dropdown empty | `getBranchIds()` returns `[]` for SCHOOL_ADMIN — replaced with `useQuery(getBranches)` in slide-over | `BusesPage.tsx` |

---

## ❓ Open Decisions

| # | Decision | Status | Notes |
|---|---|---|---|
| 1 | Stat pill counts (Total/Active/Inactive/Seats) derived client-side from current page | ⏳ Should be server-side aggregates | Backend could return `meta: { total_active, total_inactive, total_seats }` alongside paginated items |
| 2 | SUPER_ADMIN creating a bus — school selector in slide-over | ✅ Implemented | Fetches schools from `GET /schools/`, then branches dynamically on school change |
| 3 | BRANCH_ADMIN branch field read-only in edit form | ✅ Implemented | Service rejects cross-branch edits anyway — UI matches |
