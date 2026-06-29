# 알레르기 필터앱 PRD & 개발 스펙

문서 버전: v0.2  
작성일: 2026-06-28  
최종 수정일: 2026-06-29  
서비스 형태: Web App + Capacitor App  
기술 스택: Vite React + Capacitor + Supabase + Vercel  
초기 카테고리: 치킨, 피자  
초기 브랜드: 카테고리별 10개 내외, 추후 확정  

---

## 1. 제품 개요

### 1.1 제품명

알러핏(AllerFit)

### 1.2 제품 한 줄 정의

사용자가 설정한 알레르기 유발 성분을 기준으로 국내 프랜차이즈 메뉴 중 먹을 수 있는 메뉴, 주의가 필요한 메뉴, 피해야 할 메뉴를 분류해주는 알레르기 필터 앱.

### 1.3 핵심 문제

국내 치킨, 피자, 버거 등 프랜차이즈는 일부 알레르기 유발 성분 정보를 제공하지만, 정보가 브랜드별 홈페이지, PDF, 배달앱 메뉴 상세, 공지사항 등에 흩어져 있어 사용자가 매번 직접 확인해야 한다.

특히 알레르기가 있는 아이를 키우는 부모는 외식이나 배달 메뉴 선택 시 아래 문제를 겪는다.

- 브랜드별 알레르기 정보를 찾기 어렵다.
- 메뉴별 포함 성분을 일일이 대조해야 한다.
- 내 아이가 피해야 하는 성분 기준으로 먹을 수 있는 메뉴만 빠르게 보기 어렵다.
- 성분 정보가 오래되었는지, 공식 출처인지 판단하기 어렵다.
- 교차오염 가능성이나 정보 불완전성을 구분하기 어렵다.

### 1.4 제품 목표

MVP의 목표는 사용자가 자신의 알레르기 성분을 설정한 뒤, 치킨/피자 카테고리에서 먹을 수 있는 메뉴를 빠르게 확인하도록 하는 것이다.

핵심 흐름은 다음과 같다.

```text
알레르기 성분 선택
→ 홈에서 카테고리 선택
→ 카테고리 상세에서 먹을 수 있는 메뉴 확인
→ 브랜드 상세 또는 메뉴 상세에서 근거 확인
→ 필요 시 카테고리 내 검색
```

### 1.5 초기 타깃 사용자

#### Primary Target

알레르기가 있는 아이를 키우는 부모.

#### Secondary Target

본인에게 음식 알레르기가 있는 성인.

#### Future Target

비건, 종교적 식이제한, 건강상 제한식, 특정 원재료 회피 사용자를 포함할 수 있다.

---

## 2. MVP 범위

### 2.1 포함 범위

MVP에서 포함하는 기능은 아래와 같다.

- 온보딩
- 알레르기 성분 선택
- 홈 화면
- 카테고리 상세 화면
- 카테고리 내 검색
- 브랜드 상세 화면
- 메뉴 상세 화면
- 알레르기 설정 변경
- 메뉴 안전도 판정
- 출처 및 마지막 확인일 표시
- 기본 주의 문구 표시

### 2.2 제외 범위

MVP에서는 아래 기능을 제외한다.

- 가족 구성원별 알레르기 프로필
- 브랜드 제휴 관리자 페이지
- 자동 크롤링
- 사용자 제보 기능
- 배달앱 직접 주문 연동
- 푸시 알림
- 유료 결제
- 위치 기반 매장 검색
- OCR 기반 데이터 추출
- 복수 사용자 간 공유 기능

### 2.3 2차 개발 후보

- 가족/아이별 프로필
- 신메뉴 알림
- 브랜드별 데이터 변경 감지
- 사용자 제보 및 검수 플로우
- 관리자 페이지
- 배달앱 링크 연결
- 카페, 버거, 분식 카테고리 확장
- 브랜드 신뢰도 배지
- 광고/제휴 상품

---

## 3. 초기 카테고리 및 브랜드 정책

### 3.1 초기 카테고리

```text
chicken: 치킨
pizza: 피자
```

### 3.2 브랜드 선정 정책

초기 브랜드는 추후 확정한다. 개발 시에는 브랜드 목록을 하드코딩하지 않고 DB seed 또는 관리자 입력을 통해 관리한다.

브랜드 선정 우선순위는 아래 기준을 따른다.

1. 공식 알레르기 정보 제공 여부
2. 정보가 표, PDF, 페이지 등으로 수집 가능한지 여부
3. 국내 인지도 및 이용 빈도
4. 메뉴 수와 업데이트 빈도
5. 데이터 검수 가능성

### 3.3 브랜드 Placeholder 정책

개발 단계에서는 아래와 같은 placeholder 구조를 사용한다.

```text
chicken_brand_01
chicken_brand_02
...
chicken_brand_10

pizza_brand_01
pizza_brand_02
...
pizza_brand_10
```

실제 브랜드 확정 후 DB의 `brands` 테이블에 정식 브랜드 데이터를 입력한다.

---

## 4. 알레르기 성분 정책

### 4.1 초기 알레르기 성분

초기 앱에서 사용하는 성분은 국내 식품 알레르기 표시 기준에 맞춰 구성한다.

| code | 공식명 | 사용자 표시명 |
|---|---|---|
| egg | 난류 | 계란 |
| milk | 우유 | 우유·유제품 |
| buckwheat | 메밀 | 메밀 |
| peanut | 땅콩 | 땅콩 |
| soybean | 대두 | 대두·콩 |
| wheat | 밀 | 밀·글루텐 |
| mackerel | 고등어 | 고등어 |
| crab | 게 | 게 |
| shrimp | 새우 | 새우 |
| pork | 돼지고기 | 돼지고기 |
| peach | 복숭아 | 복숭아 |
| tomato | 토마토 | 토마토 |
| sulfite | 아황산류 | 아황산류 |
| walnut | 호두 | 호두·견과류 |
| chicken | 닭고기 | 닭고기 |
| beef | 쇠고기 | 소고기 |
| squid | 오징어 | 오징어 |
| shellfish | 조개류 | 조개류 |

### 4.2 사용자 표시 원칙

일반 사용자가 이해하기 쉬운 표현을 우선한다.

예시:

- 난류 → 계란
- 우유 → 우유·유제품
- 대두 → 대두·콩
- 밀 → 밀·글루텐
- 쇠고기 → 소고기
- 호두 → 호두·견과류

### 4.3 성분 포함 유형

메뉴와 성분의 관계는 아래 3가지로 구분한다.

