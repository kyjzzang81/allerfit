# Menu Import Runbook

이 문서는 브랜드별 메뉴, 이미지, 알레르기 정보를 수집하고 Supabase에 반영하는 절차를 기록한다. 새 브랜드를 추가하거나 기존 브랜드 데이터를 갱신할 때 이 파일도 함께 업데이트한다.

## 공통 원칙

- 원본 데이터는 `datas/menu_{brand}.json`에 저장한다.
- 로컬 이미지는 `public/assets/menus/{brand-slug}/{englishName}.png`에 저장한다.
- Supabase Storage는 `menus/{brand-slug}/{englishName}.png` 경로를 사용한다.
- Storage bucket `menus`가 private이면 importer에서 장기 signed URL을 만들어 `menus.image_url`에 저장한다.
- Supabase import는 service role key로 실행한다. 현재 로컬 환경에서는 `.env.local`의 `VITE_SUPABASE_SERVICE_ROLE_KEY`를 importer가 읽는다.
- DB 반영 후 브랜드는 `brands.data_status = official_verified`, `brands.last_checked_at = YYYY-MM-DD`로 갱신한다.
- 메뉴 알레르기 정보는 `menu_allergens`에 `presence_type = contains`로 넣는다.
- 원산지 텍스트가 있으면 `menu_origins`에 저장한다.
- 메뉴 타입은 `menus.menu_type`에 저장한다. `1=주메뉴`, `2=주메뉴는 아니지만 사이드도 아닌 메뉴`, `3=사이드메뉴`다.
- 브랜드별 importer를 다시 실행하면 해당 브랜드의 공식 수집 대상 메뉴를 갱신하고, 필요하면 오래된 메뉴를 비활성화한다.

## 실행 전 체크리스트

1. `.env.local`에 Supabase URL과 service role key가 있는지 확인한다.
2. Supabase Storage bucket `menus`가 있는지 확인한다.
3. 브랜드 row와 카테고리 row가 있는지 확인한다. importer에 upsert가 있으면 브랜드는 자동 생성 가능하다.
4. 수집 대상 공식 페이지가 변경되지 않았는지 브라우저나 간단한 fetch로 확인한다.
5. import 후 `npm run build`로 타입과 빌드를 확인한다.

## 공통 검증

브랜드별 import 후 아래 항목을 확인한다.

- `datas/menu_{brand}.json` 레코드 수
- JSON에서 `localImagePath` 누락 여부
- JSON에서 `allergy` 또는 `allergens` 누락 여부
- Supabase `menus` 활성 메뉴 수
- 활성 메뉴 중 `image_url`이 있는 메뉴 수
- Supabase `menu_allergens` row 수
- Storage `menus/{brand-slug}` PNG 수
- `menu_type` 분포와 주메뉴/보조메뉴/사이드메뉴 정렬 상태

## BBQ

- 브랜드 slug: `bbq`
- 스크립트: `npm run import:bbq-menus`
- 데이터 파일: `datas/menu_bbq.json`
- 이미지 경로: `public/assets/menus/bbq`
- Storage 경로: `menus/bbq`
- 목록 URL:
  - `https://bbq.co.kr/categories/19`
  - `https://bbq.co.kr/categories/20`
  - `https://bbq.co.kr/categories/21`
  - `https://bbq.co.kr/categories/22`
- 상세 URL 패턴: `https://bbq.co.kr/products/{id}`
- 알레르기 위치: 상세 페이지의 `영양정보 보기` 레이어 팝업
- 특이사항:
  - 목록/상세는 BBQ 공식 페이지 데이터를 사용한다.
  - 이미지 URL을 내려받아 PNG로 변환한다.
  - 수집 당시 62개 메뉴, 343개 알레르기 row, 33개 원산지 row를 반영했다.

## 호식이두마리치킨

- 브랜드 slug: `hosigi`
- 스크립트: `npm run import:hosigi-menus`
- 데이터 파일: `datas/menu_hosigi.json`
- 이미지 경로: `public/assets/menus/hosigi`
- Storage 경로: `menus/hosigi`
- 목록 URL:
  - `https://www.9922.co.kr/chicken`
  - `https://www.9922.co.kr/side`
  - `https://www.9922.co.kr/parts`
- 알레르기 URL: `https://www.9922.co.kr/allergenic-component`
- 특이사항:
  - 메뉴 목록과 공식 알레르기 페이지를 매칭한다.
  - 수집 당시 목록 기준 35개 메뉴 이미지를 업로드했다.
  - 기존 DB 메뉴명 중 중복/기존 row가 있어 touched menu 수가 목록 수보다 클 수 있다.
  - 공식 알레르기 페이지에 없는 메뉴는 JSON에서 누락 여부를 확인해야 한다.

