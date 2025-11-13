import React, { useState, useEffect } from 'react';
import { Trophy, Users, DollarSign, Zap, Crown } from 'lucide-react';
import useAuthToken from '@/lib/hooks/useAuthToken';
import { useSearchParams } from "next/navigation";


const SlotCounter = () => {
  
  const [currentNumber, setCurrentNumber] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelStates, setReelStates] = useState([false, false, false]);
  const [reelContents, setReelContents] = useState([[0], [0], [0]]);
  const [reelTranslates, setReelTranslates] = useState([0, 0, 0]);
  const [reelTransitions, setReelTransitions] = useState(['none', 'none', 'none']);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [showWinEffect, setShowWinEffect] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const { token } = useAuthToken();

  const searchParams = useSearchParams();
  const auctionId = searchParams.get('auctionId');
  console.log('Auction ID from URL.........:', auctionId);


  const fetchRandomNumber = async () => {
  try {
    setError(null);

    const response = await fetch(`http://localhost:8080/players/${auctionId}/available`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json().catch(() => null);
    console.log('API Response:.............', data);
    const value =
      typeof data === 'number'
        ? data
        : (data && (data.available ?? data.number ?? data.value)) ??
          Math.floor(Math.random() * 1000);
    const num = Number.isFinite(Number(value)) ? Number(value) : 0;
    return Math.max(0, Math.min(999, num));
  } catch (err) {
    console.error('API Error:', err);
    setError('Using demo mode');
    return Math.floor(Math.random() * 1000);
  }
};


  const formatNumber = (num) => {
    const str = num.toString().padStart(3, '0');
    return [parseInt(str[0]), parseInt(str[1]), parseInt(str[2])];
  };

  const createSpinningNumbers = () => {
    return Array.from({ length: 20 }, () => Math.floor(Math.random() * 10));
  };

  const animateReel = (reelIndex, finalDigit, delay = 0) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const spinNumbers = createSpinningNumbers();
        spinNumbers.push(finalDigit);

        setReelContents(prev => {
          const newContents = [...prev];
          newContents[reelIndex] = spinNumbers;
          return newContents;
        });

        setReelTranslates(prev => {
          const newT = [...prev];
          newT[reelIndex] = 0;
          return newT;
        });

        setReelTransitions(prev => {
          const newTrans = [...prev];
          newTrans[reelIndex] = 'none';
          return newTrans;
        });

        // Small delay to allow React to render the new content
        setTimeout(() => {
          const duration = 2000 + (reelIndex * 500);
          setReelTranslates(prev => {
            const newT = [...prev];
            newT[reelIndex] = - (spinNumbers.length - 1) * 120;
            return newT;
          });

          setReelTransitions(prev => {
            const newTrans = [...prev];
            newTrans[reelIndex] = `transform ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            return newTrans;
          });

          setReelStates(prev => {
            const newStates = [...prev];
            newStates[reelIndex] = true;
            return newStates;
          });
        }, 50);

        // Cleanup after animation
        const duration = 2000 + (reelIndex * 500);
        setTimeout(() => {
          setReelContents(prev => {
            const newContents = [...prev];
            newContents[reelIndex] = [finalDigit];
            return newContents;
          });

          setReelTranslates(prev => {
            const newT = [...prev];
            newT[reelIndex] = 0;
            return newT;
          });

          setReelTransitions(prev => {
            const newTrans = [...prev];
            newTrans[reelIndex] = 'none';
            return newTrans;
          });

          setReelStates(prev => {
            const newStates = [...prev];
            newStates[reelIndex] = false;
            return newStates;
          });

          resolve();
        }, duration + 50);
      }, delay);
    });
  };

  const spinLottery = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setPulseEffect(true);
    setShowWinEffect(false);

    // Get final number from API
    const finalNumber = await fetchRandomNumber();
    const digits = formatNumber(finalNumber);

    // Reset all reels
    setReelStates([false, false, false]);

    // Start all reels spinning with staggered starts
    const promises = digits.map((digit, index) => 
      animateReel(index, digit, index * 200)
    );

    await Promise.all(promises);

    // Update final state
    setCurrentNumber(finalNumber);
    setLastResult(finalNumber);
    setIsSpinning(false);
    setPulseEffect(false);

    // Show win effect
    setShowWinEffect(true);
    setTimeout(() => setShowWinEffect(false), 2000);
  };

  useEffect(() => {
    // Initialize with API call
    fetchRandomNumber().then(number => {
      const digits = formatNumber(number);
      setCurrentNumber(number);
      setReelContents(digits.map(d => [d]));
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Win Effect Overlay */}
      {showWinEffect && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 animate-pulse"></div>
          {/* Confetti effect */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        {/* Main Container */}
        <div className={`relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-2 rounded-3xl shadow-2xl transition-all duration-500 ${
          pulseEffect ? 'border-yellow-500 shadow-yellow-500/50 scale-105' : 'border-slate-600'
        }`} style={{ width: '600px' }}>
          
          {/* Header */}
          <div className="text-center pt-8 pb-6 border-b border-slate-700/50">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                SPORTS AUCTION
              </h1>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-slate-300 text-lg">Player Selection Lottery</p>
            {error && (
              <div className="mt-2 text-orange-400 text-sm">⚠️ {error}</div>
            )}
          </div>

          {/* Slot Machine */}
          <div className="px-8 py-10">
            {/* Reels Container */}
            <div className="bg-gradient-to-br from-slate-900 to-black rounded-2xl p-8 border-2 border-slate-700 shadow-inner relative overflow-hidden">
              
              {/* Machine glow */}
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl transition-opacity duration-500 ${
                isSpinning ? 'opacity-100' : 'opacity-50'
              }`}></div>
              
              {/* Reels */}
              <div className="flex justify-center items-center gap-4 relative z-10">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="reel-container">
                    <div className={`reel-frame ${reelStates[index] ? 'spinning' : ''}`}>
                      <div 
                        className="reel-content"
                        style={{
                          transform: `translateY(${reelTranslates[index]}px)`,
                          transition: reelTransitions[index]
                        }}
                      >
                        {reelContents[index].map((num, i) => (
                          <div key={i} className="reel-number">{num}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 left-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse animation-delay-500"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse animation-delay-1000"></div>
                </div>
              </div>
            </div>

            {/* Current Result Display */}
            <div className="mt-6 text-center">
              <div className="text-2xl text-slate-400 mb-2">Selected Player ID</div>
              <div className={`text-6xl font-bold font-mono transition-all duration-500 ${
                showWinEffect 
                  ? 'text-yellow-400 scale-110 drop-shadow-lg' 
                  : 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent'
              }`}>
                #{currentNumber.toString().padStart(3, '0')}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="px-8 pb-8">
            <button
              onClick={spinLottery}
              disabled={isSpinning}
              className={`w-full py-4 px-8 rounded-xl font-bold text-xl transition-all duration-300 transform ${
                isSpinning
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white shadow-2xl hover:shadow-orange-500/50 hover:scale-105 active:scale-95'
              } relative overflow-hidden`}
            >
              {isSpinning && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              )}
              <div className="flex items-center justify-center gap-3">
                <Zap className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? 'DRAWING PLAYER...' : 'START LOTTERY DRAW'}
                <Users className="w-6 h-6" />
              </div>
            </button>
          </div>

          {/* Status Bar */}
          <div className="px-8 pb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isSpinning ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
                  }`}></div>
                  <span className="text-slate-400">
                    {isSpinning ? 'Drawing in progress...' : 'Ready for next draw'}
                  </span>
                </div>
                {lastResult && (
                  <div className="text-slate-400">
                    Last: <span className="text-yellow-400 font-mono">#{lastResult.toString().padStart(3, '0')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .reel-container {
          position: relative;
          width: 120px;
          height: 120px;
        }
        
        .reel-frame {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #1e293b, #0f172a);
          border: 3px solid #334155;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .reel-frame.spinning {
          border-color: #f59e0b;
          box-shadow: inset 0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(245, 158, 11, 0.3);
        }
        
        .reel-content {
          display: flex;
          flex-direction: column;
          position: absolute;
          width: 100%;
        }
        
        .reel-number {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: #f1f5f9;
          text-shadow: 0 0 10px rgba(241, 245, 249, 0.5);
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default SlotCounter;