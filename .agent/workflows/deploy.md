---
description: Deploy the website to Umbler hosting
---

# Deploy to Umbler

This workflow triggers the GitHub Actions deployment to Umbler hosting.

## Prerequisites

- GitHub CLI must be installed and authenticated
- GitHub Actions workflow must be set up (`.github/workflows/deploy-to-umbler.yml`)
- GitHub secrets must be configured (see setup guide)

## Steps

// turbo
1. Trigger the deployment workflow:
```bash
gh workflow run deploy-to-umbler.yml
```

2. Check the deployment status:
```bash
gh run list --workflow=deploy-to-umbler.yml --limit 1
```

3. View deployment logs (if needed):
```bash
gh run view --log
```

## What Happens

1. GitHub Actions checks out your code
2. Installs dependencies with `npm ci`
3. Builds the project with `npm run build`
4. Connects to Umbler via SSH
5. Syncs the `dist/` folder to Umbler's `public/` directory
6. Your website is live!

## Troubleshooting

If deployment fails:
- Check the GitHub Actions logs in the repository
- Verify SSH credentials are correct in GitHub secrets
- Ensure Umbler hosting is accessible via SSH
