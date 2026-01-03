// DW - Alert notification component using AlertDialog (base-ui)

import { alertDialogManager, type AlertOptions } from "@/components/ui/shadcn/AlertDialogManager";

// Extend Window interface for global alert methods
declare global {
  interface Window {
    showAlert: (options: AlertOptions) => string;
    hideAlert: (alertId: string) => void;
    hideAllAlerts: () => void;
  }
}

class AlertManager {
  show(options: AlertOptions) {
    // Pass options directly to the AlertDialog manager
    // The manager handles all the complexity (overlay, positioning, buttons, etc.)
    return alertDialogManager.show(options);
  }

  hide(alertId: string) {
    alertDialogManager.hide(alertId);
  }

  hideAll() {
    alertDialogManager.hideAll();
  }
}

// Create and export the singleton instance
const alertManager = new AlertManager();

// Initialize global methods
window.showAlert = (options: AlertOptions) => {
  return alertManager.show(options);
};

window.hideAlert = (alertId: string) => {
  alertManager.hide(alertId);
};

window.hideAllAlerts = () => {
  alertManager.hideAll();
};

