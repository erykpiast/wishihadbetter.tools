function showError(
  message: string,
  form: HTMLFormElement,
  input: HTMLInputElement
) {
  // Remove any existing error message
  const existingError = form.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  // Create and insert error message
  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;
  form.appendChild(errorElement);

  // Add error state to input
  input.setAttribute("aria-invalid", "true");

  // Remove error after 5 seconds or when user starts typing
  const removeError = () => {
    errorElement.classList.add("expired");
    input.removeAttribute("aria-invalid");
    errorElement.addEventListener(
      "animationend",
      () => {
        errorElement.remove();
      },
      { once: true }
    );
  };

  // Set timeout for 5 seconds
  const timeoutId = setTimeout(removeError, 5000);

  // Remove error on input
  input.addEventListener("input", function inputHandler() {
    clearTimeout(timeoutId);
    removeError();
    input.removeEventListener("input", inputHandler);
  });
}

export function handleWishForm({
  onBeforeSubmit,
  onSubmit,
  onInputInactivity,
}: {
  onBeforeSubmit: (formData: FormData) => void;
  onInputInactivity: () => void;
  onSubmit: (form: HTMLFormElement, wish: string, tool: string) => void;
}) {
  const form = document.getElementById("wish-form") as HTMLFormElement | null;
  const input = document.getElementById(
    "wish-input"
  ) as HTMLInputElement | null;

  if (!form || !input) {
    throw new Error("Required elements not found");
  }

  const submitButton = form.querySelector(
    "button[type=submit]"
  ) as HTMLButtonElement | null;

  if (!submitButton) {
    throw new Error("Submit button not found");
  }

  let inactivityTimeout: ReturnType<typeof setTimeout>;

  function setInactivityTimeout() {
    inactivityTimeout = setTimeout(() => {
      onInputInactivity();
      setTimeout(() => {
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        setInactivityTimeout();
      }, 100);
    }, 5000);
  }

  setInactivityTimeout();

  input.addEventListener("input", () => {
    clearTimeout(inactivityTimeout);
    setInactivityTimeout();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      return;
    }

    clearTimeout(inactivityTimeout);

    const formData = new FormData(form);

    onBeforeSubmit(formData);

    input.disabled = true;
    submitButton.setAttribute("disabled", "disabled");
    submitButton.classList.add("submitting");

    try {
      const response = await fetch("/api/wish", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        switch (response.status) {
          case 400:
            try {
              const data = await response.json();
              throw new Error(data.error);
            } catch (error) {
              throw new Error(
                "Something went wrong with your wish. It may be our fault, sorry!"
              );
            }
          case 429:
            form.reset();
            setInactivityTimeout();

            throw new Error(
              "Hey! You cannot have THAT MANY wishes. That's enough."
            );
          case 503:
            throw new Error(
              "The service is unavailable. This is embarrassing, sorry! Please try again later."
            );
          default:
            throw new Error(
              "Failed to submit. It may be our fault, sorry! Please try again later."
            );
        }
      }

      setTimeout(() => {
        form.classList.add("submitted");

        setTimeout(() => {
          submitButton.removeAttribute("disabled");
          input.disabled = false;
          form.reset();
          onSubmit(
            form,
            formData.get("wish") as string,
            formData.get("tool") as string
          );
        }, 2000);
      }, 1000);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Probably our fault, sorry! Please try again.",
        form,
        input
      );
      setInactivityTimeout();
    }
  });
}
