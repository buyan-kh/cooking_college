"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FileUp,
  BookOpen,
  Sparkles,
  Zap,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Sample topics data - in a real app, this would come from a database
const defaultTopics = [
  {
    id: 1,
    title: "Computer Science Fundamentals",
    description: "Basic concepts and principles of computer science",
    lastAccessed: "2 days ago",
    progress: 40,
    isDefault: true, // Mark default courses
  },
  {
    id: 2,
    title: "Web Development",
    description: "HTML, CSS, JavaScript and modern frameworks",
    lastAccessed: "1 week ago",
    progress: 65,
    isDefault: true, // Mark default courses
  },
  {
    id: 3,
    title: "Data Structures and Algorithms",
    description: "Essential algorithms and data structures",
    lastAccessed: "3 days ago",
    progress: 25,
    isDefault: true, // Mark default courses
  },
];

export default function Topics() {
  const [topicTitle, setTopicTitle] = useState("");
  const [topics, setTopics] = useState<any[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset timer when returning to subjects page
  useEffect(() => {
    // Clear timer state
    localStorage.removeItem("timer_mode");
    localStorage.removeItem("timer_timeLeft");
    localStorage.removeItem("timer_isRunning");
    localStorage.removeItem("timer_lastUpdated");
  }, []);

  // Load any custom subjects from localStorage on component mount
  useEffect(() => {
    try {
      // Get custom subjects from localStorage
      const subjectsJSON = localStorage.getItem("subjects");
      const customSubjects = subjectsJSON ? JSON.parse(subjectsJSON) : [];

      // Combine default topics with custom subjects
      setTopics([...defaultTopics, ...customSubjects]);
    } catch (error) {
      console.error("Error loading subjects:", error);
      setTopics(defaultTopics);
    }
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = (e: React.MouseEvent, topic: any) => {
    e.preventDefault(); // Prevent navigation to dashboard
    e.stopPropagation(); // Stop event propagation
    setCourseToDelete(topic);
    setIsDeleteDialogOpen(true);
  };

  // Delete course from both database and localStorage
  const deleteCourse = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);

    try {
      // Only call API if it's a custom course (not a default one)
      if (!courseToDelete.isDefault) {
        // Delete from database via API
        try {
          await api.deleteCourse(courseToDelete.id);
        } catch (error) {
          console.error("Error deleting course from database:", error);
          // We'll still continue with localStorage cleanup even if DB deletion fails
        }
      }

      // Clean up localStorage
      // 1. Remove from subjects list
      const subjectsJSON = localStorage.getItem("subjects");
      if (subjectsJSON) {
        const subjects = JSON.parse(subjectsJSON);
        const filteredSubjects = subjects.filter(
          (s: any) =>
            s.id !== courseToDelete.id &&
            s.id.toString() !== courseToDelete.id.toString() &&
            typeof s.id === "object" &&
            s.id.$oid !== courseToDelete.id
        );
        localStorage.setItem("subjects", JSON.stringify(filteredSubjects));
      }

      // 2. Remove related localStorage items
      const courseId = courseToDelete.id;
      localStorage.removeItem(`progress_${courseId}`);
      localStorage.removeItem(`notes_${courseId}`);
      localStorage.removeItem(`roadmapItems_${courseId}`);

      // 3. Update the topics list in state
      setTopics((prev) =>
        prev.filter(
          (t) =>
            t.id !== courseToDelete.id &&
            t.id.toString() !== courseToDelete.id.toString()
        )
      );

      toast.success(`Deleted course: ${courseToDelete.title}`);
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error("Error during course deletion:", error);
      toast.error("Failed to delete course. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="subtle-gradient-text">Cooking College</h1>
          <ThemeToggle />
        </div>

        <div className="grid gap-8">
          {/* Create New Subject */}
          <Card subtle className="p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary/70" />
              Create New Subject
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter subject title..."
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="text-base border-primary/20 focus:border-primary/40"
                />
              </div>
              <Link
                href={`/syllabus?type=upload&title=${encodeURIComponent(
                  topicTitle
                )}`}
              >
                <Button
                  variant="subtle"
                  className="w-full"
                  disabled={!topicTitle.trim()}
                >
                  <FileUp className="h-5 w-5 mr-2" />
                  Upload Syllabus
                </Button>
              </Link>
            </div>
          </Card>

          {/* My Subjects */}
          <Card subtle className="p-6 pattern-grid">
            <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary/70" />
              My Subjects
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <div key={topic.id} className="relative group">
                  <Link href={`/dashboard/${topic.id}`}>
                    <Card
                      subtle
                      className="h-full cursor-pointer p-4 transition-all"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-primary/70" />
                          <h3 className="text-lg font-medium text-card-foreground">
                            {topic.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 flex-grow">
                          {topic.description}
                        </p>
                        <div className="mt-auto">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">
                              Progress
                            </span>
                            <span className="text-xs font-medium text-primary/80">
                              {topic.progress}%
                            </span>
                          </div>
                          <Progress
                            value={topic.progress}
                            subtle
                            className="h-1.5"
                          />
                        </div>
                      </div>
                    </Card>
                  </Link>

                  {/* Delete button - only shown for custom courses or when hovered */}
                  {!topic.isDefault && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteClick(e, topic)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Course
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the course "
              {courseToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
