
"use client";
import React from "react";
import { Trophy, Shield, Star, Users, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation"; 

interface SportAuctionSectionProps {
  navigateToPage: (page: string) => void;
  getThemeClasses: (dark: string, light: string) => string;
}

const SportAuctionSection: React.FC<SportAuctionSectionProps> = ({
  getThemeClasses,
}) => {
  const router = useRouter(); 

  return (
    <section
      id="sports"
      className={`py-20 px-4 sm:px-6 lg:px-8 ${getThemeClasses(
        "bg-gradient-to-r from-blue-900/20 to-cyan-900/20",
        "bg-gradient-to-r from-blue-100/20 to-cyan-100/20"
      )} min-h-screen flex items-center`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div
              className={`absolute inset-0 ${getThemeClasses(
                "bg-gradient-to-r from-blue-500/20 to-cyan-500/20",
                "bg-gradient-to-r from-blue-300/20 to-cyan-300/20"
              )} rounded-3xl blur-3xl`}
            ></div>

            <div
              className={`relative ${getThemeClasses(
                "bg-gradient-to-br from-slate-800/90 to-blue-900/90 backdrop-blur-sm border border-blue-500/30",
                "bg-gradient-to-br from-gray-200/90 to-blue-200/90 backdrop-blur-sm border border-blue-300/30"
              )} rounded-3xl p-8`}
            >
              <div
                className={`w-16 h-16 ${getThemeClasses(
                  "bg-gradient-to-r from-blue-500 to-cyan-500",
                  "bg-gradient-to-r from-blue-300 to-cyan-300"
                )} rounded-2xl flex items-center justify-center mb-6`}
              >
                <Trophy
                  className={`w-8 h-8 ${getThemeClasses(
                    "text-white",
                    "text-black"
                  )}`}
                />
              </div>

              <h2 className="text-4xl font-bold mb-4">
                <span
                  className={`${getThemeClasses(
                    "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent",
                    "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
                  )}`}
                >
                  Sports Auctions
                </span>
              </h2>

              <p
                className={`text-lg mb-6 leading-relaxed ${getThemeClasses(
                  "text-gray-300",
                  "text-gray-700"
                )}`}
              >
                Discover authentic sports memorabilia, signed equipment, and
                rare collectibles from legendary athletes.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Shield
                    className={`w-5 h-5 ${getThemeClasses(
                      "text-cyan-400",
                      "text-cyan-600"
                    )}`}
                  />
                  <span
                    className={`${getThemeClasses(
                      "text-gray-300",
                      "text-gray-700"
                    )}`}
                  >
                    100% Authenticated Items
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <Star
                    className={`w-5 h-5 ${getThemeClasses(
                      "text-cyan-400",
                      "text-cyan-600"
                    )}`}
                  />
                  <span
                    className={`${getThemeClasses(
                      "text-gray-300",
                      "text-gray-700"
                    )}`}
                  >
                    Celebrity Memorabilia
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <Users
                    className={`w-5 h-5 ${getThemeClasses(
                      "text-cyan-400",
                      "text-cyan-600"
                    )}`}
                  />
                  <span
                    className={`${getThemeClasses(
                      "text-gray-300",
                      "text-gray-700"
                    )}`}
                  >
                    Live Bidding Events
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push("/sport")}
                className={`${getThemeClasses(
                  "bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-cyan-500/25",
                  "bg-gradient-to-r from-blue-400 to-cyan-400 hover:shadow-cyan-300/25"
                )} w-full py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 ${getThemeClasses(
                  "text-white",
                  "text-black"
                )}`}
              >
                <span>Explore Products</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <img
                src="http://t3.gstatic.com/images?q=tbn:ANd9GcTwATxUzulG5cjvK1iTopZokfA6eMlmoDqnvm-ZrsVoGE6DeueDUQm2TzsOoYONPCx6oBluu3_J"
                alt="Sports Equipment"
                className="rounded-3xl shadow-2xl"
              />
              <div
                className={`absolute inset-0 ${getThemeClasses(
                  "bg-gradient-to-t from-blue-900/50 to-transparent",
                  "bg-gradient-to-t from-blue-200/50 to-transparent"
                )} rounded-3xl`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SportAuctionSection;