## 다사랑치킨

- 브랜드 slug: `dasarang`
- 스크립트: 없음
- 이미지 경로: 기존 Storage `menus/dasarang`
- 처리 방식:
  - Storage에 올라간 이미지 파일명을 기존 DB 메뉴와 매칭해 `menus.image_url`을 갱신했다.
  - 공식 페이지 재수집 importer는 아직 없다.
- 특이사항:
  - 수집 당시 19개 메뉴 중 18개 이미지가 매칭됐다.
  - 누락 이미지: `dasarang-boneless-gangjeong.png`
  - 누락 메뉴: `순살 닭강정`
- 다음 업데이트:
  - 공식 메뉴/알레르기 페이지를 새로 확인해서 importer를 별도로 만드는 것이 좋다.

## 도미노피자

- 브랜드 slug: `dominos`
- 스크립트: `npm run import:dominos-menus`
- 데이터 파일: `datas/menu_dominos.json`
- 이미지 경로: `public/assets/menus/dominos`
- Storage 경로: `menus/dominos`
- 목록 URL:
  - `https://web.dominos.co.kr/goods/list?dsp_ctgr=C0101`
  - `https://web.dominos.co.kr/goods/list?dsp_ctgr=C0201`
- 상세 API: `https://web.dominos.co.kr/goods/detailAjax?code_01={code}&dsp_ctgr={category}`
- 알레르기/원산지 URL: `https://web.dominos.co.kr/contents/ingredient`
- 특이사항:
  - 도미노 페이지는 EUC-KR 인코딩이므로 `TextDecoder('euc-kr')`로 읽는다.
  - 목록에서 `getDetailSlide('CODE','CATEGORY')` 또는 `code_01=...` 패턴으로 메뉴 코드를 추출한다.
  - 공식 ingredient 페이지의 표 caption으로 원산지, 알레르기, 영양성분 테이블을 구분한다.
  - 파일명은 상품 코드 기반 `dominos-{code}.png`를 사용한다.
  - 수집 당시 39개 메뉴, 이미지 39개, 알레르기 누락 0개로 반영했다.

## 피자헛

- 브랜드 slug: `pizzahut`
- 스크립트: `npm run import:pizzahut-menus`
- 데이터 파일: `datas/menu_pizzahut.json`
- 이미지 경로: `public/assets/menus/pizzahut`
- Storage 경로: `menus/pizzahut`
- 화면 URL:
  - `https://www.pizzahut.co.kr/menu/pizza/cheesefesta`
  - `https://www.pizzahut.co.kr/menu/pizza/premium`
  - `https://www.pizzahut.co.kr/menu/pizza/usoriginal`
  - `https://www.pizzahut.co.kr/menu/flatzz/flatzz`
  - `https://www.pizzahut.co.kr/menu/flatzz/pastahut`
  - `https://www.pizzahut.co.kr/menu/pastaandside`
- 주요 API:
  - `/api/menu/0996/list/cheesefesta/DELIVERY`
  - `/api/menu/0996/list/premium/DELIVERY`
  - `/api/menu/0996/list/usoriginal/DELIVERY`
  - `/api/menu/0996/list/npanflatzz`
  - `/api/menu/0996/list/pastaAndSide`
  - `/api/menu/nutritions`
- 특이사항:
  - 화면은 Angular SPA이고 실제 목록은 API에서 가져온다.
  - 테스트 매장 코드 `0996`으로 메뉴 목록 API가 응답한다.
  - 영양 API 응답 안에 `origin`, `allergy`가 같이 들어있다.
  - 영양 API는 한 메뉴에 여러 엣지 조합 row를 반환할 수 있으므로 알레르기/영양 값이 채워진 row를 우선 선택한다.
  - 이미지 URL은 API에 직접 없고 CDN 규칙으로 만든 뒤 HEAD로 검증한다.
  - 이미지 root: `https://akamai.pizzahut.co.kr/2020pizzahut-prod/public/img/menu`
  - 수집 당시 39개 메뉴를 활성화했고, 예전 CSV 기반 변형 메뉴 364개는 비활성화했다.
  - 수집 당시 최신 `한근 치즈` 4개는 메뉴/알레르기 데이터는 있었지만 CDN 이미지 후보가 404라 이미지 없이 반영됐다.

## 서오릉피자

