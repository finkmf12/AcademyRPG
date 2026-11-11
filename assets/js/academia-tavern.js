// Academia RPG · Taverna — chat global e por guilda
(() => {
  'use strict';

  const PAGE_SIZE = 45;
  const MAX_LENGTH = 400;
  // Selo visual reservado à conta proprietária do Academia RPG (Visage).
  const OWNER_USER_ID = '766d178a-ac9b-41ad-9806-e1cc7630635a';
  const $ = id => document.getElementById(id);
  const state = {
    client: null,
    user: null,
    profile: null,
    guild: null,
    teacher: false,
    pageOpen: false,
    active: 'global',
    messages: [],
    hasMore: false,
    messageChannel: null,
    presenceChannel: null,
    presenceKey: null,
    online: [],
    sending: false,
    loading: false,
    loadingOlder: false,
    loadToken: 0,
    unseen: 0,
    authSubscription: null
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  function toast(message) {
    const ctx = window.AcademiaCtx;
    if (ctx && typeof ctx.toast === 'function') ctx.toast(message);
  }

  function notice(type, title, message) {
    if (window.AcademiaNotifications && typeof window.AcademiaNotifications.notify === 'function') {
      window.AcademiaNotifications.notify({ type: type || 'info', title: title, message: message, icon: '🍻' });
    } else {
      toast(title + (message ? ' — ' + message : ''));
    }
  }

  function displayName() {
    return state.profile && (state.profile.adventurer_name || state.profile.display_name)
      || state.user && state.user.user_metadata && state.user.user_metadata.name
      || 'Aventureiro';
  }

  function avatar() {
    return state.profile && state.profile.avatar || '🧙';
  }

  function nameMarkup(name, appearance) {
    const helper = window.AcademiaAvatar && window.AcademiaAvatar.nameMarkup;
    if (typeof helper === 'function') return helper(name, appearance || {});
    return escapeHtml(name);
  }

  function mountNavigation() {
    const nav = document.querySelector('.rpgnav-community');
    if (!nav || nav.querySelector('[data-tavern-open]')) return;
    nav.insertAdjacentHTML('beforeend',
      '<button type="button" data-tavern-open><span class="ico">♨</span> Taverna <span class="tvn-nav-dot" aria-hidden="true"></span></button>');
  }

  function pageHeader() {
    if ($('pageKicker')) $('pageKicker').textContent = 'COMUNIDADE · PONTO DE ENCONTRO';
    if ($('pageTitle')) $('pageTitle').textContent = 'Taverna';
    if ($('pageSub')) $('pageSub').textContent = 'Converse com aventureiros de toda a Academia ou reúna sua guilda.';
    document.querySelectorAll('.rpgnav button').forEach(button => button.classList.toggle('active', button.hasAttribute('data-tavern-open')));
  }

  function showGate(message) {
    const root = $('rpgView');
    if (!root) return;
    $('home').style.display = 'none';
    $('library').style.display = 'none';
    root.style.display = 'block';
    if ($('storageNotice')) $('storageNotice').style.display = 'none';
    pageHeader();
    root.innerHTML =
      '<section class="tvn-gate">' +
        '<div class="tvn-gate-seal">♨</div>' +
        '<div class="tvn-eyebrow">PORTAS DA TAVERNA</div>' +
        '<h3>Uma mesa espera por você.</h3>' +
        '<p>' + escapeHtml(message || 'Entre com sua conta Google para participar das conversas da Academia.') + '</p>' +
        '<div class="tvn-gate-note">O modo convidado não acessa os canais da comunidade.</div>' +
      '</section>';
  }

  function openTavern() {
    const ctx = window.AcademiaCtx;
    if (!ctx || !ctx.supabase || !ctx.user || ctx.guest) {
      state.pageOpen = true;
      showGate('Entre com sua conta Google para conversar com outros aventureiros.');
      return;
    }
    state.pageOpen = true;
    pageHeader();
    renderShell();
    loadCommunityData().catch(error => {
      console.error('Taverna · atualizar comunidade:', error);
      toast('Não foi possível atualizar os dados da comunidade.');
    });
  }

  function channelTitle() {
    if (state.active === 'guild' && state.guild && state.guild.guild) {
      return state.guild.guild.name + ' [' + state.guild.guild.tag + ']';
    }
    return 'Salão Global';
  }

  function renderShell() {
    const root = $('rpgView');
    if (!root) return;
    $('home').style.display = 'none';
    $('library').style.display = 'none';
    root.style.display = 'block';
    if ($('storageNotice')) $('storageNotice').style.display = 'none';
    pageHeader();

    const hasGuild = !!(state.guild && state.guild.guild);
    const activeGuild = state.active === 'guild';
    const guild = hasGuild ? state.guild.guild : null;
    const guildTab = hasGuild
      ? '<button type="button" class="tvn-tab ' + (activeGuild ? 'is-active' : '') + '" data-tvn-tab="guild"><span class="tvn-tab-icon">⚑</span><span><b>Minha guilda</b><small>' + escapeHtml(guild.name) + ' · [' + escapeHtml(guild.tag) + ']</small></span></button>'
      : '<button type="button" class="tvn-tab ' + (activeGuild ? 'is-active' : '') + '" data-tvn-tab="guild"><span class="tvn-tab-icon">⚑</span><span><b>Chat da guilda</b><small>Requer uma guilda</small></span></button>';

    root.innerHTML =
      '<div class="tvn-page">' +
        '<section class="tvn-hero">' +
          '<div class="tvn-hero-copy">' +
            '<div class="tvn-eyebrow"><span></span> COMUNIDADE DA ACADEMIA RPG</div>' +
            '<h3>Onde as jornadas se encontram.</h3>' +
            '<p>Uma boa aventura fica ainda melhor quando compartilhada. Puxe uma cadeira e converse com outros aventureiros.</p>' +
            '<div class="tvn-hero-meta"><span class="tvn-online-pulse"></span><b id="tvnHeroOnline">Conectando ao salão...</b><i></i><span>Mensagens em tempo real</span></div>' +
          '</div>' +
          '<div class="tvn-hero-art" aria-hidden="true"><div class="tvn-hero-rune">♨</div><span>✦</span><i></i><b>✧</b></div>' +
        '</section>' +
        '<div class="tvn-tabbar" role="tablist" aria-label="Canais da Taverna">' +
          '<button type="button" class="tvn-tab ' + (state.active === 'global' ? 'is-active' : '') + '" data-tvn-tab="global"><span class="tvn-tab-icon">✧</span><span><b>Salão Global</b><small>Todos os aventureiros</small></span><em>GLOBAL</em></button>' +
          guildTab +
        '</div>' +
        '<div class="tvn-grid">' +
          '<section class="tvn-chat-card">' +
            '<header class="tvn-chat-head"><div class="tvn-channel-mark" id="tvnChannelMark">' + (activeGuild ? '⚑' : '✧') + '</div><div class="tvn-channel-title"><div class="tvn-eyebrow" id="tvnChannelEyebrow">' + (activeGuild ? 'CONVERSA PRIVADA DA COMPANHIA' : 'PRAÇA DE ENCONTRO') + '</div><h3 id="tvnChannelTitle">' + escapeHtml(channelTitle()) + '</h3><p id="tvnChannelDescription">' + (activeGuild ? 'Somente os integrantes desta guilda participam.' : 'Uma conversa aberta para todos os jogadores.') + '</p></div><div class="tvn-channel-status"><span></span><b>AO VIVO</b></div></header>' +
            '<div class="tvn-feed-wrap"><div class="tvn-feed" id="tvnFeed" role="log" aria-live="polite" aria-relevant="additions text"><div class="tvn-feed-loading"><span class="tvn-spinner"></span><b>Acendendo as lanternas...</b><small>Preparando as conversas</small></div></div><button type="button" class="tvn-jump-bottom" id="tvnJumpBottom" hidden>↓ Novas mensagens</button></div>' +
            '<form class="tvn-composer" id="tvnComposer">' +
              '<div class="tvn-composer-top"><div class="tvn-emoji-row" aria-label="Emojis rápidos"><button type="button" data-tvn-emoji="✨" title="Adicionar ✨">✨</button><button type="button" data-tvn-emoji="⚔️" title="Adicionar ⚔️">⚔️</button><button type="button" data-tvn-emoji="😂" title="Adicionar 😂">😂</button><button type="button" data-tvn-emoji="❤️" title="Adicionar ❤️">❤️</button><button type="button" data-tvn-emoji="👀" title="Adicionar 👀">👀</button></div><span id="tvnCounter">0 / ' + MAX_LENGTH + '</span></div>' +
              '<div class="tvn-compose-row"><textarea id="tvnMessageInput" maxlength="' + MAX_LENGTH + '" rows="1" placeholder="Escreva sua mensagem..." aria-label="Mensagem para a Taverna"></textarea><button type="submit" class="tvn-send" id="tvnSendButton"><span>Enviar</span><b>➤</b></button></div>' +
              '<div class="tvn-composer-hint"><span>Enter para enviar · Shift + Enter para pular linha</span><span>Seja respeitoso com os demais aventureiros.</span></div>' +
            '</form>' +
          '</section>' +
          '<aside class="tvn-side">' +
            '<section class="tvn-side-card tvn-online-card"><div class="tvn-side-heading"><div><small>NA TAVERNA</small><h4>Aventureiros online</h4></div><span class="tvn-side-spark">✦</span></div><div class="tvn-online-total"><strong id="tvnOnlineCount">—</strong><span>presentes agora</span></div><div class="tvn-online-list" id="tvnOnlineList"><div class="tvn-online-empty">Aguardando os primeiros aventureiros...</div></div></section>' +
            '<section class="tvn-side-card tvn-channel-card"><div class="tvn-side-heading"><div><small>SEU CANAL</small><h4>' + (activeGuild ? 'Laços da guilda' : 'Salão aberto') + '</h4></div><span class="tvn-side-spark">⚜</span></div><p>' + (activeGuild ? 'Um espaço reservado para planejar desafios, compartilhar conquistas e fortalecer sua companhia.' : 'Conheça pessoas, encontre colegas de estudo e descubra novas guildas para sua jornada.') + '</p>' + (activeGuild && guild ? '<div class="tvn-guild-mini"><span>' + escapeHtml((guild.flag_config && guild.flag_config.symbol) || '⚔️') + '</span><div><b>' + escapeHtml(guild.name) + '</b><small>[' + escapeHtml(guild.tag) + ']</small></div></div>' : '<div class="tvn-global-mini"><span>✧</span><b>Uma só Academia. Muitas jornadas.</b></div>') + '</section>' +
            '<section class="tvn-side-card tvn-rules-card"><div class="tvn-side-heading"><div><small>CÓDIGO DA TAVERNA</small><h4>Boas conversas</h4></div><span class="tvn-side-spark">📜</span></div><ul><li>Respeite todos os aventureiros.</li><li>Evite spam e mensagens repetidas.</li><li>Não compartilhe dados pessoais.</li><li>Mensagens podem ser removidas pela moderação.</li></ul><div class="tvn-rules-foot">A comunidade fica melhor com a colaboração de todos.</div></section>' +
          '</aside>' +
        '</div>' +
      '</div>';

    updateComposer();
    renderOnline();
  }

  async function loadCommunityData() {
    const client = state.client;
    if (!client || !state.user) return;
    const results = await Promise.all([
      client.from('player_profiles')
        .select('adventurer_name,display_name,avatar,class,appearance')
        .eq('user_id', state.user.id)
        .maybeSingle(),
      client.rpc('get_my_guild'),
      client.rpc('is_academy_teacher')
    ]);
    if (results[0].error) console.warn('Perfil da Taverna:', results[0].error.message);
    state.profile = results[0].data || null;
    state.guild = results[1].error ? null : results[1].data;
    state.teacher = !results[2].error && !!results[2].data;
    if (state.active === 'guild' && !(state.guild && state.guild.guild)) state.active = 'global';
    if (state.pageOpen) {
      renderShell();
      switchChannel(state.active);
    }
    startPresence();
  }

  function startPresence() {
    if (!state.client || !state.user || state.presenceChannel) return;
    state.presenceKey = state.presenceKey || crypto.randomUUID();
    const channel = state.client.channel('tavern-presence', {
      config: { presence: { key: state.presenceKey } }
    });
    state.presenceChannel = channel;
    channel.on('presence', { event: 'sync' }, renderOnline);
    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            name: displayName(),
            user_id: state.user.id,
            is_self: true,
            avatar: avatar(),
            online_at: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Presença da Taverna:', error.message);
        }
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const label = $('tvnHeroOnline');
        if (label) label.textContent = 'Chat disponível · presença indisponível';
      }
    });
  }

  function renderOnline() {
    const presence = state.presenceChannel && state.presenceChannel.presenceState
      ? state.presenceChannel.presenceState()
      : {};
    const unique = new Map();
    Object.keys(presence).forEach(key => {
      (presence[key] || []).forEach(meta => {
        const id = key + ':' + String(meta.online_at || '');
        if (!unique.has(id)) unique.set(id, meta);
      });
    });
    state.online = Array.from(unique.values()).sort((a, b) => {
      if (a.is_self) return -1;
      if (b.is_self) return 1;
      return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
    });

    const count = $('tvnOnlineCount');
    const list = $('tvnOnlineList');
    const hero = $('tvnHeroOnline');
    if (count) count.textContent = String(state.online.length);
    if (hero) hero.textContent = state.online.length + ' aventureiro' + (state.online.length === 1 ? '' : 's') + ' na Academia';
    if (!list) return;
    if (!state.online.length) {
      list.innerHTML = '<div class="tvn-online-empty">Ninguém por aqui neste instante.</div>';
      return;
    }
    list.innerHTML = state.online.slice(0, 8).map(person =>
      '<div class="tvn-online-person"><span>' + escapeHtml(person.avatar || '🧙') + '</span><b>' + escapeHtml(person.name || 'Aventureiro') + '</b><i></i></div>'
    ).join('') + (state.online.length > 8 ? '<small class="tvn-online-more">e mais ' + (state.online.length - 8) + ' aventureiros...</small>' : '');
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  function formatMessage(value) {
    return escapeHtml(value)
      .replace(/@([\p{L}\p{N}_-]+)/gu, '<span class="tvn-mention">@$1</span>')
      .replace(/\n/g, '<br>');
  }

  function renderMessage(message) {
    const own = !!(state.user && message.user_id === state.user.id);
    const canDelete = own || state.teacher;
    const name = nameMarkup(message.sender_name || 'Aventureiro', message.sender_appearance || {});
    const ownerBadge = state.active === 'global' && message.user_id === OWNER_USER_ID
      ? '<span class="tvn-owner-tag" title="Proprietário da Academia RPG" aria-label="Dono da Academia RPG"><span aria-hidden="true">✦</span> DONO <span aria-hidden="true">✦</span></span>'
      : '';
    const classLabel = message.sender_class
      ? '<span class="tvn-class-label">' + escapeHtml(message.sender_class) + '</span>'
      : '';
    return '<article class="tvn-message ' + (own ? 'is-own' : '') + '" data-message-id="' + escapeHtml(message.id) + '">' +
      '<div class="tvn-message-avatar">' + escapeHtml(message.sender_avatar || '🧙') + '</div>' +
      '<div class="tvn-message-main"><div class="tvn-message-meta"><b>' + name + '</b>' + ownerBadge + classLabel + '<time>' + formatTime(message.created_at) + '</time>' +
      (canDelete ? '<button type="button" class="tvn-message-delete" data-tvn-delete="' + escapeHtml(message.id) + '" title="Excluir mensagem" aria-label="Excluir mensagem">×</button>' : '') +
      '</div><div class="tvn-message-bubble">' + formatMessage(message.content || '') + '</div></div></article>';
  }

  function renderMessages(options) {
    const feed = $('tvnFeed');
    if (!feed) return;
    const oldHeight = feed.scrollHeight;
    const oldTop = feed.scrollTop;
    const nearBottom = oldHeight - oldTop - feed.clientHeight < 110;
    let html = '';
    if (state.hasMore) html += '<button type="button" class="tvn-load-older" data-tvn-older>Carregar mensagens anteriores</button>';
    if (!state.messages.length) {
      html += '<div class="tvn-empty"><div class="tvn-empty-mark">✧</div><b>O salão está tranquilo.</b><p>Seja o primeiro a iniciar uma conversa por aqui.</p></div>';
    } else {
      html += state.messages.map(renderMessage).join('');
    }
    feed.innerHTML = html;
    const jump = $('tvnJumpBottom');
    if (jump) jump.hidden = true;
    if (options && options.preserveTop) {
      feed.scrollTop = feed.scrollHeight - oldHeight + oldTop;
    } else if (options && options.toBottom || nearBottom) {
      feed.scrollTop = feed.scrollHeight;
    }
  }

  function currentFilter() {
    return state.active === 'global'
      ? { channel_type: 'global', guild_id: null }
      : { channel_type: 'guild', guild_id: state.guild && state.guild.guild && state.guild.guild.id };
  }

  function currentChannelKey() {
    return state.active === 'global'
      ? 'global'
      : 'guild:' + (state.guild && state.guild.guild && state.guild.guild.id || 'none');
  }

  async function loadMessages(reset) {
    if (!state.client || !state.user) return;
    if (state.active === 'guild' && !(state.guild && state.guild.guild)) return;
    if (!reset && state.loading) return;
    const requestToken = reset ? ++state.loadToken : state.loadToken;
    const requestedChannel = currentChannelKey();
    state.loading = true;
    const feed = $('tvnFeed');
    if (reset && feed) {
      feed.innerHTML = '<div class="tvn-feed-loading"><span class="tvn-spinner"></span><b>Acendendo as lanternas...</b><small>Preparando as conversas</small></div>';
    }
    try {
      const filter = currentFilter();
      let query = state.client.from('tavern_messages').select('*');
      if (filter.channel_type === 'global') query = query.eq('channel_type', 'global');
      else query = query.eq('channel_type', 'guild').eq('guild_id', filter.guild_id);
      if (!reset && state.messages.length) {
        const oldest = state.messages[0];
        query = query.lt('created_at', oldest.created_at);
      }
      const { data, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(PAGE_SIZE);
      if (error) throw error;
      if (requestToken !== state.loadToken || requestedChannel !== currentChannelKey()) return;
      const rows = (data || []).reverse();
      if (reset) state.messages = rows;
      else {
        const known = new Set(state.messages.map(item => String(item.id)));
        state.messages = rows.filter(item => !known.has(String(item.id))).concat(state.messages);
      }
      state.hasMore = (data || []).length === PAGE_SIZE;
      state.unseen = 0;
      renderMessages({ toBottom: !!reset });
    } catch (error) {
      if (requestToken !== state.loadToken || requestedChannel !== currentChannelKey()) return;
      console.error('Taverna · carregar mensagens:', error);
      if (feed) feed.innerHTML = '<div class="tvn-error"><b>Não foi possível abrir as conversas.</b><p>' + escapeHtml(error.message || 'Confira sua conexão e tente novamente.') + '</p><button type="button" data-tvn-retry>Tentar novamente</button></div>';
    } finally {
      if (requestToken === state.loadToken) state.loading = false;
    }
  }

  function subscribeFeed() {
    if (!state.client || !state.user) return;
    if (state.messageChannel) {
      state.client.removeChannel(state.messageChannel);
      state.messageChannel = null;
    }
    if (state.active === 'guild' && !(state.guild && state.guild.guild)) return;

    const filter = currentFilter();
    const channelName = state.active === 'global'
      ? 'tavern-messages-global'
      : 'tavern-messages-guild-' + filter.guild_id;
    const channel = state.client.channel(channelName);
    const insertFilter = state.active === 'global'
      ? 'channel_type=eq.global'
      : 'guild_id=eq.' + filter.guild_id;

    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tavern_messages',
      filter: insertFilter
    }, payload => receiveMessage(payload.new));

    channel.on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'tavern_messages'
    }, payload => {
      const id = payload.old && payload.old.id;
      if (id == null) return;
      state.messages = state.messages.filter(item => String(item.id) !== String(id));
      const node = document.querySelector('[data-message-id="' + CSS.escape(String(id)) + '"]');
      if (node) node.remove();
    });

    state.messageChannel = channel;
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') loadMessages(true);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const feed = $('tvnFeed');
        if (feed) feed.innerHTML = '<div class="tvn-error"><b>Conexão em tempo real indisponível.</b><p>Verifique sua conexão e atualize a Taverna.</p><button type="button" data-tvn-retry>Tentar novamente</button></div>';
      }
    });
  }

  function receiveMessage(message) {
    if (!message || state.messages.some(item => String(item.id) === String(message.id))) return;
    const feed = $('tvnFeed');
    const nearBottom = !feed || feed.scrollHeight - feed.scrollTop - feed.clientHeight < 110;
    state.messages.push(message);
    state.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    renderMessages({ toBottom: nearBottom || message.user_id === (state.user && state.user.id) });
    if (!nearBottom && message.user_id !== (state.user && state.user.id)) {
      state.unseen += 1;
      const jump = $('tvnJumpBottom');
      if (jump) {
        jump.hidden = false;
        jump.textContent = '↓ ' + state.unseen + ' nova' + (state.unseen === 1 ? '' : 's') + ' mensagem' + (state.unseen === 1 ? '' : 's');
      }
    }
    if (message.user_id !== (state.user && state.user.id)) {
      const current = displayName().toLocaleLowerCase('pt-BR');
      if (current.length > 1 && String(message.content || '').toLocaleLowerCase('pt-BR').includes('@' + current)) {
        notice('info', 'Você foi mencionado na Taverna', (message.sender_name || 'Um aventureiro') + ' chamou por você.');
      }
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (state.sending || !state.client || !state.user) return;
    if (state.active === 'guild' && !(state.guild && state.guild.guild)) {
      toast('Entre em uma guilda antes de usar este canal.');
      return;
    }
    if (state.active === 'guild' && state.guild.guild.active === false) {
      toast('Esta guilda está suspensa no momento e não pode enviar mensagens.');
      return;
    }
    const input = $('tvnMessageInput');
    const content = input ? input.value.trim() : '';
    if (!content) return;
    if (content.length > MAX_LENGTH) {
      toast('Sua mensagem passou do limite de ' + MAX_LENGTH + ' caracteres.');
      return;
    }

    state.sending = true;
    updateComposer();
    try {
      const args = {
        p_channel_type: state.active,
        p_content: content,
        p_guild_id: state.active === 'guild' ? state.guild.guild.id : null
      };
      const { data, error } = await state.client.rpc('send_tavern_message', args);
      if (error) throw error;
      if (data && !state.messages.some(item => String(item.id) === String(data.id))) {
        state.messages.push(data);
        state.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        renderMessages({ toBottom: true });
      }
      input.value = '';
      updateComposer();
      input.focus();
    } catch (error) {
      toast(error.message || 'Não foi possível enviar sua mensagem.');
    } finally {
      state.sending = false;
      updateComposer();
    }
  }

  async function deleteMessage(id, button) {
    if (!state.client || !state.user) return;
    const message = state.messages.find(item => String(item.id) === String(id));
    if (!message) return;
    if (message.user_id !== state.user.id && !state.teacher) {
      toast('Você não tem permissão para remover esta mensagem.');
      return;
    }
    if (!window.confirm('Excluir esta mensagem da Taverna?')) return;
    if (button) button.disabled = true;
    const { error } = await state.client.from('tavern_messages').delete().eq('id', id);
    if (error) {
      toast(error.message || 'Não foi possível excluir a mensagem.');
      if (button) button.disabled = false;
      return;
    }
    state.messages = state.messages.filter(item => String(item.id) !== String(id));
    const node = document.querySelector('[data-message-id="' + CSS.escape(String(id)) + '"]');
    if (node) node.remove();
    toast('Mensagem removida.');
  }

  function updateComposer() {
    const input = $('tvnMessageInput');
    const counter = $('tvnCounter');
    const button = $('tvnSendButton');
    if (counter) counter.textContent = (input ? input.value.length : 0) + ' / ' + MAX_LENGTH;
    if (button) button.disabled = state.sending || !input || !input.value.trim();
  }

  function insertEmoji(emoji) {
    const input = $('tvnMessageInput');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
    input.focus();
    const cursor = start + emoji.length;
    input.setSelectionRange(cursor, cursor);
    updateComposer();
  }

  async function loadOlder() {
    if (state.loadingOlder || !state.hasMore || !state.messages.length) return;
    state.loadingOlder = true;
    const requestToken = state.loadToken;
    const requestedChannel = currentChannelKey();
    const button = document.querySelector('[data-tvn-older]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Carregando...';
    }
    try {
      const before = state.messages[0].created_at;
      const filter = currentFilter();
      let query = state.client.from('tavern_messages').select('*');
      if (filter.channel_type === 'global') query = query.eq('channel_type', 'global');
      else query = query.eq('channel_type', 'guild').eq('guild_id', filter.guild_id);
      const { data, error } = await query.lt('created_at', before)
        .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(PAGE_SIZE);
      if (error) throw error;
      if (requestToken !== state.loadToken || requestedChannel !== currentChannelKey()) return;
      const rows = (data || []).reverse();
      const known = new Set(state.messages.map(item => String(item.id)));
      state.messages = rows.filter(item => !known.has(String(item.id))).concat(state.messages);
      state.hasMore = (data || []).length === PAGE_SIZE;
      renderMessages({ preserveTop: true });
    } catch (error) {
      if (requestToken !== state.loadToken || requestedChannel !== currentChannelKey()) return;
      toast(error.message || 'Não foi possível carregar as mensagens anteriores.');
    } finally {
      state.loadingOlder = false;
    }
  }

  function switchChannel(channel) {
    if (channel !== 'global' && channel !== 'guild') return;
    state.active = channel;
    if (channel === 'guild' && !(state.guild && state.guild.guild)) {
      state.loadToken += 1;
      state.loading = false;
      if (state.messageChannel) {
        state.client.removeChannel(state.messageChannel);
        state.messageChannel = null;
      }
      renderShell();
      const feed = $('tvnFeed');
      if (feed) {
        feed.innerHTML =
          '<div class="tvn-guild-locked"><div class="tvn-locked-seal">⚑</div><div class="tvn-eyebrow">CANAL RESERVADO</div>' +
          '<h4>Este salão ainda não tem sua bandeira.</h4><p>Entre em uma guilda ou funde a sua para conversar em um espaço exclusivo com seus companheiros.</p>' +
          '<button type="button" data-tvn-guilds>Explorar guildas <span>→</span></button></div>';
      }
      return;
    }
    state.messages = [];
    state.hasMore = false;
    state.unseen = 0;
    renderShell();
    subscribeFeed();
  }

  function cleanup() {
    if (state.client && state.messageChannel) state.client.removeChannel(state.messageChannel);
    if (state.client && state.presenceChannel) state.client.removeChannel(state.presenceChannel);
    state.messageChannel = null;
    state.presenceChannel = null;
    state.presenceKey = null;
    state.user = null;
    state.profile = null;
    state.guild = null;
    state.teacher = false;
    state.pageOpen = false;
    state.loadToken += 1;
    state.loading = false;
    state.online = [];
    state.messages = [];
    state.hasMore = false;
    state.sending = false;
  }

  async function acceptUser(user) {
    if (!user || !user.id || !state.client) return;
    if (state.user && state.user.id === user.id) return;
    cleanup();
    state.user = user;
    await loadCommunityData();
  }

  function initialize() {
    const ctx = window.AcademiaCtx;
    if (!ctx || !ctx.supabase) {
      window.setTimeout(initialize, 120);
      return;
    }
    mountNavigation();
    state.client = ctx.supabase;
    const { data } = state.client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (session && session.user && !window.AcademiaCtx.guest) acceptUser(session.user);
        else cleanup();
      }, 0);
    });
    state.authSubscription = data && data.subscription;
    state.client.auth.getSession().then(({ data: sessionData }) => {
      const session = sessionData && sessionData.session;
      if (session && session.user && !ctx.guest) acceptUser(session.user);
    }).catch(error => console.warn('Sessão da Taverna:', error.message));
  }

  const root = $('rpgView');
  if (root) {
    root.addEventListener('click', event => {
      const tab = event.target.closest('[data-tvn-tab]');
      if (tab) {
        switchChannel(tab.dataset.tvnTab);
        return;
      }
      const emoji = event.target.closest('[data-tvn-emoji]');
      if (emoji) {
        insertEmoji(emoji.dataset.tvnEmoji);
        return;
      }
      const remove = event.target.closest('[data-tvn-delete]');
      if (remove) {
        deleteMessage(remove.dataset.tvnDelete, remove);
        return;
      }
      if (event.target.closest('[data-tvn-older]')) {
        loadOlder();
        return;
      }
      if (event.target.closest('#tvnJumpBottom')) {
        const feed = $('tvnFeed');
        if (feed) feed.scrollTop = feed.scrollHeight;
        const jump = $('tvnJumpBottom');
        if (jump) jump.hidden = true;
        state.unseen = 0;
        return;
      }
      if (event.target.closest('[data-tvn-retry]')) {
        subscribeFeed();
        return;
      }
      if (event.target.closest('[data-tvn-guilds]')) {
        const guildButton = document.querySelector('[data-adventure="guilds"]');
        if (guildButton) guildButton.click();
        else toast('Abra a área Guildas no menu Aventura.');
      }
    });

    root.addEventListener('input', event => {
      if (event.target.id === 'tvnMessageInput') updateComposer();
    });

    root.addEventListener('keydown', event => {
      if (event.target.id === 'tvnMessageInput' && event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        const form = $('tvnComposer');
        if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
      }
    });

    root.addEventListener('submit', event => {
      if (event.target.id === 'tvnComposer') sendMessage(event);
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-tavern-open]');
    if (button) {
      openTavern();
      return;
    }
    if (event.target.closest('.rpgnav button, .nav button')) state.pageOpen = false;
  });

  initialize();
})();