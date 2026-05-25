/* ═══════════════════════════════════════════════════════
   India Job Launcher — script.js
   ═══════════════════════════════════════════════════════ */

const STORAGE_KEY = "job-launcher-filters";
const HISTORY_KEY = "job-launcher-history";
const TOGGLES_KEY = "job-launcher-toggles";
const MAX_HISTORY = 5;

/* ── Preset Data ───────────────────────────────────── */
const locations = [
  "Bengaluru", "Hyderabad", "Pune", "Gurugram", "Mumbai",
  "Chennai", "Noida", "Delhi NCR", "Ahmedabad", "Kolkata",
  "Kochi", "Jaipur", "Remote India",
];

const dateDays = { "24h": "1", "3d": "3", "7d": "7", "14d": "14", "30d": "30" };

const linkedinDate = {
  "24h": "r86400", "3d": "r259200", "7d": "r604800",
  "14d": "r1209600", "30d": "r2592000",
};

const linkedinJobType = {
  fulltime: "F", parttime: "P", contract: "C", internship: "I", freelance: "T",
};

const naukriJobType = {
  fulltime: "fullTime", parttime: "partTime", contract: "contractual",
  internship: "intern", freelance: "freelance",
};

const defaultFilters = {
  keywords: "",
  minExperience: "",
  maxExperience: "",
  minSalary: "",
  maxSalary: "",
  datePosted: "any",
  remoteOnly: false,
  jobType: "any",
  sortBy: "relevance",
  customLocation: "",
  locations: [],
};

/* ── Portal Definitions ────────────────────────────── */
// filterSupport: count of how many of our 7 main filter types the portal supports
// supportedFilters: array of filter names for badge tooltip
const portals = [
  {
    id: "linkedin",
    name: "LinkedIn Jobs",
    logo: "linkedin.png",
    filterSupport: 5,
    supportedFilters: ["Keywords", "Location", "Date", "Remote", "Job Type"],
    build(f) {
      const url = new URL("https://www.linkedin.com/jobs/search/");
      setParam(url, "keywords", f.keywords);
      setParam(url, "location", allLocations(f));
      setParam(url, "f_TPR", linkedinDate[f.datePosted]);
      setParam(url, "f_WT", f.remoteOnly ? "3" : ""); // 3 = Remote
      setParam(url, "f_JT", linkedinJobType[f.jobType]);
      if (f.sortBy === "date") setParam(url, "sortBy", "DD");
      return url.toString();
    },
  },
  {
    id: "naukri",
    name: "Naukri.com",
    logo: "naukri.png",
    filterSupport: 7,
    supportedFilters: ["Keywords", "Location", "Experience", "Salary", "Date", "Remote", "Job Type"],
    build(f) {
      const url = new URL("https://www.naukri.com/jobs");
      setParam(url, "k", f.keywords);
      setParam(url, "l", allLocations(f));
      // experience range
      if (f.minExperience || f.maxExperience) {
        setParam(url, "experience", `${f.minExperience || "0"}${f.maxExperience ? "to" + f.maxExperience : ""}`);
      }
      // salary — naukri uses lakh values directly
      if (f.minSalary || f.maxSalary) {
        const min = f.minSalary || "0";
        const max = f.maxSalary || "100";
        setParam(url, "nctFilter", `${min}to${max}`);
      }
      setParam(url, "jobAge", dateDays[f.datePosted]);
      setParam(url, "wfhType", f.remoteOnly ? "2" : "");
      setParam(url, "jobType", naukriJobType[f.jobType]);
      if (f.sortBy === "date") setParam(url, "sort", "date");
      return url.toString();
    },
  },
  {
    id: "indeed",
    name: "Indeed India",
    logo: "indeed.png",
    filterSupport: 4,
    supportedFilters: ["Keywords", "Location", "Date", "Remote"],
    build(f) {
      const url = new URL("https://in.indeed.com/jobs");
      setParam(url, "q", mergeKeywords(f));
      setParam(url, "l", allLocations(f));
      setParam(url, "fromage", dateDays[f.datePosted]);
      setParam(url, "remotejob", f.remoteOnly ? "1" : "");
      if (f.sortBy === "date") setParam(url, "sort", "date");
      return url.toString();
    },
  },
  {
    id: "foundit",
    name: "Foundit",
    logo: "foundit.png",
    filterSupport: 4,
    supportedFilters: ["Keywords", "Location", "Experience", "Date"],
    build(f) {
      const url = new URL("https://www.foundit.in/srp/results");
      setParam(url, "query", mergeKeywords(f));
      setParam(url, "locations", allLocations(f));
      // experience range format
      if (f.minExperience || f.maxExperience) {
        const min = f.minExperience || "0";
        const max = f.maxExperience || "30";
        setParam(url, "experienceRanges", `${min}~${max}`);
      }
      setParam(url, "postedDate", dateDays[f.datePosted]);
      if (f.sortBy === "date") setParam(url, "sort", "1");
      return url.toString();
    },
  },
  {
    id: "glassdoor",
    name: "Glassdoor India",
    logo: "glassdoor.png",
    filterSupport: 3,
    supportedFilters: ["Keywords", "Location", "Date"],
    build(f) {
      const url = new URL("https://www.glassdoor.co.in/Job/jobs.htm");
      setParam(url, "sc.keyword", mergeKeywords(f));
      setParam(url, "locKeyword", allLocations(f));
      setParam(url, "fromAge", dateDays[f.datePosted]);
      if (f.sortBy === "date") setParam(url, "sortBy", "date_desc");
      return url.toString();
    },
  },
];

