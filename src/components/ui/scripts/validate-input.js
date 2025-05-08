// DW - Input validation utilities

import validator from "validator";

// Initialize global validation errors array if it doesn't exist
if (typeof window.validationErrors === "undefined") {
  window.validationErrors = [];
}

// Enable debug logging
window.DEBUG_VALIDATION = true;

function debugLog(...args) {
  if (window.DEBUG_VALIDATION) {
    console.log("[Validation]", ...args);
  }
}

// Safe pattern definitions
const SAFE_PATTERNS = {
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  alphanumericWithHyphens: /^[a-zA-Z0-9-]+$/,
  alphanumericWithUnderscores: /^[a-zA-Z0-9_]+$/,
  alphaWithSpaces: /^[a-zA-Z\s]+$/,
  alphaWithHyphens: /^[a-zA-Z-]+$/,
  alphaWithUnderscores: /^[a-zA-Z_]+$/,
  simpleName: /^[a-zA-Z\s'-]+$/,
  simpleUsername: /^[a-zA-Z0-9_-]+$/,
  simpleSlug: /^[a-z0-9-]+$/,
  simpleHex: /^[0-9a-fA-F]+$/,
  simplePhone: /^[\d\s+()-]+$/,
  simpleAddress: /^[a-zA-Z0-9\s.,'-]+$/,
};

// Validation rule definitions
const VALIDATION_RULES = {
  // Validator.js rules
  number: {
    validator: (value, options) => !isNaN(Number(value)),
    defaultMessage: "Please enter a valid number",
  },
  email: {
    validator: (value, options) => validator.isEmail(value, options),
    defaultMessage: "Please enter a valid email address",
  },
  url: {
    validator: (value, options) => validator.isURL(value, options),
    defaultMessage: "Please enter a valid URL",
  },
  alphanumeric: {
    validator: (value, locale, options) =>
      validator.isAlphanumeric(value, locale, options),
    defaultMessage: "Please enter only letters and numbers",
  },
  alpha: {
    validator: (value, locale, options) =>
      validator.isAlpha(value, locale, options),
    defaultMessage: "Please enter only letters",
  },
  ascii: {
    validator: (value) => validator.isAscii(value),
    defaultMessage: "Please enter only ASCII characters",
  },
  base64: {
    validator: (value, options) => validator.isBase64(value, options),
    defaultMessage: "Please enter a valid Base64 string",
  },
  creditCard: {
    validator: (value, options) => validator.isCreditCard(value, options),
    defaultMessage: "Please enter a valid credit card number",
  },
  currency: {
    validator: (value, options) => validator.isCurrency(value, options),
    defaultMessage: "Please enter a valid currency amount",
  },
  date: {
    validator: (value, options) => validator.isDate(value, options),
    defaultMessage: "Please enter a valid date",
  },
  decimal: {
    validator: (value, options) => validator.isDecimal(value, options),
    defaultMessage: "Please enter a valid decimal number",
  },
  float: {
    validator: (value, options) => validator.isFloat(value, options),
    defaultMessage: "Please enter a valid floating point number",
  },
  hexColor: {
    validator: (value) => validator.isHexColor(value),
    defaultMessage: "Please enter a valid hex color code",
  },
  ip: {
    validator: (value, version) => validator.isIP(value, version),
    defaultMessage: "Please enter a valid IP address",
  },
  json: {
    validator: (value) => validator.isJSON(value),
    defaultMessage: "Please enter valid JSON",
  },
  lowercase: {
    validator: (value) => validator.isLowercase(value),
    defaultMessage: "Please enter only lowercase letters",
  },
  uppercase: {
    validator: (value) => validator.isUppercase(value),
    defaultMessage: "Please enter only uppercase letters",
  },
  mobilePhone: {
    validator: (value, locale, options) =>
      validator.isMobilePhone(value, locale, options),
    defaultMessage: "Please enter a valid mobile phone number",
  },
  mongoId: {
    validator: (value) => validator.isMongoId(value),
    defaultMessage: "Please enter a valid MongoDB ID",
  },
  postalCode: {
    validator: (value, locale) => validator.isPostalCode(value, locale),
    defaultMessage: "Please enter a valid postal code",
  },
  uuid: {
    validator: (value, version) => validator.isUUID(value, version),
    defaultMessage: "Please enter a valid UUID",
  },
  strongPassword: {
    validator: (value, options) => validator.isStrongPassword(value, options),
    defaultMessage: "Please enter a stronger password",
  },
  time: {
    validator: (value, options) => validator.isTime(value, options),
    defaultMessage: "Please enter a valid time",
  },
  taxID: {
    validator: (value, locale) => validator.isTaxID(value, locale),
    defaultMessage: "Please enter a valid tax ID",
  },
  vat: {
    validator: (value, countryCode) => validator.isVAT(value, countryCode),
    defaultMessage: "Please enter a valid VAT number",
  },

  // Custom pattern rules
  alphanumericWithSpaces: {
    validator: (value) => SAFE_PATTERNS.alphanumericWithSpaces.test(value),
    defaultMessage: "Please enter only letters, numbers, and spaces",
  },
  alphanumericWithHyphens: {
    validator: (value) => SAFE_PATTERNS.alphanumericWithHyphens.test(value),
    defaultMessage: "Please enter only letters, numbers, and hyphens",
  },
  alphanumericWithUnderscores: {
    validator: (value) => SAFE_PATTERNS.alphanumericWithUnderscores.test(value),
    defaultMessage: "Please enter only letters, numbers, and underscores",
  },
  alphaWithSpaces: {
    validator: (value) => SAFE_PATTERNS.alphaWithSpaces.test(value),
    defaultMessage: "Please enter only letters and spaces",
  },
  alphaWithHyphens: {
    validator: (value) => SAFE_PATTERNS.alphaWithHyphens.test(value),
    defaultMessage: "Please enter only letters and hyphens",
  },
  alphaWithUnderscores: {
    validator: (value) => SAFE_PATTERNS.alphaWithUnderscores.test(value),
    defaultMessage: "Please enter only letters and underscores",
  },
  simpleName: {
    validator: (value) => SAFE_PATTERNS.simpleName.test(value),
    defaultMessage: "Please enter a valid name",
  },
  simpleUsername: {
    validator: (value) => SAFE_PATTERNS.simpleUsername.test(value),
    defaultMessage: "Please enter a valid username",
  },
  simpleSlug: {
    validator: (value) => SAFE_PATTERNS.simpleSlug.test(value),
    defaultMessage: "Please enter a valid slug",
  },
  simpleHex: {
    validator: (value) => SAFE_PATTERNS.simpleHex.test(value),
    defaultMessage: "Please enter a valid hex value",
  },
  simplePhone: {
    validator: (value) => SAFE_PATTERNS.simplePhone.test(value),
    defaultMessage: "Please enter a valid phone number",
  },
  simpleAddress: {
    validator: (value) => SAFE_PATTERNS.simpleAddress.test(value),
    defaultMessage: "Please enter a valid address",
  },
};

function validateRule(value, rule) {
  // Handle string rules (simple syntax)
  if (typeof rule === "string") {
    const ruleDef = VALIDATION_RULES[rule];
    if (!ruleDef) return { isValid: true, message: "" };
    const isValid = ruleDef.validator(value);
    return {
      isValid,
      message: isValid ? "" : ruleDef.defaultMessage,
    };
  }

  // Handle object rules (detailed syntax)
  const ruleDef = VALIDATION_RULES[rule.type];
  if (!ruleDef) return { isValid: true, message: "" };

  let isValid;
  let message;
  switch (rule.type) {
    case "number":
      const num = Number(value);
      if (isNaN(num)) {
        isValid = false;
        message = rule.errorMessage || "Please enter a valid number";
      } else if (num < rule.min) {
        isValid = false;
        message = rule.errorMessage || `Value must be at least ${rule.min}`;
      } else if (num > rule.max) {
        isValid = false;
        message = rule.errorMessage || `Value must be at most ${rule.max}`;
      } else {
        isValid = true;
      }
      break;
    case "length":
      isValid =
        (rule.min === undefined || value.length >= rule.min) &&
        (rule.max === undefined || value.length <= rule.max);
      break;
    case "pattern":
      isValid =
        rule.pattern && SAFE_PATTERNS[rule.pattern]
          ? SAFE_PATTERNS[rule.pattern].test(value)
          : true;
      break;
    default:
      isValid = ruleDef.validator(
        value,
        rule.options,
        rule.locale,
        rule.version,
        rule.countryCode
      );
  }

  return {
    isValid,
    message: isValid ? "" : rule.errorMessage || ruleDef.defaultMessage,
  };
}

// Utility functions for managing validation errors
function addValidationError(inputId) {
  if (!inputId) {
    // debugLog('Cannot add validation error: inputId is missing');
    return;
  }

  if (!Array.isArray(window.validationErrors)) {
    window.validationErrors = [];
  }

  if (!window.validationErrors.includes(inputId)) {
    window.validationErrors.push(inputId);
    // debugLog(`Added validation error for input: ${inputId}`);
  }
}

function removeValidationError(inputId) {
  if (!inputId) {
    // debugLog('Cannot remove validation error: inputId is missing');
    return;
  }

  if (!Array.isArray(window.validationErrors)) {
    window.validationErrors = [];
    return;
  }

  const index = window.validationErrors.indexOf(inputId);
  if (index > -1) {
    window.validationErrors.splice(index, 1);
    // debugLog(`Removed validation error for input: ${inputId}`);
  }
}

function hasValidationError(inputId) {
  if (!inputId || !Array.isArray(window.validationErrors)) {
    return false;
  }
  return window.validationErrors.includes(inputId);
}

async function validateInput(input) {
  const value = input.value;
  // debugLog('Validating input:', input.name, 'with value:', value);
  const validationConfig = JSON.parse(input.dataset.validationConfig || "{}");
  const feedbackElement = input.parentElement?.querySelector(
    ".validation-feedback"
  );

  // Clear previous feedback
  feedbackElement.textContent = "";
  feedbackElement.classList.add("hidden");
  input.parentElement.classList.remove(
    "validation-error",
    "validation-success"
  );

  // Skip validation if the field is empty and not required
  if (!value && !input.required) {
    updateValidationUI(input, true, "", "", "");
    return true;
  }

  // Handle required validation
  if (input.required && !value) {
    updateValidationUI(input, false, "This field is required", "", "");
    return false;
  }

  // Get validation rules from both types and rules arrays
  const validationTypes = JSON.parse(input.dataset.validationTypes || "[]");
  const validationRules = JSON.parse(input.dataset.validationRules || "[]");

  // Combine both types of rules
  const allRules = [
    ...validationTypes.map((type) => ({ type })),
    ...validationRules,
  ];

  // Validate each rule
  for (const rule of allRules) {
    const result = validateRule(value, rule);
    if (!result.isValid) {
      updateValidationUI(input, false, result.message, "", "");
      return false;
    }
  }

  // Check uniqueness if configured
  if (validationConfig.unique) {
    try {
      const response = await fetch("/api/apex/validate-unique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: validationConfig.unique.collection,
          field: validationConfig.unique.field,
          value: value,
          exempt: validationConfig.unique.exempt,
        }),
      });

      const { isUnique } = await response.json();
      if (!isUnique) {
        updateValidationUI(
          input,
          false,
          validationConfig.unique.errorMessage || "This value must be unique",
          "",
          ""
        );
        return false;
      }
    } catch (error) {
      console.error("Uniqueness check failed:", error);
    }
  }

  // Handle success state
  if (validationConfig.success) {
    const successMessage =
      typeof validationConfig.success === "object"
        ? validationConfig.success.message
        : null;
    updateValidationUI(input, true, "", "", successMessage);
  } else {
    updateValidationUI(input, true, "", "", "");
  }

  return true;
}

