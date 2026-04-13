export default function CryptoTiles({
  cryptoData,
  theme,
  borderColor,
  secondaryText,
  textColor,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 flex-1">
      {cryptoData.map((crypto, index) => (
        <div
          key={index}
          className={`bg-gradient-to-r ${
            theme === "dark"
              ? "from-slate-800 to-slate-900"
              : "from-gray-100 to-gray-200"
          } rounded-lg min-h-[112px] p-5 shadow-md hover:shadow-lg transition-all duration-300 border ${
            theme === "dark" ? "border-gray-700" : "border-gray-300"
          } hover:border-teal-500 hover:shadow-teal-500/50 hover:scale-105 flex items-center`}
        >
          <img
            src={crypto.image}
            alt={crypto.name}
            className="w-9 h-9 lg:w-11 lg:h-11 mr-4"
          />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span
                className={`text-xs lg:text-sm ${secondaryText} font-medium`}
              >
                {crypto.name}
              </span>
              <span
                className={`text-xs lg:text-sm font-semibold ${
                  crypto.change.startsWith("-")
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {crypto.change}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <h2 className={`text-sm lg:text-lg font-bold ${textColor}`}>
                {crypto.price}
              </h2>
              <span className={`text-xs lg:text-sm ${secondaryText}`}>
                Vol: {crypto.volume}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
