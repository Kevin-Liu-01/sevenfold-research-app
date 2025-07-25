// Resuable modal component

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  // lock background scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-xs"
        onClick={onClose}
      />
      {/* content */}
      <div className="relative z-10">{children}</div>
    </div>,
    document.body
  );
};

export default Modal;
