# KODAK AI FILM LAB — 실제 작동형 키오스크 구현 설계서 v1.0

## 0. 목표

현재 단일 HTML 프로토타입을 **실제 팝업 현장에서 여러 태블릿이 동시에 사용 가능한 주문형 키오스크**로 전환한다.

최종 고객 흐름:

`ATTRACT`
→ `CHOOSE PRODUCT`
→ `UPLOAD MOMENT`
→ `CHOOSE STYLE`
→ `AI / TEMPLATE DEVELOP`
→ `PICK DESIGN`
→ `CUSTOMIZE`
→ `PREVIEW`
→ `ORDER`
→ `PICK UP / DHL DELIVER`
→ `COMPLETE`

핵심 원칙:

1. 기존 KODAK AI FILM LAB 비주얼은 유지한다.
2. 가격/상품/컬러/사이즈/템플릿은 HTML에 하드코딩하지 않는다.
3. 모든 상품 정보는 DB가 단일 진실 공급원(Single Source of Truth)이 된다.
4. 고객 사진은 브라우저가 아니라 서버/스토리지에서 안전하게 관리한다.
5. AI 생성과 최종 출력 파일 렌더링은 server-side에서 처리한다.
6. 태블릿은 주문 UI이며, 생산/배송은 Admin/Production 화면으로 분리한다.
7. 여러 키오스크에서 동시에 주문해도 세션이 섞이지 않아야 한다.
8. 일정 시간 미사용 시 자동 초기화하고 이전 고객 이미지를 화면에서 제거한다.

---

# 1. 권장 기술 스택

## Frontend / Kiosk

- Next.js
- React
- TypeScript
- CSS Modules 또는 Tailwind CSS
- PWA 구성
- Tablet-first responsive UI

현재 HTML의 시각 구조를 React Component로 옮기되, 디자인을 새로 만들지 않고 기존 UI를 기준으로 포팅한다.

## Backend

### 권장
Supabase

- PostgreSQL — 상품/주문/세션/상태
- Storage — 원본 사진, 후보 이미지, 최종 출력 파일
- Realtime — 휴대폰 업로드 후 키오스크 자동 반영
- Auth — Admin/Staff 전용
- Row Level Security — 고객 세션 분리

## Server Logic

- Next.js Server Route / Server Action 또는 Supabase Edge Function
- AI image processing
- template rendering
- order creation
- shipping quote/create
- webhook/event 처리

## Image Rendering

두 단계를 분리한다.

### STEP A — Creative Render
사용자 사진을 선택한 디자인 스타일로 가공.

### STEP B — Production Render
실제 인쇄 규격의 최종 파일 생성.

예:
- 티셔츠: transparent PNG
- 후드: transparent PNG
- 텀블러: vendor wrap template
- A3: 300dpi print PDF/PNG

브라우저 preview 이미지와 실제 production 파일은 별개로 관리한다.

---

# 2. 왜 단일 HTML 그대로 운영하지 않는가

정적 HTML/CSS/JS는 컨셉 검증에는 좋지만 실제 운영 시 다음 문제가 있다.

- 상품/가격 변경마다 코드 수정
- 여러 태블릿의 주문 상태 관리 어려움
- 사진 업로드 세션 충돌 가능
- 주문 DB 없음
- Admin 없음
- 출력 상태 추적 없음
- 배송 상태 추적 없음
- 개인정보 삭제 정책 구현 어려움
- AI API key를 브라우저에 두면 안 됨

따라서 **비주얼은 유지하고 데이터/상태/API만 서비스 구조로 재구축**한다.

---

# 3. Kiosk Information Architecture

## SCREEN 00 — ATTRACT

목적:
- 지나가는 고객 유입
- 1 touch로 시작

Copy:
- DELIVER THE MOMENT
- YOUR MOMENT. YOUR KODAK.
- START

Idle 90~120초 시 이 화면으로 복귀.

---

## SCREEN 01 — CHOOSE PRODUCT

Title:
**WHAT DO YOU WANT TO MAKE?**

### WEAR IT
- CUSTOM TEE
- MOMENT HOODIE

### USE IT
- MOMENT TUMBLER

### KEEP IT
- A3 MEMORY POSTER

MVP에서는 POSTCARD와 COMBO는 숨겨도 된다.

상품 정보는 `/api/products` 또는 DB query로 불러온다.

---

## SCREEN 02 — UPLOAD YOUR MOMENT

업로드 방식:

### A. Tablet Upload
- 파일 선택
- 사진 앱
- 카메라

