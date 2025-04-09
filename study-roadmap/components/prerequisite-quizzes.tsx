import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"

// Sample prerequisite quizzes data
const quizzes = {
  "1": [
    {
      id: "p1",
      title: "Computer Science Basics",
      description: "Fundamental concepts and terminology",
      questionCount: 10,
      estimatedTime: "15 min",
    },
    {
      id: "p2",
      title: "Introduction to Programming",
      description: "Basic programming concepts and syntax",
      questionCount: 12,
      estimatedTime: "20 min",
    },
  ],
  "2": [
    {
      id: "p3",
      title: "HTML Fundamentals",
      description: "Basic HTML structure and elements",
      questionCount: 8,
      estimatedTime: "10 min",
    },
    {
      id: "p4",
      title: "CSS Basics",
      description: "Styling web pages with CSS",
      questionCount: 10,
      estimatedTime: "15 min",
    },
  ],
  "3": [
    {
      id: "p5",
      title: "Basic Data Structures",
      description: "Arrays, lists, and basic structures",
      questionCount: 12,
      estimatedTime: "20 min",
    },
  ],
}

interface PrerequisiteQuizzesProps {
  topicId: string
}

export function PrerequisiteQuizzes({ topicId }: PrerequisiteQuizzesProps) {
  const topicQuizzes = quizzes[topicId as keyof typeof quizzes] || []

  if (topicQuizzes.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No prerequisite quizzes available for this topic.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {topicQuizzes.map((quiz) => (
        <Card key={quiz.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-secondary p-2 text-secondary-foreground mt-1">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-card-foreground">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground">{quiz.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{quiz.questionCount} questions</span>
                  <span className="text-xs text-muted-foreground">{quiz.estimatedTime}</span>
                </div>
              </div>
            </div>
            <Link href={`/topics/${topicId}/quiz/${quiz.id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                Start <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  )
}

