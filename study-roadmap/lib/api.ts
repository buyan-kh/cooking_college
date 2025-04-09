// API URL - Change this to your FastAPI server URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types matching the backend models
export interface RoadmapEntry {
  date: string | null;
  topic: string;
  preQuizPrompt?: string | null;
  assignment?: string | null;
}

export interface CourseResponse {
  _id: string;
  roadmap: RoadmapEntry[];
}

export interface Quiz {
  _id: string;
  course_id: string;
  topic: string;
  topic_number: number;
  quiz: QuizQuestion[];
  created_at: string;
}

export interface QuizQuestion {
  index: number;
  question: string;
  answer: string;
}

export interface QuizResponse {
  quizzes: Quiz[];
}

export interface QuizAttempt {
  question_number: number;
  question: string;
  answer: string;
  user_rating: "easy" | "medium" | "hard" | "dont_know";
  next_due_date?: string;
}

export interface TopicProgress {
  topic_number: number;
  progress: number;
  completed: boolean;
  ratings?: {
    easy: number;
    medium: number;
    hard: number;
    dont_know: number;
  };
}

export interface Note {
  _id: string;
  course_id: string;
  topic_number: number;
  title: string;
  content: string;
  image_id?: string;
  created_at: string;
}

export interface NotesQuiz {
  _id: string;
  course_id: string;
  topic_number: number;
  title: string;
  description: string;
  source: string;
  image_id?: string;
  questions: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
  created_at: string;
}

