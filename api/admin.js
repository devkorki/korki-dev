import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const FLAGS_KEY = "korki:flags";
const OVERRIDES_KEY = "korki:overrides";

function isAuthed(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token && token === process.env.KORKI_ADMIN_TOKEN;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ✅ Admin should never be cached
  res.setHeader("Cache-Control", "no-store");

  if (!isAuthed(req)) return res.status(401).json({ error: "Unauthorized" });

  const body = req.body || {};
  const { action } = body;

  const flags = (await redis.get(FLAGS_KEY)) || { showPlayButton: true, showLiveBadge: true };
  const overrides = (await redis.get(OVERRIDES_KEY)) || {};

  if (action === "toggleFlag") {
    const { key, value } = body;
    if (!["showPlayButton", "showLiveBadge"].includes(key)) {
      return res.status(400).json({ error: "Invalid flag key" });
    }
    flags[key] = Boolean(value);
    await redis.set(FLAGS_KEY, flags);
    return res.status(200).json({ ok: true, flags, overrides });
  }

  if (action === "setProject") {
    const { slug, patch } = body;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    overrides[slug] = { ...(overrides[slug] || {}), ...(patch || {}) };
    await redis.set(OVERRIDES_KEY, overrides);
    return res.status(200).json({ ok: true, flags, overrides });
  }

  if (action === "resetProject") {
    const { slug } = body;
    if (!slug) return res.status(400).json({ error: "Missing slug" });
    delete overrides[slug];
    await redis.set(OVERRIDES_KEY, overrides);
    return res.status(200).json({ ok: true, flags, overrides });
  }

  if (action === "resetAll") {
    await Promise.all([
      redis.set(FLAGS_KEY, { showPlayButton: true, showLiveBadge: true }),
      redis.set(OVERRIDES_KEY, {}),
    ]);
    return res.status(200).json({
      ok: true,
      flags: { showPlayButton: true, showLiveBadge: true },
      overrides: {},
    });
  }

  return res.status(400).json({ error: "Unknown action" });
}
