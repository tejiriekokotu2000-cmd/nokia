(function () {
  const DATA_URL = "data/wallpapers.json";

  const featuredGrid = document.getElementById("featured-grid");
  const galleryGrid = document.getElementById("gallery-grid");
  const heroScreen = document.getElementById("hero-screen");
  const heroCaption = document.getElementById("hero-caption");
  const searchInput = document.getElementById("gallery-search");
  const categorySelect = document.getElementById("gallery-category");
  const sortSelect = document.getElementById("gallery-sort");
  const resultMeta = document.getElementById("result-meta");
  const previewLayer = document.getElementById("preview-layer");

  let catalog = { categories: [], wallpapers: [] };
  let lastFocus = null;
  let previewPaused = false;
  let phoneMode = false;
  let activeWallpaper = null;

  function originLabel(origin) {
    if (origin === "original") return "Original animation created for this site";
    if (origin === "recreation") return "Fan-made recreation (not an official Nokia asset)";
    if (origin === "historical") return "Historical file with verified provenance";
    return "Independent content";
  }

  function sortWallpapers(list, mode) {
    const copy = list.slice();
    if (mode === "alpha") {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else if (mode === "recent") {
      copy.sort((a, b) => String(b.added).localeCompare(String(a.added)));
    } else {
      copy.sort((a, b) => Number(b.featured) - Number(a.featured) || String(b.added).localeCompare(String(a.added)));
    }
    return copy;
  }

  function matchesQuery(item, query) {
    if (!query) return true;
    const hay = [
      item.name,
      item.description,
      item.category,
      item.phoneModel,
      item.era,
      item.origin,
      ...(item.keywords || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  }

  function emptyMessage(grid) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = grid.dataset.emptyMessage || "No wallpapers are available.";
    return p;
  }

  function card(item, { link = false } = {}) {
    const el = link ? document.createElement("a") : document.createElement("button");
    el.className = "wallpaper-card";
    if (link) {
      el.href = `gallery.html#${encodeURIComponent(item.id)}`;
    } else {
      el.type = "button";
      el.addEventListener("click", () => openPreview(item.id));
    }
    el.setAttribute("aria-label", `Open ${item.name}`);

    const preview = document.createElement("div");
    preview.className = "card-preview";
    const img = document.createElement("img");
    img.src = item.preview;
    img.alt = item.name;
    img.loading = "lazy";
    img.width = 240;
    img.height = 320;
    img.addEventListener("error", () => {
      preview.classList.add("is-failed");
      img.src = "assets/images/placeholders/empty.svg";
      img.alt = `${item.name} preview could not be loaded`;
    });
    preview.appendChild(img);
    const body = document.createElement("div");
    body.className = "card-body";
    const title = document.createElement("h3");
    title.textContent = item.name;
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item.category;
    body.append(title, chip);
    if (item.era) {
      const era = document.createElement("p");
      era.style.margin = "0";
      era.style.color = "var(--muted)";
      era.style.fontSize = "0.82rem";
      era.textContent = item.era;
      body.appendChild(era);
    }
    el.append(preview, body);
    return el;
  }

  function renderGrid(grid, items, options) {
    grid.innerHTML = "";
    if (!items.length) {
      grid.appendChild(emptyMessage(grid));
      return;
    }
    items.forEach((item) => grid.appendChild(card(item, options)));
  }

  function applyGallery() {
    if (!galleryGrid) return;
    const query = (searchInput?.value || "").trim().toLowerCase();
    const category = categorySelect?.value || "";
    const sort = sortSelect?.value || "featured";
    const filtered = catalog.wallpapers.filter((item) => {
      const catOk = !category || item.category === category;
      return catOk && matchesQuery(item, query);
    });
    const sorted = sortWallpapers(filtered, sort);
    renderGrid(galleryGrid, sorted);
    if (resultMeta) {
      resultMeta.textContent = `${sorted.length} animation${sorted.length === 1 ? "" : "s"}`;
    }
  }

  function fillCategories() {
    if (!categorySelect) return;
    catalog.categories.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      categorySelect.appendChild(opt);
    });
  }

  function findWallpaper(id) {
    return catalog.wallpapers.find((item) => item.id === id);
  }

  function updatePreviewCopy(item) {
    document.getElementById("preview-title").textContent = item.name;
    document.getElementById("preview-description").textContent = item.description;
    document.getElementById("preview-category").textContent = item.category;
    document.getElementById("preview-origin").textContent = originLabel(item.origin);
    document.getElementById("preview-era").textContent = item.era || "Not recorded";
    document.getElementById("preview-model").textContent = item.phoneModel || "Not recorded";

    const download = document.getElementById("btn-download");
    const note = document.getElementById("download-note");
    if (item.downloadAvailable && item.animation) {
      download.hidden = false;
      download.href = WallpaperPlayer.assetUrl(item.animation);
      download.setAttribute("download", `${item.id}-${slug(item.name)}.svg`);
      note.hidden = true;
    } else {
      download.hidden = true;
      note.hidden = false;
      note.textContent = "This preview cannot be downloaded. The file is not available for redistribution.";
    }
  }

  function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function paintPreview(item) {
    const screen = document.getElementById("preview-screen");
    const bare = document.getElementById("bare-screen");
    const stage = document.getElementById("preview-stage");
    stage.classList.toggle("is-phone", phoneMode);
    const paused = previewPaused || document.documentElement.classList.contains("reduce-motion");
    await WallpaperPlayer.renderInto(screen, item, { paused });
    await WallpaperPlayer.renderInto(bare, item, { paused });
    document.getElementById("btn-play").textContent = paused ? "Play" : "Pause";
    document.getElementById("btn-phone").setAttribute("aria-pressed", String(phoneMode));
  }

  function openPreview(id) {
    const item = findWallpaper(id);
    if (!item || !previewLayer) return;
    activeWallpaper = item;
    lastFocus = document.activeElement;
    previewPaused = document.documentElement.classList.contains("reduce-motion");
    previewLayer.hidden = false;
    document.body.style.overflow = "hidden";
    history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    updatePreviewCopy(item);
    paintPreview(item);
    document.getElementById("preview-close").focus();
  }

  function closePreview() {
    if (!previewLayer || previewLayer.hidden) return;
    previewLayer.hidden = true;
    document.body.style.overflow = "";
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function bindPreview() {
    if (!previewLayer) return;
    document.getElementById("preview-close").addEventListener("click", closePreview);
    document.getElementById("preview-back").addEventListener("click", (event) => {
      event.preventDefault();
      closePreview();
    });
    previewLayer.addEventListener("click", (event) => {
      if (event.target === previewLayer) closePreview();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !previewLayer.hidden) {
        closePreview();
      }
    });
    document.getElementById("btn-play").addEventListener("click", () => {
      previewPaused = !previewPaused;
      WallpaperPlayer.setPaused(previewLayer, previewPaused);
      document.getElementById("btn-play").textContent = previewPaused ? "Play" : "Pause";
    });
    document.getElementById("btn-replay").addEventListener("click", () => {
      previewPaused = false;
      WallpaperPlayer.replay(previewLayer);
      document.getElementById("btn-play").textContent = "Pause";
    });
    document.getElementById("btn-phone").addEventListener("click", () => {
      phoneMode = !phoneMode;
      document.getElementById("preview-stage").classList.toggle("is-phone", phoneMode);
      document.getElementById("btn-phone").setAttribute("aria-pressed", String(phoneMode));
    });
    document.getElementById("btn-full").addEventListener("click", async () => {
      const stage = document.getElementById("preview-stage");
      try {
        if (!document.fullscreenElement) {
          await stage.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch {
        document.getElementById("download-note").hidden = false;
        document.getElementById("download-note").textContent = "Fullscreen is not available in this browser.";
      }
    });
  }

  async function boot() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error("Could not load wallpaper data");
      catalog = await res.json();
    } catch (err) {
      const host = featuredGrid || galleryGrid;
      if (host) {
        const p = document.createElement("p");
        p.className = "empty-state";
        p.textContent = "Wallpaper data could not be loaded. Serve the site over HTTP so the JSON file can be read.";
        host.appendChild(p);
      }
      console.error(err);
      return;
    }

    fillCategories();

    if (featuredGrid) {
      const featured = sortWallpapers(
        catalog.wallpapers.filter((item) => item.featured),
        "featured"
      );
      renderGrid(featuredGrid, featured, { link: true });
    }

    if (heroScreen) {
      const feature = catalog.wallpapers.find((item) => item.featured) || catalog.wallpapers[0];
      if (feature) {
        if (heroCaption) {
          heroCaption.textContent = `Featured: ${feature.name}`;
        }
        await WallpaperPlayer.renderInto(heroScreen, feature, {
          paused: document.documentElement.classList.contains("reduce-motion"),
        });
      }
    }

    if (galleryGrid) {
      applyGallery();
      searchInput?.addEventListener("input", applyGallery);
      categorySelect?.addEventListener("change", applyGallery);
      sortSelect?.addEventListener("change", applyGallery);
      bindPreview();
      const hashId = decodeURIComponent(location.hash.replace(/^#/, ""));
      if (hashId) openPreview(hashId);
      window.addEventListener("hashchange", () => {
        const id = decodeURIComponent(location.hash.replace(/^#/, ""));
        if (id) openPreview(id);
        else closePreview();
      });
    }
  }

  boot();
})();
