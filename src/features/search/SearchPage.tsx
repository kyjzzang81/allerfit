import { Search } from 'lucide-react';

export function SearchPage() {
  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">검색</p>
        <h1>브랜드나 메뉴를 찾아보세요.</h1>
      </div>

      <label className="search-box">
        <Search aria-hidden="true" size={22} />
        <input placeholder="메뉴명 또는 브랜드명으로 검색" type="search" />
      </label>

      <div className="content-card empty-card">
        <strong>데이터 연결 전이에요.</strong>
        <p>Supabase seed가 준비되면 검색 결과가 이곳에 표시됩니다.</p>
      </div>
    </section>
  );
}
