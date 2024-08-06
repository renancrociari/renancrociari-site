// Função para controlar a dialog
const modal = document.querySelector('.dialog-show-email');
const openModal = document.querySelectorAll('.btn-show-email'); // Seleciona todos os botões que abrem a modal
const closeModal = document.querySelector('.btn-close-email');
const body = document.body;

// Armazena a posição de rolagem
let scrollPosition = 0;


// Função para abrir a dialog e adicionar um estado ao histórico
function openDialog() {
  scrollPosition = window.scrollY;
  body.style.overflow = 'hidden';
  body.style.top = `-${scrollPosition}px`;
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
    body.style.overflow = 'auto';
    window.scrollTo(0, scrollPosition);
    
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
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.hasAttribute('open')) {
    closeDialog();
  }
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


/////////// Function to copy email to the clipboard

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


/////////// Function to load the mobile nav

const primaryNav = document.querySelector(".main-nav-list");
const navToggle = document.querySelector(".mobile-nav-toggle");

navToggle.addEventListener("click", () => {
  const visibility = primaryNav.getAttribute("data-visible");

  if (visibility === "false") {
    // Store the current scroll position
    scrollPosition = window.scrollY;
    primaryNav.setAttribute("data-visible", true);
    navToggle.setAttribute('aria-expanded', true);
    body.style.overflow = 'hidden';
    navToggle.classList.add("open"); // Add the open class to the toggle
  } else if (visibility === "true") {
    primaryNav.setAttribute("data-visible", false);
    navToggle.setAttribute('aria-expanded', false);
    setTimeout(() => {
      body.style.overflow = 'auto';
      // Restore the scroll position
      window.scrollTo(0, scrollPosition);
    }, 450);
    navToggle.classList.remove("open"); // Remove the open class from the toggle
  }
});



/*********** Function to calculate Springer Nature Work duration */

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
document.getElementById('workDuration').innerText = calculateWorkDuration(startDate);


/********* Animate experience accordion details element *************/


document.addEventListener('click', function(event) {
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
      contentView.classList.remove('animation', 'collapsing');
      // Force reflow
      void contentElement.offsetWidth;
    }

    const onAnimationEnd = (callback) => {
      contentElement.addEventListener('animationend', callback, { once: true });
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


// Animation for the navbar scrolling

const navbar = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;

  if (currentScrollY > lastScrollY) {
    // User is scrolling down
    navbar.style.transform = `translateY(-${Math.min(currentScrollY, 90)}px)`;
    navbar.classList.remove('scrolled-up');
  } else {
    // User is scrolling up
    navbar.style.transform = `translateY(0px)`;
    navbar.classList.add('scrolled-up');
  }

  lastScrollY = currentScrollY;
});

const navbarBg = document.querySelector('.navbar-bg');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const alpha = Math.min(scrollY / 90, 1); // Calculate alpha value between 0 and 1
  navbarBg.style.backgroundColor = `rgba(255, 255, 255, ${alpha})`;
});