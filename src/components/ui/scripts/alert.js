// DW - Alert notification component

// Map types to Tailwind classes
const typeClasses = {
  default: '',
  primary: 'alert-primary',
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error'
};

// Map variants to Tailwind classes
const variantClasses = {
  solid: '',
  soft: 'alert-soft',
  outline: 'alert-outline'
};

// Default icons for each type
const defaultIcons = {
  default: 'icon-[tabler--info-circle]',
  primary: 'icon-[tabler--info-circle]',
  info: 'icon-[tabler--info-circle]',
  success: 'icon-[tabler--circle-check]',
  warning: 'icon-[tabler--alert-triangle]',
  error: 'icon-[tabler--alert-circle]'
};

class AlertManager {
  constructor() {
    this.alerts = new Map();
    this.containers = new Map();
    this.timeouts = new Map();
    this.alertOrder = []; // Track order of alerts
    this.alertSources = new Map(); // Track where alerts came from

    // Add ESC key listener with capture phase to intercept events before they reach other components
    document.addEventListener('keydown', (event) => {
      // Only handle ESC key when alerts are visible
      if (event.key === 'Escape' && this.alertOrder.length > 0) {
        // Get the last alert ID (most recently shown)
        const lastAlertId = this.alertOrder[this.alertOrder.length - 1];
        
        // Hide the alert
        this.hide(lastAlertId);
        
        // Prevent the event from propagating to other listeners (like modal close)
        event.stopPropagation();
        event.preventDefault();
      }
    }, { capture: true }); // Use capture phase to intercept events before they reach other handlers
  }

  getContainerKey(position) {
    const vertical = position.vertical || 'top';
    const horizontal = position.horizontal || 'center';
    return `${vertical}-${horizontal}`;
  }

  getContainerClasses(position) {
    const vertical = position.vertical || 'top';
    const horizontal = position.horizontal || 'center';
    
    // Add w-full to allow alerts to size independently
    const classes = ['fixed', 'z-[200]', 'flex', 'flex-col', 'gap-4', 'pointer-events-none', 'p-4', 'w-full'];

    // Vertical positioning
    switch (vertical) {
      case 'top':
        classes.push('top-0');
        break;
      case 'middle':
        classes.push('top-1/2', '-translate-y-1/2');
        break;
      case 'bottom':
        classes.push('bottom-0');
        break;
    }

    // Horizontal positioning
    switch (horizontal) {
      case 'left':
        classes.push('left-0', 'items-start');
        break;
      case 'center':
        classes.push('left-1/2', '-translate-x-1/2', 'items-center');
        break;
      case 'right':
        classes.push('right-0', 'items-end');
        break;
    }

    return classes.join(' ');
  }

  getContainer(position) {
    const containerKey = this.getContainerKey(position);
    
    if (!this.containers.has(containerKey)) {
      const container = document.createElement('div');
      container.className = this.getContainerClasses(position);
      document.body.appendChild(container);
      this.containers.set(containerKey, container);
    }

    return this.containers.get(containerKey);
  }

  getButtonClasses(alertType, alertVariant, buttonOptions) {
    // Start with base button class
    let classes = ['btn'];

    // Get button variant - default to matching alert variant
    const buttonVariant = buttonOptions?.variant || alertVariant;
    // Get button type - default to alert type if not specified
    const buttonType = buttonOptions?.type || alertType;

    // Add variant-specific classes
    if (buttonVariant === 'soft') {
      classes.push('btn-soft');
    } else if (buttonVariant === 'outline') {
      classes.push('btn-outline');
    }

    // Add type-specific classes based on variant
    classes.push(`btn-${buttonType}`);

    if (buttonVariant === 'outline') {
      classes.push(`hover:border-${buttonType}`, `hover:bg-${buttonType}/10`);
    } else if (buttonVariant === 'soft') {
      classes.push(`hover:bg-${buttonType}/25`);
    }

    // Add size class
    const size = buttonOptions?.size || 'sm';
    if (size !== 'md') {
      classes.push(`btn-${size}`);
    }

    // Add custom classes if provided
    if (buttonOptions?.className) {
      classes.push(buttonOptions.className);
    }

    return classes.join(' ');
  }

