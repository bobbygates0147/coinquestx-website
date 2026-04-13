import React, { useEffect } from "react";

export default function CoinMarketCapWidget() {
  useEffect(() => {
    // Dynamically load the CoinMarketCap widget script
    const script = document.createElement("script");
    script.src = "https://files.coinmarketcap.com/static/widget/marquee.js";
    script.async = true;
    document.body.appendChild(script);

    // Optional: cleanup if needed
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="coinmarketcap-widget">
      {/* 
        CoinMarketCap Marquee Widget 
        You can adjust "coins" (IDs), "currency", "theme", etc. 
        For more customization, see:
        https://coinmarketcap.com/widget/marquee/
      */}
      <div
        id="coinmarketcap-widget-marquee"
        coins="1,1027,2,825,5426,1839,52,2010,74,5994"
        currency="USD"
        theme="dark"
        transparent="false"
        show-symbol-logo="true"
      ></div>

      {/* Direct link to CoinMarketCap */}
      <div className="mt-2 text-center">
        <a
          href="https://coinmarketcap.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-300 underline"
        >
          View More on CoinMarketCap
        </a>
      </div>
    </div>
  );
}
