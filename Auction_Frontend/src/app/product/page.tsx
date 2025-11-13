"use client";
import React, { useState } from "react";
import { Hammer, LogIn, Sun, Moon, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ProductLandingPage: React.FC = () => {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const getThemeClasses = (darkClass: string, lightClass: string) =>
    theme === "dark" ? darkClass : lightClass;

  const navigateToPage = (page: string) => {
    if (page === "home") router.push("/");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const products = [
    { name: "Vintage Sneakers", price: "$250", category: "Shoes", image: "👟" },
    { name: "Leather Jacket", price: "$180", category: "Fashion", image: "🧥" },
    { name: "Smart Watch", price: "$120", category: "Electronics", image: "⌚" },
  ];

  return (
    <div
      className={`min-h-screen ${getThemeClasses(
        "bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 text-white",
        "bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 text-black"
      )}`}
    >
      <nav
        className={`fixed w-full z-50 ${getThemeClasses(
          "bg-black/90 backdrop-blur-lg shadow-2xl",
          "bg-white/90 backdrop-blur-lg shadow-2xl"
        )}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigateToPage("home")}
            >
              <div
                className={`w-10 h-10 ${getThemeClasses(
                  "bg-gradient-to-r from-purple-500 to-pink-500",
                  "bg-gradient-to-r from-purple-300 to-pink-300"
                )} rounded-xl flex items-center justify-center`}
              >
                <Hammer className={`w-6 h-6 ${getThemeClasses("text-white", "text-black")}`} />
              </div>
              <span
                className={`text-xl font-bold ${getThemeClasses(
                  "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
                  "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                )}`}
              >
                AuctionHub Products
              </span>
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center space-x-8">
              <span className={`font-medium ${getThemeClasses("text-pink-400", "text-pink-600")}`}>
                Product Auctions Only
              </span>
              <button
                onClick={() => navigateToPage("home")}
                className={`${getThemeClasses(
                  "bg-gradient-to-r from-purple-600 to-pink-600",
                  "bg-gradient-to-r from-purple-400 to-pink-400"
                )} px-4 py-2 rounded-lg hover:shadow-lg transition-all ${getThemeClasses(
                  "text-white",
                  "text-black"
                )}`}
              >
                Back to Home
              </button>
              <Link href="/register">
                <button
                  className={`${getThemeClasses(
                    "bg-gradient-to-r from-purple-600 to-pink-600",
                    "bg-gradient-to-r from-purple-400 to-pink-400"
                  )} px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center space-x-1 ${getThemeClasses(
                    "text-white",
                    "text-black"
                  )}`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login/Register</span>
                </button>
              </Link>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700/50">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span
              className={getThemeClasses(
                "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
                "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              )}
            >
              Product Auctions
            </span>
          </h1>
          <p className={`text-xl mb-8 ${getThemeClasses("text-gray-300", "text-gray-700")}`}>
            Discover exclusive items and bid on your favorites!
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {products.map((item, index) => (
              <div
                key={index}
                className={`${getThemeClasses(
                  "bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-pink-400/50",
                  "bg-purple-100/30 backdrop-blur-sm border border-purple-300/30 hover:border-pink-600/50"
                )} rounded-2xl p-6 transition-all`}
              >
                <div className="text-6xl mb-4 text-center">{item.image}</div>
                <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                <div className="flex justify-between items-center mb-4">
                  <span
                    className={`text-2xl font-bold ${getThemeClasses(
                      "text-pink-400",
                      "text-pink-600"
                    )}`}
                  >
                    {item.price}
                  </span>
                  <div
                    className={`flex items-center space-x-1 ${getThemeClasses(
                      "text-yellow-400",
                      "text-yellow-600"
                    )}`}
                  >
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">{item.category}</span>
                  </div>
                </div>
                <button
                  className={`${getThemeClasses(
                    "bg-gradient-to-r from-purple-600 to-pink-600",
                    "bg-gradient-to-r from-purple-400 to-pink-400"
                  )} w-full py-3 rounded-xl font-medium hover:shadow-lg transition-all ${getThemeClasses(
                    "text-white",
                    "text-black"
                  )}`}
                >
                  Place Bid
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductLandingPage;