/* ── State ─────────────────────────────────────────── */
let filters = readFilters();
let toggles = readToggles();

/* ── DOM Refs ──────────────────────────────────────── */
const dialog       = document.getElementById("filterDialog");
const form         = document.getElementById("filterForm");
const formError    = document.getElementById("formError");
const portalGrid   = document.getElementById("portalGrid");
const locationChips = document.getElementById("locationChips");
const summaryCard  = document.getElementById("summaryCard");
const historySection = document.getElementById("historySection");
const historyList  = document.getElementById("historyList");
const toastContainer = document.getElementById("toastContainer");

/* ── Helpers ───────────────────────────────────────── */
function setParam(url, key, value) {
  if (value !== undefined && value !== null && value !== "" && value !== false) {
    url.searchParams.set(key, String(value));
  }
}

function allLocations(f) {
  const locs = [...f.locations];
  if (f.customLocation && f.customLocation.trim()) {
    locs.push(f.customLocation.trim());
  }
  return locs.join(", ");
}

function mergeKeywords(f) {
  return [f.keywords.trim(), f.remoteOnly ? "remote" : ""].filter(Boolean).join(" ");
}

function iconUrl(fileName) {
  return `logos/${fileName}`;
}

/* ── Persistence ───────────────────────────────────── */
function readFilters() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || typeof stored !== "object") return { ...defaultFilters };
    return {
      ...defaultFilters,
      ...stored,
      locations: Array.isArray(stored.locations) ? stored.locations.filter(Boolean) : [],
      remoteOnly: Boolean(stored.remoteOnly),
    };
  } catch {
    return { ...defaultFilters };
  }
}

function saveFilters() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  writeUrl();
  renderSummary();
}

function readToggles() {
  try {
    const stored = JSON.parse(localStorage.getItem(TOGGLES_KEY));
    if (!stored || typeof stored !== "object") {
      const defaults = {};
      portals.forEach(p => defaults[p.id] = true);
      return defaults;
    }
    // ensure all portals have an entry
    portals.forEach(p => {
      if (stored[p.id] === undefined) stored[p.id] = true;
    });
    return stored;
  } catch {
    const defaults = {};
    portals.forEach(p => defaults[p.id] = true);
    return defaults;
  }
}

