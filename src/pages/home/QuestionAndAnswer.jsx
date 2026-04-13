'use client';

import { useState } from "react";
import { FiPlay, FiPlus, FiMinus, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState("General Question");

  const categories = [
    "General Question",
    "Token Sales",
    "Client Related",
    "Pre-ICO",
    "Legal Info",
    "Pre sales",
  ];

  const questionsData = {    
    "General Question": [
      {
        question: "Can I make payment directly from an Exchange?",
        answer: "No, payments cannot be made directly from an exchange. You need to transfer funds to a wallet first.",
      },
      {
        question: "What is the process for transferring funds from an exchange to a wallet?",
        answer: "Log in to your exchange account, navigate to the withdrawal section, enter your wallet address, and confirm the transaction.",
      },
      {
        question: "Are there fees for transferring funds from an exchange to a wallet?",
        answer: "Yes, most exchanges charge a withdrawal fee for transferring funds to an external wallet.",
      },
      {
        question: "How long does it take to transfer funds from an exchange to a wallet?",
        answer: "Transfer times vary depending on the blockchain network, but it typically takes between a few minutes to an hour.",
      },
      {
        question: "Can I use any wallet to receive funds from an exchange?",
        answer: "Yes, as long as the wallet supports the cryptocurrency you are transferring and you provide the correct wallet address.",
      },
    ],
    "Token Sales": [
      {
        question: "How do I participate in the token sale?",
        answer: "To participate in the token sale, you need to register on our platform, complete KYC, and follow the instructions provided.",
      },
      {
        question: "What currencies are accepted for the token sale?",
        answer: "We accept BTC, ETH, and USDT for the token sale.",
      },
      {
        question: "Is there a minimum investment amount for the token sale?",
        answer: "Yes, the minimum investment amount is $100 or its equivalent in other accepted currencies.",
      },
      {
        question: "When will I receive my tokens after the sale?",
        answer: "Tokens will be distributed to your wallet within 7 business days after the token sale concludes.",
      },
      {
        question: "Can I cancel my participation in the token sale?",
        answer: "No, once you have participated and the transaction is confirmed, it cannot be canceled.",
      },
    ],
    "Client Related": [
      {
        question: "How do I contact customer support?",
        answer: "You can contact customer support via email at support@example.com or through the live chat on our website.",
      },
      {
        question: "What are the customer support hours?",
        answer: "Our customer support team is available 24/7 to assist you with any queries.",
      },
      {
        question: "How do I reset my account password?",
        answer: "You can reset your password by clicking on 'Forgot Password' on the login page and following the instructions.",
      },
      {
        question: "Can I change my registered email address?",
        answer: "Yes, you can change your email address by contacting customer support and verifying your identity.",
      },
      {
        question: "What should I do if I encounter a technical issue?",
        answer: "Please report the issue to our technical support team at techsupport@example.com, and we will assist you promptly.",
      },
    ],
    "Pre-ICO": [
      {
        question: "What is the difference between Pre-ICO and ICO?",
        answer: "Pre-ICO is an early-stage sale with discounted tokens, while ICO is the main token sale event.",
      },
      {
        question: "Who can participate in the Pre-ICO?",
        answer: "Only whitelisted participants who have completed KYC can participate in the Pre-ICO.",
      },
      {
        question: "What are the benefits of participating in the Pre-ICO?",
        answer: "Pre-ICO participants receive tokens at a discounted price and exclusive bonuses.",
      },
      {
        question: "How do I get whitelisted for the Pre-ICO?",
        answer: "You need to register on our platform, complete KYC, and submit the required documents for whitelisting.",
      },
      {
        question: "Can I transfer my Pre-ICO tokens to another wallet?",
        answer: "Yes, once the tokens are distributed, you can transfer them to any compatible wallet.",
      },
    ],
    "Legal Info": [
      {
        question: "Is the token sale compliant with regulations?",
        answer: "Yes, our token sale complies with all applicable regulations in the jurisdictions we operate in.",
      },
      {
        question: "What legal documents govern the token sale?",
        answer: "The token sale is governed by our Terms and Conditions, Privacy Policy, and Token Purchase Agreement.",
      },
      {
        question: "Are there any restrictions on who can participate?",
        answer: "Yes, participants from restricted jurisdictions are not allowed to participate in the token sale.",
      },
      {
        question: "What happens if the token sale is canceled?",
        answer: "In the unlikely event of cancellation, all funds will be returned to participants within 30 business days.",
      },
      {
        question: "Can I get a refund after participating in the token sale?",
        answer: "No, refunds are not allowed once the transaction is confirmed and tokens are distributed.",
      },
    ],
    "Pre sales": [
      {
        question: "What is the purpose of the pre-sales phase?",
        answer: "The pre-sales phase allows early investors to purchase tokens at a discounted rate before the public sale.",
      },
      {
        question: "How do I qualify for the pre-sales?",
        answer: "You need to be whitelisted and meet the minimum investment requirements to qualify for the pre-sales.",
      },
      {
        question: "What is the minimum investment for the pre-sales?",
        answer: "The minimum investment for the pre-sales is $500 or its equivalent.",
      },
      {
        question: "Are pre-sales tokens subject to a lock-up period?",
        answer: "Yes, pre-sales tokens are subject to a 6-month lock-up period after distribution.",
      },
      {
        question: "Can I participate in the pre-sales from any country?",
        answer: "No, participants from restricted jurisdictions are not allowed to participate in the pre-sales.",
      },
    ],
  };

  const Question = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <motion.div 
        className="cursor-pointer border-b border-gray-700/50 py-5 transition-all duration-300 hover:bg-gray-800/30 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
        initial={false}
      >
        <div className="flex items-center justify-between px-5 text-white">
          <div className="flex items-center">
            <motion.div
              className={`w-10 h-10 flex items-center justify-center rounded-full mr-4 transition-all ${
                isOpen ? "bg-teal-500" : "bg-gray-700"
              }`}
              animate={{ rotate: isOpen ? 180 : 0 }}
            >
              {isOpen ? (
                <FiMinus className="text-white text-lg" />
              ) : (
                <FiPlus className="text-white text-lg" />
              )}
            </motion.div>
            <h3 className="font-medium text-lg lg:text-xl">{question}</h3>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FiChevronDown className="text-gray-400 ml-2 text-lg" />
          </motion.div>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="mt-4 text-gray-300 px-5 pl-16 pb-3 text-base lg:text-lg">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-slate-900 min-h-screen py-16 px-4 sm:px-6 relative z-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl opacity-20 animate-float-delayed"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block relative mb-5">
            <span className="text-teal-400 text-sm font-semibold tracking-wider uppercase bg-teal-400/10 px-4 py-1.5 rounded-full inline-flex items-center">
              <FiPlay className="text-teal-400 mr-2 text-sm" />
              FAQ
            </span>
            <div className="absolute inset-0 bg-teal-400 rounded-full blur-lg opacity-20 -z-10 animate-pulse"></div>
          </div>
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-5">
            Frequently Asked <span className="text-teal-400">Questions</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Find answers to common questions about our platform, token sales,
            and investment processes.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Category Navigation */}
          <motion.div 
            className="w-full lg:w-1/4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl shadow-gray-900/50 p-1 h-full">
              <ul className="space-y-1">
                {categories.map((item, index) => (
                  <li key={index}>
                    <motion.button
                      className={`flex items-center w-full p-4 rounded-lg text-lg transition-all duration-300 ${
                        selectedCategory === item
                          ? "text-white bg-gradient-to-r from-teal-500/20 to-teal-500/20 shadow-lg shadow-teal-500/10"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }`}
                      onClick={() => setSelectedCategory(item)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiChevronRight
                        className={`mr-3 transition-all ${
                          selectedCategory === item
                            ? "text-teal-400"
                            : "text-gray-500"
                        }`}
                        size={16}
                      />
                      <span>{item}</span>
                      {selectedCategory === item && (
                        <motion.span 
                          className="ml-auto h-2 w-2 bg-teal-400 rounded-full"
                          layoutId="activeCategory"
                        />
                      )}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Questions Container */}
          <motion.div 
            className="w-full lg:w-3/4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl shadow-gray-900/50 overflow-hidden h-full">
              <div className="p-1">
                <div className="bg-gradient-to-r from-teal-500/10 to-teal-500/10 p-6">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    {selectedCategory}
                    <span className="ml-auto bg-teal-500/20 text-teal-400 text-sm px-3 py-1 rounded-full">
                      {questionsData[selectedCategory]?.length} questions
                    </span>
                  </h3>
                </div>

                <div className="divide-y divide-gray-700/50">
                  {questionsData[selectedCategory]?.map((item, index) => (
                    <Question
                      key={index}
                      question={item.question}
                      answer={item.answer}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
}