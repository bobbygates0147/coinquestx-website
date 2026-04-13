"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBitcoin } from "@fortawesome/free-brands-svg-icons";
import {
  ArrowUpRight,
  Clock3,
  Lock,
  SendHorizonal,
  Settings2,
  ShieldCheck,
  Trash2,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useTransactions } from "../../context/TransactionContext";
import { useCopyTraders } from "../../context/CopyTraderContext";
import { getDashboardPageMeta, normalizeDashboardPath } from "../../constants/dashboardPageMeta";
import { useKycNavigation } from "../../hooks/useKycNavigation";
import { isKycProtectedPath } from "../../utils/kycAccess";
import {
  CHAT_PREFS_KEY,
  CHAT_STORAGE_KEY,
  PUBLIC_PROMPTS,
  MAX_PERSISTED_MESSAGES,
  buildAction,
  getContextualPrompts,
  isPublicPath,
  parseStoredMessages,
  sanitizeActions,
} from "./chatbotConfig";
import { getLocalAssistantReply } from "./chatbotLocalReply";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const renderLivechatBadge = ({
  size = "md",
  beam = false,
  className = "",
} = {}) => {
  const sizes = {
    sm: {
      wrap: "h-8 w-8",
      icon: "text-sm",
    },
    md: {
      wrap: "h-11 w-11",
      icon: "text-lg",
    },
    lg: {
      wrap: "h-12 w-12",
      icon: "text-xl",
    },
  };

  const selected = sizes[size] || sizes.md;

  return (
    <span className={`relative inline-flex items-center justify-center ${selected.wrap} ${className}`}>
      {beam ? (
        <>
          <span className="pointer-events-none absolute -inset-3 rounded-full bg-teal-400/20 blur-xl animate-pulse" />
          <span className="pointer-events-none absolute -inset-2 rounded-full border border-teal-300/30 animate-ping [animation-duration:2.1s]" />
          <span className="pointer-events-none absolute -inset-1 rounded-full border border-cyan-200/24 animate-pulse" />
        </>
      ) : null}
      <span className="relative inline-flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-500 text-white shadow-[0_0_26px_rgba(45,212,191,0.5)] animate-pulse">
        <FontAwesomeIcon icon={faBitcoin} className={selected.icon} />
      </span>
    </span>
  );
};

