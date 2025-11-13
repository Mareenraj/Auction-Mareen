"use client";
import React from "react";
import { ArrowRight } from "lucide-react";
import StarsBackground from "../ui/StarsBackgroundProps";

interface HeroSectionProps {
  scrollToSection: (id: string) => void;
  getThemeClasses: (dark: string, light: string) => string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ scrollToSection, getThemeClasses }) => {
  return (
    <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center overflow-hidden bg-black">
      
      <StarsBackground count={150} />

      <div className="max-w-7xl mx-auto relative z-10 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className={`${getThemeClasses("bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent", "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent")}`}>
            Welcome to
          </span>
          <br />
          <span className={`${getThemeClasses("text-white", "text-black")}`}>AuctionHub</span>
        </h1>
        <p className={`text-xl ${getThemeClasses("text-gray-300","text-gray-700")} max-w-3xl mx-auto mb-8 leading-relaxed`}>
          Your ultimate destination for Sports Memorabilia, Product Marketplace, and Job Opportunities. 
          Choose your auction adventure below!
        </p>

        <div className="flex justify-center items-center space-x-8 mb-16">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getThemeClasses("text-blue-400", "text-blue-600")}`}>15.2K</div>
            <div className={`text-sm ${getThemeClasses("text-gray-400", "text-gray-600")}`}>Active Users</div>
          </div>
          <div className={`w-px h-12 ${getThemeClasses("bg-gray-600", "bg-gray-300")}`} />
          <div className="text-center">
            <div className={`text-3xl font-bold ${getThemeClasses("text-purple-400", "text-purple-600")}`}>89</div>
            <div className={`text-sm ${getThemeClasses("text-gray-400", "text-gray-600")}`}>Live Auctions</div>
          </div>
          <div className={`w-px h-12 ${getThemeClasses("bg-gray-600", "bg-gray-300")}`} />
          <div className="text-center">
            <div className={`text-3xl font-bold ${getThemeClasses("text-green-400", "text-green-600")}`}>98.7%</div>
            <div className={`text-sm ${getThemeClasses("text-gray-400", "text-gray-600")}`}>Success Rate</div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => scrollToSection("sports")}
            className={`${getThemeClasses("bg-gradient-to-r from-blue-600 to-purple-600", "bg-gradient-to-r from-blue-400 to-purple-400")} px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${getThemeClasses("text-white", "text-black")}`}
          >
            <span>Explore Auctions</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
