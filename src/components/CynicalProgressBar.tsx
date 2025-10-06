import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface CynicalProgressBarProps {
  type: "analysis" | "questionnaire";
  duration?: number; // duration in milliseconds
  onComplete?: () => void;
  forceComplete?: boolean;
  autoComplete?: boolean;
}

const ANALYSIS_STEPS = [
  { text: "Hledáme vaši firmu na internetu...", progress: 10 },
  { text: "Čteme si stížnosti zákazníků...", progress: 25 },
  { text: "Analyzujeme, jak moc jste přeceňovaní...", progress: 40 },
  { text: "Počítáme, kolik máte skutečně spokojených zaměstnanců...", progress: 55 },
  { text: "Odhadujeme, kdy se rozpadnete...", progress: 70 },
  { text: "Hledáme vaše skryté dluhy...", progress: 85 },
  { text: "Připravujeme brutálně upřímnou zprávu...", progress: 100 }
];

const QUESTIONNAIRE_STEPS = [
  { text: "Analyzujeme vaše odpovědi...", progress: 15 },
  { text: "Porovnáváme s jinými obětmi... ehm, klienty...", progress: 30 },
  { text: "Hledáme vaše slabiny a neurcy...", progress: 45 },
  { text: "Počítáme, jak moc se klamete...", progress: 60 },
  { text: "Vytváříme seznam vašich iluzí...", progress: 75 },
  { text: "Připravujeme rady, které stejně neposlechnete...", progress: 90 },
  { text: "Dokončujeme vaši psychologickou pitvu...", progress: 100 }
];

export const CynicalProgressBar = ({ 
  type, 
  duration, 
  onComplete,
  forceComplete = false,
  autoComplete = true 
}: CynicalProgressBarProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  const steps = type === "analysis" ? ANALYSIS_STEPS : QUESTIONNAIRE_STEPS;
  const defaultDuration = type === "analysis" ? 30000 : 20000;
  const actualDuration = duration || defaultDuration;
  const stepDuration = actualDuration / steps.length;

  useEffect(() => {
    if (forceComplete && !completed) {
      setCurrentStep(steps.length - 1);
      setProgress(100);
      setCompleted(true);
      onComplete?.();
      return;
    }
  }, [forceComplete, completed, steps.length, onComplete]);

  useEffect(() => {
    if (completed || forceComplete) return;

    setProgress(steps[0].progress);
    let stepIndex = 0;

    const interval = setInterval(() => {
      stepIndex++;
      
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        setProgress(steps[stepIndex].progress);
        
        // If this is the last step and autoComplete is true
        if (stepIndex === steps.length - 1 && autoComplete) {
          setCompleted(true);
          onComplete?.();
        }
      } else {
        // Stop at the last step, don't loop
        clearInterval(interval);
        if (!completed && autoComplete) {
          setCompleted(true);
          onComplete?.();
        }
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [steps, stepDuration, completed, forceComplete, autoComplete, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-foreground">
          Krok {currentStep + 1} z {steps.length}
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground animate-fade-in">
          {steps[currentStep].text}
        </p>
      </div>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground/70">
          Strpení, analýza může chvilku trvat... ☕
        </p>
      </div>
    </div>
  );
};
