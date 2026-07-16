/**
 * Google Analytics Event Tracking
 * 
 * Pushes custom events to the GTM dataLayer for GA4 tracking.
 * All tracking logic is isolated here to keep it separate from application logic.
 * 
 * See event-tracking-documentation.md for a full reference of all tracked events.
 */

// ─── Helper ────────────────────────────────────────────────────
function trackEvent(eventName, eventCategory, eventLabel) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    event_category: eventCategory,
    event_label: eventLabel,
    page_location: window.location.pathname
  });
}

/**
 * Derive a navigation label from a link/button element.
 * Uses the trimmed text content, lowercased, with accents stripped.
 */
function getNavLabel(el) {
  const text = el.textContent.trim().toLowerCase();
  // Normalise "resumé" → "resume"
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ─── Attach listeners on DOM ready ─────────────────────────────
function initAnalytics() {
  const bodyClass = document.body.className;

  // ─────────────────────────────────────────────────────────────
  // 1. NAVIGATION — Home hero nav (index page only)
  // ─────────────────────────────────────────────────────────────
  if (bodyClass.includes('home')) {
    document.querySelectorAll('.home-nav > a, .home-nav > button').forEach(el => {
      el.addEventListener('click', () => {
        trackEvent('click_nav_link', 'home_nav', getNavLabel(el));
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. NAVIGATION — Main navbar (all pages with navbar component)
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.main-nav-list-items a, .main-nav-list-items button').forEach(el => {
    el.addEventListener('click', () => {
      trackEvent('click_nav_link', 'main_nav', getNavLabel(el));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. NAVIGATION — Footer nav (all pages with footer component)
  // ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.footer-nav a, .footer-nav button').forEach(el => {
    el.addEventListener('click', () => {
      trackEvent('click_nav_link', 'footer_nav', getNavLabel(el));
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. ABOUT PAGE — Experience details (company toggles)
  // ─────────────────────────────────────────────────────────────
  if (bodyClass.includes('about')) {
    const companyMap = {
      'springer nature': 'springer_nature',
      'farfetch': 'farfetch',
      'esapiens': 'esapiens',
      'triata': 'triata'
    };

    document.querySelectorAll('.experience-details summary').forEach(summary => {
      summary.addEventListener('click', () => {
        const img = summary.querySelector('.experience-image img');
        if (img) {
          const alt = img.alt.toLowerCase();
          for (const [key, label] of Object.entries(companyMap)) {
            if (alt.includes(key)) {
              trackEvent('click_experience', 'about', label);
              break;
            }
          }
        }
      });
    });

    // ───────────────────────────────────────────────────────────
    // 5. ABOUT PAGE — LinkedIn profile & Resumé (PDF) links
    // ───────────────────────────────────────────────────────────
    document.querySelectorAll('.skillset .cv-btn a').forEach(link => {
      link.addEventListener('click', () => {
        const href = link.getAttribute('href') || '';
        if (href.includes('linkedin')) {
          trackEvent('click_cta', 'about', 'linkedin_profile');
        } else if (href.includes('cv') || href.includes('resume')) {
          trackEvent('click_cta', 'about', 'resume_pdf');
        }
      });
    });

    // ───────────────────────────────────────────────────────────
    // 6. ABOUT PAGE — Testimonial author clicks (picture + name)
    // ───────────────────────────────────────────────────────────
    const testimonialMap = {
      'sara': 'sara_cruz',
      'leandro': 'leandro_kitamura',
      'felipe': 'felipe_trevisan',
      'cinthia': 'cinthia_nakazato',
      'cínthia': 'cinthia_nakazato'
    };

    document.querySelectorAll('.testimonial-detail-author a').forEach(link => {
      link.addEventListener('click', () => {
        const text = (link.textContent + ' ' + (link.querySelector('img')?.alt || '')).toLowerCase();
        for (const [key, label] of Object.entries(testimonialMap)) {
          if (text.includes(key)) {
            trackEvent('click_testimonial', 'about', label);
            break;
          }
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 7. CASE STUDY — Figma prototype links (Subject Pages)
  // ─────────────────────────────────────────────────────────────
  if (bodyClass.includes('subject-pages')) {
    document.querySelectorAll('.cv-btn a[aria-label*="igma"]').forEach(link => {
      link.addEventListener('click', () => {
        const label = link.getAttribute('aria-label')?.toLowerCase().includes('desktop') ? 'desktop' : 'mobile';
        trackEvent('click_figma_prototype', 'case_study_subject_pages', label);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 8. CASE STUDY — Figma prototype links (Journal Finder)
  // ─────────────────────────────────────────────────────────────
  if (bodyClass.includes('journal-finder')) {
    document.querySelectorAll('.cv-btn a[aria-label*="igma"]').forEach(link => {
      link.addEventListener('click', () => {
        const label = link.getAttribute('aria-label')?.toLowerCase().includes('desktop') ? 'desktop' : 'mobile';
        trackEvent('click_figma_prototype', 'case_study_journal_finder', label);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 9. EMAIL DIALOG — Copy button
  // ─────────────────────────────────────────────────────────────
  const copyBtn = document.querySelector('.btn-copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      trackEvent('click_copy_email', 'email', 'copy');
    });
  }
}

// Safe DOM-ready: handles both cases — already loaded or still loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalytics);
} else {
  initAnalytics();
}
