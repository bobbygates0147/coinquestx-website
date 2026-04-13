const CryptoQuestions = [
  {
    keyword: "price",
    response:
      "Use Assets to follow live market prices, watchlist movement, and portfolio trends. If you want a quick direction, ask me which page to open for market tracking.",
    examples: ["price of BTC", "ETH value", "SOL cost"],
    component: "AssetPage",
  },
  {
    keyword: "portfolio",
    response:
      "Your Dashboard gives the fastest overview of balance, activity, and account progress. Transactions is the best place to review detailed funding and withdrawal history.",
    examples: ["my balance", "portfolio value", "current holdings"],
    component: "AssetPage",
  },
  {
    keyword: "register",
    response:
      "Create your account with your basic details, then sign in to unlock the dashboard and verification flow. Once you are inside, I can guide your next setup step.",
    examples: ["how to register", "create account", "sign up"],
    component: null,
  },
  {
    keyword: "login",
    response:
      "Use your registered email and password to sign in. If you cannot access the account, use the password reset flow and try again.",
    examples: ["how to login", "sign in", "access account"],
    component: null,
  },
  {
    keyword: "dashboard",
    response:
      "The dashboard links your wallet, trading tools, copy trading, bots, mining, staking, referrals, account controls, alerts, and support in one place. Ask about any module and I will point you to the right one.",
    examples: ["dashboard features", "what can i do", "available modules"],
    component: null,
  },
  {
    keyword: "buy",
    response:
      "Use Buy Crypto when you want to purchase digital assets directly, or use Deposits when you already have funds to add to your wallet balance.",
    examples: ["how to buy ETH", "purchase BTC", "get SOL"],
    component: "BuyCrypto",
  },
  {
    keyword: "account",
    response:
      "Account settings cover profile updates, password changes, email updates, photo updates, and verification status. It is the right place to keep your details current.",
    examples: ["change password", "update email", "account settings"],
    component: "AccountSetPage",
  },
  {
    keyword: "kyc",
    response:
      "KYC asks for your legal identity details, country, ID type, document number, proof images, and a selfie with the document. Completing it unlocks protected wallet and trading features.",
    examples: ["verify my account", "kyc form", "identity verification"],
    component: null,
  },
  {
    keyword: "bot",
    response:
      "Buy Bots lets you compare automation plans before activation. Make sure your balance is funded and your verification is complete before activating a bot plan.",
    examples: ["trading bots", "auto trading", "best bot"],
    component: "BuyBotPage",
  },
  {
    keyword: "signal",
    response:
      "Daily Signal gives you market callouts, trade ideas, and plan-based access. If you want signals, I can guide you to the subscription area first.",
    examples: ["trading signals", "daily alerts", "best signals"],
    component: "DailySignalPage",
  },
  {
    keyword: "mine",
    response:
      "Mining presents available packages, cycles, and expected outcome tracking. Before starting, make sure your wallet and KYC status are ready.",
    examples: ["how to mine", "mining profits", "crypto mining"],
    component: "MiningPage",
  },
  {
    keyword: "real estate",
    response:
      "Real Estate is the long-term investment section for property-backed opportunities and projected returns. It works best once your account setup and funding are complete.",
    examples: ["property investment", "real estate", "tokenized assets"],
    component: "RealestPage",
  },
  {
    keyword: "deposit",
    response:
      "Deposits is where you fund the wallet, review supported payment methods, and follow the payment-proof step if your transfer needs manual confirmation.",
    examples: ["add funds", "deposit money", "fund account"],
    component: "DepositPage",
  },
  {
    keyword: "withdraw",
    response:
      "Use Withdrawal to request payouts from your balance. The safest order is KYC first, then funding history, then withdrawal review through Transactions.",
    examples: ["send crypto", "withdraw funds", "transfer out"],
    component: "DepositPage",
  },
  {
    keyword: "transaction",
    response:
      "Transactions is the audit trail for deposits, withdrawals, and other wallet activity. It is the fastest way to check what is pending, completed, or needs attention.",
    examples: ["history", "payment status", "transaction log"],
    component: null,
  },
  {
    keyword: "copy",
    response:
      "Copy Trade helps you follow traders, manage copied positions, and review ongoing performance. I can guide you to discovery or to your active copied trader list.",
    examples: ["copy trade", "follow trader", "copied positions"],
    component: null,
  },
  {
    keyword: "referral",
    response:
      "Referrals gives you your invite link, performance tracking, and reward visibility. It is the right place to share access and monitor earned activity.",
    examples: ["invite friends", "referral bonus", "earn from referrals"],
    component: "ReferralsPage",
  },
  {
    keyword: "security",
    response:
      "Keep the account secure by using a strong password, current profile details, completed KYC, and regular checks on transactions and alerts.",
    examples: ["account safety", "protect assets", "security tips"],
    component: "AccountSetPage",
  },
  {
    keyword: "fees",
    response:
      "Fees depend on the module, network, and payment path you use. The exact amount is usually shown inside the related deposit, withdrawal, or trading screen before you confirm.",
    examples: ["trading fees", "withdrawal costs", "transaction fees"],
    component: null,
  },
  {
    keyword: "stake",
    response:
      "Stake is designed for locked earning plans with projected returns over time. If you want help comparing it to mining or bots, ask me which one fits your goal.",
    examples: ["staking rewards", "earn interest", "passive income"],
    component: "MiningPage",
  },
  {
    keyword: "message",
    response:
      "Messages is the account inbox for direct admin conversations when your plan includes that access. Help remains available for general guidance at any time.",
    examples: ["support inbox", "chat with admin", "messages"],
    component: null,
  },
  {
    keyword: "news",
    response:
      "Assets is the better place for market movement and price context. For platform help, ask about account setup, KYC, funding, trading tools, or support.",
    examples: ["crypto updates", "latest news", "market news"],
    component: "AssetPage",
  },
];

CryptoQuestions.forEach((item) => {
  if (!item.response.includes("?")) {
    item.response += "\n\nNeed more details? Ask a follow-up question.";
  }
});

CryptoQuestions.push(
  {
    keyword: "hello",
    response:
      "Hello. I can guide you through account setup, KYC, wallet funding, trading tools, withdrawals, referrals, and support. What are you trying to do right now?",
    examples: ["hi", "hey", "hello"],
    component: null,
  },
  {
    keyword: "thank",
    response: "You are welcome. Ask another CoinQuestX question whenever you need the next step.",
    examples: ["thanks", "appreciate", "thank you"],
    component: null,
  },
  {
    keyword: "how are you",
    response:
      "I am ready to guide you through your account and platform features. Ask about setup, KYC, funding, trading modules, or support.",
    examples: ["how are you", "how is it going"],
    component: null,
  }
);

export default CryptoQuestions;
