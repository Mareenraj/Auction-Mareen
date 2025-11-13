"use client";

import React, { useState } from 'react';
import { Player } from '@/models/types';
import { Wheel } from '@/components/Wheel/Wheel';

const Page = () => {
  const samplePlayers: Player[] = [
    { id: 1, name: 'Player 1', role: 'Batsman', basePrice: 100000, picture: '/placeholder1.jpg', status: 'available' },
    { id: 2, name: 'Player 2', role: 'Bowler', basePrice: 150000, picture: '/placeholder2.jpg', status: 'available' },
    { id: 3, name: 'Player 3', role: 'All-Rounder', basePrice: 200000, picture: '/placeholder3.jpg', status: 'available' },
    { id: 4, name: 'Player 4', role: 'Wicketkeeper', basePrice: 120000, picture: '/placeholder4.jpg', status: 'available' },
  ];

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>(undefined);
  const [spinning, setSpinning] = useState(false);

  const handleSpin = () => {
    setSpinning(true);
    setSelectedPlayerId(undefined); // Reset selection during spin

    // Simulate backend delay
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * samplePlayers.length);
      const randomPlayerId = samplePlayers[randomIndex].id;
      setSelectedPlayerId(randomPlayerId); // Trigger deceleration and stop
      setSpinning(false); // Stop spinning flag after backend selection
    }, 3000); // mimic backend response delay
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Wheel Test Page</h1>
      <div className="relative w-[400px] h-[400px] mx-auto">
        <Wheel
          players={samplePlayers}
          onSpin={handleSpin}
          spinning={spinning}
          selectedPlayerId={selectedPlayerId}
          isAdmin={true}
        />
      </div>

      {selectedPlayerId && (
        <p className="text-center mt-4 text-xl">
          Selected Player ID: {selectedPlayerId}
        </p>
      )}
    </div>
  );
};

export default Page;
