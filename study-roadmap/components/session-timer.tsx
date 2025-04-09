"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pause, Play, RefreshCw } from "lucide-react";
import { StreakTracker } from "@/components/streak-tracker";

export function SessionTimer() {
  // Work timer state - 25 minutes
  const [workMinutes] = useState(25);
  const [workSecondsLeft, setWorkSecondsLeft] = useState(25 * 60);
  const [isWorkRunning, setIsWorkRunning] = useState(false);

  // Break timer state - 5 minutes
  const [breakMinutes] = useState(5);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(5 * 60);
  const [isBreakRunning, setIsBreakRunning] = useState(false);

  const workProgress =
    ((workMinutes * 60 - workSecondsLeft) / (workMinutes * 60)) * 100;
  const breakProgress =
    ((breakMinutes * 60 - breakSecondsLeft) / (breakMinutes * 60)) * 100;

  // Work timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isWorkRunning) {
      interval = setInterval(() => {
        setWorkSecondsLeft((prev) => {
          if (prev <= 0) {
            setIsWorkRunning(false);
            setIsBreakRunning(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkRunning]);

  // Break timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isBreakRunning) {
      interval = setInterval(() => {
        setBreakSecondsLeft((prev) => {
          if (prev <= 0) {
            setIsBreakRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreakRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const resetWorkTimer = () => {
    setWorkSecondsLeft(workMinutes * 60);
    setIsWorkRunning(false);
  };

  const resetBreakTimer = () => {
    setBreakSecondsLeft(breakMinutes * 60);
    setIsBreakRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Study Streak Tracker */}
      <StreakTracker />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-card-foreground">Work</h3>
          <span className="text-sm font-medium text-card-foreground">
            {formatTime(workSecondsLeft)}
          </span>
        </div>
        <Progress value={workProgress} className="h-2" />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {Math.floor((workMinutes * 60 - workSecondsLeft) / 60)}:
            {((workMinutes * 60 - workSecondsLeft) % 60)
              .toString()
              .padStart(2, "0")}{" "}
            / {workMinutes}:00
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setIsWorkRunning(!isWorkRunning);
                if (!isWorkRunning) setIsBreakRunning(false);
              }}
            >
              {isWorkRunning ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={resetWorkTimer}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-card-foreground">Break</h3>
          <span className="text-sm font-medium text-card-foreground">
            {formatTime(breakSecondsLeft)}
          </span>
        </div>
        <Progress value={breakProgress} className="h-2" />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {Math.floor((breakMinutes * 60 - breakSecondsLeft) / 60)}:
            {((breakMinutes * 60 - breakSecondsLeft) % 60)
              .toString()
              .padStart(2, "0")}{" "}
            / {breakMinutes}:00
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setIsBreakRunning(!isBreakRunning);
                if (!isBreakRunning) setIsWorkRunning(false);
              }}
            >
              {isBreakRunning ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={resetBreakTimer}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
