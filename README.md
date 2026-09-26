# NEXORA — Week 4: Performance Optimization

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla)-3ECF8E)](https://github.com/sakthivel-54/YUVA-NEXORA)

> **YuvaIntern Junior Frontend Developer Internship — Milestone 4**  
> Frontend Performance Engineering: Event Delegation, Cached DOM Selectors, Hardware-Accelerated Animations, and Script Deferral.

---

## 1. Milestone 4 Deliverables:
- **Event Delegation:** Unified document/parent listeners handle accordion toggles, modal dialogs, and toast buttons, dramatically lowering memory footprint.
- **Cached DOM References:** Stored references in `DOM` object eliminate redundant `document.getElementById` calls during runtime.
- **Hardware Acceleration:** Animations strictly utilize GPU-accelerated `transform` and `opacity` to prevent layout recalculations.
- **Non-blocking Execution:** Scripts use `defer` attribute to eliminate render-blocking on the critical path.
- **Zero Framework Footprint:** Pure vanilla architecture ensuring rapid FCP and minimal runtime overhead.

---

## 2. How to Run Locally

```bash
# Python 3
python -m http.server 8000
```
