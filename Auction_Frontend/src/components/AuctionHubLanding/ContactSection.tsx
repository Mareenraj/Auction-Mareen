"use client";
import React, { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

interface ContactSectionProps {
  getThemeClasses: (dark: string, light: string) => string;
}

const ContactSection: React.FC<ContactSectionProps> = ({ getThemeClasses }) => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setFormData({ name: "", email: "", message: "" });
    alert("Message sent successfully!");
  };

  return (
    <section
      id="contact"
      className={`py-20 px-4 sm:px-6 lg:px-8 ${getThemeClasses(
        "bg-gradient-to-r from-purple-900/20 to-pink-900/20",
        "bg-gradient-to-r from-purple-100/20 to-pink-100/20"
      )}`}
    >
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4">
          <span className={getThemeClasses(
            "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent",
            "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          )}>
            Contact Us
          </span>
        </h2>
        <p className={getThemeClasses("text-gray-300 mb-12", "text-gray-700 mb-12")}>
          Have questions or want to get in touch? Fill out the form below or reach us via our contact details.
        </p>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-6 text-left">
            <div className="flex items-center space-x-3">
              <MapPin className={getThemeClasses("text-purple-400", "text-purple-600")} />
              <span className={getThemeClasses("text-gray-300", "text-gray-700")}>
                123 Auction Street, Colombo, Sri Lanka
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className={getThemeClasses("text-purple-400", "text-purple-600")} />
              <span className={getThemeClasses("text-gray-300", "text-gray-700")}>+94 77 123 4567</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className={getThemeClasses("text-purple-400", "text-purple-600")} />
              <span className={getThemeClasses("text-gray-300", "text-gray-700")}>support@auctionhub.com</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full p-4 rounded-xl border ${getThemeClasses(
                "bg-gray-800 border-gray-700 text-white placeholder-gray-400",
                "bg-white border-gray-300 text-black placeholder-gray-500"
              )}`}
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full p-4 rounded-xl border ${getThemeClasses(
                "bg-gray-800 border-gray-700 text-white placeholder-gray-400",
                "bg-white border-gray-300 text-black placeholder-gray-500"
              )}`}
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className={`w-full p-4 rounded-xl border ${getThemeClasses(
                "bg-gray-800 border-gray-700 text-white placeholder-gray-400",
                "bg-white border-gray-300 text-black placeholder-gray-500"
              )}`}
            />
            <button
              type="submit"
              className={`${getThemeClasses(
                "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-pink-500/30",
                "bg-gradient-to-r from-purple-400 to-pink-400 hover:shadow-pink-300/30"
              )} w-full py-4 rounded-2xl font-semibold text-lg text-white hover:scale-105 transition-transform duration-300`}
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
