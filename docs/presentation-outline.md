# VEGAH Technical Evaluation – 5–10 Minute Walkthrough

1. **Problem (1 min):** A web app should remain reachable if its primary cloud application endpoint becomes unhealthy.
2. **Architecture (2 min):** Next.js + Node.js API, PostgreSQL, Azure App Service primary, AWS App Runner secondary, Azure Traffic Manager priority routing.
3. **Application demo (1 min):** Create, list and delete notes; show `/api/health`.
4. **CI/CD (1–2 min):** Explain GitHub Actions build, lint, Docker build, registry push and cloud deployment. Explain OIDC and least privilege.
5. **Failover demo (2 min):** Show Azure serving, simulate a controlled primary failure, show probe/DNS change, then show the same hostname served by AWS.
6. **Results and limitations (1 min):** Present measured failover time and evidence. Explain DNS caching and that PostgreSQL is shared rather than replicated.

Only report timings and results that you actually measured.
