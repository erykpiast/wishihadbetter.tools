import { createEmojiCarousel } from "./emoji-carousel";
import { handleWishForm } from "./wish-form";
import { replaceWishFormWithWishList } from "./wish-list";

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("wish")) {
    replaceWishFormWithWishList(
      document.getElementById("wish-form") as HTMLFormElement,
      localStorage.getItem("wish") as string
    );
  } else {
    handleWishForm(replaceWishFormWithWishList);
  }

  createEmojiCarousel();
});

// @ts-ignore
if (import.meta.env.DEV) {
  const { worker } = await import("../mocks/api");
  worker.start();
}
