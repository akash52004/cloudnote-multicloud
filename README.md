# CloudNote – Multi-Cloud Evaluation Project

A small Next.js App Router application with Node.js route handlers and PostgreSQL. It is designed to run as a Docker container on Azure App Service (primary) and AWS App Runner (secondary), with Azure Traffic Manager providing DNS-based priority failover.

## Features

- Create, list and delete notes using PostgreSQL.
- `/api/health` checks the database and reports `CLOUD_PROVIDER`.
- Docker multi-stage production image.
- Local PostgreSQL + application using Docker Compose.
- Separate GitHub Actions workflows for Azure and AWS.
- OIDC-based cloud authentication in the workflow templates.

## Architecture

```text
                         One hostname
                              |
                    Azure Traffic Manager
                    Priority routing + probes
                       /             \
              Azure App Service    AWS App Runner
                 (primary)           (secondary)
                       \             /
                        Shared PostgreSQL
```

**Important:** Traffic Manager is DNS-based. It does not proxy application traffic. DNS caching and resolver behaviour mean failover is not guaranteed to be instantaneous. Configure a low DNS TTL, use a suitable probe interval/tolerated failures, and measure the real failover from an external client.

The two application deployments use the same shared PostgreSQL database. This demonstrates application failover only; it does not provide database high availability or disaster recovery.

## Requirements

- Node.js 22 recommended (Node.js 20.9+ is sufficient for this app).
- Docker Desktop with WSL 2 backend.
- Git.
- A PostgreSQL database for cloud deployments that is reachable from both cloud services.

## Run locally with Docker Compose

1. Copy `.env.example` only if you want a local environment file; Compose has local database settings already.
2. From the project root, run:

```bash
docker compose up --build
```

3. Open `http://localhost:3000`.
4. Test the health endpoint: `http://localhost:3000/api/health`.
5. Create a note, refresh the page and verify it persists.
6. Stop the stack with `Ctrl+C`; remove containers with `docker compose down`. To remove local database data too, use `docker compose down -v`.

## Run locally without Docker

1. Install dependencies:

```bash
npm install
```

2. Create a PostgreSQL database and execute `database/schema.sql`.
3. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
4. Run:

```bash
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PGSSL` | Set `true` if the provider requires TLS |
| `CLOUD_PROVIDER` | `azure`, `aws`, `local`, or `local-docker` |

Set these as application environment variables in each cloud service. Never commit real credentials or connection strings.

## Azure deployment outline

1. Create an Azure Container Registry (ACR).
2. Create an Azure App Service Web App using a Linux custom container.
3. Configure App Service to pull the image from ACR (managed identity with `AcrPull` is preferred).
4. Configure `DATABASE_URL`, `PGSSL`, `CLOUD_PROVIDER=azure`, and `WEBSITES_PORT=3000` in App Service settings.
5. Configure GitHub OIDC federation for Azure and grant the deployment identity the minimum required permissions for ACR push and App Service update.
6. Add the Azure workflow secrets listed below.

## AWS deployment outline

1. Create an ECR repository.
2. Create an App Runner service using the ECR image.
3. Configure an App Runner ECR access role.
4. Configure `DATABASE_URL`, `PGSSL`, and `CLOUD_PROVIDER=aws` as App Runner runtime environment variables.
5. Configure GitHub OIDC federation in AWS and grant the role permission to push to ECR and update the specific App Runner service.
6. Add the AWS workflow secrets listed below.

## GitHub Actions secrets

### Azure workflow (`azure-deploy.yml`)

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_WEBAPP_NAME`
- `ACR_NAME`
- `ACR_LOGIN_SERVER`

The Azure identity must be configured for GitHub OIDC. It needs permissions to push to ACR and update the App Service. Configure the App Service's ACR pull identity separately.

### AWS workflow (`aws-deploy.yml`)

- `AWS_GITHUB_ACTIONS_ROLE_ARN`
- `AWS_REGION`
- `ECR_REPOSITORY`
- `APP_RUNNER_SERVICE_ARN`

The AWS role trust policy should restrict the GitHub OIDC subject to your repository and branch/environment. Its permissions should be limited to the target ECR repository and App Runner service.

## Traffic Manager failover outline

1. Create an Azure Traffic Manager profile using **Priority** routing.
2. Add the Azure App Service hostname as priority 1.
3. Add the AWS App Runner service hostname as priority 2.
4. Configure an HTTPS health probe to `/api/health` on port 443. The probe expects HTTP 200; the endpoint returns 503 if PostgreSQL is unavailable.
5. Set a low DNS TTL and configure probe interval/tolerated failures to meet the target as closely as possible.
6. Point your custom hostname's DNS record to the Traffic Manager profile as instructed by your DNS provider and Azure.
7. Verify normal routing, then simulate primary failure in a controlled test. Record the time of failure, probe detection, DNS response changes and client-observed switchover.

Traffic Manager endpoint monitoring can detect a failed Azure endpoint and return the AWS endpoint in DNS responses. It cannot force every client to immediately discard a cached DNS answer. Do not claim sub-five-minute failover until you have measured it from multiple clients/resolvers.

## Evidence checklist for the evaluation

- [ ] Screenshot showing hostname resolving to Azure during normal operation.
- [ ] Azure App Service logs and `/api/health` response showing `provider: azure`.
- [ ] Traffic Manager profile with priority endpoints and health probe configuration.
- [ ] Controlled primary failure and health-probe detection evidence.
- [ ] Same hostname resolving to AWS after failover.
- [ ] `/api/health` response showing `provider: aws`.
- [ ] Create a note before failover and verify the same note after failover.
- [ ] Successful Azure and AWS GitHub Actions runs.
- [ ] Explain the shared-database limitation and DNS caching behaviour.

## API

- `GET /api/health` – database health and serving provider.
- `GET /api/notes` – list notes.
- `POST /api/notes` – create a note (`{"title":"...","content":"..."}`).
- `DELETE /api/notes?id=1` – delete a note.

## Before presenting

This repository is a working starter implementation, not proof of a completed cloud deployment. You must create the cloud resources, configure secrets/identities, run the workflows, validate the application and collect real failover evidence. Review and test each workflow against your own resource names and cloud configuration before relying on it in the evaluation.
