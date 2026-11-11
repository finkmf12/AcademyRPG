// Academia RPG · notificações épicas de progresso
(() => {
  'use strict';
  const icons = {
    achievement: '🏅',
    level: '✦',
    reward: '🎁',
    victory: '⚔',
    success: '✧',
    info: '📜'
  };
  const labels = {
    achievement: 'CONQUISTA DESBLOQUEADA',
    level: 'EVOLUÇÃO DO AVENTUREIRO',
    reward: 'RECOMPENSA RECEBIDA',
    victory: 'FEITO LENDÁRIO',
    success: 'ACADEMIA RPG',
    info: 'AVISO DA ACADEMIA'
  };
  let sequence = 0;

  function getStack() {
    let stack = document.getElementById('academiaNoticeStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'academiaNoticeStack';
      stack.className = 'epic-notice-stack';
      stack.setAttribute('aria-live', 'polite');
      stack.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(stack);
    }
    return stack;
  }

  function notify(payload = {}) {
    if (!document.body) return;
    const type = Object.prototype.hasOwnProperty.call(icons, payload.type) ? payload.type : 'info';
    const stack = getStack();
    while (stack.children.length >= 3) stack.firstElementChild.remove();

    const card = document.createElement('article');
    card.className = 'epic-notice epic-notice-' + type;
    card.setAttribute('role', 'status');
    card.dataset.noticeId = String(++sequence);

    const seal = document.createElement('div');
    seal.className = 'epic-notice-seal';
    seal.setAttribute('aria-hidden', 'true');
    seal.textContent = String(payload.icon || icons[type]);

    const content = document.createElement('div');
    content.className = 'epic-notice-content';

    const eyebrow = document.createElement('small');
    eyebrow.className = 'epic-notice-eyebrow';
    eyebrow.textContent = String(payload.eyebrow || labels[type]);

    const title = document.createElement('strong');
    title.className = 'epic-notice-title';
    title.textContent = String(payload.title || 'Uma novidade chegou');

    const message = document.createElement('span');
    message.className = 'epic-notice-message';
    message.textContent = String(payload.message || '');

    const close = document.createElement('button');
    close.className = 'epic-notice-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Fechar notificação');
    close.textContent = '×';

    const progress = document.createElement('span');
    progress.className = 'epic-notice-progress';

    content.append(eyebrow, title, message);
    card.append(seal, content, close, progress);
    stack.appendChild(card);

    const duration = Math.max(3200, Math.min(9000, Number(payload.duration) || 5600));
    let timer = window.setTimeout(remove, duration);
    function remove() {
      if (!card.isConnected || card.classList.contains('is-leaving')) return;
      window.clearTimeout(timer);
      card.classList.add('is-leaving');
      window.setTimeout(() => card.remove(), 280);
    }
    close.addEventListener('click', remove);
    card.addEventListener('mouseenter', () => window.clearTimeout(timer));
    card.addEventListener('mouseleave', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(remove, 1800);
    });
    return card;
  }

  window.AcademiaNotifications = Object.freeze({ notify });
  document.addEventListener('academia-epic-notice', event => notify(event.detail || {}));
})();