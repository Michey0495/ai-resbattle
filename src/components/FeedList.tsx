"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface FeedItem {
  id: string;
  restaurant1: string;
  restaurant2: string;
  winner: string;
  summary: string;
  createdAt: string;
  likes: number;
}

export function FeedList({ initialItems, initialNextCursor }: {
  initialItems: FeedItem[];
  initialNextCursor: number | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [sort, setSort] = useState<"new" | "popular">("new");
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchMore = useCallback(async (cursor: number, sortMode: string, replace = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recent?cursor=${cursor}&limit=20&sort=${sortMode}`);
      const data = await res.json();
      if (replace) {
        setItems(data.items);
      } else {
        setItems((prev) => [...prev, ...data.items]);
      }
      setNextCursor(data.nextCursor);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMore(0, sort, true);
  }, [sort, fetchMore]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor !== null && !loading) {
          fetchMore(nextCursor, sort);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loading, sort, fetchMore]);

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSort("new")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            sort === "new" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
          }`}
        >
          新着
        </button>
        <button
          onClick={() => setSort("popular")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            sort === "popular" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
          }`}
        >
          人気
        </button>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const winnerName =
            item.winner === "restaurant1"
              ? item.restaurant1
              : item.winner === "restaurant2"
              ? item.restaurant2
              : "引き分け";

          return (
            <Link
              key={item.id}
              href={`/battle/${item.id}`}
              className="block bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    {item.restaurant1}
                    <span className="text-white/40 mx-2">vs</span>
                    {item.restaurant2}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                    {winnerName}
                  </span>
                  {item.likes > 0 && (
                    <span className="text-white/30 text-xs">+ {item.likes}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div ref={observerRef} className="py-8 text-center">
        {loading && <p className="text-white/30 text-sm">読み込み中...</p>}
      </div>
    </div>
  );
}
