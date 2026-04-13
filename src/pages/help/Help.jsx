import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faComments,
  faCreditCard,
  faIdCard,
  faMagnifyingGlass,
  faShield,
  faSignal,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

const QUICK_ACTIONS = [
  {
    title: "Verify Account",
    description: "Submit KYC and unlock faster approvals.",
    to: "/kyc-verification",
    icon: faIdCard,
  },
  {
    title: "Deposit Funds",
    description: "Fund your wallet before subscribing or trading.",
    to: "/deposits",
    icon: faWallet,
  },
  {
    title: "Transaction History",
    description: "Track deposits, withdrawals, and service purchases.",
    to: "/Transactions",
    icon: faCreditCard,
  },
  {
    title: "Messages",
    description: "Open direct support threads with admin when eligible.",
    to: "/Messages",
    icon: faComments,
  },
  {
    title: "Trust Center",
    description: "Read fees, terms, privacy, and proof-of-process pages.",
    to: "/proof-of-process",
    icon: faShield,
  },
];

const FAQ_ITEMS = [
  {
    category: "Account",
    question: "How do I verify my account?",
    answer:
      "Go to KYC Verification, upload your ID and selfie documents, then wait for admin review.",
  },
  {
    category: "Funding",
    question: "Why is my deposit still pending?",
    answer:
      "Pending deposits require admin confirmation. Once approved, your balance updates automatically.",
  },
  {
    category: "Subscription",
    question: "Which plans can message admin directly?",
    answer:
      "Only Platinum and Elite plans can start or send direct admin messages from the Messages page.",
  },
  {
    category: "Trading",
    question: "Where can I see active and completed trades?",
    answer:
      "Use Place Trade for live positions and Transactions for completed records and status updates.",
  },
  {
    category: "Security",
    question: "What if I suspect unauthorized activity?",
    answer:
      "Reset your password immediately, log out of old sessions, and notify admin through the help channels.",
  },
  {
    category: "Policy",
    question: "Where can I read platform fees, terms, and compliance policies?",
    answer:
      "Use the public trust pages for fees, risk disclosure, terms, privacy, AML/KYC policy, and proof-of-process details.",
  },
  {
    category: "Signals",
    question: "How do subscription, signals, bots, and mining connect?",
    answer:
      "Your selected services are tracked in Transactions and reflected in dashboard performance and account metrics.",
  },
];

export default function HelpPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(FAQ_ITEMS.map((item) => item.category)))],
    []
  );

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      );
    });
  }, [category, search]);

  return (
    <section
      className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${
        isDark ? "bg-zinc-950 text-slate-100" : "bg-gray-50 text-slate-900"
      }`}
    >
      <div className="w-full space-y-4">
        <div
          className={`rounded-2xl border p-5 ${
            isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Help Center</h2>
              <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Search support topics and navigate to the right action quickly.
              </p>
            </div>
            <div className="text-xs opacity-80">
              {filteredFaqs.length} result{filteredFaqs.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div
              className={`lg:col-span-2 flex items-center rounded-xl border px-3 py-2 ${
                isDark
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-300 bg-slate-50"
              }`}
            >
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className={isDark ? "text-slate-400" : "text-slate-500"}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search for deposits, subscriptions, copy trading..."
                className={`ml-2 w-full bg-transparent text-sm outline-none ${
                  isDark ? "placeholder:text-slate-500" : "placeholder:text-slate-400"
                }`}
              />
            </div>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={`rounded-xl border px-3 py-2 text-sm ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-slate-100"
                  : "border-slate-300 bg-slate-50 text-slate-900"
              }`}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.title}
              to={action.to}
              className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
                isDark
                  ? "border-slate-700 bg-slate-900/80 hover:bg-slate-800"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-teal-500/15 p-2 text-teal-500">
                  <FontAwesomeIcon icon={action.icon} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{action.title}</h3>
                  <p
                    className={`mt-1 text-xs ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
          }`}
        >
          <h3 className="text-sm font-semibold">Frequently Asked Questions</h3>
          <div className="mt-3 space-y-2">
            {filteredFaqs.length === 0 ? (
              <div
                className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm ${
                  isDark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-600"
                }`}
              >
                No matching topic found. Try another search term.
              </div>
            ) : (
              filteredFaqs.map((item) => (
                <article
                  key={item.question}
                  className={`rounded-xl border p-3 ${
                    isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{item.question}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isDark ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {item.answer}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
          }`}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faShield} className="mt-1 text-teal-500" />
              <div>
                <p className="text-sm font-semibold">Security First</p>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Keep account details private and verify all transaction steps.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faSignal} className="mt-1 text-teal-500" />
              <div>
                <p className="text-sm font-semibold">Service Visibility</p>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Plan, bot, mining, and signal activity is reflected in your dashboard data.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleCheck} className="mt-1 text-teal-500" />
              <div>
                <p className="text-sm font-semibold">Fast Resolution</p>
                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Use Messages for direct support when your plan allows admin inbox access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
