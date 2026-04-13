import React from "react";

const Modal = ({ isOpen, onClose, realName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-slate-800 p-6 rounded-lg w-96">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Invest in {realName}
        </h2>
        <input
          type="number"
          placeholder="Enter investment amount"
          className="w-full p-2 rounded-lg bg-slate-700 text-white mb-4"
        />
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded-lg mr-2"
          >
            Close
          </button>
          <button
            onClick={() => alert("Investment submitted!")}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
