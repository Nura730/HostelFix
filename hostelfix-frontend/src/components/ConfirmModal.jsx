import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger, warning, info
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const colors = {
    danger: { bg: "#fef2f2", icon: "#ef4444", btn: "#ef4444" },
    warning: { bg: "#fffbeb", icon: "#f59e0b", btn: "#f59e0b" },
    info: { bg: "#eff6ff", icon: "#3b82f6", btn: "#3b82f6" },
  };

  const color = colors[type];

  return (
    <div className="modalOverlay" onClick={onCancel}>
      <div className="confirmModal" onClick={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onCancel}>
          <FaTimes />
        </button>

        <div className="modalIcon" style={{ backgroundColor: color.bg }}>
          <FaExclamationTriangle style={{ color: color.icon }} />
        </div>

        <h3>{title}</h3>
        <p>{message}</p>

        <div className="modalActions">
          <button className="cancelBtn" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className="confirmBtn"
            style={{ backgroundColor: color.btn }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
