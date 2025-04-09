import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-end">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-md">
          <h1 className="mb-8 text-center text-3xl font-bold text-foreground">
            Cooking College
          </h1>
          <div className="rounded-lg bg-card p-6 shadow-md">
            <h2 className="mb-6 text-xl font-semibold text-card-foreground">
              Login
            </h2>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
