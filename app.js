// ============================================================================
// CONFIGURAÇÃO FIREBASE — JÁ PREENCHIDA COM OS TEUS DADOS
// ============================================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBafvqtM4u2nQQikce19mKXNkwxdxm1fHo",
  authDomain: "pulseiras-finalexam.firebaseapp.com",
  projectId: "pulseiras-finalexam",
  storageBucket: "pulseiras-finalexam.firebasestorage.app",
  messagingSenderId: "859157058286",
  appId: "1:859157058286:web:1de4bb5fed23f1fa0d59ff"
};

// Palavra-passe para visualizar a página
const VIEW_PASSWORD = "finalexam";

// Palavra-passe simples para entrar em modo de edição
const ADMIN_PASSWORD = "pulseiras2026";

// ============================================================================
// IMPORTS FIREBASE
// ============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, doc, onSnapshot, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const DOC_REF = doc(db, "eventos", "pulseiras-evento-2026");

// ============================================================================
// ESTADO
// ============================================================================
const DEFAULT_DATA = {
  price: 4,
  vendedores: [
    { id: 'v1', nome: 'Dona Maria', cat: 'AE', recebidas: 100, vendidas: 0, perdidas: 0, pago: 0, notas: '' },
    { id: 'v2', nome: 'ESCA', cat: 'AE', recebidas: 150, vendidas: 0, perdidas: 0, pago: 0, notas: '' },
    { id: 'v3', nome: 'ESAS', cat: 'AE', recebidas: 100, vendidas: 0, perdidas: 0, pago: 0, notas: '' },
    { id: 'v4', nome: 'Sá de Miranda', cat: 'AE', recebidas: 0, vendidas: 0, perdidas: 0, pago: 0, notas: '' },
    { id: 'v5', nome: 'Fire', cat: 'Chefe', recebidas: 150, vendidas: 0, perdidas: 0, pago: 0, notas: '' },
    { id: 'v6', nome: 'Passos', cat: 'Chefe', recebidas: 100, vendidas: 0, perdidas: 0, pago: 0, notas: '' },
    { id: 'v7', nome: 'Nelao', cat: 'Chefe', recebidas: 150, vendidas: 0, perdidas: 0, pago: 0, notas: '' },
    { id: 'v8', nome: 'Viana', cat: 'Chefe', recebidas: 100, vendidas: 0, perdidas: 0, pago: 0, notas: '' },
    { id: 'v9', nome: 'Ze Oliveira', cat: 'Chefe', recebidas: 150, vendidas: 0, perdidas: 0, pago: 0, notas: '' }
  ]
};

let data = JSON.parse(JSON.stringify(DEFAULT_DATA));
let charts = {};
let isAdmin = false;
let saveTimeout = null;
let appInitialized = false;
let isAuthenticated = false;

// ============================================================================
// ECRÃ DE LOGIN / VISUALIZAÇÃO
// ============================================================================
function showLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  overlay.style.display = 'flex';
  document.getElementById('login-pwd').value = '';
  document.getElementById('login-error').style.display = 'none';
  setTimeout(() => document.getElementById('login-pwd').focus(), 100);
}

function checkViewAuth() {
  showLoginOverlay();

  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = document.getElementById('login-pwd').value;
    if (pwd === VIEW_PASSWORD || pwd === ADMIN_PASSWORD) {
      isAuthenticated = true;
      if (pwd === ADMIN_PASSWORD) {
        isAdmin = true;
      }
      document.getElementById('login-overlay').style.display = 'none';
      if (!appInitialized) {
        appInitialized = true;
        init();
      } else {
        renderAll();
      }
    } else {
      document.getElementById('login-error').style.display = 'block';
      document.getElementById('login-pwd').value = '';
      document.getElementById('login-pwd').focus();
    }
  });
}

// Re-pede password quando a app volta ao primeiro plano
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    isAuthenticated = false;
    isAdmin = false;
  } else if (document.visibilityState === 'visible' && !isAuthenticated) {
    showLoginOverlay();
  }
});

function emMaos(v) { return Math.max(0, v.recebidas - v.vendidas - v.perdidas); }
function totalVenda(v) { return v.vendidas * data.price; }
function formatEur(n) { return Math.round(n).toLocaleString('pt-PT') + ' €'; }

function estado(v) {
  if (v.recebidas === 0) return { cor: '#888780', label: 'Sem pulseiras' };
  if (v.perdidas > 0 && emMaos(v) === 0) return { cor: '#a32d2d', label: 'Fechado c/ perdas' };
  if (v.perdidas > 0) return { cor: '#d85a30', label: 'Com perdas' };
  if (emMaos(v) === 0 && v.vendidas > 0) return { cor: '#3b6d11', label: 'Tudo vendido' };
  if (v.vendidas > 0) return { cor: '#ba7517', label: 'A vender' };
  return { cor: '#185fa5', label: 'Por iniciar' };
}

