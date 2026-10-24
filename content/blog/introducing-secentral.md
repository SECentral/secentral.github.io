---
title: "Introducing SECentral: SELinux observability on your own infrastructure"
date: 2026-10-26
description: Why SECentral exists and how it brings SELinux denials, audit evidence, and configuration drift into one place.
summary: Conversations about SELinux in large organizations revealed a familiar gap. SECentral is an attempt to make investigation across hosts easier, without giving up control of your infrastructure.
---

Investigating SELinux problems across a fleet shouldn’t mean piecing together audit logs host by host. SECentral aims to make that work more like investigating application errors: related denials are grouped into issues, while each occurrence and its evidence remain available.

As a sysadmin with more than 20 years of experience, I’ve discussed SELinux many times throughout my career. It’s a valuable security feature, but it’s often considered difficult to manage. As a result, some organizations set it to Permissive mode or disable it entirely; a serious mistake, in my view.

Tools to work with SELinux like `sesearch`, `ausearch`, `audit2allow` or even `Cockpit` are typically used locally on individual hosts. As a Red Hat employee, conversations with people in large organizations kept surfacing the same challenge: investigating SELinux problems across many hosts is difficult, and the evidence and context are scattered across machines and audit logs.

**SECentral grew out of that gap.**

## From audit events to an investigation

SECentral is a self-hosted observability and investigation tool for SELinux. A lightweight Go agent collects SELinux audit evidence and host state. The server retains that evidence, groups related denials, and provides a web interface for investigating them.

The distinction between an **issue** and an **occurrence** matters. If a service repeatedly attempts the same denied operation, you should be able to follow one issue rather than sift through an undifferentiated stream of messages. Individual
occurrences and their original audit evidence remain available when you need to look closer.

Grouping similar denials does not mean their causes are identical. The host,
observed configuration, and evidence at the time of each occurrence still matter.

## What you can explore

SECentral brings together:

- **Issues and occurrences:** investigate related denials and see where and how often they appear.
- **Evidence-backed guidance:** inspect supporting evidence, possible explanations, and next investigation steps.
- **Host visibility:** see agent reporting state, SELinux mode, and observed host configuration.
- **Configuration differences:** inspect observed changes and compare supported configuration families with applicable policy catalog references.
- **A centralized SELinux log:** explore individual events alongside the issue-oriented view.

Comparisons are bounded by the observations and references available. A configuration difference is a lead to investigate, not proof of a cause or of non-compliance.

## Keep control of the decision

A denial is not, by itself, evidence that an operation should be allowed. Blindly adding an allow rule can preserve an underlying problem, such as an incorrect file label or application configuration. Sometimes the restriction should stay in place.

SECentral helps explain what was observed and supports reviewed resolution workflows. It does not automatically deploy policy changes or treat `audit2allow` output as proof that access should be granted.

The server runs on your infrastructure. You manage the evidence and decide what to do with it.

## Deploy on your infrastructure

Run the containerized server with PostgreSQL, configure your operator account, and connect the `secentral-agents` on your Linux hosts. Validation has focused on AlmaLinux and RHEL 9 and 10 on x86_64.

Planned areas of development include MCP integration, Prometheus metrics, container and Kubernetes context, and webhooks and incident routing.

## Get started

Start with the [Quick Start](https://github.com/SECentral/server/blob/main/docs/quick-start.md)
to deploy the server and connect your agents.

Connect your hosts, follow a denial back to its evidence, and explore the configuration differences across your fleet.

[Report server or web-interface feedback](https://github.com/SECentral/server/issues) or [agent problems](https://github.com/SECentral/agent/issues). Include versions and a sanitized reproduction where possible; avoid posting credentials or private audit data. Contributions and practical investigation experiences are welcome on GitHub.

The SECentral application is MIT-licensed. See the server repository for details.