export function updateValidationUI(
  input,
  isValid,
  message,
  errorMessage,
  successMessage
) {
  if (!input.id) {
    console.error("Input element missing id:", input);
    return;
  }

  const validationConfig = JSON.parse(input.dataset.validationConfig || "{}");
  const successConfig = input.dataset.success
    ? typeof input.dataset.success === "string"
      ? JSON.parse(input.dataset.success)
      : input.dataset.success === "true"
    : false;
  const feedbackElement = input.parentElement?.querySelector(
    ".validation-feedback"
  );

  if (!feedbackElement) {
    console.error(
      "Could not find validation feedback element for input:",
      input.id
    );
    return;
  }

  // Update the validationErrors array
  if (isValid) {
    removeValidationError(input.id);
  } else {
    addValidationError(input.id);
  }

  // Update the UI
  const parentElement = input.parentElement;
  if (!parentElement) {
    console.error("Input element missing parent:", input);
    return;
  }

  if (isValid) {
    parentElement.classList.remove("validation-error");
    if (input.value.trim() && successConfig) {
      parentElement.classList.add("validation-success");
      if (typeof successConfig === "object" && successConfig.message) {
        feedbackElement.textContent = successConfig.message;
        feedbackElement.classList.remove("hidden");
      } else {
        feedbackElement.textContent = "";
        feedbackElement.classList.add("hidden");
      }
    } else {
      parentElement.classList.remove("validation-success");
      feedbackElement.classList.add("hidden");
    }
  } else {
    parentElement.classList.add("validation-error");
    parentElement.classList.remove("validation-success");
    feedbackElement.textContent = message;
    feedbackElement.classList.remove("hidden");
  }
}

export function validateOnBlur(event) {
  const input = event.target;
  validateInput(input);
}
