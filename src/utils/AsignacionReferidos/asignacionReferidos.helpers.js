export function splitHistoricalSellers(value = "") {
  return `${value ?? ""}`
    .split(" - ")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getCountValue(source, code) {
  return Number(
    source?.[code] ??
      source?.[`${code}`.toUpperCase()] ??
      source?.[`${code}`.toLowerCase()] ??
      0
  );
}

export function isLeaderRow(vendedor = "") {
  return vendedor.startsWith("[LIDER] ") || vendedor.startsWith("[L] ");
}

export function getVisibleTeamsByUser({
  equipos = [],
  currentUser,
  imsMarcaIds = [],
  liderVentasRoleId,
}) {
  const brandIds = new Set(imsMarcaIds.map(Number));

  const equiposBase = equipos.filter((equipo) =>
    brandIds.has(Number(equipo?.marcaId ?? equipo?.marca_id))
  );

  const isLeader = Number(currentUser?.roleId) === Number(liderVentasRoleId);

  if (!isLeader) return equiposBase;
  if (currentUser?.id == null) return [];

  return equiposBase.filter(
    (equipo) => Number(equipo?.liderId ?? equipo?.lider_id ?? null) === currentUser.id
  );
}

export function filterTeamsBySearch({
  teams = [],
  teamFilter = "",
  sellerQuery = "",
}) {
  const normalizedTeam = teamFilter.trim().toLowerCase();
  const normalizedSeller = sellerQuery.trim().toLowerCase();

  return teams.filter((team) => {
    const matchesTeam =
      !normalizedTeam || team.name.toLowerCase().includes(normalizedTeam);

    const matchesSeller =
      !normalizedSeller ||
      team.rows.some((row) =>
        (row.vendedores ?? []).some((seller) =>
          seller.toLowerCase().includes(normalizedSeller)
        )
      );

    return matchesTeam && matchesSeller;
  });
}

export function getAvailableTeams(teams = []) {
  return teams.map((team) => team.name).sort((a, b) => a.localeCompare(b));
}

export function getMatchingNames(options = [], query = "") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return options.filter((name) => name.toLowerCase().includes(normalized));
}

export function getAvailableSellers(teams = []) {
  return Array.from(
    new Set(teams.flatMap((team) => team.rows.flatMap((row) => row.vendedores ?? [])))
  ).sort((a, b) => a.localeCompare(b));
}

export function getLeaderTargets(teams = []) {
  return teams
    .map((team) => {
      const leader = team.rows.find((row) => isLeaderRow(row.vendedor));

      return leader
        ? {
            teamId: team.id,
            teamName: team.name,
            leaderName: leader.vendedor,
          }
        : null;
    })
    .filter(Boolean);
}

export function getMovableRows(teams = [], sourceTeamId = "") {
  if (!sourceTeamId) return [];

  const selectedTeam = teams.find((team) => team.id === sourceTeamId);
  if (!selectedTeam) return [];

  return selectedTeam.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !isLeaderRow(row.vendedor));
}

export function getMovableSellers(movableRows = []) {
  return movableRows.flatMap(({ row }) =>
    (row.miembros ?? []).map((member) => ({
      sellerName: member.vendedor,
      tipo: member.tipo,
    }))
  );
}

export function getMovableSellerOptions(movableSellers = []) {
  return movableSellers.map(({ sellerName, tipo }) => ({
    sellerName,
    label: `${tipo === "CERRADOR" ? "C - " : ""}${sellerName}`,
  }));
}

export function getSourceRowForChange({
  teams = [],
  sourceTeamId = "",
  sellerName = "",
}) {
  if (!sourceTeamId || !sellerName) return null;

  const selectedTeam = teams.find((team) => team.id === sourceTeamId);
  if (!selectedTeam) return null;

  return (
    selectedTeam.rows.find(
      (row) =>
        !isLeaderRow(row.vendedor) &&
        (row.vendedores ?? []).includes(sellerName)
    ) ?? null
  );
}

export function getTargetRows(teams = [], targetTeamId = "") {
  if (!targetTeamId) return [];

  const targetTeam = teams.find((team) => team.id === targetTeamId);
  if (!targetTeam) return [];

  return targetTeam.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !isLeaderRow(row.vendedor));
}