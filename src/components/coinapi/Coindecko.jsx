const CRYPTO_API =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";

useEffect(() => {
  async function fetchCryptoPrices() {
    try {
      const response = await fetch(CRYPTO_API);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAssets((prevAssets) => ({
          ...prevAssets,
          Crypto: data
            .map((coin) => ({
              // 👇 Make sure we keep the 'id' from CoinGecko
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol.toUpperCase(),
              price: coin.current_price.toFixed(2),
              image: coin.image,
            }))
            .filter((coin) => coin.symbol !== "WETH"),
        }));
      }
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
    }
  }

  fetchCryptoPrices();
  // ...
}, []);
