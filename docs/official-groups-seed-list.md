# Vitrine Official Groups — Seed List (Sports)

Canonical list for seeding the community hub. All groups are **official** (`is_official: true`).  
L1/L2 codes match the backend taxonomy (`category_types`, `category_categories`).

| # | Group name | L1 type_code | L2 category_code | Description |
|---|-------------|--------------|------------------|-------------|
| 1 | Vitrine Baseball | `baseball` | — | The official community for baseball memorabilia. |
| 2 | Vitrine Basketball | `basketball` | — | The official community for basketball memorabilia. |
| 3 | Vitrine Football | `football` | — | The official community for football memorabilia. |
| 4 | Vitrine Hockey | `hockey` | — | The official community for hockey memorabilia. |
| 5 | Vitrine Soccer | `soccer` | — | The official community for soccer memorabilia. |
| 6 | **Baseball Jerseys** | `baseball` | `jersey` | Game-worn and authentic jerseys across sports. |
| 7 | **Football Helmets** | `football` | `helmet` | Helmets and protective gear. |
| 8 | **Signed Baseballs** | `baseball` | `ball` | Signed balls and similar items. |
| 9 | Puck Collectors | `hockey` | `puck` | Signed pucks and hockey memorabilia. |
| 10 | Cleats & Kicks | `soccer` | `cleatsshoes` | Cleats and shoes. |
| 11 | Belts & Titles | `boxing` | `belts` | Championship belts and boxing. |
| 12 | Pro Wrestling | `pro_wrestling` | — | Pro wrestling memorabilia. |
| 13 | MMA | `mma` | — | MMA memorabilia. |
| 14 | Golf | `golf` | — | Golf memorabilia. |
| 15 | Tennis | `tennis` | — | Tennis memorabilia. |

---

**Renames applied (from original proposal):**
- Jersey Vault → **Baseball Jerseys**
- Helmets & Gear → **Football Helmets**
- Signed Balls → **Signed Baseballs**

Use this list when building the seed migration or script (e.g. insert into `conversations` with `type = 'group'`, plus `category_type` / `category_code` and `is_official = true`).
