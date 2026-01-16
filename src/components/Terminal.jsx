import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../state/config.jsx";
import { projects as baseProjects } from "../data/projects.js";

function getToken() {
    return sessionStorage.getItem("korki_admin_token") || "";
}
function setToken(t) {
    sessionStorage.setItem("korki_admin_token", t);
}

export default function Terminal({ open, setOpen, summonLemon, dismissLemon, showModal }) {
    const nav = useNavigate();
    const { refresh, setFlags, setOverrides, overrides } = useConfig();

    //const [open, setOpen] = useState(false);
    const [line, setLine] = useState("");
    const [out, setOut] = useState([
        "you have found the hidden terminal",
        "korki terminal — type `help`",
        "toggle: Ctrl+K or `",
    ]);

    const inputRef = useRef(null);

    // Merge base projects + overrides (so terminal uses latest playUrl/status)
    const mergedProjects = baseProjects.map((p) => {
        const o = overrides?.[p.slug];
        if (!o) return p;
        return {
            ...p,
            ...o,
            tags: o.tags ?? p.tags,
            status: o.status ?? p.status,
            playUrl: o.playUrl ?? p.playUrl,
        };
    });

    useEffect(() => {
        function onKey(e) {
            const isCtrlK = e.ctrlKey && e.key.toLowerCase() === "k";
            const isBacktick = e.key === "`";

            if (isCtrlK || isBacktick) {
                e.preventDefault();
                setOpen((v) => !v);
                setTimeout(() => inputRef.current?.focus(), 0);
            }
            if (e.key === "Escape") setOpen(false);
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    function print(s) {
        setOut((o) => [...o, s]);
    }

    async function adminPost(payload) {
        const token = getToken();
        if (!token) throw new Error("Not logged in. Use: login <token>");

        const r = await fetch("/api/admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Admin request failed");

        // sync UI instantly without waiting for refresh
        setFlags(data.flags);
        setOverrides(data.overrides);
        return data;
    }

    async function run(cmd) {
        const parts = cmd.trim().split(/\s+/);
        const c = (parts[0] || "").toLowerCase();


        // if (c === "summon" && (parts[1] || "").toLowerCase() === "lemon") {
        //     summonLemon?.();
        //     print("🍋 lemon summoned.");
        //     return;
        // }

        if (c === "summon" && (parts[1] || "").toLowerCase() === "lemon") {
            summonLemon?.();
            print("🍋 lemon summoned.");

            const key = "korki_first_lemon";
            const first = !localStorage.getItem(key);

            if (first) {
                localStorage.setItem(key, "1");
                print("You found an easter egg.");
               
                showModal?.("/summon_lemon.jpeg", "only for nerds");
            }

            return;
        }

        if ((c === "dismiss" || c === "banish") && (parts[1] || "").toLowerCase() === "lemon") {
            dismissLemon?.();
            print("lemon dismissed.");
            return;
        }

        if (!c) return;

        if (c === "help") {
            print("commands:");
            print("  help");
            print("  projects");
            print("  open <slug>");
            print("  play <slug>");
          
            print("  refresh");
            print("  toggle play on|off");
            print("  toggle livebadge on|off");
            print("  set status <slug> live|wip|prototype");
            print("  set tags <slug> <t1> <t2> ...");
            print("  set playurl <slug> <url>");
            print("  reset <slug>");
            print("  reset all");
            print("  cls / clear");
            return;
        }

        if (c === "cls" || c === "clear") {
            setOut([
                "korki terminal — type `help`",
                "screen cleared",
            ]);
            return;
        }

        if (c === "projects") {
            mergedProjects.forEach((p) => {
                print(`${p.slug.padEnd(18)}  ${p.status || "-"}`);
            });
            return;
        }


        if (c === "open") {
            const slug = parts[1];
            if (!slug) return print("usage: open <slug>");

            const exists = mergedProjects.some((p) => p.slug === slug);
            if (!exists) {
                print(`error: project '${slug}' not found`);
                print("hint: type `projects` to list available slugs");
                return;
            }

            nav(`/p/${slug}`);
            setOpen(false);
            return;
        }


        if (c === "play") {
            const slug = parts[1];
            if (!slug) return print("usage: play <slug>");

            const p = mergedProjects.find((x) => x.slug === slug);
            if (!p) {
                print(`error: project '${slug}' not found`);
                print("hint: type `projects` to list available slugs");
                return;
            }

            if (!p.playUrl) {
                print(`error: project '${slug}' has no play URL`);
                return;
            }

            window.open(p.playUrl, "_blank");
            return;
        }


        if (c === "login") {
            const token = parts.slice(1).join(" ");
            if (!token) return print("usage: login <token>");
            setToken(token);
            print("admin token saved for this session.");
            return;
        }

        if (c === "refresh") {
            await refresh();
            print("refreshed /api/config");
            return;
        }

        if (c === "toggle") {
            const what = (parts[1] || "").toLowerCase();
            const onoff = (parts[2] || "").toLowerCase();
            const value = onoff === "on" ? true : onoff === "off" ? false : null;
            if (value === null) return print("usage: toggle play on|off OR toggle livebadge on|off");

            if (what === "play") {
                await adminPost({ action: "toggleFlag", key: "showPlayButton", value });
                print(`showPlayButton = ${value}`);
                return;
            }
            if (what === "livebadge") {
                await adminPost({ action: "toggleFlag", key: "showLiveBadge", value });
                print(`showLiveBadge = ${value}`);
                return;
            }
            return print("unknown toggle. try: toggle play on|off");
        }

        if (c === "set") {
            const field = (parts[1] || "").toLowerCase();
            const slug = parts[2];
            if (!field || !slug) return print("usage: set <status|tags|playurl> <slug> ...");

            if (field === "status") {
                const status = (parts[3] || "").toLowerCase();
                if (!["live", "wip", "prototype"].includes(status)) {
                    return print("status must be: live | wip | prototype");
                }
                await adminPost({ action: "setProject", slug, patch: { status } });
                print(`${slug}.status = ${status}`);
                return;
            }

            if (field === "tags") {
                const tags = parts.slice(3);
                if (!tags.length) return print("usage: set tags <slug> <t1> <t2> ...");
                await adminPost({ action: "setProject", slug, patch: { tags } });
                print(`${slug}.tags = ${tags.join(", ")}`);
                return;
            }

            if (field === "playurl") {
                const url = parts[3];
                if (!url) return print("usage: set playurl <slug> <url>");
                await adminPost({ action: "setProject", slug, patch: { playUrl: url } });
                print(`${slug}.playUrl = ${url}`);
                return;
            }

            return print("unknown set field");
        }

        if (c === "reset") {
            const which = (parts[1] || "").toLowerCase();
            if (which === "all") {
                await adminPost({ action: "resetAll" });
                print("reset all flags + overrides.");
                return;
            }
            const slug = parts[1];
            if (!slug) return print("usage: reset <slug> OR reset all");
            await adminPost({ action: "resetProject", slug });
            print(`reset overrides for ${slug}`);
            return;
        }

        print(`unknown command: ${c} (try help)`);
    }

    if (!open) return null;

    return (
        <div className="termOverlay" onMouseDown={() => inputRef.current?.focus()}>
            <div className="term" onMouseDown={(e) => e.stopPropagation()}>
                <div className="termOut">
                    {out.slice(-14).map((l, i) => (
                        <div key={i} className="termLine">{l}</div>
                    ))}
                </div>

                <form
                    className="termRow"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const cmd = line;
                        setLine("");
                        print(`> ${cmd}`);
                        try {
                            await run(cmd);
                        } catch (err) {
                            print(`error: ${err?.message || String(err)}`);
                        }
                    }}
                >
                    <span className="termPrompt">&gt;</span>
                    <input
                        ref={inputRef}
                        className="termInput"
                        value={line}
                        onChange={(e) => setLine(e.target.value)}
                        placeholder="type a command… (help)"
                        autoComplete="off"
                        spellCheck={false}
                    />
                </form>
            </div>
        </div>
    );
}
