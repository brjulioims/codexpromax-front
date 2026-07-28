export function clasificarTiposAsignacionReferido(items = []) {
  return [...items].sort((a, b) =>
    `${a?.nombre ?? ""}`.localeCompare(`${b?.nombre ?? ""}`)
  );
}

export function filterTiposAsignacionReferido(items = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) =>
    `${item?.nombre ?? ""}`.toLowerCase().includes(normalizedQuery)
  );
}

export function buildTipoAsignacionReferidoFilterOptions(items = []) {
  return items
    .map((item) => ({
      id: item.id,
      label: `${item.nombre ?? ""}`.trim(),
      queryValue: `${item.nombre ?? ""}`.trim(),
    }))
    .filter((item) => item.label);
}

export function filterTipoAsignacionReferidoOptions(options = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return options.filter((item) =>
    item.label.toLowerCase().includes(normalizedQuery)
  );
}
