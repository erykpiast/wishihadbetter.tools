export function createEmojiCarousel() {
  const carousel = document.getElementById(
    "tools-carousel"
  ) as HTMLUListElement;
  let currentIndex = 0;

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

    const nextElement = currentElement.nextElementSibling;

    if (!nextElement) {
      return;
    }

    nextElement.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const CAROUSEL_INTERVAL = 3_000;

  let scrollInterval = setInterval(scrollToNextItem, CAROUSEL_INTERVAL);

  carousel.addEventListener(
    "scroll",
    () => {
      clearInterval(scrollInterval);
      scrollInterval = setInterval(scrollToNextItem, CAROUSEL_INTERVAL);
    },
    { passive: true }
  );

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        const childrenArray = Array.from(carousel.children);
        const index = childrenArray.indexOf(entry.target);

        if (index === currentIndex) {
          continue;
        }

        childrenArray[currentIndex].classList.remove("visible");
        entry.target.classList.add("visible");

        if (index > currentIndex) {
          // Scrolling down, move first to last
          carousel.appendChild(carousel.firstElementChild!);

          // we just moved the first element to the end, so we need to adjust the current index
          currentIndex = index - 1;
        } else {
          // Scrolling up, move last to first
          carousel.insertBefore(
            carousel.lastElementChild!,
            carousel.firstElementChild
          );

          // we just moved the last element to the beginning, so we need to adjust the current index
          currentIndex = index + 1;
        }

        entry.target.scrollIntoView({
          behavior: "instant",
          block: "start",
        });

        // stop iteration through entries, with scroll snap there may be only one visible element
        return;
      }
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
