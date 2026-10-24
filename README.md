# SECentral website

This repository contains the source for the SECentral public website at
[secentral.github.io](https://secentral.github.io/). The site introduces
SECentral, a self-hosted observability and investigation tool for SELinux.

## Built with

The site is built with [Hugo](https://gohugo.io/), using custom layouts and
styles rather than a packaged theme. It has no npm dependencies or JavaScript
build step.

## Local preview

Install Hugo, then run from the repository root:

```sh
hugo server
```

Open <http://localhost:1313/>. To generate the production site locally:

```sh
hugo --gc --cleanDestinationDir --minify --panicOnWarning
```

Generated files go into `public/`; Hugo's generated resources and local cache
are excluded from version control.

## Publishing

The GitHub Actions workflow builds and deploys the site to GitHub Pages when
changes are pushed to the `main` branch. Configure the repository's Pages
deployment source to **GitHub Actions** to enable publishing.

## About SECentral

SECentral helps teams investigate SELinux denials across hosts while retaining
the underlying audit evidence and observed host configuration. The agent
collects evidence and host state; the self-hosted server groups related
denials and provides the investigation interface.

- [SECentral server](https://github.com/SECentral/server)
- [SECentral agent](https://github.com/SECentral/agent)
- [Report a website issue](https://github.com/SECentral/secentral.github.io/issues)
