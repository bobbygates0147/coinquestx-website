import React, { useState } from "react";
import SideImg from "./ContactImg";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <section
      id="contact-us"
      className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-slate-800/90 to-slate-950"
    >
      <div className="w-full flex flex-col lg:flex-row">
        {/* Image Half */}
        <div className="w-full lg:w-1/2">
          <SideImg />
        </div>

        {/* Form Half */}
        <div className="w-full lg:w-1/2 py-12 px-4 sm:px-8 lg:px-12 xl:px-16 flex items-center">
          <div className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-white/5 rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl shadow-slate-900/50">
            <div className="mb-10">
              <div className="flex  items-center">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-900/20">
                  CONTACT-
                  <span className=" bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-cyan-800/20">
                    US
                  </span>
                </span>
              </div>
              <p className="mt-4 text-teal-100/80 text-lg">
                We're always open and welcome your questions. Get in touch with
                us by filling out the form.
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border-b-2 border-slate-600 focus:border-teal-400 outline-none text-white rounded-t-lg transition-all duration-300 peer"
                    placeholder=" "
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-4 top-3 text-slate-400 peer-focus:text-teal-400 peer-placeholder-shown:translate-y-0 -translate-y-8 transition-all duration-300 pointer-events-none"
                  >
                    Your Name
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border-b-2 border-slate-600 focus:border-teal-400 outline-none text-white rounded-t-lg transition-all duration-300 peer"
                    placeholder=" "
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-4 top-3 text-slate-400 peer-focus:text-teal-400 peer-placeholder-shown:translate-y-0 -translate-y-8 transition-all duration-300 pointer-events-none"
                  >
                    Your Email
                  </label>
                </div>
              </div>

              <div className="relative mt-6">
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border-b-2 border-slate-600 focus:border-teal-400 outline-none text-white rounded-t-lg min-h-[160px] resize-y transition-all duration-300 peer"
                  placeholder=" "
                />
                <label
                  htmlFor="message"
                  className="absolute left-4 top-3 text-slate-400 peer-focus:text-teal-400 peer-placeholder-shown:translate-y-0 -translate-y-8 transition-all duration-300 pointer-events-none"
                >
                  Your Message
                </label>
              </div>

              <button
                type="submit"
                className="mt-8 px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-300 w-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 flex items-center justify-center group"
              >
                <span>Send Message</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
