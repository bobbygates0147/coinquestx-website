import HeaderPage from "../../../components/dashboard/layout/Header";
import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FundAccountPage() {
  const [selectedOption, setSelectedOption] = useState("Trading");
  const [amount, setAmount] = useState(""); // State for amount
  const navigate = useNavigate(); // Navigation hook

  const options = [
    "Trading",
    "Bitcoin Mining",
    "Ethereum Mining",
    "Dogecoin Mining",
    "Binance Coin Mining",
  ];
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    dropdownRef.current.classList.toggle("hidden");
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    navigate("/SendCrypto", { state: { amount } }); // Pass amount to next page
  };

  return (
    <>
      <HeaderPage />
      <section className="bg-gray-950 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white shadow-2xl rounded-2xl p-6 relative">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Fund Account</h2>
            <h4 className="text-yellow-500 cursor-pointer hover:underline mt-2">
              View Pricing
            </h4>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-100 rounded-xl shadow-sm border border-yellow-400">
            <h1 className="text-xl font-bold text-gray-700">USD</h1>
            <div className="w-2/3">
              <h6 className="text-gray-500">Amount</h6>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
              />
            </div>
          </div>

          <div className="mt-6 relative">
            <h6 className="text-gray-500 mb-2">To</h6>
            <button
              className="w-full flex justify-between items-center p-4 bg-teal-400 text-white text-lg font-medium rounded-xl shadow-md hover:bg-teal-500 transition"
              onClick={toggleDropdown}
            >
              {selectedOption}
              <ChevronDown className="h-5 w-5" strokeWidth={2.4} />
            </button>
            <ul
              ref={dropdownRef}
              className="hidden absolute w-full bg-white shadow-lg rounded-xl mt-2 overflow-hidden z-20 border border-gray-200"
            >
              {options.map((option) => (
                <li
                  key={option}
                  className="p-1 text-gray-700 hover:bg-yellow-100 cursor-pointer text-lg"
                  onClick={() => {
                    setSelectedOption(option);
                    toggleDropdown();
                  }}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>

          <button
            className="w-full mt-6 p-2 bg-blue-500 text-white text-lg font-bold rounded-xl shadow-md hover:bg-blue-800 transition"
            onClick={handleProceed}
          >
            Proceed
          </button>
        </div>
      </section>
    </>
  );
}