| 값 | 의미 | 사용자 표시 |
|---|---|---|
| contains | 원재료 또는 공시 정보상 포함 | 포함 |
| may_contain | 교차오염, 혼입 가능, 같은 제조시설 등 | 주의 가능성 |
| unknown | 정보 불완전 또는 확인 불가 | 정보 확인 필요 |

---

## 5. 메뉴 안전도 판정 로직

### 5.1 상태값

앱에서 사용하는 메뉴 판정 상태는 아래 4가지다.

| status | 사용자 표시 | 의미 |
|---|---|---|
| safe_by_public_info | 공시 기준 선택 성분 없음 | 사용자가 선택한 알레르기 성분이 공시 정보상 확인되지 않음 |
| caution | 주의 필요 | 선택 성분이 may_contain에 해당하거나 정보가 불완전함 |
| avoid | 피해야 함 | 선택 성분이 contains에 포함됨 |
| unknown | 정보 없음 | 메뉴 알레르기 정보가 없거나 검수되지 않음 |

### 5.2 판정 우선순위

```text
1. contains에 사용자 선택 알레르기 성분이 있으면 → avoid
2. may_contain에 사용자 선택 알레르기 성분이 있으면 → caution
3. 메뉴 알레르기 데이터가 없으면 → unknown
4. 사용자 선택 알레르기와 매칭되는 성분이 없으면 → safe_by_public_info
```

### 5.3 사용자 문구 원칙

`safe` 또는 `안전`이라는 표현은 지양한다. 대신 아래 표현을 사용한다.

```text
공시 기준 선택 성분 없음
```

주의 문구:

```text
공개된 알레르기 정보 기준의 참고 결과입니다. 원재료 변경, 매장별 조리 환경, 교차오염 가능성에 따라 실제 정보와 다를 수 있습니다. 중증 알레르기가 있는 경우 주문 전 매장 또는 브랜드 고객센터에 반드시 확인해주세요.
```

---

## 6. 서비스 IA

### 6.1 라우트 구조

React Router 기준으로 설계한다.

```text
/                           홈
/onboarding                 온보딩
/category/:categorySlug     카테고리 상세
/category/:categorySlug/search 검색 결과, 선택사항
/brand/:brandSlug           브랜드 상세
/menu/:menuSlug             메뉴 상세
/settings/allergies         알레르기 설정
/profile                    프로필, MVP에서는 선택사항
```

### 6.2 하단 내비게이션

MVP에서는 하단 탭을 아래 3개로 구성한다.

```text
홈
검색
내 알레르기
```

검색 탭은 전체 검색 진입점으로 사용한다. 카테고리 상세 내부 검색도 함께 제공한다.

---

## 7. 화면 정의 및 기능 상세

## 7.1 온보딩 화면

### 목적

사용자가 앱의 목적을 이해하고, 자신의 알레르기 성분을 설정하도록 유도한다.

### 진입 조건

- 최초 방문 사용자
- 알레르기 프로필이 없는 사용자
- 로컬 스토리지 또는 Supabase에 온보딩 완료 정보가 없는 사용자

### 화면 구성

#### Step 1. 서비스 소개

문구:

```text
내 알레르기 성분에 맞춰
먹을 수 있는 프랜차이즈 메뉴를 찾아드려요.
```

CTA:

```text
시작하기
```

#### Step 2. 알레르기 성분 선택

체크 카드 형태로 표시한다.

- 계란
- 우유·유제품
- 메밀
- 땅콩
- 대두·콩
- 밀·글루텐
- 고등어
- 게
- 새우
- 돼지고기
- 복숭아
- 토마토
- 아황산류
- 호두·견과류
- 닭고기
- 소고기
- 오징어
- 조개류

CTA:

```text
선택 완료
```

#### Step 3. 주의 안내

문구:

```text
공개된 알레르기 정보 기준으로 메뉴를 분류합니다.
중증 알레르기가 있는 경우 주문 전 매장에 반드시 확인해주세요.
```

CTA:

```text
먹을 수 있는 메뉴 보기
```

### 기능 요구사항

- 사용자는 복수 성분을 선택할 수 있어야 한다.
- 선택하지 않고 넘어갈 수 있어야 한다.
- MVP에서는 비로그인 사용을 기본으로 하며, 선택한 성분은 localStorage에 저장한다.
- Supabase Auth 기반 저장은 2차 개발 범위로 둔다.
- 추후 로그인 시 localStorage 성분을 DB로 동기화할 수 있어야 한다.

### 완료 조건

- 온보딩 완료 후 `/` 홈으로 이동한다.
- 사용자가 선택한 성분이 홈 상단에 표시된다.

---

## 7.2 홈 화면

### 목적

사용자가 자신의 알레르기 기준으로 탐색을 시작하도록 돕는다.

### 화면 구성

#### 상단 헤더

```text
오늘 먹을 수 있는 메뉴를 찾아볼까요?
우유, 밀, 대두 제외 기준이에요.
```

선택된 알레르기가 없을 경우:

```text
알레르기 성분을 설정하면 메뉴를 더 정확히 볼 수 있어요.
```

#### 카테고리 카드

- 치킨
- 피자

카테고리 카드 클릭 시 `/category/:categorySlug`로 이동한다.

#### 추천 섹션

MVP에서는 아래 섹션을 구성한다.

```text
먹을 수 있는 치킨 메뉴
먹을 수 있는 피자 메뉴
최근 업데이트된 브랜드
```

### 기능 요구사항

- 사용자의 선택 알레르기 성분을 기준으로 메뉴 상태를 계산한다.
- 치킨/피자 카테고리별로 `safe_by_public_info` 메뉴 일부를 보여준다.
- 데이터가 없을 경우 빈 상태 메시지를 보여준다.
- 알레르기 설정 CTA를 제공한다.

### 빈 상태

```text
아직 선택한 알레르기 성분이 없어요.
내 알레르기를 설정하고 먹을 수 있는 메뉴를 확인해보세요.
```

---

## 7.3 카테고리 상세 화면

### 목적

홈에서 치킨 또는 피자를 선택했을 때, 사용자가 선택한 알레르기 기준으로 해당 카테고리에서 먹을 수 있는 메뉴를 바로 확인하도록 한다.

카테고리 상세는 알레르기 성분이 선택된 상태를 기본 전제로 한다. 선택한 알레르기 성분이 없는 경우 메뉴 카드를 보여주지 않고 알레르기 선택을 유도한다.

### URL

```text
/category/chicken
/category/pizza
```

### 화면 구성

#### 상단

