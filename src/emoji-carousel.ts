export function createEmojiCarousel() {
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
