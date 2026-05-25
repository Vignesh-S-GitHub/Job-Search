const STORAGE_KEY = "job-launcher-filters";

const locations = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Gurugram",
  "Mumbai",
  "Chennai",
  "Noida",
  "Delhi NCR",
  "Ahmedabad",
  "Kolkata",
  "Kochi",
  "Jaipur",
  "Remote India",
];

const dateDays = {
  "24h": "1",
  "3d": "3",
  "7d": "7",
  "14d": "14",
  "30d": "30",
};

const linkedinDate = {
  "24h": "r86400",
  "3d": "r259200",
  "7d": "r604800",
  "14d": "r1209600",
  "30d": "r2592000",
};

const defaultFilters = {
  keywords: "",
  minExperience: "",
  maxExperience: "",
  minSalary: "",
  maxSalary: "",
  datePosted: "any",
  remoteOnly: false,
  locations: [],
};

const portals = [
  {
    name: "LinkedIn Jobs",
    logo: "linkedin.png",
    build(filters) {
      const url = new URL("https://www.linkedin.com/jobs/search/");
      setParam(url, "keywords", filters.keywords);
      setParam(url, "location", locationText(filters));
      setParam(url, "f_TPR", linkedinDate[filters.datePosted]);
      setParam(url, "f_WT", filters.remoteOnly ? "2" : "");
      return url.toString();
    },
  },
  {
    name: "Naukri.com",
    logo: "naukri.png",
    build(filters) {
      const url = new URL("https://www.naukri.com/jobs");
      setParam(url, "k", filters.keywords);
      setParam(url, "l", locationText(filters));
      setParam(url, "experience", filters.minExperience);
      setParam(url, "ctcFilter", filters.minSalary);
      setParam(url, "jobAge", dateDays[filters.datePosted]);
      setParam(url, "wfhType", filters.remoteOnly ? "2" : "");
      return url.toString();
    },
  },
  {
    name: "Indeed India",
    logo: "indeed.png",
    build(filters) {
      const url = new URL("https://in.indeed.com/jobs");
      setParam(url, "q", keywordText(filters));
      setParam(url, "l", locationText(filters));
      setParam(url, "fromage", dateDays[filters.datePosted]);
      setParam(url, "remotejob", filters.remoteOnly ? "1" : "");
      return url.toString();
    },
  },
  {
    name: "Instahyre",
    logo: "instahyre.png",
    build(filters) {
      const url = new URL("https://www.instahyre.com/search-jobs/");
      setParam(url, "q", filters.keywords);
      setParam(url, "loc", locationText(filters));
      setParam(url, "exp", filters.minExperience);
      setParam(url, "remote", filters.remoteOnly ? "true" : "");
      return url.toString();
    },
  },
  {
    name: "Hirist",
    logo: "hirist.png",
    build(filters) {
      const url = new URL("https://www.hirist.tech/jobs");
      setParam(url, "keyword", filters.keywords);
      setParam(url, "loc", locationText(filters));
      setParam(url, "exp", filters.minExperience);
      setParam(url, "remote", filters.remoteOnly ? "true" : "");
      return url.toString();
    },
  },
  {
    name: "Foundit",
    logo: "foundit.png",
    build(filters) {
      const url = new URL("https://www.foundit.in/srp/results");
      setParam(url, "query", keywordText(filters));
      setParam(url, "locations", locationText(filters));
      setParam(url, "experienceRanges", filters.minExperience);
      setParam(url, "postedDate", dateDays[filters.datePosted]);
      return url.toString();
    },
  },
  {
    name: "Apna",
    logo: "apna.png",
    build(filters) {
      const url = new URL("https://apna.co/jobs");
      setParam(url, "keyword", keywordText(filters));
      setParam(url, "location", locationText(filters));
      setParam(url, "experience", filters.minExperience);
      return url.toString();
    },
  },
  {
    name: "Glassdoor India",
    logo: "glassdoor.png",
    build(filters) {
      const url = new URL("https://www.glassdoor.co.in/Job/jobs.htm");
      setParam(url, "sc.keyword", keywordText(filters));
      setParam(url, "locKeyword", locationText(filters));
      setParam(url, "fromAge", dateDays[filters.datePosted]);
      return url.toString();
    },
  },
  {
    name: "Shine.com",
    logo: "shine.png",
    build(filters) {
      const slug = slugify(filters.keywords) || "jobs";
      const url = new URL(`https://www.shine.com/job-search/${slug}-jobs`);
      setParam(url, "keyword", keywordText(filters));
      setParam(url, "location", locationText(filters));
      setParam(url, "experience", filters.minExperience);
      setParam(url, "minsalary", filters.minSalary);
      setParam(url, "posted", dateDays[filters.datePosted]);
      return url.toString();
    },
  },
  {
    name: "Cutshort",
    logo: "cutshort.png",
    build(filters) {
      const url = new URL("https://cutshort.io/jobs");
      setParam(url, "keywords", filters.keywords);
      setParam(url, "locations", locationText(filters));
      setParam(url, "minExp", filters.minExperience);
      setParam(url, "remote", filters.remoteOnly ? "true" : "");
      return url.toString();
    },
  },
];

let filters = readFilters();

const dialog = document.getElementById("filterDialog");
const form = document.getElementById("filterForm");
const formError = document.getElementById("formError");
const portalGrid = document.getElementById("portalGrid");
const locationChips = document.getElementById("locationChips");
const summaryCard = document.getElementById("summaryCard");

