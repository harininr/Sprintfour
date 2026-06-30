import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface ReviewAction {
  id: string;
  redactionId: string;
  action: "confirmed" | "rejected" | "ignored";
  timestamp: number;
}

export function useReviewBehavior() {
  const [actions, setActions] = useState<ReviewAction[]>([]);
  const lastActionTime = useRef<number>(Date.now());
  const rapidActionCount = useRef<number>(0);

  const recordAction = (redactionId: string, action: "confirmed" | "rejected" | "ignored") => {
    const now = Date.now();
    const timeSinceLast = now - lastActionTime.current;
    
    // Fatigue detection: under 500ms between actions
    if (timeSinceLast < 500) {
      rapidActionCount.current += 1;
      if (rapidActionCount.current >= 3) {
        toast.warning("Review Fatigue Detected", {
          description: "You're reviewing very fast. Consider slowing down for critical entities to avoid blind spots.",
          duration: 5000,
        });
        rapidActionCount.current = 0; // reset
      }
    } else {
      rapidActionCount.current = 0;
    }
    
    lastActionTime.current = now;

    // Record action for pattern nudges & undo history
    setActions(prev => {
      const newActions = [...prev, { id: Math.random().toString(), redactionId, action, timestamp: now }];
      
      // Self Pattern Nudges logic: 4 of the same action in a row
      if (newActions.length >= 4) {
        const last4 = newActions.slice(-4);
        if (last4.every(a => a.action === action)) {
          // Trigger nudge only if we haven't recently nudged (simple debounce could be added, but this is a hackathon MVP)
          if (action === "ignored") {
            toast("Pattern Detected", {
              description: "You've ignored 4 similar detections in a row. Would you like to review them again?",
              action: {
                label: "Review Again",
                onClick: () => console.log("Review Again clicked")
              }
            });
          }
        }
      }

      return newActions;
    });
  };

  const getSessionInsights = () => {
    const totalTime = Date.now() - (actions[0]?.timestamp || Date.now());
    const speed = actions.length > 0 ? totalTime / actions.length : 0;
    
    return {
      totalActions: actions.length,
      averageSpeedMs: speed,
      fatigueWarnings: rapidActionCount.current,
    };
  };

  return { recordAction, actions, getSessionInsights };
}
