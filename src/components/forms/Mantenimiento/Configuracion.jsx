import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  BookMarked,
  Settings2,
  Handshake,
  MapPinned,
  UserRoundKey,
  UserCircle2,
  HandCoins,
  UserCog,
  Clock,
} from "lucide-react";

import HeaderBox from "../../ui/HeaderBox";



const tabs = [

  { id: "permisos", label: "Permisos", icon: UserRoundKey },

];

const tabConfig = {
 
  permisos: {
    title: "CONFIGURACIÓN DE PERMISOS",
    subtitle: "Administra los permisos del sistema.",
    icon: UserRoundKey,
  },
};

export default function Configuracion() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const initialTab = searchParams.get("tab");
    return initialTab && tabs.some((tab) => tab.id === initialTab)
      ? initialTab
      : "";
  });
  const [total, setTotal] = useState(0);

  const currentConfig = useMemo(() => {
    return (
      tabConfig[activeTab] || {
        title: "CONFIGURACIÓN",
        subtitle: "Gestiona la configuración del sistema.",
        icon: Settings2,
      }
    );
  }, [activeTab]);

  const HeaderIcon = currentConfig.icon || Settings2;

  const handleTabChange = (tabId) => {
    if (tabId === "vendedores") {
      navigate("/vendedores");
      return;
    }

    if (tabId === "permisos") {
      navigate("/permisos");
      return;
    }

    setActiveTab(tabId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("tab", tabId);
      return next;
    });
    setTotal(0);
  };



  return (
    <section className="space-y-5">
      <HeaderBox
        title={currentConfig.title}
        subtitle={currentConfig.subtitle}
        Icon={HeaderIcon}
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-[#0e183f] dark:text-sky-300 transition-colors duration-300">
              Registrados: {total}
            </div>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm transition-colors duration-300">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={[
                    "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
