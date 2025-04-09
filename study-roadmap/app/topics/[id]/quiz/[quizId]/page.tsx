"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { MultipleChoiceQuiz } from "@/components/ui/multiple-choice-quiz";

// Sample quiz data - in a real app, this would be generated from the syllabus
const quizzes = {
  p1: {
    title: "Pre-Lecture Quiz - Computer Science",
    description: "Test your knowledge of computer science fundamentals",
    topicIndex: 0, // Maps to the first topic in the roadmap
    questions: [
      {
        id: 1,
        question: "What does CPU stand for?",
        options: [
          "Central Processing Unit",
          "Computer Personal Unit",
          "Central Processor Utility",
          "Central Program Unit",
        ],
        correctAnswer: "Central Processing Unit",
      },
      {
        id: 2,
        question: "Which of the following is NOT a programming paradigm?",
        options: [
          "Object-Oriented Programming",
          "Functional Programming",
          "Procedural Programming",
          "Analytical Programming",
        ],
        correctAnswer: "Analytical Programming",
      },
      {
        id: 3,
        question: "What is the binary representation of the decimal number 10?",
        options: ["1010", "1000", "1100", "1001"],
        correctAnswer: "1010",
      },
    ],
  },
  p2: {
    title: "Pre-Lecture Quiz - Programming",
    description: "Basic programming concepts and syntax",
    topicIndex: 1, // Maps to the second topic in the roadmap
    questions: [
      {
        id: 1,
        question:
          "Which data type is used to store whole numbers in most programming languages?",
        options: ["Integer", "Float", "String", "Boolean"],
        correctAnswer: "Integer",
      },
      {
        id: 2,
        question: "What is the purpose of a loop in programming?",
        options: [
          "To repeat a block of code multiple times",
          "To store data in memory",
          "To connect to a database",
          "To display output to the user",
        ],
        correctAnswer: "To repeat a block of code multiple times",
      },
    ],
  },
  p3: {
    title: "Pre-Lecture Quiz - Algorithms",
    description: "Understanding algorithm basics",
    topicIndex: 2, // Maps to the third topic in the roadmap
    questions: [
      {
        id: 1,
        question: "What is the time complexity of binary search?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        correctAnswer: "O(log n)",
      },
      {
        id: 2,
        question:
          "Which sorting algorithm has the worst case time complexity of O(n²)?",
        options: ["Merge Sort", "Quick Sort", "Bubble Sort", "Heap Sort"],
        correctAnswer: "Bubble Sort",
      },
    ],
  },
  p4: {
    title: "Pre-Lecture Quiz - OOP",
    description: "Object-oriented programming concepts",
    topicIndex: 3, // Maps to the fourth topic in the roadmap
    questions: [
      {
        id: 1,
        question: "What is encapsulation in OOP?",
        options: [
          "Bundling data and methods that operate on that data",
          "Creating multiple instances of a class",
          "Inheriting properties from a parent class",
          "Overriding methods in a subclass",
        ],
        correctAnswer: "Bundling data and methods that operate on that data",
      },
      {
        id: 2,
        question:
          "Which OOP principle allows a class to inherit properties from another class?",
        options: [
          "Encapsulation",
          "Inheritance",
          "Polymorphism",
          "Abstraction",
        ],
        correctAnswer: "Inheritance",
      },
    ],
  },
};

export default function QuizPage({
  params,
}: {
  params: { id: string; quizId: string };
}) {
  const router = useRouter();
  const topicId = params.id;
  const quizId = params.quizId;
  const quiz = quizzes[quizId as keyof typeof quizzes];

  // Handle quiz completion
  const handleQuizComplete = (score: number) => {
    // Calculate the percentage of correct answers
    const scorePercentage = Math.round((score / quiz.questions.length) * 100);

    try {
      // Get existing progress data or initialize new object
      const progressDataJSON = localStorage.getItem(`progress_${topicId}`);
      const progressData = progressDataJSON
        ? JSON.parse(progressDataJSON)
        : {
            topics: [],
            quizzes: {},
            overallProgress: 0,
          };

      // Update the quiz completion status
      progressData.quizzes[quizId] = {
        completed: true,
        score: scorePercentage,
        timestamp: new Date().toISOString(),
      };

      // Update the topic progress
      if (!progressData.topics[quiz.topicIndex]) {
        progressData.topics[quiz.topicIndex] = {
          progress: 0,
          completed: false,
        };
      }

      // Set topic progress based on quiz score
      progressData.topics[quiz.topicIndex].progress = scorePercentage;
      progressData.topics[quiz.topicIndex].completed = scorePercentage >= 70; // Consider completed if score is 70% or higher

      // Calculate overall progress
      const completedTopics = progressData.topics.filter(
        (t: any) => t && t.completed
      ).length;
      const totalTopics = Object.keys(quizzes).length;
      progressData.overallProgress = Math.round(
        (completedTopics / totalTopics) * 100
      );

      // Save updated progress data
      localStorage.setItem(`progress_${topicId}`, JSON.stringify(progressData));

      console.log("Progress updated:", progressData);
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Quiz not found</h1>
        <Link href={`/dashboard/${topicId}`}>
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/${topicId}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">{quiz.title}</h2>
        </div>
        <ThemeToggle />
      </div>

      <div className="mb-6">
        <p className="text-muted-foreground">{quiz.description}</p>
      </div>

      {/* Use our new MultipleChoiceQuiz component */}
      <MultipleChoiceQuiz
        questions={quiz.questions}
        title={quiz.title}
        description={quiz.description}
        onComplete={handleQuizComplete}
        backUrl={`/dashboard/${topicId}`}
        courseId={topicId}
      />
    </div>
  );
}
