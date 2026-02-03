/////////////////////////////////////////////////////////////////
///Função para controlar a dialog
/////////////////////////////////////////////////////////////////

const modal = document.querySelector('.dialog-show-email');
const openModal = document.querySelectorAll('.btn-show-email'); // Seleciona todos os botões que abrem a modal
const closeModal = document.querySelector('.btn-close-email');
const body = document.body;


// Função para abrir a dialog e adicionar um estado ao histórico
function openDialog() {

  body.classList.add('body-fixed'); // Add class to keep body fixed
  modal.showModal();
  modal.classList.remove('fade-out');

  // Adiciona um estado ao histórico quando a dialog é aberta
  history.pushState({ page: 'my-email' }, 'my-email', '#my-email');
}

// Função para fechar a dialog e manipular o histórico
function closeDialog() {
  modal.classList.add('fade-out');
  setTimeout(() => {
    modal.close();
    body.classList.remove('body-fixed'); // Remove the class


    // Remove the hash from the URL
    history.replaceState(null, '', window.location.pathname);
  }, 450);
}

// Adiciona evento de clique para todos os botões que abrem a modal
openModal.forEach(button => {
  button.addEventListener("click", openDialog);
});

// Adiciona evento de clique para o botão que fecha a modal
closeModal.addEventListener("click", closeDialog);

// Evento para fechar a dialog com a tecla ESC
// Evento para fechar a dialog com a tecla ESC
modal.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeDialog();
});

// Detecta quando o usuário clica em 'voltar' ou 'avançar' no navegador
window.addEventListener('popstate', (event) => {
  // Verifica se o estado do histórico corresponde à abertura da modal
  if (event.state && event.state.page === 'my-email') {
    openDialog();
  } else if (modal.hasAttribute('open')) {
    closeDialog();
  }
});

// Verifica se a URL contém o hash '#my-email' quando a página é carregada
document.addEventListener('DOMContentLoaded', (event) => {
  if (window.location.hash === '#my-email') {
    openDialog();
  }
});


/////////////////////////////////////////////////////////////////
///Função para controlar a password dialog
/////////////////////////////////////////////////////////////////

import mediumZoom from 'medium-zoom';
import { validatePassword, storeAuthToken, getRedirectUrl, isAuthenticated } from './password-auth.js';

const passwordModal = document.querySelector('.dialog-show-password');
const openPasswordModal = document.querySelectorAll('.btn-show-password');
const closePasswordModal = passwordModal?.querySelector('.btn-close-email');

if (passwordModal && openPasswordModal.length > 0) {
  const passwordInput = passwordModal.querySelector('input[type="password"]');
  const submitButton = passwordModal.querySelector('.btn-submit');
  const errorMessage = passwordModal.querySelector('.error-message');

  // Store current content ID
  let currentContentId = null;

  // Função para abrir a password dialog
  function openPasswordDialog(skipAnimation = false) {
    body.classList.add('body-fixed');

    // Add no-animation class to skip fade-in when opening from redirect
    if (skipAnimation) {
      passwordModal.classList.add('no-animation');
    } else {
      passwordModal.classList.remove('no-animation');
    }

    passwordModal.showModal();

    // Only remove fade-out class if not skipping animation
    // When redirected from protected page, we want instant display
    if (!skipAnimation) {
      passwordModal.classList.remove('fade-out');
    }

    // Clear previous input and errors
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.focus();
    }
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }

    history.pushState({ page: 'password-protected' }, 'password-protected', '#password-protected');
  }

  // Função para fechar a password dialog
  function closePasswordDialog() {
    passwordModal.classList.add('fade-out');
    setTimeout(() => {
      passwordModal.close();
      body.classList.remove('body-fixed');
      history.replaceState(null, '', window.location.pathname);
    }, 450);
  }

  // Show error message
  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
      setTimeout(() => {
        errorMessage.style.display = 'none';
      }, 3000);
    }
  }

  // Handle password submission
  async function handlePasswordSubmit() {
    const password = passwordInput?.value.trim();

    if (!password) {
      showError('Please enter a password');
      return;
    }

    if (!currentContentId) {
      showError('Content ID not found');
      console.error('No content ID set for password dialog');
      return;
    }

    // Show loading state with spinner
    const originalButtonContent = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<div class="btn-spinner"></div>';

    try {
      // Validate password
      const isValid = await validatePassword(currentContentId, password);

      if (isValid) {
        // Store auth token
        storeAuthToken(currentContentId);

        // Get redirect URL
        const redirectUrl = getRedirectUrl(currentContentId);

        if (redirectUrl) {
          // Redirect to protected page
          window.location.href = redirectUrl;
        } else {
          showError('Redirect URL not found');
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonContent;
        }
      } else {
        // Show error
        showError('Password incorrect');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonContent;
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (error) {
      console.error('Error validating password:', error);
      showError('An error occurred. Please try again.');
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonContent;
    }
  }

  // Adiciona evento de clique para todos os botões que abrem a password modal
  openPasswordModal.forEach(button => {
    button.addEventListener("click", () => {
      // Get content ID from data attribute
      currentContentId = button.dataset.contentId;

      // Check if user is already authenticated for this content
      if (isAuthenticated(currentContentId)) {
        // User is already authenticated, navigate directly to the protected page
        const redirectUrl = getRedirectUrl(currentContentId);
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      } else {
        // User is not authenticated, open password dialog
        openPasswordDialog();
      }
    });
  });

  // Submit on button click
  if (submitButton) {
    submitButton.addEventListener('click', handlePasswordSubmit);
  }

  // Submit on Enter key
  if (passwordInput) {
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePasswordSubmit();
      }
    });
  }

  // Adiciona evento de clique para o botão que fecha a password modal
  if (closePasswordModal) {
    closePasswordModal.addEventListener("click", closePasswordDialog);
  }

  // Evento para fechar a password dialog com a tecla ESC
  // Evento para fechar a password dialog com a tecla ESC
  passwordModal.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePasswordDialog();
  });

  // Detecta quando o usuário clica em 'voltar' ou 'avançar' no navegador
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page === 'password-protected') {
      openPasswordDialog();
    } else if (passwordModal.hasAttribute('open')) {
      closePasswordDialog();
    }
  });

  // Verifica se a URL contém o hash '#password-protected' quando a página é carregada
  // Also check for content ID in query params
  document.addEventListener('DOMContentLoaded', (event) => {
    if (window.location.hash.includes('#password-protected')) {
      // Extract content ID from query params if present
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const contentId = urlParams.get('content');
      if (contentId) {
        currentContentId = contentId;
      }
      // Skip animation when opening from redirect to prevent flash
      openPasswordDialog(true);
    }
  });
}


