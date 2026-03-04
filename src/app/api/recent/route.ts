import { NextRequest, NextResponse } from "next/server";
import { getRecentBattleIds, getBattle } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cursor = parseInt(searchParams.get("cursor") || "0", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const sort = searchParams.get("sort") || "new";

    let ids: string[];

    if (sort === "popular" && process.env.KV_REST_API_URL) {
      const { kv } = await import("@vercel/kv");
      ids = await kv.zrange("resbattle:popular", cursor, cursor + limit, { rev: true });
    } else {
      ids = await getRecentBattleIds(cursor + limit + 1);
      ids = ids.slice(cursor, cursor + limit + 1);
    }

    if (!ids || ids.length === 0) {
      return NextResponse.json({ items: [], nextCursor: null });
    }

    const battles = await Promise.all(ids.map((id) => getBattle(id)));

    let likeCounts: (number | null)[] = [];
    if (process.env.KV_REST_API_URL && ids.length > 0) {
      const { kv } = await import("@vercel/kv");
      const likeKeys = ids.map((id) => `likes:resbattle:${id}`);
      likeCounts = await kv.mget<(number | null)[]>(...likeKeys);
    }

    const items = battles
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .map((b, i) => ({
        id: b.id,
        restaurant1: b.restaurant1.name,
        restaurant2: b.restaurant2.name,
        winner: b.winner,
        summary: b.summary,
        createdAt: b.createdAt,
        likes: likeCounts[i] ?? 0,
      }));

    const nextCursor = ids.length === limit + 1 ? cursor + limit : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("Recent battles error:", error);
    return NextResponse.json({ items: [], nextCursor: null }, { status: 500 });
  }
}
