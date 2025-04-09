"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  Upload,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, RoadmapEntry } from "@/lib/api";
import { toast } from "sonner";
import { CircularTimer } from "@/components/circular-timer";
import { Calendar } from "@/components/calendar";

// Fallback roadmap data if API fails
const fallbackRoadmap = [
  {
    id: 1,
    title: "Introduction to the Subject",
    description: "Getting started with the fundamentals",
    progress: 100,
    completed: true,
  },
  {
    id: 2,
    title: "Core Concepts",
    description: "Understanding the key principles",
    progress: 65,
    completed: false,
  },
  {
    id: 3,
    title: "Advanced Topics",
    description: "Delving deeper into complex ideas",
    progress: 30,
    completed: false,
  },
  {
    id: 4,
    title: "Practical Applications",
    description: "Applying concepts to real-world scenarios",
    progress: 0,
    completed: false,
  },
];

export default function CourseRoadmap({ params }: { params: { id: string } }) {
  const [roadmapItems, setRoadmapItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicsWithNotes, setTopicsWithNotes] = useState<
    Record<string, boolean>
  >({});
  const [subjectTitle, setSubjectTitle] = useState<string>("Course Roadmap");

  const courseId = params.id;

  // Load roadmap data from API
  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        console.log("Fetching roadmap for course:", courseId);
        const roadmapData = await api.getRoadmap(courseId);

        // Map API roadmap to dashboard format
        const formattedRoadmap = roadmapData.map((entry, index) => ({
          id: index + 1,
          title: entry.topic,
          description: entry.preQuizPrompt || "No description available",
          progress: 0, // Default to 0 progress
          completed: false,
          assignment: entry.assignment,
          date: entry.date,
        }));

        setRoadmapItems(formattedRoadmap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching roadmap:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setError(`Failed to load roadmap: ${errorMessage}`);
        toast.error(`Could not load roadmap from server: ${errorMessage}`);

        // Use fallback roadmap
        setRoadmapItems(fallbackRoadmap);
        setLoading(false);
      }
    };

    fetchRoadmap();

    // Load subject title
    try {
      const subjectsJSON = localStorage.getItem("subjects");
      if (subjectsJSON) {
        const subjects = JSON.parse(subjectsJSON);
        const subject = subjects.find(
          (s: any) =>
            s.id === courseId ||
            s.id.toString() === courseId ||
            (typeof s.id === "object" && s.id.$oid === courseId)
        );

        if (subject) {
          setSubjectTitle(subject.title || "Course Roadmap");
        }
      }
    } catch (error) {
      console.error("Error loading subject title:", error);
    }
  }, [courseId]);

  // Load topics with notes from localStorage
  useEffect(() => {
    try {
      const notesDataJSON = localStorage.getItem(`notes_${courseId}`);
      if (notesDataJSON) {
        setTopicsWithNotes(JSON.parse(notesDataJSON));
      }
    } catch (error) {
      console.error("Error loading notes data:", error);
    }
  }, [courseId]);

  // Load progress data from localStorage
  useEffect(() => {
    try {
      const progressDataJSON = localStorage.getItem(`progress_${courseId}`);
      if (progressDataJSON) {
        const progressData = JSON.parse(progressDataJSON);

        // If we have topic progress data, use it to update the roadmap items
        if (
          progressData.topics &&
          progressData.topics.length > 0 &&
          roadmapItems.length > 0
        ) {
          const updatedRoadmap = [...roadmapItems];

          progressData.topics.forEach((topicProgress: any, index: number) => {
            if (topicProgress && index < updatedRoadmap.length) {
              updatedRoadmap[index].progress = topicProgress.progress || 0;
              updatedRoadmap[index].completed =
                topicProgress.completed || false;
            }
          });

          setRoadmapItems(updatedRoadmap);
        }
      }
    } catch (error) {
      console.error("Error loading progress data:", error);
    }
  }, [courseId, roadmapItems.length]);

  // Check if a topic has notes
  const hasNotesForTopic = (topicId: number) => {
    return topicsWithNotes[topicId.toString()] === true;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Course Roadmap</h1>
          <ThemeToggle />
        </div>
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading roadmap data from syllabus...</p>
          </div>
        </Card>
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
          <h1 className="text-3xl font-bold text-foreground">
            {subjectTitle} Roadmap
          </h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - roadmap (2/3 width on desktop) */}
        <div className="md:col-span-2">
          <div className="mb-8 rounded-lg bg-card p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-card-foreground">
              Complete Course Roadmap
            </h2>
            <p className="mb-6 text-muted-foreground">
              Follow this structured learning path to master the subject
              material.
            </p>

            <div className="relative mb-8">
              <div className="absolute left-4 top-0 h-full w-0.5 bg-border"></div>

              {roadmapItems.map((topic, index) => (
                <div key={topic.id} className="relative mb-8 pl-10">
                  <div
                    className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ${
                      topic.completed ? "bg-green-600" : "bg-primary"
                    } text-primary-foreground`}
                  >
                    {topic.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <Card className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-card-foreground">
                          {topic.title}
                        </h3>
                        <span className="text-xs">
                          {topic.completed ? (
                            <span className="text-green-500 flex items-center">
                              <CheckCircle className="mr-1 h-3 w-3" /> Completed
                            </span>
                          ) : topic.progress > 0 ? (
                            `${topic.progress}% Complete`
                          ) : (
                            "Not Started"
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {topic.description}
                      </p>

                      {topic.date && (
                        <div className="text-xs text-muted-foreground mb-2">
                          Due date: {topic.date}
                        </div>
                      )}
                      {topic.assignment && (
                        <div className="text-xs text-amber-500 font-medium mb-2">
                          Assignment: {topic.assignment}
                        </div>
                      )}

                      <Progress value={topic.progress} className="h-1 mt-2" />

                      <div className="bg-muted/50 p-4 grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                        <Link
                          href={`/topics/${courseId}/quiz?topicNumber=${topic.id}`}
                        >
                          <Button variant="subtle" className="w-full">
                            Pre-Lecture Quiz{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <Link
                          href={`/notes/upload/${courseId}?topicId=${topic.id}`}
                        >
                          <Button variant="outline" className="w-full">
                            Post-Lecture Notes{" "}
                            <Upload className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <Link
                          href={
                            hasNotesForTopic(topic.id)
                              ? `/topics/${courseId}/notes-quiz/n${topic.id}`
                              : "#"
                          }
                        >
                          <Button
                            className={`w-full relative ${
                              !hasNotesForTopic(topic.id)
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            variant={
                              hasNotesForTopic(topic.id) ? "default" : "outline"
                            }
                            disabled={!hasNotesForTopic(topic.id)}
                          >
                            Notes Quiz
                            {!hasNotesForTopic(topic.id) && (
                              <div className="text-[10px] absolute -bottom-5 w-full text-center">
                                Upload notes first
                              </div>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
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
