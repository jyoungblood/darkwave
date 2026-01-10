// DW - Form validation utilities

import { validateInput } from "./validate-input.js";

// Initialize global required errors array if it doesn't exist
if (typeof window.requiredErrors === "undefined") {
  window.requiredErrors = [];
}

// Initialize global validation errors array if it doesn't exist
if (typeof window.validationErrors === "undefined") {
  window.validationErrors = [];
}

// Utility functions for managing required errors
function addRequiredError(inputId) {
  if (!inputId) {
    console.warn("Cannot add required error: inputId is missing");
    return;
  }

  if (!Array.isArray(window.requiredErrors)) {
    window.requiredErrors = [];
  }

  if (!window.requiredErrors.includes(inputId)) {
    window.requiredErrors.push(inputId);
    // console.log(`Added required error for input: ${inputId}`);
  }
}

function removeRequiredError(inputId) {
  if (!inputId) {
    console.warn("Cannot remove required error: inputId is missing");
    return;
  }

  if (!Array.isArray(window.requiredErrors)) {
    window.requiredErrors = [];
    return;
  }

  const index = window.requiredErrors.indexOf(inputId);
  if (index > -1) {
    window.requiredErrors.splice(index, 1);
    // console.log(`Removed required error for input: ${inputId}`);
  }
}

function hasRequiredError(inputId) {
  if (!inputId || !Array.isArray(window.requiredErrors)) {
    return false;
  }
  return window.requiredErrors.includes(inputId);
}

// Helper function to check if a field is empty
function isFieldEmpty(field) {
  const type = field.type?.toLowerCase();
  const tagName = field.tagName.toLowerCase();

  // Handle radio buttons
  if (type === "radio") {
    const radioGroup = document.querySelectorAll(
      `input[type="radio"][name="${field.name}"]`
    );
    return !Array.from(radioGroup).some((radio) => radio.checked);
  }

  // Handle checkboxes
  if (type === "checkbox") {
    return !field.checked;
  }

  // Handle file inputs
  if (type === "file") {
    return !field.files || field.files.length === 0;
  }

  // Handle select elements
  if (tagName === "select") {
    return (
      field.value === "" ||
      field.options[field.selectedIndex].hasAttribute("disabled")
    );
  }

  // Handle all other input types and textareas
  return !field.value.trim();
}

// Main form validation function
async function validateForm(formElement) {
  // Reset validation arrays
  window.requiredErrors = [];
  window.validationErrors = [];

  // Get all form fields at submission time to catch dynamically added fields
  const allFormFields = formElement.querySelectorAll(
    "input, select, textarea, radio, checkbox"
  );

  // First pass - check for required fields that are empty
  allFormFields.forEach((field) => {
    if (field.id && field.required && isFieldEmpty(field)) {
      const parentElement = field.parentElement;
      if (parentElement) {
        parentElement.classList.add("validation-error");
      }
      addRequiredError(field.id);
    }
  });

  // Second pass - validate all fields with validation configuration
  // This includes uniqueness checks and other custom validations
  const validationPromises = Array.from(allFormFields).map(async (field) => {
    // Only validate fields that have validation configured
    if (field.id && field.dataset.validationConfig) {
      const isValid = await validateInput(field);
      return { field, isValid };
    }
    return { field, isValid: true };
  });

  // Wait for all validations to complete
  await Promise.all(validationPromises);

  // If there are any errors, handle them
  if (window.requiredErrors.length > 0 || window.validationErrors.length > 0) {
    // Find the first error field based on DOM position
    const firstErrorField = Array.from(
      document.querySelectorAll("input, select, textarea")
    )
      .filter((field) => {
        const id = field.id;
        return hasRequiredError(id) || window.validationErrors.includes(id);
      })
      .sort((a, b) => {
        // Compare the position of elements in the DOM
        const position = a.compareDocumentPosition(b);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      })[0];

    if (firstErrorField) {
      firstErrorField.scrollIntoView({ block: "center" });
      firstErrorField.focus();
    }

    let title = "Error Saving Data";
    if (window.requiredErrors.length > 0) {
      title = "Error";
    }

    // Show error alert
    window.showAlert({
      type: "error",
      variant: "soft",
      title: title,
      duration: 3000,
      text:
        window.requiredErrors.length > 0
          ? "Required fields are missing."
          : "Please check the form for errors and try again.",
      // textAlign: "center",
      // icon: true,
      position: {
        vertical: "middle-third",
        horizontal: "center",
      },
      overlay: true,
      buttonLayout: {
        newLine: true,
      },
      buttons: [
        {
          type: "error",
          text: "OK",
          variant: "solid",
        },
      ],
    });

    // Set up change event listeners for required fields
    allFormFields.forEach((field) => {
      if (field.required) {
        // Remove old change event listener if it exists
        const oldHandler = field.getAttribute("data-blur-handler");
        if (oldHandler) {
          field.removeEventListener("change", window[oldHandler]);
        }

        // Create new handler function
        const handler = () => {
          const parentElement = field.parentElement;
          if (parentElement) {
            if (!isFieldEmpty(field)) {
              parentElement.classList.remove("validation-error");
              parentElement.classList.add("validation-success");
              removeRequiredError(field.id);
            } else {
              parentElement.classList.add("validation-error");
              parentElement.classList.remove("validation-success");
              addRequiredError(field.id);
            }
          }
        };

        // Store handler reference and add new event listener
        const handlerName = `blurHandler_${field.id}_${Date.now()}`;
        window[handlerName] = handler;
        field.setAttribute("data-blur-handler", handlerName);
        field.addEventListener("change", handler);
      }
    });

    return false;
  }

  return true;
}

// Make functions available globally
window.addRequiredError = addRequiredError;
window.removeRequiredError = removeRequiredError;
window.hasRequiredError = hasRequiredError;
window.isFieldEmpty = isFieldEmpty;
window.validateForm = validateForm;

// Export the functions
export {
  addRequiredError,
  removeRequiredError,
  hasRequiredError,
  isFieldEmpty,
  validateForm,
};
