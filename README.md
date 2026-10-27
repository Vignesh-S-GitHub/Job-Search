<div align="center">

# 🔎 Job Search Dashboard

**A reusable launchpad for Azure Data Engineering searches.**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-B88A00?style=flat-square&logo=javascript&logoColor=white)

[Features](#features) · [Quick start](#quick-start) · [Portal support](#portal-support)

</div>

---

A static dashboard that turns one set of keywords, location, and freshness preferences into links for five job platforms. It builds search URLs; it does not collect listings or submit applications.

<a id="features"></a>

## ✨ Features

- Azure Data Engineer, Databricks, PySpark, ADF, ADLS, SQL, and Python keyword defaults.
- Fresh **24h**, catch-up **7d**, and Databricks-focused presets; a **30d** filter is also available.
- Editable experience range, location, and sort preference.
- Individual portal launch buttons and an **Open all 5 portals** action.
- A shareable dashboard link containing your selected settings.

<p align="center">
  <img src="logos/linkedin.png" alt="LinkedIn" width="42" />
  <img src="logos/naukri.png" alt="Naukri" width="42" />
  <img src="logos/hirist.png" alt="Hirist" width="42" />
  <img src="logos/instahyre.png" alt="Instahyre" width="42" />
  <img src="logos/indeed.png" alt="Indeed" width="42" />
</p>

<a id="portal-support"></a>

## 🔗 Portal support

| Portal | What the code sends |
|---|---|
| LinkedIn | Keywords, location, freshness, full-time filter, and optional newest-first sort |
| Naukri | Keywords, location, minimum experience, freshness, and sort |
| Indeed India | Keywords, location, freshness, and sort |
| Hirist | A relevant Azure Databricks, Databricks, PySpark, or data-engineering category |
| Instahyre | The candidate's profile-matched opportunities page |

Not every dashboard field maps to every portal. In particular, maximum experience is retained in the dashboard URL but is not sent as a portal filter. Refine unsupported filters on the destination site; portals may change how they interpret URLs.

<a id="quick-start"></a>

## 🚀 Quick start

```bash
git clone https://github.com/Vignesh-S-GitHub/Job-Search.git
cd Job-Search
python -m http.server 8080
```

Open **http://localhost:8080**. You can also open `index.html` directly for basic use. There is no build step, package installation, or server application.

1. Choose a preset or edit your filters.
2. Open a portal and refine its filters if needed.
3. Copy the dashboard link to reuse the same settings later.

## 💾 Settings and privacy

Settings are encoded in the page's **query string**, not localStorage. Bookmark or copy that URL to retain them. Anyone with the shared URL can see its keywords and filters. Search links open the external job platforms; their accounts and results remain on those platforms. Browser popup controls may block opening all five at once.

## 📁 Repository guide

[index.html](index.html) defines the dashboard, [script.js](script.js) builds portal links and presets, [styles.css](styles.css) styles the cards, and [logos/](logos/) contains portal branding. [pages.yml](.github/workflows/pages.yml) publishes the static site. No automated tests are included.

## 🤝 Contributing

Open an issue with a reproducible example or submit a focused pull request. Keep setup instructions and documentation aligned with any behavior changes.

## 📄 License

No repository-level `LICENSE` file is currently included.
