const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_COPY_TRADE_CYCLE_DAYS = 30;
const DEFAULT_BOT_CYCLE_DAYS = 30;

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeStatus = (value) => `${value || ""}`.trim().toLowerCase();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getCopyTradeGrowthMultiplier = (amount) => {
  const normalizedCapital = clamp(Math.max(0, amount) / 700, 0, 4);
  return 1.04 + Math.expm1(normalizedCapital * 0.3) * 0.5;
};

const toTimestamp = (value, fallback = Date.now()) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const getTimedProgress = ({
  startAt,
  endAt,
  durationMs,
  now = Date.now(),
}) => {
  const safeStart = toTimestamp(startAt, now);
  const safeDuration =
    toNumber(durationMs, 0) > 0
      ? toNumber(durationMs, 0)
      : Math.max(1, toTimestamp(endAt, safeStart) - safeStart);
  const elapsedMs = Math.max(0, now - safeStart);

  return {
    startAt: safeStart,
    endAt: safeStart + safeDuration,
    durationMs: safeDuration,
    elapsedMs,
    progress: clamp(elapsedMs / safeDuration, 0, 1),
  };
};

export const getCopyTradeMetrics = (trade, now = Date.now()) => {
  const amount = Math.max(
    0,
    toNumber(trade?.investmentAmount, toNumber(trade?.amount))
  );
  const performance = Math.max(0, toNumber(trade?.performance));
  const profitShare = clamp(
    Math.max(
      0,
      toNumber(
        trade?.profitShare,
        toNumber(trade?.traderData?.profitShare, 0)
      )
    ),
    0,
    100
  );
  const persistedSettledProfit = Math.max(
    0,
    toNumber(
      trade?.settledProfit,
      toNumber(
        trade?.realizedProfit,
        toNumber(
          trade?.traderData?.settledProfit,
          toNumber(trade?.traderData?.realizedProfit, 0)
        )
      )
    )
  );
  const cycleDays = Math.max(
    1,
    toNumber(trade?.cycleDays, DEFAULT_COPY_TRADE_CYCLE_DAYS)
  );
  const status = normalizeStatus(trade?.status);
  const timing = getTimedProgress({
    startAt: trade?.copiedAt || trade?.createdAt,
    durationMs: cycleDays * DAY_MS,
    now,
  });
  const profitShareBoostRate = Math.min(0.04, profitShare / 700);
  const cycleReturnRate =
    performance > 0
      ? Math.min(
          0.7,
          ((performance / 100) + profitShareBoostRate) *
            getCopyTradeGrowthMultiplier(amount)
        )
      : 0;
  const projectedValue = amount * (1 + cycleReturnRate);
  const projectedProfit = Math.max(0, projectedValue - amount);
  const compoundedValue =
    amount > 0 ? amount * Math.pow(Math.max(1, projectedValue / amount), timing.progress) : 0;
  const computedAccruedProfit =
    status === "completed"
      ? projectedProfit
      : ["active", "paused"].includes(status)
      ? Math.max(0, compoundedValue - amount)
      : 0;
  const totalAccruedProfit = Math.max(computedAccruedProfit, persistedSettledProfit);
  const settledProfit = Math.min(totalAccruedProfit, persistedSettledProfit);
  const pendingProfit = Math.max(0, totalAccruedProfit - settledProfit);

  return {
    amount,
    performance,
    cycleDays,
    progress: timing.progress,
    projectedProfit,
    accruedProfit: totalAccruedProfit,
    settledProfit,
    pendingProfit,
    currentValue: amount + pendingProfit,
    daysLeft: Math.max(0, Math.ceil((timing.endAt - now) / DAY_MS)),
  };
};

export const getBuyBotMetrics = (bot, now = Date.now()) => {
  const capital = Math.max(
    0,
    toNumber(bot?.budget, toNumber(bot?.price))
  );
  const monthlyRoi = Math.max(
    0,
    toNumber(bot?.monthlyRoi, toNumber(bot?.settings?.monthlyRoi))
  );
  const status = normalizeStatus(bot?.status);
  const createdAt = toTimestamp(bot?.createdAt, now);
  const stopAt =
    status === "active" ? now : toTimestamp(bot?.updatedAt, createdAt);
  const elapsedMs = Math.max(0, stopAt - createdAt);
  const computedAccruedProfit =
    monthlyRoi > 0
      ? capital *
        (monthlyRoi / 100) *
        (elapsedMs / (DEFAULT_BOT_CYCLE_DAYS * DAY_MS))
      : 0;
  const persistedGeneratedProfit = Math.max(
    0,
    toNumber(bot?.generatedProfit, toNumber(bot?.settings?.generatedProfit, 0))
  );
  const accruedProfit = Math.max(computedAccruedProfit, persistedGeneratedProfit);

  return {
    capital,
    monthlyRoi,
    accruedProfit,
    generatedProfit: persistedGeneratedProfit,
    currentValue: capital + accruedProfit,
    elapsedMs,
    activeDays: elapsedMs / DAY_MS,
  };
};

export const getRealEstateMetrics = (investment, now = Date.now()) => {
  const principalUsd = Math.max(0, toNumber(investment?.amount));
  const durationDays = Math.max(
    1,
    toNumber(investment?.duration, toNumber(investment?.durationDays, 30))
  );
  const explicitPayoutUsd = Math.max(0, toNumber(investment?.payoutUsd, 0));
  const expectedPayoutUsd = Math.max(
    principalUsd,
    explicitPayoutUsd,
    toNumber(
      investment?.expectedPayoutUsd,
      principalUsd + (principalUsd * toNumber(investment?.roi)) / 100
    )
  );
  const expectedProfitUsd = Math.max(0, expectedPayoutUsd - principalUsd);
  const explicitProfitUsd = Math.max(0, explicitPayoutUsd - principalUsd);
  const status = normalizeStatus(investment?.status);
  const timing = getTimedProgress({
    startAt: investment?.startDate || investment?.createdAt,
    endAt: investment?.endDate,
    durationMs: durationDays * DAY_MS,
    now,
  });
  const computedAccruedProfit =
    status === "completed"
      ? expectedProfitUsd
      : status === "active" || status === "pending"
      ? expectedProfitUsd * timing.progress
      : 0;
  const accruedProfit = Math.max(computedAccruedProfit, explicitProfitUsd);

  return {
    principalUsd,
    durationDays,
    expectedPayoutUsd,
    payoutUsd: explicitPayoutUsd,
    expectedProfitUsd,
    accruedProfit,
    progress: timing.progress,
    daysLeft: Math.max(0, Math.ceil((timing.endAt - now) / DAY_MS)),
    isMatured: now >= timing.endAt,
  };
};
