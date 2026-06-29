import { ChevronLeft, Settings, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppTopBarProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  action?: 'settings' | 'share' | 'skip';
}

export function AppTopBar({
  title,
  showBack = false,
  showLogo = false,
  action,
}: AppTopBarProps) {
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
        ) : null}
      </div>
      {showLogo ? (
        <p className="brand-mark brand-mark--top">
          <span>A</span> AllerFit
        </p>
      ) : (
        <strong>{title}</strong>
      )}
      <div className="app-top-bar__side app-top-bar__side--right">
        {action === 'settings' ? (
          <button className="icon-button" type="button" aria-label="설정">
            <Settings aria-hidden="true" size={19} />
          </button>
        ) : null}
        {action === 'share' ? (
          <button className="icon-button" type="button" aria-label="공유">
            <Share2 aria-hidden="true" size={19} />
          </button>
        ) : null}
        {action === 'skip' ? <span className="top-text-action">건너뛰기</span> : null}
      </div>
    </header>
  );
}
