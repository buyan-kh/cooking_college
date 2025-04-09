"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  Award,
  Sparkles,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CircularTimer } from "@/components/circular-timer";
import { Calendar } from "@/components/calendar";
import { api, RoadmapEntry } from "@/lib/api";
import { toast } from "sonner";

// Default roadmap template for new subjects (fallback if API fails)
const defaultRoadmap = [
  {
    id: 1,
    title: "Introduction",
    description: "Getting started with the subject",
    progress: 0,
    completed: false,
  },
  {
    id: 2,
    title: "Fundamentals",
    description: "Core principles and concepts",
    progress: 0,
    completed: false,
  },
  {
    id: 3,
    title: "Advanced Topics",
    description: "Deeper exploration of the subject",
    progress: 0,
    completed: false,
  },
];

// Sample topic data - in a real app, this would come from a database
const topics = {
  "1": {
    title: "Computer Science Fundamentals",
    currentTopic: "Introduction to Algorithms",
    progress: 25,
    quizCorrect: 40,
    quizProgress: 35,
    assignments: [
      { id: 1, title: "Assignment 1", progress: 50, status: "complete" },
      { id: 2, title: "Quiz 1", progress: 75, status: "in-progress" },
      { id: 3, title: "Assignment 2", progress: 0, status: "incomplete" },
    ],
    hasNotes: true,
  },
  "2": {
    title: "Web Development",
    currentTopic: "CSS Flexbox and Grid",
    progress: 65,
    quizCorrect: 80,
    quizProgress: 60,
    assignments: [
      { id: 1, title: "HTML Basics", progress: 100, status: "complete" },
      { id: 2, title: "CSS Quiz", progress: 50, status: "in-progress" },
      { id: 3, title: "JavaScript Intro", progress: 0, status: "incomplete" },
    ],
    hasNotes: false,
  },
  "3": {
    title: "Data Structures and Algorithms",
    currentTopic: "Binary Search Trees",
    progress: 25,
    quizCorrect: 60,
    quizProgress: 40,
    assignments: [
      { id: 1, title: "Arrays Quiz", progress: 100, status: "complete" },
      { id: 2, title: "Linked Lists", progress: 30, status: "in-progress" },
      { id: 3, title: "Trees Assignment", progress: 0, status: "incomplete" },
    ],
    hasNotes: false,
  },
  "4": {
    title: "New Subject",
    currentTopic: "Introduction",
    progress: 5,
    quizCorrect: 0,
    quizProgress: 0,
    assignments: [
      { id: 1, title: "First Quiz", progress: 0, status: "incomplete" },
    ],
    hasNotes: false,
  },
};

