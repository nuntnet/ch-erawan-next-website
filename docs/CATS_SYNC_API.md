# CATS Sync API

Inbound webhook that lets **CATS** (the ATS at `cats.ch-erawan.com`) push job
postings into this site. This site is a pure receiver — it never calls out to
CATS. The career page (`/career`) always renders whatever is currently stored
with `status: "open"`.

Also available as an OpenAPI 3.0 spec: [`openapi/cats-sync.yaml`](../openapi/cats-sync.yaml)
— import it into Swagger UI, Postman, or Insomnia for a clickable/testable view.

## Auth

Every request needs:

```
Authorization: Bearer <CATS_SYNC_SECRET>
```

`CATS_SYNC_SECRET` is a shared secret — same value in this site's env vars and
in CATS's outbound-webhook config. Generate one with:

```bash
openssl rand -hex 32
```

Missing/wrong secret → `401 { "error": "Unauthorized" }`. If `CATS_SYNC_SECRET`
isn't set on this site at all, every request 401s (fails closed).

## Endpoints

Base path: `/api/cats/jobs`

### `POST /api/cats/jobs` — create or update job postings

Body is either a single job object, or `{ "jobs": [...] }` for a batch. Existing
postings are matched by `externalId` and fully replaced (upsert) — re-push the
same `externalId` any time a job changes.

**Job object fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `externalId` | string | ✅ | CATS's own job id — the upsert key |
| `title` | string | ✅ | |
| `code` | string \| null | – | short code shown as a badge, e.g. `"SC"` |
| `category` | enum | ✅ | `sales` \| `service` \| `finance` \| `support` \| `mgmt` |
| `branches` | string[] | ✅ | one or more of: `mazda_npt`, `mazda_salaya`, `deepal_salaya`, `ford_omnoi`, `mitsubishi_npt`, `gwm_npt`, `kia_sampran`, `hq` |
| `salary` | string \| null | – | free text, e.g. `"35,000–60,000 บาท"` |
| `employmentType` | string \| null | – | e.g. `"งานประจำ"` |
| `requirements` | string[] \| null | – | shown as bullet tags on the card |
| `description` | string \| null | – | stored, not yet rendered on the page |
| `urgent` | boolean | – | shows a "ด่วน!" badge |
| `status` | enum | ✅ | `open` \| `closed` — closed postings don't appear on `/career` |

**Example — single job:**

```bash
curl -X POST https://<site>/api/cats/jobs \
  -H "Authorization: Bearer $CATS_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "cats-1234",
    "title": "ที่ปรึกษาการขาย (Sales Consultant)",
    "code": "SC",
    "category": "sales",
    "branches": ["mazda_npt", "ford_omnoi"],
    "salary": "ตามประสบการณ์ + commission",
    "employmentType": "งานประจำ",
    "requirements": ["วุฒิ ปวส. ขึ้นไป", "มีใจรักงานบริการ"],
    "urgent": true,
    "status": "open"
  }'
```

**Example — batch:**

```json
{ "jobs": [ { "externalId": "cats-1", "...": "..." }, { "externalId": "cats-2", "...": "..." } ] }
```

**Response `200`:**

```json
{ "ok": true, "upserted": ["cats-1234"], "errors": [] }
```

If some jobs in a batch fail validation, the valid ones still get written —
check `errors` for the rest:

```json
{
  "ok": false,
  "upserted": ["cats-1"],
  "errors": [{ "externalId": "cats-2", "issues": [ /* zod validation issues */ ] }]
}
```

### `PATCH /api/cats/jobs` — open/close a posting

The lightweight path for "just flip the status" — no need to resend the full
job payload.

```bash
curl -X PATCH https://<site>/api/cats/jobs \
  -H "Authorization: Bearer $CATS_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "externalId": "cats-1234", "status": "closed" }'
```

**Response `200`:** `{ "ok": true }`

**Response `404`** if `externalId` was never pushed via `POST`:
`{ "error": "Unknown externalId — push it via POST first" }`

### `GET /api/cats/jobs` — verification

Returns everything currently stored, regardless of status — for CATS-side
debugging after a push.

```bash
curl https://<site>/api/cats/jobs -H "Authorization: Bearer $CATS_SYNC_SECRET"
```

**Response `200`:** `{ "jobs": [ /* full JobPosting rows, any status */ ] }`

## Behavior notes

- Any successful `POST`/`PATCH` revalidates `/career` immediately (`revalidatePath`) — no cache delay.
- `category` and `branches` are validated against fixed enums (see table above). An unknown value in either fails validation for that job — it won't silently show up mislabeled on the site.
- Storage: a `job_postings` table in this site's own Turso DB (not shared with CATS's database) — see `lib/db/schema.ts` / `lib/jobs.ts`.