### B. QR PHONE UPLOAD — 권장
1. 키오스크가 Session QR 표시
2. 고객 휴대폰으로 QR Scan
3. 모바일 Upload page 오픈
4. 사진 업로드
5. Supabase Realtime으로 키오스크에 자동 표시

장점:
- 고객이 자신의 휴대폰 사진을 쉽게 선택
- 케이블/AirDrop 의존 없음
- 여러 태블릿 동시 사용 가능

---

## SCREEN 03 — CHOOSE YOUR KODAK STYLE

DB 기반 Template:

- FILM_01
- COLORAMA_01
- TRAVEL_01
- ARCHIVE_01

각 Template은 다음을 가진다.

- thumbnail
- supported products
- max photo count
- text fields
- editable fields
- preview layout
- production layout
- version

---

## SCREEN 04 — DEVELOP

UI:
**YOUR FILM IS DEVELOPING…**

상태:

- UPLOADED
- QUEUED
- PROCESSING
- RENDERING
- COMPLETED
- FAILED

고객에게는 기술 API 이름이 아니라 KODAK 세계관으로 보여준다.

예:
- FRAME 04 / 36
- DEVELOPING COLOR
- BUILDING FILM FRAME
- PRINT TEST

실제로는 `design_jobs.status`를 polling 또는 realtime subscription으로 확인한다.

---

## SCREEN 05 — PICK YOUR MOMENT

3개 후보 제공.

Candidate:
- candidate_01
- candidate_02
- candidate_03

사용자가 1개를 선택.

추가 옵션:
- REGENERATE 1회
- CROP
- POSITION
- ZOOM

무제한 regeneration은 대기/비용 문제 때문에 피한다.

---

## SCREEN 06 — CUSTOMIZE

상품 공통 입력:

- Message
- Date
- Place
- Frame Number
- Photo crop
- Photo scale
- Photo position

상품별 입력:

### Apparel
- color
- size
- print placement

### Tumbler
- color
- wrap position

### Poster
- orientation
- template
- text

---

## SCREEN 07 — PREVIEW

실제 상품 Mockup.

Preview는 빠른 저해상도.
Final print는 서버에서 고해상도로 별도 생성한다.

표시:
- Product
- Color
- Size
- Template
- Message
- Price

---

## SCREEN 08 — ORDER

Order Summary.

- 상품
- 옵션
- 수량
- 가격
- 예상 제작시간

MVP 1차는 현장 결제/Staff POS 연계로 시작 가능.

2차:
- 온라인 카드 결제
- QR payment
- kiosk terminal

---

## SCREEN 09 — FULFILLMENT

질문:

**HOW DO YOU WANT YOUR MOMENT?**

### PICK UP
- 현장 수령
- Pickup Number 발급

### DELIVER
- DHL 배송

배송을 선택할 경우 고객 주소를 별도 form에서 입력한다.

필드 예시:
- country
- recipient name
- phone
- email
- postal code
- city
- state / province
- address line 1
- address line 2
- delivery note

국제배송은 주소/통관 요구사항이 국가와 실제 DHL 연동방식에 따라 달라질 수 있으므로 provider integration 단계에서 최종 확정한다.

---

## SCREEN 10 — COMPLETE

### Pick-up
- ORDER NO
- PICK-UP NO
- 제작 상태 QR

### Delivery
- ORDER NO
- DELIVERY REQUESTED
- 고객 확인용 QR / receipt

Delivery 고객에게 Pick-up Number를 그대로 보여주지 않는다.

---

# 4. Product DB

## products

```sql
id uuid primary key
product_code text unique
slug text unique
category text
display_name text
description text
base_price integer
currency text
active boolean
sort_order integer
created_at timestamptz
updated_at timestamptz
```

초기 데이터:

- TEE_001
- HOOD_001
- TUM_001
- POST_A3_001

---

## product_variants

```sql
id uuid primary key
product_id uuid
sku text unique
color_code text
color_name text
size_code text
stock_qty integer
print_profile_id uuid
price_delta integer
active boolean
```

---

## design_templates

```sql
id uuid primary key
template_code text unique
name text
version integer
thumbnail_path text
config jsonb
active boolean
```

예:

- FILM_01
- COLORAMA_01
- TRAVEL_01
- ARCHIVE_01

---

## template_product_rules

```sql
id uuid primary key
template_id uuid
product_id uuid
preview_config jsonb
production_config jsonb
active boolean
```

이 Table 덕분에 같은 FILM_01을
티셔츠 / 후드 / 텀블러 / 포스터에 맞게 각각 렌더링할 수 있다.

