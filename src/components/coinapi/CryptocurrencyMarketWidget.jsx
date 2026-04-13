import { useEffect } from "react";

const CryptocurrencyMarketWidget = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      defaultColumn: "overview",
      screener_type: "crypto_mkt",
      displayCurrency: "USD",
      colorTheme: "dark", // Change to "light" for teal-600 to stand out
      locale: "en",
    });

    const container = document.getElementById("tradingview-widget-container");

    if (container) {
      container.appendChild(script);
    }

    // Cleanup function to remove the script when the component unmounts
    return () => {
      if (container && script.parentNode === container) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="custom-container bg-slate-950 relative z-10 py-10">
      <div
        id="tradingview-widget-container"
        className="h-[500px] w-full max-w-6xl mx-auto rounded-lg shadow-lg overflow-hidden"
        style={{ backgroundColor: "#0d9488" }} // teal-600 background
      ></div>
    </section>
  );
};

export default CryptocurrencyMarketWidget;
