const FIRST_NAMES = [
  "Ava",
  "Liam",
  "Nora",
  "Ethan",
  "Zara",
  "Mason",
  "Lena",
  "Lucas",
  "Mila",
  "Noah",
  "Aria",
  "Elijah",
  "Ivy",
  "Logan",
  "Cora",
  "Owen",
  "Jade",
  "Asher",
  "Skye",
  "Leo",
  "Eva",
  "Miles",
  "Sage",
  "Kai",
  "Clara",
  "Rowan",
  "Thea",
  "Hudson",
  "Esme",
  "Finn",
];

const LAST_NAMES = [
  "Sterling",
  "Monroe",
  "Vega",
  "Bennett",
  "Kensington",
  "Hart",
  "Mercer",
  "Sloane",
  "Calloway",
  "Prescott",
  "Hayes",
  "Wilder",
  "Sinclair",
  "Parker",
  "Ellison",
  "Hawthorne",
  "Donovan",
  "Winslow",
  "Lennox",
  "Whitaker",
];

const DESK_TAGS = [
  "Apex",
  "Atlas",
  "Catalyst",
  "Crest",
  "Northstar",
  "Prime",
  "Pulse",
  "Signal",
  "Summit",
  "Vector",
  "Vertex",
  "Vista",
];

const GENERIC_TRADER_NAMES = new Set([
  "",
  "trader",
  "copy trader",
  "copytrade",
  "copy trade",
  "managed strategy",
  "managed trader",
  "market trader",
  "signal trader",
]);

const normalizeName = (value) => `${value || ""}`.trim().replace(/\s+/g, " ");

const hashString = (value) => {
  const input = normalizeName(value).toLowerCase() || "coinquestx-trader";
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

export const isMeaningfulCopyTraderName = (value) => {
  const normalized = normalizeName(value);
  if (!normalized) return false;

  return !GENERIC_TRADER_NAMES.has(normalized.toLowerCase());
};

export const buildCopyTraderDisplayName = (seedValue) => {
  const hash = hashString(seedValue);
  const first = FIRST_NAMES[hash % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(hash / FIRST_NAMES.length) % LAST_NAMES.length];
  return `${first} ${last}`;
};

export const buildCopyTraderDeskTag = (seedValue) =>
  DESK_TAGS[hashString(`desk:${seedValue}`) % DESK_TAGS.length];

export const resolveCopyTraderDisplayName = ({
  preferredName,
  traderName,
  fallbackName,
  sourceId,
  backendId,
  strategy,
} = {}) => {
  const explicitName = [preferredName, traderName, fallbackName].find(
    isMeaningfulCopyTraderName
  );

  if (explicitName) {
    return normalizeName(explicitName);
  }

  return buildCopyTraderDisplayName(
    [sourceId, backendId, strategy].filter(Boolean).join(":")
  );
};

export const ensureUniqueCopyTraderNames = (traders = []) => {
  const seenNames = new Map();

  return traders.map((trader, index) => {
    const baseName = resolveCopyTraderDisplayName({
      preferredName: trader?.name,
      traderName: trader?.traderName,
      fallbackName: trader?.alias,
      sourceId: trader?.sourceTraderId,
      backendId: trader?.backendId,
      strategy: trader?.strategy,
    });
    const lookupKey = baseName.toLowerCase();
    const duplicateCount = seenNames.get(lookupKey) || 0;
    seenNames.set(lookupKey, duplicateCount + 1);

    const uniqueName =
      duplicateCount === 0
        ? baseName
        : `${baseName} ${buildCopyTraderDeskTag(
            `${trader?.sourceTraderId || trader?.backendId || index}-${duplicateCount}`
          )}`;

    return {
      ...trader,
      name: uniqueName,
      traderName: uniqueName,
    };
  });
};
