// Khuloud stall billing: tap products, type the amount, show a QR that opens WhatsApp
// with the order. Sales are kept on the phone and uploaded to a Google Sheet when online.
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  // ---------- storage ----------
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { toast('Phone storage is full!'); } };

  const DEFAULTS = { staff: '', event: 'Diwali Mela', wa: '918368132033', sheet: '' };
  let S = { ...DEFAULTS, ...load('kb_settings', {}) };
  let orders = load('kb_orders', []);
  let cart = load('kb_cart', []);            // [{name, size, qty}]
  let pay = load('kb_pay', '');
  let device = load('kb_device', '');
  if (!device) {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', N = '23456789';
    device = A[Math.random() * A.length | 0] + N[Math.random() * N.length | 0];
    save('kb_device', device);
  }
  navigator.storage?.persist?.().catch(() => {});

  const saveOrders = () => save('kb_orders', orders);
  const saveCart = () => { save('kb_cart', cart); save('kb_pay', pay); };

  // ---------- helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const itemLabel = it => it.size ? `${it.name} ${it.size}` : it.name;
  const itemCount = items => items.reduce((a, it) => a + it.qty, 0);
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.style.display = 'block';
    clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', 1600);
  }
  const prefix = () => (S.event || 'Stall').split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 3) || 'KS';
  function nextId() {
    const n = load('kb_seq', 0) + 1; save('kb_seq', n);
    return `${prefix()}-${device}-${String(n).padStart(3, '0')}`;
  }

  function message(o) {
    return [
      o.customer ? `Hi Khuloud! This is ${o.customer}. I just bought from your stall at ${o.event}.`
                 : `Hi Khuloud! I just bought from your stall at ${o.event}.`,
      `Order: ${o.id}`,
      ...o.items.map(it => `- ${itemLabel(it)} x${it.qty}`),
      `Amount paid: ${inr(o.amount)}`,
      `Kindly send me my bill.`,
    ].join('\n');
  }
  const waLink = o => `https://wa.me/${(S.wa || DEFAULTS.wa).replace(/\D/g, '')}?text=${encodeURIComponent(message(o))}`;

  // ---------- header / tabs ----------
  function renderMeta() {
    $('#meta').textContent = `${S.event || 'No event set'} · ${S.staff || 'no name set'}`;
    document.documentElement.style.setProperty('--hh', $('#hdr').offsetHeight + 'px');
  }
  function showTab(name) {
    $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    ['sell', 'orders', 'setup'].forEach(t => $('#tab-' + t).hidden = t !== name);
    $('#cartbar').hidden = name !== 'sell';
    if (name === 'orders') renderOrders();
    if (name === 'setup') renderSetup();
    window.scrollTo(0, 0);
  }
  $$('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));

  // ---------- product grid ----------
  let cat = '', query = '';
  function inCart(name) { return cart.filter(c => c.name === name).reduce((a, c) => a + c.qty, 0); }
  function renderGrid() {
    const q = query.trim().toLowerCase();
    const list = CATALOG.filter(p => (!cat || p.cat === cat) && (!q || p.name.toLowerCase().includes(q)));
    $('#grid').innerHTML = list.length ? list.map(p => {
      const i = CATALOG.indexOf(p), n = inCart(p.name);
      const pic = p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : `<div class="ph">K</div>`;
      const btns = p.sizes.length
        ? `<div class="sizes">${p.sizes.map(s => `<button data-p="${i}" data-s="${esc(s)}">${esc(s.replace(' mL', ''))}</button>`).join('')}</div>`
        : `<div class="sizes"><button data-p="${i}" data-s="">Add</button></div>`;
      return `<div class="card"><div class="top">${pic}<div><div class="nm">${esc(p.name)}</div>${n ? `<div class="incart">In cart: ${n}</div>` : ''}</div></div>${btns}</div>`;
    }).join('') : `<div class="empty">Nothing matches "${esc(query)}"</div>`;
  }
  $('#grid').addEventListener('click', e => {
    const b = e.target.closest('button[data-p]'); if (!b) return;
    const p = CATALOG[+b.dataset.p], size = b.dataset.s;
    const ex = cart.find(c => c.name === p.name && c.size === size);
    if (ex) ex.qty++; else cart.push({ name: p.name, size, qty: 1 });
    saveCart(); renderGrid(); renderCartBar();
    navigator.vibrate?.(15);
    toast('+ ' + itemLabel({ name: p.name, size }));
  });
  $('#q').addEventListener('input', e => { query = e.target.value; renderGrid(); });
  $$('.tools .chip').forEach(c => c.onclick = () => {
    cat = c.dataset.cat; $$('.tools .chip').forEach(x => x.classList.toggle('on', x === c)); renderGrid();
  });

  // ---------- cart ----------
  function renderCartBar() {
    const n = itemCount(cart);
    $('#ct').innerHTML = n ? `<b>${n}</b> item${n > 1 ? 's' : ''} for this customer` : 'Tap a size to add';
    $('#openCart').disabled = !n;
  }
  function renderCart() {
    $('#lines').innerHTML = cart.map((c, i) => `
      <div class="line"><div class="n">${esc(c.name)}${c.size ? `<small>${esc(c.size)}</small>` : ''}</div>
      <div class="qty"><button data-i="${i}" data-d="-1">−</button><span>${c.qty}</span><button data-i="${i}" data-d="1">+</button></div></div>`).join('')
      || '<div class="empty">Cart is empty</div>';
    $$('#pay .chip').forEach(c => c.classList.toggle('on', c.dataset.pay === pay));
  }
  $('#lines').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    const c = cart[+b.dataset.i]; c.qty += +b.dataset.d;
    if (c.qty <= 0) cart.splice(+b.dataset.i, 1);
    saveCart(); renderCart(); renderCartBar(); renderGrid();
    if (!cart.length) closeSheet();
  });
  $$('#pay .chip').forEach(c => c.onclick = () => { pay = pay === c.dataset.pay ? '' : c.dataset.pay; saveCart(); renderCart(); });
  $('#amount').addEventListener('input', e => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 7);
    e.target.value = d ? Number(d).toLocaleString('en-IN') : '';
  });
  const openSheet = () => { renderCart(); $('#cartSheet').classList.add('show'); };
  const closeSheet = () => $('#cartSheet').classList.remove('show');
  $('#openCart').onclick = openSheet;
  $('[data-close]').onclick = closeSheet;
  $('#cartSheet').addEventListener('click', e => { if (e.target.id === 'cartSheet') closeSheet(); });
  $('#clear').onclick = () => {
    if (!confirm('Remove everything from this customer\'s cart?')) return;
    cart = []; pay = ''; $('#amount').value = ''; $('#cname').value = ''; saveCart(); closeSheet(); renderCartBar(); renderGrid();
  };

  $('#makeQr').onclick = () => {
    const amount = Number($('#amount').value.replace(/\D/g, ''));
    if (!cart.length) return;
    if (!amount) { $('#amount').focus(); toast('Type the amount paid first'); return; }
    if (!S.staff) { toast('Add your name in Setup first'); closeSheet(); showTab('setup'); return; }
    const o = {
      id: nextId(), ts: Date.now(), event: S.event, staff: S.staff, device,
      customer: $('#cname').value.trim().replace(/\s+/g, ' ').slice(0, 60),
      items: cart.map(c => ({ ...c })), amount, pay, status: 'ok', rev: 1, synced: 0,
    };
    orders.push(o); saveOrders();
    cart = []; pay = ''; $('#amount').value = ''; $('#cname').value = ''; saveCart();
    closeSheet(); renderCartBar(); renderGrid();
    showQr(o);
    sync();
  };

  // ---------- QR ----------
  let qrOrder = null;
  function showQr(o) {
    qrOrder = o;
    $('#toast').style.display = 'none';
    const qr = qrcode(0, 'L');
    qr.addData(waLink(o), 'Byte');
    qr.make();
    $('#qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    $('#qrOid').textContent = `Order ${o.id}${o.customer ? ' · ' + o.customer : ''}`;
    $('#qrItems').innerHTML = o.items.map(it => esc(`${itemLabel(it)} ×${it.qty}`)).join('<br>') + `<br><b>${inr(o.amount)}</b>`;
    $('#qrwrap').classList.add('show');
  }
  $('#qrDone').onclick = () => { $('#qrwrap').classList.remove('show'); qrOrder = null; };
  $('#copyMsg').onclick = async () => {
    if (!qrOrder) return;
    try { await navigator.clipboard.writeText(message(qrOrder)); toast('Message copied'); }
    catch { prompt('Copy this message:', message(qrOrder)); }
  };

  // ---------- orders ----------
  let viewDay = dayKey(Date.now());
  $('#day').value = viewDay;
  $('#day').onchange = e => { viewDay = e.target.value || dayKey(Date.now()); renderOrders(); };
  $('#today').onclick = () => { viewDay = dayKey(Date.now()); $('#day').value = viewDay; renderOrders(); };
  $('#syncnow').onclick = () => { if (!S.sheet) { toast('Add the Google Sheet link in Setup'); return; } sync(true); };

  function renderOrders() {
    const list = orders.filter(o => dayKey(o.ts) === viewDay).sort((a, b) => b.ts - a.ts);
    const live = list.filter(o => o.status !== 'cancelled');
    const sum = f => live.filter(f).reduce((a, o) => a + o.amount, 0);
    const pending = orders.filter(o => !o.synced).length;
    $('#stats').innerHTML = `
      <div class="stat"><b>${live.length}</b><span>orders</span></div>
      <div class="stat"><b>${inr(sum(() => true))}</b><span>total amount</span></div>
      <div class="stat"><b>${live.reduce((a, o) => a + itemCount(o.items), 0)}</b><span>items sold</span></div>
      <div class="stat"><b>${pending}</b><span>${S.sheet ? 'waiting to upload' : 'not uploaded (no Sheet link)'}</span></div>
      <div class="stat" style="grid-column:1/-1;font-size:14px">
        Cash ${inr(sum(o => o.pay === 'Cash'))} · UPI ${inr(sum(o => o.pay === 'UPI'))} · Card ${inr(sum(o => o.pay === 'Card'))}${sum(o => !o.pay) ? ` · Not marked ${inr(sum(o => !o.pay))}` : ''}
      </div>`;
    $('#orders').innerHTML = list.length ? list.map(o => {
      const t = new Date(o.ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
      const tag = o.status === 'cancelled' ? '<span class="tag c">cancelled</span>' : o.synced ? '<span class="tag s">in Sheet</span>' : '<span class="tag p">waiting</span>';
      return `<div class="order${o.status === 'cancelled' ? ' cx' : ''}">
        <div class="h"><span><b>${esc(o.id)}</b> · ${t} · ${esc(o.staff)}${o.customer ? ' · <b>' + esc(o.customer) + '</b>' : ''}</span>${tag}</div>
        <div class="it">${o.items.map(it => esc(`${itemLabel(it)} ×${it.qty}`)).join(', ')}</div>
        <div class="h"><b>${inr(o.amount)}${o.pay ? ' · ' + esc(o.pay) : ''}</b>
          <span class="acts">${o.status === 'cancelled'
            ? `<button class="btn sec" data-a="restore" data-id="${esc(o.id)}">Restore</button>`
            : `<button class="btn sec" data-a="qr" data-id="${esc(o.id)}">Show QR</button><button class="btn bad" data-a="cancel" data-id="${esc(o.id)}">Cancel</button>`}</span></div>
      </div>`;
    }).join('') : '<div class="empty">No orders on this day on this phone.</div>';
  }
  $('#orders').addEventListener('click', e => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const o = orders.find(x => x.id === b.dataset.id); if (!o) return;
    if (b.dataset.a === 'qr') return showQr(o);
    if (b.dataset.a === 'cancel' && !confirm(`Cancel order ${o.id}? It stays in the Sheet marked as cancelled.`)) return;
    o.status = b.dataset.a === 'cancel' ? 'cancelled' : 'ok';
    o.rev = (o.rev || 1) + 1; o.synced = 0;
    saveOrders(); renderOrders(); renderSync(); sync();
  });

  // ---------- Google Sheet sync ----------
  let syncing = false;
  const row = o => ({
    id: o.id, date: dayKey(o.ts), time: new Date(o.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    event: o.event, staff: o.staff, customer: o.customer || '', items: o.items.map(it => `${itemLabel(it)} x${it.qty}`).join(', '),
    count: itemCount(o.items), amount: o.amount, pay: o.pay, status: o.status, device: o.device, ts: o.ts,
  });
  async function sync(manual) {
    if (syncing || !S.sheet) return renderSync();
    if (!navigator.onLine) { renderSync(); if (manual) toast('No internet. Will upload when back online.'); return; }
    const pending = orders.filter(o => !o.synced);
    if (!pending.length) { renderSync(); if (manual) toast('Everything is already in the Sheet'); return; }
    syncing = true; renderSync();
    const sent = pending.slice(0, 50).map(o => [o.id, o.rev]);
    try {
      const r = await fetch(S.sheet, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ orders: pending.slice(0, 50).map(row) }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Sheet refused');
      sent.forEach(([id, rev]) => { const o = orders.find(x => x.id === id); if (o && o.rev === rev) o.synced = 1; });
      saveOrders();
      if (manual) toast('Uploaded to the Sheet ✓');
    } catch (e) {
      if (manual) toast('Upload failed: ' + e.message);
    }
    syncing = false; renderSync();
    if (!$('#tab-orders').hidden) renderOrders();
    if (orders.some(o => !o.synced) && navigator.onLine && !manual) setTimeout(sync, 20000);
  }
  function renderSync() {
    const n = orders.filter(o => !o.synced).length, el = $('#sync');
    el.className = 'sync';
    if (!S.sheet) { el.textContent = n ? `${n} saved on phone` : 'No Sheet'; return; }
    if (!navigator.onLine) { el.classList.add('off'); el.textContent = `Offline · ${n} waiting`; return; }
    if (syncing) { el.textContent = 'Uploading…'; return; }
    if (n) { el.classList.add('off'); el.textContent = `${n} waiting`; return; }
    el.classList.add('ok'); el.textContent = 'All uploaded ✓';
  }
  addEventListener('online', () => sync());
  addEventListener('offline', renderSync);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  setInterval(() => sync(), 60000);

  // ---------- setup ----------
  function renderSetup() {
    $('#sStaff').value = S.staff; $('#sEvent').value = S.event; $('#sWa').value = S.wa; $('#sSheet').value = S.sheet;
    $('#setupNote').innerHTML = S.staff
      ? `Logged in as <b>${esc(S.staff)}</b> at <b>${esc(S.event)}</b>.`
      : `<b>First time on this phone?</b> Type your name below and press Save. Your name goes on every sale you make.`;
    $('#dev').textContent = `Phone code: ${device} (order numbers from this phone look like ${prefix()}-${device}-001). Orders saved on this phone: ${orders.length}.`;
  }
  $('#save').onclick = () => {
    S = {
      staff: $('#sStaff').value.trim(), event: $('#sEvent').value.trim() || DEFAULTS.event,
      wa: $('#sWa').value.replace(/\D/g, '') || DEFAULTS.wa, sheet: $('#sSheet').value.trim(),
    };
    if (!S.staff) { toast('Please type your name'); $('#sStaff').focus(); return; }
    save('kb_settings', S); renderMeta(); renderSetup(); renderSync(); toast('Saved'); sync();
  };
  $('#wipe').onclick = () => {
    const done = orders.filter(o => o.synced).length, waiting = orders.length - done;
    if (!done) return toast(waiting ? 'These orders are not in the Sheet yet. Upload them first.' : 'No orders on this phone');
    if (!confirm(`Remove ${done} uploaded order(s) from this phone?${waiting ? ` ${waiting} not-yet-uploaded order(s) will be kept.` : ''} The Sheet is not changed.`)) return;
    orders = orders.filter(o => !o.synced); saveOrders(); renderSetup(); renderSync(); toast('Cleared from this phone');
  };
  $('#test').onclick = async () => {
    const url = $('#sSheet').value.trim();
    if (!url) return toast('Paste the Google Sheet link first');
    try { const j = await (await fetch(url)).json(); toast(j.ok ? 'Sheet connected ✓' : 'Sheet says: ' + (j.error || 'not OK')); }
    catch (e) { toast('Could not reach the Sheet: ' + e.message); }
  };
  $('#share').onclick = async () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({ event: S.event, wa: S.wa, sheet: S.sheet }))));
    const link = location.origin + location.pathname + '#setup=' + data;
    try { await navigator.clipboard.writeText(link); toast('Setup link copied. Send it to your staff.'); }
    catch { prompt('Send this link to your staff:', link); }
  };
  // Opening a setup link fills in event, number and Sheet (staff then add their own name).
  if (location.hash.startsWith('#setup=')) {
    try {
      const d = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(7)))));
      S = { ...S, event: d.event || S.event, wa: d.wa || S.wa, sheet: d.sheet ?? S.sheet };
      save('kb_settings', S);
      setTimeout(() => toast('Setup loaded. Add your name and press Save.'), 300);
    } catch { toast('That setup link is broken'); }
    history.replaceState(null, '', location.pathname);
  }

  // ---------- start ----------
  renderMeta(); renderGrid(); renderCartBar(); renderSync();
  if (!S.staff) showTab('setup');
  addEventListener('resize', renderMeta);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  sync();
})();
