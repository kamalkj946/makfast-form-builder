/**
 * MakeFast Form Builder — Storefront Engine
 * Ultra-lightweight vanilla JS (~5KB gzip)
 * Handles: Conditional Logic · Multi-Step · Validation · AJAX Submit · Honeypot
 */

(function () {
  "use strict";

  // ─── Init all forms on page ──────────────────────────────────────────────
  function initForms() {
    document.querySelectorAll("[data-form-id]").forEach(initForm);
  }

  function initForm(wrapper) {
    const formId = wrapper.dataset.formId;
    const configEl = document.getElementById("mf-config-" + formId);
    if (!configEl) return;

    let config;
    try {
      config = JSON.parse(configEl.textContent);
    } catch (e) {
      console.error("[MakeFast] Failed to parse form config:", e);
      return;
    }

    const form = wrapper.querySelector(".mf-form");
    if (!form) return;

    const isMultiStep = config.settings.multiStep && config.steps.length > 1;
    let currentStep = 0;

    // Current values tracker
    const values = {};

    // ─── Condition Engine ─────────────────────────────────────────────────
    function evaluateConditions() {
      const hidden = new Set();
      const required = new Set();

      config.conditions.forEach(function (cond) {
        const sourceEl = form.querySelector('[name="' + cond.sourceFieldId + '"]');
        if (!sourceEl) return;

        let sourceValue = "";
        if (sourceEl.type === "checkbox") {
          const checked = form.querySelectorAll('[name="' + cond.sourceFieldId + '"]:checked');
          sourceValue = Array.from(checked).map(el => el.value).join(",");
        } else {
          sourceValue = sourceEl.value || "";
        }

        const condMet = checkCondition(sourceValue, cond.operator, cond.value);

        if (condMet) {
          if (cond.action === "hide") hidden.add(cond.targetFieldId);
          if (cond.action === "require") required.add(cond.targetFieldId);
        } else if (cond.action === "show") {
          hidden.add(cond.targetFieldId);
        }
      });

      // Apply show/hide to field wrappers
      config.fields.forEach(function (field) {
        const fieldWrapper = form.querySelector('[data-field-id="' + field.id + '"]');
        if (!fieldWrapper) return;

        const shouldHide = hidden.has(field.id);
        fieldWrapper.style.display = shouldHide ? "none" : "";
        fieldWrapper.setAttribute("aria-hidden", shouldHide ? "true" : "false");

        // Toggle required
        const input = fieldWrapper.querySelector("input, select, textarea");
        if (input) {
          if (required.has(field.id)) {
            input.setAttribute("required", "true");
          } else if (!field.required) {
            input.removeAttribute("required");
          }
        }
      });
    }

    function checkCondition(sourceValue, operator, compareValue) {
      const s = sourceValue.toLowerCase();
      const c = (compareValue || "").toLowerCase();
      switch (operator) {
        case "equals": return s === c;
        case "not_equals": return s !== c;
        case "contains": return s.includes(c);
        case "not_contains": return !s.includes(c);
        case "greater_than": return parseFloat(s) > parseFloat(c);
        case "less_than": return parseFloat(s) < parseFloat(c);
        case "is_empty": return s.trim() === "";
        case "is_not_empty": return s.trim() !== "";
        default: return true;
      }
    }

    // ─── Validation ───────────────────────────────────────────────────────
    function validateField(field, input) {
      const value = input ? (input.type === "checkbox" ? (input.checked ? input.value : "") : input.value) : "";
      const wrapper = form.querySelector('[data-field-id="' + field.id + '"]');
      if (!wrapper || wrapper.style.display === "none") return true;

      let errorMsg = null;

      if ((field.required || input.hasAttribute("required")) && value.trim() === "") {
        errorMsg = "This field is required";
      }

      if (!errorMsg && field.validation && value.trim() !== "") {
        for (const rule of field.validation) {
          if (rule.type === "minLength" && value.length < rule.value) errorMsg = rule.message;
          if (rule.type === "maxLength" && value.length > rule.value) errorMsg = rule.message;
          if (rule.type === "min" && parseFloat(value) < rule.value) errorMsg = rule.message;
          if (rule.type === "max" && parseFloat(value) > rule.value) errorMsg = rule.message;
          if (rule.type === "pattern" && !new RegExp(rule.value).test(value)) errorMsg = rule.message;
          if (errorMsg) break;
        }
      }

      showFieldError(wrapper, errorMsg);
      return !errorMsg;
    }

    function showFieldError(wrapper, message) {
      let errEl = wrapper.querySelector(".mf-error");
      if (message) {
        if (!errEl) {
          errEl = document.createElement("p");
          errEl.className = "mf-error";
          wrapper.appendChild(errEl);
        }
        errEl.textContent = message;
        wrapper.classList.add("mf-field-error");
      } else {
        if (errEl) errEl.remove();
        wrapper.classList.remove("mf-field-error");
      }
    }

    function validateCurrentStep() {
      let valid = true;
      const stepFields = isMultiStep
        ? config.fields.filter(f => (f.step ?? 0) === currentStep)
        : config.fields;

      stepFields.forEach(function (field) {
        const input = form.querySelector('[name="' + field.id + '"]');
        if (!validateField(field, input)) valid = false;
      });
      return valid;
    }

    // ─── Multi-Step Navigation ────────────────────────────────────────────
    const totalSteps = config.steps.length;

    function updateStep(newStep) {
      const steps = form.querySelectorAll(".mf-step");
      steps.forEach(function (el, i) {
        el.classList.toggle("mf-step-active", i === newStep);
        el.style.display = i === newStep ? "" : "none";
      });

      currentStep = newStep;

      // Update progress bar
      const progressFill = wrapper.querySelector(".mf-progress-fill");
      if (progressFill) {
        progressFill.style.width = (((currentStep + 1) / totalSteps) * 100) + "%";
      }
      const stepCurrent = wrapper.querySelector(".mf-step-current");
      if (stepCurrent) stepCurrent.textContent = currentStep + 1;

      // Update submit button text
      const submitBtn = form.querySelector(".mf-btn-submit");
      const backBtn = form.querySelector(".mf-btn-back");
      if (submitBtn) {
        submitBtn.textContent = currentStep < totalSteps - 1
          ? "Next →"
          : (config.settings.submitButtonText || "Submit");
      }
      if (backBtn) {
        backBtn.style.display = currentStep > 0 ? "" : "none";
      }
    }

    // Init first step
    if (isMultiStep) updateStep(0);

    // Back button
    const backBtn = form.querySelector(".mf-btn-back");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (currentStep > 0) updateStep(currentStep - 1);
      });
    }

    // ─── Form Submit ──────────────────────────────────────────────────────
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Multi-step: go to next step first
      if (isMultiStep && currentStep < totalSteps - 1) {
        if (!validateCurrentStep()) return;
        updateStep(currentStep + 1);
        return;
      }

      // Final validation
      if (!validateCurrentStep()) return;

      // Check honeypot
      const honeypot = form.querySelector('[name="_hp"]');
      if (honeypot && honeypot.value.trim() !== "") return; // Silently reject bots

      const submitBtn = form.querySelector(".mf-btn-submit");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      // Collect form data
      const formData = new FormData(form);
      const submitUrl = wrapper.dataset.submitUrl || "/apps/makfast/submit";

      try {
        const res = await fetch(submitUrl, {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (result.success) {
          // Show success message
          form.style.display = "none";
          const successEl = wrapper.querySelector(".mf-success");
          if (successEl) {
            successEl.style.display = "";
            successEl.style.animation = "mf-fade-in 0.4s ease";
          }

          // Redirect if configured
          if (config.settings.submitAction === "redirect" && config.settings.redirectUrl) {
            setTimeout(() => {
              window.location.href = config.settings.redirectUrl;
            }, 2000);
          }
        } else {
          alert(result.error || "Submission failed. Please try again.");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = config.settings.submitButtonText || "Submit";
          }
        }
      } catch (err) {
        console.error("[MakeFast] Submit error:", err);
        alert("Network error. Please check your connection and try again.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = config.settings.submitButtonText || "Submit";
        }
      }
    });

    // ─── Live condition evaluation on input change ────────────────────────
    form.addEventListener("change", evaluateConditions);
    form.addEventListener("input", evaluateConditions);

    // Initial evaluation
    evaluateConditions();
  }

  // ─── Run on DOM ready ────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForms);
  } else {
    initForms();
  }
})();
