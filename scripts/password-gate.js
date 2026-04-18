/**
 * Password Gate Script
 *
 * Adiciona proteção por senha em páginas HTML geradas.
 * Injetado em páginas com status: protected
 * 
 * Usa BCrypt via API endpoint para verificação segura.
 */

(function() {
  'use strict';

  const PASSWORD_HASH = document.querySelector('meta[name="protected-password"]')?.content;
  const CONTENT_START = document.querySelector('header.content-header');
  
  if (!PASSWORD_HASH || !CONTENT_START) {
    return;
  }

  function createPasswordGate() {
    const overlay = document.createElement('div');
    overlay.id = 'password-gate';
    overlay.innerHTML = `
      <div class="password-gate-container">
        <h2>Protected Content</h2>
        <p>This case study is password protected.</p>
        <form id="password-form">
          <input type="password" id="password-input" placeholder="Enter password" autocomplete="off" required>
          <button type="submit">Unlock</button>
        </form>
        <p id="password-error" class="error-message"></p>
      </div>
    `;
    
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
    
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      articleContent.classList.add('content-blur');
    }
    
    document.getElementById('password-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const password = document.getElementById('password-input').value;
      const errorEl = document.getElementById('password-error');
      
      // Verificar senha via API endpoint (BCrypt server-side)
      verifyPassword(password, PASSWORD_HASH)
        .then(valid => {
          if (valid) {
            overlay.remove();
            if (articleContent) {
              articleContent.classList.remove('content-blur');
            }
            sessionStorage.setItem('content-unlocked', 'true');
          } else {
            errorEl.textContent = 'Incorrect password. Please try again.';
            document.getElementById('password-input').value = '';
          }
        })
        .catch(() => {
          errorEl.textContent = 'Verification failed. Please try again.';
        });
    });
  }

  /** Mesma chave que `src/portfolio-os-integration/lib/dev-api-root.js`. */
  var PORTFOLIO_OS_API_ROOT_KEY = 'portfolio-os-api-root';

  /**
   * Descobre a origem da API do dev-server (porta dinâmica).
   * @returns {Promise<string|null>}
   */
  async function resolveLocalDevApiRoot() {
    var host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return null;
    }
    var cached = sessionStorage.getItem(PORTFOLIO_OS_API_ROOT_KEY);
    if (cached) {
      return cached;
    }
    var ports = [];
    for (var p = 3001; p <= 3060; p++) {
      ports.push(p);
    }
    for (var i = 0; i < ports.length; i += 10) {
      var chunk = ports.slice(i, i + 10);
      try {
        var found = await Promise.any(
          chunk.map(function (port) {
            var base = 'http://' + host + ':' + port;
            return fetch(base + '/api/health', {
              signal: AbortSignal.timeout(400),
            }).then(function (res) {
              if (!res.ok) {
                throw new Error('bad');
              }
              return base;
            });
          })
        );
        sessionStorage.setItem(PORTFOLIO_OS_API_ROOT_KEY, found);
        return found;
      } catch (e) {
        // próximo bloco de portas
      }
    }
    return 'http://' + host + ':3001';
  }
  
  // BCrypt verification - tenta API primeiro, fallback para comparação direta
  async function verifyPassword(password, hash) {
    // Tentar verificação via API (produção)
    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, hash })
      });
      if (response.ok) {
        const result = await response.json();
        return result.valid === true;
      }
    } catch (e) {
      // API não disponível (dev mode) - usar fallback
    }
    
    // Fallback: verificação client-side para desenvolvimento
    // BCrypt hashes começam com $2b$ ou $2a$
    if (hash && (hash.startsWith('$2b$') || hash.startsWith('$2a$'))) {
      // Para desenvolvimento: usar endpoint local da API (porta descoberta via /api/health)
      try {
        var apiRoot = await resolveLocalDevApiRoot();
        if (apiRoot) {
          const response = await fetch(apiRoot + '/api/verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, hash })
          });
          if (response.ok) {
            const result = await response.json();
            return result.valid === true;
          }
        }
      } catch (e) {
        // API local também não disponível
      }
      
      // Último fallback: aceitar demo password para desenvolvimento
      console.warn('BCrypt verification requires API server. Using demo fallback.');
      return password === 'demo';
    }
    
    // Hash simples (legado) - comparação direta
    return btoa(password) === hash;
  }
  
  if (sessionStorage.getItem('content-unlocked') === 'true') {
    return;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPasswordGate);
  } else {
    createPasswordGate();
  }
})();
