export function clasificarTiposAsignacion(items = []) {
  return [...items].sort((a, b) =>
    `${a?.nombre ?? ""}`.localeCompare(`${b?.nombre ?? ""}`)
  );
}

export function filterTiposAsignacion(items = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) =>
    `${item?.nombre ?? ""}`.toLowerCase().includes(normalizedQuery)
  );
}

export function buildTipoAsignacionFilterOptions(items = []) {
  return items
    .map((item) => ({
      id: item.id,
      label: `${item.nombre ?? ""}`.trim(),
      queryValue: `${item.nombre ?? ""}`.trim(),
    }))
    .filter((item) => item.label);
}

export function filterTipoAsignacionOptions(options = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return options.filter((item) =>
    item.label.toLowerCase().includes(normalizedQuery)
  );
}
