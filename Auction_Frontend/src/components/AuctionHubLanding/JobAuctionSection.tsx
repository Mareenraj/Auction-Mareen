"use client";

import React from "react";
import { Briefcase, Users, Calendar, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation"; 

interface JobAuctionSectionProps {
  navigateToPage?: (page: string) => void;
  getThemeClasses: (dark: string, light: string) => string;
}

const JobAuctionSection: React.FC<JobAuctionSectionProps> = ({ getThemeClasses }) => {
  const router = useRouter(); 

  return (
    <section
      id="jobs"
      className={`py-20 px-4 sm:px-6 lg:px-8 ${getThemeClasses(
        "bg-gradient-to-r from-green-900/20 to-blue-900/20",
        "bg-gradient-to-r from-green-100/20 to-blue-100/20"
      )} min-h-screen flex items-center`}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div
            className={`absolute inset-0 ${getThemeClasses(
              "bg-gradient-to-r from-green-500/20 to-blue-500/20",
              "bg-gradient-to-r from-green-300/20 to-blue-300/20"
            )} rounded-3xl blur-3xl`}
          />

          <div
            className={`relative ${getThemeClasses(
              "bg-gradient-to-br from-slate-800/90 to-green-900/90 border border-green-500/30 backdrop-blur-sm",
              "bg-gradient-to-br from-gray-200/90 to-green-200/90 border border-green-300/30 backdrop-blur-sm"
            )} rounded-3xl p-8`}
          >
            <div
              className={`w-16 h-16 ${getThemeClasses(
                "bg-gradient-to-r from-green-500 to-blue-500",
                "bg-gradient-to-r from-green-300 to-blue-300"
              )} rounded-2xl flex items-center justify-center mb-6`}
            >
              <Briefcase className={`w-8 h-8 ${getThemeClasses("text-white", "text-black")}`} />
            </div>

            <h2 className="text-4xl font-bold mb-4">
              <span
                className={`${getThemeClasses(
                  "bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent",
                  "bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
                )}`}
              >
                Job Auctions
              </span>
            </h2>

            <p className={`text-lg mb-6 leading-relaxed ${getThemeClasses("text-gray-300", "text-gray-700")}`}>
              Find and bid on exclusive job opportunities or freelance projects. Our platform connects talented professionals with top employers.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Users className={`w-5 h-5 ${getThemeClasses("text-blue-400", "text-blue-600")}`} />
                <span className={`${getThemeClasses("text-gray-300", "text-gray-700")}`}>Professional Network</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className={`w-5 h-5 ${getThemeClasses("text-blue-400", "text-blue-600")}`} />
                <span className={`${getThemeClasses("text-gray-300", "text-gray-700")}`}>Flexible Deadlines</span>
              </div>
              <div className="flex items-center space-x-3">
                <Briefcase className={`w-5 h-5 ${getThemeClasses("text-blue-400", "text-blue-600")}`} />
                <span className={`${getThemeClasses("text-gray-300", "text-gray-700")}`}>Verified Jobs</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/job")} 
              className={`${getThemeClasses(
                "bg-gradient-to-r from-green-600 to-blue-600 hover:shadow-blue-500/25",
                "bg-gradient-to-r from-green-400 to-blue-400 hover:shadow-blue-300/25"
              )} w-full py-4 rounded-2xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 ${getThemeClasses("text-white", "text-black")}`}
            >
              <span>Explore Jobs</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="hidden lg:block relative">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"
            alt="Jobs"
            className="rounded-3xl shadow-2xl"
          />
          <div
            className={`absolute inset-0 ${getThemeClasses(
              "bg-gradient-to-t from-green-900/50 to-transparent",
              "bg-gradient-to-t from-green-200/50 to-transparent"
            )} rounded-3xl`}
          />
        </div>
      </div>
    </section>
  );
};

export default JobAuctionSection;
