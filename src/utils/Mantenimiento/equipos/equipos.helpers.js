export function sortEquipos(items = []) {
  return [...items].sort((a, b) =>
    `${a?.nombre ?? ""}`.localeCompare(`${b?.nombre ?? ""}`)
  );
}

export function resolveEquiposWithLeader(items = [], usuarios = [], marcas = []) {
  return items.map((item) => {
    const usuario = usuarios.find(
      (candidate) => Number(candidate.id) === Number(item.liderId ?? item.lider_id)
    );
    const marca = marcas.find(
      (candidate) => Number(candidate.id) === Number(item.marcaId ?? item.marca_id)
    );
    const marcaId = item.marcaId ?? item.marca_id ?? "";
    const itemMarca = `${item.marca ?? ""}`.trim();
    const marcaNombre = marca?.nombre ?? itemMarca;

    return {
      ...item,
      marca: marcaNombre || (marcaId ? `ID ${marcaId}` : ""),
      lider:
        usuario?.nombre ??
        item.lider ??
        `ID ${item.liderId ?? item.lider_id ?? ""}`.trim(),
    };
  });
}

export function filterEquipos(items = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return items;

  return items.filter((item) => {
    const nombre = `${item?.nombre ?? ""}`.toLowerCase();
    const lider = `${item?.lider ?? ""}`.toLowerCase();
    const marca = `${item?.marca ?? ""}`.toLowerCase();
    return (
      nombre.includes(normalizedQuery) ||
      lider.includes(normalizedQuery) ||
      marca.includes(normalizedQuery)
    );
  });
}

export function buildEquipoFilterOptions(items = []) {
  return items.flatMap((item) => {
    const nombre = `${item?.nombre ?? ""}`.trim();
    const lider = `${item?.lider ?? ""}`.trim();
    const marca = `${item?.marca ?? ""}`.trim();
    const baseLabel = [nombre, marca, lider].filter(Boolean).join(" | ");
    const id = item?.id ?? `${nombre}-${lider}`;

    return [
      nombre
        ? {
            id: `${id}-nombre`,
            label: baseLabel,
            queryValue: nombre,
          }
        : null,
      lider
        ? {
            id: `${id}-lider`,
            label: `${lider}${nombre ? ` | ${nombre}` : ""}`,
            queryValue: lider,
          }
        : null,
      marca
        ? {
            id: `${id}-marca`,
            label: `${marca}${nombre ? ` | ${nombre}` : ""}`,
            queryValue: marca,
          }
        : null,
    ].filter(Boolean);
  });
}

export function filterEquipoOptions(options = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return [];

  return options.filter((item) =>
    item.label.toLowerCase().includes(normalizedQuery)
  );
}

export function getLeaderUsers(roles = [], usuarios = [], marcas = [], selectedMarcaId = null) {
  const selectedMarca = marcas.find(m => String(m.id) === String(selectedMarcaId));
  const marcaNombre = (selectedMarca?.nombre ?? "").trim().toUpperCase();

  const isUSA = marcaNombre === "IMS USA";
  
  const primaryRoleName = isUSA ? "LÍDER DE VENTAS USA" : "LÍDER DE VENTAS";
  const secondaryRoleName = isUSA ? "LÍDER DE VENTAS" : "LÍDER DE VENTAS USA";

  const primaryRoleIds = new Set(
    roles
      .filter(
        (role) =>
          `${role.nombre ?? ""}`.trim().toUpperCase() === primaryRoleName.toUpperCase()
      )
      .map((role) => role.id)
  );

  const secondaryRoleIds = new Set(
    roles
      .filter(
        (role) =>
          `${role.nombre ?? ""}`.trim().toUpperCase() === secondaryRoleName.toUpperCase()
      )
      .map((role) => role.id)
  );

  const allLeaderRoleIds = new Set(
    roles
      .filter((role) => {
        const name = `${role.nombre ?? ""}`.trim().toUpperCase();
        return name.includes("LÍDER") || name.includes("LIDER");
      })
      .map((role) => role.id)
  );

  return usuarios
    .filter((usuario) => allLeaderRoleIds.has(usuario.rolId))
    .sort((a, b) => {
      const aIsPrimary = primaryRoleIds.has(a.rolId);
      const bIsPrimary = primaryRoleIds.has(b.rolId);
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;
      return a.nombre.localeCompare(b.nombre);
    });
}

export function buildGrupoParams(row) {
  const params = new URLSearchParams();
  params.set("equipoId", String(row.id ?? ""));
  if (row?.nombre) params.set("equipo", String(row.nombre));
  if (row?.lider) params.set("lider", String(row.lider));
  if (row?.marca) params.set("marca", String(row.marca));
  if (row?.marcaId ?? row?.marca_id) {
    params.set("marcaId", String(row.marcaId ?? row.marca_id));
  }
  return params.toString();
}
