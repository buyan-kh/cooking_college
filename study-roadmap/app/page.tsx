import { redirect } from "next/navigation";

export default function Home() {
  // Redirect directly to topics page, bypassing login
  redirect("/topics");
}
