import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const tasks = [
  {
    id: 1,
    title: "Quiz 1",
    notes: "Review chapters 1-3",
    status: "completed",
  },
  {
    id: 2,
    title: "Task 2",
    notes: "Prepare presentation slides",
    status: "in-progress",
  },
  {
    id: 3,
    title: "Quiz 2",
    notes: "Practice problem sets",
    status: "to-do",
  },
]

export function TaskList() {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-card-foreground">{task.title}</h3>
              <p className="text-sm text-muted-foreground">{task.notes}</p>
            </div>
            <Badge
              className={
                task.status === "completed"
                  ? "bg-green-900 text-green-100"
                  : task.status === "in-progress"
                    ? "bg-yellow-900 text-yellow-100"
                    : "bg-secondary text-secondary-foreground"
              }
            >
              {task.status === "completed" ? "Completed" : task.status === "in-progress" ? "In progress" : "To do"}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}

