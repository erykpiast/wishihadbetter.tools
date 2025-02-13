import { createEmojiCarousel } from "./emoji-carousel";
import { handleWishForm } from "./wish-form";
import { replaceWishFormWithWishesList } from "./wishes-list";

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("wish")) {
    replaceWishFormWithWishesList(
      document.getElementById("wish-form") as HTMLFormElement,
      localStorage.getItem("wish") as string
    );
  } else {
    handleWishForm(replaceWishFormWithWishesList);
  }

  createEmojiCarousel();
});

// @ts-ignore
if (import.meta.env.DEV) {
  const { worker } = await import("../mocks/api");
  worker.start();
}
