import * as React from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogPortal,
} from "@/components/ui/shadcn/alert-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Button, buttonVariants } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/dw/helpers";

export interface AlertOptions {
  type?: "default" | "primary" | "info" | "success" | "warning" | "error";
  variant?: "soft" | "solid";
  title?: string;
  text?: string;
  position?: {
    vertical?: "top" | "middle" | "middle-third" | "bottom";
    horizontal?: "left" | "center" | "right";
  };
  overlay?: boolean;
  duration?: number;
  autoDismiss?: boolean;
  animate?: boolean; // Enable fade/zoom animations (default: false for instant appearance)
  buttons?: Array<{
    text: string;
    variant?: "solid" | "outline" | "ghost" | "default" | "destructive" | "secondary" | "link";
    type?: "default" | "primary" | "info" | "success" | "warning" | "error";
    size?: "default" | "sm" | "lg" | "icon";
    onClick?: () => void | Promise<void>;
  }>;
  icon?: boolean;
  buttonLayout?: {
    newLine?: boolean;
    flexClass?: string;
  };
  textAlign?: "left" | "center" | "right";
  onClose?: () => void;
}

interface AlertDialogInstanceProps {
  options: AlertOptions;
  onClose: () => void;
}

function AlertDialogInstance({ options, onClose }: AlertDialogInstanceProps) {
  const [open, setOpen] = React.useState(true);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Handle auto-dismiss - EXACTLY match original API behavior
  // Only sets timeout if duration is a number AND autoDismiss !== false
  React.useEffect(() => {
    if (typeof options.duration === "number" && options.autoDismiss !== false) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, options.duration);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [options.duration, options.autoDismiss]);

  function handleClose() {
    setOpen(false);
    // Only delay if animations are enabled, otherwise instant
    if (options.animate) {
      setTimeout(() => {
        onClose();
      }, 200);
    } else {
      onClose();
    }
  }

  // Determine button variants based on type
  function getButtonVariant(
    buttonType?: string,
    buttonVariant?: string
  ): "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" {
    if (buttonVariant) {
      if (buttonVariant === "solid") {
        // Map type to appropriate variant
        if (buttonType === "error" || buttonType === "warning") {
          return "destructive";
        }
        return "default";
      }
      if (buttonVariant === "outline") return "outline";
      if (buttonVariant === "ghost") return "ghost";
      if (buttonVariant === "secondary") return "secondary";
      if (buttonVariant === "link") return "link";
    }
    // Default based on type
    if (buttonType === "error" || buttonType === "warning") {
      return "destructive";
    }
    return "default";
  }

  // Get position classes - override default center positioning
  function getPositionClasses() {
    const { position } = options;
    if (!position) return "";

    const vertical = position.vertical || "middle";
    const horizontal = position.horizontal || "center";

    let classes = "";

    // Override default center positioning
    classes += "!left-auto !top-auto !translate-x-0 !translate-y-0 ";

    // Vertical positioning
    if (vertical === "top") {
      classes += "!top-[1rem] ";
    } else if (vertical === "middle") {
      classes += "!top-[50%] !translate-y-[-50%] ";
    } else if (vertical === "middle-third") {
      classes += "!top-[33.333%] !translate-y-[-33.333%] ";
    } else if (vertical === "bottom") {
      classes += "!bottom-[1rem] !top-auto ";
    }

    // Horizontal positioning
    if (horizontal === "left") {
      classes += "!left-[1rem] !translate-x-0 ";
    } else if (horizontal === "center") {
      classes += "!left-[50%] !translate-x-[-50%] ";
    } else if (horizontal === "right") {
      classes += "!right-[1rem] !left-auto !translate-x-0 ";
    }

    return classes;
  }

  // Find primary and cancel buttons
  const primaryButton = options.buttons?.find(
    (btn) => btn.variant === "solid"
  ) || options.buttons?.[0];
  const cancelButton = options.buttons?.find(
    (btn) => btn.text === "No" || btn.text === "Cancel"
  );

  // Filter out cancel button from other buttons
  const otherButtons = options.buttons?.filter(
    (btn) => btn !== primaryButton && btn !== cancelButton
  ) || [];

  // If no buttons and no auto-dismiss, add a default "OK" button
  const hasButtons = primaryButton || cancelButton || otherButtons.length > 0;
  const hasAutoDismiss = typeof options.duration === "number" && options.autoDismiss !== false;
  const needsDefaultButton = !hasButtons && !hasAutoDismiss;
  
  const defaultButton = needsDefaultButton ? {
    text: "OK",
    variant: "solid" as const,
    type: options.type || "default",
  } : null;

  const buttonLayout = options.buttonLayout || {};
  const footerClasses = cn(
    "flex",
    buttonLayout.newLine ? "flex-col" : "flex-row",
    buttonLayout.flexClass || "gap-2",
    "sm:justify-end"
  );

  const textAlign = options.textAlign || "left";
  const textAlignClass =
    textAlign === "center"
      ? "text-center"
      : textAlign === "right"
      ? "text-right"
      : "text-left";

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <AlertDialogPortal>
        {/* Note: Overlay is managed separately by AlertDialogManager for custom styling */}
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed z-[9999] grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
            // Only apply animations if explicitly requested
            options.animate
              ? "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              : "",
            getPositionClasses(),
            textAlign === "center" && "[&>*]:text-center"
          )}
        >
        <AlertDialogHeader className={textAlignClass}>
          {options.title && (
            <AlertDialogTitle className={textAlignClass}>
              {options.title}
            </AlertDialogTitle>
          )}
          {options.text && (
            <AlertDialogDescription className={textAlignClass}>
              {options.text}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {(primaryButton || cancelButton || otherButtons.length > 0 || defaultButton) && (
          <AlertDialogFooter className={footerClasses}>
            {cancelButton && (
              <AlertDialogCancel
                onClick={async () => {
                  if (cancelButton.onClick) {
                    await cancelButton.onClick();
                  }
                  handleClose();
                }}
                className={cn(
                  buttonVariants({
                    variant: getButtonVariant(cancelButton.type, cancelButton.variant),
                    size: cancelButton.size || "default",
                  })
                )}
              >
                {cancelButton.text}
              </AlertDialogCancel>
            )}
            {otherButtons.map((btn, idx) => (
              <Button
                key={idx}
                variant={getButtonVariant(btn.type, btn.variant)}
                size={btn.size || "default"}
                onClick={async () => {
                  if (btn.onClick) {
                    await btn.onClick();
                  }
                  handleClose();
                }}
              >
                {btn.text}
              </Button>
            ))}
            {primaryButton && (
              <AlertDialogAction
                onClick={async () => {
                  if (primaryButton.onClick) {
                    await primaryButton.onClick();
                  }
                  handleClose();
                }}
                className={cn(
                  buttonVariants({
                    variant: getButtonVariant(primaryButton.type, primaryButton.variant),
                    size: primaryButton.size || "default",
                  })
                )}
              >
                {primaryButton.text}
              </AlertDialogAction>
            )}
            {defaultButton && (
              <AlertDialogAction
                onClick={handleClose}
                className={cn(
                  buttonVariants({
                    variant: getButtonVariant(defaultButton.type, defaultButton.variant),
                    size: "default",
                  })
                )}
              >
                {defaultButton.text}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        )}
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}

// Manager class to handle multiple alert dialogs
class AlertDialogManagerClass {
  private dialogs: Map<string, { root: Root; container: HTMLElement; animate: boolean }> = new Map();
  private dialogOrder: string[] = [];
  private overlayElement: HTMLElement | null = null;

  show(options: AlertOptions): string {
    const dialogId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create container
    const container = document.createElement("div");
    container.id = dialogId;
    document.body.appendChild(container);

    // Create overlay if requested
    if (options.overlay) {
      this.createOverlay(options.animate === true);
    }

    // Create React root and render
    const root = createRoot(container);
    root.render(
      <AlertDialogInstance
        options={options}
        onClose={() => {
          this.hide(dialogId);
        }}
      />
    );

    this.dialogs.set(dialogId, { root, container, animate: options.animate === true });
    this.dialogOrder.push(dialogId);

    // Setup ESC key handler if this is the first dialog
    if (this.dialogOrder.length === 1) {
      this.setupEscHandler();
    }

    return dialogId;
  }

  hide(dialogId: string) {
    const dialog = this.dialogs.get(dialogId);
    if (!dialog) return;

    // Unmount React component
    dialog.root.unmount();
    // Remove container
    if (dialog.container.parentNode) {
      dialog.container.parentNode.removeChild(dialog.container);
    }

    this.dialogs.delete(dialogId);

    // Remove from order
    const index = this.dialogOrder.indexOf(dialogId);
    if (index > -1) {
      this.dialogOrder.splice(index, 1);
    }

    // Remove overlay if no more dialogs
    if (this.dialogOrder.length === 0) {
      this.removeOverlay(dialog.animate);
      this.removeEscHandler();
    }
  }

  hideAll() {
    const dialogIds = Array.from(this.dialogs.keys());
    dialogIds.forEach((id) => this.hide(id));
  }

  private createOverlay(animate: boolean = false) {
    if (this.overlayElement) return; // Already exists

    this.overlayElement = document.createElement("div");
    this.overlayElement.className =
      "fixed inset-0 z-[9998] bg-black/40 backdrop-blur-xs";
    
    // Only add transition if animations are enabled
    const transitionStyle = animate ? "transition: opacity 0.1s ease-in-out;" : "";
    
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.4);
      z-index: 9998;
      pointer-events: auto;
      opacity: ${animate ? "0" : "1"};
      ${transitionStyle}
    `;
    document.body.appendChild(this.overlayElement);

    // Animate in only if animations are enabled
    if (animate) {
      requestAnimationFrame(() => {
        if (this.overlayElement) {
          this.overlayElement.style.opacity = "1";
        }
      });
    }

    // Click overlay to close most recent dialog
    this.overlayElement.onclick = () => {
      if (this.dialogOrder.length > 0) {
        const lastDialogId = this.dialogOrder[this.dialogOrder.length - 1];
        this.hide(lastDialogId);
      }
    };
  }

  private removeOverlay(animate: boolean = false) {
    if (this.overlayElement) {
      if (animate) {
        this.overlayElement.style.opacity = "0";
        setTimeout(() => {
          if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
          }
          this.overlayElement = null;
        }, 100);
      } else {
        // Instant removal if no animations
        if (this.overlayElement.parentNode) {
          this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
        this.overlayElement = null;
      }
    }
  }

  private escHandler: ((e: KeyboardEvent) => void) | null = null;

  private setupEscHandler() {
    this.escHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && this.dialogOrder.length > 0) {
        const lastDialogId = this.dialogOrder[this.dialogOrder.length - 1];
        this.hide(lastDialogId);
        event.stopPropagation();
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", this.escHandler, { capture: true });
  }

  private removeEscHandler() {
    if (this.escHandler) {
      document.removeEventListener("keydown", this.escHandler, { capture: true });
      this.escHandler = null;
    }
  }
}

// Export singleton instance
export const alertDialogManager = new AlertDialogManagerClass();

