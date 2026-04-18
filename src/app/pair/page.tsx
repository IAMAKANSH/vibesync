import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCoupleForUser } from "@/lib/couple";
import PairClient from "./pair-client";

export default async function PairPage() {
  const session = await auth();
  if (!session?.user?.vid) redirect("/");
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx) redirect("/");
  if (ctx.couple && ctx.partner) redirect("/dashboard");
  return (
    <PairClient
      myName={ctx.me.name}
      myCode={ctx.me.code}
      partnerName={ctx.partner?.name}
    />
  );
}
