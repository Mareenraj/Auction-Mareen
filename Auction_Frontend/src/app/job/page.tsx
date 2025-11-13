"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hammer, LogIn, Sun, Moon, Clock } from "lucide-react";

// Job type
interface Job {
  title: string;
  price: string;
  time: string;
  image: string;
  type: string;
}

// Sample jobs
const jobs: Job[] = [
  { title: "Senior React Developer", price: "$95,000", time: "3d 22h", image: "💻", type: "Full-time" },
  { title: "Logo Design Project", price: "$450", time: "2d 8h", image: "🎨", type: "Freelance" },
  { title: "Mobile App Development", price: "$12,000", time: "5d 14h", image: "📱", type: "Contract" },
  { title: "Content Writer Position", price: "$35/hr", time: "1d 6h", image: "✍️", type: "Remote" },
  { title: "Data Analyst Role", price: "$78,000", time: "4d 10h", image: "📊", type: "Full-time" },
  { title: "Social Media Manager", price: "$42,000", time: "2d 18h", image: "📢", type: "Part-time" },
];

const JobNavbar = ({ theme, toggleTheme, getThemeClasses }: any) => {
  const router = useRouter();
  const navigateToPage = (page: string) => {
    if (page === "home") router.push("/");
  };

  return (
    <nav className={`fixed w-full z-50 ${getThemeClasses('bg-black/90 backdrop-blur-lg shadow-2xl', 'bg-white/90 backdrop-blur-lg shadow-2xl')}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigateToPage('home')}>
            <div className={`w-10 h-10 ${getThemeClasses('bg-gradient-to-r from-purple-500 to-blue-500', 'bg-gradient-to-r from-purple-300 to-blue-300')} rounded-xl flex items-center justify-center`}>
              <Hammer className={`w-6 h-6 ${getThemeClasses('text-white', 'text-black')}`} />
            </div>
            <span className={`text-xl font-bold ${getThemeClasses('bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent', 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent')}`}>
              AuctionHub Jobs
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => navigateToPage('home')} className={`${getThemeClasses('bg-gradient-to-r from-purple-600 to-blue-600', 'bg-gradient-to-r from-purple-400 to-blue-400')} px-4 py-2 rounded-lg hover:shadow-lg transition-all ${getThemeClasses('text-white', 'text-black')}`}>
              Back to Home
            </button>
            <button className={`${getThemeClasses('bg-gradient-to-r from-purple-600 to-blue-600', 'bg-gradient-to-r from-purple-400 to-blue-400')} px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center space-x-1 ${getThemeClasses('text-white', 'text-black')}`}>
              <LogIn className="w-4 h-4" />
              <span>Login/Register</span>
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700/50">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const JobCard = ({ job, getThemeClasses }: { job: Job; getThemeClasses: any }) => (
  <div className={`${getThemeClasses('bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 hover:border-blue-400/50', 'bg-purple-100/30 backdrop-blur-sm border border-purple-300/30 hover:border-blue-600/50')} rounded-2xl p-6 transition-all`}>
    <div className="flex justify-between items-start mb-4">
      <div className="text-4xl">{job.image}</div>
      <span className={`${getThemeClasses('bg-purple-500/20 text-purple-300 border border-purple-500/30', 'bg-purple-200/20 text-purple-700 border border-purple-300/30')} px-2 py-1 text-xs rounded-full`}>
        {job.type}
      </span>
    </div>
    <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
    <div className="flex justify-between items-center mb-4">
      <span className={`text-2xl font-bold ${getThemeClasses('text-blue-400', 'text-blue-600')}`}>{job.price}</span>
      <div className={`flex items-center space-x-1 ${getThemeClasses('text-red-400', 'text-red-600')}`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm">{job.time}</span>
      </div>
    </div>
    <button className={`${getThemeClasses('bg-gradient-to-r from-purple-600 to-blue-600', 'bg-gradient-to-r from-purple-400 to-blue-400')} w-full py-3 rounded-xl font-medium hover:shadow-lg transition-all ${getThemeClasses('text-white', 'text-black')}`}>
      Apply Now
    </button>
  </div>
);

const JobFeatures = ({ getThemeClasses }: any) => (
  <section className="mt-16">
    <h2 className={`text-3xl font-bold text-center mb-8 ${getThemeClasses('text-white', 'text-black')}`}>
      Advanced Features
    </h2>
    <div className="grid md:grid-cols-3 gap-6">
      {[
        { title: "Skill Matching AI", desc: "AI-powered job recommendations." },
        { title: "Bid Analytics", desc: "Track bid history and trends." },
        { title: "Portfolio Upload", desc: "Showcase your work easily." }
      ].map((feature, index) => (
        <div key={index} className={`${getThemeClasses('bg-purple-900/30 border border-purple-500/30', 'bg-purple-100/30 border border-purple-300/30')} p-6 rounded-2xl`}>
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className={`${getThemeClasses('text-gray-300', 'text-gray-700')}`}>{feature.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default function JobLandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const toggleTheme = () => setTheme(prev => (prev === "light" ? "dark" : "light"));

  const getThemeClasses = (darkClass: string, lightClass: string) => (theme === "dark" ? darkClass : lightClass);

  return (
    <div className={`min-h-screen ${getThemeClasses('bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900 text-white', 'bg-gradient-to-br from-purple-100 via-blue-100 to-gray-100 text-black')}`}>
      <JobNavbar theme={theme} toggleTheme={toggleTheme} getThemeClasses={getThemeClasses} />

      <div className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className={`${getThemeClasses('bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent', 'bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent')}`}>
                Work Opportunities
              </span>
            </h1>
            <p className={`text-xl ${getThemeClasses('text-gray-300', 'text-gray-700')}`}>
              Bid on projects and find your next opportunity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {jobs.map((job, index) => (
              <JobCard key={index} job={job} getThemeClasses={getThemeClasses} />
            ))}
          </div>

          <JobFeatures getThemeClasses={getThemeClasses} />
        </div>
      </div>
    </div>
  );
}
