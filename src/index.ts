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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("wishForm") as HTMLFormElement | null;
  const input = document.getElementById("wishInput") as HTMLInputElement | null;

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
});

function createEmojiCarousel() {
  const carousel = document.getElementById(
    "tools-carousel"
  ) as HTMLUListElement;

  [
    "🔨",
    "🖱️",
    "🔧",
    "🛠️",
    "🧰",
    "🔬",
    "⛏️",
    "💻",
    "🏗️",
    "🦴",
    "🔍",
    "🪚",
    "🔪",
    "🪠",
    "🧹",
    "🩺",
    "🪓",
    "🎤",
    "🎺",
    "🎸",
    "🎻",
    "🥊",
    "🧠",
    "🗡",
    "💉",
    "📐",
    "🧭",
    "🧽",
    "🦾",
    "🛸",
    "🚀",
    "🗜️",
    "🧲",
    "🪜",
    "🚽",
    "🫖",
    "📸",
    "📣",
    "🪄",
  ]
    .sort(() => Math.random() - 0.5)
    .forEach((emoji) => {
      const li = document.createElement("li");
      li.textContent = emoji;
      carousel.appendChild(li);
    });

  const scrollToNextItem = () => {
    const carouselRect = carousel.getBoundingClientRect();
    const centerX = carouselRect.left + carouselRect.width / 2;
    const centerY = carouselRect.top + carouselRect.height / 2;
    const currentElement = document.elementFromPoint(centerX, centerY);

    if (!currentElement) {
      return;
    }

    const nextElement =
      currentElement.nextElementSibling ?? carousel.firstElementChild;

    if (!nextElement) {
      return;
    }

    nextElement.scrollIntoView({ behavior: "smooth" });
  };

  let scrollInterval = setInterval(scrollToNextItem, 5_000);

  carousel.addEventListener(
    "scroll",
    () => {
      clearInterval(scrollInterval);
      scrollInterval = setInterval(scrollToNextItem, 5_000);
    },
    { passive: true }
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else {
          entry.target.classList.remove("visible");
        }
      });
    },
    {
      root: carousel,
      threshold: 0.5,
    }
  );

  for (const item of carousel.children) {
    observer.observe(item);
  }
}

createEmojiCarousel();
