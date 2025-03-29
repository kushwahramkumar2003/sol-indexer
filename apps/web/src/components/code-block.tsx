"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fira_Code } from "next/font/google";

const firaCode = Fira_Code({ subsets: ["latin"] });

export function CodeBlock() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const codeSnippets = [
    `// 1. Connect your Postgres database
const config = {
    host: "your-postgres-host.com",
    port: 5432,
    database: "blockchain_data",
    username: "your_username",
    password: "********"
};`,
    `// 2. Choose what to index
const indexingOptions = {
    categories: [
        "NFT_PRICES",
        "TOKEN_PRICES",
        "TRANSACTIONS"
    ],
    network: "SOLANA_MAINNET"
};`,
    `// 3. We handle the rest!
// Your database is now being populated with:
{
    "nfts": [
        { "mintAddress": "7gb...", "name": "Solana Monkey", "currentPrice": 45.2 }
    ],
    "tokens": [
        { "symbol": "SOL", "price": 142.87, "platform": "Jupiter" }
    ]
}`,
  ];

  const highlightCode = (code: string) => {
   
    return code
      .replace(/(\/\/.*)/g, '<span class="text-gray-400">$1</span>')
      .replace(/(".*?")/g, '<span class="text-amber-300">$1</span>')
      .replace(
        /\b(const|let|var)\b/g,
        '<span class="text-purple-400">$1</span>'
      )
      .replace(
        /\b(true|false|null|undefined)\b/g,
        '<span class="text-blue-400">$1</span>'
      )
      .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-green-400">$1</span>')
      .replace(/(\{|\}|\[|\])/g, '<span class="text-rose-300">$1</span>')
      .replace(
        /\b(host|port|database|username|password|categories|network)\b:/g,
        '<span class="text-cyan-300">$1</span>:'
      )
      .replace(
        /"(nfts|tokens|mintAddress|name|currentPrice|symbol|price|platform)":/g,
        '"<span class="text-cyan-300">$1</span>:'
      );
  };

  useEffect(() => {
    startInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  const startInterval = () => {
    if (isPaused) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % codeSnippets.length);
    }, 4000);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPaused(false);
    startInterval();
  };

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div
      className="relative rounded-xl bg-gray-900 shadow-xl border border-gray-800 p-4 md:p-6 overflow-hidden transition-all duration-300 hover:border-gray-700"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur ${isHovered ? "opacity-30" : "opacity-15"} transition-opacity duration-500 -z-10`}
      ></div>

      <div className="flex gap-2 mb-4 justify-center md:justify-start">
        {codeSnippets.map((_, index) => (
          <button
            key={index}
            onClick={() => goToStep(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentStep === index
                ? "w-8 bg-blue-500 hover:bg-blue-400"
                : "w-2 bg-gray-700 hover:bg-gray-600"
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>

      <div className="flex items-center mb-3 md:mb-4">
        <div className="flex gap-1 md:gap-2">
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="text-xs text-gray-400 mx-auto">solana-indexer.ts</div>
      </div>

      <div
        className={`${firaCode.className} text-xs sm:text-sm md:text-base relative`}
      >
        <div
          className="custom-scrollbar overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-[180px] py-2"
            >
              <pre className="text-gray-100 leading-relaxed">
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(codeSnippets[currentStep]),
                  }}
                />
              </pre>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 left-0 h-full w-4 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none"></div>
      </div>

      <div
        className={`mt-4 flex justify-between transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <button
          onClick={() =>
            goToStep(
              (currentStep - 1 + codeSnippets.length) % codeSnippets.length
            )
          }
          className="text-xs text-gray-400 hover:text-white transition-colors duration-200 px-2 py-1 rounded-md hover:bg-gray-800"
        >
          ← Previous
        </button>
        <button
          onClick={() => goToStep((currentStep + 1) % codeSnippets.length)}
          className="text-xs text-gray-400 hover:text-white transition-colors duration-200 px-2 py-1 rounded-md hover:bg-gray-800"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
