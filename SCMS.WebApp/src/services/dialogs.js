import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const baseOptions = {
  buttonsStyling: false,
  customClass: {
    popup: "rounded-lg text-scms-text",
    title: "text-scms-text text-xl font-black",
    htmlContainer: "text-scms-muted text-sm",
    confirmButton: "btn min-h-11 rounded-xl border-0 bg-scms-primary px-5 text-white hover:bg-scms-primaryDark",
    cancelButton: "btn min-h-11 rounded-xl border-scms-border bg-white px-5 text-scms-text hover:bg-scms-primaryLight",
    actions: "gap-2",
  },
  heightAuto: false,
};

export const showAlert = (message, title = "SCMS") =>
  Swal.fire({
    ...baseOptions,
    title,
    text: message,
    confirmButtonText: "OK",
  });

export const showError = (message, title = "Error") =>
  Swal.fire({
    ...baseOptions,
    title,
    text: message,
    icon: "error",
    confirmButtonText: "OK",
  });

export const showConfirm = async (message, title = "Confirm") => {
  const result = await Swal.fire({
    ...baseOptions,
    title,
    text: message,
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: "Confirm",
    cancelButtonText: "Cancel",
  });

  return result.isConfirmed;
};
