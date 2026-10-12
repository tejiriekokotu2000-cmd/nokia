const WallpaperPlayer = (() => {
  const svgCache = new Map();
  const PLACEHOLDER = "assets/images/placeholders/empty.svg";

  function assetUrl(path) {
    return new URL(path, document.baseURI).href;
  }

  async function loadSvg(path) {
    if (svgCache.has(path)) {
      return svgCache.get(path);
    }
    const request = fetch(assetUrl(path))
      .then((res) => {
        if (!res.ok) {
          throw new Error("Missing animation");
        }
        return res.text();
      })
      .catch((err) => {
        svgCache.delete(path);
        throw err;
      });
    svgCache.set(path, request);
    return request;
  }

  function mountMarkup(container, markup, alt) {
    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "wallpaper-mount";
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", alt);
    wrap.innerHTML = markup;
    const svg = wrap.querySelector("svg");
    if (svg) {
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
    }
    container.appendChild(wrap);
    return wrap;
  }

  async function renderInto(container, wallpaper, options = {}) {
    const paused = Boolean(options.paused);
    const src = wallpaper.preview || wallpaper.animation;
    try {
      const markup = await loadSvg(src);
      const mount = mountMarkup(container, markup, wallpaper.name);
      if (paused) {
        mount.classList.add("is-paused");
      }
      return mount;
    } catch {
      container.innerHTML = "";
      container.classList.add("is-failed");
      const img = document.createElement("img");
      img.src = PLACEHOLDER;
      img.alt = `${wallpaper.name} preview could not be loaded`;
      container.appendChild(img);
      return null;
    }
  }

  function setPaused(root, paused) {
    root.querySelectorAll(".wallpaper-mount").forEach((node) => {
      node.classList.toggle("is-paused", paused);
    });
  }

  function replay(root) {
    root.querySelectorAll(".wallpaper-mount").forEach((mount) => {
      const html = mount.innerHTML;
      mount.innerHTML = html;
      mount.classList.remove("is-paused");
    });
  }

  return { loadSvg, renderInto, setPaused, replay, assetUrl };
})();