export default function Dashboard() {
  // For Next.js 14, we need to use the useParams hook
  const params = useParams();
  const courseId = params.id as string;

  // Try to get custom subject from localStorage if it's not in our predefined list
  const [topic, setTopic] = useState<any>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [quizProgress, setQuizProgress] = useState(0);
  const [roadmapItems, setRoadmapItems] = useState<any[]>([]);
  const [apiRoadmap, setApiRoadmap] = useState<RoadmapEntry[]>([]);
  const [topicsWithNotes, setTopicsWithNotes] = useState<
    Record<string, boolean>
  >({});
  const [subjectTitle, setSubjectTitle] = useState<string>("Subject Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectNotFound, setSubjectNotFound] = useState(false);

  // Load roadmap data from API
  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        console.log("Fetching roadmap for course:", courseId);
        const roadmapData = await api.getRoadmap(courseId);
        setApiRoadmap(roadmapData);

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

        // Store roadmap items in localStorage for use by other pages
        localStorage.setItem(
          `roadmapItems_${courseId}`,
          JSON.stringify(formattedRoadmap)
        );

        // If we successfully fetched a roadmap, ensure topic is set
        if (!topic) {
          setTopic({
            title: subjectTitle || "New Course",
            currentTopic: "Getting Started",
            progress: 0,
            quizCorrect: 0,
            quizProgress: 0,
            assignments: [],
            hasNotes: false,
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching roadmap:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setError(`Failed to load roadmap: ${errorMessage}`);
        toast.error(`Could not load roadmap from server: ${errorMessage}`);
        setLoading(false);
      }
    };

    fetchRoadmap();
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
        setOverallProgress(progressData.overallProgress || 0);

        // Calculate quiz progress as average of all quiz scores
        const quizzes = progressData.quizzes || {};
        if (Object.keys(quizzes).length > 0) {
          const totalScore = Object.values(quizzes).reduce(
            (sum: number, quiz: any) => sum + quiz.score,
            0
          );
          setQuizProgress(Math.round(totalScore / Object.keys(quizzes).length));
        }

        // If we have topic progress data, use it to update the roadmap items
        if (progressData.topics && progressData.topics.length > 0) {
          // For custom subjects, update the default roadmap with progress data
          const updatedDefaultTopics = [...defaultRoadmap];

          progressData.topics.forEach((topicProgress: any, index: number) => {
            if (topicProgress && index < updatedDefaultTopics.length) {
              updatedDefaultTopics[index].progress =
                topicProgress.progress || 0;
              updatedDefaultTopics[index].completed =
                topicProgress.completed || false;
            }
          });

          // Only use default roadmap if we don't have API roadmap
          if (roadmapItems.length === 0) {
            setRoadmapItems(updatedDefaultTopics);
          }
        }
      }
    } catch (error) {
      console.error("Error loading progress data:", error);
    }
  }, [courseId]);

  // Load subject title
  useEffect(() => {
    try {
      const subjectsJSON = localStorage.getItem("subjects");
      if (subjectsJSON) {
        console.log("Subjects from localStorage:", subjectsJSON);
        const subjects = JSON.parse(subjectsJSON);

        // Check all possible ID formats
        const customSubject = subjects.find(
          (s: any) =>
            s.id === courseId ||
            s.id.toString() === courseId ||
            (typeof s.id === "object" && s.id.$oid === courseId)
        );

        console.log("Found subject:", customSubject);

        if (customSubject) {
          setSubjectTitle(customSubject.title);
          setTopic({
            title: customSubject.title,
            currentTopic: "Getting Started",
            progress: overallProgress,
            quizCorrect: 0,
            quizProgress: 0,
            assignments: [],
            hasNotes: false,
          });
          setSubjectNotFound(false);
        } else if (topics[courseId as keyof typeof topics]) {
          // It's one of our predefined topics
          setTopic(topics[courseId as keyof typeof topics]);
          setSubjectTitle(topics[courseId as keyof typeof topics].title);
          setSubjectNotFound(false);
        } else {
          console.log("No matching subject found in localStorage");
          // We'll wait for the API response to set topic
          if (roadmapItems.length === 0) {
            setSubjectNotFound(true);
          }
        }
      } else if (topics[courseId as keyof typeof topics]) {
        // It's one of our predefined topics
        setTopic(topics[courseId as keyof typeof topics]);
        setSubjectTitle(topics[courseId as keyof typeof topics].title);
        setSubjectNotFound(false);
      }
    } catch (error) {
      console.error("Error retrieving subject:", error);
    }
  }, [courseId, overallProgress, roadmapItems.length]);

  // Generate quizzes for this course
  const handleGenerateQuizzes = async () => {
    try {
      toast.info("Generating quizzes...");
      await api.generatePreQuizzes(courseId);
      toast.success("Quizzes generated successfully!");
    } catch (error) {
      console.error("Error generating quizzes:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to generate quizzes: ${errorMessage}`);
    }
  };

  // Function to redirect to a random topic quiz
  const handleRandomTopicQuiz = () => {
    // Only proceed if we have roadmap items
    if (roadmapItems.length === 0) {
      toast.error("No topics available. Upload a syllabus first.");
      return;
    }

    // Get a random topic index
    const randomIndex = Math.floor(Math.random() * roadmapItems.length);
    const randomTopic = roadmapItems[randomIndex];

    // Navigate to the random topic's pre-lecture quiz
    window.location.href = `/topics/${courseId}/quiz?topicNumber=${randomTopic.id}`;

    toast.success(`Selected quiz for topic: ${randomTopic.title}`);
  };

  const calculateOverallProgress = () => {
    // First check if we have progress data in localStorage
    try {
      const progressDataJSON = localStorage.getItem(`progress_${courseId}`);
      if (progressDataJSON) {
        const progressData = JSON.parse(progressDataJSON);
        if (progressData.overallProgress !== undefined) {
          // Return the cached overall progress
          return progressData.overallProgress;
        }
      }
    } catch (error) {
      console.error("Error reading progress from localStorage:", error);
    }

    // Fall back to calculating from roadmapItems
    const doneCount = roadmapItems.filter((item) => item.completed).length;
    const inProgressCount = roadmapItems.filter(
      (item) => !item.completed && item.progress > 0
    ).length;
    const totalCount = roadmapItems.length;

    if (totalCount === 0) return 0;

    // Weight completed items fully, in-progress items by their progress percentage
    const completedWeight = doneCount * 100;
    const inProgressWeight = roadmapItems.reduce((sum, item) => {
      if (!item.completed && item.progress > 0) {
        return sum + item.progress;
      }
      return sum;
    }, 0);

    return Math.round(
      ((completedWeight + inProgressWeight) / (totalCount * 100)) * 100
    );
  };

  // Update individual topic progress from localStorage
  const updateTopicProgressFromStorage = () => {
    try {
      const progressDataJSON = localStorage.getItem(`progress_${courseId}`);
      if (progressDataJSON) {
        const progressData = JSON.parse(progressDataJSON);

        if (
          progressData.topics &&
          progressData.topics.length > 0 &&
          roadmapItems.length > 0
        ) {
          const updatedRoadmapItems = [...roadmapItems];

          progressData.topics.forEach((topicProgress: any, index: number) => {
            if (topicProgress && index < updatedRoadmapItems.length) {
              updatedRoadmapItems[index] = {
                ...updatedRoadmapItems[index],
                progress: topicProgress.progress || 0,
                completed: topicProgress.completed || false,
              };
            }
          });

          setRoadmapItems(updatedRoadmapItems);
        }
      }
    } catch (error) {
      console.error("Error updating topic progress from storage:", error);
    }
  };

  // Call this function whenever roadmapItems are loaded or updated
  useEffect(() => {
    if (roadmapItems.length > 0) {
      updateTopicProgressFromStorage();
    }
  }, [apiRoadmap]);

  const hasNotesForTopic = (topicId: number) => {
    return topicsWithNotes[topicId.toString()] || false;
  };

  // If subject not found and we finished loading and no roadmap items were found
  if (subjectNotFound && !loading && roadmapItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Subject not found
          </h1>
          <p className="mb-4 text-muted-foreground">
            The course ID: {courseId} was not found in your subjects list.
          </p>
          <div className="space-y-4">
            <Link href="/topics">
              <Button className="mr-4">Back to Subjects</Button>
            </Link>
            <Link href={`/syllabus?title=New Subject&id=${courseId}`}>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Upload Syllabus for this ID
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Use stored progress if available, otherwise calculate from assignments
  const displayOverallProgress =
    overallProgress > 0 ? overallProgress : calculateOverallProgress();
  const displayQuizProgress =
    quizProgress > 0 ? quizProgress : topic?.quizProgress || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/topics">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects
            </Button>
          </Link>
          <h1 className="subtle-gradient-text">{subjectTitle}</h1>
        </div>
        <ThemeToggle />
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Loading roadmap data from syllabus...</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main content - 2/3 width on desktop */}
          <div className="space-y-6 md:col-span-2">
            {/* Progress overview */}
            <Card subtle className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Overall Progress
                </h2>
                <span className="text-sm font-medium">
                  {calculateOverallProgress()}% Complete
                </span>
              </div>
              <Progress
                value={displayOverallProgress}
                className="mt-2"
                subtle
              />

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="space-y-1">
                  <div className="flex items-start text-sm">
                    <div>
                      <p className="font-medium">Study Activity</p>
                      <p className="text-muted-foreground">
                        Last study session: Today
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-start text-sm">
                    <div>
                      <p className="font-medium">Current Focus</p>
                      <p className="text-muted-foreground">
                        Complete roadmap topics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {error && (
                <div className="mt-4 p-2 bg-destructive/10 text-destructive text-sm rounded flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/roadmap/${courseId}`}>
                <Button variant="subtle" className="w-full">
                  <Award className="mr-2 h-4 w-4" /> View Full Roadmap
                </Button>
              </Link>
              <Link href={`/topics/${courseId}/quiz`}>
                <Button variant="subtle" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" /> Finals Exam Preperation
                </Button>
              </Link>
              <Button
                variant="subtle"
                className="w-full"
                onClick={handleRandomTopicQuiz}
              >
                <Zap className="mr-2 h-4 w-4" /> Random Topic Quiz
              </Button>
            </div>

            {/* Roadmap preview */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Study Roadmap</h2>
                <Link href={`/roadmap/${courseId}`}>
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {roadmapItems.length > 0 ? (
                <div className="space-y-4">
                  {roadmapItems.slice(0, 4).map((topic) => (
                    <Card key={topic.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{topic.title}</h3>
                          <span className="text-xs">
                            {topic.completed ? (
                              <span className="text-green-500 flex items-center">
                                <CheckCircle className="mr-1 h-3 w-3" />{" "}
                                Completed
                              </span>
                            ) : topic.progress > 0 ? (
                              `${topic.progress}% Complete`
                            ) : (
                              "Not Started"
                            )}
                          </span>
                        </div>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {topic.description}
                          </p>
                        )}
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

                        <Progress
                          value={topic.progress}
                          subtle
                          className="h-1 mt-2"
                        />

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
                                hasNotesForTopic(topic.id)
                                  ? "default"
                                  : "outline"
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
                  ))}

                  {roadmapItems.length > 4 && (
                    <div className="text-center mt-2">
                      <Link href={`/roadmap/${courseId}`}>
                        <Button variant="ghost">
                          View all {roadmapItems.length} topics{" "}
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">
                    No roadmap available. Upload a syllabus to get started.
                  </p>
                  <Link
                    href={`/syllabus?title=${encodeURIComponent(subjectTitle)}`}
                  >
                    <Button className="mt-4">
                      <Upload className="mr-2 h-4 w-4" /> Upload Syllabus
                    </Button>
                  </Link>
                </Card>
              )}
            </section>
          </div>

          {/* Sidebar - 1/3 width on desktop */}
          <div className="md:relative">
            <div className="md:sticky md:top-6 space-y-6">
              {/* Pomodoro Timer */}
              <Card className="p-4">
                <h2 className="mb-2 text-lg font-semibold">Study Tracking</h2>
                <div className="flex flex-col items-center">
                  <CircularTimer />
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Use the Pomodoro technique: 25 minutes of focused work
                    followed by a 5-minute break.
                  </p>
                </div>
              </Card>

              {/* Calendar widget here if needed */}
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Study Calendar</h2>
                <Calendar />
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