---

# 5. Session / Upload DB

## kiosk_sessions

```sql
id uuid primary key
kiosk_id uuid
session_code text unique
status text
started_at timestamptz
expires_at timestamptz
completed_at timestamptz
```

Status:

- ACTIVE
- ORDERED
- COMPLETED
- EXPIRED
- CANCELLED

---

## customer_uploads

```sql
id uuid primary key
session_id uuid
storage_path text
source text
mime_type text
width integer
height integer
consent_at timestamptz
purge_at timestamptz
created_at timestamptz
```

source:
- KIOSK
- QR_PHONE
- CAMERA

---

# 6. Design Job DB

## design_jobs

```sql
id uuid primary key
session_id uuid
product_id uuid
template_id uuid
status text
input_upload_id uuid
settings jsonb
error_message text
created_at timestamptz
completed_at timestamptz
```

Status:
- QUEUED
- PROCESSING
- COMPLETED
- FAILED

---

## design_candidates

```sql
id uuid primary key
design_job_id uuid
candidate_no integer
preview_path text
render_path text
selected boolean
metadata jsonb
created_at timestamptz
```

---

# 7. Order DB

## orders

```sql
id uuid primary key
order_number text unique
session_id uuid
status text
subtotal integer
shipping_fee integer
total integer
currency text
fulfillment_type text
pickup_number text
created_at timestamptz
updated_at timestamptz
```

Order Status:

- DRAFT
- DESIGN_COMPLETE
- ORDERED
- PRINTING
- READY
- PICKED_UP
- PACKED
- IN_TRANSIT
- DELIVERED
- CANCELLED

---

## order_items

```sql
id uuid primary key
order_id uuid
product_id uuid
variant_id uuid
design_candidate_id uuid
quantity integer
unit_price integer
preview_path text
production_file_path text
production_status text
```

---

# 8. Fulfillment / Shipment

## fulfillment

```sql
id uuid primary key
order_id uuid
type text
status text
production_started_at timestamptz
ready_at timestamptz
completed_at timestamptz
```

type:
- PICKUP
- DELIVERY

---

## shipments

배송 개인정보는 일반 상품 정보와 분리한다.

```sql
id uuid primary key
order_id uuid
provider text
provider_shipment_id text
tracking_number text
status text
recipient jsonb
quote jsonb
label_path text
created_at timestamptz
updated_at timestamptz
```

---

# 9. Storage 설계

Private Buckets 권장.

## uploads
원본 고객 사진.

`uploads/{session_id}/{upload_id}.jpg`

## previews
키오스크에서 보여주는 저해상도.

`previews/{session_id}/{design_id}.webp`

## production
실제 출력용.

`production/{order_id}/{order_item_id}.png`

## labels
배송 라벨.

`labels/{order_id}/shipment.pdf`

고객 사진은 운영 정책에 맞춰 자동 삭제 기간을 설정한다.

---

# 10. API 설계

## Session

`POST /api/sessions`

Response:
```json
{
  "sessionId": "...",
  "sessionCode": "K82417",
  "uploadQrUrl": "..."
}
```

---

## Products

`GET /api/products`

---

## Upload

`POST /api/uploads/sign`

→ signed upload URL 발급.

---

## Generate

`POST /api/design-jobs`

Body:
```json
{
  "sessionId": "...",
  "productCode": "TEE_001",
  "templateCode": "FILM_01",
  "uploadId": "..."
}
```

---

## Candidate Select

`POST /api/designs/{id}/select`

---

## Preview

`POST /api/render/preview`

---

## Order

`POST /api/orders`

---

## Fulfillment

`POST /api/orders/{id}/fulfillment`

---

## Shipment

향후 DHL 연동 시:

- shipping quote
- create shipment
- label
- tracking

기능을 별도 Adapter로 둔다.

앱 전체가 DHL API 구조에 직접 결합되지 않도록 한다.

예:

```ts
interface ShippingProvider {
  getQuote(input): Promise<Quote>
  createShipment(input): Promise<Shipment>
  getTracking(trackingNo): Promise<Tracking>
}
```

---

# 11. QR Phone Upload 상세 흐름

이 기능을 우선 구현할 것을 권장한다.

## Kiosk

1. Session 생성
2. `/upload/{session_code}` QR 생성
3. `customer_uploads` subscribe

## Customer Phone

1. QR Scan
2. Session 유효성 확인
3. 사진 선택
4. 압축/회전 보정
5. Signed URL upload
6. DB insert

## Kiosk