function saveToggles() {
  localStorage.setItem(TOGGLES_KEY, JSON.stringify(toggles));
}

/* ── Search History ────────────────────────────────── */
function readHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveToHistory(f) {
  if (!f.keywords.trim()) return;
  let history = readHistory();
  // remove duplicates by keywords
  history = history.filter(h => h.keywords !== f.keywords);
  history.unshift({ ...f });
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function removeFromHistory(index) {
  let history = readHistory();
  history.splice(index, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function restoreFromHistory(entry) {
  filters = { ...defaultFilters, ...entry, locations: [...(entry.locations || [])] };
  saveFilters();
  renderPortals();
  showToast("Filters restored from history", "info");
}

function renderHistory() {
  const history = readHistory();
  if (!history.length) {
    historySection.style.display = "none";
    return;
  }
  historySection.style.display = "";
  historyList.innerHTML = "";

  history.forEach((entry, idx) => {
    const chip = document.createElement("div");
    chip.className = "history-chip";
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");

    const label = document.createElement("span");
    const parts = [entry.keywords];
    if (entry.locations && entry.locations.length) parts.push(entry.locations.slice(0, 2).join(", "));
    label.textContent = parts.join(" · ");

    const removeBtn = document.createElement("button");
    removeBtn.className = "history-remove";
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", "Remove this search");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromHistory(idx);
    });

    chip.appendChild(label);
    chip.appendChild(removeBtn);

    chip.addEventListener("click", () => restoreFromHistory(entry));
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); restoreFromHistory(entry); }
    });

    historyList.appendChild(chip);
  });
}

/* ── URL State ─────────────────────────────────────── */
function writeUrl() {
  const params = new URLSearchParams();
  setQuery(params, "q", filters.keywords.trim());
  setQuery(params, "minExp", filters.minExperience);
  setQuery(params, "maxExp", filters.maxExperience);
  setQuery(params, "minSal", filters.minSalary);
  setQuery(params, "maxSal", filters.maxSalary);
  setQuery(params, "date", filters.datePosted === "any" ? "" : filters.datePosted);
  setQuery(params, "remote", filters.remoteOnly ? "1" : "");
  setQuery(params, "type", filters.jobType === "any" ? "" : filters.jobType);
  setQuery(params, "sort", filters.sortBy === "relevance" ? "" : filters.sortBy);
  setQuery(params, "customLoc", filters.customLocation);
  setQuery(params, "loc", filters.locations.join("|"));
  const next = `${location.pathname}${params.toString() ? `?${params}` : ""}`;
  history.replaceState(null, "", next);
}

function setQuery(params, key, value) {
  if (value) params.set(key, value);
}

function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  if (![...params.keys()].length) return;
  filters = {
    ...filters,
    keywords: params.get("q") || "",
    minExperience: params.get("minExp") || "",
    maxExperience: params.get("maxExp") || "",
    minSalary: params.get("minSal") || "",
    maxSalary: params.get("maxSal") || "",
    datePosted: params.get("date") || "any",
    remoteOnly: params.get("remote") === "1",
    jobType: params.get("type") || "any",
    sortBy: params.get("sort") || "relevance",
    customLocation: params.get("customLoc") || "",
    locations: (params.get("loc") || "").split("|").filter(Boolean),
  };
}

/* ── Form ──────────────────────────────────────────── */
function fillForm() {
  form.elements.keywords.value = filters.keywords;
  form.elements.minExperience.value = filters.minExperience;
  form.elements.maxExperience.value = filters.maxExperience;
  form.elements.minSalary.value = filters.minSalary;
  form.elements.maxSalary.value = filters.maxSalary;
  form.elements.datePosted.value = filters.datePosted;
  form.elements.remoteOnly.checked = filters.remoteOnly;
  form.elements.jobType.value = filters.jobType;
  form.elements.sortBy.value = filters.sortBy;
  form.elements.customLocation.value = filters.customLocation || "";
  renderLocationChips();
}

