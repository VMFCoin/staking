import { toast } from "sonner";

/**
 * Toast notification service for transaction feedback
 */

export interface TransactionToastOptions {
  txHash?: string;
}

/**
 * Show pending transaction toast
 */
export const toastPending = (message: string, options?: TransactionToastOptions) => {
  const id = toast.loading(message);
  return id;
};

/**
 * Show success transaction toast with BaseScan link
 */
export const toastSuccess = (
  message: string,
  txHash?: string,
  options?: { autoClose?: number }
) => {
  const content = (
    <div className="flex flex-col gap-2">
      <p>{message}</p>
      {txHash && (
        <a
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 text-sm underline"
        >
          View on BaseScan →
        </a>
      )}
    </div>
  );

  return toast.success(content, {
    duration: options?.autoClose ?? 5000,
  });
};

/**
 * Show error transaction toast
 */
export const toastError = (message: string, error?: string, options?: { autoClose?: number }) => {
  let errorContent = message;

  if (error) {
    // Extract the error message if it's a revert reason
    let errorMessage = error;
    if (error.includes("revert")) {
      const match = error.match(/revert\s+(.+?)(?:\n|$)/);
      if (match) {
        errorMessage = match[1].trim();
      }
    }
    errorContent = `${message}: ${errorMessage}`;
  }

  return toast.error(errorContent, {
    duration: options?.autoClose ?? 5000,
  });
};

/**
 * Update a pending toast to success
 */
export const toastUpdateSuccess = (
  id: string | number,
  message: string,
  txHash?: string
) => {
  const content = (
    <div className="flex flex-col gap-2">
      <p>{message}</p>
      {txHash && (
        <a
          href={`https://basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 text-sm underline"
        >
          View on BaseScan →
        </a>
      )}
    </div>
  );

  toast.success(content, { id, duration: 5000 });
};

/**
 * Update a pending toast to error
 */
export const toastUpdateError = (id: string | number, message: string, error?: string) => {
  let errorContent = message;

  if (error) {
    let errorMessage = error;
    if (error.includes("revert")) {
      const match = error.match(/revert\s+(.+?)(?:\n|$)/);
      if (match) {
        errorMessage = match[1].trim();
      }
    }
    errorContent = `${message}: ${errorMessage}`;
  }

  toast.error(errorContent, { id, duration: 5000 });
};

/**
 * Dismiss all toasts
 */
export const toastDismissAll = () => {
  toast.dismiss();
};
