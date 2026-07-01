import { X } from "lucide-react";
import { useEffect } from "react";
import { MenuDetailContent } from "./MenuDetailContent";

interface MenuDetailSheetProps {
  menuSlug: string | null;
  onClose: () => void;
}

export function MenuDetailSheet({ menuSlug, onClose }: MenuDetailSheetProps) {
  const isOpen = Boolean(menuSlug);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!menuSlug) {
    return null;
  }

  return (
    <div className="bottom-sheet" role="presentation">
      <button
        className="bottom-sheet__backdrop"
        type="button"
        aria-label="메뉴 상세 닫기"
        onClick={onClose}
      />
      <section
        className="bottom-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label="메뉴 상세"
      >
        <div className="bottom-sheet__header">
          <span className="bottom-sheet__handle" aria-hidden="true" />
          <button
            className="icon-button"
            type="button"
            aria-label="닫기"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <div className="bottom-sheet__body">
          <MenuDetailContent menuSlug={menuSlug} />
        </div>
      </section>
    </div>
  );
}
