import { createEmojiCarousel } from "./emoji-carousel";
import { handleWishForm } from "./wish-form";

document.addEventListener("DOMContentLoaded", () => {
  handleWishForm();

  createEmojiCarousel();
});
