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

function countryCodeToFlagEmoji(countryCode: string) {
  const cc = countryCode.toUpperCase();

  switch (cc) {
    case "XX":
      return "🏴‍☠️";
    case "WR":
      return "🌍";
    case "A1":
      return "🕵️";
    case "A2":
      return "🛰️";
  }

  if (cc.length === 2) {
    const firstChar = cc.charCodeAt(0) - 65 + 0x1f1e6;
    const secondChar = cc.charCodeAt(1) - 65 + 0x1f1e6;
    return String.fromCodePoint(firstChar, secondChar);
  }

  return "🏴‍☠️";
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

function renderWish(
  wish: { country: string; wish: string; time: string } | null
): HTMLElement {
  const wishTemplate = document.getElementById("wish-template");
  if (!wishTemplate || !(wishTemplate instanceof HTMLTemplateElement)) {
    throw new Error("Wish template not found");
  }

  const wishItem = (wishTemplate.content.cloneNode(true) as HTMLElement)
    .firstElementChild as HTMLLIElement;
  if (!wishItem) {
    throw new Error("Wish item not found");
  }

  const wishTextContainer = wishItem.querySelector("article");
  if (!wishTextContainer) {
    throw new Error("Wish text container not found");
  }

  const wishTimeContainer = wishItem.querySelector("time");
  if (!wishTimeContainer) {
    throw new Error("Wish time container not found");
  }

  const wishCountryContainer = wishItem.querySelector("address");
  if (!wishCountryContainer) {
    throw new Error("Wish country container not found");
  }

  if (wish) {
    if (wishTextContainer.lastChild?.nodeType === Node.TEXT_NODE) {
      (wishTextContainer.lastChild as Text).data = wish.wish;
    } else {
      wishTextContainer.appendChild(document.createTextNode(wish.wish));
    }

    wishCountryContainer.textContent = countryCodeToFlagEmoji(wish.country);
    wishCountryContainer.setAttribute("title", wish.country);

    const now = new Date();
    const wishDate = new Date(wish.time);
    const secondsAgo = Math.floor((now.getTime() - wishDate.getTime()) / 1000);

    if (secondsAgo <= 10) {
      wishTimeContainer.textContent = "now";
    } else {
      const dateFormatter =
        wishDate.getDate() < now.getDate() ? pastDaysFormatter : todayFormatter;
      wishTimeContainer.textContent = dateFormatter.format(wishDate);
    }

    wishTimeContainer.setAttribute("datetime", wish.time);
  } else {
    wishItem.classList.add("placeholder");
  }

  return wishItem;
}

function showError(element: HTMLElement): Promise<void> {
  const error = document.createElement("output");
  error.classList.add("error-message");
  error.textContent =
    "Something went wrong with fetching wishes. It's probably our fault, sorry! Please try again later.";
  element.parentElement?.appendChild(error);

  return new Promise((resolve) => {
    setTimeout(() => {
      error.classList.add("expired");

      error.addEventListener(
        "animationend",
        () => {
          error.remove();
          resolve();
        },
        { once: true }
      );
    }, 5000);
  });
}

function showEndOfWishes(element: HTMLElement) {
  const endOfWishes = document.createElement("output");
  endOfWishes.classList.add("end-of-wishes");
  endOfWishes.textContent = "No more wishes!";
  element.parentElement?.appendChild(endOfWishes);
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
  wishes: Array<{ country: string; wish: string; time: string }>
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
      typeof wish.wish !== "string" ||
      typeof wish.country !== "string"
    ) {
      throw new Error("Invalid response");
    }

    const wishItem = renderWish({
      wish: wish.wish,
      time: wish.time,
      country: wish.country,
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
): Promise<Array<{ country: string; wish: string; time: string }>> {
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

export async function replaceWishFormWithWishList(
  form: HTMLFormElement,
  wish: string
) {
  const wishList = createWishList();
  const placeholderWishes = createPlaceholderWishes(wishList, PAGE_SIZE - 1);
  const optimisticWish = renderWish({
    wish,
    time: new Date().toISOString(),
    country: "WR",
  });
  wishList.prepend(optimisticWish);

  form.parentElement?.replaceChild(wishList, form);

  let wishListLoader: Promise<
    Array<{ country: string; wish: string; time: string }>
  > | null = null;

  let lastWishTime: string | null = null;

  async function scrollHandler() {
    if (wishListLoader) {
      return;
    }

    if (lastWishTime === null) {
      showEndOfWishes(wishList);
      return;
    }

    if (
      // NOTE: start loading when the user is about the middle of the page
      window.scrollY + window.innerHeight * 1.5 >=
      document.body.scrollHeight
    ) {
      document.removeEventListener("scroll", scrollHandler);

      const placeholderWishes = createPlaceholderWishes(wishList, PAGE_SIZE);

      try {
        wishListLoader = fetchWishes(lastWishTime);

        const moreData = await wishListLoader;

        replacePlaceholderWishes(placeholderWishes[0], moreData);

        lastWishTime = moreData[moreData.length - 1]?.time ?? null;
      } catch (error) {
        removePlaceholderWishes(placeholderWishes[0]);

        await showError(wishList);
      } finally {
        wishListLoader = null;

        if (lastWishTime !== null) {
          document.addEventListener("scroll", scrollHandler);
        } else {
          showEndOfWishes(wishList);
        }
      }
    }
  }

  try {
    const data = await fetchWishes(null);

    lastWishTime = data[data.length - 1]?.time ?? null;

    replacePlaceholderWishes(optimisticWish, data);

    if (lastWishTime !== null) {
      document.addEventListener("scroll", scrollHandler, { passive: true });
    } else {
      showEndOfWishes(wishList);
    }
  } catch (error) {
    removePlaceholderWishes(placeholderWishes[0]);

    await showError(wishList);

    document.addEventListener("scroll", scrollHandler, { passive: true });
  }
}
