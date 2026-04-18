import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCoupleForUser } from "@/lib/couple";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.vid) redirect("/");
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx) redirect("/");
  if (!ctx.couple || !ctx.partner) redirect("/pair");
  return (
    <DashboardClient
      meName={ctx.me.name}
      partnerName={ctx.partner.name}
      partnerImage={ctx.partner.image}
      aiConfigured={Boolean(
        ctx.couple.aiProviderUrl &&
          ctx.couple.aiProviderKey &&
          ctx.couple.aiModel
      )}
    />
  );
}
