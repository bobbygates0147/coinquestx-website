import React from "react";
import { useTheme } from "next-themes";
import by1 from "../../pictures/by1.png"
import by2 from "../../pictures/by2.png";
import by3 from "../../pictures/by3.png";
import by4 from "../../pictures/by4.png";
import by5 from "../../pictures/by5.png"
import by6 from "../../pictures/by6.jpg";

const exchanges = [
  {
    name: "Binance",
    url: "https://www.binance.com/en/buy-sell-crypto",
    img: by1,
  },
  {
    name: "Bitcoin.com",
    url: "https://www.bitcoin.com/buy/",
    img: by2,
  },
  {
    name: "Coinbase",
    url: "https://www.coinbase.com/buy",
    img: by3,
  },
  {
    name: "Crypto.com",
    url: "https://crypto.com/app",
    img: by4,
  },
  {
    name: "Gemini",
    url: "https://www.gemini.com/buy",
    img: by5,
  },
  {
    name: "Kraken",
    url: "https://www.kraken.com/prices",
    img: by6,
  },
];


const BuyCrypto = () => {
  const { theme } = useTheme();

  return (
    <>
      <div
        className={`min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 ${
          theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-7xl">
          {exchanges.map((exchange, index) => (
            <a
              key={index}
              href={exchange.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-2xl shadow-lg p-6 flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                theme === "dark"
                  ? "bg-slate-900 border border-teal-700 hover:border-teal-500 hover:shadow-teal-500/20"
                  : "bg-white border border-teal-400 hover:border-teal-300 hover:shadow-teal-400/20"
              }`}
            >
              <img
                src={exchange.img}
                alt={exchange.name}
                className="h-20 w-20 object-contain mb-4"
              />
              <span
                className={`text-xl font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {exchange.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
};

export default BuyCrypto;