  createAlertElement(options) {
    const type = options.type || 'default';
    const variant = options.variant || 'solid';
    const alertClass = typeClasses[type];
    const variantClass = variantClasses[variant];
    
    // Create the alert container with unique ID
    const alertContainer = document.createElement('div');
    const alertId = 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    alertContainer.id = alertId;
    // Add w-fit to make alert only as wide as its content
    alertContainer.className = `w-fit pointer-events-auto bg-white shadow-md rounded-md overflow-hidden transition-all duration-300 ease-in-out opacity-0 translate-y-[-1rem] ${options.classes || ''}`;
    alertContainer.setAttribute('role', 'alertdialog');
    alertContainer.setAttribute('aria-modal', 'true');
    alertContainer.setAttribute('aria-labelledby', `${alertId}-title`);

    // Create the alert content
    const alertContent = document.createElement('div');
    // Add min/max width constraints
    alertContent.className = `alert ${variantClass} ${alertClass} flex items-center justify-between gap-4 min-w-[320px] max-w-2xl`;

    // Create left content wrapper for icon and text
    const leftContent = document.createElement('div');
    leftContent.className = 'flex items-center gap-3 flex-grow';

    // Add icon if specified
    if (options.icon) {
      const icon = document.createElement('span');
      const iconClass = typeof options.icon === 'string' ? options.icon : defaultIcons[type];
      icon.className = `${iconClass} size-6 shrink-0`;
      leftContent.appendChild(icon);
    }

    // Create the text wrapper
    const textWrapper = document.createElement('p');
    textWrapper.className = 'flex-grow min-w-0';

    // Add title if specified
    if (options.title) {
      const title = document.createElement('span');
      title.id = `${alertId}-title`;
      title.className = 'text-lg font-semibold';
      title.textContent = options.title + (options.text ? ': ' : '');
      textWrapper.appendChild(title);
    }

    // Add the main text if specified
    if (options.text) {
      const text = document.createTextNode(options.text);
      textWrapper.appendChild(text);
    }

    // Only append text wrapper if we have content
    if (options.title || options.text) {
      leftContent.appendChild(textWrapper);
    }

    // Assemble left content
    leftContent.appendChild(textWrapper);
    alertContent.appendChild(leftContent);

    // Add buttons if specified
    if (options.buttons && options.buttons.length > 0) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex items-center gap-2 shrink-0';
      buttonContainer.setAttribute('role', 'group');
      buttonContainer.setAttribute('aria-label', 'Alert actions');

      // Determine which button should get default focus
      // Priority: solid variant > last button > first button
      let defaultFocusIndex = 0;
      if (options.buttons.length > 1) {
        const solidButtonIndex = options.buttons.findIndex(btn => btn.variant === 'solid');
        if (solidButtonIndex !== -1) {
          defaultFocusIndex = solidButtonIndex;
        } else {
          defaultFocusIndex = options.buttons.length - 1;
        }
      }

      options.buttons.forEach((buttonOptions, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = this.getButtonClasses(type, variant, buttonOptions) + ' shrink-0';
        
        if (buttonOptions.icon) {
          const icon = document.createElement('span');
          icon.className = `${buttonOptions.icon} size-4 -mr-1 -ml-1`;
          button.appendChild(icon);
        }
        
        const buttonText = document.createTextNode(buttonOptions.text || 'OK');
        button.appendChild(buttonText);
        
        button.onclick = () => {
          if (buttonOptions.onClick) {
            buttonOptions.onClick();
          }
          
          if (buttonOptions.dismiss !== false) {
            this.hide(alertId);
          }
        };

        // Set default focus on the determined button
        if (index === defaultFocusIndex) {
          button.setAttribute('data-default-focus', 'true');
        }
        
        buttonContainer.appendChild(button);
      });

      alertContent.appendChild(buttonContainer);
    }

    alertContainer.appendChild(alertContent);
    return alertContainer;
  }

  show(options) {
    const position = options.position || { vertical: 'top', horizontal: 'center' };
    const container = this.getContainer(position);
    const alertElement = this.createAlertElement(options);
    const alertId = alertElement.id;

    // Track the source element that triggered this alert (if we can determine it)
    // This helps us handle ESC key events more intelligently
    this.alertSources.set(alertId, document.activeElement);

    // Add to appropriate container
    container.appendChild(alertElement);
    this.alerts.set(alertId, alertElement);
    this.alertOrder.push(alertId); // Add to order tracking

    // Trigger animation
    requestAnimationFrame(() => {
      alertElement.classList.remove('opacity-0', 'translate-y-[-1rem]');
      
      // Focus management after animation
      const buttons = alertElement.querySelectorAll('button');
      if (buttons.length > 0) {
        // Find the default focus button or use the first button
        const defaultFocusButton = alertElement.querySelector('button[data-default-focus]');
        const buttonToFocus = defaultFocusButton || buttons[0];
        
        // Focus the button
        buttonToFocus.focus();

        // Add keyboard navigation between buttons
        buttons.forEach((button, index) => {
          button.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const nextIndex = e.shiftKey ? 
                (index - 1 + buttons.length) % buttons.length : 
                (index + 1) % buttons.length;
              buttons[nextIndex].focus();
            }
          });
        });
      }
    });

    // Set timeout if duration is provided
    if (typeof options.duration === 'number' && options.autoDismiss !== false) {
      const timeout = window.setTimeout(() => this.hide(alertId), options.duration);
      this.timeouts.set(alertId, timeout);
    }

    return alertId;
  }

  hide(alertId) {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    // Clear any existing timeout
    const timeout = this.timeouts.get(alertId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(alertId);
    }

    // Get the source element that triggered this alert
    const sourceElement = this.alertSources.get(alertId);
    
    // Animate out
    alert.classList.add('opacity-0', 'translate-y-[-1rem]');
    
    // Remove after animation
    setTimeout(() => {
      alert.remove();
      this.alerts.delete(alertId);
      
      // Clean up source tracking
      this.alertSources.delete(alertId);
      
      // Remove from order tracking
      const index = this.alertOrder.indexOf(alertId);
      if (index > -1) {
        this.alertOrder.splice(index, 1);
      }
      
      // Return focus to the source element if it still exists in the DOM
      if (sourceElement && document.body.contains(sourceElement)) {
        sourceElement.focus();
      }
    }, 300);
  }

  hideAll() {
    // Close alerts in reverse order
    [...this.alertOrder].reverse().forEach(alertId => this.hide(alertId));
  }
}

// Create and export the singleton instance
const alertManager = new AlertManager();

// Initialize global methods
window.showAlert = (options) => {
  return alertManager.show(options);
};

window.hideAlert = (alertId) => {
  alertManager.hide(alertId);
};

window.hideAllAlerts = () => {
  alertManager.hideAll();
}; 