/////////////////////////////////////////////////////////////////
///Função para copiar email para a clipboard
/////////////////////////////////////////////////////////////////

async function copyToClipboard() {
  const emailSpan = document.querySelector(".email-to-copy");
  const emailText = emailSpan.innerText;

  try {
    await navigator.clipboard.writeText(emailText);
    const successMessage = document.querySelector(".success-message");
    successMessage.style.display = "block";
  } catch (error) {
    console.error("Erro ao copiar para a área de transferência:", error);
    const errorMessage = document.querySelector(".error-message");
    errorMessage.style.display = "block";
  }
}

// Attach event listener to copy button
const copyButton = document.querySelector('.btn-copy-email');
if (copyButton) {
  copyButton.addEventListener('click', copyToClipboard);
}



/////////////////////////////////////////////////////////////////
/// Função para controlar a navbar
/////////////////////////////////////////////////////////////////

const primaryNav = document.querySelector(".main-nav-list");
const navToggle = document.querySelector(".mobile-nav-toggle");

if (primaryNav && navToggle) {
  const focusableElements = primaryNav.querySelectorAll('.main-nav-a');

  // Function to update tabindex based on screen size and menu state
  const updateTabIndex = () => {
    const isMobile = window.getComputedStyle(navToggle).display !== 'none';
    const isVisible = primaryNav.getAttribute("data-visible") === "true";

    focusableElements.forEach(el => {
      if (isMobile) {
        // On mobile, only focusable if menu is open
        el.setAttribute('tabindex', isVisible ? '0' : '-1');
      } else {
        // On desktop, always focusable
        el.removeAttribute('tabindex');
      }
    });

    // Reset data-visible attribute when switching to desktop to prevent weird states
    if (!isMobile && isVisible) {
      primaryNav.setAttribute("data-visible", "false");
      navToggle.setAttribute('aria-expanded', "false");
      navbar.classList.remove('open');
      navbar.classList.add('closed');
      body.style.overflow = 'auto';
    }
  };

  navToggle.addEventListener("click", () => {
    const visibility = primaryNav.getAttribute("data-visible");

    if (visibility === "false") {
      primaryNav.setAttribute("data-visible", true);
      navToggle.setAttribute('aria-expanded', true);
      body.style.overflow = 'hidden';
      navbar.classList.add('open');
      navbar.classList.remove('closed');

      // Enable focus on elements
      focusableElements.forEach(el => el.removeAttribute('tabindex'));
      // Focus on the first link
      focusableElements[0].focus();

    } else if (visibility === "true") {
      primaryNav.setAttribute("data-visible", false);
      navToggle.setAttribute('aria-expanded', false);
      navbar.classList.remove('open');
      navbar.classList.add('closed');
      setTimeout(() => {
        body.style.overflow = 'auto';
      }, 450);

      // Disable focus on elements (mobile only logic handled by click, but safer to rely on state)
      focusableElements.forEach(el => el.setAttribute('tabindex', '-1'));
    }
  });

  // Handle keyboard navigation loop
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      const visibility = primaryNav.getAttribute("data-visible");
      const isMobile = window.getComputedStyle(navToggle).display !== 'none';

      if (isMobile && visibility === "true") {
        const firstFocusableElement = navToggle;
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstFocusableElement) {
            event.preventDefault();
            lastFocusableElement.focus();
          }
        } else { // Tab
          if (document.activeElement === lastFocusableElement) {
            event.preventDefault();
            firstFocusableElement.focus();
          }
        }
      }
    }
  });

  // Initial check and listen for resize
  updateTabIndex();
  window.addEventListener('resize', updateTabIndex);
}


