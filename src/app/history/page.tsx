import type { Metadata } from "next";
import { getRecentBattleIds, getBattle } from "@/lib/db";
import { FeedList } from "@/components/FeedList";

export const metadata: Metadata = {
  title: "バトル履歴",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const ids = await getRecentBattleIds(20);
  const battles = (
    await Promise.all(ids.map((id) => getBattle(id)))
  ).filter(Boolean);

  const items = battles.map((b) => ({
    id: b!.id,
    restaurant1: b!.restaurant1.name,
    restaurant2: b!.restaurant2.name,
    winner: b!.winner,
    summary: b!.summary,
    createdAt: b!.createdAt,
    likes: 0,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">バトル履歴</h1>

      {items.length === 0 ? (
        <p className="text-white/40">まだバトルがありません。</p>
      ) : (
        <FeedList initialItems={items} initialNextCursor={items.length >= 20 ? 20 : null} />
      )}
    </div>
  );
}
