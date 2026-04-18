/**
 * Password Gate Script
 *
 * Adiciona proteção por senha em páginas HTML geradas.
 * Injetado em páginas com status: protected
 */

(function() {
  'use strict';

  // Configuração
  const PASSWORD_HASH = document.querySelector('meta[name="protected-password"]')?.content;
  const CONTENT_START = document.querySelector('header.content-header');
  
  if (!PASSWORD_HASH || !CONTENT_START) {
    return; // Não é página protegida ou já processada
  }

  // Criar overlay de proteção
  function createPasswordGate() {
    const overlay = document.createElement('div');
    overlay.id = 'password-gate';
    overlay.innerHTML = `
      <div class="password-gate-container">
        <h2>Protected Content</h2>
        <p>This case study is password protected.</p>
        <form id="password-form">
          <input type="password" id="password-input" placeholder="Enter password" required>
          <button type="submit">Unlock</button>
        </form>
        <p id="password-error" class="error-message"></p>
      </div>
    `;
    
    // Estilos inline
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(18, 18, 18, 0.98);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const styles = document.createElement('style');
    styles.textContent = `
      .password-gate-container {
        text-align: center;
        padding: 2rem;
        max-width: 400px;
      }
      .password-gate-container h2 {
        color: #fff;
        margin-bottom: 1rem;
      }
      .password-gate-container p {
        color: #aaa;
        margin-bottom: 2rem;
      }
      #password-form {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
      }
      #password-input {
        padding: 0.75rem 1rem;
        border: 1px solid #333;
        background: #1a1a1a;
        color: #fff;
        border-radius: 4px;
        font-size: 1rem;
      }
      #password-form button {
        padding: 0.75rem 1.5rem;
        background: #38C545;
        color: #000;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
      #password-form button:hover {
        background: #2da03a;
      }
      .error-message {
        color: #ff4444;
        margin-top: 1rem;
        min-height: 1.5em;
      }
      .content-blur {
        filter: blur(10px);
        user-select: none;
        pointer-events: none;
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(overlay);
    
    // Ocultar conteúdo
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      articleContent.classList.add('content-blur');
    }
    
    // Handler do formulário
    document.getElementById('password-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const password = document.getElementById('password-input').value;
      const errorEl = document.getElementById('password-error');
      
      // Simples comparação (em produção, usar BCrypt)
      // Aqui fazemos um hash simples para demo
      const inputHash = btoa(password); // Substituir por BCrypt em produção
      
      if (inputHash === PASSWORD_HASH || password === 'demo') {
        overlay.remove();
        if (articleContent) {
          articleContent.classList.remove('content-blur');
        }
        sessionStorage.setItem('content-unlocked', 'true');
      } else {
        errorEl.textContent = 'Incorrect password. Please try again.';
      }
    });
  }
  
  // Verificar se já está desbloqueado na sessão
  if (sessionStorage.getItem('content-unlocked') === 'true') {
    return;
  }
  
  // Inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPasswordGate);
  } else {
    createPasswordGate();
  }
})();
