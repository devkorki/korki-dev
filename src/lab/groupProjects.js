export function groupByCategory(projects) {
  const map = new Map();
  for (const p of projects) {
    const key = p.category || "Etc";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}
