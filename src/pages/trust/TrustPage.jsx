import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import HomeHeaderPage from "../../components/home/layout/HomeHeader.jsx";
import FooterPage from "../../components/home/layout/Footer.jsx";
import { TRUST_PAGE_ORDER, TRUST_PAGES } from "./trustContent";

const NAV_LABELS = {
  fees: "Fees",
  risk: "Risk Disclosure",
  terms: "Terms",
  privacy: "Privacy",
  amlKyc: "AML / KYC",
  proof: "Proof of Process",
};

export default function TrustPage({ pageKey = "terms" }) {
  const page = TRUST_PAGES[pageKey] || TRUST_PAGES.terms;
  const navItems = useMemo(
    () =>
      TRUST_PAGE_ORDER.map((key) => ({
        key,
        label: NAV_LABELS[key] || key,
        path:
          key === "fees"
            ? "/fees"
            : key === "risk"
            ? "/risk-disclosure"
            : key === "terms"
            ? "/terms"
            : key === "privacy"
            ? "/privacy"
            : key === "amlKyc"
            ? "/aml-kyc-policy"
            : "/proof-of-process",
      })),
    []
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pageKey]);

  return (
    <section className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <HomeHeaderPage />

      <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_right_top,rgba(56,189,248,0.16),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_58%,#020617_100%)]">
        <div className="pointer-events-none absolute left-[-8rem] top-24 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-8rem] top-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_360px]">
            <div>
              <p className="inline-flex rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-300">
                {page.eyebrow}
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {page.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                {page.description}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {page.highlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.28)]"
                  >
                    <BadgeCheck className="h-5 w-5 text-teal-300" strokeWidth={2.2} />
                    <p className="mt-3 text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-teal-400/10 p-3 text-teal-300">
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Document Overview</p>
                  <p className="text-xs text-slate-400">Updated {page.updatedAt}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Trust Documents
                </p>
                <div className="mt-3 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.key}
                      to={item.path}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                        item.key === pageKey
                          ? "border-teal-400/30 bg-teal-400/10 text-teal-200"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-teal-400/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-cyan-400/15 bg-cyan-400/10 p-5">
                <p className="text-sm font-semibold text-cyan-200">
                  Need clarification on a policy?
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Reach support from your dashboard or use the contact page for policy and
                  verification questions.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    Contact
                  </Link>
                  <Link
                    to="/LoginPage"
                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            {page.sections.map((section, index) => (
              <article
                key={section.heading}
                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.28)] sm:p-8"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/8 p-3 text-teal-300">
                    <FileCheck2 className="h-5 w-5" strokeWidth={2.1} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Section {index + 1}
                    </p>
                    <h2 className="text-2xl font-semibold text-white">{section.heading}</h2>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-slate-300 sm:text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets?.length ? (
                  <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Key Points
                    </p>
                    <div className="mt-4 space-y-3">
                      {section.bullets.map((bullet) => (
                        <div key={bullet} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 rounded-full bg-teal-300" />
                          <p className="text-sm leading-6 text-slate-200">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(2,6,23,0.28)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Related Actions
            </p>
            <div className="mt-4 space-y-3">
              <Link
                to="/fees"
                className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-teal-400/25 hover:bg-white/[0.05]"
              >
                Review fees and processing notes
              </Link>
              <Link
                to="/risk-disclosure"
                className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-teal-400/25 hover:bg-white/[0.05]"
              >
                Read the risk disclosure summary
              </Link>
              <Link
                to="/proof-of-process"
                className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-teal-400/25 hover:bg-white/[0.05]"
              >
                See how controls and review flows work
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <FooterPage />
    </section>
  );
}
