import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Globe2 } from "lucide-react";
import PropTypes from "prop-types";
import { useLanguage } from "../../context/LanguageContext";

const MENU_WIDTH = 288;
const VIEWPORT_GUTTER = 12;
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

const getControlClass = (variant, theme) => {
  if (variant === "home") {
    return "border-teal-500/30 bg-slate-900/82 text-slate-100 shadow-lg shadow-teal-950/20 hover:border-teal-300/50 hover:bg-slate-900 hover:text-teal-100";
  }

  return theme === "dark"
    ? "border-slate-800 bg-slate-900/85 text-slate-300 hover:border-teal-400/30 hover:bg-slate-900 hover:text-teal-200"
    : "border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700";
};

const getMenuClass = (variant, theme) => {
  if (variant === "home" || theme === "dark") {
    return "border-slate-700 bg-slate-950 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.45)]";
  }

  return "border-slate-200 bg-white text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.16)]";
};

const getOptionClass = (variant, theme, active) => {
  if (variant === "home" || theme === "dark") {
    return active
      ? "border-teal-400/25 bg-teal-500/16 text-teal-100"
      : "border-transparent text-slate-200 hover:border-teal-400/20 hover:bg-slate-900 hover:text-white";
  }

  return active
    ? "border-teal-200 bg-teal-50 text-teal-800"
    : "border-transparent text-slate-700 hover:border-teal-200 hover:bg-slate-50 hover:text-slate-950";
};

function LanguageSelectControl({ variant = "dashboard", theme = "dark" }) {
  const { languageCode, languageLabel, languageOptions, setLanguageCode } = useLanguage();
  const isHome = variant === "home";
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const controlRef = useRef(null);
  const menuRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    if (typeof window === "undefined") return;

    const rect = controlRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isDesktop = window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
    const preferredTop = rect.bottom + 8;
    const targetHeight = Math.min(320, viewportHeight - VIEWPORT_GUTTER * 2);
    const spaceBelow = viewportHeight - preferredTop - VIEWPORT_GUTTER;
    const shouldOpenUp = spaceBelow < 220 && rect.top > spaceBelow;
    const top = shouldOpenUp
      ? Math.max(VIEWPORT_GUTTER, rect.top - targetHeight - 8)
      : Math.min(preferredTop, viewportHeight - 120);

    if (isDesktop) {
      const left = Math.min(
        Math.max(VIEWPORT_GUTTER, rect.right - MENU_WIDTH),
        viewportWidth - MENU_WIDTH - VIEWPORT_GUTTER
      );

      setMenuStyle({
        left: `${left}px`,
        right: "auto",
        top: `${top}px`,
        width: `${MENU_WIDTH}px`,
        maxHeight: `calc(100vh - ${top + VIEWPORT_GUTTER}px)`,
      });
      return;
    }

    setMenuStyle({
      left: `${VIEWPORT_GUTTER}px`,
      right: `${VIEWPORT_GUTTER}px`,
      top: `${top}px`,
      width: "auto",
      maxHeight: `calc(100vh - ${top + VIEWPORT_GUTTER}px)`,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        controlRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    updateMenuPosition();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  const openMenu = () => {
    if (!isOpen) {
      updateMenuPosition();
    }
    setIsOpen((open) => !open);
  };

  const languageMenu =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className={`fixed z-[9999] overflow-hidden rounded-2xl border p-2 ${getMenuClass(
              variant,
              theme
            )}`}
            style={menuStyle}
          >
            <div className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300">
              Global languages
            </div>
            <div
              className="max-h-[calc(100vh-8.5rem)] space-y-1 overflow-y-auto pr-1 md:max-h-[20rem]"
              role="listbox"
            >
              {languageOptions.map((option) => {
                const active = option.code === languageCode;

                return (
                  <button
                    key={option.code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${getOptionClass(
                      variant,
                      theme,
                      active
                    )}`}
                    onClick={() => {
                      setLanguageCode(option.code);
                      setIsOpen(false);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="block truncate text-xs opacity-70">
                        {option.nativeLabel}
                      </span>
                    </span>
                    <span className="ml-3 shrink-0 rounded-full border border-current/20 px-2 py-1 text-[10px] font-black uppercase">
                      {option.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={controlRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Global language: ${languageLabel}`}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-2xl border transition-all md:w-auto md:min-w-[5.75rem] md:justify-start md:px-3 ${getControlClass(
          variant,
          theme
        )}`}
        onClick={openMenu}
        title={`Global language: ${languageLabel}`}
      >
        <Globe2
          className={`h-4.5 w-4.5 shrink-0 ${
            isHome || theme === "dark" ? "text-teal-200" : "text-teal-600"
          }`}
          strokeWidth={2.2}
        />
        <span className="hidden text-xs font-bold uppercase md:inline">
          {languageCode.toUpperCase()}
        </span>
      </button>

      {languageMenu}
    </div>
  );
}

LanguageSelectControl.propTypes = {
  variant: PropTypes.oneOf(["dashboard", "home"]),
  theme: PropTypes.string,
};

export default LanguageSelectControl;
