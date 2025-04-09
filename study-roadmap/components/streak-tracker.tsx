"use client";

import { CalendarDays, Trophy, Flame, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export function StreakTracker() {
  // Static data for demonstration
  const currentStreak = 3;
  const longestStreak = 4;
  const totalHours = 14;
  const weeklyGoal = 6; // days per week

  // Calculate percentage of weekly goal achieved
  const daysThisWeek = 3; // Static value representing days studied this week
  const weeklyProgress = (daysThisWeek / weeklyGoal) * 100;

  return (
    <div>
      {/* Streak Image */}
      <div className="flex justify-center mb-4">
        <Image
          src="/images/streak.png"
          alt="Study Streak"
          width={250}
          height={250}
          className="rounded-lg"
        />
      </div>

      <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 border-blue-100 dark:border-blue-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-amber-500" />
            Study Streak
          </h3>
          <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full text-blue-700 dark:text-blue-300">
            Level 3
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
            <div className="flex items-center text-amber-500">
              <Flame className="h-4 w-4 mr-1" />
              <span className="font-bold text-xl">{currentStreak}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Current Streak
            </span>
          </div>

          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
            <div className="flex items-center text-purple-500">
              <CalendarDays className="h-4 w-4 mr-1" />
              <span className="font-bold text-xl">{longestStreak}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Best Streak
            </span>
          </div>

          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
            <div className="flex items-center text-blue-500">
              <Zap className="h-4 w-4 mr-1" />
              <span className="font-bold text-xl">{totalHours}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Total Hours
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>
              Weekly Goal: {daysThisWeek}/{weeklyGoal} days
            </span>
            <span>{Math.round(weeklyProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              style={{ width: `${weeklyProgress}%` }}
            ></div>
          </div>
        </div>
      </Card>
    </div>
  );
}