// API functions
export const api = {
  // Upload syllabus and create a course
  async uploadSyllabus(name: string, file: File): Promise<CourseResponse> {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("syllabus", file, file.name);

      console.log("API Request:", {
        url: `${API_URL}/courses/`,
        method: "POST",
        name,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      const response = await fetch(
        `${API_URL}/courses/?name=${encodeURIComponent(name)}`,
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("API Response Status:", response.status, response.statusText);

      if (!response.ok) {
        // Handle different response types
        try {
          const errorData = await response.json();
          console.log("API Error (JSON):", errorData);
          throw new Error(
            typeof errorData.detail === "string"
              ? errorData.detail
              : JSON.stringify(errorData.detail) || "Failed to upload syllabus"
          );
        } catch (jsonError) {
          // If we can't parse JSON, try to get text
          const errorText = await response.text();
          console.log("API Error (Text):", errorText);
          throw new Error(errorText || `Server error: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log("API Success:", result);
      return result;
    } catch (error) {
      console.error("Error in uploadSyllabus:", error);
      throw error;
    }
  },

  // Get roadmap for a course
  async getRoadmap(courseId: string): Promise<RoadmapEntry[]> {
    const response = await fetch(`${API_URL}/courses/${courseId}/roadmap`);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) || "Failed to get roadmap"
        );
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Delete a course
  async deleteCourse(courseId: string): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) || "Failed to delete course"
        );
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Generate pre-lecture quizzes
  async generatePreQuizzes(courseId: string): Promise<QuizResponse> {
    const response = await fetch(`${API_URL}/courses/${courseId}/quizzes/pre`, {
      method: "POST",
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) || "Failed to generate quizzes"
        );
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Get all quizzes for a course
  async getQuizzes(courseId: string): Promise<QuizResponse> {
    const response = await fetch(`${API_URL}/courses/${courseId}/quizzes`);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) || "Failed to get quizzes"
        );
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Submit a quiz attempt
  async submitQuizAttempt(
    quizId: string,
    userId: string,
    topicNumber: number,
    responses: QuizAttempt[]
  ): Promise<{ status: string; attempt_id: string }> {
    const response = await fetch(`${API_URL}/quizzes/${quizId}/attempt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        topic_number: topicNumber,
        responses,
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) ||
              "Failed to submit quiz attempt"
        );
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Get due schedule for a user
  async getDueSchedule(userId: string): Promise<{ due_questions: any[] }> {
    const response = await fetch(`${API_URL}/users/${userId}/schedule`);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) || "Failed to get schedule"
        );
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Update rating for a question
  async updateRating(
    courseId: string,
    userId: string,
    questionId: string,
    rating: RatingEnum
  ): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/questions/${questionId}/rating`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id: courseId,
        user_id: userId,
        rating,
      }),
    });

    if (!response.ok) {
      // Clone the response before reading its body
      const responseClone = response.clone();

      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) || "Failed to update rating"
        );
      } catch (jsonError) {
        // Use the cloned response if the JSON parsing fails
        const errorText = await responseClone.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Update topic progress on the backend
  async updateTopicProgress(
    courseId: string,
    userId: string,
    topicProgress: TopicProgress
  ): Promise<{ status: string }> {
    const response = await fetch(
      `${API_URL}/courses/${courseId}/topics/${topicProgress.topic_number}/progress`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          progress: topicProgress.progress,
          completed: topicProgress.completed,
          ratings: topicProgress.ratings,
        }),
      }
    );

    if (!response.ok) {
      // Clone the response before reading its body
      const responseClone = response.clone();

      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) ||
              "Failed to update topic progress"
        );
      } catch (jsonError) {
        // Use the cloned response if the JSON parsing fails
        const errorText = await responseClone.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Upload notes with optional image for a specific topic
  async uploadNotes(
    courseId: string,
    topicId: number,
    title: string,
    content: string,
    image?: File,
    noteFile?: File
  ): Promise<{
    status: string;
    notes_id: string;
    image_id?: string;
    file_id?: string;
    extracted_text_length?: number;
  }> {
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("topic_number", topicId.toString());

      // Add image file if provided
      if (image) {
        formData.append("image", image);
      }

      // Add document file if provided
      if (noteFile) {
        formData.append("file", noteFile);
      }

      console.log("API Request:", {
        url: `${API_URL}/courses/${courseId}/notes`,
        method: "POST",
        title,
        hasContent: !!content,
        hasImage: !!image,
        hasFile: !!noteFile,
        imageType: image?.type,
        fileType: noteFile?.type,
      });

      const response = await fetch(`${API_URL}/courses/${courseId}/notes`, {
        method: "POST",
        body: formData,
      });

      console.log("API Response Status:", response.status, response.statusText);

      if (!response.ok) {
        // Clone the response before reading its body
        const responseClone = response.clone();

        try {
          const errorData = await response.json();
          console.log("API Error (JSON):", errorData);
          throw new Error(
            typeof errorData.detail === "string"
              ? errorData.detail
              : JSON.stringify(errorData.detail) || "Failed to upload notes"
          );
        } catch (jsonError) {
          // Use the cloned response if the JSON parsing fails
          const errorText = await responseClone.text();
          console.log("API Error (Text):", errorText);
          throw new Error(errorText || `Server error: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log("API Success:", result);
      return result;
    } catch (error) {
      console.error("Error in uploadNotes:", error);
      throw error;
    }
  },

  // Generate quiz from notes
  async generateNotesQuiz(
    courseId: string,
    topicId: number
  ): Promise<QuizResponse> {
    const response = await fetch(
      `${API_URL}/courses/${courseId}/topics/${topicId}/notes-quiz`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      // Clone the response before reading its body
      const responseClone = response.clone();

      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) ||
              "Failed to generate quiz from notes"
        );
      } catch (jsonError) {
        // Use the cloned response if the JSON parsing fails
        const errorText = await responseClone.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Get notes for a specific topic
  async getNotes(courseId: string, topicId: number): Promise<Note[]> {
    const response = await fetch(
      `${API_URL}/courses/${courseId}/topics/${topicId}/notes`
    );

    if (!response.ok) {
      // Clone the response before reading its body
      const responseClone = response.clone();

      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) || "Failed to fetch notes"
        );
      } catch (jsonError) {
        // Use the cloned response if the JSON parsing fails
        const errorText = await responseClone.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Get notes quiz for a specific topic
  async getNotesQuiz(
    courseId: string,
    topicId: number
  ): Promise<NotesQuiz | null> {
    const response = await fetch(
      `${API_URL}/courses/${courseId}/topics/${topicId}/notes-quiz`
    );

    if (response.status === 404) {
      // No quiz exists yet, return null
      return null;
    }

    if (!response.ok) {
      // Clone the response before reading its body
      const responseClone = response.clone();

      try {
        const errorData = await response.json();
        throw new Error(
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail) || "Failed to fetch notes quiz"
        );
      } catch (jsonError) {
        // Use the cloned response if the JSON parsing fails
        const errorText = await responseClone.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
    }

    return response.json();
  },

  // Get image URL for displaying in the frontend
  getImageUrl(imageId: string): string {
    if (!imageId) return "";

    // Use our Next.js API route as a proxy
    return `/api/images/${imageId}`;
  },
};
