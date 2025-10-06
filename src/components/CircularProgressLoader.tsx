import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const FUNNY_MESSAGES = [
  "Hledání informací o firmě...",
  "Počítání skřítků v účetnictví...", 
  "Hledání excelové tabulky s hesly...",
  "Analyzujeme slabiny...",
  "Čteme si na internetu...",
  "Kontrolujeme LinkedIn profily...",
  "Hledáme důvod, proč jste ještě nezbohatli...",
  "Počítáme kolik máte kafových přestávek...",
  "Zjišťujeme, kdo má nejhezčí kancelář...",
  "Analyzujeme schopnosti dělat prezentace...",
  "Hledáme skryté talenty...",
  "Počítáme kolik máte meetingů o meetingu...",
  "Zjišťujeme, proč nefunguje tiskárna...",
  "Analyzujeme teambuilding aktivity...",
  "Hledáme způsob, jak zvýšit produktivitu...",
  "Počítáme vnitřní motivace...",
  "Zjišťujeme, kdo má nejlepší kancelářskou židli...",
  "Analyzujeme firemní benefity...",
  "Hledáme důvod úspěchu/neúspěchu...",
  "Počítáme projekty s názvem 'urgent'...",
  "Zjišťujeme kvalitu firemní kávy...",
  "Analyzujeme způsoby prokrastinace...",
  "Hledáme konkurenční výhody...",
  "Počítáme čas strávený nad emaily...",
  "Zjišťujeme, kdo má největší monitor...",
];

interface CircularProgressLoaderProps {
  className?: string;
}

export function CircularProgressLoader({ className }: CircularProgressLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(FUNNY_MESSAGES[0]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => {
        const nextIndex = (prev + 1) % FUNNY_MESSAGES.length;
        setCurrentMessage(FUNNY_MESSAGES[nextIndex]);
        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Circular Progress */}
      <div className="relative w-16 h-16">
        <svg 
          className="w-16 h-16 transform -rotate-90" 
          viewBox="0 0 64 64"
        >
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="hsl(var(--accent))"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="175.9"
            strokeDashoffset="0"
            className="animate-spin origin-center"
            style={{
              animation: "spin 2s linear infinite",
              strokeDasharray: "140 40"
            }}
          />
        </svg>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Message */}
      <p className="text-sm text-muted-foreground text-center max-w-xs leading-5 animate-fade-in">
        {currentMessage}
      </p>
    </div>
  );
}