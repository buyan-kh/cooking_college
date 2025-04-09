"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle,
  BookOpen,
  Clock,
  CheckSquare,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { CircularTimer } from "@/components/circular-timer";
import { Calendar } from "@/components/calendar";

export default function TopicPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicNumber = searchParams.get("topicNumber");
  const fromRoadmap = searchParams.get("from") === "roadmap";

  const courseId = params.id as string;
  const [userId] = useState("user-1"); // In a real app, this would come from authentication
  const [topic, setTopic] = useState<{
    title: string;
    content: string;
    progress: number;
    completed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [progressUpdated, setProgressUpdated] = useState(false);

  // Load topic data
  useEffect(() => {
    const loadTopic = () => {
      try {
        // Check if we have roadmap data in localStorage
        const roadmapItemsJSON = localStorage.getItem(
          `roadmapItems_${courseId}`
        );
        if (roadmapItemsJSON && topicNumber) {
          const roadmapItems = JSON.parse(roadmapItemsJSON);
          const topicIndex = parseInt(topicNumber) - 1;

          if (roadmapItems[topicIndex]) {
            // Get progress data
            const progressDataJSON = localStorage.getItem(
              `progress_${courseId}`
            );
            let progressData = progressDataJSON
              ? JSON.parse(progressDataJSON)
              : { topics: [] };

            if (!progressData.topics) {
              progressData.topics = [];
            }

            // Get or initialize topic progress
            let topicProgress = progressData.topics[topicIndex] || {
              progress: 0,
              completed: false,
            };

            // Create topic object
            setTopic({
              title: roadmapItems[topicIndex].title,
              content:
                roadmapItems[topicIndex].content ||
                "This topic content is being generated...",
              progress: topicProgress.progress || 0,
              completed: topicProgress.completed || false,
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading topic:", error);
        setLoading(false);
      }
    };

    loadTopic();
  }, [courseId, topicNumber]);

  // Track time spent on page for progress
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update progress based on time spent (after 30 seconds, mark as in progress)
  useEffect(() => {
    if (topic && !topic.completed && timeSpent >= 30 && !progressUpdated) {
      updateTopicProgress(75); // 75% after spending time reading
      setProgressUpdated(true);
    }
  }, [timeSpent, topic, progressUpdated]);

  const updateTopicProgress = (newProgress: number, markCompleted = false) => {
    if (!topicNumber) return;

    try {
      const topicIndex = parseInt(topicNumber) - 1;

      // Get current progress data
      const progressDataJSON = localStorage.getItem(`progress_${courseId}`);
      let progressData = progressDataJSON
        ? JSON.parse(progressDataJSON)
        : { overallProgress: 0, topics: [] };

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

      // Update progress, don't decrease existing progress
      progressData.topics[topicIndex].progress = Math.max(
        progressData.topics[topicIndex].progress,
        newProgress
      );

      // Mark as completed if requested
      if (markCompleted) {
        progressData.topics[topicIndex].progress = 100;
        progressData.topics[topicIndex].completed = true;
      }

      // Recalculate overall progress
      const roadmapItemsJSON = localStorage.getItem(`roadmapItems_${courseId}`);
      if (roadmapItemsJSON) {
        const roadmapItems = JSON.parse(roadmapItemsJSON);
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
      }

      // Save updated progress
      localStorage.setItem(
        `progress_${courseId}`,
        JSON.stringify(progressData)
      );

      // Update local state
      setTopic((prev) =>
        prev
          ? {
              ...prev,
              progress: markCompleted
                ? 100
                : Math.max(prev.progress, newProgress),
              completed: markCompleted || prev.completed,
            }
          : null
      );

      // Send to backend if possible
      try {
        const topicNum = parseInt(topicNumber);
        api
          .updateTopicProgress(courseId, userId, {
            topic_number: topicNum,
            progress: markCompleted ? 100 : newProgress,
            completed: markCompleted,
          })
          .then(() => {
            console.log("Progress data sent to backend successfully");
          })
          .catch((error) => {
            console.error("Error sending progress to backend:", error);
          });
      } catch (error) {
        console.error("Error preparing progress data for backend:", error);
      }
    } catch (error) {
      console.error("Error updating topic progress:", error);
    }
  };

  const handleMarkAsComplete = () => {
    updateTopicProgress(100, true);
    toast.success("Topic marked as complete!");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Topic not found</h1>
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
          <h2 className="text-2xl font-bold text-foreground">{topic.title}</h2>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - 2/3 width on desktop */}
        <div className="md:col-span-2">
          <Card className="mb-6">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  <span className="font-medium">Study Material</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>
                    Time spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <Progress value={topic.progress} className="h-2" />
                <div className="mt-1 text-right text-sm text-muted-foreground">
                  {topic.completed ? (
                    <span className="text-green-500 flex items-center justify-end">
                      <CheckCircle className="mr-1 h-3 w-3" /> Completed
                    </span>
                  ) : (
                    `${topic.progress}% Complete`
                  )}
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                {topic.content.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <div className="flex space-x-4">
              <Link
                href={`/topics/${courseId}/quiz?topicNumber=${topicNumber}${
                  fromRoadmap ? "&from=roadmap" : ""
                }`}
              >
                <Button>Take Quiz</Button>
              </Link>

              {!topic.completed && (
                <Button
                  variant="outline"
                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                  onClick={handleMarkAsComplete}
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Mark as Complete
                </Button>
              )}
            </div>

            <Link
              href={
                fromRoadmap ? `/roadmap/${courseId}` : `/dashboard/${courseId}`
              }
            >
              <Button variant="ghost">
                Return to {fromRoadmap ? "Roadmap" : "Dashboard"}
              </Button>
            </Link>
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
