import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface MultipleChoiceQuizProps {
  questions: QuizQuestion[];
  title: string;
  description: string;
  onComplete: (score: number) => void;
  backUrl: string;
  courseId: string;
}

export function MultipleChoiceQuiz({
  questions,
  title,
  description,
  onComplete,
  backUrl,
  courseId,
}: MultipleChoiceQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? (Math.min(currentQuestionIndex + 1, questions.length) /
          questions.length) *
        100
      : 0;

  // Check if we've reached the end of the quiz
  useEffect(() => {
    if (currentQuestionIndex >= questions.length) {
      setIsQuizCompleted(true);
      onComplete(correctAnswers);
    }
  }, [currentQuestionIndex, questions.length, correctAnswers, onComplete]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      // Reset the answer feedback state for the next question
      setShowAnswer(false);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      // Reset the answer feedback state for the previous question
      setShowAnswer(false);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  const handleRetryQuiz = () => {
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setUserAnswers({});
    setIsQuizCompleted(false);
    setShowAnswer(false);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  // Handle answer selection with color feedback
  const handleAnswerSelect = (selectedOption: string) => {
    if (!currentQuestion) return;

    setSelectedOption(selectedOption);

    // Check if the answer is correct
    const isAnswerCorrect = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);

    // Record the answer
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedOption,
    }));

    // If correct, increment the counter
    if (isAnswerCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }

    // Show the answer feedback
    setShowAnswer(true);

    // Wait a moment to show the feedback before moving to next question
    setTimeout(() => {
      // Only increment if we're not at the last question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // If we're at the last question, set quiz as completed directly
        setIsQuizCompleted(true);
      }
      setShowAnswer(false);
      setSelectedOption(null);
      setIsCorrect(null);
    }, 1500);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex justify-between text-sm">
          <span>
            Question {Math.min(currentQuestionIndex + 1, questions.length)} of{" "}
            {questions.length}
          </span>
          <span>{correctAnswers} correct</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {!isQuizCompleted && currentQuestion ? (
        <Card className="w-full p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-4">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                // Determine the button styling based on selection and correctness
                let buttonVariant = "outline";
                let buttonClassName =
                  "w-full justify-start text-left p-4 h-auto";

                if (showAnswer && selectedOption === option) {
                  // This is the option the user selected
                  if (option === currentQuestion.correctAnswer) {
                    // Selected and correct
                    buttonVariant = "default";
                    buttonClassName +=
                      " bg-green-600 hover:bg-green-700 text-white border-green-600";
                  } else {
                    // Selected but wrong
                    buttonVariant = "default";
                    buttonClassName +=
                      " bg-red-600 hover:bg-red-700 text-white border-red-600";
                  }
                } else if (
                  showAnswer &&
                  option === currentQuestion.correctAnswer
                ) {
                  // Not selected but is the correct answer - highlight it
                  buttonVariant = "outline";
                  buttonClassName += " border-green-600 text-green-600";
                }

                return (
                  <Button
                    key={index}
                    variant={buttonVariant as any}
                    className={buttonClassName}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showAnswer}
                  >
                    <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border">
                      {["A", "B", "C", "D"][index]}
                    </div>
                    <span className="ml-2">{option}</span>
                    {showAnswer && option === currentQuestion.correctAnswer && (
                      <Check className="ml-auto h-5 w-5 text-green-500" />
                    )}
                    {showAnswer &&
                      selectedOption === option &&
                      option !== currentQuestion.correctAnswer && (
                        <X className="ml-auto h-5 w-5 text-white" />
                      )}
                  </Button>
                );
              })}
            </div>

            {showAnswer && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  isCorrect
                    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                }`}
              >
                <div className="flex items-center">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                      <span>Correct! Well done.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                      <span>
                        Incorrect. The correct answer is:{" "}
                        {currentQuestion.correctAnswer}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreviousQuestion()}
              disabled={currentQuestionIndex <= 0 || showAnswer}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNextQuestion()}
              disabled={
                currentQuestionIndex >= questions.length - 1 || showAnswer
              }
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-900/20 p-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold">Quiz Completed!</h2>
          <p className="mb-2 text-xl">
            Your Score:{" "}
            <span className="font-bold text-primary">
              {correctAnswers} / {questions.length}
            </span>
          </p>
          <p className="mb-6 text-muted-foreground">
            {correctAnswers === questions.length
              ? "Perfect score! Excellent work!"
              : correctAnswers >= Math.floor(questions.length * 0.7)
              ? "Great job! You've mastered most of this material."
              : "Keep studying these concepts to improve your understanding."}
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={handleRetryQuiz}>Retry Quiz</Button>
            <Link href={backUrl || `/dashboard/${courseId}`}>
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
