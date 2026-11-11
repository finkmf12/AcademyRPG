// Academia RPG · notificações épicas e central de histórico
(() => {
  'use strict';

  const icons = {
    achievement: '🏅', level: '✦', reward: '🎁',
    victory: '⚔', success: '✧', info: '📜'
  };
  const labels = {
    achievement: 'CONQUISTA DESBLOQUEADA',
    level: 'EVOLUÇÃO DO AVENTUREIRO',
    reward: 'RECOMPENSA RECEBIDA',
    victory: 'FEITO LENDÁRIO',
    success: 'ACADEMIA RPG',
    info: 'AVISO DA ACADEMIA'
  };
  const fields = 'id,type,title,message,icon,created_at,read_at';
  const $ = id => document.getElementById(id);
  let sequence = 0;
  let records = [];
  let currentUserId = null;
  let client = null;
  let loadedUserId = null;
  let loading = false;
  let filter = 'all';

  function getStack() {
    let stack = $('academiaNoticeStack');
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

  function syncFromApp() {
    const ctx = window.AcademiaCtx;
    if (!ctx) return;
    setContext({ supabase: ctx.supabase, user: ctx.user, guest: ctx.guest });
  }

  function setContext(next = {}) {
    const userId = next.guest ? null : (next.user?.id || null);
    client = next.supabase || null;
    if (userId !== currentUserId) {
      currentUserId = userId;
      records = [];
      loadedUserId = null;
      loading = false;
      filter = 'all';
      renderPanel();
    }
    if (currentUserId && loadedUserId !== currentUserId && !loading) loadHistory();
  }

  function renderToast(payload) {
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
    seal.textContent = payload.icon || icons[type];

    const content = document.createElement('div');
    content.className = 'epic-notice-content';

    const eyebrow = document.createElement('small');
    eyebrow.className = 'epic-notice-eyebrow';
    eyebrow.textContent = payload.eyebrow || labels[type];

    const title = document.createElement('strong');
    title.className = 'epic-notice-title';
    title.textContent = payload.title;

    const message = document.createElement('span');
    message.className = 'epic-notice-message';
    message.textContent = payload.message;

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
  }

  function sortRecords() {
    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    records = records.slice(0, 80);
  }

  function updateBadge() {
    const badge = $('notificationsBadge');
    const bell = $('notificationsBell');
    if (!badge || !bell) return;
    const unread = records.reduce((sum, item) => sum + (item.read_at ? 0 : 1), 0);
    badge.textContent = unread > 99 ? '99+' : String(unread);
    badge.hidden = unread === 0;
    bell.classList.toggle('has-unread', unread > 0);
    bell.setAttribute('aria-label', unread ? 'Abrir notificações, ' + unread + ' não lidas' : 'Abrir notificações');
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Agora';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date).replace('.', '');
  }

  function renderPanel() {
    updateBadge();
    const list = $('notificationsList');
    const markAll = $('notificationsMarkAll');
    const clear = $('notificationsClear');
    if (!list) return;

    const unread = records.filter(item => !item.read_at).length;
    if (markAll) markAll.disabled = unread === 0;
    if (clear) clear.disabled = records.length === 0;

    document.querySelectorAll('[data-notification-filter]').forEach(button => {
      const active = button.dataset.notificationFilter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    list.textContent = '';
    const visible = records.filter(item => filter === 'all' || !item.read_at);
    if (loading && records.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'notifications-empty';
      empty.textContent = 'Carregando seu histórico...';
      list.appendChild(empty);
      return;
    }
    if (!currentUserId && records.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'notifications-empty';
      empty.innerHTML = '<span aria-hidden="true">🔐</span><strong>Entre na sua conta para sincronizar</strong><span>O histórico fica salvo no perfil do aventureiro e acompanha você em outros computadores.</span>';
      list.appendChild(empty);
      return;
    }
    if (visible.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'notifications-empty';
      empty.innerHTML = filter === 'unread'
        ? '<span aria-hidden="true">✧</span><strong>Tudo em dia!</strong><span>Você já leu todas as notificações.</span>'
        : '<span aria-hidden="true">📜</span><strong>Nenhuma notificação ainda</strong><span>Conquistas, níveis, recompensas e vitórias aparecerão aqui.</span>';
      list.appendChild(empty);
      return;
    }

    visible.forEach(item => {
      const entry = document.createElement('button');
      entry.type = 'button';
      entry.className = 'notifications-entry' + (item.read_at ? '' : ' is-unread');
      entry.setAttribute('aria-label', (item.read_at ? '' : 'Não lida. ') + item.title + '. Marcar como lida.');
      const icon = document.createElement('span');
      icon.className = 'notifications-entry-icon';
      icon.textContent = item.icon || icons[item.type] || icons.info;
      const body = document.createElement('span');
      body.className = 'notifications-entry-body';
      const title = document.createElement('strong');
      title.textContent = item.title || 'Novidade da Academia';
      const message = document.createElement('span');
      message.textContent = item.message || '';
      const date = document.createElement('small');
      date.textContent = formatDate(item.created_at);
      body.append(title, message, date);
      const status = document.createElement('span');
      status.className = 'notifications-entry-status';
      status.textContent = item.read_at ? 'LIDA' : 'NOVA';
      entry.append(icon, body, status);
      entry.addEventListener('click', () => markRead(item));
      list.appendChild(entry);
    });
  }

  async function loadHistory() {
    if (!currentUserId || !client || loading) return;
    const userId = currentUserId;
    const requestStartedAt = Date.now();
    loading = true;
    renderPanel();
    try {
      const { data, error } = await client.from('user_notifications')
        .select(fields).eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(80);
      if (error) throw error;
      if (currentUserId !== userId) return;
      const merged = new Map();
      (data || []).forEach(item => merged.set(item.id, item));
      records.filter(item => new Date(item.created_at).getTime() >= requestStartedAt - 250)
        .forEach(item => merged.set(item.id, item));
      records = Array.from(merged.values());
      loadedUserId = userId;
      sortRecords();
    } catch (error) {
      console.warn('Não foi possível carregar as notificações:', error.message || error);
    } finally {
      if (currentUserId === userId) {
        loading = false;
        renderPanel();
      }
    }
  }

  async function persist(record) {
    if (!currentUserId || !client) return;
    const userId = currentUserId;
    const storeClient = client;
    try {
      const { data, error } = await storeClient.from('user_notifications')
        .insert({
          type: record.type, title: record.title,
          message: record.message, icon: record.icon
        }).select(fields).single();
      if (error) throw error;
      if (record.cancelled) {
        await storeClient.from('user_notifications').delete().eq('id', data.id).eq('user_id', userId);
        return;
      }
      let saved = data;
      if (record.read_at && !data.read_at) {
        const updated = await storeClient.from('user_notifications')
          .update({ read_at: record.read_at }).eq('id', data.id).eq('user_id', userId)
          .select(fields).single();
        if (!updated.error && updated.data) saved = updated.data;
      }
      if (currentUserId !== userId) return;
      const index = records.findIndex(item => item.id === record.id);
      if (index >= 0) records[index] = saved;
      else if (!records.some(item => item.id === saved.id)) records.unshift(saved);
      sortRecords();
      renderPanel();
    } catch (error) {
      console.warn('A notificação ficou apenas nesta sessão:', error.message || error);
    }
  }

  function notify(payload = {}) {
    syncFromApp();
    const type = Object.prototype.hasOwnProperty.call(icons, payload.type) ? payload.type : 'info';
    const clean = {
      type,
      title: String(payload.title || 'Uma novidade chegou').slice(0, 140),
      message: String(payload.message || '').slice(0, 500),
      icon: String(payload.icon || icons[type]).slice(0, 16)
    };
    renderToast({ ...payload, ...clean });
    const record = {
      id: 'local:' + Date.now() + ':' + (++sequence),
      ...clean,
      created_at: new Date().toISOString(),
      read_at: null
    };
    records.unshift(record);
    sortRecords();
    renderPanel();
    persist(record);
  }

  async function markRead(item) {
    if (!item || item.read_at) return;
    const previous = item.read_at;
    item.read_at = new Date().toISOString();
    renderPanel();
    if (!currentUserId || !client || String(item.id).startsWith('local:')) return;
    const { error } = await client.from('user_notifications')
      .update({ read_at: item.read_at })
      .eq('id', item.id).eq('user_id', currentUserId);
    if (error) {
      item.read_at = previous;
      renderPanel();
      window.AcademiaCtx?.toast?.('Não foi possível marcar a notificação como lida.');
    }
  }

  async function markAllRead() {
    const unread = records.filter(item => !item.read_at);
    if (!unread.length) return;
    const now = new Date().toISOString();
    unread.forEach(item => { item.read_at = now; });
    renderPanel();
    if (!currentUserId || !client) return;
    const { error } = await client.from('user_notifications')
      .update({ read_at: now }).eq('user_id', currentUserId).is('read_at', null);
    if (error) {
      unread.forEach(item => { item.read_at = null; });
      renderPanel();
      window.AcademiaCtx?.toast?.('Não foi possível atualizar suas notificações.');
    }
  }

  async function clearHistory() {
    if (!records.length) return;
    if (!window.confirm('Deseja apagar todo o histórico de notificações desta conta?')) return;
    records.forEach(item => { item.cancelled = true; });
    if (currentUserId && client) {
      const { error } = await client.from('user_notifications')
        .delete().eq('user_id', currentUserId);
      if (error) {
        records.forEach(item => { item.cancelled = false; });
        renderPanel();
        window.AcademiaCtx?.toast?.('Não foi possível limpar o histórico.');
        return;
      }
    }
    records = [];
    loadedUserId = currentUserId;
    renderPanel();
  }

  function closePanel() {
    const panel = $('notificationsPanel');
    const bell = $('notificationsBell');
    if (!panel || !bell) return;
    panel.hidden = true;
    bell.setAttribute('aria-expanded', 'false');
  }

  function openPanel() {
    const panel = $('notificationsPanel');
    const bell = $('notificationsBell');
    if (!panel || !bell) return;
    panel.hidden = false;
    bell.setAttribute('aria-expanded', 'true');
    syncFromApp();
    renderPanel();
    if (currentUserId && loadedUserId !== currentUserId) loadHistory();
  }

  function initializeControls() {
    const bell = $('notificationsBell');
    const control = $('notificationsControl');
    if (!bell || !control) return;
    bell.addEventListener('click', () => {
      const panel = $('notificationsPanel');
      if (panel.hidden) openPanel();
      else closePanel();
    });
    $('notificationsClose')?.addEventListener('click', closePanel);
    $('notificationsMarkAll')?.addEventListener('click', markAllRead);
    $('notificationsClear')?.addEventListener('click', clearHistory);
    document.querySelectorAll('[data-notification-filter]').forEach(button => {
      button.addEventListener('click', () => {
        filter = button.dataset.notificationFilter === 'unread' ? 'unread' : 'all';
        renderPanel();
      });
    });
    document.addEventListener('click', event => {
      if (!control.contains(event.target)) closePanel();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closePanel();
    });
  }

  window.AcademiaNotifications = Object.freeze({ notify, setContext, open: openPanel, close: closePanel });
  window.addEventListener('academia-context-ready', syncFromApp);
  document.addEventListener('academia-epic-notice', event => notify(event.detail || {}));
  initializeControls();
  syncFromApp();
})();