Realtime event 수신
→ 사진 자동 표시
→ `다음` 버튼 활성화.

---

# 12. 실제 인쇄에서 중요한 점

웹 브라우저에서 모든 프린터를 무인 자동 제어하는 방식은 제한이 있다.

따라서 초기 MVP는:

### Production Dashboard
Staff가 주문을 확인하고:

- DOWNLOAD PRINT FILE
- START PRINTING
- MARK READY

버튼을 누르는 구조를 권장한다.

2차 단계에서 자동출력을 원하면:

- local print bridge
- print station agent
- native kiosk helper

중 하나를 추가한다.

브라우저 UI와 프린터 제어는 분리한다.

---

# 13. Admin / Production Dashboard

URL 예:

`/admin/orders`

## Queue

### NEW
#K82417
TEE / WHITE / M
FILM_01

### PRINTING

### READY

### SHIPPING

각 주문 카드:

- customer preview
- 상품
- 옵션
- 제작 파일
- pickup/delivery
- 상태 변경
- 재출력
- 오류 기록

---

# 14. Kiosk Device 운영

권장 운영:

- 10~13 inch touch tablet
- browser full-screen
- kiosk / guided access mode
- auto-launch
- screen sleep off
- dedicated Wi-Fi
- charging cable hidden
- 90~120 second inactivity timeout
- restart after complete

Touch target:
최소 44px 이상.

키즈용은:
- 낮은 counter
- 큰 버튼
- 긴 text 입력 최소화

성인용과 같은 Web App을 사용하되 CSS breakpoint로 크기 조정.

---

# 15. 개인정보 / 현장 안전

필수 UX:

사진 Upload 전:

- 제작 목적 사용 동의
- 자동 삭제 예정 안내
- 공개 홍보 활용은 별도 opt-in

기본값:
**홍보 사용 비동의**

고객이 완료하면:
- session revoke
- browser local state clear

Idle timeout에서도 동일.

배송주소:
- 주문/배송 데이터에만 저장
- kiosk localStorage에 장기간 저장하지 않는다.

---

# 16. 현재 HTML에서 바로 수정해야 할 구조

## 1. 가격 하드코딩 제거
HTML에 상품 가격을 쓰지 않고 DB에서 가져온다.

## 2. 상품별 Preview 분리
현재 Preview가 T-shirt 중심이라면 다음 Component로 분리:

- `TeePreview`
- `HoodiePreview`
- `TumblerPreview`
- `PosterPreview`

## 3. Product와 Style 선택 분리
한 화면에 섞지 않는 것을 권장.

## 4. Delivery Complete 분리
Pickup / Delivery 완료 화면을 다르게 만든다.

## 5. Customer Session 추가
모든 주문/사진이 `session_id`에 묶여야 한다.

---

# 17. React Project Structure

```text
kodak-ai-film-lab/
├─ app/
│  ├─ kiosk/
│  │  ├─ page.tsx
│  │  └─ components/
│  │     ├─ AttractScreen.tsx
│  │     ├─ ProductScreen.tsx
│  │     ├─ UploadScreen.tsx
│  │     ├─ StyleScreen.tsx
│  │     ├─ DevelopScreen.tsx
│  │     ├─ PickScreen.tsx
│  │     ├─ CustomizeScreen.tsx
│  │     ├─ PreviewScreen.tsx
│  │     ├─ FulfillmentScreen.tsx
│  │     └─ CompleteScreen.tsx
│  ├─ upload/
│  │  └─ [sessionCode]/page.tsx
│  ├─ admin/
│  │  └─ orders/page.tsx
│  └─ api/
├─ components/
│  ├─ product-preview/
│  │  ├─ TeePreview.tsx
│  │  ├─ HoodiePreview.tsx
│  │  ├─ TumblerPreview.tsx
│  │  └─ PosterPreview.tsx
│  └─ ui/
├─ lib/
│  ├─ supabase/
│  ├─ render/
│  ├─ products/
│  ├─ shipping/
│  └─ session/
├─ public/
│  ├─ brand/
│  ├─ templates/
│  └─ mockups/
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
├─ reference/
│  └─ current-kiosk.html
├─ AGENTS.md
└─ BUILD_SPEC.md
```

---

# 18. Codex 작업 방식

Codex에게 한번에 “전체 앱 만들어줘”라고 하지 않는다.

**Phase 단위로 작업시킨다.**

## PHASE 01 — Existing UI Port

목표:
현재 HTML 디자인을 React/Next.js로 옮긴다.

Prompt:

