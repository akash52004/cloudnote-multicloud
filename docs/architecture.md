# CloudNote Architecture Notes

## Objective
Demonstrate a database-backed web application deployed in two cloud providers, with Azure as primary and AWS as secondary.

## Request path
1. User visits the custom hostname.
2. DNS resolves through Azure Traffic Manager.
3. Priority routing returns the Azure App Service endpoint while healthy.
4. If the Azure health probe fails, Traffic Manager stops returning the primary endpoint for new DNS lookups and returns the AWS App Runner endpoint.
5. Both application instances use the same PostgreSQL database, so notes remain available during application-tier failover.

## Components
- Next.js App Router UI.
- Next.js Node.js route handlers for notes CRUD and health.
- PostgreSQL for persistent data.
- Docker multi-stage image.
- Azure App Service Linux custom container.
- AWS App Runner from Amazon ECR.
- GitHub Actions with cloud OIDC federation.
- Azure Traffic Manager priority routing and HTTPS health probe.

## Design decisions and trade-offs
- One codebase and one immutable commit SHA image tag per deployment.
- Shared PostgreSQL simplifies consistency for this evaluation, but creates a database single point of failure and cross-cloud network dependency.
- Traffic Manager provides DNS failover, not an L7 reverse proxy. DNS TTL, recursive resolver caching and client behaviour affect observed failover time.
- Health endpoint includes a database query, so a database outage removes both endpoints from service rather than falsely reporting healthy application instances.

## Demo sequence
1. Show `/api/health` and UI provider badge on Azure.
2. Create a note.
3. Show Traffic Manager endpoint priorities and probe settings.
4. Cause a controlled Azure endpoint failure.
5. Observe health probe state and DNS answer change.
6. Refresh the same hostname and show AWS provider badge.
7. Verify the note still exists.
8. Restore Azure and show recovery behaviour.

## Limitations to disclose
- This setup provides application compute failover, not database failover.
- DNS failover is not instantaneous for all clients.
- A real production design should consider replicated/managed database HA, secrets management, TLS/custom-domain validation on both providers, WAF, observability, deployment approvals, rollback and tested disaster-recovery procedures.