function readForm() {
  filters = {
    keywords: form.elements.keywords.value.trim(),
    minExperience: form.elements.minExperience.value,
    maxExperience: form.elements.maxExperience.value,
    minSalary: form.elements.minSalary.value,
    maxSalary: form.elements.maxSalary.value,
    datePosted: form.elements.datePosted.value,
    remoteOnly: form.elements.remoteOnly.checked,
    jobType: form.elements.jobType.value,
    sortBy: form.elements.sortBy.value,
    customLocation: form.elements.customLocation.value.trim(),
    locations: [...filters.locations],
  };
}

function validateFilters() {
  if (!filters.keywords.trim()) return "Enter search keywords first.";
  if (Number(filters.maxExperience) && Number(filters.minExperience) > Number(filters.maxExperience)) {
    return "Min experience cannot exceed max experience.";
  }
  if (Number(filters.maxSalary) && Number(filters.minSalary) > Number(filters.maxSalary)) {
    return "Min salary cannot exceed max salary.";
  }
  return "";
}

/* ── Location Chips ────────────────────────────────── */
function renderLocationChips() {
  locationChips.innerHTML = "";
  locations.forEach((locName) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = filters.locations.includes(locName) ? "chip active" : "chip";
    btn.textContent = locName;
    btn.setAttribute("aria-pressed", String(filters.locations.includes(locName)));
    btn.addEventListener("click", () => {
      if (filters.locations.includes(locName)) {
        filters.locations = filters.locations.filter(l => l !== locName);
      } else {
        filters.locations.push(locName);
      }
      renderLocationChips();
    });
    locationChips.appendChild(btn);
  });
}

/* ── Summary ───────────────────────────────────────── */
function renderSummary() {
  const title = document.getElementById("summaryTitle");
  const text = document.getElementById("summaryText");
  const parts = [];

  if (filters.locations.length) parts.push(filters.locations.join(", "));
  if (filters.customLocation) parts.push(filters.customLocation);
  if (filters.minExperience || filters.maxExperience) {
    parts.push(`${filters.minExperience || "0"}–${filters.maxExperience || "any"} yrs`);
  }
  if (filters.minSalary || filters.maxSalary) {
    parts.push(`₹${filters.minSalary || "0"}–${filters.maxSalary || "any"} LPA`);
  }
  if (filters.jobType !== "any") parts.push(filters.jobType);
  if (filters.remoteOnly) parts.push("Remote");

  title.textContent = filters.keywords || "Set filters";
  text.textContent = parts.length ? parts.join(" · ") : "Tap to configure your search filters.";
}

