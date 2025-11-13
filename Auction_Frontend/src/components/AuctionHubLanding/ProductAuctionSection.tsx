"use client";
import React from "react";
import { ShoppingCart, Tag, Package, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation"; 

interface ProductAuctionSectionProps {
  navigateToPage: (page: string) => void;
  getThemeClasses: (dark: string, light: string) => string;
}

const ProductAuctionSection: React.FC<ProductAuctionSectionProps> = ({  getThemeClasses }) => {
  const router = useRouter(); 

  return (
    <section
      id="products"
      className={`py-20 px-4 sm:px-6 lg:px-8 ${getThemeClasses(
        "bg-gradient-to-r from-purple-900/20 to-pink-900/20",
        "bg-gradient-to-r from-purple-100/20 to-pink-100/20"
      )} min-h-screen flex items-center`}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div
            className={`absolute inset-0 ${getThemeClasses(
              "bg-gradient-to-r from-purple-500/20 to-pink-500/20",
              "bg-gradient-to-r from-purple-300/20 to-pink-300/20"
            )} rounded-3xl blur-3xl`}
          />
          <div
            className={`relative ${getThemeClasses(
              "bg-gradient-to-br from-slate-800/90 to-purple-900/90 border border-purple-500/30 backdrop-blur-sm",
              "bg-gradient-to-br from-gray-200/90 to-purple-200/90 border border-purple-300/30 backdrop-blur-sm"
            )} rounded-3xl p-8`}
          >
            <div
              className={`w-16 h-16 ${getThemeClasses(
                "bg-gradient-to-r from-purple-500 to-pink-500",
                "bg-gradient-to-r from-purple-300 to-pink-300"
              )} rounded-2xl flex items-center justify-center mb-6`}
            >
              <ShoppingCart className={`w-8 h-8 ${getThemeClasses("text-white", "text-black")}`} />
            </div>

            <h2 className="text-4xl font-bold mb-4">
              <span
                className={`${getThemeClasses(
                  "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
                  "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                )}`}
              >
                Product Auctions
              </span>
            </h2>

            <p className={`text-lg mb-6 leading-relaxed ${getThemeClasses("text-gray-300", "text-gray-700")}`}>
              Browse and bid on unique products, gadgets, and exclusive items. Our platform ensures safe transactions for buyers and sellers.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Tag className={`w-5 h-5 ${getThemeClasses("text-pink-400", "text-pink-600")}`} />
                <span className={`${getThemeClasses("text-gray-300", "text-gray-700")}`}>Exclusive Deals</span>
              </div>
              <div className="flex items-center space-x-3">
                <Package className={`w-5 h-5 ${getThemeClasses("text-pink-400", "text-pink-600")}`} />
                <span className={`${getThemeClasses("text-gray-300", "text-gray-700")}`}>Authentic Products</span>
              </div>
              <div className="flex items-center space-x-3">
                <ShoppingCart className={`w-5 h-5 ${getThemeClasses("text-pink-400", "text-pink-600")}`} />
                <span className={`${getThemeClasses("text-gray-300", "text-gray-700")}`}>Fast Checkout</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/product")} 
              className={`${getThemeClasses(
                "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-pink-500/25",
                "bg-gradient-to-r from-purple-400 to-pink-400 hover:shadow-pink-300/25"
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

        <div className="hidden lg:block relative">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Products"
            className="rounded-3xl shadow-2xl"
          />
          <div
            className={`absolute inset-0 ${getThemeClasses(
              "bg-gradient-to-t from-purple-900/50 to-transparent",
              "bg-gradient-to-t from-purple-200/50 to-transparent"
            )} rounded-3xl`}
          />
        </div>
      </div>
    </section>
  );
};

export default ProductAuctionSection;
