import { Filter } from "lucide-react";
import ModalGeneral from "./ModalGeneral";

export default function ModalFiltro({
  open = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  showClose = true,
  headerClassName,
  bodyClassName,
  footerClassName,
}) {
  return (
    <ModalGeneral
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      headerIcon={<Filter size={18} />}
      headerAccent="#0e183f"
      footer={footer}
      size={size}
      showClose={showClose}
      headerClassName={headerClassName}
      bodyClassName={bodyClassName}
      footerClassName={footerClassName}
    >
      {children}
    </ModalGeneral>
  );
}