- 브랜드 slug: `seooreung-pizza`
- 스크립트: `npm run import:seooreung-menus`
- 데이터 파일: `datas/menu_seooreung.json`
- 이미지 경로: `public/assets/menus/seooreung-pizza`
- Storage 경로: `menus/seooreung-pizza`
- 목록 URL:
  - `https://seooreungpizza.com/sub/menu/list.html?cate=1`
  - `https://seooreungpizza.com/sub/menu/list.html?cate=4`
- 상세 URL 패턴: `https://seooreungpizza.com/sub/menu/view.html?dataSeq={id}`
- 알레르기 위치: 상세 페이지의 `알레르기 표시 요약` 텍스트
- 특이사항:
  - 목록에서 `goView('{id}')`로 메뉴 ID를 얻고 같은 블록에서 메뉴명/이미지를 추출한다.
  - 상세 페이지에서 주요 토핑과 영양성분표도 텍스트로 확인 가능하다.
  - 수집 당시 20개 메뉴, 이미지 20개, 알레르기 누락 0개로 반영했다.

## BHC

- 브랜드 slug: `bhc`
- 스크립트: `npm run import:bhc-menus`
- 데이터 파일: `datas/menu_bhc.json`
- 이미지 경로: `public/assets/menus/bhc`
- Storage 경로: `menus/bhc`
- 화면 URL:
  - `https://www.bhc.co.kr/menu/1?cate=후라이드`
  - `https://www.bhc.co.kr/menu/1?cate=양념`
  - `https://www.bhc.co.kr/menu/1?cate=뿌링클`
  - `https://www.bhc.co.kr/menu/1?cate=킹`
  - `https://www.bhc.co.kr/menu/1?cate=핫`
  - `https://www.bhc.co.kr/menu/47?cate=콜팝`
  - `https://www.bhc.co.kr/menu/47?cate=제주동화마을한정`
  - `https://www.bhc.co.kr/menu/50?cate=사이드`
  - `https://www.bhc.co.kr/menu/50?cate=기타`
- 주요 API:
  - `/api/v1/web/categories/{categoryId}/products`
  - `/api/v1/web/products/{productCd}`
- 메뉴 타입:
  - `menu/1`의 지정 cate: `menu_type = 1`
  - `menu/47`의 지정 cate: `menu_type = 2`
  - `menu/50`의 지정 cate: `menu_type = 3`
- 알레르기 위치:
  - 화면 레이어 팝업에서는 `div.allergy` 영역에 표시된다.
  - importer는 상세 API의 `allergenInfo` 배열을 사용한다.
- 특이사항:
  - Next.js 화면에는 목록 카드가 SSR로 직접 들어있지 않고 API에서 로드된다.
  - 목록 API는 category 전체를 반환하므로 사용자가 지정한 `cateNm`만 필터링한다.
  - 상세 API에서 대표 이미지가 비어 있으면 첫 옵션 이미지를 사용한다.
  - 수집 당시 중복 제거 후 96개 메뉴, 이미지 96개, 알레르기 row 582개, 원산지 row 71개를 반영했다.
  - 수집 당시 `불고기피자`는 공식 상세 API의 알레르기 값이 비어 있어 알레르기 누락으로 남았다.

## 60계치킨

- 브랜드 slug: `60chicken`
- 스크립트: `npm run import:60chicken-menus`
- 데이터 파일: `datas/menu_60chicken.json`
- 이미지 경로: `public/assets/menus/60chicken`
- Storage 경로: `menus/60chicken`
- 목록 URL:
  - `https://www.60chicken.co.kr/bbs/content.php?co_id=menu`
- 알레르기 위치:
  - 메뉴 페이지 안의 `popup` 레이어 목록에 있는 `주요 알레르기 성분` 텍스트
- 특이사항:
  - 목록과 팝업이 같은 HTML 안에 순서대로 들어 있어, importer는 목록 항목과 팝업 항목을 index로 매칭한다.
  - 공식 페이지에 메뉴별 고유 ID가 없으므로 화면 순서 기반 `60chicken-001` 형식의 slug와 이미지 파일명을 사용한다.
  - 원본 이미지가 JPG/PNG 혼재라 로컬 저장 시 PNG로 변환한다.

## 교촌치킨

- 브랜드 slug: `kyochon`
- 스크립트: `npm run import:kyochon-menus`
- 데이터 파일: `datas/menu_kyochon.json`
- 이미지 경로: `public/assets/menus/kyochon`
- Storage 경로: `menus/kyochon`
- 목록 URL:
  - `https://kyochon.com/menu/chicken.asp`
- 상세 URL 패턴: `https://kyochon.com/menu/view.asp?id={id}&cg={cg}`
- 메뉴 타입:
  - `chicken.asp` 수집 메뉴 전체: `menu_type = 1`
