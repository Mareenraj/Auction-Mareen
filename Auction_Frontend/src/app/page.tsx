"use client";
import React, { useState } from "react";
import Navbar from "@/components/AuctionHubLanding/AuctionNavbar";
import HeroSection from "@/components/AuctionHubLanding/HeroSection";
import SportAuctionSection from "@/components/AuctionHubLanding/SportAuctionSection";
import ProductAuctionSection from "@/components/AuctionHubLanding/ProductAuctionSection";
import JobAuctionSection from "@/components/AuctionHubLanding/JobAuctionSection";
import ContactSection from "@/components/AuctionHubLanding/ContactSection";
import Footer from "@/components/AuctionHubLanding/Footer";

import SportLandingPage from "./sport/page";
import ProductLandingPage from "./product/page";
import JobLandingPage from "./job/page";

const AuctionLanding = () => {
  const [theme, setTheme] = useState("dark");
  const [currentPage, setCurrentPage] = useState("home"); 

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));
  const getThemeClasses = (darkClass: string, lightClass: string) =>
    theme === "dark" ? darkClass : lightClass;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const navigateToPage = (page: string) => {
    setCurrentPage(page);
  };

  if (currentPage === "sports") {
    return (
      <SportLandingPage/>    
      
    );
  }

  if (currentPage === "products") {
    return (
      <ProductLandingPage/>
    );
  }

  if (currentPage === "jobs") {
    return (
      <JobLandingPage/>
    );
  }

  return (
    <div className={theme === "dark" ? "bg-black text-white" : "bg-white text-black"}>
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        scrollToSection={scrollToSection}
        navigateToPage={navigateToPage}
        getThemeClasses={getThemeClasses}
      />
      <HeroSection scrollToSection={scrollToSection} getThemeClasses={getThemeClasses} />
      <SportAuctionSection navigateToPage={navigateToPage} getThemeClasses={getThemeClasses} />
      <ProductAuctionSection navigateToPage={navigateToPage} getThemeClasses={getThemeClasses} />
      <JobAuctionSection navigateToPage={navigateToPage} getThemeClasses={getThemeClasses} />
      <ContactSection getThemeClasses={getThemeClasses} />
      <Footer getThemeClasses={getThemeClasses} />
    </div>
  );
};

export default AuctionLanding;
