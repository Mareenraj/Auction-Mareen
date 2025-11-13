


"use client";
import React, { useState } from "react";
import { Hammer, LogIn, Sun, Moon, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SportLandingPage: React.FC = () => {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const getThemeClasses = (darkClass: string, lightClass: string) =>
    theme === "dark" ? darkClass : lightClass;

  const navigateToPage = (page: string) => {
    if (page === "home") {
      router.push("/"); 
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const auctions = [
    { title: "Michael Jordan Jersey", price: "$8,500", time: "2d 14h", image: "🏀" },
    { title: "Baseball Signed by Babe Ruth", price: "$12,000", time: "1d 8h", image: "⚾" },
    { title: "Football Helmet - Tom Brady", price: "$3,200", time: "3d 22h", image: "🏈" },
  ];

  return (
    <div
      className={`min-h-screen ${getThemeClasses(
        "bg-gradient-to-br from-blue-900 via-cyan-900 to-slate-900 text-white",
        "bg-gradient-to-br from-blue-100 via-cyan-100 to-gray-100 text-black"
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
                  "bg-gradient-to-r from-blue-500 to-cyan-500",
                  "bg-gradient-to-r from-blue-300 to-cyan-300"
                )} rounded-xl flex items-center justify-center`}
              >
                <Hammer
                  className={`w-6 h-6 ${getThemeClasses("text-white", "text-black")}`}
                />
              </div>
              <span
                className={`text-xl font-bold ${getThemeClasses(
                  "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent",
                  "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
                )}`}
              >
                AuctionHub Sports
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <span className={`font-medium ${getThemeClasses("text-cyan-400", "text-cyan-600")}`}>
                Sports Auctions Only
              </span>
              <button
                onClick={() => navigateToPage("home")}
                className={`${getThemeClasses(
                  "bg-gradient-to-r from-blue-600 to-cyan-600",
                  "bg-gradient-to-r from-blue-400 to-cyan-400"
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
                    "bg-gradient-to-r from-blue-600 to-cyan-600",
                    "bg-gradient-to-r from-blue-400 to-cyan-400"
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

      {/* Content */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span
              className={getThemeClasses(
                "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent",
                "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
              )}
            >
              Sports Auctions
            </span>
          </h1>
          <p className={`text-xl mb-8 ${getThemeClasses("text-gray-300", "text-gray-700")}`}>
            Exclusive sports memorabilia and equipment auctions
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {auctions.map((item, index) => (
              <div
                key={index}
                className={`${getThemeClasses(
                  "bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 hover:border-cyan-400/50",
                  "bg-blue-100/30 backdrop-blur-sm border border-blue-300/30 hover:border-cyan-600/50"
                )} rounded-2xl p-6 transition-all`}
              >
                <div className="text-6xl mb-4 text-center">{item.image}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <div className="flex justify-between items-center mb-4">
                  <span
                    className={`text-2xl font-bold ${getThemeClasses(
                      "text-cyan-400",
                      "text-cyan-600"
                    )}`}
                  >
                    {item.price}
                  </span>
                  <div
                    className={`flex items-center space-x-1 ${getThemeClasses(
                      "text-red-400",
                      "text-red-600"
                    )}`}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{item.time}</span>
                  </div>
                </div>
                <button
                  className={`${getThemeClasses(
                    "bg-gradient-to-r from-blue-600 to-cyan-600",
                    "bg-gradient-to-r from-blue-400 to-cyan-400"
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

export default SportLandingPage;
