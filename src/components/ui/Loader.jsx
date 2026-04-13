import PropTypes from "prop-types";

export default function Loader({ fullscreen = true }) {
  return (
    <div
      className={`${
        fullscreen ? "fixed inset-0 z-[80] min-h-screen" : "relative min-h-[40vh] w-full"
      } flex items-center justify-center overflow-hidden bg-slate-950 px-6 py-10 text-slate-100`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_18%_82%,rgba(45,212,191,0.14),transparent_26%),linear-gradient(180deg,#020617_0%,#020617_35%,#0f172a_100%)]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[14%] top-[22%] h-40 w-40 rounded-full bg-teal-400/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-0 rounded-full border-[3px] border-cyan-300/15 border-t-cyan-300 border-r-teal-300 animate-spin shadow-[0_0_24px_rgba(34,211,238,0.18)]" />
          <div className="absolute inset-3 rounded-full border-[3px] border-white/8 border-b-teal-300 border-l-cyan-400 animate-spin-reverse" />
          <div className="absolute inset-[34%] rounded-full bg-gradient-to-br from-cyan-200 via-teal-300 to-cyan-500 shadow-[0_0_26px_rgba(45,212,191,0.4)]" />
        </div>
      </div>
    </div>
  );
}

Loader.propTypes = {
  fullscreen: PropTypes.bool,
};
