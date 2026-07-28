import { PublicClientApplication } from "@azure/msal-browser";

const LOGIN_AZURE_API_URL = "/api/login/azure";
const AZURE_CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID;
const AZURE_TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID;
const AZURE_LOGIN_FLAG = "azureLoginInProgress";

let msalInstancePromise = null;

function buildHeaders() {
  return {
    accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
}

function getAuthority() {
  if (!AZURE_TENANT_ID) {
    throw new Error("Falta VITE_AZURE_TENANT_ID en el .env");
  }

  return `https://login.microsoftonline.com/${AZURE_TENANT_ID}`;
}

function getAzureLoginRequest() {
  return {
    scopes: ["openid", "profile", "email", "User.Read"],
    prompt: "select_account",
  };
}

async function getMsalInstance() {
  if (!AZURE_CLIENT_ID) {
    throw new Error("Falta VITE_AZURE_CLIENT_ID en el .env");
  }

  if (!msalInstancePromise) {
    const redirectUri = `${window.location.origin}/login`;
    console.log("[MSAL] Configuring with redirectUri:", redirectUri);

    const instance = new PublicClientApplication({
      auth: {
        clientId: AZURE_CLIENT_ID,
        authority: getAuthority(),
        redirectUri: redirectUri,
        navigateToLoginRequestUrl: false,
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
      },
      system: {
        allowNativeBroker: false,
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) return;
            // console.log(`[MSAL] ${message}`); // Descomentar para depuración exhaustiva
          },
          logLevel: 3, // Info
        },
      },
    });

    msalInstancePromise = instance.initialize().then(() => {
      console.log("[MSAL] Instance initialized successfully");
      return instance;
    });
  }

  return msalInstancePromise;
}

async function parseResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error("[Backend] Error en login/azure:", response.status, data);
    const rawMessage = `${
      data?.message ?? data?.error ?? data?.detail ?? "Error al iniciar sesión con Azure"
    }`
      .trim()
      .toUpperCase();

    if (
      rawMessage.includes("USER_DISABLED") ||
      rawMessage.includes("USER_NOT_FOUND") ||
      rawMessage.includes("NOT_REGISTERED") ||
      rawMessage.includes("NO REGISTRADO")
    ) {
      throw new Error("Tu usuario no está registrado.");
    }

    throw new Error(
      data?.message ??
        data?.error ??
        data?.detail ??
        "Error al iniciar sesión con Azure"
    );
  }

  return data;
}

export async function startAzureLogin() {
  try {
    const instance = await getMsalInstance();
    sessionStorage.setItem(AZURE_LOGIN_FLAG, "true");
    console.log("[MSAL] Starting loginRedirect...");
    await instance.loginRedirect(getAzureLoginRequest());
  } catch (error) {
    console.error("[MSAL] Error in startAzureLogin:", error);
    throw error;
  }
}

export async function completeAzureLogin() {
  try {
    const instance = await getMsalInstance();
    console.log("[MSAL] Handling redirect promise...");
    const loginResponse = await instance.handleRedirectPromise();

    if (!loginResponse) {
      console.log("[MSAL] No login response found in URL");
      sessionStorage.removeItem(AZURE_LOGIN_FLAG);
      return null;
    }

    console.log("[MSAL] Login response received successfully");
    sessionStorage.removeItem(AZURE_LOGIN_FLAG);

    const account = loginResponse.account;
    if (account) {
      instance.setActiveAccount(account);
    }

    let graphAccessToken = loginResponse.accessToken;

    if (!graphAccessToken && account) {
      console.log("[MSAL] Attempting acquireTokenSilent for User.Read...");
      try {
        const tokenResponse = await instance.acquireTokenSilent({
          account,
          scopes: ["User.Read"],
        });
        graphAccessToken = tokenResponse.accessToken;
      } catch (e) {
        console.warn("[MSAL] Silent token acquisition failed:", e);
      }
    }

    return {
      idToken: loginResponse.idToken,
      accessToken: graphAccessToken,
      account: account ?? null,
    };
  } catch (error) {
    console.error("[MSAL] Error in completeAzureLogin:", error);
    // Si el error es 400 en /token, MSAL lanzará una excepción aquí
    throw error;
  }
}

export function hasPendingAzureLogin() {
  return sessionStorage.getItem(AZURE_LOGIN_FLAG) === "true";
}

export function clearPendingAzureLogin() {
  sessionStorage.removeItem(AZURE_LOGIN_FLAG);
}

export async function loginAzure({ idToken, accessToken }) {
  if (!idToken) {
    throw new Error("Azure ID Token requerido");
  }

  const response = await fetch(LOGIN_AZURE_API_URL, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      token: idToken,
      access_token: accessToken,
    }),
    credentials: "include",
  });

  return parseResponse(response);
}

export { LOGIN_AZURE_API_URL };