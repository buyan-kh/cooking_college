"use client";

import type React from "react";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Camera, XCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CircularTimer } from "@/components/circular-timer";
import { Calendar } from "@/components/calendar";

// Update the component to handle the topicId parameter
export default function UploadNotes({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const subjectId = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Get the specific topic ID from the URL query parameters
  const topicId =
    typeof searchParams?.topicId === "string"
      ? parseInt(searchParams.topicId, 10)
      : 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!noteTitle) {
      toast.error("Please provide a title for your notes");
      return;
    }

    // Make sure at least one of content, file, or image is provided
    if (!noteText && !file && !image) {
      toast.error(
        "Please provide either text, a file, or an image for your notes"
      );
      return;
    }

    setLoading(true);

    try {
      // First save notes to the backend
      const uploadResult = await api.uploadNotes(
        subjectId,
        topicId,
        noteTitle,
        noteText,
        image || undefined,
        file || undefined
      );

      if (
        uploadResult.extracted_text_length &&
        uploadResult.extracted_text_length > 0
      ) {
        toast.info(
          `Successfully extracted ${uploadResult.extracted_text_length} characters from your file`
        );
      }

      // Save the fact that notes have been uploaded for this topic in localStorage
      const notesDataJSON = localStorage.getItem(`notes_${subjectId}`);
      const notesData = notesDataJSON ? JSON.parse(notesDataJSON) : {};

      // Mark this topic as having notes
      notesData[topicId] = true;

      // Save back to localStorage
      localStorage.setItem(`notes_${subjectId}`, JSON.stringify(notesData));

      // Show generating quiz message
      toast.info("Generating quiz from your notes...");

      // Then generate a quiz from the notes
      await api.generateNotesQuiz(subjectId, topicId);

      toast.success("Notes saved and quiz generated successfully!");

      // Redirect to the notes quiz
      router.push(`/topics/${subjectId}/notes-quiz/n${topicId}`);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save notes"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href={`/dashboard/${subjectId}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Upload Post-Lecture Notes
          </h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="note-title">Note Title</Label>
                <Input
                  id="note-title"
                  placeholder="e.g., Lecture 1 Notes, Chapter 3 Summary, etc."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-text">Enter Notes Text</Label>
                <Textarea
                  id="note-text"
                  placeholder="Paste your notes here..."
                  rows={10}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  You can type notes text, upload a file, or upload an image. At
                  least one of these is required.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-file">Upload Notes File</Label>
                <div className="flex items-center justify-center rounded-md border-2 border-dashed border-border p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-2 flex text-sm text-muted-foreground">
                      <label
                        htmlFor="note-file"
                        className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                      >
                        <span>Upload a file</span>
                        <Input
                          id="note-file"
                          type="file"
                          ref={fileInputRef}
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, TXT up to 10MB
                    </p>
                    {file && (
                      <p className="mt-2 text-sm font-medium text-primary">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label htmlFor="note-image">Upload Image of Notes</Label>
                <div className="flex items-center justify-center rounded-md border-2 border-dashed border-border p-6">
                  <div className="text-center">
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-2 flex text-sm text-muted-foreground items-center justify-center">
                      <label
                        htmlFor="note-image"
                        className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                      >
                        <span>Upload an image</span>
                        <Input
                          id="note-image"
                          type="file"
                          ref={imageInputRef}
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WEBP up to 5MB.{" "}
                      <span className="font-semibold">
                        Handwritten notes work too!
                      </span>
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground italic">
                      Our AI will analyze your handwritten notes and create quiz
                      questions from them.
                    </p>

                    {imagePreview && (
                      <div className="mt-4 relative">
                        <button
                          onClick={removeImage}
                          type="button"
                          className="absolute -top-2 -right-2 bg-background rounded-full z-10"
                        >
                          <XCircle className="h-6 w-6 text-destructive hover:text-destructive/80" />
                        </button>
                        <div className="relative h-48 w-full">
                          <Image
                            src={imagePreview}
                            alt="Image preview"
                            fill
                            className="object-contain rounded-md"
                          />
                        </div>
                        {!noteText && !file && (
                          <p className="mt-2 text-sm font-medium text-primary">
                            Using this image to generate quizzes (no text
                            provided)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading || !noteTitle || (!noteText && !file && !image)
                }
              >
                {loading ? "Saving Notes..." : "Generate Quiz from Notes"}
              </Button>
            </form>
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
