"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Task = {
  date: string;
  title: string;
  id: string;
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();
  const currentDay = new Date().getDate();

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, () => null);
  const allDays = [...emptyDays, ...days];

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Replace API call with mock data
        // const response = await fetch("http://localhost:8002/get-tasks", {
        //   method: "GET",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });
        // const data = await response.json();

        // Mock data instead of API call
        const mockData = [
          {
            date: "2024-04-10",
            title: "Complete Neural Networks Quiz",
            id: "1",
          },
          { date: "2024-04-12", title: "Review Data Structures", id: "2" },
          {
            date: "2024-04-15",
            title: "Submit Machine Learning Assignment",
            id: "3",
          },
          {
            date: new Date().toISOString().split("T")[0],
            title: "Study for Quiz",
            id: "4",
          },
        ];

        // Set the tasks using our mock data
        setTasks(mockData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        // Provide fallback mock data even on error
        const fallbackData = [
          {
            date: new Date().toISOString().split("T")[0],
            title: "Study for Quiz",
            id: "1",
          },
        ];
        setTasks(fallbackData);
      }
    };

    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.trim() || !selectedDay) return;

    const taskObject = {
      date: new Date(selectedDay).toISOString().split("T")[0],
      title: newTask,
      id: `${selectedDay}-${Date.now()}`,
    };

    setTasks((prevTasks) => [...prevTasks, taskObject]);
    setNewTask("");

    try {
      const response = await fetch("http://localhost:8002/upload-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          day: selectedDay,
          tasks: [taskObject],
        }),
      });

      if (response.ok) {
        console.log("Task uploaded successfully!");
      } else {
        console.error("Failed to upload task");
      }
    } catch (error) {
      console.error("Error uploading task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedDay) return; // Ensure a day is selected

    // Update the local state to remove the task
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

    // Call the backend to delete the task
    try {
      const response = await fetch(
        `http://localhost:8002/delete-task?task_id=${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        console.log("Task deleted successfully!");
      } else {
        console.error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      (prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      (prevDate) => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1)
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={handlePrevMonth}
        >
          ←
        </button>
        <h2 className="text-xl font-semibold text-card-foreground">
          {currentMonth} {currentYear}
        </h2>
        <button
          className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={handleNextMonth}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div
            key={index}
            className="py-1 text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {allDays.map((day, index) => (
          <div
            key={index}
            className={`relative flex h-8 items-center justify-center rounded-full text-sm cursor-pointer ${
              day === currentDay &&
              currentDate.getMonth() === new Date().getMonth()
                ? "bg-green-600 font-bold text-yellow-100"
                : day
                ? "hover:bg-secondary"
                : ""
            }`}
            onClick={() => day && setSelectedDay(day)}
          >
            {day}
            {day !== null && tasks.length > 0 && (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500"></span>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-96 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [0.5, 1.2, 1],
                rotate: [0, 360, 0],
                transition: { duration: 1, ease: "easeInOut" },
              }}
              exit={{
                scale: 0,
                rotate: -360,
                opacity: 0,
                transition: { duration: 0.5, ease: "easeInOut" },
              }}
            >
              <motion.h3
                className="mb-4 text-lg font-semibold dark:text-white"
                initial={{ y: -50, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  transition: { delay: 0.2, duration: 0.5 },
                }}
              >
                Tasks for {currentMonth} {selectedDay}
              </motion.h3>

              <motion.ul
                className="mb-4 space-y-2"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: 0.4, duration: 0.5 },
                }}
              >
                {tasks.map((task) => (
                  <motion.li
                    key={task.id}
                    className="flex items-center justify-between rounded bg-gray-100 p-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: 1,
                      transition: { duration: 0.5 },
                    }}
                    exit={{ x: 100, opacity: 0, transition: { duration: 0.5 } }}
                  >
                    <span>{task.title}</span>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div
                className="flex items-center space-x-2"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: 0.6, duration: 0.5 },
                }}
              >
                <input
                  type="text"
                  className="flex-1 rounded border px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Add a task or quiz"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                />
                <button
                  className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                  onClick={() => handleAddTask()}
                >
                  Add
                </button>
              </motion.div>

              <motion.button
                className="mt-4 w-full rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                onClick={() => setSelectedDay(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
