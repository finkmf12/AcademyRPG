// Academia RPG · Mensagens privadas entre amigos
(() => {
  'use strict';

  const MAX_LENGTH = 400;
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ATTACHMENTS_BUCKET = 'chat-attachments';
  const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/png','image/webp'];
  const $ = id => document.getElementById(id);
  const state = {
    client: null, user: null, friends: [], selected: null, messages: [],
    unread: {}, latest: {}, privateChannel: null, presenceChannel: null,
    busy: false, selectedImage: null, previewUrl: null, loading: false, loadedFor: null, observer: null
  };

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
  const toast = message => window.AcademiaCtx?.toast?.(message);
  const notify = (title, message) => {
    if (window.AcademiaNotifications?.notify) {
      window.AcademiaNotifications.notify({type:'info',title,message,icon:'✉️'});
    } else toast(title + ' — ' + message);
  };
  const friendName = friend => friend?.player_name || 'Aventureiro';
  const selectedFriend = () => state.friends.find(friend => friend.user_id === state.selected) || null;
  const totalUnread = () => Object.values(state.unread).reduce((sum, value) => sum + Number(value || 0), 0);


  function imageExtension(file) {
    return file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '';
  }

  async function validateImageFile(file) {
    if (!file) throw new Error('Selecione uma imagem.');
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Formato não permitido. Use JPG, PNG ou WEBP.');
    if (file.size > MAX_IMAGE_BYTES) throw new Error('A imagem deve ter no máximo 5 MB.');
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value,index) => bytes[index] === value);
    const webp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
    if (!(file.type === 'image/jpeg' && jpeg || file.type === 'image/png' && png || file.type === 'image/webp' && webp)) {
      throw new Error('O arquivo não corresponde a uma imagem JPG, PNG ou WEBP válida.');
    }
    return imageExtension(file);
  }

  function formatImageSize(bytes) {
    return bytes >= 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  function releaseSelectedImage() {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
    state.selectedImage = null;
    const input = $('tvnPrivateImageInput');
    if (input) input.value = '';
    const preview = $('tvnPrivateImagePreview');
    if (preview) { preview.hidden = true; preview.innerHTML = ''; }
    updatePrivateCounter();
  }

  async function chooseImage(file) {
    if (!file) return;
    try {
      await validateImageFile(file);
      releaseSelectedImage();
      state.selectedImage = file;
      state.previewUrl = URL.createObjectURL(file);
      const preview = $('tvnPrivateImagePreview');
      if (preview) {
        preview.innerHTML = '<img src="' + state.previewUrl + '" alt="Pré-visualização da imagem"><span><b>' + esc(file.name) + '</b><small>' + formatImageSize(file.size) + ' · até 5 MB</small></span><button type="button" data-tvn-image-remove aria-label="Remover imagem anexada" title="Remover imagem">×</button>';
        preview.hidden = false;
      }
      updatePrivateCounter();
    } catch (error) {
      const picker = $('tvnPrivateImageInput');
      if (picker) picker.value = '';
      toast(error.message || 'Não foi possível selecionar esta imagem.');
    }
  }

  async function uploadChatImage(file, directory) {
    const extension = await validateImageFile(file);
    const path = directory + '/' + crypto.randomUUID() + extension;
    const { error } = await state.client.storage.from(ATTACHMENTS_BUCKET).upload(path, file, {
      cacheControl: '86400',
      contentType: file.type,
      upsert: false
    });
    if (error) throw error;
    return path;
  }

  async function resolveMessageImages(messages, friendId) {
    await Promise.all((messages || []).map(async message => {
      if (!message.attachment_path || message.attachment_url || message.attachment_error) return;
      try {
        const { data, error } = await state.client.storage.from(ATTACHMENTS_BUCKET).createSignedUrl(message.attachment_path, 86400);
        if (error || !data?.signedUrl) throw error || new Error('URL temporária indisponível.');
        message.attachment_url = data.signedUrl;
      } catch (error) {
        message.attachment_error = true;
        console.warn('Mensagens privadas · imagem anexada:', error.message);
      }
    }));
    if (friendId && state.selected === friendId && isPrivateOpen()) renderConversation();
  }

  function imageMarkup(message) {
    if (!message.attachment_path) return '';
    if (message.attachment_url) {
      return '<a class="tvn-message-image-link" href="' + esc(message.attachment_url) + '" target="_blank" rel="noopener noreferrer" aria-label="Abrir imagem em tamanho completo"><img class="tvn-message-image" src="' + esc(message.attachment_url) + '" alt="Imagem na conversa com ' + esc(friendName(selectedFriend())) + '" loading="lazy" decoding="async"></a>';
    }
    return '<div class="tvn-message-image-status">' + (message.attachment_error ? 'Imagem indisponível para esta conta.' : 'Carregando imagem anexada...') + '</div>';
  }

  function onlineIds() {
    const presence = state.presenceChannel?.presenceState?.() || {};
    const ids = new Set();
    Object.values(presence).flat().forEach(meta => {
      if (meta?.user_id) ids.add(meta.user_id);
    });
    return ids;
  }

  function injectTab() {
    const tabbar = document.querySelector('#rpgView .tvn-tabbar');
    if (!tabbar || tabbar.querySelector('[data-tvn-tab="private"]')) return;
    tabbar.insertAdjacentHTML('beforeend',
      '<button type="button" class="tvn-tab" data-tvn-tab="private"><span class="tvn-tab-icon">✉</span><span><b>Mensagens privadas</b><small>Conversas com amigos</small></span><em class="tvn-private-tab-count" id="tvnPrivateTabCount" hidden>0</em></button>');
    refreshFriends().catch(error => console.warn('Mensagens privadas · amigos:', error));
    refreshUnread().catch(error => console.warn('Mensagens privadas · não lidas:', error));
  }

  async function refreshFriends() {
    if (!state.client || !state.user) return;
    const {data,error} = await state.client.rpc('list_my_friends');
    if (error) throw error;
    state.friends = (data || []).filter(friend => friend.request_type === 'friend');
    if (state.selected && !state.friends.some(friend => friend.user_id === state.selected)) state.selected = null;
    await refreshLatest();
    if (isPrivateOpen()) renderPrivate();
  }

  async function refreshLatest() {
    if (!state.client || !state.user) return;
    const {data,error} = await state.client.from('private_messages')
      .select('id,sender_id,recipient_id,content,attachment_path,created_at,read_at')
      .or('sender_id.eq.' + state.user.id + ',recipient_id.eq.' + state.user.id)
      .order('created_at',{ascending:false}).limit(500);
    if (error) throw error;
    state.latest = {};
    (data || []).forEach(message => {
      const other = message.sender_id === state.user.id ? message.recipient_id : message.sender_id;
      if (!state.latest[other]) state.latest[other] = message;
    });
    renderFriendList();
  }

  async function refreshUnread() {
    if (!state.client || !state.user) return;
    const {data,error} = await state.client.from('private_messages')
      .select('sender_id').eq('recipient_id',state.user.id).is('read_at',null).limit(1000);
    if (error) throw error;
    state.unread = {};
    (data || []).forEach(row => { state.unread[row.sender_id] = (state.unread[row.sender_id] || 0) + 1; });
    updateUnreadBadge();
    renderFriendList();
  }

  function updateUnreadBadge() {
    const count = totalUnread();
    const badge = $('tvnPrivateTabCount');
    if (badge) {
      badge.hidden = count < 1;
      badge.textContent = count > 99 ? '99+' : String(count);
    }
  }

  function isPrivateOpen() {
    return !!document.querySelector('#rpgView .tvn-private-layout');
  }

  function renderFriendList() {
    const root = $('tvnPrivateFriends');
    if (!root) return;
    const online = onlineIds();
    if (!state.friends.length) {
      root.innerHTML = '<div class="tvn-private-empty-friends"><span>♧</span><b>Nenhum amigo por enquanto</b><p>Adicione aventureiros à sua lista de amigos para iniciar conversas privadas.</p></div>';
      return;
    }
    root.innerHTML = state.friends.map(friend => {
      const id = friend.user_id;
      const last = state.latest[id];
      const unread = Number(state.unread[id] || 0);
      const preview = last ? (last.sender_id === state.user.id ? 'Você: ' : '') + (last.content || (last.attachment_path ? '📷 Imagem' : 'Mensagem')) : 'Comece uma conversa';
      return '<button type="button" class="tvn-private-friend ' + (state.selected === id ? 'is-selected' : '') + '" data-private-friend="' + esc(id) + '">' +
        '<span class="tvn-private-avatar">' + esc(friend.avatar || '🧙') + '<i class="' + (online.has(id) ? 'is-online' : '') + '"></i></span>' +
        '<span class="tvn-private-friend-copy"><b>' + esc(friendName(friend)) + '</b><small>' + esc(preview) + '</small></span>' +
        (unread ? '<em>' + (unread > 99 ? '99+' : unread) + '</em>' : '') +
        '</button>';
    }).join('');
  }

  function renderPrivate() {
    const grid = document.querySelector('#rpgView .tvn-grid');
    if (!grid) return;
    const friend = selectedFriend();
    grid.className = 'tvn-private-layout';
    grid.innerHTML =
      '<aside class="tvn-private-list-card">' +
        '<div class="tvn-private-list-heading"><small>SEUS CONTATOS</small><h3>Companheiros</h3><p>Converse em particular com seus amigos.</p></div>' +
        '<div class="tvn-private-friends" id="tvnPrivateFriends"><div class="tvn-feed-loading"><span class="tvn-spinner"></span><b>Chamando seus aliados...</b></div></div>' +
      '</aside>' +
      '<section class="tvn-chat-card tvn-private-chat-card">' +
        (friend
          ? '<header class="tvn-chat-head tvn-private-chat-head"><div class="tvn-channel-mark">' + esc(friend.avatar || '🧙') + '</div><div class="tvn-channel-title"><div class="tvn-eyebrow">CONVERSA PARTICULAR</div><h3>' + esc(friendName(friend)) + '</h3><p>Somente você e este amigo podem ver as mensagens.</p></div><span class="tvn-private-lock">🔒 PRIVADO</span></header>' +
            '<div class="tvn-feed" id="tvnPrivateFeed" role="log" aria-live="polite"><div class="tvn-feed-loading"><span class="tvn-spinner"></span><b>Preparando a conversa...</b></div></div>' +
            '<form class="tvn-composer" id="tvnPrivateComposer"><div class="tvn-composer-top"><span>Mensagem direta para ' + esc(friendName(friend)) + '</span><span id="tvnPrivateCounter">0 / ' + MAX_LENGTH + '</span></div><div class="tvn-compose-row"><button type="button" class="tvn-attach" data-tvn-attach aria-label="Anexar imagem" title="Anexar imagem">▧</button><textarea id="tvnPrivateInput" maxlength="' + MAX_LENGTH + '" rows="1" placeholder="Escreva uma mensagem privada..." aria-label="Mensagem privada"></textarea><button type="submit" class="tvn-send" id="tvnPrivateSend"><span>Enviar</span><b>➤</b></button></div><input type="file" id="tvnPrivateImageInput" accept="image/jpeg,image/png,image/webp" hidden><div class="tvn-image-preview" id="tvnPrivateImagePreview" hidden></div><div class="tvn-composer-hint"><span>Enter para enviar · Shift + Enter para pular linha</span><span>Conversa protegida entre amigos.</span></div></form>'
          : '<div class="tvn-private-no-selection"><div>✉</div><h3>Escolha um companheiro</h3><p>Selecione um amigo na lista ao lado para abrir uma conversa privada.</p></div>') +
      '</section>';
    renderFriendList();
    if (friend) loadConversation(friend.user_id).catch(error => {
      console.error('Mensagens privadas · carregar:', error);
      const feed = $('tvnPrivateFeed');
      if (feed) feed.innerHTML = '<div class="tvn-error"><b>Não foi possível abrir esta conversa.</b><p>' + esc(error.message) + '</p></div>';
    });
  }

  function renderConversation() {
    const feed = $('tvnPrivateFeed');
    if (!feed) return;
    if (!state.messages.length) {
      feed.innerHTML = '<div class="tvn-empty"><div class="tvn-empty-mark">✉</div><b>Uma nova conversa começa aqui.</b><p>Envie a primeira mensagem para seu companheiro.</p></div>';
      return;
    }
    feed.innerHTML = state.messages.map(message => {
      const own = message.sender_id === state.user.id;
      const sender = own ? 'Você' : friendName(selectedFriend());
      return '<article class="tvn-message ' + (own ? 'is-own' : '') + '" data-private-message-id="' + esc(message.id) + '">' +
        '<div class="tvn-message-avatar">' + esc(own ? (window.AcademiaCtx?.user?.user_metadata?.avatar_url ? '🧙' : '✦') : (selectedFriend()?.avatar || '🧙')) + '</div>' +
        '<div class="tvn-message-main"><div class="tvn-message-meta"><b>' + esc(sender) + '</b><time>' + formatTime(message.created_at) + '</time></div>' +
        (message.content ? '<div class="tvn-message-bubble">' + formatContent(message.content) + '</div>' : '') + imageMarkup(message) + '</div></article>';
    }).join('');
    feed.scrollTop = feed.scrollHeight;
  }

  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(date);
  }
  function formatContent(value) {
    return esc(value).replace(/\n/g,'<br>');
  }

  async function loadConversation(friendId) {
    if (!state.client || !state.user || !friendId) return;
    state.loading = true;
    const feed = $('tvnPrivateFeed');
    if (feed) feed.innerHTML = '<div class="tvn-feed-loading"><span class="tvn-spinner"></span><b>Carregando mensagens...</b></div>';
    const uid = state.user.id;
    const {data,error} = await state.client.from('private_messages').select('*')
      .or('and(sender_id.eq.' + uid + ',recipient_id.eq.' + friendId + '),and(sender_id.eq.' + friendId + ',recipient_id.eq.' + uid + ')')
      .order('created_at',{ascending:true}).limit(100);
    if (error) throw error;
    if (state.selected !== friendId || !isPrivateOpen()) return;
    state.messages = data || [];
    await state.client.rpc('mark_private_messages_read',{p_other_user_id:friendId});
    delete state.unread[friendId];
    updateUnreadBadge();
    renderConversation();
    renderFriendList();
    resolveMessageImages(state.messages.slice(), friendId);
    state.loading = false;
  }

  async function sendPrivateMessage(event) {
    event.preventDefault();
    const input = $('tvnPrivateInput');
    const content = input?.value.trim() || '';
    const friend = selectedFriend();
    const file = state.selectedImage;
    if (!friend || (!content && !file) || state.busy || !state.client) return;
    if (content.length > MAX_LENGTH) return;
    state.busy = true;
    updatePrivateCounter();
    let uploadedPath = null;
    try {
      if (file) uploadedPath = await uploadChatImage(file, state.user.id + '/private/' + friend.user_id);
      const {data,error} = await state.client.rpc('send_private_message',{
        p_recipient_id:friend.user_id,
        p_content:content,
        p_attachment_path:uploadedPath
      });
      if (error) throw error;
      const message = data;
      if (message && !state.messages.some(row => String(row.id) === String(message.id))) {
        state.messages.push(message);
        state.messages.sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
      }
      input.value = '';
      releaseSelectedImage();
      updatePrivateCounter();
      renderConversation();
      if (message?.attachment_path) resolveMessageImages([message], friend.user_id);
      await refreshLatest();
    } catch (error) {
      if (uploadedPath) {
        try { await state.client.storage.from(ATTACHMENTS_BUCKET).remove([uploadedPath]); } catch (_) {}
      }
      toast(error.message || 'Não foi possível enviar a mensagem privada.');
    } finally {
      state.busy = false;
      updatePrivateCounter();
      input?.focus();
    }
  }

  function updatePrivateCounter() {
    const input = $('tvnPrivateInput');
    const counter = $('tvnPrivateCounter');
    const button = $('tvnPrivateSend');
    if (counter) counter.textContent = (input?.value.length || 0) + ' / ' + MAX_LENGTH;
    if (button) button.disabled = state.busy || (!input?.value.trim() && !state.selectedImage);
  }

  function selectFriend(id) {
    if (!state.friends.some(friend => friend.user_id === id)) return;
    releaseSelectedImage();
    state.selected = id;
    state.messages = [];
    renderPrivate();
  }

  function handleRealtime(message) {
    if (!message || !state.user) return;
    const other = message.sender_id === state.user.id ? message.recipient_id : message.sender_id;
    if (state.selected === other && isPrivateOpen()) {
      if (!state.messages.some(row => String(row.id) === String(message.id))) {
        state.messages.push(message);
        state.messages.sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
        renderConversation();
        if (message.attachment_path) resolveMessageImages([message], other);
      }
      if (message.recipient_id === state.user.id) {
        state.client.rpc('mark_private_messages_read',{p_other_user_id:other})
          .then(() => { delete state.unread[other]; updateUnreadBadge(); renderFriendList(); });
      }
    } else if (message.recipient_id === state.user.id) {
      state.unread[other] = (state.unread[other] || 0) + 1;
      updateUnreadBadge();
      renderFriendList();
      const friend = state.friends.find(item => item.user_id === other);
      notify('Nova mensagem privada', (friendName(friend)) + ' enviou uma mensagem.');
    }
    refreshLatest().catch(() => {});
  }

  function startRealtime() {
    if (!state.client || !state.user || state.privateChannel) return;
    const channel = state.client.channel('private-messages-' + state.user.id);
    channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages',filter:'sender_id=eq.' + state.user.id},payload => handleRealtime(payload.new));
    channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages',filter:'recipient_id=eq.' + state.user.id},payload => handleRealtime(payload.new));
    state.privateChannel = channel;
    channel.subscribe(status => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('Mensagens privadas: canal em tempo real indisponível.');
    });

    const presence = state.client.channel('tavern-presence',{config:{presence:{key:'private-' + state.user.id}}});
    presence.on('presence',{event:'sync'},renderFriendList);
    state.presenceChannel = presence;
    presence.subscribe(status => {
      if (status === 'SUBSCRIBED') renderFriendList();
    });
  }

  function stopRealtime() {
    if (state.client && state.privateChannel) state.client.removeChannel(state.privateChannel);
    if (state.client && state.presenceChannel) state.client.removeChannel(state.presenceChannel);
    state.privateChannel = null;
    state.presenceChannel = null;
  }

  function openPrivateTab(button) {
    button?.classList.add('is-active');
    document.querySelectorAll('#rpgView .tvn-tab').forEach(tab => tab.classList.toggle('is-active',tab === button));
    const grid = document.querySelector('#rpgView .tvn-grid');
    if (!grid) return;
    releaseSelectedImage();
    state.selected = null;
    state.messages = [];
    renderPrivate();
    refreshFriends().then(() => refreshUnread()).catch(error => toast(error.message || 'Não foi possível carregar seus amigos.'));
  }

  function bindEvents() {
    document.addEventListener('click',event => {
      const tab = event.target.closest('#rpgView [data-tvn-tab]');
      if (tab) {
        if (tab.dataset.tvnTab === 'private') {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          openPrivateTab(tab);
        }
        return;
      }
      const attachButton = event.target.closest('#rpgView [data-tvn-attach]');
      if (attachButton && isPrivateOpen()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        $('tvnPrivateImageInput')?.click();
        return;
      }
      const removeImage = event.target.closest('#rpgView [data-tvn-image-remove]');
      if (removeImage && isPrivateOpen()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        releaseSelectedImage();
        return;
      }
      const friendButton = event.target.closest('#rpgView [data-private-friend]');
      if (friendButton) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        selectFriend(friendButton.dataset.privateFriend);
      }
    },true);

    document.addEventListener('submit',event => {
      if (event.target?.id === 'tvnPrivateComposer') sendPrivateMessage(event);
    },true);
    document.addEventListener('input',event => {
      if (event.target?.id === 'tvnPrivateInput') updatePrivateCounter();
    });
    document.addEventListener('change',event => {
      if (event.target?.id === 'tvnPrivateImageInput') chooseImage(event.target.files?.[0]);
    },true);
    document.addEventListener('dragover',event => {
      if (!event.target.closest('#rpgView .tvn-private-chat-card') || !event.dataTransfer?.types?.includes('Files')) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.dataTransfer.dropEffect = 'copy';
      $('tvnPrivateComposer')?.classList.add('is-dragging-image');
    },true);
    document.addEventListener('dragleave',event => {
      const card = event.target.closest('#rpgView .tvn-private-chat-card');
      if (!card) return;
      if (!event.relatedTarget || !card.contains(event.relatedTarget)) $('tvnPrivateComposer')?.classList.remove('is-dragging-image');
    },true);
    document.addEventListener('drop',event => {
      if (!event.target.closest('#rpgView .tvn-private-chat-card') || !event.dataTransfer?.files?.length) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      $('tvnPrivateComposer')?.classList.remove('is-dragging-image');
      chooseImage(event.dataTransfer.files[0]);
    },true);
  }

  function handleAuth(user) {
    if (state.user?.id === user?.id) return;
    stopRealtime();
    state.user = user || null;
    state.friends = [];
    releaseSelectedImage();
    state.selected = null;
    state.messages = [];
    state.unread = {};
    state.latest = {};
    state.loadedFor = null;
    if (state.user) {
      startRealtime();
    }
  }

  function observeTavern() {
    const root = $('rpgView');
    if (!root || state.observer) return;
    state.observer = new MutationObserver(() => {
      if (document.querySelector('#rpgView .tvn-page')) injectTab();
    });
    state.observer.observe(root,{childList:true,subtree:true});
    if (document.querySelector('#rpgView .tvn-page')) injectTab();
  }

  function initialize() {
    const ctx = window.AcademiaCtx;
    if (!ctx?.supabase) {
      window.setTimeout(initialize,150);
      return;
    }
    state.client = ctx.supabase;
    handleAuth(ctx.user || null);
    state.client.auth.onAuthStateChange((_event,session) => {
      window.setTimeout(() => handleAuth(session?.user || null),0);
    });
    bindEvents();
    observeTavern();
  }

  initialize();
})();