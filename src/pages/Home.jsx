import ProjectCard from "../components/ProjectCard.jsx";
import { projects } from "../data/projects.js";

/**
 * Order in which categories appear
 */
const CATEGORY_ORDER = ["Games", "Tools", "Etc"];

function groupByCategory(list) {
  const map = new Map();
  for (const p of list) {
    const key = p.category || "Etc";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}

export default function Home() {
  const grouped = groupByCategory(projects);

  // Respect CATEGORY_ORDER but also allow future categories
  const categories = [
    ...CATEGORY_ORDER.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <main className="wrap">
      {/* HERO */}
      <header className="hero">
        <div className="brand">dev.korki</div>

        <h1 className="title">
          Small projects, games, and experiments.
        </h1>

        <p className="subtitle">
          A personal playground of things I build — interactive tools,
          multiplayer games, and random ideas that turned into code.
        </p>

        <div className="heroRow">
          <a
            className="btn"
            href="https://github.com/devkorki"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
      
        </div>
      </header>

      {/* SECTIONS */}
      {categories.map((category) => (
        <section key={category} className="section">
          <div className="sectionHead">
            <h2 className="sectionTitle">{category}</h2>
            <div className="sectionLine" />
          </div>

          <div className="grid">
            {grouped.get(category).map((p) => (
              <ProjectCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      ))}

      {/* FOOTER */}
      <footer className="footer">
        <span>© {new Date().getFullYear()} devkorki</span>
        <span className="dot">·</span>
        <span>built with React + Vite</span>
      </footer>
    </main>
  );
}
