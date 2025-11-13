"use client";
import React, { useEffect, useState } from "react";

interface StarsBackgroundProps {
  count?: number;
}

interface Star {
  key: number;
  top: string;
  left: string;
  size: string;
  delay: string;
}

const StarsBackground: React.FC<StarsBackgroundProps> = ({ count = 150 }) => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generatedStars: Star[] = Array.from({ length: count }, (_, i) => ({
      key: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      delay: `${Math.random() * 2}s`,
    }));
    setStars(generatedStars);
  }, [count]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.key}
          className="absolute bg-white rounded-full opacity-75 animate-blink"
          style={{
            width: star.size,
            height: star.size,
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default StarsBackground;
