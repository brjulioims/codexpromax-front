import { REFERIDOS_COUNT_CODES } from "./asignacionReferidos.constants";
import {
  getCountValue,
  splitHistoricalSellers,
} from "./asignacionReferidos.helpers";

export function buildCountsByGrupo(equipos = [], tipos = [], historial = []) {
  const tipoCodigoById = new Map(
    (tipos ?? []).map((tipo) => [
      Number(tipo?.id),
      `${tipo?.codigo ?? ""}`.trim().toLowerCase(),
    ])
  );

  const resolvedCodes = Array.from(
    new Set(
      (historial ?? []).map((item) =>
        tipoCodigoById.get(Number(item?.tipoAsignacionId))
      )
    )
  ).filter(Boolean);

  return {
    countCodes: resolvedCodes,
    countsByGrupoId: new Map(
      equipos.map((equipo) => {
        const equipoId = Number(equipo?.id);

        const historialEquipo = (historial ?? []).filter(
          (item) => Number(item?.equipoId) === equipoId
        );

        const gruposReporte = new Map();
        const totalByGroup = new Map();

        historialEquipo.forEach((item) => {
          const grupoId = Number(item?.grupoId);
          if (!grupoId) return;

          const key = String(grupoId);
          const current = gruposReporte.get(key) ?? { grupoId };
          const codigo = tipoCodigoById.get(Number(item?.tipoAsignacionId));

          if (codigo) {
            current[codigo] = (current[codigo] ?? 0) + 1;
          }

          gruposReporte.set(key, current);

          if (codigo !== "p") {
            totalByGroup.set(key, (totalByGroup.get(key) ?? 0) + 1);
          }
        });

        const totalReferidosEquipo = Array.from(totalByGroup.values()).reduce(
          (accumulator, total) => accumulator + Number(total ?? 0),
          0
        );

        return [
          equipoId,
          {
            totalReferidosEquipo,
            gruposTotal: Array.from(totalByGroup.entries()).map(
              ([grupoId, totalGrupo]) => ({
                grupoId: Number(grupoId),
                totalGrupo,
              })
            ),
            gruposReporte,
          },
        ];
      })
    ),
  };
}

export function buildHistoricalRowsByEquipo(equipos = [], historial = [], countsByGrupoId) {
  return new Map(
    equipos.map((equipo) => {
      const equipoId = Number(equipo?.id);

      const historialEquipo = (historial ?? []).filter(
        (item) => Number(item?.equipoId) === equipoId
      );

      const equipoTotals = countsByGrupoId.get(equipoId) ?? {
        totalReferidosEquipo: 0,
        gruposTotal: [],
        gruposReporte: new Map(),
      };

      const rowsByGroup = new Map();

      historialEquipo.forEach((item) => {
        const groupKey = String(item?.grupoId ?? "");
        if (!groupKey) return;

        const current = rowsByGroup.get(groupKey) ?? {
          grupoId: Number(item?.grupoId ?? null),
          vendedor: item?.vendedores?.trim?.() || item?.grupoNombre?.trim?.() || "",
          vendedores: splitHistoricalSellers(
            item?.vendedores?.trim?.() || item?.grupoNombre?.trim?.() || ""
          ),
        };

        rowsByGroup.set(groupKey, current);
      });

      const rows = Array.from(rowsByGroup.entries())
        .map(([groupKey, row]) => {
          const counts =
            equipoTotals.gruposReporte.get(groupKey) ??
            equipoTotals.gruposReporte.get(String(row.grupoId)) ??
            {};

          const totalGrupo =
            equipoTotals.gruposTotal.find(
              (grupo) => Number(grupo?.grupoId) === Number(row.grupoId)
            ) ?? {};

          if (!row.vendedor) return null;

          return {
            ...row,
            ...Object.fromEntries(
              REFERIDOS_COUNT_CODES.map((code) => [
                code,
                getCountValue(counts, code),
              ])
            ),
            t: Number(totalGrupo?.totalGrupo ?? counts?.t ?? 0),
            highlighted: false,
            miembros: [],
            rol: "",
          };
        })
        .filter(Boolean);

      return [equipoId, rows];
    })
  );
}

