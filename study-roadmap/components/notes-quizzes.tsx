import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, FileText } from "lucide-react"

// Sample notes quizzes data
const quizzes = {
  "1": [
    {
      id: "n1",
      title: "Algorithm Complexity",
      description: "Based on your notes about Big O notation",
      questionCount: 8,
      estimatedTime: "12 min",
      source: "Lecture Notes - Week 3",
    },
    {
      id: "n2",
      title: "Sorting Algorithms",
      description: "Based on your notes about sorting methods",
      questionCount: 10,
      estimatedTime: "15 min",
      source: "Textbook Chapter 4 Notes",
    },
  ],
}

interface NotesQuizzesProps {
  topicId: string
}

export function NotesQuizzes({ topicId }: NotesQuizzesProps) {
  const topicQuizzes = quizzes[topicId as keyof typeof quizzes] || []

  if (topicQuizzes.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No notes quizzes available. Upload notes to generate quizzes.</p>
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
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-card-foreground">{quiz.title}</h3>
                <p className="text-sm text-muted-foreground">{quiz.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{quiz.questionCount} questions</span>
                  <span className="text-xs text-muted-foreground">{quiz.estimatedTime}</span>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-primary">Source: {quiz.source}</span>
                </div>
              </div>
            </div>
            <Link href={`/topics/${topicId}/notes-quiz/${quiz.id}`}>
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

