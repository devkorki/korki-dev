import { Link } from "react-router-dom";

function StatusPill({ status }) {
  if (!status) return null;
  const label =
    status === "live" ? "LIVE" :
    status === "wip" ? "WIP" :
    "PROTOTYPE";

  return <span className="pill">{label}</span>;
}

export default function ProjectCard({ p }) {
  const isExternal = Boolean(p.url);
  const href = isExternal ? p.url : `/p/${p.slug}`;

  const Card = (
    <div className="card">
      <div>
        <div className="cardTitleRow">
          <h3 className="cardTitle">{p.title}</h3>
          <StatusPill status={p.status} />
        </div>
        <p className="cardDesc">{p.desc}</p>
      </div>

      <div className="tagRow">
        {p.tags.slice(0, 4).map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
    </div>
  );

  // 🔀 Redirect logic
  return isExternal ? (
    <a
      className="cardLink"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {Card}
    </a>
  ) : (
    <Link className="cardLink" to={href}>
      {Card}
    </Link>
  );
}