```text
Read BUILD_SPEC.md and reference/current-kiosk.html.

Build Phase 01 only.

Goal:
Port the current KODAK AI FILM LAB kiosk UI to Next.js + TypeScript.

Rules:
- Do not redesign the visual identity.
- Preserve the existing KODAK yellow/red/black visual system.
- Do not implement real AI, database, payment, DHL, or printing yet.
- Split every kiosk step into a separate React component.
- Use one central kiosk state machine.
- Make the UI tablet-first and touch-friendly.
- Remove hard-coded product prices from screen components and load them from a temporary typed product config.
- Add inactivity auto-reset.
- Add basic unit tests for the state flow.

When finished:
1. run lint
2. run typecheck
3. run tests
4. summarize changed files
5. do not start Phase 02.
```

---

## PHASE 02 — Supabase

Prompt:

```text
Implement Phase 02 from BUILD_SPEC.md.

Add Supabase database and storage support.

Create migrations for:
products
product_variants
design_templates
template_product_rules
kiosks
kiosk_sessions
customer_uploads
design_jobs
design_candidates
orders
order_items
fulfillment
shipments

Requirements:
- Add seed data for TEE_001, HOOD_001, TUM_001, POST_A3_001.
- Add templates FILM_01, COLORAMA_01, TRAVEL_01, ARCHIVE_01.
- Use private storage buckets.
- Add Row Level Security.
- Do not add AI generation yet.
- Replace temporary frontend product config with DB data.
```

---

## PHASE 03 — QR Photo Upload

Prompt:

```text
Implement QR phone upload.

Kiosk:
- create a session
- show a QR code
- subscribe to uploads for that session

Mobile:
- /upload/[sessionCode]
- validate session
- let user choose one or more photos
- upload using signed URL
- show upload success

Kiosk:
- update automatically through realtime
- never show uploads from another session
```

---

## PHASE 04 — Template Renderer

AI보다 먼저 이 단계부터 완성한다.

```text
Build the template rendering engine.

Input:
customer photo
template
product
custom text
date
place
frame number

Output:
preview webp
production png/pdf

Create renderers for:
FILM_01
TRAVEL_01
COLORAMA_01
ARCHIVE_01

Support:
TEE_001
HOOD_001
TUM_001
POST_A3_001

Keep layout values in template config rather than hardcoding them into React components.
```

---

## PHASE 05 — AI

Controlled AI를 추가.

원칙:
- 고객 사진 원본 보존
- 3 candidate
- 1 regeneration 제한 가능
- prompt/version 기록
- 실패 시 template-only fallback

---

## PHASE 06 — Order/Admin

- 주문 생성
- 제작 Queue
- 상태
- Pickup No
- Production file
- mark ready

---

## PHASE 07 — Delivery

배송 provider adapter 구현.

실제 DHL 계약/API/운영조건 확정 후 provider를 연결한다.

---

## PHASE 08 — Production

- print station
- local print bridge 필요성 검토
- 재출력
- 실패/불량 처리
- 재고 차감

---

# 19. MVP 우선순위

## MVP 0
현재 UI React Port.

## MVP 1
실제 작동:
- Products DB
- QR upload
- Template generation
- Preview
- Order
- Admin
- Pickup

여기까지면 **실제 팝업 테스트 가능**.

## MVP 2
- AI 3안
- 결제
- DHL delivery
- shipment tracking

## MVP 3
- automatic printing
- stock
- analytics
- CRM / coupon

---

# 20. 가장 먼저 해야 할 개발 작업

**다음 작업은 이미지 생성이 아니라 현재 HTML을 Git repository에 넣고 Phase 01 React Port를 시작하는 것.**

첫 결과물은:

1. 실제 실행되는 kiosk web app
2. `/kiosk`
3. `/upload/:session`
4. `/admin/orders`
5. Supabase schema
6. seed products
7. four product previews

이 구조가 만들어진 뒤 AI와 DHL을 붙인다.

---

# 21. 최종 원칙

**Kiosk UI / Product DB / Design Engine / Production / Delivery를 한 덩어리로 만들지 않는다.**

구조:

```text
KIOSK
  ↓
SESSION
  ↓
PHOTO
  ↓
DESIGN ENGINE
  ↓
PRODUCT PREVIEW
  ↓
ORDER
  ↓
┌──────────────┬──────────────┐
│ PICKUP       │ DELIVERY     │
│ PRINT QUEUE  │ PACK + SHIP  │
└──────────────┴──────────────┘
```

이렇게 나누면 KODAK 팝업이 끝나도 다른 브랜드/상품으로 확장하기 쉽다.
