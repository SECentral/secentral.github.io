---
title: "SECentral architecture: a self-hosted SELinux observability platform"
date: 2026-11-06
description: How SECentral uses Go, Rails, React and PostgreSQL to collect and investigate SELinux events across Linux hosts.
summary: How Go, Rails, React and PostgreSQL help SECentral stay approachable to deploy and develop.
---

SECentral is a self-hosted platform for investigating SELinux activity across Linux hosts. It's currently a solo project, so I need solid, proven foundations that support rapid prototyping while leaving room to grow. I chose each language and framework based on my experience, preferences, and the role it plays in the project. For more on why I started the project, see [Introducing SECentral](/blog/introducing-secentral/).

## How the pieces fit together

```text
Monitored Linux host                         SECentral server

  SELinux audit events
          │
          ▼
  SECentral agent ─── heartbeats ───────────┐
          │                                 │
          ▼                                 ▼
  Local spool ─────── audit events ──────► Rails application
  for delivery                            Preserves and processes evidence
                                                  │          │
                                                  ▼          ▼
                                             PostgreSQL   React web UI
                                             Stores data  Investigation
```

The agent collects and assembles audit evidence, writing events to a local spool before delivery. If the server is temporarily unavailable, it can retain those events and retry delivery later. Host state is sent separately as heartbeat checkpoints.

The server preserves the original evidence, processes and groups related events, and makes the results available through the web interface. For example, repeated denials can be presented as one issue, while the individual occurrences and their original audit evidence remain available for closer inspection.

This separation keeps the agent focused on collection and leaves
interpretation on the server. A denial is evidence to investigate, not automatically a reason to change SELinux policy.

The documented deployment runs the application alongside [PostgreSQL](https://www.postgresql.org/) and [Caddy](https://caddyserver.com/), which provides HTTPS. Agents authenticate using a shared ingestion key.

From Go to Rails and React, let's look at what each component uses and why.

## SECentral agent
The [agent](https://github.com/SECentral/agent) is the foundation of SECentral: it collects information from monitored hosts.

The agent must be lean, easy to ship, and secure. I chose Go largely based on my experience as a member of Fedora's [Go-SIG](https://fedoraproject.org/wiki/SIGs/Go). Rust could have been another option, but my familiarity with Go and the availability of a proven library like [`github.com/elastic/go-libaudit/v2`](https://github.com/elastic/go-libaudit) made the decision easy.

Shipping the agent as a compiled binary makes distribution simpler: monitored hosts do not need a Go runtime or Go libraries installed. The agent still relies on access to the host's audit subsystem and on SELinux tools like `semanage`, `semodule`, and `matchpathcon` for some inspection features.

At the time of writing, the agent has two direct Go module dependencies and no indirect dependencies listed in [`go.mod`](https://github.com/SECentral/agent/blob/main/go.mod). Keeping the dependency tree small makes the project easier to maintain and package.

A binary attached to a GitHub release is only part of the distribution story, though: it is not necessarily the most convenient way for users to install and update the agent.

That's why I created an RPM following Fedora's guidance (`go2rpm` and `go-vendor-tools`) and used [COPR](https://copr.fedorainfracloud.org/coprs/mikelo2/secentral-agent/) to build packages for Fedora and EPEL-compatible systems, including RHEL and AlmaLinux. The RPM also ships a hardened systemd service.

## SECentral server

The [server](https://github.com/SECentral/server) is the brain of the project. It combines several technologies in a container image published on [Quay.io](https://quay.io/repository/secentral/server).

Let's explore all the components:

### Backend
A [Ruby on Rails](https://rubyonrails.org/) backend supports rapid prototyping while providing established conventions for building the application. As a solo maintainer, I can build on those conventions instead of making every decision about the application's structure from scratch.

The current backend uses Rails 8.1 and Ruby 4.0.

### Frontend
I initially used Bootstrap, but switched to [PatternFly](https://www.patternfly.org/) early on. As a Red Hat employee, I had seen PatternFly evolve across products, and I thought its design would feel familiar to many sysadmins. Rather than create a custom interface, I could build on an established design system and its React components.

SECentral’s frontend is a [React](https://react.dev/) single-page application, served by the Rails application.

### Processing
While `secentral-agent` collects information, correlation, matching, and analysis happen on the server. The server image includes [SETools](https://github.com/SELinuxProject/setools) 4.6.0 and libsepol 3.11 to read SELinux policy artifacts and use policy facts in investigations. This lets the server analyze compatible policies from different host distributions, including examples from AlmaLinux 9 and Fedora 44.

### Database
PostgreSQL is the only supported database. It's a mature, well-established choice for Rails, and supporting one database keeps the application simpler to develop and test. PostgreSQL can run alongside the application in a container deployment, while larger deployments can use an external or managed database as their needs grow.


## SECentral webpage

A custom [Hugo](https://gohugo.io/) template generates the static SECentral website.

A static website does not require me to operate a server-side application for the site, reducing the attack surface and giving me a bit of peace of mind.

## Development and testing
### kcli
One of the first tools I adopted when I joined Red Hat more than 10 years ago was [`kcli`](https://github.com/karmab/kcli). Created by my friend [Karim Boumedhel](https://www.linkedin.com/in/karimboumedhel/), it lets me easily create and destroy VMs for testing. Profiles, plans, and a simple CLI help me manage the VMs and OS images I need to test `secentral-agent`. The tool can do much more, though, and is worth checking out!

## Closing
A small Go collector, centralized analysis in Rails, evidence stored in PostgreSQL, and a React and PatternFly interface give SECentral a proven foundation for a self-hosted solution.

If you want to try it, follow the [Quick Start](https://github.com/SECentral/server/blob/main/docs/quick-start.md)
to deploy the server and connect your first agent.