function setStatus(state, text) {
  const el = document.getElementById('status');
  el.className = 'status ' + state;
  document.getElementById('status-text').textContent = text;
}

function updateAdminUI() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  document.getElementById('readonly-banner').style.display = isAdmin ? 'none' : 'flex';
  document.querySelectorAll('input[type=number], input[type=text], select').forEach(el => {
    if (el.id !== 'price' || isAdmin) {
      el.disabled = !isAdmin && !el.classList.contains('always-enabled');
    }
  });
  const btn = document.getElementById('btn-login');
  btn.innerHTML = isAdmin ? '<i class="ti ti-lock-open"></i>' : '<i class="ti ti-lock"></i>';
  btn.title = isAdmin ? 'Sair (modo admin)' : 'Entrar como admin';
}

async function loadData() {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      data = snap.data();
      data.vendedores = data.vendedores.map(v => ({ vendidas: 0, perdidas: 0, pago: 0, notas: '', ...v }));
    } else {
      await setDoc(DOC_REF, DEFAULT_DATA);
    }
  } catch (e) {
    console.error('Erro a carregar:', e);
    setStatus('offline', 'Sem ligação — verifica config');
  }
}

function subscribeRealtime() {
  onSnapshot(DOC_REF, (snap) => {
    if (snap.exists()) {
      data = snap.data();
      data.vendedores = data.vendedores.map(v => ({ vendidas: 0, perdidas: 0, pago: 0, notas: '', ...v }));
      document.getElementById('price').value = data.price;
      renderAll();
      setStatus('online', 'Sincronizado');
    }
  }, (err) => {
    console.error('Erro tempo real:', err);
    setStatus('offline', 'Sem ligação');
  });
}

async function save() {
  if (!isAdmin) return;
  clearTimeout(saveTimeout);
  setStatus('', 'A guardar...');
  saveTimeout = setTimeout(async () => {
    try {
      await setDoc(DOC_REF, data);
      setStatus('online', 'Guardado às ' + new Date().toLocaleTimeString('pt-PT').slice(0, 5));
    } catch (e) {
      console.error('Erro a guardar:', e);
      setStatus('offline', 'Erro a guardar');
    }
  }, 400);
}

function renderStats() {
  const total = data.vendedores.reduce((s, v) => s + v.recebidas, 0);
  const vend = data.vendedores.reduce((s, v) => s + v.vendidas, 0);
  const maos = data.vendedores.reduce((s, v) => s + emMaos(v), 0);
  const recebido = data.vendedores.reduce((s, v) => s + (v.pago || 0), 0);
  const perdidas = data.vendedores.reduce((s, v) => s + v.perdidas, 0);
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-vendidas').textContent = vend;
  document.getElementById('stat-maos').textContent = maos;
  document.getElementById('stat-receita').textContent = formatEur(vend * data.price);
  document.getElementById('stat-recebido').textContent = formatEur(recebido);
  document.getElementById('stat-falta').textContent = perdidas;
}

function renderCharts() {
  const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const txt = isDark ? '#b4b2a9' : '#444441';
  const grid = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  Object.values(charts).forEach(c => c && c.destroy());

  const aesTotal = data.vendedores.filter(v => v.cat === 'AE').reduce((s, v) => s + v.recebidas, 0);
  const chefesTotal = data.vendedores.filter(v => v.cat === 'Chefe').reduce((s, v) => s + v.recebidas, 0);

  charts.categoria = new Chart(document.getElementById('chart-categoria'), {
    type: 'doughnut',
    data: { labels: ['AEs (' + aesTotal + ')', 'Chefes (' + chefesTotal + ')'], datasets: [{ data: [aesTotal, chefesTotal], backgroundColor: ['#7f77dd', '#1d9e75'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: txt, font: { size: 12 }, boxWidth: 12 } } } }
  });

  const total = data.vendedores.reduce((s, v) => s + v.recebidas, 0);
  const vend = data.vendedores.reduce((s, v) => s + v.vendidas, 0);
  const perd = data.vendedores.reduce((s, v) => s + v.perdidas, 0);
  const maos = total - vend - perd;

  charts.estado = new Chart(document.getElementById('chart-estado'), {
    type: 'doughnut',
    data: { labels: ['Vendidas (' + vend + ')', 'Em mãos (' + maos + ')', 'Perdidas (' + perd + ')'], datasets: [{ data: [vend, maos, perd], backgroundColor: ['#3b6d11', '#ba7517', '#a32d2d'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: txt, font: { size: 11 }, boxWidth: 12 } } } }
  });

  const sorted = [...data.vendedores].sort((a, b) => totalVenda(b) - totalVenda(a));
  document.getElementById('chart-vendedores-wrap').style.height = Math.max(180, sorted.length * 32 + 40) + 'px';

  charts.vendedores = new Chart(document.getElementById('chart-vendedores'), {
    type: 'bar',
    data: { labels: sorted.map(v => v.nome), datasets: [{ label: 'Receita', data: sorted.map(v => totalVenda(v)), backgroundColor: sorted.map(v => v.cat === 'AE' ? '#7f77dd' : '#1d9e75'), borderWidth: 0 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => formatEur(ctx.parsed.x) } } },
      scales: {
        x: { ticks: { color: txt, callback: v => v + ' €' }, grid: { color: grid }, beginAtZero: true },
        y: { ticks: { color: txt, font: { size: 11 } }, grid: { display: false } }
      }
    }
  });
}

