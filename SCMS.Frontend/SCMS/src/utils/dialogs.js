import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "./dialogs.css";

const toMessage = (message) => {
  if (message == null) return "";
  if (typeof message === "string") return message;
  return String(message);
};

const baseOptions = {
  buttonsStyling: false,
  customClass: {
    popup: "scms-popup animate-modal-in",
    title: "scms-popup-title",
    htmlContainer: "scms-popup-html",
    actions: "scms-popup-actions",
    confirmButton: "scms-popup-confirm",
    cancelButton: "scms-popup-cancel",
  },
  heightAuto: false,
  scrollbarPadding: false,
};

export const showAlert = (message, options = {}) =>
  Swal.fire({
    ...baseOptions,
    title: options.title || "Notice",
    text: toMessage(message),
    confirmButtonText: options.confirmButtonText || "OK",
  });

export const showConfirm = async (message, options = {}) => {
  const result = await Swal.fire({
    ...baseOptions,
    title: options.title || "Confirm",
    text: toMessage(message),
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || "Confirm",
    cancelButtonText: options.cancelButtonText || "Cancel",
    reverseButtons: true,
  });

  return result.isConfirmed;
};

export const installDialogAlerts = () => {
  window.alert = (message) => {
    void showAlert(message);
  };
};
