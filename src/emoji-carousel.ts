export function createEmojiCarousel(): () => void {
  const carousel = document.getElementById("tools-carousel");

  if (!carousel) {
    throw new Error("Carousel not found");
  }

  const carouselList = carousel.firstElementChild as HTMLUListElement;

  if (!carouselList) {
    throw new Error("Carousel list not found");
  }

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
      carouselList.prepend(li);
    });

  requestAnimationFrame(() => {
    carouselList.lastElementChild!.scrollIntoView({
      behavior: "instant",
      block: "end",
    });
  });

  return () => {
    const currentEmoji = document.elementFromPoint(
      carousel.offsetLeft + carousel.offsetWidth / 2,
      carousel.offsetTop + carousel.offsetHeight / 2
    );

    if (currentEmoji && currentEmoji.previousElementSibling) {
      (currentEmoji.previousElementSibling as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };
}