예시:

```text
치킨
우유, 밀, 대두 제외 기준으로 볼게요.
```

선택된 알레르기가 없을 경우:

```text
알레르기 선택이 필요합니다.
내 알레르기를 먼저 선택하면 먹을 수 있는 메뉴를 보여드릴게요.
```

#### 검색창

placeholder:

```text
메뉴명 또는 브랜드명으로 검색
```

검색 범위는 현재 카테고리 내부로 제한한다.

#### 정렬 옵션, MVP 선택사항

```text
브랜드순
메뉴명순
```

MVP 기본 정렬:

```text
브랜드명 → 메뉴명
```

#### 메뉴 카드 리스트

알레르기 성분이 선택된 경우에만 메뉴 카드 리스트를 표시한다.

리스트에는 사용자가 선택한 알레르기 기준으로 `safe_by_public_info`에 해당하는 메뉴만 표시한다. `avoid`, `caution`, `unknown` 메뉴는 카테고리 상세의 기본 카드 리스트에 표시하지 않는다.

메뉴 카드 리스트는 반응형 그리드로 구성한다.

```text
mobile: 2 columns
tablet: 3 columns
desktop: 4 columns
```

카드에 포함할 정보:

- 브랜드 로고
- 브랜드명
- 메뉴명

카드 예시:

```text
[브랜드 로고]
굽네치킨
오리지널
```

```text
[브랜드 로고]
브랜드명
메뉴명
```

카드 내부에는 상태 배지, 매칭 성분 문장, 메뉴별 마지막 확인일, 출처 상태 라벨을 표시하지 않는다.

#### 최종 업데이트일

카테고리 상세 화면 맨 하단에 현재 카테고리 데이터의 공통 최종 업데이트일을 표시한다.

```text
최종 업데이트 2026.06.28
```

최종 업데이트일은 현재 표시 중인 메뉴들의 `last_checked_at` 또는 브랜드 `last_checked_at` 중 가장 최근 날짜를 기준으로 계산한다.

#### 알레르기 미선택 상태

선택한 알레르기 성분이 없는 경우 메뉴 카드를 표시하지 않는다.

```text
알레르기 선택이 필요합니다.
내 알레르기를 선택하면 먹을 수 있는 메뉴를 보여드릴게요.
```

CTA:

```text
내 알레르기 선택하기
```

### 기능 요구사항

- 현재 카테고리의 전체 메뉴를 조회한다.
- 메뉴별 알레르기 데이터를 함께 조회한다.
- 사용자의 선택 알레르기를 기준으로 프론트에서 상태를 계산한다.
- 선택한 알레르기 성분이 없는 경우 메뉴 카드를 렌더링하지 않고 알레르기 선택 CTA를 표시한다.
- 선택한 알레르기 성분이 있는 경우 `safe_by_public_info` 메뉴를 카드 리스트로 표시한다.
- 검색어 입력 시 표시 가능한 메뉴 내에서 브랜드명 또는 메뉴명으로 필터링한다.
- 카드 클릭 시 메뉴 상세로 이동한다.
- 브랜드명 클릭 영역이 있을 경우 브랜드 상세로 이동할 수 있다.
- 화면 맨 하단에 카테고리 데이터 최종 업데이트일을 표시한다.

### 검색 동작

MVP에서는 별도 검색 결과 페이지 없이 카테고리 상세 화면 내부에서 검색 결과를 표시한다.

검색어가 있는 경우 제목을 아래처럼 표시한다.

```text
치킨에서 “후라이드” 검색 결과
```

검색 결과가 없을 경우:

```text
검색 결과가 없어요.
다른 메뉴명이나 브랜드명으로 검색해보세요.
```

---

## 7.4 브랜드 상세 화면

### 목적

특정 브랜드 안에서 사용자가 선택한 알레르기 기준으로 먹을 수 있는 메뉴를 바로 확인하도록 한다.

브랜드 상세는 알레르기 성분이 선택된 상태를 기본 전제로 한다. 선택한 알레르기 성분이 없는 경우 메뉴 카드를 보여주지 않고 알레르기 선택을 유도한다.

### URL

```text
/brand/:brandSlug
```

### 화면 구성

#### 브랜드 Hero

포함 정보:

- 브랜드 로고
- 브랜드명
- 카테고리명
- 선택 알레르기 기준 문구

예시:

```text
[브랜드 로고]
굽네치킨
우유·유제품 제외 기준으로 볼게요.
치킨 브랜드
```

선택된 알레르기가 없을 경우:

```text
알레르기 선택이 필요합니다.
내 알레르기를 선택하면 이 브랜드에서 먹을 수 있는 메뉴를 보여드릴게요.
```

#### 요약

사용자 알레르기 기준으로 먹을 수 있는 메뉴 수를 표시한다.

```text
먹을 수 있는 메뉴 5개
선택한 알레르기 기준으로 표시됩니다.
```

#### 브랜드 내 검색

placeholder:

```text
굽네치킨 메뉴 검색
```

검색 대상은 현재 브랜드의 메뉴명으로 제한한다.

#### 메뉴 리스트

알레르기 성분이 선택된 경우에만 메뉴 카드 리스트를 표시한다.

리스트에는 사용자가 선택한 알레르기 기준으로 `safe_by_public_info`에 해당하는 메뉴만 표시한다. `avoid`, `caution`, `unknown` 메뉴는 브랜드 상세의 기본 카드 리스트에 표시하지 않는다.

카드에 포함할 정보:

- 메뉴 그래픽 또는 브랜드 로고
- 메뉴명

카드 내부에는 상태 배지, 매칭 성분 문장, 메뉴별 마지막 확인일, 출처 상태 라벨을 표시하지 않는다.

#### 하단 정보

브랜드 상세 화면 맨 하단에 공통 정보를 표시한다.

```text
최종 업데이트 2026.06.28
공식 알레르기 정보 기준
```

링크:

```text
알레르기 정보 출처 보기
공식 홈페이지 보기
```

### 기능 요구사항

- 브랜드의 메뉴 목록을 조회한다.
- 사용자 알레르기 기준으로 상태를 계산한다.
- 선택한 알레르기 성분이 없는 경우 메뉴 카드를 렌더링하지 않고 알레르기 선택 CTA를 표시한다.
- 선택한 알레르기 성분이 있는 경우 `safe_by_public_info` 메뉴를 카드 리스트로 표시한다.
- 먹을 수 있는 메뉴 개수를 표시한다.
- 브랜드 내 메뉴명 검색을 지원한다.
- 메뉴 카드 클릭 시 메뉴 상세로 이동한다.
- 화면 맨 하단에 브랜드 데이터 최종 업데이트일과 출처/공식 홈페이지 링크를 표시한다.

