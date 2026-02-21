# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Azure Durable Functions app (Node.js, JavaScript) that integrates **Cityworks** (work order management) with **OpenGov** (permitting/records platform) for the City of South Bend, IN. When a Cityworks work order status changes, this function transfers attachments from Cityworks to OpenGov and advances the workflow step.

## Commands

- **Install dependencies:** `npm install`
- **Start locally:** `npm start` (runs `func start` — requires [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-tools-local))
- **Debug in VS Code:** F5 / "Attach to Node Functions" launch config (attaches on port 9229)
- **No tests yet** — `npm test` is a placeholder

## Deployment

Pushes to `master` trigger the GitHub Actions workflow (`.github/workflows/master_opengov-cityworks.yml`) which builds and deploys to the Azure Function App `opengov-cityworks` (Production slot) using OIDC auth.

## Architecture

This is a **Durable Functions orchestration** using the v4 Node.js programming model with `durable-functions` alpha SDK.

### Entry & Registration (`src/index.js`)
Registers all components with the Azure Functions runtime. HTTP streaming is enabled.

### HTTP Starter (`src/starter/starter.js`)
- Route: `POST /api/orchestrators/{orchestratorName}`
- Accepts JSON body and starts the durable orchestration
- Expected payload: `{ "Status", "CityworksWOID", "OpenGovID", "RecordName" }`

### Orchestrator (`src/orchestrator/Cityworks-OpenGov-Orchestrator.js`)
Generator function that sequences the workflow. Uses `RetryOptions(5000ms, 3 retries)` for external API calls. Cronitor pings are sent throughout for monitoring. The flow:
1. **token** → authenticate with Cityworks
2. **images** → fetch work order attachments from Cityworks
3. For each attachment: **fileUpload** → **uploadImages** → **attachFile** (create file placeholder in OpenGov, upload binary via SAS URL, link to record)
4. **workflowUpdate** → advance the "VPA Mowing Abatement" workflow step to COMPLETE

### Activity Functions (`src/activity/`)

| Activity | Purpose |
|---|---|
| `token` | Authenticates against Cityworks API, returns session token |
| `images` | Fetches work order attachments, filters out those prefixed `Accela_` |
| `fileUpload` | Creates a file placeholder in OpenGov, returns file ID and SAS upload URL |
| `uploadImages` | Downloads attachment binary from Cityworks, uploads to OpenGov's Azure Blob SAS URL |
| `attachFile` | Links an uploaded file to an OpenGov record as an attachment |
| `workflowUpdate` | Finds the active "VPA Mowing Abatement" workflow step on the OpenGov record and marks it COMPLETE |
| `cronitorPing` | Sends monitoring pings to Cronitor (run/complete/fail states); skipped during orchestrator replay |

## Environment Variables

Required in `local.settings.json` (not committed) or Azure App Settings:
- `CITYWORKS_USER` / `CITYWORKS_PASS` — Cityworks API credentials
- `OPENGOV_TOKEN` — OpenGov API bearer token
- `CRON_URL` — Cronitor ping endpoint
- `AzureWebJobsStorage` — Azure Storage connection string (needed by Durable Functions)

## External APIs

- **Cityworks**: `https://app05.cityworksonline.com/CLIENT_SouthBendIN/Services/...`
- **OpenGov PLCE**: `https://api.plce.opengov.com/plce/v2/southbendin/...`
