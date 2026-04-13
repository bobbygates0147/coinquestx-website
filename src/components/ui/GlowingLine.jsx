import { useEffect, useRef } from "react";
import PropTypes from "prop-types";

const SVG_NS = "http://www.w3.org/2000/svg";
const TRAIL_TIMELINE_KEY = "__ledgerly_border_trail_timeline__";
const TRAIL_TIMELINE_STORAGE_KEY = "__ledgerly_border_trail_timeline_session__";

const roundMetric = (value) => Math.round(value * 10) / 10;

const GlowingBorderTrail = ({
  isActive = true,
  duration = 68000,
  pauseDuration = 0,
  isDarkMode = false,
}) => {
  const overlayRef = useRef(null);
  const auraPathRef = useRef(null);
  const beamPathRef = useRef(null);
  const corePathRef = useRef(null);
  const animationRef = useRef(null);
  const timelineRef = useRef(null);
  const metricsRef = useRef(null);
  const isDarkModeRef = useRef(isDarkMode);
  const lineLengthRef = useRef(30);
  const lineThicknessRef = useRef(1.15);
  const overlaySelectorsRef = useRef([
    "[role=\"dialog\"]",
    "[aria-modal=\"true\"]",
    ".fixed.inset-0.z-50",
    ".fixed.inset-0.z-\\[50\\]",
    ".fixed.inset-0.z-40",
    ".fixed.inset-0.z-\\[40\\]",
  ]);

  const isValidTimeline = (value) => {
    if (!value || typeof value !== "object") return false;
    return (
      Number.isFinite(value.startAtEpoch) &&
      Number.isFinite(value.duration) &&
      Number.isFinite(value.pauseDuration)
    );
  };

  const readStoredTimeline = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(TRAIL_TIMELINE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isValidTimeline(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const writeStoredTimeline = (timeline) => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        TRAIL_TIMELINE_STORAGE_KEY,
        JSON.stringify(timeline)
      );
    } catch {
      // no-op
    }
  };

  const isSidebarVisible = (node) => {
    if (!node || typeof window === "undefined") return false;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;

    const rect = node.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 0 &&
      rect.left < window.innerWidth &&
      rect.bottom > 0 &&
      rect.top < window.innerHeight
    );
  };

  const hasVisibleOverlay = () => {
    if (typeof document === "undefined") return false;

    const selectors = overlaySelectorsRef.current || [];
    for (let index = 0; index < selectors.length; index += 1) {
      const selector = selectors[index];
      const matches = document.querySelectorAll(selector);
      for (let nodeIndex = 0; nodeIndex < matches.length; nodeIndex += 1) {
        const node = matches[nodeIndex];
        if (!node || node === overlayRef.current) continue;
        if (overlayRef.current && node.contains(overlayRef.current)) continue;
        if (isSidebarVisible(node)) return true;
      }
    }

    return false;
  };

  const getLayoutElements = () => {
    const navbar =
      document.querySelector("[data-dashboard-navbar=\"true\"]") ||
      document.querySelector("header");

    const sidebarCandidates = Array.from(
      document.querySelectorAll("[data-dashboard-sidebar=\"true\"]")
    );
    const sidebar =
      sidebarCandidates.find((node) => isSidebarVisible(node)) || null;

    return { navbar, sidebar };
  };

  const getBeamPalette = () => {
    if (isDarkModeRef.current) {
      return {
        aura: "rgba(45, 212, 191, 0.16)",
        beam: "rgba(45, 212, 191, 0.82)",
        core: "rgba(153, 246, 228, 0.94)",
        blendMode: "screen",
        auraFilter: "drop-shadow(0 0 8px rgba(45, 212, 191, 0.3))",
        beamFilter: "drop-shadow(0 0 4px rgba(45, 212, 191, 0.4))",
        coreFilter: "drop-shadow(0 0 2px rgba(94, 234, 212, 0.3))",
      };
    }

    return {
      aura: "rgba(13, 148, 136, 0.12)",
      beam: "rgba(13, 148, 136, 0.74)",
      core: "rgba(15, 118, 110, 0.94)",
      blendMode: "normal",
      auraFilter: "drop-shadow(0 0 5px rgba(13, 148, 136, 0.1))",
      beamFilter: "drop-shadow(0 0 3px rgba(13, 148, 136, 0.18))",
      coreFilter: "drop-shadow(0 0 1px rgba(15, 118, 110, 0.12))",
    };
  };

  const ensureTimeline = () => {
    const now = Date.now();

    if (typeof window === "undefined") {
      if (!timelineRef.current) {
        timelineRef.current = { startAtEpoch: now, duration, pauseDuration };
      }
      return timelineRef.current;
    }

    const inMemory = isValidTimeline(window[TRAIL_TIMELINE_KEY])
      ? window[TRAIL_TIMELINE_KEY]
      : null;
    const stored = readStoredTimeline();
    const existing = inMemory || stored;

    if (
      existing &&
      Number.isFinite(existing.startAtEpoch) &&
      existing.duration === duration &&
      existing.pauseDuration === pauseDuration
    ) {
      window[TRAIL_TIMELINE_KEY] = existing;
      timelineRef.current = existing;
      return existing;
    }

    let nextStartAtEpoch = now;
    if (existing && Number.isFinite(existing.startAtEpoch)) {
      const oldCycle = existing.duration + existing.pauseDuration;
      const newCycle = duration + pauseDuration;
      if (oldCycle > 0 && newCycle > 0) {
        const oldOffset =
          (((now - existing.startAtEpoch) % oldCycle) + oldCycle) % oldCycle;
        const mappedOffset = (oldOffset / oldCycle) * newCycle;
        nextStartAtEpoch = now - mappedOffset;
      }
    }

    const nextTimeline = {
      startAtEpoch: nextStartAtEpoch,
      duration,
      pauseDuration,
    };
    window[TRAIL_TIMELINE_KEY] = nextTimeline;
    writeStoredTimeline(nextTimeline);
    timelineRef.current = nextTimeline;
    return nextTimeline;
  };

  const getFrameState = () => {
    const timeline = ensureTimeline();
    const now = Date.now();
    const loopDuration = Math.max(1, Number(timeline.duration) || 1);
    const pause = Math.max(0, Number(timeline.pauseDuration) || 0);
    const cycle = loopDuration + pause;

    if (cycle <= 0) {
      return { progress: 0, isPause: false };
    }

    const cycleOffset = (((now - timeline.startAtEpoch) % cycle) + cycle) % cycle;
    if (cycleOffset < loopDuration) {
      return { progress: cycleOffset / loopDuration, isPause: false };
    }

    return { progress: 1, isPause: true };
  };

  const buildPathMetrics = () => {
    const { navbar, sidebar } = getLayoutElements();
    if (!navbar || typeof window === "undefined") return null;

    const navbarRect = navbar.getBoundingClientRect();
    const borderInset = 0.5;
    const borderY = navbarRect.bottom - borderInset;
    const navbarLeftX = navbarRect.left + borderInset;
    const navbarRightX = navbarRect.right - borderInset;

    if (!sidebar) {
      const d = [
        `M ${navbarRightX} ${borderY}`,
        `L ${navbarLeftX} ${borderY}`,
        `L ${navbarRightX} ${borderY}`,
      ].join(" ");

      const key = [
        roundMetric(navbarLeftX),
        roundMetric(navbarRightX),
        roundMetric(borderY),
        roundMetric(window.innerWidth),
        roundMetric(window.innerHeight),
        "no-sidebar",
      ].join("|");

      return { d, key };
    }

    const sidebarRect = sidebar.getBoundingClientRect();
    const sidebarRightX = sidebarRect.right - borderInset;
    const sidebarLeftX = sidebarRect.left + borderInset;
    const sidebarTopY = sidebarRect.top + borderInset;
    const sidebarBottomY = sidebarRect.bottom - borderInset;
    const sidebarWidth = Math.max(0, sidebarRightX - sidebarLeftX);
    const sidebarHeight = Math.max(0, sidebarBottomY - sidebarTopY);
    const cornerRadius = Math.max(
      14,
      Math.min(24, sidebarWidth * 0.18, sidebarHeight * 0.1)
    );
    const turnDepth = Math.max(
      18,
      Math.min(30, (borderY - sidebarTopY) * 0.42)
    );
    const turnLead = Math.max(22, Math.min(34, cornerRadius * 1.55));
    const entryStartX = sidebarRightX + turnLead;

    const d = [
      `M ${navbarRightX} ${borderY}`,
      `L ${entryStartX} ${borderY}`,
      `C ${sidebarRightX + turnLead * 0.32} ${borderY}, ${sidebarRightX + turnLead * 0.06} ${borderY + turnDepth * 0.24}, ${sidebarRightX} ${borderY + turnDepth}`,
      `L ${sidebarRightX} ${sidebarBottomY - cornerRadius}`,
      `C ${sidebarRightX} ${sidebarBottomY - cornerRadius * 0.28}, ${sidebarRightX - cornerRadius * 0.28} ${sidebarBottomY}, ${sidebarRightX - cornerRadius} ${sidebarBottomY}`,
      `L ${sidebarLeftX + cornerRadius} ${sidebarBottomY}`,
      `C ${sidebarLeftX + cornerRadius * 0.28} ${sidebarBottomY}, ${sidebarLeftX} ${sidebarBottomY - cornerRadius * 0.28}, ${sidebarLeftX} ${sidebarBottomY - cornerRadius}`,
      `L ${sidebarLeftX} ${sidebarTopY + cornerRadius}`,
      `C ${sidebarLeftX} ${sidebarTopY + cornerRadius * 0.28}, ${sidebarLeftX + cornerRadius * 0.28} ${sidebarTopY}, ${sidebarLeftX + cornerRadius} ${sidebarTopY}`,
      `L ${sidebarRightX - cornerRadius} ${sidebarTopY}`,
      `C ${sidebarRightX - cornerRadius * 0.28} ${sidebarTopY}, ${sidebarRightX} ${sidebarTopY + cornerRadius * 0.28}, ${sidebarRightX} ${sidebarTopY + cornerRadius}`,
      `L ${sidebarRightX} ${borderY - turnDepth}`,
      `C ${sidebarRightX} ${borderY - turnDepth * 0.24}, ${sidebarRightX + turnLead * 0.06} ${borderY}, ${entryStartX} ${borderY}`,
      `L ${navbarRightX} ${borderY}`,
    ].join(" ");

    const key = [
      roundMetric(navbarRightX),
      roundMetric(borderY),
      roundMetric(sidebarRightX),
      roundMetric(sidebarLeftX),
      roundMetric(sidebarTopY),
      roundMetric(sidebarBottomY),
      roundMetric(window.innerWidth),
      roundMetric(window.innerHeight),
    ].join("|");

    return { d, key };
  };

  const applyThemeStyles = () => {
    if (
      !overlayRef.current ||
      !auraPathRef.current ||
      !beamPathRef.current ||
      !corePathRef.current
    ) {
      return;
    }

    isDarkModeRef.current = isDarkMode;
    const palette = getBeamPalette();
    const thickness = lineThicknessRef.current;

    overlayRef.current.style.mixBlendMode = palette.blendMode;

    auraPathRef.current.setAttribute("stroke", palette.aura);
    auraPathRef.current.setAttribute("stroke-width", `${thickness * 1.9}`);
    auraPathRef.current.style.filter = palette.auraFilter;

    beamPathRef.current.setAttribute("stroke", palette.beam);
    beamPathRef.current.setAttribute("stroke-width", `${thickness * 1.05}`);
    beamPathRef.current.style.filter = palette.beamFilter;

    corePathRef.current.setAttribute("stroke", palette.core);
    corePathRef.current.setAttribute("stroke-width", `${thickness}`);
    corePathRef.current.style.filter = palette.coreFilter;
  };

  const syncPathGeometry = () => {
    if (
      !overlayRef.current ||
      !auraPathRef.current ||
      !beamPathRef.current ||
      !corePathRef.current ||
      typeof window === "undefined"
    ) {
      return null;
    }

    const metrics = buildPathMetrics();
    if (!metrics) return null;

    overlayRef.current.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    overlayRef.current.setAttribute("width", `${window.innerWidth}`);
    overlayRef.current.setAttribute("height", `${window.innerHeight}`);

    if (!metricsRef.current || metricsRef.current.key !== metrics.key) {
      auraPathRef.current.setAttribute("d", metrics.d);
      beamPathRef.current.setAttribute("d", metrics.d);
      corePathRef.current.setAttribute("d", metrics.d);

      let length = 0;
      try {
        length = beamPathRef.current.getTotalLength();
      } catch {
        length = 0;
      }

      metricsRef.current = {
        ...metrics,
        length,
      };
    }

    return metricsRef.current;
  };

  const applyDashFrame = (metrics, progress, isPause) => {
    if (
      !metrics ||
      !metrics.length ||
      !overlayRef.current ||
      !auraPathRef.current ||
      !beamPathRef.current ||
      !corePathRef.current
    ) {
      if (overlayRef.current) {
        overlayRef.current.style.opacity = "0";
      }
      return;
    }

    const beamLength = Math.min(
      lineLengthRef.current,
      Math.max(24, metrics.length * 0.18)
    );
    const dashArray = `${beamLength} ${metrics.length + beamLength}`;
    const dashOffset = `${-(metrics.length * Math.max(0, Math.min(1, progress)))}`;
    const opacity = isPause ? "0.98" : "1";

    [auraPathRef.current, beamPathRef.current, corePathRef.current].forEach((path) => {
      path.setAttribute("stroke-dasharray", dashArray);
      path.setAttribute("stroke-dashoffset", dashOffset);
      path.style.opacity = opacity;
    });

    overlayRef.current.style.opacity = opacity;
  };

  const startAnimation = () => {
    ensureTimeline();

    const animate = () => {
      if (!overlayRef.current) return;

      if (hasVisibleOverlay()) {
        overlayRef.current.style.opacity = "0";
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const metrics = syncPathGeometry();
      const { progress, isPause } = getFrameState();
      applyDashFrame(metrics, progress, isPause);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (overlayRef.current && overlayRef.current.parentNode) {
      overlayRef.current.parentNode.removeChild(overlayRef.current);
      overlayRef.current = null;
    }

    auraPathRef.current = null;
    beamPathRef.current = null;
    corePathRef.current = null;
    metricsRef.current = null;
  };

  useEffect(() => {
    if (!isActive) {
      cleanup();
      return undefined;
    }

    const overlay = document.createElementNS(SVG_NS, "svg");
    overlay.classList.add("glowing-border-trail");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 48;
      opacity: 0;
      overflow: visible;
      transition: opacity 0.24s ease;
      will-change: opacity;
    `;

    const createPath = () => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("vector-effect", "non-scaling-stroke");
      path.style.transition = "stroke 0.2s ease, opacity 0.2s ease, filter 0.2s ease";
      return path;
    };

    const auraPath = createPath();
    const beamPath = createPath();
    const corePath = createPath();

    overlay.appendChild(auraPath);
    overlay.appendChild(beamPath);
    overlay.appendChild(corePath);
    document.body.appendChild(overlay);

    overlayRef.current = overlay;
    auraPathRef.current = auraPath;
    beamPathRef.current = beamPath;
    corePathRef.current = corePath;

    applyThemeStyles();
    startAnimation();

    return cleanup;
  }, [isActive, duration, pauseDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyThemeStyles();
  }, [isDarkMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default GlowingBorderTrail;

GlowingBorderTrail.propTypes = {
  isActive: PropTypes.bool,
  duration: PropTypes.number,
  pauseDuration: PropTypes.number,
  isDarkMode: PropTypes.bool,
};