function field(id, name, label, val) {
  return `<div class="field"><label>${label}</label><input type="number" min="0" class="field-input" data-id="${id}" data-field="${name}" value="${val}" ${isAdmin ? '' : 'disabled'}></div>`;
}

function renderVendedores() {
  const list = document.getElementById('vendedores-list');
  const grupos = { AE: [], Chefe: [] };
  data.vendedores.forEach(v => grupos[v.cat].push(v));

  list.innerHTML = ['AE', 'Chefe'].map(cat => {
    const items = grupos[cat];
    if (items.length === 0) return '';
    return `<div class="group"><p class="group-title">${cat === 'AE' ? 'Agrupamentos Escolares' : 'Chefes'} (${items.length})</p>` +
      items.map(v => {
        const e = estado(v);
        return `<div class="vendor-card">
          <div class="vendor-header">
            <div class="vendor-name">
              <span class="dot" style="background:${e.cor}"></span>
              <strong>${v.nome}</strong>
              <span class="label">${e.label}</span>
            </div>
            <div class="vendor-info">
              ${emMaos(v)} em mãos · ${formatEur(totalVenda(v))}
              ${isAdmin ? `<button class="btn-del btn-icon admin-only" data-id="${v.id}" title="Remover"><i class="ti ti-trash"></i></button>` : ''}
            </div>
          </div>
          <div class="field-grid">
            ${field(v.id, 'recebidas', 'Recebidas', v.recebidas)}
            ${field(v.id, 'vendidas', 'Vendidas', v.vendidas)}
            ${field(v.id, 'perdidas', 'Perdidas', v.perdidas)}
          </div>
          <input type="text" class="notes-input" data-id="${v.id}" placeholder="Notas" value="${(v.notas || '').replace(/"/g, '&quot;')}" ${isAdmin ? '' : 'disabled'}>
        </div>`;
      }).join('') + '</div>';
  }).join('');

  if (isAdmin) bindVendorEvents();
}

function bindVendorEvents() {
  document.querySelectorAll('.field-input').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const v = data.vendedores.find(x => x.id === e.target.dataset.id);
      const f = e.target.dataset.field;
      let val = Math.max(0, parseInt(e.target.value) || 0);
      if (f === 'vendidas' || f === 'perdidas') {
        const other = f === 'vendidas' ? v.perdidas : v.vendidas;
        if (val + other > v.recebidas) {
          val = v.recebidas - other;
          e.target.value = val;
          alert('Vendidas + perdidas não pode exceder recebidas (' + v.recebidas + ').');
        }
      }
      v[f] = val;
      await save();
      renderAll();
    });
  });
  document.querySelectorAll('.notes-input').forEach(inp => {
    inp.addEventListener('change', async (e) => {
      const v = data.vendedores.find(x => x.id === e.target.dataset.id);
      v.notas = e.target.value;
      await save();
    });
  });
  document.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const v = data.vendedores.find(x => x.id === btn.dataset.id);
      if (confirm('Remover ' + v.nome + '?')) {
        data.vendedores = data.vendedores.filter(x => x.id !== btn.dataset.id);
        await save();
        renderAll();
      }
    });
  });
}

