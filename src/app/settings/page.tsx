import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCoupleForUser } from "@/lib/couple";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.vid) redirect("/");
  const ctx = await getCoupleForUser(session.user.vid);
  if (!ctx) redirect("/");
  if (!ctx.couple) redirect("/pair");
  return (
    <SettingsClient
      meName={ctx.me.name}
      partnerName={ctx.partner?.name ?? "your partner"}
      myCode={ctx.me.code}
      aiProviderUrl={ctx.couple.aiProviderUrl ?? ""}
      aiModel={ctx.couple.aiModel ?? ""}
      hasKey={Boolean(ctx.couple.aiProviderKey)}
    />
  );
}
