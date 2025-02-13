const pastDaysFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const todayFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: undefined,
  timeStyle: "short",
});

const PAGE_SIZE = 10;

function getNullArray(length: number): Array<null> {
  return Array.from({ length }, () => null);
}

function createWishList(): HTMLElement {
  const wishListTemplate = document.getElementById("wish-list-template");
  if (!wishListTemplate || !(wishListTemplate instanceof HTMLTemplateElement)) {
    throw new Error("Wish list template not found");
  }

  const main = document.querySelector("main");
  if (!main) {
    throw new Error("Main element not found");
  }

  const wishList = (wishListTemplate.content.cloneNode(true) as HTMLElement)
    .firstElementChild as HTMLUListElement;
  if (!wishList) {
    throw new Error("Wish list not found");
  }

  return wishList;
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

function showError(element: HTMLElement) {
  const error = document.createElement("output");
  error.classList.add("error-message");
  error.textContent =
    "Something went wrong with fetching wishes. It's probably our fault, sorry! Please try again later.";
  element.parentElement?.appendChild(error);

  setTimeout(() => {
    error.classList.add("expired");

    error.addEventListener(
      "animationend",
      () => {
        error.remove();
      },
      { once: true }
    );
  }, 5000);
}

function removePlaceholderWishes(firstPlaceholderWish: Element | null) {
  let currentPlaceholderWish: Element | null = firstPlaceholderWish;

  while (currentPlaceholderWish) {
    const placeholderWishToRemove = currentPlaceholderWish;
    currentPlaceholderWish = currentPlaceholderWish.nextElementSibling;
    placeholderWishToRemove.remove();
  }
}

function replacePlaceholderWishes(
  firstPlaceholderWish: HTMLElement,
  wishes: Array<{ wish: string; time: string }>
) {
  const wishList = firstPlaceholderWish.parentElement;
  if (!wishList) {
    throw new Error("Wish list not found");
  }

  let currentPlaceholderWish: Element | null = firstPlaceholderWish;

  for (const wish of wishes) {
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
      wishList.appendChild(wishItem);
    } else {
      currentPlaceholderWish.replaceWith(wishItem);

      currentPlaceholderWish = wishItem.nextElementSibling;
    }
  }

  removePlaceholderWishes(currentPlaceholderWish);
}

async function fetchWishes(
  lastWishTime: string | null
): Promise<Array<{ wish: string; time: string }>> {
  const matchRequestUrl = new URL("/api/wish", window.location.origin);
  matchRequestUrl.searchParams.set("limit", PAGE_SIZE.toString());
  if (lastWishTime) {
    matchRequestUrl.searchParams.set(
      "cursor",
      String(Date.parse(lastWishTime))
    );
  }

  const response = await fetch(matchRequestUrl.toString());
  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Invalid response");
  }

  return data;
}

function createPlaceholderWishes(
  wishList: HTMLElement,
  pageSize: number
): Array<HTMLElement> {
  const placeholderWishes: Array<HTMLElement> = [];

  for (const wish of getNullArray(pageSize)) {
    const wishItem = renderWish(wish);
    placeholderWishes.push(wishItem);
    wishList.appendChild(wishItem);
  }

  return placeholderWishes;
}

async function loadNextWishes(
  wishList: HTMLElement,
  lastWishTime: string | null
): Promise<string | null> {
  const placeholderWishes = createPlaceholderWishes(wishList, PAGE_SIZE);

  try {
    const data = await fetchWishes(lastWishTime);

    replacePlaceholderWishes(placeholderWishes[0], data);

    return data[data.length - 1]?.time ?? null;
  } catch (error) {
    removePlaceholderWishes(placeholderWishes[0]);

    showError(wishList);

    return null;
  }
}

export async function replaceWishFormWithWishList(
  form: HTMLFormElement,
  wish: string
) {
  const wishList = createWishList();
  const placeholderWishes = createPlaceholderWishes(wishList, PAGE_SIZE - 1);
  wishList.prepend(
    renderWish({
      wish,
      time: new Date().toISOString(),
    })
  );

  form.parentElement?.replaceChild(wishList, form);

  try {
    const data = await fetchWishes(null);

    replacePlaceholderWishes(placeholderWishes[0], data);

    let wishListLoader: Promise<string | null> | null = null;

    let lastWishTime: string | null = data[data.length - 1]?.time ?? null;

    document.addEventListener("scroll", () => {
      (async () => {
        if (wishListLoader || lastWishTime === null) {
          return;
        }

        if (
          // NOTE: start loading when the user is about the middle of the page
          window.scrollY + window.innerHeight * 1.5 >=
          document.body.scrollHeight
        ) {
          wishListLoader = loadNextWishes(wishList, lastWishTime);
          lastWishTime = await wishListLoader;
          wishListLoader = null;
        }
      })();
    });
  } catch (error) {
    removePlaceholderWishes(placeholderWishes[0]);

    showError(wishList);
  }
}
