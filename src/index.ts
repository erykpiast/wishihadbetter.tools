import { createEmojiCarousel } from "./emoji-carousel";
import { handleWishForm } from "./wish-form";
import { replaceWishFormWithWishList } from "./wish-list";

function init() {
  const rotate = createEmojiCarousel();

  if (localStorage.getItem("wish")) {
    replaceWishFormWithWishList(
      document.getElementById("wish-form") as HTMLFormElement,
      localStorage.getItem("wish") as string
    );
  } else {
    handleWishForm({
      onSubmit: replaceWishFormWithWishList,
      onInputInactivity: rotate,
    });
  }
}

if (document.readyState === "complete") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}

// @ts-ignore
if (import.meta.env.DEV) {
  const { worker } = await import("../mocks/api");
  worker.start();
}
