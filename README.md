# OpenGov-Cityworks Durable Functions

![Build & Deploy](https://github.com/cityofsouthbend/OpenGov-Cityworks-Durable/actions/workflows/master_opengov-cityworks.yml/badge.svg)
![GitHub Issues](https://img.shields.io/github/issues/cityofsouthbend/OpenGov-Cityworks-Durable?label=open%20issues&color=orange)
![Last Commit](https://img.shields.io/github/last-commit/cityofsouthbend/OpenGov-Cityworks-Durable/master)
![Node Version](https://img.shields.io/badge/node-22-339933?logo=nodedotjs&logoColor=white)
![Azure Functions](https://img.shields.io/badge/Azure_Functions-v4-0078D4?logo=azurefunctions&logoColor=white)

An Azure Durable Functions orchestration that integrates **Cityworks** (work order management) with **OpenGov** (permitting & records) for the City of South Bend, IN.

When a Cityworks work order status changes, this function:
1. Authenticates with Cityworks and retrieves work order attachments
2. Uploads each attachment to OpenGov via Azure Blob SAS URLs
3. Links the uploaded files to the corresponding OpenGov record
4. Advances the "VPA Mowing Abatement" workflow step to COMPLETE

## Prerequisites

- [Node.js 22](https://nodejs.org/)
- [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-tools-local)

## Setup

```bash
npm install
```

Copy `local.settings.json` and add the required environment variables:

| Variable | Description |
|---|---|
| `CITYWORKS_USER` | Cityworks API username |
| `CITYWORKS_PASS` | Cityworks API password |
| `OPENGOV_TOKEN` | OpenGov API bearer token |
| `CRON_URL` | Cronitor monitoring ping endpoint |
| `AzureWebJobsStorage` | Azure Storage connection string (or use [Azurite](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azurite) for local dev) |

## Running Locally

```bash
npm start
```

This starts the Azure Functions host. The HTTP trigger is available at:

```
POST http://localhost:7071/api/orchestrators/Cityworks-OpenGov-OrchestratorOrchestrator
```

With a JSON body:
```json
{
  "Status": "...",
  "CityworksWOID": "12345",
  "OpenGovID": "abc-123",
  "RecordName": "..."
}
```

## Deployment

Pushes to `master` automatically build and deploy to the `opengov-cityworks` Azure Function App via GitHub Actions. The workflow uses OIDC authentication with Azure.

## Architecture

```
HTTP Request → starter.js → Orchestrator → token
                                          → images
                                          → fileUpload ─┐
                                          → uploadImages │ per attachment
                                          → attachFile  ─┘
                                          → workflowUpdate
                                          → cronitorPing (monitoring, throughout)
```

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.
