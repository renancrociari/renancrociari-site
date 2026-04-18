#!/usr/bin/env node

/**
 * Content Build Script
 * 
 * Converte arquivos MDX em content/pages e content/work para HTML,
 * pronto para o Parcel processar e gerar o site final.
 * 
 * Uso: node scripts/content/build-content.js
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', '..', 'content');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'src', 'pages-generated');

const TEMPLATE_PAGE = `<!DOCTYPE html>
<html lang="en">

<head>
  <!-- Google Tag Manager -->
  <script>(function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({
        'gtm.start':
          new Date().getTime(), event: 'gtm.js'
      }); var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
          'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-P7FKT9N');</script>
  <!-- End Google Tag Manager -->
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, width=device-width" />
  <title>{{TITLE}}</title>
  <meta name="description" content="{{DESCRIPTION}}" />
  <meta property="og:site_name" content="Renan Crociari" />
  <meta name="author" content="Renan Crociari">
  <meta property="og:type" content="website" />
  <link rel="canonical" href="{{CANONICAL}}" />
  <!-- Favicon -->
  <link rel="icon" href="../../public/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="../../public/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="../../public/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="../../public/favicon-16x16.png">
  <link rel="manifest" href="../../public/site.webmanifest">
  <link rel="mask-icon" href="../../public/safari-pinned-tab.svg" color="#5bbad5">
  <meta name="msapplication-TileColor" content="#38C545">
  <meta name="theme-color" content="#38C545">
  <!-- Open Graph -->
  <meta property="og:url" content="{{CANONICAL}}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{{TITLE}}">
  <meta property="og:description" content="{{DESCRIPTION}}">
  <meta property="og:image" content="{{OG_IMAGE}}">
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta property="twitter:domain" content="renancrociari.com">
  <meta property="twitter:url" content="{{CANONICAL}}">
  <meta name="twitter:title" content="{{TITLE}}">
  <meta name="twitter:description" content="{{DESCRIPTION}}">
  <meta name="twitter:image" content="{{OG_IMAGE}}">
  <!-- CSS -->
  <link rel="stylesheet" href="../styles/global.css" />
  <link rel="stylesheet" href="../styles/reset.css" />
  <link rel="stylesheet" href="../styles/main.css" />
  <!-- Fonts -->
  <link rel="preload" href="../fonts/degular.woff2" as="font" type="font/woff2" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&text=renancrociari" rel="stylesheet">
  <link rel="preload" href="../fonts/source-serif-regular-300.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../fonts/source-serif-bold-600.woff2" as="font" type="font/woff2" crossorigin>
  <!-- Scripts -->
  <script type="module" src="../scripts/script.js"></script>
</head>

<body class="{{BODY_CLASS}}">
  <!-- Google Tag Manager (noscript) -->
  <noscript>
    <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P7FKT9N" height="0" width="0"
      style="display:none;visibility:hidden">
    </iframe>
  </noscript>
  <!-- End Google Tag Manager (noscript) -->
  <include src="components/email-dialog.html"></include>
  <include src="components/navbar.html"></include>
  
  <!-- CONTENT_START -->
  {{CONTENT}}
  <!-- CONTENT_END -->
  
  <include src="components/password-dialog.html"></include>
  <include src="components/footer.html"></include>
</body>

</html>`;

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { data: {}, content };
    
    const data = {};
    const lines = match[1].split('\n');
    let currentKey = null;
    let currentArray = null;
    
    for (const line of lines) {
        if (line.includes(':')) {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            
            if (currentArray) {
                data[currentKey] = currentArray;
                currentArray = null;
            }
            
            if (value.startsWith('"') || value.startsWith("'")) {
                data[key.trim()] = value.slice(1, -1);
            } else if (value === 'null') {
                data[key.trim()] = null;
            } else if (!isNaN(value)) {
                data[key.trim()] = Number(value);
            } else {
                data[key.trim()] = value;
            }
            currentKey = key.trim();
        } else if (line.startsWith('  -')) {
            const value = line.replace('  -', '').trim();
            if (!currentArray) {
                currentArray = [];
                data[currentKey] = currentArray;
            }
            if (value.startsWith('"') || value.startsWith("'")) {
                currentArray.push(value.slice(1, -1));
            } else {
                currentArray.push(value);
            }
        }
    }
    
    return { data, content: match[2] };
}

function slugToHtml(content, slug, type) {
    const { data, content: mdxContent } = parseFrontmatter(content);
    
    const baseUrl = 'https://www.renancrociari.com';
    const titleSuffix = (type === 'page' && slug === 'about') ? 'About Me · Renan Crociari' : `${data.title} · Renan Crociari`;
    const canonical = type === 'page' 
        ? `${baseUrl}/${slug === 'home' ? '' : slug}`
        : `${baseUrl}/${slug}`;
    
    const bodyClass = type === 'page' 
        ? (slug === 'home' ? 'home' : 'about')
        : slugToBodyClass(slug);
    
    let htmlContent = '';
    
    if (type === 'page' && slug === 'home') {
        htmlContent = renderHomePage(data, mdxContent);
    } else if (type === 'page' && slug === 'about') {
        htmlContent = renderAboutPage(data, mdxContent);
    } else {
        htmlContent = renderWorkPage(data, mdxContent);
    }
    
    return TEMPLATE_PAGE
        .replaceAll('{{TITLE}}', data.title + ' · Renan Crociari')
        .replaceAll('{{DESCRIPTION}}', data.description || '')
        .replaceAll('{{CANONICAL}}', canonical)
        .replaceAll('{{OG_IMAGE}}', data.og_image ? `${baseUrl}/${data.og_image.replace('../', '')}` : `${baseUrl}/images/renan-og-image.jpg`)
        .replaceAll('{{BODY_CLASS}}', bodyClass)
        .replaceAll('{{CONTENT}}', htmlContent);
}

function slugToBodyClass(slug) {
    const map = {
        'farfetch-performance': 'farfetch',
        'dating-platform': 'sl-mobile',
        'journal-finder': 'journal-finder',
    };
    return map[slug] || 'default';
}

function renderHomePage(data, content) {
    const lines = content.split('\n');
    let html = '';
    
    html += '<header class="home-header wrapper">\n';
    html += '  <div class="home-logo-container">\n';
    html += '    <a class="home-logo-link btn btn-green body-small" href="/" aria-label="Renan Crociari logo">renancrociari</a>\n';
    html += '  </div>\n';
    html += '  <div class="home-hero">\n';
    html += '    <div class="hero-content">\n';
    
    // Extract hero content: content after frontmatter was removed by parseFrontmatter
    // Hero is from start until first --- separator (before Featured Projects)
    let heroContent = [];
    let inHero = true;
    
    for (const line of lines) {
        // Stop at --- separator
        if (line.trim() === '---') {
            break;
        }
        
        // Also stop at Featured Projects heading
        if (line.startsWith('# Featured Projects')) {
            break;
        }
        
        if (inHero) {
            heroContent.push(line);
        }
    }
    
    // Clean up hero content (remove empty lines at start)
    while (heroContent.length > 0 && heroContent[0].trim() === '') {
        heroContent.shift();
    }
    
    // Extract heading (first line starting with #) and body
    let heroTitle = '';
    let heroBody = [];
    
    for (let i = 0; i < heroContent.length; i++) {
        const line = heroContent[i];
        if (line.startsWith('# ') && !heroTitle) {
            heroTitle = line.substring(2).trim();
        } else {
            heroBody.push(line);
        }
    }
    
    // If no explicit heading found, use first non-empty line
    if (!heroTitle && heroContent.length > 0) {
        heroTitle = heroContent[0];
        heroBody = heroContent.slice(1);
    }
    
    // Render hero HTML with original formatting (line breaks preserved)
    const heroBodyHtml = heroBody
        .map(line => line.trim() === '' ? '<br>' : line)
        .join(' ')
        .replace(/<br>\s*<br>/g, '<br>')
        .trim();
    
    html += `      <h1 class="hero">${heroTitle}</h1>\n`;
    if (heroBodyHtml) {
        html += `      <span class="body-medium mt-xl">${heroBodyHtml}</span>\n`;
    }
    
    html += '    </div>\n';
    html += '  </div>\n';
    html += '</header>\n';
    
    // Parse and render featured projects
    html += '<section class="featured-projects wrapper">\n';
    
    const projects = parseFeaturedProjects(content);
    const cardClasses = ['card-4', 'card-1', 'card-2', 'card-3'];
    
    projects.forEach((project, index) => {
        const cardClass = cardClasses[index] || 'card-1';
        html += renderProjectCard(project, cardClass, index);
    });
    
    html += '</section>\n';
    
    return html;
}

function parseFeaturedProjects(content) {
    const lines = content.split('\n');
    const projects = [];
    let currentProject = null;
    let inFeaturedProjects = false;
    
    for (const line of lines) {
        if (line.startsWith('# Featured Projects')) {
            inFeaturedProjects = true;
            continue;
        }
        
        if (inFeaturedProjects) {
            if (line.startsWith('## ')) {
                // New project
                if (currentProject) {
                    projects.push(currentProject);
                }
                currentProject = {
                    title: line.substring(3).trim(),
                    description: [],
                    link: null
                };
            } else if (currentProject) {
                if (line.startsWith('[') && line.includes('](')) {
                    // Extract link
                    const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                    if (match) {
                        currentProject.link = {
                            text: match[1],
                            url: match[2]
                        };
                    }
                } else if (line.trim() !== '' && !line.startsWith('---')) {
                    currentProject.description.push(line.trim());
                }
            }
        }
    }
    
    if (currentProject) {
        projects.push(currentProject);
    }
    
    return projects;
}

function renderProjectCard(project, cardClass, index) {
    let html = `    <article class="project-card ${cardClass}">\n`;
    html += '      <div class="project-card-content">\n';
    html += `        <h2 class="t-white display-lg">${project.title}</h2>\n`;
    
    if (project.link) {
        html += `        <a class="btn body-medium btn-white" href="${project.link.url}">\n`;
        html += `          ${project.link.text}\n`;
        html += '          <div class="svg-button">\n';
        html += '            <svg viewBox="0 0 24.96 14.4" width="100%" xmlns="http://www.w3.org/2000/svg">\n';
        html += '              <path d="M17.5512 1.092C17.4649 1.18378 17.3963 1.29296 17.3496 1.41326C17.3028 1.53356 17.2787 1.6626 17.2787 1.79292C17.2787 1.92324 17.3028 2.05228 17.3496 2.17258C17.3963 2.29288 17.4649 2.40206 17.5512 2.49384L21.7897 7.03499H0.921394C0.677025 7.03499 0.442665 7.139 0.26987 7.32414C0.0970752 7.50928 0 7.76038 0 8.0222C0 8.28403 0.0970752 8.53513 0.26987 8.72026C0.677025 8.9054 0.677025 9.00941 0.921394 9.00941H21.7712L17.5512 13.521C17.3796 13.7059 17.2833 13.9561 17.2833 14.2169C17.2833 14.4777 17.3796 14.7279 17.5512 14.9129C17.7239 15.0968 17.9574 15.2 18.2008 15.2C18.4442 15.2 18.6778 15.0968 18.8504 14.9129L24.7105 8.63427C24.7893 8.55319 24.8521 8.45586 24.895 8.34814C24.9378 8.24041 24.9599 8.12451 24.9599 8.00739C24.9599 7.89028 24.9378 7.77438 24.895 7.66665C24.8521 7.55892 24.7893 7.4616 24.7105 7.38052L18.8596 1.092C18.774 0.999473 18.6721 0.92603 18.5598 0.875911C18.4475 0.825792 18.3271 0.799988 18.2054 0.799988C18.0838 0.799988 17.9634 0.825792 17.8511 0.875911C17.7388 0.92603 17.6369 0.999473 17.5512 1.092Z" />\n';
        html += '            </svg>\n';
        html += '          </div>\n';
        html += '        </a>\n';
    }
    
    html += '      </div>\n';
    html += '    </article>\n';
    
    return html;
}

function renderAboutPage(data, content) {
    const metadata = data;
    const mdx = content;

    let html = '<header class="content-header mt-5xl">\n';
    html += '  <div class="wrapper">\n';
    html += '    <div class="content-hero">\n';
    html += `      <h1 class="t-gray-200">${metadata.description}</h1>\n`;
    if (metadata.featured_image) {
        html += `      <figure class="featured-image mt-2xl">\n`;
        html += `        <img src="${metadata.featured_image}" class="featured-image-img" alt="Picture of Renan Crociari" fetchpriority="high" />\n`;
        html += '      </figure>\n';
    }
    html += '    </div>\n';
    html += '  </div>\n';
    html += '</header>\n';
    
    html += '<div class="article-content">\n';
    html += renderMdxContent(mdx);
    html += '</div>\n';
    
    return html;
}

function renderWorkPage(data, content) {
    const metadata = data;
    const mdx = content;

    let html = '';
    
    // Adicionar proteção de senha se status for protected
    if (metadata.status === 'protected' && metadata.protected_password) {
        html += `<meta name="protected-password" content="${metadata.protected_password}">\n`;
        html += '<script src="../scripts/password-gate.js"></script>\n';
    }
    
    html += '<header class="content-header mt-5xl">\n';
    html += '  <div class="wrapper">\n';
    html += '    <div class="content-hero">\n';
    html += `      <h1 class="t-white">${metadata.title}</h1>\n`;
    
    if (metadata.tags && metadata.tags.length) {
        html += '      <div class="tags body-small t-gray-300 mt-sm">\n';
        html += metadata.tags.join(' <span class="divider">/</span> ') + '\n';
        html += '      </div>\n';
    }
    
    if (metadata.featured_image) {
        html += '      <figure class="featured-image mt-2xl">\n';
        html += `        <img src="${metadata.featured_image}" class="featured-image-img" alt="${metadata.title}" fetchpriority="high" />\n`;
        html += '      </figure>\n';
    }
    html += '    </div>\n';
    html += '  </div>\n';
    html += '</header>\n';
    
    html += '<div class="article-content">\n';
    html += renderMdxContent(mdx);
    html += '</div>\n';
    
    return html;
}

function renderMdxContent(mdx) {
    const lines = mdx.split('\n');
    let html = '';
    let inList = false;
    let inTextBlock = false;
    let inFeaturedMetrics = false;
    let listItems = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];
        
        if (line.startsWith('# ') || line.startsWith('## ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            if (inTextBlock) { html += '</div>\n'; inTextBlock = false; }
            if (inFeaturedMetrics) { html += closingFeaturedMetrics(); inFeaturedMetrics = false; }
            
            const level = line.startsWith('# ') ? 'mt-5xl' : 'mt-3xl';
            const title = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            html += `<h2 class="${level}">${title}</h2>\n`;
            continue;
        }
        
        if (line.startsWith('### ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            if (inFeaturedMetrics) { html += closingFeaturedMetrics(); inFeaturedMetrics = false; }
            
            const title = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            html += `<h3 class="mt-2xl">${title}</h3>\n`;
            continue;
        }
        
        if (line.startsWith('**') && line.endsWith('**')) {
            const metric = line.replace(/\*\*/g, '');
            if (metric.includes('↑')) {
                const [label, value] = metric.split('↑');
                html += `<span class="metric-number display-xxxl"><span class="metric-number-arrow t-bold display-xl t-green-light">↑</span>${value}<span class="metric-number-percentage t-bold display-xl"></span></span>\n`;
            } else if (metric.includes('↓')) {
                const [label, value] = metric.split('↓');
                html += `<span class="metric-number display-xxxl"><span class="metric-number-arrow t-bold display-xl t-green-light">↓</span>${value}<span class="metric-number-percentage t-bold display-xl"></span></span>\n`;
            }
            continue;
        }
        
        if (line.startsWith('- ') || line.startsWith('* ')) {
            if (!inList) {
                html += '<ul class="ul">\n';
                inList = true;
            }
            const item = line.replace(/^-\s|\*\s/, '').replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>');
            html += `<li class="li mt-sm">${item}</li>\n`;
            continue;
        }
        
        if (line.startsWith('![')) {
            const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
            if (match) {
                const [, alt, src] = match;
                html += `<figure class="wrapper medium-zoom-medium mt-2xl">\n`;
                html += `  <img class="medium-zoom-image" src="${src}" style="width: 100%; height: auto;" alt="${alt}" loading="lazy" />\n`;
                html += '</figure>\n';
                if (nextLine && !nextLine.startsWith('![') && !nextLine.startsWith('#') && !nextLine.startsWith('-') && nextLine.trim()) {
                    html += `<figcaption class="body-small mt-xs t-ct">${nextLine}</figcaption>\n`;
                    i++;
                }
            }
            continue;
        }
        
        if (line.trim() === '') {
            if (inList) { html += '</ul>\n'; inList = false; }
            continue;
        }
        
        let p = line.replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>');
        html += `<p class="mt-md">${p}</p>\n`;
    }
    
    if (inList) html += '</ul>\n';
    if (inTextBlock) html += '</div>\n';
    if (inFeaturedMetrics) html += closingFeaturedMetrics();
    
    return html;
}

