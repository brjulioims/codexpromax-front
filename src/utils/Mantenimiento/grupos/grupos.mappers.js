export function buildInitialGrupos(lider) {
  if (!lider) return [];

  return [
    {
      id: "leader",
      tipo: "LIDER",
      vendedor: lider,
    },
  ];
}

export function getOccupiedSellerIds(items = []) {
  return new Set(
    (items ?? [])
      .map((item) => Number(item?.vendedorId))
      .filter((value) => Number.isFinite(value))
  );
}

export function buildGroupMembers(grupos = [], grupoId) {
  return grupos
    .filter((item) => Number(item?.grupoId) === Number(grupoId))
    .map((item) => ({
      vendedorId: Number(item?.vendedorId),
      vendedor: item?.vendedor ?? "",
      tipo: `${item?.tipo ?? ""}`.toUpperCase(),
    }))
    .filter((item) => Number.isFinite(item.vendedorId) && item.vendedor);
}

export function buildGruposFromApi(data = [], equipoIdParam, initialGrupos = []) {
  const equipoIdNumber = equipoIdParam ? Number(equipoIdParam) : null;

  const members = (data ?? []).filter((item) => {
    if (equipoIdNumber == null || !Number.isFinite(equipoIdNumber)) return true;
    return Number(item?.equipoId) === equipoIdNumber;
  });

  const membersByGrupoId = new Map();

  members.forEach((item) => {
    const key = String(item?.grupoId ?? item?.id ?? "");
    if (!key) return;

    const current = membersByGrupoId.get(key) ?? [];
    current.push(item);
    membersByGrupoId.set(key, current);
  });

  const built = [];

  membersByGrupoId.forEach((groupMembers, grupoKey) => {
    const closers = groupMembers.filter(
      (m) => `${m?.tipo ?? ""}`.toUpperCase() === "CERRADOR"
    );
    const assistants = groupMembers.filter(
      (m) => `${m?.tipo ?? ""}`.toUpperCase() === "ASISTENTE"
    );

    const closer = closers[0] ?? null;

    if (!closer?.vendedorId) {
      assistants.forEach((assistant) => {
        if (!assistant?.vendedorId) return;

        built.push({
          id: `grupo-${grupoKey}-asistente-${assistant.vendedorId}`,
          tipo: "ASISTENTE",
          grupoId: assistant.grupoId ?? null,
          vendedorId: assistant.vendedorId,
          vendedor: assistant.vendedor,
          ciudad: assistant.ciudad,
          cerradorId: null,
        });
      });

      return;
    }

    built.push({
      id: `grupo-${grupoKey}-cerrador`,
      tipo: "CERRADOR",
      grupoId: closer.grupoId ?? null,
      vendedorId: closer.vendedorId,
      vendedor: closer.vendedor,
      ciudad: closer.ciudad,
    });

    assistants.forEach((assistant) => {
      if (!assistant?.vendedorId) return;

      built.push({
        id: `grupo-${grupoKey}-asistente-${assistant.vendedorId}`,
        tipo: "ASISTENTE",
        grupoId: assistant.grupoId ?? null,
        vendedorId: assistant.vendedorId,
        vendedor: assistant.vendedor,
        ciudad: assistant.ciudad,
        cerradorId: closer.vendedorId,
      });
    });
  });

  return [...initialGrupos, ...built];
}

export function resolveCreatedGrupoId(created, refreshed = [], equipoId, vendedorId) {
  let createdGrupoId = Array.isArray(created)
    ? created?.[0]?.id
    : created?.id ?? created?.grupo_id ?? created?.grupoId ?? created?.data?.id ?? null;

  if (createdGrupoId) return createdGrupoId;

  const found = refreshed.find(
    (item) =>
      Number(item?.equipoId) === Number(equipoId) &&
      `${item?.tipo ?? ""}`.toUpperCase() === "CERRADOR" &&
      Number(item?.vendedorId) === Number(vendedorId)
  );

  return found?.grupoId ?? null;
}