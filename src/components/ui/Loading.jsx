import asigno from "../../image/ASIGNO.webp";

export default function Loading({ label = "Cargando...", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-6 text-center ${className}`.trim()}
    >
      <div className="loader border-t-4 rounded-full border-white bg-white animate-spin aspect-square w-20 flex justify-center items-center">
        <img
          src={asigno}
          alt="loading"
          className="w-14 h-14 object-contain"
        />
      </div>
      <span className="text-sm font-medium text-slate-500">{label}</span>
    </div>
  );
}