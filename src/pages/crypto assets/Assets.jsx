import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useParams } from "react-router-dom";
import axios from "axios";

const CRYPTO_COMPARE_NEWS_URL =
  "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";
const REDDIT_NEWS_URL =
  "https://www.reddit.com/r/CryptoCurrency/hot.json?limit=10";
const REDDIT_BITCOIN_NEWS_URL =
  "https://www.reddit.com/r/Bitcoin/hot.json?limit=10";
const NEWS_PLACEHOLDER_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'><defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230f172a'/><stop offset='100%' stop-color='%23134e4a'/></linearGradient></defs><rect width='320' height='180' fill='url(%23bg)'/><circle cx='72' cy='58' r='18' fill='%2322d3ee' opacity='0.75'/><rect x='38' y='92' width='244' height='14' rx='7' fill='%23cbd5e1' opacity='0.85'/><rect x='38' y='114' width='188' height='12' rx='6' fill='%2394a3b8' opacity='0.8'/><text x='38' y='44' fill='%23ffffff' font-family='Arial, sans-serif' font-size='18' font-weight='700'>LIVE CRYPTO NEWS</text></svg>`;
const NEWS_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  NEWS_PLACEHOLDER_SVG
)}`;

const isValidHttpUrl = (value = "") => /^https?:\/\//i.test(value);

const decodeHtml = (value = "") =>
  String(value).replace(/&amp;/g, "&").replace(/&#x2F;/g, "/");

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatPublishedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString();
  }
  return date.toLocaleString();
};

const normalizeCryptoCompareNews = (payload) => {
  const articles = Array.isArray(payload?.Data) ? payload.Data : [];

  return articles
    .filter((article) => article?.title && article?.url)
    .slice(0, 5)
    .map((article) => ({
      title: article.title,
      description:
        stripHtml(article.body).slice(0, 140) ||
        `Latest update from ${article?.source_info?.name || "crypto markets"}.`,
      source: article?.source_info?.name || article.source || "Crypto News",
      url: article.url,
      urlToImage: isValidHttpUrl(article.imageurl)
        ? article.imageurl
        : NEWS_PLACEHOLDER,
      publishedAt: article.published_on
        ? formatPublishedAt(Number(article.published_on) * 1000)
        : new Date().toLocaleString(),
    }));
};

const normalizeRedditNews = (payload) => {
  const posts = Array.isArray(payload?.data?.children)
    ? payload.data.children
    : [];

  return posts
    .map((child) => child?.data)
    .filter((post) => post?.title && post?.permalink)
    .slice(0, 5)
    .map((post) => {
      const previewImage = post?.preview?.images?.[0]?.source?.url;
      const imageFromPreview = decodeHtml(previewImage);
      const imageUrl = isValidHttpUrl(imageFromPreview)
        ? imageFromPreview
        : isValidHttpUrl(post.thumbnail)
          ? post.thumbnail
          : NEWS_PLACEHOLDER;
      const summary = stripHtml(post.selftext).slice(0, 140);

      return {
        title: post.title,
        description:
          summary || `r/${post.subreddit} - posted by ${post.author || "user"}`,
        source: `r/${post.subreddit || "CryptoCurrency"}`,
        url: isValidHttpUrl(post.url)
          ? post.url
          : `https://www.reddit.com${post.permalink}`,
        urlToImage: imageUrl,
        publishedAt: post.created_utc
          ? formatPublishedAt(Number(post.created_utc) * 1000)
          : new Date().toLocaleString(),
      };
    });
};

const NEWS_SOURCES = [
  {
    label: "CryptoCompare",
    url: CRYPTO_COMPARE_NEWS_URL,
    normalize: normalizeCryptoCompareNews,
  },
  {
    label: "Reddit CryptoCurrency",
    url: REDDIT_NEWS_URL,
    normalize: normalizeRedditNews,
  },
  {
    label: "Reddit Bitcoin",
    url: REDDIT_BITCOIN_NEWS_URL,
    normalize: normalizeRedditNews,
  },
];

const fetchNormalizedNews = async () => {
  let lastError = null;

  for (const source of NEWS_SOURCES) {
    try {
      const { data } = await axios.get(source.url, { timeout: 12000 });
      const normalizedNews = source.normalize(data);

      if (normalizedNews.length > 0) {
        return normalizedNews;
      }

      lastError = new Error(`${source.label} returned no news`);
    } catch (error) {
      console.warn(`${source.label} news source failed`, error);
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to load any news source");
};

// Helper: Volume formatting
const abbreviateVolume = (volume) => {
  if (volume >= 1_000_000_000)
    return `$${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${volume.toLocaleString()}`;
};

// Individual Crypto Card
const CryptoCard = ({ crypto }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-w-0 bg-gradient-to-r rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 border hover:border-teal-500 hover:shadow-teal-500/50 hover:scale-[1.02] flex items-center ${
        theme === "dark"
          ? "from-slate-900 to-slate-800 border-slate-600"
          : "from-slate-100 to-slate-200 border-gray-300"
      }`}
    >
      <img src={crypto.image} alt={crypto.name} className="w-10 h-10 mr-4" />
      <div className="flex-1 min-w-0">
        <div className="flex min-w-0 justify-between items-center gap-2">
          <span
            className={`text-sm font-medium ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            } truncate`}
          >
            {crypto.name}
          </span>
          <span
            className={`text-sm font-semibold ${
              crypto.change.startsWith("-") ? "text-red-400" : "text-green-400"
            }`}
          >
            {crypto.change}
          </span>
        </div>
        <div className="flex min-w-0 justify-between items-center mt-2 gap-2">
          <h2
            className={`text-lg font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            } truncate`}
          >
            {crypto.price}
          </h2>
          <span
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            } truncate`}
          >
            Vol: {crypto.volume}
          </span>
        </div>
      </div>
    </div>
  );
};