function setParam(url, key, value) {
  if (value !== undefined && value !== null && value !== "" && value !== false) {
    url.searchParams.set(key, String(value));
  }
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function locationText(value) {
  return value.locations.join(", ");
}

function keywordText(value) {
  return [value.keywords.trim(), value.remoteOnly ? "remote" : ""].filter(Boolean).join(" ");
}

function iconUrl(fileName) {
  return `logos/${fileName}`;
}

function readFilters() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || typeof stored !== "object") {
      return { ...defaultFilters };
    }

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

function writeUrl() {
  const params = new URLSearchParams();
  setQuery(params, "q", filters.keywords.trim());
  setQuery(params, "minExp", filters.minExperience);
  setQuery(params, "maxExp", filters.maxExperience);
  setQuery(params, "minSal", filters.minSalary);
  setQuery(params, "maxSal", filters.maxSalary);
  setQuery(params, "date", filters.datePosted === "any" ? "" : filters.datePosted);
  setQuery(params, "remote", filters.remoteOnly ? "1" : "");
  setQuery(params, "loc", filters.locations.join("|"));
  const next = `${location.pathname}${params.toString() ? `?${params}` : ""}`;
  history.replaceState(null, "", next);
}

function setQuery(params, key, value) {
  if (value) {
    params.set(key, value);
  }
}

function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  if (![...params.keys()].length) {
    return;
  }

  filters = {
    ...filters,
    keywords: params.get("q") || "",
    minExperience: params.get("minExp") || "",
    maxExperience: params.get("maxExp") || "",
    minSalary: params.get("minSal") || "",
    maxSalary: params.get("maxSal") || "",
    datePosted: params.get("date") || "any",
    remoteOnly: params.get("remote") === "1",
    locations: (params.get("loc") || "").split("|").filter(Boolean),
  };
}

function fillForm() {
  form.elements.keywords.value = filters.keywords;
  form.elements.minExperience.value = filters.minExperience;
  form.elements.maxExperience.value = filters.maxExperience;
  form.elements.minSalary.value = filters.minSalary;
  form.elements.maxSalary.value = filters.maxSalary;
  form.elements.datePosted.value = filters.datePosted;
  form.elements.remoteOnly.checked = filters.remoteOnly;
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
    locations: [...filters.locations],
  };
}

function validateFilters() {
  if (!filters.keywords.trim()) {
    return "Enter search keywords first.";
  }

  if (Number(filters.maxExperience) && Number(filters.minExperience) > Number(filters.maxExperience)) {
    return "Minimum experience cannot be greater than maximum experience.";
  }

  if (Number(filters.maxSalary) && Number(filters.minSalary) > Number(filters.maxSalary)) {
    return "Minimum salary cannot be greater than maximum salary.";
  }

  return "";
}

function renderLocationChips() {
  locationChips.innerHTML = "";

  locations.forEach((locationName) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = filters.locations.includes(locationName) ? "chip active" : "chip";
    button.textContent = locationName;
    button.setAttribute("aria-pressed", String(filters.locations.includes(locationName)));
    button.addEventListener("click", () => {
      if (filters.locations.includes(locationName)) {
        filters.locations = filters.locations.filter((item) => item !== locationName);
      } else {
        filters.locations.push(locationName);
      }
      renderLocationChips();
    });
    locationChips.appendChild(button);
  });
}

function renderSummary() {
  const title = document.getElementById("summaryTitle");
  const text = document.getElementById("summaryText");
  const parts = [];

  if (filters.locations.length) {
    parts.push(filters.locations.join(", "));
  }

  if (filters.minExperience || filters.maxExperience) {
    parts.push(`${filters.minExperience || "0"}-${filters.maxExperience || "any"} yrs`);
  }

  if (filters.minSalary || filters.maxSalary) {
    parts.push(`${filters.minSalary || "0"}-${filters.maxSalary || "any"} LPA`);
  }

  title.textContent = filters.keywords || "Set filters";
  text.textContent = parts.length ? parts.join(" / ") : "Tap to edit filters.";
}

function renderPortals() {
  portalGrid.innerHTML = "";

  portals.forEach((portal) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "portal-button";

    const icon = document.createElement("span");
    icon.className = "app-icon";

    const image = document.createElement("img");
    image.src = iconUrl(portal.logo);
    image.alt = `${portal.name} logo`;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      image.remove();
      icon.textContent = portal.name
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      icon.classList.add("icon-fallback");
    });

    const label = document.createElement("span");
    label.className = "portal-label";
    label.textContent = portal.name;

    icon.appendChild(image);
    button.append(icon, label);

    button.addEventListener("click", () => {
      const error = validateFilters();
      if (error) {
        formError.textContent = error;
        openEditor();
        return;
      }

      window.open(portal.build(filters), "_blank", "noopener,noreferrer");
    });

    portalGrid.appendChild(button);
  });
}

function openAllPortals() {
  const error = validateFilters();
  if (error) {
    formError.textContent = error;
    openEditor();
    return;
  }

  if (!window.confirm(`Open all ${portals.length} portals in new tabs?`)) {
    return;
  }

  portals.forEach((portal) => {
    window.open(portal.build(filters), "_blank", "noopener,noreferrer");
  });
}

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

document.getElementById("openEditor").addEventListener("click", openEditor);
document.getElementById("openAll").addEventListener("click", openAllPortals);
summaryCard.addEventListener("click", openEditor);
summaryCard.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openEditor();
  }
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  readForm();
  const error = validateFilters();
  if (error) {
    formError.textContent = error;
    return;
  }

  saveFilters();
  closeEditor();
});

loadFromUrl();
saveFilters();
renderPortals();