export function buildTeams({
  equiposVisibles = [],
  gruposPorEquipo = [],
  historialFiltrado = [],
  tiposAsignacion = [],
  usuarios = [],
  useHistoricalSnapshot = false,
}) {
  const { countsByGrupoId } = buildCountsByGrupo(
    equiposVisibles,
    tiposAsignacion,
    historialFiltrado
  );

  const historicalRowsByEquipo = buildHistoricalRowsByEquipo(
    equiposVisibles,
    historialFiltrado,
    countsByGrupoId
  );

  const usuariosById = new Map(usuarios.map((user) => [Number(user.id), user]));

  return equiposVisibles.map((equipo, equipoIndex) => {
    const leaderId = Number(equipo?.liderId ?? equipo?.lider_id);
    const leaderName =
      usuariosById.get(leaderId)?.nombre?.trim?.() ??
      `${equipo?.lider ?? ""}`.trim();

    const leaderRow = leaderName
      ? {
        liderId: leaderId,
        vendedor: `[LIDER] ${leaderName}`,
        ...Object.fromEntries(REFERIDOS_COUNT_CODES.map((code) => [code, 0])),
        t: 0,
        highlighted: false,
        vendedores: [],
      }
      : {
        vendedor: "[LIDER] SIN LIDER",
        ...Object.fromEntries(REFERIDOS_COUNT_CODES.map((code) => [code, 0])),
        t: 0,
        highlighted: false,
        vendedores: [],
      };

    const equipoTotals = countsByGrupoId.get(Number(equipo.id)) ?? {
      totalReferidosEquipo: 0,
      gruposTotal: [],
      gruposReporte: new Map(),
    };

    const grupos = (gruposPorEquipo[equipoIndex] ?? []).filter(
      (item) => Number(item?.equipoId) === Number(equipo.id)
    );

    const grouped = new Map();

    grupos.forEach((item) => {
      const key = String(item?.grupoId ?? item?.id ?? item?.vendedorId ?? "");
      if (!key) return;

      const current = grouped.get(key) ?? [];
      current.push(item);
      grouped.set(key, current);
    });

    const currentGroupRows = Array.from(grouped.values())
      .map((members) => {
        const closers = members.filter(
          (m) => `${m?.tipo ?? ""}`.toUpperCase() === "CERRADOR"
        );

        const assistants = members.filter(
          (m) => `${m?.tipo ?? ""}`.toUpperCase() === "ASISTENTE"
        );

        const orderedMembers = [
          ...closers.map((m) => ({
            vendedorId: Number(m?.vendedorId),
            vendedor: m?.vendedor ?? "",
            tipo: "CERRADOR",
          })),
          ...assistants.map((m) => ({
            vendedorId: Number(m?.vendedorId),
            vendedor: m?.vendedor ?? "",
            tipo: "ASISTENTE",
          })),
        ].filter((item) => item.vendedor);

        const fallbackMembers = members
          .map((m) => ({
            vendedorId: Number(m?.vendedorId),
            vendedor: m?.vendedor ?? "",
            tipo:
              `${m?.tipo ?? "ASISTENTE"}`.trim().toUpperCase() || "ASISTENTE",
          }))
          .filter((item) => item.vendedor);

        const miembros = orderedMembers.length ? orderedMembers : fallbackMembers;
        const vendedores = miembros.map((item) => item.vendedor);

        if (!vendedores.length) return null;

        const groupKey = String(members?.[0]?.grupoId ?? members?.[0]?.id ?? "");
        const grupoId = Number(members?.[0]?.grupoId ?? null);

        const counts =
          equipoTotals.gruposReporte.get(groupKey) ??
          equipoTotals.gruposReporte.get(String(grupoId)) ??
          {};

        const totalGrupo =
          equipoTotals.gruposTotal.find(
            (grupo) => Number(grupo?.grupo_id ?? grupo?.grupoId) === grupoId
          ) ?? {};

        const ocupadoValue = Number(members?.[0]?.ocupado);
        const isDisponible = ocupadoValue === 1;

        return {
          grupoId,
          vendedor: vendedores.join(" - "),
          ...Object.fromEntries(
            REFERIDOS_COUNT_CODES.map((code) => [
              code,
              getCountValue(counts, code),
            ])
          ),
          t: Number(totalGrupo?.totalGrupo ?? counts?.t ?? 0),
          highlighted: isDisponible,
          vendedores,
          miembros,
          rol: `${members?.[0]?.tipo ?? ""}`.trim().toUpperCase(),
        };
      })
      .filter(Boolean);

    const groupRows = useHistoricalSnapshot
      ? historicalRowsByEquipo.get(Number(equipo.id)) ?? []
      : currentGroupRows;

    const totalCounts = groupRows.reduce(
      (acc, row) => {
        REFERIDOS_COUNT_CODES.forEach((code) => {
          acc[code] += Number(row?.[code] ?? 0);
        });
        acc.t += Number(row?.t ?? 0);
        return acc;
      },
      {
        ...Object.fromEntries(REFERIDOS_COUNT_CODES.map((code) => [code, 0])),
        t: 0,
      }
    );

    return {
      id: String(equipo.id),
      name: equipo.nombre,
      leaderName,
      totalGeneral: Number(equipoTotals?.totalReferidosEquipo ?? 0),
      totalCounts,
      totals: {
        disponibles: useHistoricalSnapshot
          ? 0
          : groupRows.filter((row) => row.highlighted).length,
      },
      rows: useHistoricalSnapshot ? groupRows : [leaderRow, ...groupRows],
    };
  });
}
