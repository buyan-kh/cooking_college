"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { api, Quiz, QuizQuestion, QuizAttempt } from "@/lib/api";
import { toast } from "sonner";
import { CircularTimer } from "@/components/circular-timer";
import { Calendar } from "@/components/calendar";
import { QuizPerformanceSummary } from "@/components/quiz-performance-summary";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTopicNumber = searchParams.get("topicNumber");
  const fromRoadmap = searchParams.get("from") === "roadmap";

  const courseId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userRating, setUserRating] = useState<
    "easy" | "medium" | "hard" | "dont_know" | null
  >(null);
  const [responses, setResponses] = useState<QuizAttempt[]>([]);
  const [completed, setCompleted] = useState(false);
  const [userId] = useState("user-1"); // In a real app, this would come from authentication
  const [quizSummary, setQuizSummary] = useState<{
    easy: number;
    medium: number;
    hard: number;
    dont_know: number;
    total: number;
  }>({ easy: 0, medium: 0, hard: 0, dont_know: 0, total: 0 });

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        // Check if quizzes exist, if not generate them
        const quizzesData = await api.getQuizzes(courseId);

        console.log("Initial topic number requested:", initialTopicNumber);

        if (quizzesData.quizzes.length === 0) {
          toast.info("Generating quizzes...");
          await api.generatePreQuizzes(courseId);
          const newQuizzesData = await api.getQuizzes(courseId);
          console.log(
            "Generated quizzes:",
            newQuizzesData.quizzes.map((q) => ({
              topic: q.topic,
              topic_number: q.topic_number,
            }))
          );

          setQuizzes(newQuizzesData.quizzes);

          // If we have an initial topic number, find the matching quiz
          if (initialTopicNumber) {
            setInitialQuiz(newQuizzesData.quizzes);
          }
        } else {
          console.log(
            "Existing quizzes:",
            quizzesData.quizzes.map((q) => ({
              topic: q.topic,
              topic_number: q.topic_number,
            }))
          );

          setQuizzes(quizzesData.quizzes);

          // If we have an initial topic number, find the matching quiz
          if (initialTopicNumber) {
            setInitialQuiz(quizzesData.quizzes);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setError("Failed to load quizzes. Please try again.");
        setLoading(false);
        toast.error("Failed to load quizzes");
      }
    };

    fetchQuizzes();
  }, [courseId, initialTopicNumber]);

  // Function to set the initial quiz based on topic number
  const setInitialQuiz = (availableQuizzes: Quiz[]) => {
    if (!initialTopicNumber) return;

    // Parse the topic number from the query parameter
    const topicNum = parseInt(initialTopicNumber, 10);
    console.log("Looking for topic number:", topicNum);
    console.log(
      "Available quiz topics:",
      availableQuizzes.map((q) => ({
        topic: q.topic,
        topic_number: q.topic_number,
        index: availableQuizzes.indexOf(q),
      }))
    );

    // First try: Find the quiz with the exact topic_number
    let quizIndex = availableQuizzes.findIndex(
      (quiz) => quiz.topic_number === topicNum
    );
    console.log(
      "Match by topic_number?",
      quizIndex !== -1 ? `Yes at index ${quizIndex}` : "No"
    );

    // Second try: Match by topic title containing the index
    if (quizIndex === -1) {
      quizIndex = availableQuizzes.findIndex(
        (quiz) =>
          quiz.topic.includes(`${topicNum}`) ||
          quiz.topic.includes(`${topicNum}.`) ||
          quiz.topic.toLowerCase().includes(`topic ${topicNum}`) ||
          quiz.topic.match(new RegExp(`^${topicNum}\\s`)) !== null // Starts with the number
      );
      console.log(
        "Match by topic title containing the number?",
        quizIndex !== -1 ? `Yes at index ${quizIndex}` : "No"
      );
    }

    // Third try: Get the topic title from the roadmap and match by similarity
    if (quizIndex === -1) {
      try {
        // Try to get the topic from localStorage using the courseId-specific key
        const roadmapItemsJSON = localStorage.getItem(
          `roadmapItems_${courseId}`
        );
        if (roadmapItemsJSON) {
          const roadmapItems = JSON.parse(roadmapItemsJSON);

          // Check if we have this topic number in roadmap
          if (roadmapItems[topicNum - 1]) {
            const roadmapTopicTitle = roadmapItems[topicNum - 1].title;
            console.log(
              "Trying to match roadmap topic title:",
              roadmapTopicTitle
            );

            // Find most similar title
            let bestMatchIndex = -1;
            let bestMatchScore = 0;

            availableQuizzes.forEach((quiz, idx) => {
              // Simple similarity check - count common words
              const quizWords = quiz.topic.toLowerCase().split(/\W+/);
              const roadmapWords = roadmapTopicTitle.toLowerCase().split(/\W+/);

              const commonWords = quizWords.filter(
                (word) => roadmapWords.includes(word) && word.length > 2
              ); // Only count words with 3+ chars

              const similarityScore = commonWords.length;

              if (similarityScore > bestMatchScore) {
                bestMatchScore = similarityScore;
                bestMatchIndex = idx;
              }
            });

            if (bestMatchScore > 0) {
              quizIndex = bestMatchIndex;
              console.log(
                `Matched by title similarity with score ${bestMatchScore} at index ${quizIndex}`
              );
            }
          }
        }
      } catch (error) {
        console.error("Error matching by topic title:", error);
      }
    }

    // Fourth try: If not found, try index-based (our data is 1-based, arrays are 0-based)
    if (quizIndex === -1) {
      // Check if we have a quiz at index topicNum-1 (convert from 1-based to 0-based)
      if (topicNum > 0 && topicNum <= availableQuizzes.length) {
        quizIndex = topicNum - 1;
        console.log(
          `Using index-based selection for topic #${topicNum} at index ${quizIndex}`
        );
      }
    }

    // If found by any method, set the current quiz index
    if (quizIndex !== -1) {
      setCurrentQuizIndex(quizIndex);
      console.log(
        `Starting with quiz for topic #${topicNum} at index ${quizIndex}: ${availableQuizzes[quizIndex].topic}`
      );
    } else {
      console.log(
        `Could not find quiz for topic #${topicNum}, starting with first quiz`
      );
    }
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleRating = (rating: "easy" | "medium" | "hard" | "dont_know") => {
    setUserRating(rating);

    // Update quiz summary counters
    setQuizSummary((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
      total: prev.total + 1,
    }));

    // Add response to the list
    const currentQuiz = quizzes[currentQuizIndex];
    const currentQuestion = currentQuiz.quiz[currentQuestionIndex];

    const response: QuizAttempt = {
      question_number: currentQuestion.index,
      question: currentQuestion.question,
      answer: currentQuestion.answer,
      user_rating: rating,
    };

    setResponses([...responses, response]);

    // Move to next question or quiz
    handleNext();
  };

  const handleNext = () => {
    // Reset state for next card
    setFlipped(false);
    setUserRating(null);

    const currentQuiz = quizzes[currentQuizIndex];

    // If there are more questions in the current quiz
    if (currentQuestionIndex < currentQuiz.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit this quiz's responses
      submitQuizAttempt();

      // Show completion screen for this quiz
      setCompleted(true);

      /* Old logic that required all quizzes to be completed
      // If there are more quizzes
      if (currentQuizIndex < quizzes.length - 1) {
        setCurrentQuizIndex(currentQuizIndex + 1);
        setCurrentQuestionIndex(0);
        setResponses([]);
      } else {
        // All quizzes completed
        setCompleted(true);
      }
      */
    }
  };

  // Add a handler for going to the previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setFlipped(false);
      setUserRating(null);
    }
  };

  const submitQuizAttempt = async () => {
    try {
      const currentQuiz = quizzes[currentQuizIndex];
      const result = await api.submitQuizAttempt(
        currentQuiz._id,
        userId,
        currentQuiz.topic_number,
        responses
      );
      toast.success(`Quiz ${currentQuizIndex + 1} completed!`);

      // Update the topic progress in localStorage when a quiz is completed
      updateTopicProgress(currentQuiz.topic_number);
    } catch (error) {
      console.error("Error submitting quiz attempt:", error);
      toast.error("Failed to save your responses");
    }
  };

  // Function to update the topic progress in localStorage
  const updateTopicProgress = (topicNumber: number) => {
    try {
      // Get current progress data from localStorage
      const progressDataJSON = localStorage.getItem(`progress_${courseId}`);
      let progressData = progressDataJSON
        ? JSON.parse(progressDataJSON)
        : {
            overallProgress: 0,
            quizzes: {},
            topics: [],
          };

      // Get the roadmap items to match topic number with ID
      const roadmapItemsJSON = localStorage.getItem(`roadmapItems_${courseId}`);
      if (roadmapItemsJSON) {
        const roadmapItems = JSON.parse(roadmapItemsJSON);

        // Find the matching topic in the roadmap
        // We need to match either by topic_number or by index+1
        let topicIndex = roadmapItems.findIndex(
          (item: any, idx: number) =>
            // If the topic has numbering in the title, it might match
            item.title.includes(` ${topicNumber}`) ||
            item.title.includes(`${topicNumber}.`) ||
            // Or just use the index+1 which is how we reference topics
            idx + 1 === topicNumber
        );

        // If not found, try using the topic number as an index
        if (
          topicIndex === -1 &&
          topicNumber > 0 &&
          topicNumber <= roadmapItems.length
        ) {
          topicIndex = topicNumber - 1;
        }

        console.log(
          "Updating progress for topic number:",
          topicNumber,
          "at index:",
          topicIndex
        );

        if (topicIndex !== -1) {
          // Initialize topics array if needed
          if (!progressData.topics) {
            progressData.topics = [];
          }

          // Initialize topic object if needed
          if (!progressData.topics[topicIndex]) {
            progressData.topics[topicIndex] = {
              progress: 0,
              completed: false,
            };
          }

          // Mark topic as 50% progress when quizzes are completed
          progressData.topics[topicIndex].progress = Math.max(
            progressData.topics[topicIndex].progress,
            50
          );

          // Store quiz results with the topic
          if (!progressData.quizzes[topicNumber]) {
            progressData.quizzes[topicNumber] = {
              completed: true,
              score: 50, // 50% for completing the quizzes
              ratings: {
                easy: 0,
                medium: 0,
                hard: 0,
                dont_know: 0,
              },
            };
          }

          // Count the ratings for this topic's quiz
          const topicResponses = responses.filter(
            (r) => r.question_number <= currentQuiz.quiz.length
          );
          topicResponses.forEach((response) => {
            progressData.quizzes[topicNumber].ratings[response.user_rating]++;
          });

          // Recalculate overall progress based on individual topic progress
          const totalTopics = roadmapItems.length;
          let completedProgress = 0;

          progressData.topics.forEach((topic: any) => {
            if (topic && topic.progress) {
              completedProgress += topic.progress;
            }
          });

          progressData.overallProgress = Math.round(
            completedProgress / totalTopics
          );

          // Save updated progress data
          localStorage.setItem(
            `progress_${courseId}`,
            JSON.stringify(progressData)
          );
          console.log("Updated progress data:", progressData);

          // Send the progress to the backend as well
          try {
            api
              .updateTopicProgress(courseId, userId, {
                topic_number: topicNumber,
                progress: progressData.topics[topicIndex].progress,
                completed: progressData.topics[topicIndex].completed,
                ratings: progressData.quizzes[topicNumber].ratings,
              })
              .then(() => {
                console.log("Progress data sent to backend successfully");
              })
              .catch((error) => {
                console.error("Error sending progress to backend:", error);
                // Don't block the UI flow on backend errors
              });
          } catch (error) {
            console.error("Error preparing progress data for backend:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error updating topic progress:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={
                fromRoadmap ? `/roadmap/${courseId}` : `/dashboard/${courseId}`
              }
            >
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
                {fromRoadmap ? "Roadmap" : "Dashboard"}
              </Button>
            </Link>
            <h2 className="text-xl font-bold">Quiz</h2>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main content - 2/3 width on desktop */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading quizzes...</span>
            </div>
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={
                fromRoadmap ? `/roadmap/${courseId}` : `/dashboard/${courseId}`
              }
            >
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
                {fromRoadmap ? "Roadmap" : "Dashboard"}
              </Button>
            </Link>
            <h2 className="text-xl font-bold">Quiz Error</h2>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main content - 2/3 width on desktop */}
          <div className="md:col-span-2">
            <Card className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <p className="mt-4 text-destructive">{error}</p>
              <Button className="mt-6" onClick={() => router.back()}>
                Go Back
              </Button>
            </Card>
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

  if (completed) {
    // Calculate final quiz summary percentages
    const totalResponses = quizSummary.total;
    const percentages = {
      easy: Math.round((quizSummary.easy / totalResponses) * 100) || 0,
      medium: Math.round((quizSummary.medium / totalResponses) * 100) || 0,
      hard: Math.round((quizSummary.hard / totalResponses) * 100) || 0,
      dont_know:
        Math.round((quizSummary.dont_know / totalResponses) * 100) || 0,
    };

    // Get current quiz for displaying the topic
    const currentQuiz = quizzes[currentQuizIndex];

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={
                fromRoadmap ? `/roadmap/${courseId}` : `/dashboard/${courseId}`
              }
            >
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
                {fromRoadmap ? "Roadmap" : "Dashboard"}
              </Button>
            </Link>
            <h2 className="text-xl font-bold">Quiz Results</h2>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main content - 2/3 width on desktop */}
          <div className="md:col-span-2">
            <QuizPerformanceSummary />

            <div className="flex justify-center space-x-4 mt-6">
              <Link
                href={
                  fromRoadmap
                    ? `/roadmap/${courseId}`
                    : `/dashboard/${courseId}`
                }
              >
                <Button variant="outline">
                  Return to {fromRoadmap ? "Roadmap" : "Dashboard"}
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setResponses([]);
                  setQuizSummary({
                    easy: 0,
                    medium: 0,
                    hard: 0,
                    dont_know: 0,
                    total: 0,
                  });
                  setCompleted(false);
                }}
              >
                Retry Quiz
              </Button>
              {currentQuizIndex < quizzes.length - 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentQuizIndex(currentQuizIndex + 1);
                    setCurrentQuestionIndex(0);
                    setResponses([]);
                    setQuizSummary({
                      easy: 0,
                      medium: 0,
                      hard: 0,
                      dont_know: 0,
                      total: 0,
                    });
                    setCompleted(false);
                  }}
                >
                  Next Topic Quiz
                </Button>
              )}
            </div>
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

  if (quizzes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={
                fromRoadmap ? `/roadmap/${courseId}` : `/dashboard/${courseId}`
              }
            >
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
                {fromRoadmap ? "Roadmap" : "Dashboard"}
              </Button>
            </Link>
            <h2 className="text-xl font-bold">Quizzes</h2>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main content - 2/3 width on desktop */}
          <div className="md:col-span-2">
            <Card className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
              <h2 className="text-xl font-semibold mt-4">
                No Quizzes Available
              </h2>
              <p className="mt-2 text-muted-foreground">
                There are no quizzes available for this course yet.
              </p>
              <div className="flex justify-center space-x-4 mt-6">
                <Link
                  href={
                    fromRoadmap
                      ? `/roadmap/${courseId}`
                      : `/dashboard/${courseId}`
                  }
                >
                  <Button variant="outline">
                    Return to {fromRoadmap ? "Roadmap" : "Dashboard"}
                  </Button>
                </Link>
                <Button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      toast.info("Generating quizzes...");
                      await api.generatePreQuizzes(courseId);
                      const newQuizzesData = await api.getQuizzes(courseId);
                      setQuizzes(newQuizzesData.quizzes);
                      setLoading(false);
                      toast.success("Quizzes generated successfully!");
                    } catch (error) {
                      const errorMessage =
                        error instanceof Error
                          ? error.message
                          : "Unknown error occurred";
                      setError(`Failed to generate quizzes: ${errorMessage}`);
                      setLoading(false);
                      toast.error(
                        `Failed to generate quizzes: ${errorMessage}`
                      );
                    }
                  }}
                >
                  Generate Quizzes
                </Button>
              </div>
            </Card>
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

  const currentQuiz = quizzes[currentQuizIndex];
  const currentQuestion = currentQuiz.quiz[currentQuestionIndex];
  const progress = Math.round(
    ((currentQuestionIndex + 1) / currentQuiz.quiz.length) * 100
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            href={
              fromRoadmap ? `/roadmap/${courseId}` : `/dashboard/${courseId}`
            }
          >
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
              {fromRoadmap ? "Roadmap" : "Dashboard"}
            </Button>
          </Link>
          <h2 className="text-xl font-bold">
            Quiz {currentQuizIndex + 1} of {quizzes.length}: {currentQuiz.topic}
          </h2>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - 2/3 width on desktop */}
        <div className="md:col-span-2">
          <div className="relative mb-4">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestionIndex + 1} of {currentQuiz.quiz.length}
              </span>
              <span>
                Quiz {currentQuizIndex + 1} of {quizzes.length}
              </span>
            </div>
          </div>

          <Card className="relative mx-auto p-8">
            <div
              className={`flip-card ${flipped ? "flipped" : ""} cursor-pointer`}
              onClick={handleFlip}
              style={{
                transformStyle: "preserve-3d",
                transition: "transform 0.6s",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <div
                className="flip-card-front bg-card"
                style={{
                  backfaceVisibility: "hidden",
                  position: flipped ? "absolute" : "relative",
                  width: "100%",
                  height: "100%",
                }}
              >
                <h3 className="mb-6 text-xl font-semibold">
                  {currentQuestion.question}
                </h3>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <br></br>
                  <br></br>
                  <br></br>
                  <br></br>
                  Click to reveal answer
                </div>
              </div>
              <div
                className="flip-card-back bg-card"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  position: flipped ? "relative" : "absolute",
                  width: "100%",
                  height: "100%",
                }}
              >
                <h3 className="mb-2 text-lg font-medium">Answer:</h3>
                <p className="text-lg">{currentQuestion.answer}</p>
              </div>
            </div>

            {flipped && (
              <div className="mt-8">
                {/* Navigation buttons for the back of the card at the same level as rating */}
                <div className="mb-4 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent rating action
                      handlePrevious();
                    }}
                    disabled={currentQuestionIndex <= 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent rating action
                      handleNext();
                    }}
                    disabled={
                      currentQuestionIndex >= currentQuiz.quiz.length - 1
                    }
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-500 hover:bg-green-500/10"
                    onClick={() => handleRating("easy")}
                  >
                    Easy
                  </Button>
                  <Button
                    variant="outline"
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                    onClick={() => handleRating("medium")}
                  >
                    Medium
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleRating("hard")}
                  >
                    Hard
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-500 text-gray-500 hover:bg-gray-500/10"
                    onClick={() => handleRating("dont_know")}
                  >
                    Don't Know
                  </Button>
                </div>
              </div>
            )}

            {!flipped && (
              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex <= 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleNext()}
                  disabled={currentQuestionIndex >= currentQuiz.quiz.length - 1}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
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
