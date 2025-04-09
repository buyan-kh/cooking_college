"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, FileText, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, NotesQuiz } from "@/lib/api";
import { toast } from "sonner";
import { NotesImageViewer } from "@/components/notes-image-viewer";
import { MultipleChoiceQuiz } from "@/components/ui/multiple-choice-quiz";
import { CircularTimer } from "@/components/circular-timer";
import { Calendar } from "@/components/calendar";

// Sample notes quiz data as fallback
const sampleNotesQuizzes = {
  n1: {
    title: "Algorithm Complexity",
    description: "Test your knowledge of Big O notation from your notes",
    source: "Lecture Notes - Week 3",
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
      {
        id: 3,
        question: "What does space complexity measure?",
        options: [
          "The amount of memory used by an algorithm",
          "The speed of an algorithm",
          "The number of lines of code in an algorithm",
          "The number of operations performed by an algorithm",
        ],
        correctAnswer: "The amount of memory used by an algorithm",
      },
    ],
  },
  n2: {
    title: "Sorting Algorithms",
    description: "Test your knowledge of sorting methods from your notes",
    source: "Textbook Chapter 4 Notes",
    questions: [
      {
        id: 1,
        question: "Which sorting algorithm uses a divide-and-conquer approach?",
        options: [
          "Bubble Sort",
          "Insertion Sort",
          "Merge Sort",
          "Selection Sort",
        ],
        correctAnswer: "Merge Sort",
      },
      {
        id: 2,
        question: "What is the best case time complexity of Quicksort?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctAnswer: "O(n log n)",
      },
    ],
  },
  // Add dynamic quizzes for each topic
  n3: {
    title: "Data Structures Fundamentals",
    description: "Test your understanding of basic data structures",
    source: "Your uploaded notes",
    questions: [
      {
        id: 1,
        question: "Which data structure follows the LIFO principle?",
        options: ["Queue", "Stack", "Linked List", "Array"],
        correctAnswer: "Stack",
      },
      {
        id: 2,
        question:
          "What is the primary advantage of a linked list over an array?",
        options: [
          "Dynamic size allocation",
          "Faster access time",
          "Less memory usage",
          "Simpler implementation",
        ],
        correctAnswer: "Dynamic size allocation",
      },
    ],
  },
  n4: {
    title: "Object-Oriented Programming",
    description: "Test your knowledge of OOP concepts",
    source: "Your uploaded notes",
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

export default function NotesQuizPage({
  params,
}: {
  params: { id: string; quizId: string };
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [quizData, setQuizData] = useState<NotesQuiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const courseId = params.id;
  const quizId = params.quizId;

  // Extract the topic number from quizId (format is 'nX' where X is the topic number)
  const topicNumber = parseInt(quizId.replace("n", ""), 10);

  // Fetch quiz data from the API
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setIsLoading(true);

        // Fetch quiz data for this topic
        const notesQuiz = await api.getNotesQuiz(courseId, topicNumber);

        if (notesQuiz) {
          setQuizData(notesQuiz);

          // If there's an image associated with the quiz, set the image URL
          if (notesQuiz.image_id) {
            setImageUrl(api.getImageUrl(notesQuiz.image_id));
          }
        } else {
          // Fallback to sample quiz data if API doesn't return anything
          const fallbackQuiz =
            sampleNotesQuizzes[quizId as keyof typeof sampleNotesQuizzes];
          if (fallbackQuiz) {
            // Convert to the same format as API data
            setQuizData({
              _id: quizId,
              course_id: courseId,
              topic_number: topicNumber,
              title: fallbackQuiz.title,
              description: fallbackQuiz.description,
              source: fallbackQuiz.source,
              questions: fallbackQuiz.questions,
              created_at: new Date().toISOString(),
            });
          } else {
            setError("Quiz not found");
          }
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError(err instanceof Error ? err.message : "Failed to load quiz");
        toast.error("Failed to load quiz data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [courseId, quizId, topicNumber]);

  // Handle quiz completion
  const handleQuizComplete = (score: number) => {
    // You could save the score to localStorage or API here
    console.log(`Quiz completed with score: ${score}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading quiz data...</p>
      </div>
    );
  }

  // Error state
  if (error || !quizData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-destructive">Quiz not found</h1>
        <p className="text-muted-foreground mt-2 mb-4">
          {error || "The requested quiz could not be found"}
        </p>
        <Link href={`/dashboard/${courseId}`}>
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/${courseId}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">
            {quizData.title}
          </h2>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - quiz (2/3 width on desktop) */}
        <div className="md:col-span-2">
          <div className="mb-6">
            <p className="text-muted-foreground">{quizData.description}</p>
            <div className="mt-2 flex items-center text-sm text-primary">
              <FileText className="mr-1 h-4 w-4" /> Source: {quizData.source}
            </div>
          </div>

          {/* Display the image if available */}
          {imageUrl && (
            <div className="mb-6">
              <NotesImageViewer
                imageUrl={imageUrl}
                altText="Image from notes"
              />
            </div>
          )}

          {/* Use our MultipleChoiceQuiz component */}
          <MultipleChoiceQuiz
            questions={quizData.questions}
            title={quizData.title}
            description={quizData.description}
            onComplete={handleQuizComplete}
            backUrl={`/dashboard/${courseId}`}
            courseId={courseId}
          />
        </div>

        {/* Sidebar - 1/3 width on desktop */}
        <div className="md:relative">
          <div className="md:sticky md:top-6 space-y-6">
            {/* Pomodoro Timer */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Study Timer</h2>
              <div className="flex flex-col items-center">
                <CircularTimer />
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Use the Pomodoro technique: 25 minutes of focused work
                  followed by a 5-minute break.
                </p>
              </div>
            </Card>

            {/* Calendar widget */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Study Calendar</h2>
              <Calendar />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
