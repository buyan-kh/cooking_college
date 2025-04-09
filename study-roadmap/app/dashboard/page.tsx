import { Calendar } from "@/components/calendar"
import { ProgressBar } from "@/components/progress-bar"
import { SessionTimer } from "@/components/session-timer"
import { TaskList } from "@/components/task-list"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">Home page / Dashboard</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="col-span-2 space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Current Topic</h2>
              <ProgressBar progress={40} />
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Today&apos;s Tasks</h2>
              <TaskList />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <Calendar />
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Today&apos;s Session</h2>
              <SessionTimer />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

