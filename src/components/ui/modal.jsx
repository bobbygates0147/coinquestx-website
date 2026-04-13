import PropTypes from "prop-types";
import { useEffect } from "react";
import { X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};

const THEME_CLASSES = {
  dark: {
    panel:
      "border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_rgba(15,23,42,0.98)_34%,_rgba(2,6,23,0.96)_100%)] text-slate-100 shadow-[0_32px_120px_-40px_rgba(2,6,23,0.95)]",
    eyebrow:
      "border-white/10 bg-white/[0.05] text-teal-200/90",
    muted: "text-slate-400",
    close:
      "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.09] hover:text-white",
    divider: "border-white/10",
  },
  light: {
    panel:
      "border-teal-100 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.12),_rgba(255,255,255,0.98)_34%,_rgba(248,250,252,0.98)_100%)] text-slate-900 shadow-[0_32px_120px_-40px_rgba(15,23,42,0.28)]",
    eyebrow:
      "border-teal-100 bg-white/80 text-teal-700",
    muted: "text-slate-600",
    close:
      "border-slate-200/90 bg-white/85 text-slate-500 hover:bg-slate-50 hover:text-slate-900",
    divider: "border-slate-200/90",
  },
};

const TONE_CLASSES = {
  teal: {
    icon:
      "bg-teal-500/16 text-teal-300 ring-teal-400/20 dark:text-teal-300",
  },
  success: {
    icon:
      "bg-emerald-500/16 text-emerald-300 ring-emerald-400/20 dark:text-emerald-300",
  },
  danger: {
    icon:
      "bg-rose-500/16 text-rose-300 ring-rose-400/20 dark:text-rose-300",
  },
  warning: {
    icon:
      "bg-amber-500/16 text-amber-300 ring-amber-400/20 dark:text-amber-300",
  },
  cyan: {
    icon:
      "bg-cyan-500/16 text-cyan-300 ring-cyan-400/20 dark:text-cyan-300",
  },
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

const getThemeName = (theme) => (theme === "dark" ? "dark" : "light");

export function Modal({
  isOpen,
  onClose,
  children,
  closeOnOverlay = true,
  className = "",
}) {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlay) onClose?.();
  };

  return (
    <div
      className={cx(
        "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/72 backdrop-blur-md"
        onClick={handleOverlayClick}
      />
      <div className="relative z-10 flex w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function ModalContent({
  children,
  theme = "dark",
  size = "md",
  className = "",
  onClose,
  showCloseButton,
  withGlow = true,
}) {
  const themeName = getThemeName(theme);
  const themeClasses = THEME_CLASSES[themeName];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cx(
        "relative w-full overflow-hidden rounded-[28px] border",
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        themeClasses.panel,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/80 to-transparent" />
      {withGlow ? (
        <>
          <div className="pointer-events-none absolute -right-16 top-0 h-44 w-44 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="pointer-events-none absolute left-10 top-16 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
        </>
      ) : null}
      {(showCloseButton ?? Boolean(onClose)) && onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={cx(
            "absolute right-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
            themeClasses.close
          )}
          aria-label="Close dialog"
        >
          <X className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function ModalHeader({
  children,
  title,
  description,
  eyebrow,
  icon,
  badge,
  theme = "dark",
  tone = "teal",
  align = "left",
  className = "",
}) {
  const themeName = getThemeName(theme);
  const themeClasses = THEME_CLASSES[themeName];
  const toneClasses = TONE_CLASSES[tone] || TONE_CLASSES.teal;
  const titleContent = title || children;
  const isCentered = align === "center";

  return (
    <div className={cx("px-6 pt-6 sm:px-7 sm:pt-7", className)}>
      {eyebrow || badge ? (
        <div
          className={cx(
            "mb-4 flex flex-wrap items-center gap-2",
            isCentered ? "justify-center" : "justify-between"
          )}
        >
          {eyebrow ? (
            <span
              className={cx(
                "inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.26em]",
                themeClasses.eyebrow
              )}
            >
              {eyebrow}
            </span>
          ) : null}
          {badge}
        </div>
      ) : null}

      <div
        className={cx(
          "flex gap-4",
          isCentered ? "flex-col items-center text-center" : "items-start"
        )}
      >
        {icon ? (
          <div
            className={cx(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] ring-1 backdrop-blur",
              toneClasses.icon
            )}
          >
            {icon}
          </div>
        ) : null}
        <div className={cx("space-y-2", !isCentered && "min-w-0")}>
          {titleContent ? (
            <h3 className="font-display text-2xl font-bold tracking-tight sm:text-[2rem]">
              {titleContent}
            </h3>
          ) : null}
          {description ? (
            <p className={cx("text-sm leading-6 sm:text-base", themeClasses.muted)}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ModalBody({ children, className = "" }) {
  return <div className={cx("px-6 pb-6 pt-5 sm:px-7 sm:pb-7", className)}>{children}</div>;
}

export function ModalFooter({
  children,
  theme = "dark",
  className = "",
  align = "end",
  divided = true,
}) {
  const themeName = getThemeName(theme);

  return (
    <div
      className={cx(
        "px-6 pb-6 pt-4 sm:px-7 sm:pb-7",
        divided && ["border-t", THEME_CLASSES[themeName].divider],
        "flex flex-col-reverse gap-3 sm:flex-row sm:items-center",
        align === "between"
          ? "sm:justify-between"
          : align === "stretch"
          ? "sm:justify-stretch"
          : "sm:justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  children: PropTypes.node.isRequired,
  closeOnOverlay: PropTypes.bool,
  className: PropTypes.string,
};

ModalContent.propTypes = {
  children: PropTypes.node.isRequired,
  theme: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl", "full"]),
  className: PropTypes.string,
  onClose: PropTypes.func,
  showCloseButton: PropTypes.bool,
  withGlow: PropTypes.bool,
};

ModalHeader.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  eyebrow: PropTypes.node,
  icon: PropTypes.node,
  badge: PropTypes.node,
  theme: PropTypes.string,
  tone: PropTypes.oneOf(["teal", "success", "danger", "warning", "cyan"]),
  align: PropTypes.oneOf(["left", "center"]),
  className: PropTypes.string,
};

ModalBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

ModalFooter.propTypes = {
  children: PropTypes.node.isRequired,
  theme: PropTypes.string,
  className: PropTypes.string,
  align: PropTypes.oneOf(["end", "between", "stretch"]),
  divided: PropTypes.bool,
};
