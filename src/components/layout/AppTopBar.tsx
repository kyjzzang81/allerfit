import { ChevronLeft, Search, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppTopBarProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  action?: "settings" | "share" | "skip";
}

export function AppTopBar({ showBack = false }: AppTopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="app-top-bar">
      <div className="app-top-bar__side">
        {showBack ? (
          <button
            className="icon-button"
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft aria-hidden="true" size={21} />
          </button>
        ) : (
          <p className="brand-mark brand-mark--top">
            알러지 인류를 위해, <strong>알러핏</strong>
          </p>
        )}
      </div>

      <span className="app-top-bar__center-spacer" aria-hidden="true" />

      <div className="app-top-bar__side app-top-bar__side--right">
        <button
          className="icon-button"
          type="button"
          aria-label="검색"
          onClick={() => navigate("/search")}
        >
          <Search aria-hidden="true" size={19} />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="설정"
          onClick={() => navigate("/settings/allergies")}
        >
          <Settings aria-hidden="true" size={19} />
        </button>
      </div>
    </header>
  );
}
