import type { ReactNode } from "react";

export function Modal({
  title,
  children,
  centered = false,
}: {
  title: string;
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "modal-backdrop modal-backdrop-center" : "modal-backdrop"}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
