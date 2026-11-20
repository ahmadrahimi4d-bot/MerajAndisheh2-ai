import { PlatformProvider } from "@/core/platform-context";
import { getBootstrap } from "@/core/server";
import { AppRoot } from "@/modules/shell/app-root";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const initial = await getBootstrap();
  return <PlatformProvider initial={initial}><AppRoot /></PlatformProvider>;
}
