(function () {
  const nav = document.getElementById("site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const yearNodes = document.querySelectorAll("[data-year]");

  yearNodes.forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const syncMotion = () => {
    document.documentElement.classList.toggle("reduce-motion", reduce.matches);
  };
  syncMotion();
  if (reduce.addEventListener) {
    reduce.addEventListener("change", syncMotion);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }
})();
