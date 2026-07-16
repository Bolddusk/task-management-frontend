# React Integration — Departments (Full APIs)

> **Permission:** manage actions need `dept.manage` (admin / super_admin)  
> **Base:** `http://localhost:5000/api/departments`

---

## API Summary

| Method | Endpoint | Auth | Kaam |
|--------|----------|------|------|
| GET | `/departments` | any | List (active). `?include_inactive=1` for all |
| GET | `/departments/:id` | any | Detail + user_count + task_count |
| POST | `/departments` | `dept.manage` | Create |
| PATCH | `/departments/:id` | `dept.manage` | Edit name/description/is_active |
| DELETE | `/departments/:id` | `dept.manage` | Soft delete (deactivate) |
| DELETE | `/departments/:id?hard=1` | `dept.manage` | Hard delete (only if 0 tasks) |
| GET | `/departments/:id/users` | any | Members list |
| POST | `/departments/:id/users` | `dept.manage` | Add users |
| PATCH | `/departments/:id/users/:userId` | `dept.manage` | Set primary |
| DELETE | `/departments/:id/users/:userId` | `dept.manage` | Remove user |

---

## 1. List
```
GET /api/departments
GET /api/departments?include_inactive=1
```

```json
[
  {
    "id": 1,
    "name": "Administration",
    "description": null,
    "is_active": true,
    "user_count": 10,
    "task_count": 5
  }
]
```

## 2. Get one
```
GET /api/departments/1
```

## 3. Create
```
POST /api/departments
{ "name": "Legal", "description": "Legal affairs" }
```

## 4. Update
```
PATCH /api/departments/1
{ "name": "Admin Wing", "description": "...", "is_active": true }
```

## 5. Delete

**Soft delete (recommended):**
```
DELETE /api/departments/1
→ is_active = false (tasks safe)
```

**Hard delete:**
```
DELETE /api/departments/1?hard=1
→ only if task_count = 0; also clears user_departments
```

## 6. List members
```
GET /api/departments/1/users
```

```json
{
  "department": { "id": 1, "name": "Administration", "is_active": true },
  "users": [
    {
      "id": 7,
      "full_name": "Ahmed Khan",
      "email": "ahmed.khan@test.com",
      "role_name": "officer",
      "grade_name": "BPS-17",
      "is_primary": true,
      "is_active": true
    }
  ]
}
```

## 7. Add users
```
POST /api/departments/1/users
{
  "user_ids": [7, 8, 9],
  "is_primary": false
}
```

- Already members → skipped (count in `skipped`)
- `is_primary: true` → un users ka primary ye dept ban jayega

## 8. Set primary department
```
PATCH /api/departments/1/users/7
{ "is_primary": true }
```

## 9. Remove user
```
DELETE /api/departments/1/users/7
```

**Rule:** User ki agar sirf **1** department hai to remove **block** — pehle dusri assign karo.

---

## Frontend checklist

- [ ] Departments page: list + user_count + task_count
- [ ] Add / Edit department modal
- [ ] Soft delete with confirm; hard delete only when task_count = 0
- [ ] Department detail → members table
- [ ] Add members multi-select
- [ ] Remove member + set primary actions
- [ ] Inactive filter toggle (`include_inactive`)

---

## Note

User create/update pe `dept_ids` pehle se hai (`POST/PATCH /users`).  
Ye APIs **department side** se members manage karne ke liye hain.
