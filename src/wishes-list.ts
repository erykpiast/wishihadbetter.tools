const pastDaysFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const todayFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: undefined,
  timeStyle: "short",
});

function renderWishesList(
  wishes: Array<{ wish: string; time: string } | null>
): HTMLElement {
  const wishesListTemplate = document.getElementById("wishes-list-template");
  if (
    !wishesListTemplate ||
    !(wishesListTemplate instanceof HTMLTemplateElement)
  ) {
    throw new Error("Wishes list template not found");
  }

  const main = document.querySelector("main");
  if (!main) {
    throw new Error("Main element not found");
  }

  const wishesList = (wishesListTemplate.content.cloneNode(true) as HTMLElement)
    .firstElementChild as HTMLUListElement;
  if (!wishesList) {
    throw new Error("Wishes list not found");
  }

  for (const wish of wishes) {
    const wishItem = renderWish(wish);
    wishesList.appendChild(wishItem);
  }

  return wishesList;
}

function renderWish(wish: { wish: string; time: string } | null): HTMLElement {
  const wishTemplate = document.getElementById("wish-template");
  if (!wishTemplate || !(wishTemplate instanceof HTMLTemplateElement)) {
    throw new Error("Wish template not found");
  }

  const wishItem = (wishTemplate.content.cloneNode(true) as HTMLElement)
    .firstElementChild as HTMLLIElement;
  if (!wishItem) {
    throw new Error("Wish item not found");
  }

  const wishTextContainer = wishItem.querySelector("p");
  if (!wishTextContainer) {
    throw new Error("Wish text container not found");
  }

  const wishTimeContainer = wishItem.querySelector("time");
  if (!wishTimeContainer) {
    throw new Error("Wish time container not found");
  }

  if (wish) {
    wishTextContainer.textContent = wish.wish;
    wishTimeContainer.setAttribute("datetime", wish.time);
    const dateFormatter =
      new Date(wish.time).getDate() < new Date().getDate()
        ? pastDaysFormatter
        : todayFormatter;
    wishTimeContainer.textContent = dateFormatter.format(new Date(wish.time));
  } else {
    wishItem.classList.add("placeholder");
  }

  return wishItem;
}

function showError(message: string, element: HTMLElement) {
  const error = document.createElement("output");
  error.classList.add("error-message");
  error.textContent = message;
  element.appendChild(error);
}

export async function replaceWishFormWithWishesList(
  form: HTMLFormElement,
  wish: string
) {
  const placeholderWishes = Array.from({ length: 10 }, () => null);
  const wishesList = renderWishesList([
    {
      wish,
      time: new Date().toISOString(),
    },
    ...placeholderWishes,
  ]);

  form.parentElement?.replaceChild(wishesList, form);

  try {
    const response = await fetch("/api/wish");
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid response");
    }

    let currentPlaceholderWish = wishesList.firstElementChild;

    for (const wish of data) {
      if (
        typeof wish !== "object" ||
        wish === null ||
        typeof wish.time !== "string" ||
        typeof wish.wish !== "string"
      ) {
        throw new Error("Invalid response");
      }

      const wishItem = renderWish({
        wish: wish.wish,
        time: wish.time,
      });

      if (!currentPlaceholderWish) {
        wishesList.appendChild(wishItem);
      } else {
        currentPlaceholderWish.replaceWith(wishItem);

        currentPlaceholderWish = wishItem.nextElementSibling;
      }
    }

    wishesList.querySelectorAll(".placeholder").forEach((placeholder) => {
      placeholder.remove();
    });
  } catch (error) {
    if (error instanceof Error) {
      showError(error.message, wishesList);
    } else {
      showError(
        "Something went wrong. It's probably our fault, sorry! Please try again later.",
        wishesList
      );
    }
  }
}
