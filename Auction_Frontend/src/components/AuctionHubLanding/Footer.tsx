

"use client";
import React, { useState } from "react";
import { 
   
  Mail, 
  Phone, 
  MapPin, 
  Hammer, 
  ArrowUp, 
  Heart,
  ExternalLink,
  Users,
  Trophy,
  Star,
  Twitter,
  Facebook,
  Instagram
} from "lucide-react";

interface FooterProps {
  getThemeClasses: (dark: string, light: string) => string;
}

const Footer: React.FC<FooterProps> = ({ getThemeClasses }) => {
  const currentYear = new Date().getFullYear();
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setIsSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const socialLinks = [
    {
      name: "twitter",
      icon: Twitter,
      url: "https://twitter.com",
      hoverColor: getThemeClasses("hover:text-blue-400", "hover:text-blue-600"),
      bgHover: "hover:bg-blue-500/10"
    },
    {
      name: "facebook", 
      icon: Facebook,
      url: "https://facebook.com",
      hoverColor: getThemeClasses("hover:text-blue-600", "hover:text-blue-800"),
      bgHover: "hover:bg-blue-600/10"
    },
    {
      name: "instagram",
      icon: Instagram,
      url: "https://instagram.com", 
      hoverColor: getThemeClasses("hover:text-pink-400", "hover:text-pink-600"),
      bgHover: "hover:bg-pink-500/10"
    }
  ];

  const quickStats = [
    { icon: Users, label: "Active Users", value: "15.2K" },
    { icon: Trophy, label: "Completed Auctions", value: "8.7K" },
    { icon: Star, label: "User Rating", value: "4.9/5" }
  ];

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer className={`relative overflow-hidden ${getThemeClasses(
      "bg-gradient-to-t from-black/60 via-black/40 to-black/20 border-t border-white/10",
      "bg-gradient-to-t from-gray-300/60 via-gray-200/40 to-gray-100/20 border-t border-black/10"
    )}`}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${getThemeClasses('rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)')} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-12">
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-12 h-12 ${getThemeClasses('bg-gradient-to-r from-blue-500 to-purple-600', 'bg-gradient-to-r from-blue-300 to-purple-400')} rounded-xl flex items-center justify-center shadow-lg`}>
                <Hammer className={`w-6 h-6 ${getThemeClasses('text-white', 'text-black')}`} />
              </div>
              <div>
                <span className={`text-2xl font-bold ${getThemeClasses('bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent', 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent')}`}>
                  AuctionHub
                </span>
                <div className={`text-sm ${getThemeClasses('text-gray-400', 'text-gray-600')}`}>Premium Auctions</div>
              </div>
            </div>
            <p className={`${getThemeClasses('text-gray-300', 'text-gray-700')} text-sm leading-relaxed`}>
              Your trusted platform for sports memorabilia, product marketplace, and job opportunities worldwide.
            </p>
          </div>

          <div className="lg:col-span-1">
            <h3 className={`font-semibold mb-4 ${getThemeClasses('text-white', 'text-black')}`}>Quick Links</h3>
            <ul className="space-y-3">
              {['Sports Auctions', 'Product Marketplace', 'Job Opportunities', 'Help Center'].map((link) => (
                <li key={link}>
                  <a href="#" className={`${getThemeClasses('text-gray-400 hover:text-blue-400', 'text-gray-600 hover:text-blue-600')} text-sm transition-colors duration-200 hover:translate-x-1 transform inline-block`}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h3 className={`font-semibold mb-4 ${getThemeClasses('text-white', 'text-black')}`}>Contact</h3>
            <div className="space-y-3">
              {[
                { icon: Mail, text: "support@auctionhub.com" },
                { icon: Phone, text: "+1 (555) 123-4567" },
                { icon: MapPin, text: "123 Auction St, Bid City" }
              ].map((item, index) => (
                <div key={index} className={`flex items-center space-x-3 ${getThemeClasses('text-gray-400', 'text-gray-600')} text-sm group cursor-pointer`}>
                  <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span className="group-hover:translate-x-1 transform transition-transform duration-200">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className={`font-semibold mb-4 ${getThemeClasses('text-white', 'text-black')}`}>Stay Updated</h3>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-2 rounded-lg text-sm ${getThemeClasses(
                    'bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-blue-400',
                    'bg-black/10 border border-black/20 text-black placeholder-gray-600 focus:border-blue-600'
                  )} focus:outline-none focus:ring-1 transition-all duration-200`}
                />
              </div>
              <button
                type="submit"
                disabled={isSubscribed}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSubscribed 
                    ? getThemeClasses('bg-green-600 text-white', 'bg-green-500 text-white')
                    : getThemeClasses('bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white', 'bg-gradient-to-r from-blue-400 to-purple-400 hover:shadow-lg text-black')
                } transform hover:scale-105`}
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className={`border-t border-b ${getThemeClasses('border-white/10', 'border-black/10')} py-8 my-8`}>
          <div className="grid grid-cols-3 gap-8">
            {quickStats.map((stat, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${getThemeClasses('bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30', 'bg-gradient-to-r from-blue-300/20 to-purple-300/20 border border-blue-300/30')} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className={`w-5 h-5 ${getThemeClasses('text-blue-400', 'text-blue-600')}`} />
                </div>
                <div className={`text-xl font-bold ${getThemeClasses('text-white', 'text-black')} group-hover:scale-105 transition-transform duration-200`}>{stat.value}</div>
                <div className={`text-sm ${getThemeClasses('text-gray-400', 'text-gray-600')}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <Heart className={`w-4 h-4 ${getThemeClasses('text-red-400', 'text-red-600')} animate-pulse`} />
            <p className={`${getThemeClasses('text-gray-400', 'text-gray-600')} text-sm`}>
              &copy; {currentYear} AuctionHub. Made with love for auctioneers.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <span className={`text-sm ${getThemeClasses('text-gray-500', 'text-gray-500')} mr-2`}>Follow us:</span>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setHoveredSocial(social.name)}
                onMouseLeave={() => setHoveredSocial(null)}
                className={`relative p-3 rounded-full border transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${getThemeClasses(
                  'border-white/20 text-white hover:shadow-lg',
                  'border-black/20 text-black hover:shadow-lg'
                )} ${social.bgHover} ${social.hoverColor}`}
              >
                <social.icon className="w-5 h-5" />
                <ExternalLink className="w-3 h-3 absolute -top-1 -right-1 opacity-0 hover:opacity-100 transition-opacity" />
                
                {hoveredSocial === social.name && (
                  <div className={`absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded ${getThemeClasses('bg-black text-white', 'bg-white text-black')} shadow-lg`}>
                    {social.name.charAt(0).toUpperCase() + social.name.slice(1)}
                    <div className={`absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent ${getThemeClasses('border-t-black', 'border-t-white')}`}></div>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 p-3 rounded-full ${getThemeClasses('bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl', 'bg-gradient-to-r from-blue-400 to-purple-400 text-black shadow-lg hover:shadow-xl')} transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 z-50`}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </footer>
  );
};

export default Footer;