function openingFeaturedMetrics() {
    return '<div class="featured-metrics mt-3xl"><div class="wrapper"><h3 class="display-xl">Achievements</h3><div class="metrics-list">';
}

function closingFeaturedMetrics() {
    return '</div></div></div>';
}

async function buildContent() {
    console.log('🔨 Building content...\n');
    
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    const pagesDir = path.join(CONTENT_DIR, 'pages');
    const workDir = path.join(CONTENT_DIR, 'work');
    
    if (fs.existsSync(pagesDir)) {
        const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.md'));
        console.log(`📄 Pages: ${pages.length}`);
        
        for (const page of pages) {
            const content = fs.readFileSync(path.join(pagesDir, page), 'utf-8');
            const slug = page.replace('.md', '');
            const html = slugToHtml(content, slug, 'page');
            const outputFile = slug === 'home' ? 'index.html' : `${slug}.html`;
            fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), html);
            console.log(`  ✓ ${outputFile}`);
        }
    }
    
    console.log('');
    
    if (fs.existsSync(workDir)) {
        const works = fs.readdirSync(workDir).filter(f => f.endsWith('.md'));
        console.log(`📄 Work: ${works.length}`);
        
        for (const work of works) {
            const content = fs.readFileSync(path.join(workDir, work), 'utf-8');
            const slug = work.replace('.md', '');
            const html = slugToHtml(content, slug, 'work');
            fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), html);
            console.log(`  ✓ ${slug}.html`);
        }
    }
    
    console.log('\n✅ Content build complete!');
    console.log(`📁 Output: ${OUTPUT_DIR}`);
}

buildContent().catch(console.error);