function renderPagamentos() {
  const total = data.vendedores.reduce((s, v) => s + totalVenda(v), 0);
  const rec = data.vendedores.reduce((s, v) => s + (v.pago || 0), 0);
  document.getElementById('pag-total').textContent = formatEur(total);
  document.getElementById('pag-recebido').textContent = formatEur(rec);
  document.getElementById('pag-divida').textContent = formatEur(total - rec);

  const list = document.getElementById('pagamentos-list');
  const ativos = data.vendedores.filter(v => totalVenda(v) > 0 || (v.pago || 0) > 0);
  if (ativos.length === 0) {
    list.innerHTML = '<p class="empty">Ainda não há vendas registadas.</p>';
    return;
  }
  list.innerHTML = ativos.map(v => {
    const dev = totalVenda(v);
    const pago = v.pago || 0;
    const divida = dev - pago;
    const pct = dev > 0 ? Math.min(100, (pago / dev) * 100) : 0;
    const cor = divida <= 0 ? '#3b6d11' : (pago > 0 ? '#ba7517' : '#a32d2d');
    return `<div class="vendor-card">
      <div class="vendor-header">
        <div><strong>${v.nome}</strong> <span class="label" style="margin-left:6px;color:var(--text-secondary);font-size:11px;">${v.cat}</span></div>
        <div style="font-size:13px;color:var(--text-secondary);">${formatEur(pago)} / ${formatEur(dev)}</div>
      </div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${cor};"></div></div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
        <input type="number" min="0" step="0.01" class="pag-input" data-id="${v.id}" value="${pago}" style="width:110px;font-size:13px;" ${isAdmin ? '' : 'disabled'}>
        <span style="font-size:12px;color:var(--text-secondary);">€ recebidos</span>
        ${(isAdmin && divida > 0) ? `<button class="pag-full btn-icon admin-only" data-id="${v.id}">Marcar pago</button>` : ''}
      </div>
    </div>`;
  }).join('');

  if (isAdmin) {
    document.querySelectorAll('.pag-input').forEach(inp => {
      inp.addEventListener('change', async (e) => {
        const v = data.vendedores.find(x => x.id === e.target.dataset.id);
        v.pago = Math.max(0, parseFloat(e.target.value) || 0);
        await save();
        renderAll();
      });
    });
    document.querySelectorAll('.pag-full').forEach(btn => {
      btn.addEventListener('click', async () => {
        const v = data.vendedores.find(x => x.id === btn.dataset.id);
        v.pago = totalVenda(v);
        await save();
        renderAll();
      });
    });
  }
}

function renderAll() {
  renderStats();
  renderCharts();
  renderVendedores();
  renderPagamentos();
  updateAdminUI();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['dashboard', 'vendedores', 'pagamentos'].forEach(t => {
      document.getElementById('tab-' + t).style.display = t === btn.dataset.tab ? 'block' : 'none';
    });
    if (btn.dataset.tab === 'dashboard') renderCharts();
  });
});

document.getElementById('price').addEventListener('change', async (e) => {
  if (!isAdmin) { e.target.value = data.price; return; }
  data.price = Math.max(0, parseFloat(e.target.value) || 0);
  await save();
  renderAll();
});

document.getElementById('btn-add').addEventListener('click', async () => {
  if (!isAdmin) return;
  const nome = document.getElementById('new-name').value.trim();
  const cat = document.getElementById('new-cat').value;
  if (!nome) return;
  data.vendedores.push({ id: 'v' + Date.now(), nome, cat, recebidas: 0, vendidas: 0, perdidas: 0, pago: 0, notas: '' });
  document.getElementById('new-name').value = '';
  await save();
  renderAll();
});

document.getElementById('btn-login').addEventListener('click', () => {
  if (isAdmin) {
    if (confirm('Sair do modo de edição?')) {
      isAdmin = false;
      localStorage.removeItem('isAdmin');
      updateAdminUI();
      renderAll();
    }
  } else {
    const pwd = prompt('Palavra-passe de administrador:');
    if (pwd === ADMIN_PASSWORD) {
      isAdmin = true;
      localStorage.setItem('isAdmin', 'true');
      updateAdminUI();
      renderAll();
    } else if (pwd !== null) {
      alert('Palavra-passe incorrecta.');
    }
  }
});

document.getElementById('btn-export').addEventListener('click', () => {
  const rows = [['Nome', 'Categoria', 'Recebidas', 'Vendidas', 'Em mãos', 'Perdidas', 'Valor (€)', 'Pago (€)', 'Em dívida (€)', 'Notas']];
  data.vendedores.forEach(v => {
    const val = v.vendidas * data.price;
    rows.push([v.nome, v.cat, v.recebidas, v.vendidas, emMaos(v), v.perdidas, val, v.pago || 0, val - (v.pago || 0), v.notas || '']);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pulseiras-evento.csv';
  a.click();
  URL.revokeObjectURL(url);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

async function init() {
  await loadData();
  document.getElementById('price').value = data.price;
  renderAll();
  subscribeRealtime();
}

checkViewAuth();
