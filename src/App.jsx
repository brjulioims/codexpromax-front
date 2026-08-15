import { useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import AuthTransition from "./pages/AuthTransition";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Permisos from "./components/forms/Mantenimiento/Permisos";
import DetalleCliente from "./components/forms/DetalleCliente/DetalleCliente";
import ExpedienteAsignado from "./components/forms/qualityAsignador/ExpedienteAsignado";
import ExpedienteSinAsignar from "./components/forms/qualityAsignador/ExpedienteSinAsignar";
import DetalleExpediente from "./components/forms/qualityAsignador/DetalleExpediente/DetalleExpediente";
import Usuario from "./components/forms/Mantenimiento/Usuario";
import AsignacionesTraduccion from "./components/forms/Traduccion/AsignacionesTraduccion";
import MisAuditoriasTraduccion from "./components/forms/Traduccion/MisAuditoriasTraduccion";
import MisTraducciones from "./components/forms/Traduccion/MisTraducciones";
import AsignacionesRedaccion from "./components/forms/Redaccion/AsignacionesRedaccion";
import MisAuditoriasRedaccion from "./components/forms/Redaccion/MisAuditoriasRedaccion";
import MisRedacciones from "./components/forms/Redaccion/MisRedacciones";


import { hasPendingAzureLogin } from "./services/loginAzureService";


function LayoutShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <MainLayout activePath={location.pathname} onNavigate={navigate}>
      {children}
    </MainLayout>
  );
}

export default function App() {
  const hasActiveSession = Boolean(
    localStorage.getItem("token") || localStorage.getItem("user")
  );

  const [isLoggingIn, setIsLoggingIn] = useState(() => hasPendingAzureLogin());

  if (isLoggingIn) {
    return (
      <>
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          containerStyle={{
            bottom: 24,
            right: 24,
          }}
          toastOptions={{
            duration: 3000,
          }}
        />
        <AuthTransition
          onComplete={() => {
            setIsLoggingIn(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        containerStyle={{
          bottom: 24,
          right: 24,
        }}
        toastOptions={{
          duration: 3000,
        }}
      />
      <Routes>
        <Route
          element={
            hasActiveSession ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={() => setIsLoggingIn(true)} />
            )
          }
          path="/login"        
        />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <LayoutShell>
                <main>
                  <Dashboard />
                </main>
              </LayoutShell>
            }
          />
          <Route
            path="/usuarios"
            element={
              <LayoutShell>
                <Usuario />
              </LayoutShell>
            }
          />
          <Route
            path="/configuracion"
            element={
              <LayoutShell>
                <Permisos />
              </LayoutShell>
            }
          />
          <Route
            path="/clientes/detalle_cliente"
            element={
              <LayoutShell>
                <DetalleCliente />
              </LayoutShell>
            }
          />
          <Route
            path="/asignaciones-traduccion"
            element={
              <LayoutShell>
                <AsignacionesTraduccion />
              </LayoutShell>
            }
          />
          <Route
            path="/mis_auditorias_traduccion"
            element={
              <LayoutShell>
                <MisAuditoriasTraduccion />
              </LayoutShell>
            }
          />
          <Route
            path="/mis_traducciones"
            element={
              <LayoutShell>
                <MisTraducciones />
              </LayoutShell>
            }
          />
          <Route
            path="/asignaciones-redaccion"
            element={
              <LayoutShell>
                <AsignacionesRedaccion />
              </LayoutShell>
            }
          />
          <Route
            path="/mis_auditorias_redaccion"
            element={
              <LayoutShell>
                <MisAuditoriasRedaccion />
              </LayoutShell>
            }
          />
          <Route
            path="/mis_redacciones"
            element={
              <LayoutShell>
                <MisRedacciones />
              </LayoutShell>
            }
          />
        </Route>
        <Route
          path="/quality_asignador"
          element={
            <LayoutShell>
              <ExpedienteAsignado />
            </LayoutShell>
          }
        />
        <Route
          path="/quality_asignador/sin_asignar"
          element={
            <LayoutShell>
              <ExpedienteSinAsignar />
            </LayoutShell>
          }
        />
        <Route
          path="/quality_asignador/detalle_expediente"
          element={
            <LayoutShell>
              <DetalleExpediente />
            </LayoutShell>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