/* ── Toast Notifications ───────────────────────────── */
function showToast(message, type = "info", duration = 3000) {
  const icons = { success: "✓", warning: "⚠", error: "✕", info: "ℹ" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
}

/* ── Portal Rendering ──────────────────────────────── */
function renderPortals() {
  portalGrid.innerHTML = "";

  portals.forEach((portal, index) => {
    const card = document.createElement("div");
    card.className = "portal-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    if (!toggles[portal.id]) card.classList.add("disabled");
    card.style.animationDelay = `${index * 80}ms`;

    // Toggle switch
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = `portal-toggle ${toggles[portal.id] ? "active" : ""}`;
    toggle.setAttribute("aria-label", `Toggle ${portal.name}`);
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggles[portal.id] = !toggles[portal.id];
      saveToggles();
      toggle.classList.toggle("active");
      card.classList.toggle("disabled");
    });

    // Icon
    const icon = document.createElement("span");
    icon.className = "app-icon";

    const image = document.createElement("img");
    image.src = iconUrl(portal.logo);
    image.alt = `${portal.name} logo`;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      image.remove();
      icon.textContent = portal.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
      icon.classList.add("icon-fallback");
    });
    icon.appendChild(image);

    // Label
    const label = document.createElement("span");
    label.className = "portal-label";
    label.textContent = portal.name;

    // Filter badge
    const badge = document.createElement("span");
    const total = 7;
    const pct = Math.round((portal.filterSupport / total) * 100);
    badge.className = `filter-badge ${pct >= 70 ? "high" : "medium"}`;
    badge.textContent = `${portal.filterSupport}/${total} filters`;
    badge.title = `Supports: ${portal.supportedFilters.join(", ")}`;

    // URL Preview tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "url-preview";
    tooltip.textContent = "Set filters to preview URL";

    card.append(toggle, icon, label, badge, tooltip);

    function handleCardClick(e) {
      // Don't trigger card action when clicking the toggle
      if (e.target.closest(".portal-toggle")) return;
      if (!toggles[portal.id]) return;
      const error = validateFilters();
      if (error) {
        formError.textContent = error;
        openEditor();
        return;
      }
      const url = portal.build(filters);
      window.open(url, "_blank", "noopener,noreferrer");
      showToast(`Opening ${portal.name}…`, "info", 2000);
    }
    card.addEventListener("click", handleCardClick);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(e); }
    });

    // Update tooltip on hover
    card.addEventListener("mouseenter", () => {
      if (filters.keywords.trim()) {
        try { tooltip.textContent = portal.build(filters); }
        catch { tooltip.textContent = "Could not build URL"; }
      }
    });

    portalGrid.appendChild(card);
  });
}

/* ── Open All with Progress ────────────────────────── */
function openAllPortals() {
  const error = validateFilters();
  if (error) {
    formError.textContent = error;
    openEditor();
    return;
  }

  const active = portals.filter(p => toggles[p.id]);
  if (!active.length) {
    showToast("No portals enabled. Toggle at least one.", "warning");
    return;
  }

  if (!window.confirm(`Open ${active.length} portal${active.length > 1 ? "s" : ""} in new tabs?`)) return;

  // Show progress indicator
  const progress = document.createElement("div");
  progress.className = "open-progress";
  progress.innerHTML = `
    <span class="progress-text">Opening 0/${active.length}…</span>
    <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
  `;
  document.body.appendChild(progress);

  let opened = 0;
  active.forEach((portal, i) => {
    setTimeout(() => {
      window.open(portal.build(filters), "_blank", "noopener,noreferrer");
      opened++;
      progress.querySelector(".progress-text").textContent = `Opening ${opened}/${active.length}…`;
      progress.querySelector(".progress-fill").style.width = `${(opened / active.length) * 100}%`;

      if (opened === active.length) {
        setTimeout(() => {
          progress.querySelector(".progress-text").textContent = `All ${active.length} opened ✓`;
          setTimeout(() => progress.remove(), 1500);
        }, 400);
      }
    }, i * 350); // stagger to avoid popup blockers
  });
}

/* ── Editor ────────────────────────────────────────── */
function openEditor() {
  fillForm();
  formError.textContent = "";
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeEditor() {
  dialog.close();
}

/* ── Event Listeners ───────────────────────────────── */
document.getElementById("openEditor").addEventListener("click", openEditor);
document.getElementById("openAll").addEventListener("click", openAllPortals);
summaryCard.addEventListener("click", openEditor);
summaryCard.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEditor(); }
});

document.getElementById("closeEditor").addEventListener("click", closeEditor);

document.getElementById("clearLocations").addEventListener("click", () => {
  filters.locations = [];
  renderLocationChips();
});

document.getElementById("resetFilters").addEventListener("click", () => {
  filters = { ...defaultFilters, locations: [] };
  fillForm();
  formError.textContent = "";
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  readForm();
  const error = validateFilters();
  if (error) {
    formError.textContent = error;
    return;
  }
  saveFilters();
  saveToHistory(filters);
  closeEditor();
  renderPortals(); // refresh URL previews
  showToast("Filters saved successfully!", "success");
});

/* ── Initialise ────────────────────────────────────── */
loadFromUrl();
saveFilters();
renderPortals();
renderHistory();
