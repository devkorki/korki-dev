import { Link } from "react-router-dom";

function StatusPill({ status }) {
  if (!status) return null;
  const label =
    status === "live" ? "LIVE" :
    status === "wip" ? "WIP" :
    "PROTOTYPE";

  return <span className={`pill ${status}`}>{label}</span>;
}

export default function ProjectCard({ p }) {
  return (
    <Link to={`/p/${p.slug}`} className="cardLink">
      <div className="card">
        <div className="cardMain">
          <div className="cardTitleRow">
            <h3 className="cardTitle">{p.title}</h3>
            <StatusPill status={p.status} />
          </div>

          <p className="cardDesc">{p.desc}</p>

          <div className="tagRow">
            {p.tags.slice(0, 4).map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>

        {/* ▶ PLAY BUTTON */}
        {p.playUrl && (
          <button
            className="playBtn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(p.playUrl, "_blank");
            }}
          >
            ▶ Play
          </button>
        )}
      </div>
    </Link>
  );
}
