export const AUTH_API_URL = "/api/login";

function buildHeaders(includeJson = false) {
  return {
    accept: "*/*",
    "ngrok-skip-browser-warning": "true",
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
  };
}

export async function loginUsuario({ identifier, password }) {
  const response = await fetch(AUTH_API_URL, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({
      identifier: `${identifier ?? ""}`.trim(),
      password,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    let detail = "Credenciales invalidas";

    try {
      const data = await response.json();
      detail =
        data?.message ??
        data?.error ??
        data?.detail ??
        "Credenciales invalidas";
    } catch {
      detail = "Credenciales invalidas";
    }

    throw new Error(detail);
  }

  return response.json();
}
