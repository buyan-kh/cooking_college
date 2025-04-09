"use client";

import { QuizPerformanceSummary } from "@/components/quiz-performance-summary";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function QuizResultsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/topics">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Quiz Results</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="my-8">
        <QuizPerformanceSummary />
      </div>

      {/* Topic info (optional) */}
      <div className="max-w-3xl mx-auto mt-12 text-center text-sm text-muted-foreground">
        <p>Introduction to Neural Networks • Data Structures and Algorithms</p>
        <p className="mt-1">Completed on April 8, 2024</p>
      </div>
    </div>
  );
}
