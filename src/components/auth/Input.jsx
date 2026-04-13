import React, { useState } from "react";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";

const Input = ({ id, name, type, label, placeholder, value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    // Pass the event object to the parent's onChange handler
    onChange(e);
  };

  return (
    <div className="grid gap-3">
      <label htmlFor={id} className="text-white uppercase">
        {label}
      </label>
      <div className={`relative`}>
        <input
          id={id}
          name={name} // Pass the name prop to the input element
          type={showPassword ? "text" : type}
          placeholder={placeholder}
          className={`border-b-2 w-full rounded-sm text-[#97afd5] transition-all duration-500 outline-none placeholder:text-[#97afd5] placeholder:opacity-70 px-5 py-3 bg-transparent ${
            isFocused ? "border-slate-500" : "border-slate-800"
          }`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          onChange={handleInputChange} // Use the updated handler
        />

        {type === "password" && (
          <div
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 bottom-0 top-1/2 -translate-y-1/2 text-[#97afd5] text-2xl cursor-pointer"
          >
            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