---

## 7.5 메뉴 상세 화면

### 목적

선택한 메뉴의 알레르기 판정 근거를 상세히 제공한다.

### URL

```text
/menu/:menuSlug
```

### 화면 구성

#### 상단

```text
브랜드명
메뉴명
```

#### 결과 박스

상태별 문구:

##### safe_by_public_info

```text
공시 기준 선택 성분 없음
설정한 알레르기 성분은 공개 정보상 확인되지 않았어요.
```

##### caution

```text
주의 필요
설정한 알레르기 성분이 혼입 가능 또는 주의 성분으로 표시되어 있어요.
```

##### avoid

```text
피해야 함
설정한 알레르기 성분이 포함되어 있어요.
```

##### unknown

```text
정보 없음
이 메뉴의 알레르기 정보가 아직 확인되지 않았어요.
```

#### 매칭 성분

사용자가 설정한 성분 중 해당 메뉴와 매칭된 성분을 표시한다.

예시:

```text
우유
대두
밀
```

#### 전체 공시 성분

해당 메뉴에 포함된 전체 공시 성분을 표시한다.

```text
난류
우유
대두
밀
닭고기
```

#### 주의 가능 성분

`may_contain` 값이 있는 경우 표시한다.

```text
같은 조리시설에서 우유, 계란 포함 제품을 취급할 수 있어요.
```

#### 출처 정보

```text
출처: 브랜드 공식 알레르기 정보
마지막 확인일: 2026.06.28
```

#### 하단 고정 주의 문구

```text
공시 정보 기준의 참고 결과입니다. 중증 알레르기는 주문 전 확인이 필요해요.
```

### 기능 요구사항

- 메뉴 기본 정보 조회
- 브랜드 정보 조회
- 메뉴 알레르기 정보 조회
- 사용자 선택 성분과 매칭된 성분 표시
- 전체 공시 성분 표시
- 출처 URL 표시
- 마지막 확인일 표시
- 뒤로가기 지원

---

## 7.6 알레르기 설정 화면

### 목적

사용자가 언제든지 자신의 알레르기 성분을 수정할 수 있도록 한다.

### URL

```text
/settings/allergies
```

### 화면 구성

```text
내 알레르기 성분
피해야 하는 성분을 선택해주세요.
```

성분 체크 리스트:

- 계란
- 우유·유제품
- 메밀
- 땅콩
- 대두·콩
- 밀·글루텐
- 고등어
- 게
- 새우
- 돼지고기
- 복숭아
- 토마토
- 아황산류
- 호두·견과류
- 닭고기
- 소고기
- 오징어
- 조개류

CTA:

```text
저장하기
```

### 기능 요구사항

- 현재 선택된 성분을 불러온다.
- 성분을 추가/삭제할 수 있다.
- 저장 후 이전 화면 또는 홈으로 이동한다.
- MVP에서는 비로그인 사용자를 기준으로 localStorage에 저장한다.
- 로그인 사용자의 Supabase `user_allergens` 저장은 2차 개발 범위로 둔다.

---

## 8. 데이터베이스 설계

DB는 Supabase PostgreSQL을 사용한다.

### 8.1 categories

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

초기 데이터:

```text
chicken / 치킨
pizza / 피자
```

### 8.2 brands

