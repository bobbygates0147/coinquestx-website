import {
  buildCopyTraderDisplayName,
  ensureUniqueCopyTraderNames,
} from "../utils/copyTraderIdentity";

const STRATEGIES = [
  "Scalp Momentum",
  "Swing Precision",
  "News Breakout",
  "Grid Hybrid",
  "Trend Follow",
  "Arbitrage Pair",
  "Mean Reversion",
  "Volatility Capture",
];

const seeded = (seed) => {
  const value = Math.sin(seed * 99991) * 10000;
  return value - Math.floor(value);
};

const seededInt = (seed, min, max) =>
  Math.floor(seeded(seed) * (max - min + 1)) + min;

const seededFixed = (seed, min, max, digits = 2) =>
  Number((seeded(seed) * (max - min) + min).toFixed(digits));

const buildFallbackAvatar = (name, index) => {
  const palette = [
    ["#0d9488", "#0f766e"],
    ["#0891b2", "#0e7490"],
    ["#0284c7", "#0369a1"],
    ["#16a34a", "#15803d"],
    ["#f59e0b", "#d97706"],
  ];

  const [from, to] = palette[index % palette.length];
  const initials = name
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='240' height='240' fill='url(#g)'/><circle cx='120' cy='90' r='34' fill='rgba(255,255,255,.24)'/><rect x='62' y='138' width='116' height='58' rx='28' fill='rgba(255,255,255,.18)'/><text x='120' y='138' font-family='Poppins,Segoe UI,sans-serif' font-size='54' font-weight='700' text-anchor='middle' fill='white'>${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const buildHumanAvatarUrl = (index) => {
  const pick = index % 2 === 0 ? "women" : "men";
  const photoIndex = index % 100;
  return `https://randomuser.me/api/portraits/${pick}/${photoIndex}.jpg`;
};

const buildImageUrl = (index) => {
  // Mix profile styles: mostly human photos, with some neutral market visuals.
  if (index % 3 !== 2) {
    return buildHumanAvatarUrl(index);
  }
  return `https://picsum.photos/seed/coinquestx-copy-${index + 1}/320/320`;
};

export const COPY_TRADERS_SEED = ensureUniqueCopyTraderNames(
  Array.from({ length: 100 }, (_, index) => {
    const id = index + 1;
    const name = buildCopyTraderDisplayName(`seed:${id}`);
    const copyPrice = seededFixed(id * 7, 85, 2400);
    const winRate = seededInt(id * 13, 68, 96);
    const profitShare = seededInt(id * 17, 10, 30);
    const totalTrades = seededInt(id * 19, 120, 1700);
    const wins = Math.round((totalTrades * winRate) / 100);
    const losses = Math.max(1, totalTrades - wins);
    const performance = seededInt(id * 23, 8, 30);
    const balance = seededFixed(id * 29, 250, 9600);

    return {
      id,
      name,
      strategy: STRATEGIES[index % STRATEGIES.length],
      winRate,
      profitShare,
      performance,
      balance,
      copyPrice,
      wins,
      losses,
      image: buildImageUrl(index),
      fallbackImage: buildFallbackAvatar(name, index),
    };
  })
);