const ChatBot = ({ forceDark = false }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const { userData, isAuthenticated } = useUser();
  const {
    pendingRequests = [],
    pendingDeposits = [],
    pendingWithdrawals = [],
    totalCompletedDeposits = 0,
  } = useTransactions();
  const {
    tradingStats = {},
    performanceMetrics = {},
    totalCopiedTrades = 0,
    totalInvested = 0,
  } = useCopyTraders();
  const { isKycComplete, navigateWithKycCheck } = useKycNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState(PUBLIC_PROMPTS);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimersRef = useRef(new Set());
  const audioContextRef = useRef(null);
  const audioUnlockHandlerRef = useRef(null);
  const pathname = normalizeDashboardPath(location.pathname);
  const pageMeta = useMemo(() => getDashboardPageMeta(pathname), [pathname]);
  const canSendDirectMessages = useMemo(() => {
    const plan = `${userData?.subscriptionPlan || "Basic"}`.trim().toLowerCase();
    return plan === "platinum" || plan === "elite";
  }, [userData?.subscriptionPlan]);
  const contextualPrompts = useMemo(
    () =>
      getContextualPrompts({
        pathname,
        isAuthenticated,
        isKycComplete,
        canSendDirectMessages,
      }),
    [canSendDirectMessages, isAuthenticated, isKycComplete, pathname]
  );
  const widgetBottomClass =
    isAuthenticated && !isPublicPath(pathname) ? "bottom-24 md:bottom-6" : "bottom-6";
  const isDark = forceDark || theme === "dark";
  const useDashboardPulseLauncher = forceDark && isDark;
  const chatShellClass = isDark
    ? "border-teal-400/16 bg-slate-950 shadow-[0_32px_90px_rgba(2,8,23,0.7)]"
    : "border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.16)]";
  const chatHeaderClass = isDark
    ? "border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.2),_transparent_32%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))]"
    : "border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.16),_transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.96))]";
  const badgeFrameClass = isDark
    ? "border-teal-300/16 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.22),_rgba(6,182,212,0.1)_48%,_transparent_72%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] shadow-[0_0_34px_rgba(45,212,191,0.24)]"
    : "border-teal-200 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_rgba(6,182,212,0.06)_48%,_transparent_72%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.95))] shadow-[0_14px_36px_rgba(45,212,191,0.16)]";
  const headerTitleClass = isDark ? "text-white" : "text-slate-900";
  const iconButtonClass = isDark
    ? "border-slate-800 bg-slate-900/80 text-slate-300 hover:border-teal-400/20 hover:bg-slate-900 hover:text-teal-200"
    : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700";
  const optionsMenuClass = isDark
    ? "border-slate-800 bg-slate-950 shadow-[0_22px_60px_rgba(2,8,23,0.58)]"
    : "border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.14)]";
  const optionsButtonClass = isDark
    ? "border-slate-800 text-white hover:bg-slate-900/80"
    : "border-slate-200 text-slate-700 hover:bg-slate-50";
  const optionsFooterClass = isDark
    ? "border-slate-800 bg-slate-950 text-slate-400"
    : "border-slate-200 bg-slate-50 text-slate-500";
  const statusStripClass = isDark
    ? "border-slate-800 bg-slate-950/95"
    : "border-slate-200 bg-white/95";
  const statusCardClass = isDark
    ? "border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))]"
    : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))]";
  const statusIconClass = isDark
    ? "bg-slate-900/88 text-teal-200"
    : "bg-teal-50 text-teal-700";
  const statusLabelClass = isDark ? "text-slate-500" : "text-slate-500";
  const statusValueClass = isDark ? "text-white" : "text-slate-800";
  const messagesSurfaceClass = isDark
    ? "bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_transparent_18%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]"
    : "bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.08),_transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,1))]";
  const botBubbleClass = isDark
    ? "rounded-bl-md border border-slate-800 bg-slate-900/92 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
    : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)]";
  const botBadgeWrapClass = isDark
    ? "border-slate-950 bg-slate-950"
    : "border-white bg-white shadow-sm";
  const secondaryActionClass = isDark
    ? "border-slate-700 bg-slate-950/80 text-slate-200 hover:bg-slate-900"
    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white";
  const promptStripClass = isDark
    ? "border-slate-800 bg-slate-950"
    : "border-slate-200 bg-white";
  const promptChipClass = isDark
    ? "border-slate-800 bg-slate-900 text-teal-100 hover:border-teal-400/20 hover:bg-slate-900/80"
    : "border-slate-200 bg-slate-50 text-teal-700 hover:border-teal-300 hover:bg-teal-50";
  const composerClass = isDark ? "bg-slate-950" : "bg-white";
  const textareaClass = isDark
    ? "border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:border-teal-400/35"
    : "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-teal-400";
  const launcherClass = isDark
    ? "border-teal-300/24 bg-slate-950/94 shadow-[0_18px_48px_rgba(2,8,23,0.42)] hover:border-teal-300/55"
    : "border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] hover:border-teal-300";
  const launcherInnerBorderClass = isDark ? "border-white/6" : "border-slate-200/80";
  const dashboardPulseLauncherClass =
    "border-teal-300/30 bg-teal-400/12 text-teal-100 shadow-[0_0_0_1px_rgba(45,212,191,0.14),0_0_20px_rgba(45,212,191,0.28),0_0_38px_rgba(45,212,191,0.18)] animate-[pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none hover:border-teal-200/40 hover:bg-teal-400/16";

  const formatCurrency = useCallback((value, currency = userData?.currencyCode || "USD") => {
    const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeValue);
    } catch {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeValue);
    }
  }, [userData?.currencyCode]);

  const scheduleTask = (callback, delay) => {
    const handle = setTimeout(() => {
      typingTimersRef.current.delete(handle);
      callback();
    }, delay);
    typingTimersRef.current.add(handle);
  };

  const clearTypingTimers = () => {
    typingTimersRef.current.forEach((handle) => clearTimeout(handle));
    typingTimersRef.current.clear();
  };

  const getAudioContext = useCallback(async () => {
    if (typeof window === "undefined") return null;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      return ctx;
    } catch {
      return null;
    }
  }, []);

  const emitTone = useCallback((ctx, frequency = 740, durationMs = 40, volume = 0.02) => {
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const endAt = ctx.currentTime + durationMs / 1000;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(volume, 0.0001),
        ctx.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(endAt);
    } catch {
      // no-op
    }
  }, []);

  const playTone = useCallback(async (frequency = 740, durationMs = 40, volume = 0.02) => {
    if (!soundEnabled) return;
    const ctx = await getAudioContext();
    if (!ctx) return;
    emitTone(ctx, frequency, durationMs, volume);
  }, [emitTone, getAudioContext, soundEnabled]);

  const handleToggleSound = useCallback(async () => {
    const nextValue = !soundEnabled;
    setSoundEnabled(nextValue);
    if (!nextValue) return;
    const ctx = await getAudioContext();
    if (!ctx) return;
    emitTone(ctx, 720, 55, 0.018);
  }, [emitTone, getAudioContext, soundEnabled]);

  const statusCards = useMemo(() => ([
    {
      label: "Wallet",
      value: formatCurrency(userData?.balance || 0),
      icon: Wallet,
      accent: "from-teal-400/24 via-teal-400/8 to-transparent",
    },
    {
      label: "KYC",
      value: isKycComplete ? "Verified" : userData?.kycStatus || "Pending",
      icon: ShieldCheck,
      accent: "from-cyan-400/24 via-cyan-400/8 to-transparent",
    },
    {
      label: "Activity",
      value: `${pendingRequests.length} pending`,
      icon: Clock3,
      accent: "from-emerald-400/24 via-emerald-400/8 to-transparent",
    },
  ]), [formatCurrency, isKycComplete, pendingRequests.length, userData?.balance, userData?.kycStatus]);

  const getWelcomeMessage = useCallback(() => ({
    topic: "welcome",
    text: isAuthenticated
      ? `Balance: ${formatCurrency(userData?.balance || 0)}\nPlan: ${
          userData?.subscriptionPlan || "Basic"
        }\nKYC: ${isKycComplete ? "Verified" : userData?.kycStatus || "pending"}\nPending requests: ${
          pendingRequests.length
        }\nLive trades: ${toNumber(userData?.revenue?.activeTrades, 0) || toNumber(tradingStats?.liveTrades, 0)}\nCopied traders: ${toNumber(totalCopiedTrades, 0)}`
      : "Ask about account creation, KYC, wallet funding, dashboard features, trading tools, referrals, or support.",
    actions: sanitizeActions([
      buildAction(isAuthenticated ? "dashboard" : "signup", { variant: "primary" }),
      buildAction(isAuthenticated && !isKycComplete ? "kyc" : isAuthenticated ? "deposits" : "login"),
      buildAction(isAuthenticated && canSendDirectMessages ? "messages" : "help"),
    ]),
  }), [
    canSendDirectMessages,
    formatCurrency,
    isAuthenticated,
    isKycComplete,
    pendingRequests.length,
    totalCopiedTrades,
    tradingStats?.liveTrades,
    userData?.balance,
    userData?.kycStatus,
    userData?.revenue?.activeTrades,
    userData?.subscriptionPlan,
  ]);

  const resolveAssistantReply = useCallback(async (query) =>
    getLocalAssistantReply({
      query,
      isAuthenticated,
      isKycComplete,
      canSendDirectMessages,
      contextualPrompts,
      formatCurrency,
      userData,
      pendingRequests,
      pendingDeposits,
      pendingWithdrawals,
      totalCompletedDeposits,
      totalCopiedTrades,
      totalInvested,
      tradingStats,
      performanceMetrics,
      pageMeta,
    }), [
      canSendDirectMessages,
      contextualPrompts,
      formatCurrency,
      isAuthenticated,
      isKycComplete,
      pageMeta,
      pendingDeposits,
      pendingRequests,
      pendingWithdrawals,
      performanceMetrics,
      totalCompletedDeposits,
      totalCopiedTrades,
      totalInvested,
      tradingStats,
      userData,
    ]);

  const submitQuery = useCallback(async (query) => {
    const trimmed = `${query || ""}`.trim();
    if (!trimmed || isTyping) return;

    const userMessage = {
      id: createId(),
      sender: "user",
      text: trimmed,
      topic: null,
      actions: [],
      isTyping: false,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: createId(),
        sender: "bot",
        text: "",
        topic: null,
        actions: [],
        isTyping: true,
        timestamp: new Date().toISOString(),
      },
    ].slice(-MAX_PERSISTED_MESSAGES));
    setInputValue("");
    setShowOptions(false);
    setIsTyping(true);
    playTone(880, 35, 0.012);

    const payload = await resolveAssistantReply(trimmed);
    setSuggestedPrompts(payload.suggestions || contextualPrompts);
    const words = `${payload.reply || "I could not respond right now."}`.trim().split(" ").filter(Boolean);
    let builtText = "";
    let index = 0;

    const updateBotMessage = (text, done = false) => {
      setMessages((prev) =>
        prev.map((message, position, list) =>
          position === list.length - 1 && message.sender === "bot"
            ? {
                ...message,
                text,
                topic: payload.topic || null,
                actions: done ? sanitizeActions(payload.actions) : [],
                isTyping: !done,
              }
            : message
        )
      );
    };

    const typeChunk = () => {
      if (index >= words.length) {
        updateBotMessage(payload.reply || "", true);
        setIsTyping(false);
        playTone(640, 55, 0.015);
        return;
      }
      const chunkSize = Math.min(words.length - index, 2 + Math.floor(Math.random() * 3));
      builtText = `${builtText}${builtText ? " " : ""}${words.slice(index, index + chunkSize).join(" ")}`;
      index += chunkSize;
      updateBotMessage(builtText);
      scheduleTask(typeChunk, 70 * chunkSize + Math.floor(Math.random() * 120));
    };

    scheduleTask(typeChunk, 240);
  }, [contextualPrompts, isTyping, playTone, resolveAssistantReply]);

  const handleActionClick = (action) => {
    if (!action) return;
    if (action.type === "prompt" && action.prompt) {
      submitQuery(action.prompt);
      return;
    }
    if (action.to) {
      navigateWithKycCheck(action.to, {
        requiresKyc: action.requiresKyc || isKycProtectedPath(action.to),
      });
    }
  };

  useEffect(() => {
    const prefs = JSON.parse(localStorage.getItem(CHAT_PREFS_KEY) || "{}");
    setMessages(parseStoredMessages(localStorage.getItem(CHAT_STORAGE_KEY)));
    setSoundEnabled(typeof prefs.soundEnabled === "boolean" ? prefs.soundEnabled : true);
    setIsOpen(Boolean(prefs.isOpen));
    setSuggestedPrompts(contextualPrompts);
    setIsReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify(messages.map(({ id, sender, text, topic, actions, timestamp }) => ({
        id,
        sender,
        text,
        topic,
        actions: sanitizeActions(actions),
        timestamp,
      })))
    );
  }, [isReady, messages]);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(CHAT_PREFS_KEY, JSON.stringify({ soundEnabled, isOpen }));
  }, [isOpen, isReady, soundEnabled]);

  useEffect(() => {
    if (!isReady) return;
    setSuggestedPrompts(contextualPrompts);
  }, [contextualPrompts, isReady]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const unlockAudio = async () => {
      if (!soundEnabled) return;
      const ctx = await getAudioContext();
      if (!ctx || ctx.state !== "running") return;
      const unlockHandlers = audioUnlockHandlerRef.current;
      if (!unlockHandlers) return;
      window.removeEventListener("pointerdown", unlockHandlers);
      window.removeEventListener("keydown", unlockHandlers);
      audioUnlockHandlerRef.current = null;
    };

    audioUnlockHandlerRef.current = unlockAudio;
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      audioUnlockHandlerRef.current = null;
    };
  }, [getAudioContext, soundEnabled]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return undefined;
    }

    const syncQuickActionsState = (open) => {
      const nextOpen = Boolean(open);
      setIsQuickActionsOpen(nextOpen);
      if (nextOpen) {
        setIsOpen(false);
        setShowOptions(false);
      }
    };

    syncQuickActionsState(
      document.body.classList.contains("coinquestx-quick-actions-open")
    );

    const handleQuickActionsToggle = (event) => {
      syncQuickActionsState(event?.detail?.open);
    };

    window.addEventListener(
      "coinquestx:quick-actions-toggle",
      handleQuickActionsToggle
    );

    return () => {
      window.removeEventListener(
        "coinquestx:quick-actions-toggle",
        handleQuickActionsToggle
      );
    };
  }, []);

  useEffect(() => {
    if (!isReady || !isOpen || messages.length > 0) return;
    const welcome = getWelcomeMessage();
    setMessages([
      {
        id: createId(),
        sender: "bot",
        text: welcome.text,
        topic: welcome.topic,
        actions: welcome.actions,
        isTyping: false,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [getWelcomeMessage, isOpen, isReady, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => () => clearTypingTimers(), []);

  useEffect(
    () => () => {
      if (!audioContextRef.current) return;
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    },
    []
  );

  if (isQuickActionsOpen) {
    return null;
  }

  return (
    <div className={`fixed right-6 z-50 ${widgetBottomClass}`}>
      {isOpen ? (
        <div className={`relative flex h-[39rem] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-[1.8rem] border backdrop-blur-xl ${chatShellClass}`}>
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/80 to-transparent" />
          <div className={`border-b p-4 ${chatHeaderClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className={`rounded-[1.15rem] border p-2.5 ${badgeFrameClass}`}>
                  {renderLivechatBadge({ size: "sm", beam: true })}
                </div>
                <div className="min-w-0">
                  <h3 className={`truncate text-[1.12rem] font-bold leading-none ${headerTitleClass}`}>
                    CoinQuestX Livechat
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOptions((value) => !value)}
                  className={`rounded-2xl border p-2 transition ${iconButtonClass}`}
                >
                  <Settings2 className="h-4 w-4" strokeWidth={2.2} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`rounded-2xl border p-2 transition ${iconButtonClass}`}
                >
                  <X className="h-4 w-4" strokeWidth={2.3} />
                </button>
              </div>
            </div>
          </div>

          {showOptions && (
            <div className={`absolute right-4 top-28 z-10 w-60 overflow-hidden rounded-[1.25rem] border ${optionsMenuClass}`}>
              <button
                onClick={handleToggleSound}
                className={`flex w-full items-center border-b px-4 py-3 text-left text-sm transition ${optionsButtonClass}`}
              >
                <div className="mr-3">
                  {soundEnabled ? (
                    <Volume2
                      className={`h-4 w-4 ${isDark ? "text-teal-300" : "text-teal-600"}`}
                      strokeWidth={2.2}
                    />
                  ) : (
                    <VolumeX className="h-4 w-4 text-slate-500" strokeWidth={2.2} />
                  )}
                </div>
                Sound {soundEnabled ? "On" : "Off"}
              </button>
              <button
                onClick={() => {
                  clearTypingTimers();
                  setIsTyping(false);
                  setMessages([]);
                  setShowOptions(false);
                }}
                className={`flex w-full items-center px-4 py-3 text-left text-sm transition ${optionsButtonClass}`}
              >
                <div className="mr-3">
                  <Trash2
                    className={`h-4 w-4 ${isDark ? "text-rose-300" : "text-rose-500"}`}
                    strokeWidth={2.2}
                  />
                </div>
                Clear conversation
              </button>
              <div className={`flex items-center border-t px-4 py-3 text-xs ${optionsFooterClass}`}>
                <Lock className="mr-2 h-3.5 w-3.5 text-slate-500" strokeWidth={2.2} />
                Session stored on this browser
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className={`grid grid-cols-3 gap-2 border-b px-4 py-3 ${statusStripClass}`}>
              {statusCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`relative overflow-hidden rounded-[1.2rem] border p-3 ${statusCardClass}`}
                  >
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`} />
                    <div className="relative flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-2xl ${statusIconClass}`}>
                        <Icon className="h-4 w-4" strokeWidth={2.4} />
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[10px] uppercase tracking-[0.18em] ${statusLabelClass}`}>{card.label}</p>
                        <p className={`truncate text-xs font-semibold ${statusValueClass}`}>{card.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={`flex-1 overflow-y-auto p-4 ${messagesSurfaceClass}`}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative max-w-[88%] rounded-[1.35rem] px-4 py-3 ${
                      message.sender === "user"
                        ? "rounded-br-md bg-[linear-gradient(135deg,rgba(13,148,136,0.98),rgba(8,145,178,0.96))] text-white shadow-[0_10px_30px_rgba(13,148,136,0.28)]"
                        : botBubbleClass
                    }`}
                  >
                    {message.sender === "bot" && !message.isTyping && (
                      <div className={`absolute -left-2 -top-2 rounded-full border-2 p-0.5 ${botBadgeWrapClass}`}>
                        {renderLivechatBadge({ size: "sm" })}
                      </div>
                    )}
                    <div className="whitespace-pre-line break-words">
                      {message.text || (message.isTyping && (
                        <div className="flex space-x-1 py-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                        </div>
                      ))}
                    </div>
                    {!message.isTyping && message.sender === "bot" && message.actions?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <button
                            key={`${message.id}-${action.label}-${action.to || action.prompt || ""}`}
                            onClick={() => handleActionClick(action)}
                            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              action.variant === "primary"
                                ? isDark
                                  ? "border-teal-400/24 bg-teal-500/12 text-teal-100 hover:bg-teal-500/20"
                                  : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                                : secondaryActionClass
                            }`}
                          >
                            {action.label}
                            <ArrowUpRight className="ml-1 h-3 w-3" strokeWidth={2.4} />
                          </button>
                        ))}
                      </div>
                    )}
                    {!message.isTyping && (
                      <div
                        className={`mt-2 text-xs ${
                          message.sender === "user"
                            ? "text-teal-100/70"
                            : isDark
                              ? "text-slate-500"
                              : "text-slate-400"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className={`border-t px-4 pb-1 pt-2 ${promptStripClass}`}>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => submitQuery(prompt)}
                  disabled={isTyping}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50 ${promptChipClass}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className={`p-4 ${composerClass}`}>
            <div className="flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitQuery(inputValue);
                  }
                }}
                placeholder="Send message"
                rows={1}
                className={`min-h-[56px] flex-1 resize-none rounded-[1.2rem] border px-4 py-3 text-sm focus:outline-none ${textareaClass}`}
              />
              <button
                onClick={() => submitQuery(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-500 text-slate-950 shadow-[0_0_28px_rgba(45,212,191,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendHorizonal className="h-4 w-4" strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Open CoinQuestX livechat"
          onClick={() => {
            setIsOpen(true);
            setSuggestedPrompts(contextualPrompts);
          }}
          className={`group relative grid h-16 w-16 place-items-center overflow-hidden rounded-[1.45rem] border transition-all hover:-translate-y-0.5 ${
            useDashboardPulseLauncher ? dashboardPulseLauncherClass : launcherClass
          }`}
        >
          {useDashboardPulseLauncher ? (
            <span className="pointer-events-none relative flex h-11 w-11 items-center justify-center rounded-[1rem] bg-gradient-to-br from-teal-300 via-teal-400 to-cyan-500 text-white shadow-[0_0_20px_rgba(45,212,191,0.34)]">
              <FontAwesomeIcon icon={faBitcoin} className="text-lg" />
            </span>
          ) : (
            <>
              <span className="pointer-events-none absolute -inset-3 animate-pulse bg-[radial-gradient(circle,_rgba(45,212,191,0.2),_transparent_62%)] opacity-95 blur-xl" />
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(45,212,191,0.24),_transparent_34%)] opacity-90" />
              <span className={`pointer-events-none absolute inset-[5px] rounded-[1.15rem] border ${launcherInnerBorderClass}`} />
              <span className="pointer-events-none absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,0.95)] animate-pulse" />
              <span
                className={`pointer-events-none absolute inset-0 rounded-[1.45rem] ring-1 ${
                  isDark
                    ? "ring-teal-300/14 group-hover:ring-teal-200/28"
                    : "ring-teal-300/18 group-hover:ring-teal-300/34"
                }`}
              />
              <span className="pointer-events-none absolute inset-[-6px] rounded-[1.7rem] border border-teal-300/18 animate-ping [animation-duration:2.2s]" />
              {renderLivechatBadge({ size: "md", beam: true })}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatBot;
