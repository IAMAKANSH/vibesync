import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Landing from "./landing-client";

export default async function Home() {
  const session = await auth();
  if (session?.user?.vid) {
    if (session.user.coupleId) redirect("/dashboard");
    redirect("/pair");
  }
  return <Landing />;
}
