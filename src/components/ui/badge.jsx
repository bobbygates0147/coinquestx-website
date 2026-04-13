import React from "react";
import PropTypes from "prop-types";

const Badge = ({
  children,
  variant = "primary",
  size = "md",
  pill = false,
  icon = null,
  onClose = null,
  className = "",
}) => {
  const baseClasses = "inline-flex items-center font-medium whitespace-nowrap";

  const variantClasses = {
    primary: "bg-blue-500 text-white",
    secondary: "bg-gray-500 text-white",
    success: "bg-green-500 text-white",
    danger: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-gray-800",
    info: "bg-cyan-500 text-white",
    light: "bg-gray-100 text-gray-800",
    dark: "bg-gray-800 text-white",
    outline: "border border-gray-300 bg-transparent text-gray-700",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const roundedClass = pill ? "rounded-full" : "rounded-md";

  return (
    <div
      className={[
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        roundedClass,
        className,
        onClose ? "pr-1" : "",
      ].join(" ")}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Remove badge"
          className="ml-1.5 inline-flex items-center justify-center rounded-full hover:bg-black/10 p-0.5"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "success",
    "danger",
    "warning",
    "info",
    "light",
    "dark",
    "outline",
  ]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  pill: PropTypes.bool,
  icon: PropTypes.node,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

export default Badge;
