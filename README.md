# Renan Crociari Portfolio Website

Senior Product Designer portfolio showcasing 15+ years of experience in digital product design.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start

### Development (HTTP)
```bash
# Install dependencies
npm install

# Start development server (HTTP)
npm run dev

# Or serve both original + generated pages
npm run dev:all
```

### Development (HTTPS)
```bash
# Setup SSL certificates (first time only)
npm run setup:ssl

# Start with HTTPS
npm start
```

### Content Management
```bash
# Validate content before building
npm run validate:content

# Generate HTML from Markdown
npm run build:content

# Start visual editor
npm run editor

# Build for production
npm run build
```

## 📁 Project Structure

```
renancrociari-2026/
├── content/                 # Markdown content source
│   ├── pages/              # Static pages (about, home)
│   └── work/               # Case studies
├── src/                     # Source files
│   ├── pages/              # HTML pages (legacy + generated)
│   ├── pages-generated/    # Auto-generated from content/
│   ├── components/         # Reusable HTML components
│   ├── styles/             # CSS files
│   ├── scripts/            # JavaScript files
│   ├── fonts/              # Web fonts
│   └── images/             # Project images and assets
├── public/                 # Static assets (favicons, manifests, downloads)
├── dist/                   # Build output (generated)
├── scripts/                # Build & utility scripts
│   ├── content/            # Content build scripts
│   ├── validate-frontmatter.js
│   ├── password-gate.js
│   ├── rollback.js
│   └── setup-ssl.sh
└── node_modules/           # Dependencies (generated)
```

## 🛠️ Tech Stack

- **Build Tool**: Parcel
- **Templating**: PostHTML Include
- **Styling**: Vanilla CSS
- **Content**: Markdown with YAML frontmatter
- **Deployment**: Static hosting

## 📝 Content Management

This site uses a content management system based on Markdown files with YAML frontmatter.

### Content Structure

```yaml
---
title: "Page Title"
slug: "page-slug"
type: "work" | "page"
status: "published" | "protected"
description: "Page description for SEO"
tags:
  - Tag 1
  - Tag 2
order: 1
featured_image: "../images/path/to/image.webp"
og_image: "../images/path/to/og-image.jpg"
created_at: "2024-01-01"
updated_at: "2024-06-01"
protected_password: "$2b$10$..."  # Only for protected content
---

# Markdown Content

Your content here using standard Markdown syntax.
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (HTTP, legacy pages only) |
| `npm run dev:all` | Start dev server (HTTP, all pages) |
| `npm start` | Start dev server with HTTPS |
| `npm run setup:ssl` | Generate SSL certificates for HTTPS |
| `npm run editor` | Start visual content editor |
| `npm run build:content` | Generate HTML from Markdown |
| `npm run validate:content` | Validate content frontmatter |
| `npm run backup` | Create backup of current build |
| `npm run rollback` | Restore from backup |
| `npm run build` | Full production build |
| `npm run build:legacy` | Build only legacy pages |

### Protected Content

Pages with `status: protected` require a password to view. The password hash is stored in `protected_password` field using BCrypt.

To view protected content:
1. Access the page URL
2. Enter the password in the gate
3. Content unlocks for the session

## 📝 Development Notes

- All source files are in the `src/` directory
- Components use PostHTML Include for reusability
- Build output goes to `dist/` directory
- Static assets (favicons, manifests) are in `public/`
- `.htaccess` file is automatically copied to `dist/` during build

## 🚀 Deployment

This project is configured for automated deployment to Umbler hosting via GitHub Actions.

### Prerequisites for Deployment

1. **GitHub CLI** - Required for triggering deployments from command line
   ```bash
   # Install GitHub CLI (macOS)
   brew install gh
   
   # Authenticate with GitHub
   gh auth login
   ```

2. **GitHub Secrets** - Already configured in the repository:
   - `UMBLER_SSH_HOST`
   - `UMBLER_SSH_USER`
   - `UMBLER_SSH_PORT`
   - `UMBLER_SSH_KEY`

### Deploy to Production

#### Option 1: Via GitHub CLI (Recommended)
```bash
# Trigger deployment
gh workflow run deploy-to-umbler.yml

# Check deployment status
gh run list --workflow=deploy-to-umbler.yml --limit 1

# View deployment logs
gh run view --log
```

#### Option 2: Via GitHub Actions UI
1. Go to [Actions tab](https://github.com/renancrociari/renancrociari-site/actions)
2. Select "Deploy to Umbler" workflow
3. Click "Run workflow"
4. Select branch (main) and confirm

### Deployment Process

When you trigger a deployment, GitHub Actions will:
1. ✅ Check out the latest code
2. ✅ Install dependencies (`npm ci`)
3. ✅ Build the project (`npm run build`)
4. ✅ Copy `.htaccess` to `dist/` folder
5. ✅ Sync `dist/` folder to Umbler via rsync
6. ✅ Your changes are live at [renancrociari.com](https://www.renancrociari.com)

### Manual Deployment (Alternative)

If you need to deploy manually without GitHub Actions:

```bash
# Build the project
npm run build

# Deploy via rsync (requires SSH key)
rsync -rlvz --delete --no-perms --no-owner --no-group --exclude='.git' \
  -e "ssh -i ~/.ssh/umbler_deploy -p 9922" \
  dist/ ssh-renancrociari-com@renancrociari-com.umbler.net:~/public/
```

### URL Structure

The site uses clean URLs via `.htaccess` rewriting:
- ✅ `https://www.renancrociari.com/about` (clean URL)
- ✅ `https://www.renancrociari.com/work` (clean URL)
- ❌ `/about.html` redirects to `/about`

## 🔧 Troubleshooting

### Deployment fails
- Check GitHub Actions logs for specific errors
- Verify GitHub secrets are configured correctly
- Ensure SSH key is authorized in Umbler panel
- **Rsync errors**: If you see "rsync error: some files/attrs were not transferred (code 23)", ensure you are using `--no-perms --no-owner --no-group` as shared hosting may not allow changing file ownership.

### 404 errors on deployed site
- Ensure `.htaccess` file is in `dist/` folder after build
- Check that `public/.htaccess` exists in the repository
- Verify build script includes: `&& cp public/.htaccess dist/.htaccess`

### GitHub CLI not authenticated
```bash
gh auth status
gh auth login
```

## 📄 License

This project is licensed under the ISC License.
