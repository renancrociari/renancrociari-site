/**
 * Site Configuration
 * 
 * Configuração canônica do site no formato Portfolio-OS
 */

/** @type {import('@portfolio-os/core').SiteConfig} */
export const siteConfig = {
  name: 'Renan Crociari',
  bio: 'Senior Product Designer com 15+ anos de experiência em ideação, criação e liderança de experiências digitais.',
  
  seo: {
    title: 'Renan Crociari · Senior Product Designer',
    description: '15+ years of experience in ideating, crafting, and leading digital experiences for startups and well-established tech companies loved by millions of users.',
    ogImage: '/images/renan-og-image.jpg',
  },
  
  socials: [
    { platform: 'linkedin', url: 'https://www.linkedin.com/in/renancrociari/', label: 'LinkedIn' },
    { platform: 'medium', url: 'https://medium.com/@renancrociari', label: 'Medium' },
    { platform: 'dribbble', url: 'https://dribbble.com/renancrociari', label: 'Dribbble' },
  ],
  
  resume: '/public/downloads/renancrociari-cv.pdf',
  
  navigation: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/public/downloads/renancrociari-cv.pdf', label: 'Resumé' },
    { href: 'https://www.linkedin.com/in/renancrociari/', label: 'LinkedIn' },
  ],
  
  // Cases em destaque na home
  featuredWork: [
    'improving-the-performance-of-farfetchs-top-fashion-ecommerce-brands',
    'redesigning-the-mobile-experience-of-a-dating-platform',
    'connecting-every-discovery-with-a-worthy-home',
  ],
  
  // Slugs reservados (rotas do sistema)
  reservedSlugs: [
    'about',
    'api',
    'editor',
    'admin',
    'login',
    'logout',
    '404',
    '500',
  ],
  
  // Limites do editor
  editorLimits: {
    pages: 20,
  },
  
  // Tema (usamos o tema visual existente do site)
  theme: 'renancrociari-custom',
  
  // Configurações da home
  home: {
    headline: 'Great questions drive transformation',
    tagline: "Hiya, I'm Renan. A Senior Product Designer who turns relentless curiosity into State-of-the-art products.",
    selectedWorkTitle: 'Featured Work',
    selectedWorkSubtitle: '',
  },
  
  // Footer config
  footer: {
    contactHeading: "Let's connect",
    contactSubheading: "I'm always open for collabs or a coffee chat",
    email: '', // Preenchido via dialog
  },
};

/**
 * Retorna a lista de slugs reservados
 */
export function getReservedSlugs() {
  return siteConfig.reservedSlugs;
}

/**
 * Verifica se um slug é reservado
 * @param {string} slug
 */
export function isReservedSlug(slug) {
  return siteConfig.reservedSlugs.includes(slug.toLowerCase());
}

/**
 * Retorna a configuração do site
 */
export function getSiteConfig() {
  return siteConfig;
}
