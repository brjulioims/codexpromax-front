function buildHeaders(includeJson = false) {
  const token = localStorage.getItem("token");

  return {
    accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

async function parseResponse(response, actionLabel) {
  if (!response.ok) {
    let detail = "";

    try {
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const errorData = await response.json();

        detail =
          errorData?.message ??
          errorData?.error ??
          errorData?.detail ??
          JSON.stringify(errorData);
      } else {
        detail = await response.text();
      }
    } catch {
      detail = "";
    }

    throw new Error(
      `Error al ${actionLabel}: ${response.status}${
        detail ? ` - ${detail}` : ""
      }`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// 1. Asignador
export async function getPendientesRedactor() {
  try {
    const response = await fetch("/api/redacciones/pendientes-redactor", {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    const data = await parseResponse(response, "obtener pendientes redactor");
    return data?.data ?? [];
  } catch (error) {
    console.error("Error consultando pendientes redactor", error);
    return [];
  }
}

export async function getPendientesQuality() {
  try {
    const response = await fetch("/api/redacciones/pendientes-quality", {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    const data = await parseResponse(response, "obtener pendientes quality redacción");
    return data?.data ?? [];
  } catch (error) {
    console.error("Error consultando pendientes quality redacción", error);
    return [];
  }
}

export async function asignarRedactor(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/asignar-redactor`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "asignar redactor");
  } catch (error) {
    console.error("Error asignando redactor", error);
    throw error;
  }
}

export async function asignarQuality(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/asignar-quality`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "asignar quality redacción");
  } catch (error) {
    console.error("Error asignando quality redacción", error);
    throw error;
  }
}

export async function getHistorialAsignadorRedaccion(usuarioId) {
  try {
    const response = await fetch(`/api/redacciones/historial-asignador?usuario_id=${usuarioId}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    const data = await parseResponse(response, "obtener historial asignador redacción");
    return data?.data ?? [];
  } catch (error) {
    console.error("Error consultando historial asignador redacción", error);
    return [];
  }
}

export async function reasignarRedactor(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/reasignar-redactor`, {
      method: "PATCH",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "reasignar redactor");
  } catch (error) {
    console.error("Error reasignando redactor", error);
    throw error;
  }
}

export async function reasignarQuality(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/reasignar-quality`, {
      method: "PATCH",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "reasignar quality redacción");
  } catch (error) {
    console.error("Error reasignando quality redacción", error);
    throw error;
  }
}

// 2. Redactor
export async function getMisAsignacionesRedactor(usuarioId) {
  try {
    const response = await fetch(`/api/redacciones/mis-asignaciones-redactor?usuario_id=${usuarioId}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    const data = await parseResponse(response, "obtener mis asignaciones de redactor");
    return data?.data ?? [];
  } catch (error) {
    console.error("Error consultando mis asignaciones de redactor", error);
    return [];
  }
}

export async function registrarContactoRedactor(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/registrar-contacto`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "registrar contacto redactor");
  } catch (error) {
    console.error("Error registrando contacto redactor", error);
    throw error;
  }
}

export async function tomaDeclaracionRedactor(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/toma-declaracion`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "toma declaración redactor");
  } catch (error) {
    console.error("Error en toma de declaración", error);
    throw error;
  }
}

export async function enviarQualityRedactor(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/enviar-quality`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "enviar a quality redactor");
  } catch (error) {
    console.error("Error enviando a quality redactor", error);
    throw error;
  }
}

export async function reenviarQualityRedactor(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/reenviar-quality`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "reenviar a quality redactor");
  } catch (error) {
    console.error("Error reenviando a quality redactor", error);
    throw error;
  }
}

// 3. Quality Redacción
export async function getMisAsignacionesQuality(usuarioId) {
  try {
    const response = await fetch(`/api/redacciones/mis-asignaciones-quality?usuario_id=${usuarioId}`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    const data = await parseResponse(response, "obtener mis asignaciones de quality redacción");
    return data?.data ?? [];
  } catch (error) {
    console.error("Error consultando mis asignaciones de quality redacción", error);
    return [];
  }
}

export async function rechazarQualityRedaccion(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/rechazar-quality`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "rechazar declaración");
  } catch (error) {
    console.error("Error rechazando declaración", error);
    throw error;
  }
}

export async function aprobarQualityRedaccion(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/aprobar-quality`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "aprobar declaración");
  } catch (error) {
    console.error("Error aprobando declaración", error);
    throw error;
  }
}

export async function enviarTraduccionRedaccion(expedienteId, payload) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion/enviar-traduccion`, {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    return await parseResponse(response, "enviar declaración a traducción");
  } catch (error) {
    console.error("Error enviando declaración a traducción", error);
    throw error;
  }
}

export async function getRedaccionEstado(expedienteId) {
  try {
    const response = await fetch(`/api/expedientes/${expedienteId}/redaccion`, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
    });
    if (response.status === 404) {
      return null;
    }
    const data = await parseResponse(response, "obtener estado redacción");
    return data?.data ?? null;
  } catch (error) {
    console.error("Error consultando estado redacción", error);
    return null;
  }
}