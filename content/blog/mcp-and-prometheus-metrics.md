---
title: "MCP and Prometheus Metrics"
date: 2026-11-24T15:24:27+01:00
description: Explore SECentral's Prometheus metrics and read-only MCP integration.
summary: A look at monitoring SELinux activity with Grafana and querying SECentral from OpenCode.
---

SECentral now provides two more ways to explore SELinux activity: [Prometheus](https://prometheus.io/) metrics for an overview of your installation, and a [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) interface for querying issue and host metadata from an assistant.

Both integrations are disabled by default and can be enabled with separate authentication tokens.

## An overview with Prometheus and Grafana

The server exposes an optional, authenticated Prometheus metrics endpoint. Prometheus can scrape it, and the [example Grafana dashboard](https://github.com/SECentral/server/blob/main/docs/metrics.md#grafana-dashboard) shows open issues, retained occurrences, host enforcement reports, agent contact and trends over time.

{{< blog-image src="/images/grafana-secentral-demo.png" alt="Grafana dashboard showing SECentral issue counts, host and agent states, and trends over three hours" width="1720" height="850" >}}

*The SECentral overview dashboard in Grafana, showing activity over three hours.*

The metrics are current aggregate **gauges**, making it easy to follow how issue counts, host reports and agent contact change over time.

See the [Prometheus metrics documentation](https://github.com/SECentral/server/blob/main/docs/metrics.md) for configuration and metric definitions.

## Asking AI about issues

The new MCP endpoint lets compatible AI assistants query SECentral's recorded investigation metadata. In this example, OpenCode uses the issue list to summarize open issues, their SELinux types, denied permissions and recorded dispositions:

{{< blog-image src="/images/mcp-opencode-demo.png" alt="OpenCode connected to SECentral through MCP, listing five synthetic SELinux issues" width="1368" height="1058" >}}

*OpenCode queries SECentral through MCP to summarize open issues.*

The read-only interface gives assistants access to issue and host metadata, making it possible to explore recorded activity through a conversation. Other compatible MCP clients can connect too. Over time, the interface can grow to support more investigation workflows, such as exploring configuration changes and audit evidence.

The [MCP documentation](https://github.com/SECentral/server/blob/main/docs/mcp.md) covers the available tools, authentication and an OpenCode configuration example.
