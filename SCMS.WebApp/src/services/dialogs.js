import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const baseOptions = {
  buttonsStyling: false,
  customClass: {
    container: "scms-swal-container",
    popup: "scms-swal-popup",
    title: "scms-swal-title",
    htmlContainer: "scms-swal-html",
    confirmButton: "scms-swal-confirm-btn",
    cancelButton: "scms-swal-cancel-btn",
    actions: "flex items-center justify-end gap-2.5 mt-5 w-full",
  },
  heightAuto: false,
  showClass: {
    popup: "animate-fadeIn",
  },
};

/**
 * Extracts a user-friendly error message from any Axios error, ASP.NET ProblemDetails, or string.
 */
export const extractErrorMessage = (error, defaultMessage = "An unexpected error occurred. Please try again.") => {
  if (!error) return defaultMessage;
  if (typeof error === "string") return error;

  const data = error.response?.data;
  if (!data) return error.message || defaultMessage;

  // ASP.NET RFC 7807 ValidationProblemDetails errors dictionary
  if (data.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }

  // Standard SCMS Result.Failure or custom message
  if (data.message && typeof data.message === "string") {
    return data.message;
  }

  if (data.title && typeof data.title === "string") {
    return data.detail ? `${data.title}: ${data.detail}` : data.title;
  }

  return error.message || defaultMessage;
};

export const showAlert = (message, title = "Notice") =>
  Swal.fire({
    ...baseOptions,
    title,
    text: typeof message === "string" ? message : extractErrorMessage(message),
    confirmButtonText: "Got it",
  });

export const showSuccess = (message, title = "Success") =>
  Swal.fire({
    ...baseOptions,
    title,
    text: typeof message === "string" ? message : extractErrorMessage(message),
    icon: "success",
    confirmButtonText: "Done",
  });

export const showError = (message, title = "Action Failed") =>
  Swal.fire({
    ...baseOptions,
    title,
    text: typeof message === "string" ? message : extractErrorMessage(message),
    icon: "error",
    confirmButtonText: "Dismiss",
  });

export const showConfirm = async (message, title = "Confirm Action", confirmText = "Confirm", cancelText = "Cancel") => {
  const result = await Swal.fire({
    ...baseOptions,
    title,
    text: typeof message === "string" ? message : extractErrorMessage(message),
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
};

/**
 * Non-blocking toast notification in top-right corner
 */
export const showToast = (message, icon = "success") => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: {
      popup: "scms-swal-toast-popup",
      title: "text-xs font-bold text-foreground",
    },
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon,
    title: typeof message === "string" ? message : extractErrorMessage(message),
  });
};
