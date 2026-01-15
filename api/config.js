import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const FLAGS_KEY = "korki:flags";
const OVERRIDES_KEY = "korki:overrides";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // ✅ CDN caching (protects Upstash from “friends traffic”)
  // - cache at the edge for 60s
  // - allow stale for 10 minutes while it refreshes in the background
  res.setHeader("Cache-Control", "max-age=0");
  res.setHeader("CDN-Cache-Control", "s-maxage=60, stale-while-revalidate=600");

  const [flags, overrides] = await Promise.all([
    redis.get(FLAGS_KEY),
    redis.get(OVERRIDES_KEY),
  ]);

  return res.status(200).json({
    flags: flags || { showPlayButton: true, showLiveBadge: true },
    overrides: overrides || {},
  });
}
