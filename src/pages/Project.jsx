import { useParams } from "react-router-dom";
import { projects } from "../data/projects.js";
import { useConfig } from "../state/config.jsx";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";


export default function Project() {
  const { slug } = useParams();
  const { overrides, flags } = useConfig();

  const base = projects.find((p) => p.slug === slug);
  if (!base) return <main className="wrap">Project not found.</main>;

  const o = overrides?.[slug];
  const p = useMemo(() => ({
    ...base,
    ...o,
    tags: o?.tags ?? base.tags,
    status: o?.status ?? base.status,
    playUrl: o?.playUrl ?? base.playUrl,
  }), [base, o]);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [featOpen, setFeatOpen] = useState(false);

  const features = p.features || [];
  const previewFeatures = features.slice(0, 3);
  const remainingFeatures = features.slice(3);

  return (
    <main className="wrap">
      <header className="projectHeader">
       <Link className="back" to="/">← Back</Link>

        <div className="projectTitleRow">
          <h1 className="projectTitle">{p.title}</h1>

          {flags.showPlayButton && p.playUrl && (
            <button
              className="playBtn playBtnInline"
              onClick={() => window.open(p.playUrl, "_blank")}
            >
              ▶ Play
            </button>
          )}
        </div>

        <p className="projectDesc">{p.desc}</p>
      </header>

      <section className="projectBody">
        {/* ABOUT (preview + chevron expand) */}
        <div className="panel panelAcc">
          <button
            className="panelHead"
            type="button"
            onClick={() => setAboutOpen((v) => !v)}
            aria-expanded={aboutOpen}
          >
            <span className="panelTitle">About</span>
            <span className={`chev ${aboutOpen ? "open" : ""}`} aria-hidden />

          </button>

          <div className={`panelContent ${aboutOpen ? "open" : ""}`}>
            <p className={`aboutText ${aboutOpen ? "open" : ""}`}>
              {p.about || "No description yet."}
            </p>

            {/* Optional hint only when closed and text is long */}
            {!aboutOpen && (p.about || "").length > 180 && (
              <div className="moreHint">click to expand</div>
            )}
          </div>

        </div>

        {/* FEATURES (show 3 items + chevron for rest) */}
        <div className="panel panelAcc">
          <button
            className="panelHead"
            type="button"
            onClick={() => setFeatOpen((v) => !v)}
            aria-expanded={featOpen}
          >
            <span className="panelTitle">Features</span>
            <span className={`chev ${featOpen ? "open" : ""}`} aria-hidden />
          </button>

          <div className={`panelContent ${featOpen ? "open" : ""}`}>
            {features.length ? (
              <ul className="featureList">
                {previewFeatures.map((f, i) => (
                  <li key={`p-${i}`}>{f}</li>
                ))}

                {/* Only show the rest when expanded */}
                {featOpen && remainingFeatures.map((f, i) => (
                  <li key={`r-${i}`}>{f}</li>
                ))}
              </ul>
            ) : (
              <p>No features listed yet.</p>
            )}

            {/* If there are more than 3, show a subtle hint line */}
            {features.length > 3 && !featOpen && (
              <div className="moreHint">
                +{features.length - 3} more
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
