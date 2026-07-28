import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ellipsis } from "lucide-react";

const MENU_WIDTH = 144;

export default function ActionsDropdown({
  items = [],
  title = "Acciones",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const estimatedHeight = Math.max(items.length, 1) * 40 + 8;
      const openUp = window.innerHeight - rect.bottom < estimatedHeight;

      setPosition({
        top: openUp ? rect.top - estimatedHeight - 8 : rect.bottom + 8,
        left: rect.right - MENU_WIDTH,
      });
    };

    const handleClickOutside = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [items.length, open]);

  return (
    <div className={`flex justify-center ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
        title={title}
      >
        <Ellipsis size={16} />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[9999] w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
              style={{
                top: position.top,
                left: Math.max(8, position.left),
              }}
            >
              {items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      if (!item.disabled) item.onClick?.();
                    }}
                    className={[
                      "flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium transition",
                      item.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-slate-700 hover:bg-slate-50",
                      item.disabled
                        ? "cursor-not-allowed text-slate-300 hover:bg-white"
                        : "",
                    ].join(" ")}
                  >
                    {Icon ? <Icon size={14} /> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