/////////////////////////////////////////////////////////////////
/// Function to calculate Springer Nature Work duration
/////////////////////////////////////////////////////////////////

function calculateWorkDuration(startDate) {
  const start = new Date(startDate);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} yrs ${months} mos`;
}

// Example usage:
const startDate = '2021-01-01'; // Use your own start date
const workDurationElement = document.getElementById('workDuration');
if (workDurationElement) {
  workDurationElement.innerText = calculateWorkDuration(startDate);
}

/////////////////////////////////////////////////////////////////
/// Animate experience accordion details element
/////////////////////////////////////////////////////////////////


document.addEventListener('click', function (event) {
  let target = event.target;
  // Traverse up to find the closest summary or details element
  while (target != null && !target.matches('summary') && !target.matches('details')) {
    target = target.parentElement;
  }
  // Check if target is a summary child, find the summary in that case
  if (target && !target.matches('summary') && target.parentElement.matches('summary')) {
    target = target.parentElement;
  }
  // Proceed only if a summary element was clicked or a child of a summary
  if (target && target.matches('summary') && target.parentElement.matches('details')) {
    const detailsElement = target.parentElement;
    const contentElement = target.nextElementSibling; // Assuming this is the content to be animated

    // Chrome sometimes does not properly animate, ensure classes are managed
    if (contentElement.classList.contains('animation')) {
      contentElement.classList.remove('animation', 'collapsing');
      // Force reflow
      void contentElement.offsetWidth;
    }

    const onAnimationEnd = (callback) => {
      contentElement.addEventListener('animationend', (e) => {
        // Only respond to the grid-expand animation, ignore other animations
        if (e.animationName === 'grid-expand') {
          callback(e);
        }
      }, { once: true });
    };

    // Add animation class to start animation
    requestAnimationFrame(() => {
      contentElement.classList.add('animation');
    });
    onAnimationEnd(() => {
      contentElement.classList.remove('animation');
    });

    const isDetailsOpen = detailsElement.hasAttribute('open');
    if (isDetailsOpen) {
      // Prevent default collapsing and delay it until the animation has completed
      event.preventDefault();
      contentElement.classList.add('collapsing');
      onAnimationEnd(() => {
        detailsElement.removeAttribute('open');
        contentElement.classList.remove('collapsing');
      });
    }
  }
});


/////////////////////////////////////////////////////////////////
/// Animation for the navbar scrolling
/////////////////////////////////////////////////////////////////

const navbar = document.querySelector('.navbar');
const mainNavList = document.querySelector('#main-nav-list');
let lastScrollY = window.scrollY;
let isListeningToScroll = true;
let ticking = false;

// Function to update navbar position
const updateNavbar = () => {
  if (!navbar) return;

  const currentScrollY = window.scrollY;

  if (currentScrollY === 0) {
    // User has scrolled to the top
    navbar.classList.remove('scrolled-up');
    navbar.style.transform = 'translateY(0px)';
  } else if (currentScrollY > lastScrollY) {
    // User is scrolling down
    navbar.style.transform = `translateY(-${Math.min(currentScrollY, 90)}px)`;
    navbar.classList.remove('scrolled-up');
  } else {
    // User is scrolling up
    navbar.style.transform = `translateY(0px)`;
    navbar.classList.add('scrolled-up');
  }

  lastScrollY = currentScrollY;
  ticking = false;
};

// Function to handle scroll events
const onScroll = () => {
  if (!isListeningToScroll) return;

  if (!ticking) {
    window.requestAnimationFrame(updateNavbar);
    ticking = true;
  }
};

// Add scroll event listener
window.addEventListener('scroll', onScroll);

// Create a mutation observer to monitor changes in attributes
const observer = new MutationObserver((mutationsList) => {
  for (let mutation of mutationsList) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-visible') {
      const visibility = mainNavList.getAttribute('data-visible');
      if (visibility === "true") {
        isListeningToScroll = false;
      } else if (visibility === "false") {
        isListeningToScroll = true;
      }
    }
  }
});

// Start observing the target node for configured mutations
if (mainNavList) {
  observer.observe(mainNavList, { attributes: true });
}




/////////////////////////////////////////////////////////////////
///// Initialize medium-zoom library
/////////////////////////////////////////////////////////////////


mediumZoom('.medium-zoom-image', {
  margin: 20,
  background: 'rgba(255, 255, 255, 0.95)',
  scrollOffset: 0,
  container: null,
  template: null
});