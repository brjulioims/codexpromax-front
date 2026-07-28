import archivoPdf from "../../image/archivo-pdf.webp";

export default function BotonPdf({
  children = "Descargar informe en pdf",
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#0e183f] px-4 py-2 text-sm 
        font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#16245e] ${className}`.trim()}
      
      {...props}
    >
      <img
        src={archivoPdf}
        alt="PDF"
        className="h-4 w-4 object-contain"
        draggable={false}
      />
      {children}
    </button>
  );
}
