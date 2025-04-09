"use client";

import type React from "react";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function SyllabusInput() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "";
  const courseId = searchParams.get("id");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log(
        "Selected file:",
        selectedFile.name,
        "Type:",
        selectedFile.type
      );

      // Check if file extension is valid
      const fileName = selectedFile.name.toLowerCase();
      const validExtensions = [".pdf", ".doc", ".docx"];
      const isValidExtension = validExtensions.some((ext) =>
        fileName.endsWith(ext)
      );

      // Also check MIME type if browser provides it
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const isValidMimeType = validTypes.includes(selectedFile.type);

      if (!isValidExtension) {
        toast.error(
          "Invalid file type. Please upload a PDF or Word document (.pdf, .doc, .docx)"
        );
        return;
      }

      // If the MIME type doesn't match the extension but extension is valid, still allow it
      // as some browsers might report incorrect MIME types
      if (selectedFile.type && !isValidMimeType) {
        console.warn(
          "File extension is valid but MIME type isn't recognized:",
          selectedFile.type
        );
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    // Double-check file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = [".pdf", ".doc", ".docx"];
    const isValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!isValidExtension) {
      toast.error(
        "Invalid file type. Please upload a PDF or Word document (.pdf, .doc, .docx)"
      );
      return;
    }

    console.log(
      "Uploading file:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size
    );
    setIsUploading(true);

    try {
      // Use our API service to upload the syllabus
      console.log("Sending API request with title:", title);
      const result = await api.uploadSyllabus(title, file);

      console.log("API response:", result);

      // Save to localStorage for persistence between sessions
      const newSubject = {
        id: courseId || result._id,
        title: title || "New Subject",
        description: "Created from syllabus upload",
        lastAccessed: new Date().toISOString(),
        progress: 0,
      };

      console.log("Saving subject to localStorage:", newSubject);

      // Get existing subjects from localStorage or use an empty array
      const existingSubjectsJSON = localStorage.getItem("subjects");
      const existingSubjects = existingSubjectsJSON
        ? JSON.parse(existingSubjectsJSON)
        : [];

      // Add the new subject
      const updatedSubjects = [...existingSubjects, newSubject];

      // Save back to localStorage
      localStorage.setItem("subjects", JSON.stringify(updatedSubjects));

      toast.success("Syllabus uploaded successfully!");

      // Redirect to the appropriate page based on whether we had a pre-defined ID
      if (courseId) {
        router.push(`/dashboard/${courseId}`);
      } else {
        router.push(`/dashboard/${result._id}`);
      }
    } catch (error) {
      console.error("Error uploading syllabus:", error);
      // Display a more specific error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      toast.error(`Failed to upload syllabus: ${errorMessage}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/topics">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Upload Syllabus for "{title || "New Subject"}"
          </h1>
        </div>
        <ThemeToggle />
      </div>

      <Card className="mx-auto max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="syllabus-file">Upload a file</Label>
            <div className="flex items-center justify-center rounded-md border-2 border-dashed border-border p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-2 flex text-sm text-muted-foreground">
                  <label
                    htmlFor="syllabus-file"
                    className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                  >
                    <span>Upload a file</span>
                    <Input
                      id="syllabus-file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX files only (up to 10MB)
                </p>
                {file && (
                  <p className="mt-2 text-sm font-medium text-primary">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!file || isUploading}
          >
            {isUploading ? "Processing..." : "Generate Study Roadmap"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
