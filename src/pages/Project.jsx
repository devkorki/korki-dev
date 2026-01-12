import { useParams, Link } from "react-router-dom";
import { projects } from "../data/projects.js";

export default function Project() {
  const { slug } = useParams();
  const p = projects.find((x) => x.slug === slug);

  if (!p) {
    return (
      <main className="wrap">
        <Link className="back" to="/">← Back</Link>
        <h1 style={{ marginTop: 14 }}>Not found</h1>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="projectHeader">
        <Link className="back" to="/">← Back</Link>
        <h1 className="projectTitle">{p.title}</h1>
        <p className="projectDesc">{p.desc}</p>

        <div className="tagRow">
          {p.tags.map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
      </header>

      <section className="projectBody">
        <div className="panel">
          <h2>About</h2>
          <p>
            Drop your actual project UI here. For games, mount your canvas/React component,
            then connect to Socket.IO.
          </p>
        </div>

        <div className="panel">
          <h2>Run</h2>
          <p>
            Later we’ll add a “Play” button and a dedicated route like <code>/games/{p.slug}</code>.
          </p>
        </div>
      </section>
    </main>
  );
}