```sql
create table brands (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  slug text unique not null,
  name text not null,
  logo_url text,
  official_url text,
  allergen_source_url text,
  data_status text default 'unverified',
  last_checked_at date,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

`data_status` 값:

```text
official_verified
pdf_verified
delivery_app_checked
user_reported
unverified
no_data
```

### 8.3 allergens

```sql
create table allergens (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  display_name text not null,
  description text,
  display_order int default 0,
  is_active boolean default true
);
```

### 8.4 menus

```sql
create table menus (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  category_id uuid references categories(id),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  menu_status text default 'active',
  source_url text,
  last_checked_at date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

`menu_status` 값:

```text
active
seasonal
discontinued
unknown
```

### 8.5 menu_allergens

```sql
create table menu_allergens (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid references menus(id) on delete cascade,
  allergen_id uuid references allergens(id),
  presence_type text not null,
  note text,
  created_at timestamptz default now(),
  unique(menu_id, allergen_id, presence_type)
);
```

`presence_type` 값:

```text
contains
may_contain
unknown
```

### 8.6 profiles

MVP에서는 로그인 필수는 아니지만, Supabase Auth 확장을 고려해 테이블을 준비한다.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 8.7 user_allergens

```sql
create table user_allergens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  allergen_id uuid references allergens(id),
  created_at timestamptz default now(),
  unique(user_id, allergen_id)
);
```

### 8.8 menu_with_brand View

카테고리 상세, 검색, 브랜드 상세에서 사용할 기본 View.

```sql
create view menu_with_brand as
select
  m.id as menu_id,
  m.name as menu_name,
  m.slug as menu_slug,
  m.image_url,
  m.category_id,
  m.brand_id,
  b.name as brand_name,
  b.slug as brand_slug,
  b.logo_url,
  b.data_status as brand_data_status,
  b.allergen_source_url,
  coalesce(m.last_checked_at, b.last_checked_at) as last_checked_at
from menus m
join brands b on m.brand_id = b.id
where m.is_active = true
  and b.is_active = true;
```

---

## 9. Row Level Security 정책

### 9.1 Public Read

MVP에서는 카테고리, 브랜드, 메뉴, 알레르기 정보는 공개 읽기가 가능해야 한다.

대상 테이블:

- categories
- brands
- allergens
- menus
- menu_allergens

정책 예시:

```sql
alter table categories enable row level security;
alter table brands enable row level security;
alter table allergens enable row level security;
alter table menus enable row level security;
alter table menu_allergens enable row level security;

create policy "Public categories are readable"
on categories for select
using (is_active = true);

create policy "Public brands are readable"
on brands for select
using (is_active = true);

create policy "Public allergens are readable"
on allergens for select
using (is_active = true);

create policy "Public menus are readable"
on menus for select
using (is_active = true);

create policy "Public menu allergens are readable"
on menu_allergens for select
using (true);
```

### 9.2 User Allergy Policy

사용자는 본인의 알레르기 정보만 읽고 수정할 수 있어야 한다.

```sql
alter table user_allergens enable row level security;

create policy "Users can read own allergens"
on user_allergens for select
using (auth.uid() = user_id);

create policy "Users can insert own allergens"
on user_allergens for insert
with check (auth.uid() = user_id);

create policy "Users can delete own allergens"
on user_allergens for delete
using (auth.uid() = user_id);
```

---

## 10. 프론트엔드 개발 스펙

### 10.1 기술 스택

```text
Vite
React
TypeScript
React Router
Supabase JS Client
Capacitor
Vercel
```

스타일링은 AllerFit 내부 디자인 시스템과 디자인 토큰을 구성해 적용한다.

```text
Design Tokens
Internal Component System
Pretendard
```

### 10.2 폴더 구조

```text
src/
  app/
    App.tsx
    router.tsx
  components/
    layout/
    cards/
    filters/
    search/
    badges/
  features/
    onboarding/
    home/
    categories/
    brands/
    menus/
    allergies/
  lib/
    supabase.ts
    safety.ts
    storage.ts
  design-system/
    tokens.ts
    components.ts
  types/
    database.ts
    allergen.ts
    menu.ts
  constants/
    status.ts
  styles/
```

### 10.3 주요 컴포넌트

#### Layout

- `AppLayout`
- `BottomNavigation`
- `PageHeader`

#### Card

- `CategoryCard`
- `MenuCard`
- `BrandSummaryCard`
- `SafetySummaryCard`

#### Filter

- `StatusFilterChips`
- `AllergenSelector`

#### Badge

- `SafetyStatusBadge`
- `DataStatusBadge`
- `AllergenBadge`

#### Search

- `CategorySearchInput`
- `EmptySearchResult`

### 10.4 상태 관리

MVP에서는 별도 상태관리 라이브러리 없이 React state와 custom hook으로 처리한다.

필요한 hook:

```text
useAllergens
useUserAllergens
useCategories
useCategoryMenus
useBrandMenus
useMenuDetail
useMenuSafety
```

### 10.5 localStorage Key

MVP에서는 비로그인 사용자를 기본으로 하며 localStorage를 사용한다.

```text
allerfit_onboarding_completed
allerfit_selected_allergen_codes
```

---

## 11. 주요 함수 스펙

### 11.1 getMenuSafetyStatus

```ts
export type PresenceType = 'contains' | 'may_contain' | 'unknown';

export type SafetyStatus =
  | 'safe_by_public_info'
  | 'caution'
  | 'avoid'
  | 'unknown';

export interface MenuAllergenItem {
  allergen_id: string;
  allergen_code: string;
  allergen_name: string;
  allergen_display_name: string;
  presence_type: PresenceType;
  note?: string | null;
}

export interface MenuSafetyResult {
  status: SafetyStatus;
  matchedAllergens: MenuAllergenItem[];
  containsAllergens: MenuAllergenItem[];
  mayContainAllergens: MenuAllergenItem[];
}

export function getMenuSafetyStatus(
  menuAllergens: MenuAllergenItem[],
  userAllergenIds: string[]
): MenuSafetyResult {
  const containsAllergens = menuAllergens.filter(
    item => item.presence_type === 'contains'
  );

  const mayContainAllergens = menuAllergens.filter(
    item => item.presence_type === 'may_contain'
  );

  const matchedContains = containsAllergens.filter(item =>
    userAllergenIds.includes(item.allergen_id)
  );

  if (matchedContains.length > 0) {
    return {
      status: 'avoid',
      matchedAllergens: matchedContains,
      containsAllergens,
      mayContainAllergens,
    };
  }

  const matchedMayContain = mayContainAllergens.filter(item =>
    userAllergenIds.includes(item.allergen_id)
  );

  if (matchedMayContain.length > 0) {
    return {
      status: 'caution',
      matchedAllergens: matchedMayContain,
      containsAllergens,
      mayContainAllergens,
    };
  }

  if (menuAllergens.length === 0) {
    return {
      status: 'unknown',
      matchedAllergens: [],
      containsAllergens: [],
      mayContainAllergens: [],
    };
  }

  return {
    status: 'safe_by_public_info',
    matchedAllergens: [],
    containsAllergens,
    mayContainAllergens,
  };
}
```

### 11.2 getSafetyLabel

```ts
export function getSafetyLabel(status: SafetyStatus): string {
  switch (status) {
    case 'safe_by_public_info':
      return '공시 기준 선택 성분 없음';
    case 'caution':
      return '주의 필요';
    case 'avoid':
      return '피해야 함';
    case 'unknown':
      return '정보 없음';
    default:
      return '정보 없음';
  }
}
```

### 11.3 getSafetyDescription

```ts
export function getSafetyDescription(status: SafetyStatus): string {
  switch (status) {
    case 'safe_by_public_info':
      return '설정한 알레르기 성분은 공개 정보상 확인되지 않았어요.';
    case 'caution':
      return '설정한 알레르기 성분이 혼입 가능 또는 주의 성분으로 표시되어 있어요.';
    case 'avoid':
      return '설정한 알레르기 성분이 포함되어 있어요.';
    case 'unknown':
      return '이 메뉴의 알레르기 정보가 아직 확인되지 않았어요.';
    default:
      return '이 메뉴의 알레르기 정보가 아직 확인되지 않았어요.';
  }
}
```

---

## 12. Supabase Query 예시

### 12.1 카테고리 목록

```ts
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order');
```

### 12.2 카테고리 상세 메뉴 목록

```ts
const { data, error } = await supabase
  .from('menu_with_brand')
  .select('*')
  .eq('category_id', categoryId)
  .order('brand_name')
  .order('menu_name');
```

### 12.3 카테고리 내 검색

```ts
const { data, error } = await supabase
  .from('menu_with_brand')
  .select('*')
  .eq('category_id', categoryId)
  .or(`menu_name.ilike.%${keyword}%,brand_name.ilike.%${keyword}%`);
```

주의: 사용자 입력 keyword는 escape 또는 sanitize 처리를 고려한다.

### 12.4 브랜드 상세

```ts
const { data: brand, error: brandError } = await supabase
  .from('brands')
  .select('*, categories(*)')
  .eq('slug', brandSlug)
  .single();
```

```ts
const { data: menus, error: menuError } = await supabase
  .from('menu_with_brand')
  .select('*')
  .eq('brand_slug', brandSlug)
  .order('menu_name');
```

### 12.5 메뉴 상세

```ts
const { data: menu, error: menuError } = await supabase
  .from('menus')
  .select('*, brands(*), categories(*)')
  .eq('slug', menuSlug)
  .single();
```

```ts
const { data: allergens, error: allergenError } = await supabase
  .from('menu_allergens')
  .select(`
    presence_type,
    note,
    allergens (
      id,
      code,
      name,
      display_name
    )
  `)
  .eq('menu_id', menu.id);
```

---

## 13. Seed 데이터

### 13.1 categories seed

```sql
insert into categories (slug, name, display_order) values
('chicken', '치킨', 1),
('pizza', '피자', 2);
```

### 13.2 allergens seed

```sql
insert into allergens (code, name, display_name, display_order) values
('egg', '난류', '계란', 1),
('milk', '우유', '우유·유제품', 2),
('buckwheat', '메밀', '메밀', 3),
('peanut', '땅콩', '땅콩', 4),
('soybean', '대두', '대두·콩', 5),
('wheat', '밀', '밀·글루텐', 6),
('mackerel', '고등어', '고등어', 7),
('crab', '게', '게', 8),
('shrimp', '새우', '새우', 9),
('pork', '돼지고기', '돼지고기', 10),
('peach', '복숭아', '복숭아', 11),
('tomato', '토마토', '토마토', 12),
('sulfite', '아황산류', '아황산류', 13),
('walnut', '호두', '호두·견과류', 14),
('chicken', '닭고기', '닭고기', 15),
('beef', '쇠고기', '소고기', 16),
('squid', '오징어', '오징어', 17),
('shellfish', '조개류', '조개류', 18);
```

### 13.3 placeholder brands seed

실제 브랜드 확정 전 개발용 seed.

```sql
-- chicken placeholders
insert into brands (category_id, slug, name, data_status, display_order)
select c.id, 'chicken-brand-01', '치킨 브랜드 01', 'unverified', 1 from categories c where c.slug = 'chicken';

-- 실제 개발 시 10개까지 반복 생성

-- pizza placeholders
insert into brands (category_id, slug, name, data_status, display_order)
select c.id, 'pizza-brand-01', '피자 브랜드 01', 'unverified', 1 from categories c where c.slug = 'pizza';

-- 실제 개발 시 10개까지 반복 생성
```

---

## 14. 데이터 입력 정책

### 14.1 메뉴 데이터 필수 필드

메뉴 등록 시 필수로 입력해야 하는 값:

- category_id
- brand_id
- slug
- name
- menu_status
- last_checked_at

권장 입력값:

- source_url
- image_url
- description

### 14.2 알레르기 데이터 필수 필드

메뉴별 알레르기 성분 등록 시 필수값:

- menu_id
- allergen_id
- presence_type

선택값:

- note

### 14.3 출처 관리

출처는 브랜드 단위와 메뉴 단위 모두에서 관리 가능하게 한다.

- 브랜드 공통 출처: `brands.allergen_source_url`
- 메뉴별 상세 출처: `menus.source_url`

메뉴별 출처가 있으면 메뉴 출처를 우선 표시한다. 메뉴별 출처가 없으면 브랜드 출처를 표시한다.

---

## 15. UI 문구 가이드

### 15.1 상태 문구

| status | badge | 설명 |
|---|---|---|
| safe_by_public_info | 공시 기준 선택 성분 없음 | 설정한 알레르기 성분은 공개 정보상 확인되지 않았어요. |
| caution | 주의 필요 | 혼입 가능성 또는 정보 불완전성이 있어요. |
| avoid | 피해야 함 | 설정한 알레르기 성분이 포함되어 있어요. |
| unknown | 정보 없음 | 알레르기 정보가 아직 확인되지 않았어요. |

### 15.2 공통 주의 문구

긴 버전:

```text
본 서비스는 각 브랜드가 공개한 알레르기 유발 성분 정보를 기준으로 메뉴를 분류합니다. 원재료 변경, 매장별 조리 환경, 교차오염 가능성에 따라 실제 정보와 다를 수 있습니다. 중증 알레르기가 있는 경우 주문 전 매장 또는 브랜드 고객센터에 반드시 확인해주세요.
```

짧은 버전:

```text
공시 정보 기준의 참고 결과입니다. 중증 알레르기는 주문 전 확인이 필요해요.
```

### 15.3 빈 상태 문구

#### 알레르기 미설정

```text
알레르기 선택이 필요합니다.
내 알레르기를 선택하면 먹을 수 있는 메뉴를 보여드릴게요.
```

#### 검색 결과 없음

```text
검색 결과가 없어요.
다른 메뉴명이나 브랜드명으로 검색해보세요.
```

#### 데이터 없음

```text
아직 등록된 메뉴 정보가 없어요.
브랜드 데이터가 업데이트되면 확인할 수 있어요.
```

---

## 16. 디자인 방향

### 16.1 톤앤매너

- 신뢰감
- 쉬운 표현
- 부모 친화적
- 건강/의료앱처럼 과하게 딱딱하지 않게
- 배달 메뉴 선택 전 빠르게 확인할 수 있는 실용성 중심

### 16.2 UX 원칙

- 사용자는 브랜드보다 “먹을 수 있는 메뉴”를 먼저 보고 싶어 한다.
- 카테고리 상세에서 가능한 메뉴를 바로 보여준다.
- 위험한 메뉴는 명확히 표시한다.
- 알레르기 앱 특성상 과도한 확신 표현을 피한다.
- 데이터 출처와 확인일을 항상 표시한다.

### 16.3 상태별 색상 방향

상태 색상은 디자인 토큰의 semantic palette를 사용한다.

```text
safe_by_public_info: positive 계열
caution: warning 계열
avoid: negative 계열
unknown: mute / gray 계열
```

단, 색상만으로 상태를 구분하지 않고 텍스트 배지를 함께 제공한다.

### 16.4 AllerFit 디자인 시스템

AllerFit은 첨부 디자인 시스템을 기준으로 하되, Wise 고유 명칭과 전용 서체는 사용하지 않고 AllerFit 토큰으로 재정의한다. 한글/영문 모두 Pretendard를 기본 폰트로 사용한다.

#### 색상 토큰

```text
colors.primary: #9fe870
colors.primary-active: #cdffad
colors.primary-neutral: #c5edab
colors.primary-pale: #e2f6d5

colors.canvas: #ffffff
colors.canvas-soft: #e8ebe6

colors.ink: #0e0f0c
colors.ink-deep: #163300
colors.body: #454745
colors.mute: #868685

colors.positive: #2ead4b
colors.positive-deep: #054d28
colors.warning: #ffd11a
colors.warning-deep: #b86700
colors.warning-content: #4a3b1c
colors.negative: #d03238
colors.negative-deep: #a72027
colors.negative-darkest: #a7000d
colors.negative-bg: #320707

gradients.app-background:
radial-gradient(circle at 18% 0%, rgb(159 232 112 / 42%) 0%, transparent 34%),
radial-gradient(circle at 96% 12%, rgb(255 219 230 / 70%) 0%, transparent 28%),
linear-gradient(180deg, #f8faf5 0%, #e8ebe6 42%, #f4f1f3 100%)

gradients.app-background-overlay:
radial-gradient(circle at 78% 36%, rgb(159 232 112 / 22%) 0%, transparent 26%),
radial-gradient(circle at 14% 72%, rgb(255 244 249 / 86%) 0%, transparent 30%)
```

#### 타이포그래피

```text
font.family: Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif

typography.display-xl: 64px / 1.05 / 700
typography.display-lg: 47px / 1.2 / 700
typography.display-md: 40px / 1.15 / 700
typography.display-sm: 32px / 1.2 / 600
typography.display-xs: 24px / 1.3 / 600
typography.body-lg: 20px / 1.5 / 400
typography.body-md: 16px / 1.5 / 400
typography.body-md-strong: 16px / 1.5 / 600
typography.body-sm: 14px / 1.43 / 400
typography.body-sm-strong: 14px / 1.43 / 500
typography.caption: 12px / 1.33 / 400
typography.button-md: 16px / 1.5 / 600
```

font-weight는 최대 700까지만 사용한다. Hero와 주요 섹션 타이틀은 Pretendard 700을 사용한다. 주요 버튼과 강한 UI 강조는 600, 보조 라벨과 작은 강조는 500, 본문은 400을 사용한다. 800, 900 weight는 사용하지 않는다. letter-spacing은 기본 0으로 둔다.

#### 간격과 형태

```text
spacing.xxs: 2px
spacing.xs: 4px
spacing.sm: 8px
spacing.md: 12px
spacing.lg: 16px
spacing.xl: 24px
spacing.2xl: 32px
spacing.3xl: 48px

rounded.sm: 8px
rounded.md: 12px
rounded.lg: 16px
rounded.xl: 24px
rounded.pill: 9999px
rounded.full: 9999px
```

카드와 주요 버튼은 `rounded.xl` 24px을 기본으로 한다. 작은 배지와 상태 칩은 `rounded.pill`을 사용한다. 기본 touch target은 48px 이상으로 설계한다.

#### 반응형 레이아웃

```text
mobile: < 768px
tablet: 768px - 1119px
desktop: >= 1120px
```

- 모바일에서는 주요 콘텐츠를 16px 좌우 padding 안에 배치한다.
- 태블릿에서는 콘텐츠 컨테이너를 최대 960px로 확장한다.
- 데스크톱에서는 콘텐츠 컨테이너를 최대 1180px로 확장한다.
- 카테고리 상세 메뉴 카드 그리드는 mobile 2열, tablet 3열, desktop 4열을 기본으로 한다.
- Hero section은 모든 breakpoint에서 카드 형태가 아니며 별도 배경, 테두리, 그림자를 사용하지 않는다.

#### 표면과 깊이

- 페이지 기본 배경은 `colors.canvas-soft`를 사용한다.
- 카드와 입력 영역은 `colors.canvas`를 사용한다.
- 기본 카드는 shadow보다 표면 대비로 구분한다.
- 입력, 검색창, 보조 버튼에는 필요 시 1px `colors.ink` border를 사용한다.

#### 주요 컴포넌트 규칙

- Primary Button: `colors.primary` 배경, `colors.ink` 텍스트, `rounded.xl`, 48px 이상 높이.
- Secondary Button: `colors.canvas-soft` 배경, `colors.ink` 텍스트, `rounded.xl`.
- Tertiary Button: `colors.canvas` 배경, `colors.ink` 텍스트, 1px `colors.ink` border.
- Content Card: `colors.canvas` 배경, `rounded.xl`, `spacing.xl` padding.
- Feature Card: `colors.primary-pale` 또는 `colors.canvas-soft` 배경, `rounded.xl`.
- Text Input/Search Input: `colors.canvas` 배경, 1px `colors.ink` border, `rounded.md`.
- Safety Badge: positive/warning/negative/mute semantic token을 사용하고 항상 텍스트 라벨을 함께 표시한다.

#### 사용 원칙

- `colors.primary`는 브랜드 CTA와 핵심 액션에 우선 사용한다.
- `colors.primary`를 성공 상태 색상으로 남용하지 않는다. 안전 상태는 semantic positive 계열을 사용한다.
- CTA는 날카로운 사각형으로 만들지 않는다.
- 초록 CTA 위에 다시 초록 배경을 겹치지 않는다.
- 화면은 `canvas-soft` 배경과 흰색 카드 대비를 기본 구조로 삼는다.

---

## 17. Capacitor 적용 스펙

### 17.1 기본 방향

웹앱을 먼저 완성한 뒤 Capacitor로 iOS/Android 앱을 패키징한다.

### 17.2 초기 필요 플러그인

MVP 기준 필수 플러그인은 많지 않다.

```text
@capacitor/core
@capacitor/cli
@capacitor/ios
@capacitor/android
```

선택 플러그인:

```text
@capacitor/preferences
@capacitor/splash-screen
@capacitor/status-bar
```

### 17.3 저장소 정책

웹에서는 localStorage를 사용한다. Capacitor 앱에서는 추후 `Preferences`로 대체 가능하다.

MVP에서는 웹과 앱 동일 코드 유지를 위해 localStorage부터 사용한다.

---

## 18. Vercel 배포 스펙

### 18.1 환경변수

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### 18.2 배포 브랜치

```text
main: production
preview/* 또는 develop: preview
```

### 18.3 빌드 명령

```text
npm run build
```

### 18.4 출력 디렉토리

```text
dist
```

---

## 19. 에러 처리 정책

### 19.1 데이터 로딩 실패

```text
메뉴 정보를 불러오지 못했어요.
잠시 후 다시 시도해주세요.
```

### 19.2 Supabase 연결 실패

```text
서비스 연결이 원활하지 않아요.
네트워크 상태를 확인해주세요.
```

### 19.3 메뉴 상세 없음

```text
메뉴 정보를 찾을 수 없어요.
삭제되었거나 아직 등록되지 않은 메뉴일 수 있어요.
```

### 19.4 브랜드 상세 없음

```text
브랜드 정보를 찾을 수 없어요.
```

---

## 20. QA 체크리스트

### 20.1 온보딩

- [ ] 최초 접속 시 온보딩이 노출되는가
- [ ] 성분 복수 선택이 가능한가
- [ ] 성분 선택 없이 넘어갈 수 있는가
- [ ] 완료 후 홈으로 이동하는가
- [ ] 선택 성분이 저장되는가

### 20.2 홈

- [ ] 선택한 알레르기 성분이 상단에 표시되는가
- [ ] 치킨/피자 카테고리가 표시되는가
- [ ] 카테고리 클릭 시 상세로 이동하는가
- [ ] 추천 메뉴가 표시되는가
- [ ] 데이터가 없을 때 빈 상태가 표시되는가

### 20.3 카테고리 상세

- [ ] 해당 카테고리 메뉴만 표시되는가
- [ ] 사용자 알레르기 기준으로 상태가 계산되는가
- [ ] 알레르기 미선택 시 메뉴 카드 대신 선택 유도 상태가 표시되는가
- [ ] 알레르기 선택 시 먹을 수 있는 메뉴 카드가 표시되는가
- [ ] 메뉴 카드가 브랜드 로고/브랜드명/메뉴명만 표시하는가
- [ ] 브랜드명 검색이 동작하는가
- [ ] 메뉴명 검색이 동작하는가
- [ ] 검색 결과 없음 상태가 표시되는가
- [ ] 카드 클릭 시 메뉴 상세로 이동하는가
- [ ] 화면 하단에 최종 업데이트일이 표시되는가

### 20.4 브랜드 상세

- [ ] 브랜드 정보가 표시되는가
- [ ] 메뉴 상태별 개수가 계산되는가
- [ ] 브랜드 내 검색이 동작하는가
- [ ] 메뉴 카드 클릭 시 메뉴 상세로 이동하는가
- [ ] 출처 URL이 표시되는가

### 20.5 메뉴 상세

- [ ] 메뉴명과 브랜드명이 표시되는가
- [ ] 상태 결과 박스가 표시되는가
- [ ] 매칭 성분이 표시되는가
- [ ] 전체 공시 성분이 표시되는가
- [ ] may_contain 성분이 별도 표시되는가
- [ ] 마지막 확인일이 표시되는가
- [ ] 주의 문구가 표시되는가

### 20.6 알레르기 설정

- [ ] 기존 선택 성분이 체크되어 있는가
- [ ] 성분 추가/삭제가 가능한가
- [ ] 저장 후 다른 화면에 반영되는가

---

## 21. Codex 개발 지시용 요약

Codex에서 개발을 시작할 때 아래 순서로 진행한다.

### Step 1. 프로젝트 생성

```text
Vite React TypeScript 프로젝트를 생성한다.
React Router를 설정한다.
Supabase client를 설정한다.
기본 레이아웃과 라우트를 만든다.
```

### Step 2. Supabase 스키마 생성

```text
categories, brands, allergens, menus, menu_allergens, profiles, user_allergens 테이블을 생성한다.
menu_with_brand view를 생성한다.
RLS 정책을 설정한다.
```

### Step 3. Seed 데이터 입력

```text
치킨/피자 카테고리를 입력한다.
알레르기 성분 18개를 입력한다.
개발용 placeholder 브랜드와 메뉴 데이터를 입력한다.
```

### Step 4. 핵심 로직 구현

```text
getMenuSafetyStatus 함수를 구현한다.
상태별 라벨/설명 함수를 구현한다.
사용자 선택 알레르기 저장/조회 hook을 구현한다.
```

### Step 5. 화면 구현

```text
온보딩
홈
카테고리 상세
브랜드 상세
메뉴 상세
알레르기 설정
순서로 구현한다.
```

### Step 6. 검색/필터 구현

```text
카테고리 상세에서 브랜드명/메뉴명 검색을 구현한다.
상태 필터 칩을 구현한다.
브랜드 상세 내 검색을 구현한다.
```

### Step 7. Capacitor 연결

```text
웹앱 기능이 안정화된 후 Capacitor를 설치한다.
iOS/Android 프로젝트를 추가한다.
스플래시/상태바 등 기본 앱 설정을 적용한다.
```

---

## 22. 향후 확장 설계

### 22.1 가족 구성원별 알레르기

추후 아래 테이블을 추가한다.

```sql
create table family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  relation text,
  created_at timestamptz default now()
);
```

```sql
create table family_member_allergens (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid references family_members(id) on delete cascade,
  allergen_id uuid references allergens(id),
  unique(family_member_id, allergen_id)
);
```

### 22.2 관리자 페이지

추후 관리자 페이지에서 아래 기능을 제공한다.

- 브랜드 등록/수정
- 메뉴 등록/수정
- 메뉴별 알레르기 성분 등록
- 출처 URL 관리
- 마지막 확인일 관리
- 데이터 상태 변경
- 사용자 제보 검수

### 22.3 브랜드 제휴 페이지

브랜드가 직접 메뉴와 알레르기 정보를 업데이트할 수 있는 브랜드 포털을 제공할 수 있다.

---

## 23. 최종 MVP 성공 기준

MVP가 성공했다고 판단할 수 있는 기준은 아래와 같다.

- 사용자가 알레르기 성분을 설정할 수 있다.
- 사용자가 치킨/피자 카테고리에서 먹을 수 있는 메뉴를 확인할 수 있다.
- 메뉴 상태가 포함 성분 기준으로 정확하게 분류된다.
- 검색을 통해 특정 브랜드나 메뉴를 찾을 수 있다.
- 메뉴 상세에서 판정 근거와 출처를 확인할 수 있다.
- 주의 문구가 명확하게 표시된다.
- 브랜드 확정 후 데이터만 교체해도 서비스가 동작한다.

---

## 24. 개발 시 중요한 원칙

1. 브랜드명과 메뉴명은 하드코딩하지 않는다.
2. 모든 브랜드/메뉴/알레르기 데이터는 Supabase에서 관리한다.
3. 메뉴 안전도는 서버 저장값이 아니라 사용자 알레르기 기준으로 동적으로 계산한다.
4. `safe`라는 표현은 내부 코드에서만 사용하고 사용자에게는 `공시 기준 선택 성분 없음`으로 표시한다.
5. 메뉴 상세에는 출처와 마지막 확인일을 반드시 표시한다.
6. 데이터가 없거나 불완전한 경우 무리하게 먹을 수 있음으로 분류하지 않는다.
7. MVP에서는 자동 크롤링보다 정확한 수동/반자동 데이터 입력을 우선한다.
8. 앱 패키징보다 웹앱 기능 완성을 먼저 진행한다.
