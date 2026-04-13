export const TRUST_PAGE_ORDER = [
  "fees",
  "risk",
  "terms",
  "privacy",
  "amlKyc",
  "proof",
];

export const TRUST_PAGES = {
  fees: {
    title: "Fees & Charges",
    eyebrow: "Trust Center",
    description:
      "A plain-language guide to how CoinQuestX applies platform, network, and review-related charges across funding, withdrawals, and account services.",
    updatedAt: "March 30, 2026",
    highlights: [
      "Platform fees are shown before a user confirms a service flow whenever a charge applies.",
      "Blockchain or payment-network charges may vary by asset, chain, and destination.",
      "Admin review or manual settlement may affect timing, but does not create hidden balance deductions.",
    ],
    sections: [
      {
        heading: "Core fee principles",
        paragraphs: [
          "CoinQuestX aims to surface the relevant wallet, trading, or service fee before a user confirms a request. When a third-party network fee applies, that cost can change with chain congestion or payout method.",
          "Some platform features are subscription-based or plan-based. Those charges are disclosed in the relevant flow and reflected in transaction history after confirmation.",
        ],
        bullets: [
          "Deposit processing may include asset-specific network cost or manual verification delay.",
          "Withdrawal requests can require destination approval, email OTP confirmation, and admin review before completion.",
          "Subscription, staking, mining, signal, bot, and copy-trade flows may use plan pricing shown inside each module.",
        ],
      },
      {
        heading: "When fees may change",
        paragraphs: [
          "External blockchain fees, payment rail costs, or compliance-related review steps can change without advance notice. CoinQuestX may update displayed costs to reflect the latest operational or network conditions.",
        ],
        bullets: [
          "Users should review the final confirmation amount before submitting a request.",
          "If a transaction cannot be completed, refunds or reversals follow the status shown in the transaction log and any applicable review notes.",
        ],
      },
    ],
  },
  risk: {
    title: "Risk Disclosure",
    eyebrow: "Trust Center",
    description:
      "A summary of the operational, market, liquidity, and compliance risks that users accept when they fund an account or use any trading-linked feature on CoinQuestX.",
    updatedAt: "March 30, 2026",
    highlights: [
      "Digital asset and yield-linked products carry loss risk.",
      "Past performance, projected ROI, or modeled outcomes do not guarantee future results.",
      "Delays can occur from KYC, AML review, admin settlement, network congestion, or provider downtime.",
    ],
    sections: [
      {
        heading: "Market and product risk",
        paragraphs: [
          "Crypto assets, trading products, and yield-linked strategies can move sharply in value and may result in partial or total loss. Modeled returns, trader performance figures, or dashboard projections should not be treated as guaranteed outcomes.",
          "Users are responsible for understanding the product they activate, the holding period involved, and whether the feature requires admin review or delayed settlement.",
        ],
        bullets: [
          "Losses can occur on manual trades, copy trades, staking, mining, and other performance-linked products.",
          "Historical charts, ROI examples, and trader win rates are informational only.",
          "Users should not risk funds they cannot afford to lose.",
        ],
      },
      {
        heading: "Operational and liquidity risk",
        paragraphs: [
          "Withdrawals, deposits, and account actions may be paused, reviewed, or delayed for compliance, fraud prevention, security checks, or infrastructure maintenance. Availability of liquidity remains subject to internal settlement and operational controls.",
        ],
        bullets: [
          "Wallet destination whitelisting and email OTP approval are part of payout protection.",
          "KYC and AML review may restrict access to certain features until verification is complete.",
          "Service interruptions, stale sessions, or third-party outages may affect response times.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    eyebrow: "Trust Center",
    description:
      "The baseline terms that govern account access, acceptable use, platform operations, and the responsibilities of both CoinQuestX and its users.",
    updatedAt: "March 30, 2026",
    highlights: [
      "Users must provide accurate identity and payment information.",
      "Accounts can be restricted for fraud, abuse, sanctions exposure, or policy violations.",
      "Platform access may be suspended while a balance, KYC, or security issue is reviewed.",
    ],
    sections: [
      {
        heading: "Account use",
        paragraphs: [
          "By creating a CoinQuestX account, a user agrees to provide accurate information, maintain current contact details, and keep credentials private. Shared, misleading, or unauthorized account access is prohibited.",
          "CoinQuestX may suspend, restrict, or terminate access where fraud, abuse, policy breaches, or regulatory concerns are identified.",
        ],
        bullets: [
          "Users are responsible for activity performed from their authenticated sessions.",
          "False KYC submissions, manipulated payment proof, or abusive support activity may result in closure.",
          "Platform features may change, pause, or be removed as operations evolve.",
        ],
      },
      {
        heading: "Service boundaries",
        paragraphs: [
          "CoinQuestX provides account, funding, support, and platform management workflows. Feature access may depend on KYC status, subscription plan, security settings, or internal review outcome.",
          "Nothing on the platform should be treated as guaranteed investment advice, tax advice, or legal advice.",
        ],
        bullets: [
          "Users remain responsible for local tax and reporting obligations.",
          "CoinQuestX may update these terms as product, security, or compliance requirements change.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Trust Center",
    description:
      "How CoinQuestX collects, uses, stores, and shares account, support, transaction, and verification data to operate the platform safely.",
    updatedAt: "March 30, 2026",
    highlights: [
      "CoinQuestX stores profile, transaction, support, and verification data needed to operate the platform.",
      "Security events, device details, and audit history may be retained to protect accounts and investigate misuse.",
      "Data may be processed by infrastructure and email providers needed to deliver the service.",
    ],
    sections: [
      {
        heading: "What data CoinQuestX uses",
        paragraphs: [
          "CoinQuestX collects account profile details, contact information, KYC records, support conversations, transaction logs, security events, and notification preferences to operate the service and protect users.",
          "The platform may also store device hints, login timing, wallet destination approvals, and immutable ledger data for fraud prevention and audit visibility.",
        ],
        bullets: [
          "Identity data is used for account verification and compliance review.",
          "Transaction and ledger data is used for balance integrity and dispute review.",
          "Support message history is used to resolve service issues and track SLA status.",
        ],
      },
      {
        heading: "Sharing and retention",
        paragraphs: [
          "CoinQuestX may use third-party service providers for infrastructure, communications, analytics, and email delivery. Data is retained for operational, legal, compliance, and security purposes where required.",
        ],
        bullets: [
          "Email notifications may be delivered through integrated mail providers such as Brevo.",
          "Operational records may be retained after account closure where required for fraud prevention, tax, or legal defense.",
        ],
      },
    ],
  },
  amlKyc: {
    title: "AML & KYC Policy",
    eyebrow: "Trust Center",
    description:
      "The identity, source-of-funds, and monitoring controls CoinQuestX uses to review accounts, approve protected features, and respond to suspicious activity.",
    updatedAt: "March 30, 2026",
    highlights: [
      "Protected wallet and trading flows can require successful KYC review.",
      "Accounts may be paused for identity mismatch, document issues, or suspicious activity review.",
      "CoinQuestX may request more information where a transaction or profile requires enhanced review.",
    ],
    sections: [
      {
        heading: "Verification standards",
        paragraphs: [
          "Users may be asked to provide legal identity details, government-issued identification, selfie verification, address information, and related supporting evidence before protected features are enabled.",
          "Submitted details should match the source documents exactly. Inconsistent, expired, cropped, or unclear records may delay review or lead to rejection.",
        ],
        bullets: [
          "KYC may be required before deposits, withdrawals, or premium trading tools are available.",
          "Enhanced review may apply where documents, account activity, or payment patterns appear inconsistent.",
          "Repeated failed submissions or suspected misuse can lead to account restriction.",
        ],
      },
      {
        heading: "Monitoring and escalation",
        paragraphs: [
          "CoinQuestX may monitor transaction behavior, destination changes, login activity, and support history to identify fraud or abuse. Reviews can include wallet destination approval checks, withdrawal cooldowns, and email OTP challenges.",
        ],
        bullets: [
          "Suspicious activity may lead to additional verification or temporary suspension.",
          "CoinQuestX may decline or reverse requests where policy requirements are not met.",
        ],
      },
    ],
  },
  proof: {
    title: "Proof of Process",
    eyebrow: "Trust Center",
    description:
      "A transparent summary of the control points CoinQuestX uses across deposits, KYC, security, support, balance changes, and withdrawals.",
    updatedAt: "March 30, 2026",
    highlights: [
      "Protected actions can require email OTP confirmation and destination whitelisting.",
      "Balance-changing events are recorded into an immutable ledger with before/after values and reason metadata.",
      "Support tickets track priority, SLA target, conversation history, and admin reply timing.",
    ],
    sections: [
      {
        heading: "Funding and withdrawal controls",
        paragraphs: [
          "Deposit requests can remain pending until evidence or review steps are complete. Withdrawal requests can require an approved destination, active protection settings, and email OTP confirmation before they are accepted.",
          "Cooldown rules and destination whitelisting help reduce rapid payout abuse and unauthorized account drain attempts.",
        ],
        bullets: [
          "Destination approval is tied to a wallet whitelist entry.",
          "Protected withdrawals can trigger a time-limited verification code.",
          "Payout history remains visible through transaction tracking and admin review tools.",
        ],
      },
      {
        heading: "Audit and support controls",
        paragraphs: [
          "CoinQuestX stores immutable ledger entries for balance mutations and keeps admin event logs for operational oversight. Support threads track message history, priority, SLA target, and current resolution state.",
          "Operational notifications can also be delivered by email for deposits, withdrawals, KYC review, support replies, referral rewards, trade closeouts, and subscription expiry.",
        ],
        bullets: [
          "Each ledger row stores delta, balance before, balance after, reason, actor, and chain hash references.",
          "Support threads are categorized and prioritized so users and admins can follow a documented workflow.",
        ],
      },
    ],
  },
};
