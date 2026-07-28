export function filterAvailableSellers({
  vendedores = [],
  grupos = [],
  ocupadosIds = new Set(),
  ocupadosMap = new Map(),
  currentEquipoId = null,
  query = "",
}) {
  const normalizedQuery = query.trim().toLowerCase();

  const assignedIds = new Set(
    grupos
      .map((item) => Number(item?.vendedorId))
      .filter((value) => Number.isFinite(value))
  );

  const base = vendedores.map((item) => {
    const id = Number(item?.id);
    if (!Number.isFinite(id)) return null;

    // Si ya está asignado en este mismo equipo
    if (assignedIds.has(id)) return null;

    // fallback si no se pasó ocupadosMap
    if ((!ocupadosMap || ocupadosMap.size === 0) && ocupadosIds.has(id)) {
      return null;
    }

    // Si está ocupado en otro equipo
    if (ocupadosMap) {
      const occupation = ocupadosMap.get(id);
      if (occupation) {
        if (Number(occupation.equipoId) === Number(currentEquipoId)) {
          return null;
        }
        return {
          ...item,
          ocupadoInfo: {
            grupoId: occupation.grupoId,
            equipoId: occupation.equipoId,
            equipoNombre: occupation.equipoNombre || "Otro equipo",
            tipo: occupation.tipo,
          }
        };
      }
    }

    return item;
  }).filter(Boolean);

  if (!normalizedQuery) return base;

  return base.filter((item) =>
    `${item?.nombre ?? ""}`.toLowerCase().includes(normalizedQuery)
  );
}

export function buildTableRows(grupos = []) {
  const leader = grupos.find((item) => item.tipo === "LIDER") ?? null;
  const closers = grupos.filter((item) => item.tipo === "CERRADOR");
  const closerIds = new Set(
    closers.map((item) => Number(item.vendedorId)).filter(Number.isFinite)
  );

  const assistantsByCloserId = new Map();

  grupos
    .filter((item) => item.tipo === "ASISTENTE" && item.cerradorId)
    .forEach((item) => {
      const key = Number(item.cerradorId);
      const current = assistantsByCloserId.get(key) ?? [];
      current.push(item.vendedor);
      assistantsByCloserId.set(key, current);
    });

  const closerRows = closers.map((closer) => {
    const closerId = Number(closer.vendedorId);
    const assistants = assistantsByCloserId.get(closerId) ?? [];
    const vendedores = [closer.vendedor, ...assistants].filter(Boolean);

    return {
      id: `closer-${closer.grupoId ?? closer.vendedorId ?? closer.id}`,
      tipo: "CERRADOR",
      grupoId: closer.grupoId ?? null,
      vendedorId: closer.vendedorId,
      vendedor: closer.vendedor,
      vendedores,
    };
  });

  const orphanAssistants = grupos.filter((item) => {
    if (item.tipo !== "ASISTENTE") return false;
    if (item.cerradorId == null) return true;

    const closerId = Number(item.cerradorId);
    if (!Number.isFinite(closerId)) return true;

    return !closerIds.has(closerId);
  });

  const orphanRowsByGrupoId = new Map();

  orphanAssistants.forEach((assistant) => {
    const key = String(assistant.grupoId ?? assistant.id ?? assistant.vendedorId ?? "");
    if (!key) return;

    const current = orphanRowsByGrupoId.get(key) ?? [];
    current.push(assistant);
    orphanRowsByGrupoId.set(key, current);
  });

  const orphanRows = [];

  orphanRowsByGrupoId.forEach((items, key) => {
    const vendedores = items.map((item) => item.vendedor).filter(Boolean);
    const first = items[0] ?? null;

    orphanRows.push({
      id: `assistant-only-${key}`,
      tipo: "ASISTENTE",
      grupoId: first?.grupoId ?? null,
      vendedorId: first?.vendedorId ?? null,
      vendedor: first?.vendedor ?? "",
      vendedores,
    });
  });

  return [...(leader ? [leader] : []), ...closerRows, ...orphanRows];
}

export function getTotalGrupos(grupos = []) {
  return new Set(
    grupos
      .filter((item) => item.tipo !== "LIDER")
      .map((item) => Number(item?.grupoId))
      .filter((grupoId) => Number.isFinite(grupoId))
  ).size;
}