// News Card
const NewsCard = ({ article }) => {
  const { theme } = useTheme();

  const imageUrl = isValidHttpUrl(article.urlToImage)
    ? article.urlToImage
    : NEWS_PLACEHOLDER;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block min-w-0 hover:opacity-80 transition-opacity"
    >
      <div className="flex min-w-0 items-start space-x-4">
        <img
          src={imageUrl}
          alt={article.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = NEWS_PLACEHOLDER;
          }}
          className="w-32 h-32 object-cover rounded-md"
        />
        <div className="min-w-0">
          <h3
            className={`font-semibold text-sm mb-2 line-clamp-2 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {article.title}
          </h3>
          <p
            className={`text-xs line-clamp-3 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {article.description}
          </p>
          <p
            className={`text-[10px] font-semibold mt-1 uppercase tracking-wide ${
              theme === "dark" ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {article.source || "Live Feed"}
          </p>
          <p
            className={`text-[10px] font-semibold mt-1 uppercase tracking-wide ${
              theme === "dark" ? "text-teal-300" : "text-teal-600"
            }`}
          >
            {article.publishedAt}
          </p>
        </div>
      </div>
    </a>
  );
};

// Main Component
export default function AssetPage() {
  const [cryptoData, setCryptoData] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState({ crypto: true, news: true });
  const [error, setError] = useState({ crypto: null, news: null });
  const { theme } = useTheme();
  const { symbol } = useParams();

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "usd",
              ids: "bitcoin,ethereum,tether,ripple,binancecoin,solana,usd-coin,cardano,dogecoin,polkadot,uniswap,litecoin,chainlink,bitcoin-cash,stellar,filecoin,vechain,monero,avalanche-2,polygon,cosmos,tron",
              order: "market_cap_desc",
              per_page: 22,
              page: 1,
              sparkline: false,
            },
          }
        );

        const formattedData = response.data.map((crypto) => ({
          name: crypto.name,
          symbol: crypto.symbol.toUpperCase(),
          price: `$${crypto.current_price.toLocaleString()}`,
          change: `${crypto.price_change_percentage_24h.toFixed(2)}%`,
          volume: abbreviateVolume(crypto.total_volume),
          image: crypto.image,
        }));

        setCryptoData(formattedData);
      } catch (err) {
        console.error("Error fetching crypto data:", err);
        setError((prev) => ({ ...prev, crypto: err.message }));
      } finally {
        setLoading((prev) => ({ ...prev, crypto: false }));
      }
    };

    fetchCryptoData();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading((prev) => ({ ...prev, news: true }));
      setError((prev) => ({ ...prev, news: null }));

      try {
        const normalizedNews = await fetchNormalizedNews();
        setNews(normalizedNews);
      } catch (newsError) {
        console.error("All live news sources failed:", newsError);
        setError((prev) => ({
          ...prev,
          news:
            newsError?.message ||
            "Unable to load live news right now, please try again later.",
        }));
        setNews([]);
      } finally {
        setLoading((prev) => ({ ...prev, news: false }));
      }
    };

    fetchNews();
  }, [symbol]);

  return (
    <section
      className={`min-h-screen min-w-0 w-full overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8 ${
        theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-6 xl:flex-row xl:items-stretch">
        {/* Crypto Section */}
        <div className="min-w-0 w-full xl:w-2/3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading.crypto ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 h-24 animate-pulse ${
                  theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                }`}
              />
            ))
          ) : error.crypto ? (
            <div className="col-span-full text-center py-8">
              <p className="text-red-400">Error loading crypto data</p>
            </div>
          ) : (
            cryptoData.map((crypto, index) => (
              <CryptoCard key={`${crypto.symbol}-${index}`} crypto={crypto} />
            ))
          )}
        </div>

        {/* News Section */}
        <div
          className={`min-w-0 w-full xl:w-1/3 p-6 rounded-lg shadow-md border xl:h-auto flex flex-col ${
            theme === "dark"
              ? "bg-slate-800 border-slate-600"
              : "bg-white border-gray-300"
          }`}
        >
          <h2
            className={`text-lg font-bold mb-6 ${
              theme === "dark" ? "text-teal-400" : "text-teal-600"
            }`}
          >
            LIVE NEWS
          </h2>
          <div className="space-y-6 flex-1">
            {loading.news ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 animate-pulse"
                >
                  <div
                    className={`w-32 h-32 rounded-md ${
                      theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                    }`}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className={`h-4 w-3/4 rounded ${
                        theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-3 w-full rounded ${
                        theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-3 w-5/6 rounded ${
                        theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />
                  </div>
                </div>
              ))
            ) : error.news ? (
              <p className="text-red-400">Error loading news</p>
            ) : news.length > 0 ? (
              news.map((article, index) => (
                <NewsCard key={`${article.url}-${index}`} article={article} />
              ))
            ) : (
              <p
                className={theme === "dark" ? "text-gray-300" : "text-gray-500"}
              >
                No news available
              </p>
            )}

            <a
              href="https://www.cryptocompare.com/news/"
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 block w-full text-center font-semibold py-2 px-4 rounded-lg transition-colors ${
                theme === "dark"
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
            >
              Read More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
