import { ChevronRight, House } from "lucide-react";
import PropTypes from "prop-types";
import { getDashboardPageMeta } from "../../../constants/dashboardPageMeta";

const splitTitle = (title = "") => {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { primary: title, secondary: "" };
  }

  return {
    primary: parts[0],
    secondary: parts.slice(1).join(" "),
  };
};

export default function SectionHeader({ pathname }) {
  const { title, subtitle, parent } = getDashboardPageMeta(pathname);
  const { primary, secondary } = splitTitle(title);

  return (
    <section className="px-4 pb-2 pt-4 sm:px-6 lg:px-8">
      <nav className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <House className="h-3.5 w-3.5" strokeWidth={2.3} />
        <span>{parent || "Dashboard"}</span>
        <ChevronRight className="h-3 w-3" strokeWidth={2.3} />
        <span className="text-slate-700 dark:text-slate-200">{title}</span>
      </nav>

      <h1 className="text-2xl font-display font-bold tracking-tight sm:text-4xl">
        <span className="text-blue-800 dark:text-blue-300">{primary}</span>
        {secondary ? (
          <>
            {" "}
            <span className="text-amber-500 dark:text-amber-300">
              {secondary}
            </span>
          </>
        ) : null}
      </h1>

      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">
        {subtitle}
      </p>
    </section>
  );
}

SectionHeader.propTypes = {
  pathname: PropTypes.string.isRequired,
};
