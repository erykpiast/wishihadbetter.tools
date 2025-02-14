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

  let userIsScrolling = false;

  carousel.addEventListener(
    "scroll",
    () => {
      clearInterval(scrollInterval);
      scrollInterval = setInterval(scrollToNextItem, CAROUSEL_INTERVAL);

      userIsScrolling = true;
      setTimeout(() => {
        userIsScrolling = false;
      }, 100);
    },
    { passive: true }
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = Array.from(carousel.children).indexOf(entry.target);

        if (entry.isIntersecting) {
          // if (entry.target.classList.contains("visible")) {
          //   return;
          // }

          entry.target.classList.add("visible");

          // Determine scroll direction by comparing indices
          if (index !== currentIndex) {
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

              // we need to scroll down to keep the current element in the original position
              carousel.scrollTop += carousel.lastElementChild!.clientHeight;
            }
          }
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
