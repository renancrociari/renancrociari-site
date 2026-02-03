# Renan Crociari Portfolio Website

Senior Product Designer portfolio showcasing 15+ years of experience in digital product design.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

## 📁 Project Structure

```
renancrociari-2026/
├── src/                      # Source files
│   ├── pages/               # HTML pages
│   ├── components/          # Reusable HTML components
│   ├── styles/              # CSS files
│   ├── scripts/             # JavaScript files
│   ├── fonts/               # Web fonts
│   └── images/              # Project images and assets
├── public/                  # Static assets (favicons, manifests, downloads)
├── dist/                    # Build output (generated)
└── node_modules/            # Dependencies (generated)
```

## 🛠️ Tech Stack

- **Build Tool**: Parcel
- **Templating**: PostHTML Include
- **Styling**: Vanilla CSS
- **Deployment**: Static hosting

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
rsync -avzr --delete --exclude='.git' \
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
