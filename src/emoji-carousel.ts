import KNOWN_TOOLS from "../api/tools";

export function createEmojiCarousel(): {
  displayNext: () => void;
  getCurrent: () => string | null;
} {
  const carousel = document.getElementById("tools-carousel");

  if (!carousel) {
    throw new Error("Carousel not found");
  }

  const carouselList = carousel.firstElementChild as HTMLUListElement;

  if (!carouselList) {
    throw new Error("Carousel list not found");
  }

  KNOWN_TOOLS.slice(1)
    .sort(() => Math.random() - 0.5)
    .forEach((emoji) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = emoji;
      li.appendChild(span);
      carouselList.prepend(li);
    });

  carouselList.lastElementChild!.scrollIntoView({
    behavior: "instant",
    block: "end",
  });

  const getCurrentEmoji = () => {
    return document.elementFromPoint(
      carousel.offsetLeft + carousel.offsetWidth / 2,
      carousel.offsetTop + carousel.offsetHeight / 2
    );
  };

  const handleScrollEnd = () => {
    const LOOP_ANIMATION_DELAY = 250;

    // NOTE: The first handler triggers on the programatic scroll, and the second one on the user scroll
    // that's why we need to nest handlers after each programatic scroll

    // NOTE: while looping, we have to animate the span inside the li as changing the transform of the li itself while
    // the scroll snap is active gives no effect - the emoji keeps its position in the center of the carousel
    // window
    carousel.addEventListener(
      "scrollend",
      function attachScrollEndHandler() {
        carousel.addEventListener(
          "scrollend",
          () => {
            const { firstElementChild, lastElementChild } = carouselList;

            if (!firstElementChild || !lastElementChild) {
              attachScrollEndHandler.call(this);
              return;
            }

            if (firstElementChild && carousel.scrollTop === 0) {
              const animation = firstElementChild.firstElementChild!.animate(
                [
                  { transform: "translateY(0)" },
                  { transform: "translateY(100%)" },
                ],
                LOOP_ANIMATION_DELAY
              );

              animation.addEventListener(
                "finish",
                () => {
                  lastElementChild!.scrollIntoView({
                    behavior: "instant",
                    block: "end",
                  });

                  handleScrollEnd();
                },
                { once: true }
              );

              return;
            }

            if (
              lastElementChild &&
              carousel.scrollTop >
                carousel.scrollHeight - carousel.clientHeight - 5 // NOTE: 5 is a buffer for browser inconsistencies
            ) {
              const animation = lastElementChild.firstElementChild!.animate(
                [
                  { transform: "translateY(0)" },
                  { transform: "translateY(-100%)" },
                ],
                LOOP_ANIMATION_DELAY
              );

              animation.addEventListener("progress", () => {
                console.log("progress");
              });

              animation.addEventListener(
                "finish",
                () => {
                  firstElementChild.scrollIntoView({
                    behavior: "instant",
                    block: "start",
                  });

                  handleScrollEnd();
                },
                { once: true }
              );

              return;
            }

            attachScrollEndHandler.call(this);
          },
          { once: true }
        );
      },
      { once: true }
    );
  };

  handleScrollEnd();

  return {
    displayNext(): void {
      const currentEmoji = getCurrentEmoji();
      if (currentEmoji && currentEmoji.previousElementSibling) {
        (currentEmoji.previousElementSibling as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    getCurrent(): string | null {
      const currentEmoji = getCurrentEmoji();

      return currentEmoji?.textContent ?? null;
    },
  };
}
