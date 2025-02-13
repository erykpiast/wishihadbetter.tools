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

export function handleWishForm(
  onSubmit: (form: HTMLFormElement, wish: string) => void
) {
  const form = document.getElementById("wish-form") as HTMLFormElement | null;
  const input = document.getElementById(
    "wish-input"
  ) as HTMLInputElement | null;

  if (!form || !input) {
    throw new Error("Required elements not found");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      return;
    }

    const formData = new FormData(form);

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
            input.disabled = true;
            form
              .querySelector("button[type=submit]")
              ?.setAttribute("disabled", "disabled");
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

      form.reset();

      onSubmit(form, formData.get("wish") as string);
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Probably our fault, sorry! Please try again.",
        form,
        input
      );
    }
  });
}
