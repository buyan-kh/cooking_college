"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CalendarPlus,
  BellRing,
  RotateCcw,
  Trophy,
  Brain,
  Target,
} from "lucide-react";

export function QuizPerformanceSummary() {
  // Static data
  const score = 70;
  const correctAnswers = 7;
  const totalQuestions = 10;
  const streakDays = 3;
  const recommendedDays = 5;

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Quiz Completed!</h2>
          <div className="flex items-center text-amber-500">
            <Trophy className="h-6 w-6 mr-2" />
            <span className="text-2xl font-bold">{score}%</span>
          </div>
        </div>

        {/* Score details */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Your Score</span>
            <span className="text-sm font-medium">
              {correctAnswers}/{totalQuestions} correct
            </span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
            <div className="flex justify-center text-blue-600 dark:text-blue-400 mb-1">
              <Brain className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">{correctAnswers}</div>
            <div className="text-xs text-muted-foreground">Easy Answers</div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
            <div className="flex justify-center text-amber-600 dark:text-amber-400 mb-1">
              <Target className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">
              {totalQuestions - correctAnswers}
            </div>
            <div className="text-xs text-muted-foreground">Needs Review</div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
            <div className="flex justify-center text-green-600 dark:text-green-400 mb-1">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold">{streakDays}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>

        {/* Recommendation banner */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/40 dark:to-purple-950/40 p-4 rounded-lg">
          <div className="flex items-start">
            <RotateCcw className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-lg mb-1">
                Spaced Repetition Recommendation
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Based on your performance summary, we recommend you to take this
                quiz again in{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {recommendedDays} days
                </span>{" "}
                for optimal knowledge retention.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" className="flex items-center">
                  <BellRing className="h-4 w-4 mr-2" />
                  Notify me in {recommendedDays} days
                </Button>
                <Button variant="outline" className="flex items-center">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add to calendar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button className="flex-1">Review Incorrect Answers</Button>
          <Button variant="outline" className="flex-1">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </Card>
  );
}
