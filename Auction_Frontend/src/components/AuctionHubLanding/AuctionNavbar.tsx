"use client";
import React, { useState, useEffect } from "react";
import { Sun, Moon, X, Menu, Hammer } from "lucide-react";

interface NavbarProps {
  theme: string;
  toggleTheme: () => void;
  scrollToSection: (id: string) => void;
  navigateToPage: (page: string) => void;
  getThemeClasses: (darkClass: string, lightClass: string) => string;
}

const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme, scrollToSection, navigateToPage, getThemeClasses }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const sections = ["home", "sports", "products", "jobs"];
      const currentSection = sections.find(section => {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (currentSection) setActiveSection(currentSection);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 50 ? getThemeClasses('bg-black/90 backdrop-blur-lg shadow-2xl', 'bg-white/90 backdrop-blur-lg shadow-2xl') : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigateToPage('home')}
          >
            <div className={`w-12 h-12 ${getThemeClasses('bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500', 'bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300')} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Hammer className={`w-7 h-7 ${getThemeClasses('text-white', 'text-black')}`} />
            </div>
            <div>
              <span className={`text-2xl font-bold ${getThemeClasses('bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent', 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent')}`}>
                AuctionHub
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {["home", "sports", "products", "jobs"].map(section => (
              <button 
                key={section}
                onClick={() => scrollToSection(section)}
                className={`transition-colors font-medium ${
                  activeSection === section
                    ? getThemeClasses(
                        section === "home" ? "text-blue-400" :
                        section === "sports" ? "text-cyan-400" :
                        section === "products" ? "text-pink-400" : "text-orange-400",
                        section === "home" ? "text-blue-600" :
                        section === "sports" ? "text-cyan-600" :
                        section === "products" ? "text-pink-600" : "text-orange-600"
                      )
                    : getThemeClasses("text-white", "text-black")
                } hover:underline`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700/50">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className={`${getThemeClasses('bg-black/95 backdrop-blur-lg border-t border-gray-700', 'bg-white/95 backdrop-blur-lg border-t border-gray-300')}`}>
          <div className="px-4 py-4 space-y-2">
            {["home", "sports", "products", "jobs"].map(section => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`block w-full text-left py-2 ${getThemeClasses('text-white hover:text-blue-400', 'text-black hover:text-blue-600')}`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
            <button onClick={toggleTheme} className="block w-full text-left py-2 flex items-center space-x-2">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>Toggle Theme</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