- 알레르기 위치:
  - 메뉴 페이지에는 메뉴별 알레르기 텍스트가 직접 없으므로, 공식 알레르기 성분표 이미지를 수동 전사해 importer의 `ALLERGY_BY_NAME`에 매핑한다.
- 특이사항:
  - 목록 HTML에 메뉴 ID, 메뉴명, 이미지 URL이 SSR로 직접 들어있다.
  - `20PCS`, `16PCS`, `[S]` 같은 수량/소용량 표기는 알레르기 매칭 시 제거하고 기본 메뉴 성분을 상속한다.
  - 이미지 URL을 내려받아 PNG로 변환한다.
  - 수집 당시 67개 메뉴, 이미지 67개, 알레르기 row 273개를 반영했다.

## 굽네치킨

- 브랜드 slug: `goobne`
- 스크립트: `npm run import:goobne-menus`
- 데이터 파일: `datas/menu_goobne.json`
- 이미지 경로: `public/assets/menus/goobne`
- Storage 경로: `menus/goobne`
- 목록 URL:
  - `https://www.goobne.co.kr/menu/menu_list_p`
- 상세 URL 패턴: `https://www.goobne.co.kr/menu/menu_view_p?itemId={id}`
- 메뉴 타입:
  - 치킨/폭립/반반/스테이크류: `menu_type = 1`
  - 피자류: `menu_type = 2`
  - 사이드/소스/시즈닝류: `menu_type = 3`
- 알레르기 위치:
  - 메뉴 페이지에는 메뉴별 알레르기 텍스트가 직접 없으므로, 공식 영양성분 및 알레르기 유발물질 표 이미지를 수동 전사해 importer의 `ALLERGY_BY_NAME`에 매핑한다.
- 특이사항:
  - 목록 HTML에 메뉴 ID, 메뉴명, 이미지 URL이 SSR로 직접 들어있다.
  - 공식 카테고리 탭은 `classId` 파라미터를 쓰지만, 전체 목록을 수집한 뒤 이름 규칙으로 `menu_type`을 부여한다.
  - 이미지 URL을 내려받아 PNG로 변환한다.
  - 수집 당시 57개 메뉴, 이미지 57개, 알레르기 row 277개를 반영했다.
  - 수집 당시 `(토핑) 남해 구운마늘 (8알)`은 공식 성분표에 별도 알레르기 표기가 없어 알레르기 row 없이 반영했다.

## 새 브랜드 추가 절차

1. 목록 페이지에서 메뉴 ID, 메뉴명, 이미지 URL을 얻을 수 있는지 확인한다.
2. 상세 페이지나 공식 알레르기 페이지에서 알레르기 정보를 텍스트/API로 얻을 수 있는지 확인한다.
3. `scripts/import-{brand}-menus.mjs`를 추가한다.
4. `package.json`에 `import:{brand}-menus` 스크립트를 추가한다.
5. `datas/menu_{brand}.json` 구조를 기존 importer와 맞춘다.
6. 이미지는 PNG로 변환해 `public/assets/menus/{brand-slug}`에 저장한다.
7. Storage `menus/{brand-slug}`에 업로드한다.
8. Supabase `brands`, `menus`, `menu_allergens`, 필요 시 `menu_origins`, `data_sources`를 갱신한다.
9. importer에서 `menu_type`을 같이 넣는다.
10. 수집 결과와 브랜드별 특이사항을 이 문서에 추가한다.
11. `npm run build`를 실행해 타입/빌드 상태를 확인한다.

## 주의할 점

- 메뉴명만으로 기존 row를 매칭하면 같은 이름의 중복 row가 함께 업데이트될 수 있다. 브랜드별 source code가 안정적이면 slug나 source URL 기반 매칭을 우선 고려한다.
- 브랜드별 공식 페이지 구조가 자주 바뀔 수 있으므로 importer 실행 전 1-2개 샘플 URL을 확인한다.
- 알레르기명은 DB allergen code로 매핑해야 한다. 새 알레르기명이 나오면 importer의 `mapAllergenNameToCode`와 DB `allergens`를 함께 확인한다.
- 새 브랜드 importer를 만들 때 `scripts/menu-type.mjs`의 `getMenuType`을 사용한다. 브랜드 특성상 새 보조 메뉴군이 있으면 source category 규칙을 먼저 추가한다.
- private Storage signed URL은 만료 기간을 길게 잡고 있지만, 정책이 바뀌면 public URL 방식 또는 refresh 작업이 필요할 수 있다.
- 새로 공식 목록을 수집한 브랜드는 오래된 메뉴를 비활성화할지 여부를 브랜드별로 결정한다.
