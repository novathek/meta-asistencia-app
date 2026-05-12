/* ================================================================
   app.js — Lógica de la App de Asistencia
   Firebase Firestore + datos embebidos (data.js)
   ================================================================ */

'use strict';

// ── Firebase init ───────────────────────────────────────────────
let db;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
  console.log('[Firebase] conectado');
} catch (e) {
  console.warn('[Firebase] error de configuración:', e.message);
  db = null;
}

// ── Utilidades de fecha ─────────────────────────────────────────
function hoyISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function horaLocal() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

// ── Normalización de texto (para búsqueda fuzzy) ────────────────
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita tildes
    .replace(/[^a-z0-9\s]/g, '')       // solo letras/números
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyMatch(text, query) {
  const normalText  = normalize(text);
  const normalQuery = normalize(query);
  const words = normalQuery.split(' ').filter(Boolean);
  return words.every(w => normalText.includes(w));
}

// ── Estado global ───────────────────────────────────────────────
const State = {
  role:           null,   // 'aplicador' | 'veedor'
  persona:        null,   // objeto del DB (o null si es nuevo)
  asistencias:    [],     // cache local de asistencias del día
  lastScreen:     null,   // para navegar hacia atrás
};

// ── Navegación entre pantallas ──────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Alertas ─────────────────────────────────────────────────────
function setAlert(containerId, type, msg) {
  const icons = { error: '❌', warning: '⚠️', success: '✅', info: 'ℹ️' };
  const el = document.getElementById(containerId);
  if (!msg) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="alert ${type}">
      <span class="alert-icon">${icons[type]||'ℹ️'}</span>
      <span>${msg}</span>
    </div>`;
}

// ── Spinners ─────────────────────────────────────────────────────
function setLoading(btnId, spinnerId, textEl, loading) {
  const btn = document.getElementById(btnId);
  const sp  = document.getElementById(spinnerId);
  const txt = document.getElementById(textEl);
  btn.disabled = loading;
  sp.style.display  = loading ? 'block' : 'none';
  txt.style.display = loading ? 'none'  : 'inline';
}

// ================================================================
//  App — objeto principal
// ================================================================
const App = {

  // ── Seleccionar rol ─────────────────────────────────────────
  selectRole(role) {
    State.role = role;
    State.persona = null;
    if (role === 'aplicador') {
      document.getElementById('input-dni').value = '';
      setAlert('alert-aplicador', 'info', '');
      document.getElementById('btn-buscar-dni').disabled = true;
      showScreen('screen-aplicador');
      setTimeout(() => document.getElementById('input-dni').focus(), 350);
    } else {
      document.getElementById('input-nombre').value = '';
      document.getElementById('results-veedor').innerHTML = '';
      setAlert('alert-veedor', 'info', '');
      document.getElementById('btn-buscar-nombre').disabled = true;
      showScreen('screen-veedor');
      setTimeout(() => document.getElementById('input-nombre').focus(), 350);
    }
  },

  goHome() {
    State.role = null; State.persona = null;
    showScreen('screen-role');
  },

  goBack() {
    if (State.role === 'aplicador') showScreen('screen-aplicador');
    else                             showScreen('screen-veedor');
  },

  // ── Inputs: habilitar botón ─────────────────────────────────
  onDniInput() {
    const val = document.getElementById('input-dni').value.replace(/\D/g,'');
    document.getElementById('input-dni').value = val;
    document.getElementById('btn-buscar-dni').disabled = val.length < 6;
    setAlert('alert-aplicador', 'info', '');
  },

  onNombreInput() {
    const val = document.getElementById('input-nombre').value;
    document.getElementById('btn-buscar-nombre').disabled = val.trim().length < 3;
    document.getElementById('results-veedor').innerHTML = '';
    setAlert('alert-veedor', 'info', '');
  },

  // ── APLICADOR: Buscar por DNI ───────────────────────────────
  async buscarAplicador() {
    const dniStr = document.getElementById('input-dni').value.trim();
    const dni    = parseInt(dniStr, 10);
    if (!dni || isNaN(dni)) return;

    setLoading('btn-buscar-dni', 'spinner-dni', 'btn-buscar-dni-text', true);
    setAlert('alert-aplicador', 'info', '');

    // Buscar en DB local
    const persona = DB.aplicadores.find(p => p.dni === dni);

    // Verificar si ya registró asistencia hoy
    const yaRegistrado = await this._yaRegistrado(dniStr, 'aplicador');
    setLoading('btn-buscar-dni', 'spinner-dni', 'btn-buscar-dni-text', false);

    if (yaRegistrado) {
      setAlert('alert-aplicador', 'warning',
        '⚠️ Tu asistencia ya fue registrada hoy. Solo se permite un registro por día.');
      return;
    }

    if (persona) {
      State.persona = persona;
      this._mostrarConfirmacion(persona);
    } else {
      // No encontrado → inscripción
      this._mostrarInscripcion({ dni: dniStr });
    }
  },

  // ── VEEDOR: Buscar por nombre ───────────────────────────────
  async buscarVeedor() {
    const query = document.getElementById('input-nombre').value.trim();
    if (query.length < 3) return;

    setLoading('btn-buscar-nombre', 'spinner-nombre', 'btn-buscar-nombre-text', true);
    setAlert('alert-veedor', 'info', '');
    document.getElementById('results-veedor').innerHTML = '';

    const resultados = DB.veedores.filter(v => fuzzyMatch(v.apellido_nombre, query));

    setLoading('btn-buscar-nombre', 'spinner-nombre', 'btn-buscar-nombre-text', false);

    if (resultados.length === 0) {
      setAlert('alert-veedor', 'warning', 'No se encontró ningún veedor con ese nombre.');
      // Botón para inscribir
      document.getElementById('results-veedor').innerHTML = `
        <button class="btn btn-outline" onclick="App._mostrarInscripcion({nombre:'${query.replace(/'/g,"\\'")}'})" style="margin-top:4px;">
          ➕ No estoy en la lista — Inscribirme
        </button>`;
      return;
    }

    if (resultados.length === 1) {
      // Un solo resultado → ir directo a confirmar
      const yaRegistrado = await this._yaRegistrado(normalize(resultados[0].apellido_nombre), 'veedor');
      if (yaRegistrado) {
        setAlert('alert-veedor', 'warning',
          '⚠️ Tu asistencia ya fue registrada hoy. Solo se permite un registro por día.');
        return;
      }
      State.persona = resultados[0];
      this._mostrarConfirmacion(resultados[0]);
      return;
    }

    // Múltiples resultados → mostrar lista
    const lista = document.getElementById('results-veedor');
    lista.innerHTML = resultados.slice(0, 8).map((v, i) => `
      <div class="result-item" id="result-${i}" onclick="App._seleccionarVeedor(${i})">
        <div>
          <div class="name">${v.apellido_nombre}</div>
          <div class="meta">${v.escuela_ref || v.cue} · ${v.turno || ''}</div>
        </div>
        <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`).join('');
    // Store temp results
    App._tempResults = resultados;
  },

  _tempResults: [],

  async _seleccionarVeedor(idx) {
    const v = App._tempResults[idx];
    if (!v) return;
    const yaRegistrado = await this._yaRegistrado(normalize(v.apellido_nombre), 'veedor');
    if (yaRegistrado) {
      setAlert('alert-veedor', 'warning',
        '⚠️ Tu asistencia ya fue registrada hoy. Solo se permite un registro por día.');
      return;
    }
    State.persona = v;
    this._mostrarConfirmacion(v);
  },

  // ── Verificar si ya registró hoy ───────────────────────────
  async _yaRegistrado(idKey, role) {
    if (!db) return false;
    try {
      const hoy = hoyISO();
      const snap = await db.collection('asistencia')
        .where('fecha', '==', hoy)
        .where('role', '==', role)
        .where('idKey', '==', String(idKey))
        .limit(1)
        .get();
      return !snap.empty;
    } catch(e) {
      console.warn('Firestore error:', e);
      return false;
    }
  },

  // ── Mostrar pantalla confirmar ──────────────────────────────
  _mostrarConfirmacion(persona) {
    // Chip de rol
    const chip = document.getElementById('chip-confirmar');
    chip.textContent = State.role === 'aplicador' ? '🧑‍🏫 Aplicador encontrado' : '👁️ Veedor encontrado';
    chip.className = 'chip' + (State.role === 'veedor' ? ' veedor' : '');

    // Card de persona
    const card = document.getElementById('person-card');
    const rows = [];

    if (State.role === 'aplicador') {
      rows.push(['DNI',    persona.dni]);
      rows.push(['Cargo',  persona.cargo || '—']);
      rows.push(['CUE',    persona.cue]);
      rows.push(['Turno',  persona.turno || '—']);
    } else {
      rows.push(['Escuela', persona.escuela_ref || '—']);
      rows.push(['CUE',     persona.cue]);
      rows.push(['Turno',   persona.turno || '—']);
    }

    card.innerHTML = `
      <div class="person-name">${persona.apellido_nombre}</div>
      <div class="person-details">
        ${rows.map(([lbl, val]) => `
          <div class="detail-row">
            <span class="label">${lbl}</span>
            <span class="value">${val}</span>
          </div>`).join('')}
      </div>`;

    setAlert('alert-confirmar', 'info', '');
    showScreen('screen-confirmar');
  },

  // ── Confirmar asistencia ────────────────────────────────────
  async confirmarAsistencia() {
    const persona = State.persona;
    if (!persona) return;

    setLoading('btn-confirmar', 'spinner-confirmar', 'btn-confirmar-text', true);
    setAlert('alert-confirmar', 'info', '');

    const idKey = State.role === 'aplicador'
      ? String(persona.dni)
      : normalize(persona.apellido_nombre);

    // Doble-check en caso de race condition entre dispositivos
    const yaReg = await this._yaRegistrado(idKey, State.role);
    if (yaReg) {
      setLoading('btn-confirmar', 'spinner-confirmar', 'btn-confirmar-text', false);
      setAlert('alert-confirmar', 'warning',
        '⚠️ La asistencia ya fue registrada hoy desde otro dispositivo.');
      return;
    }

    const record = {
      fecha:    hoyISO(),
      hora:     horaLocal(),
      role:     State.role,
      idKey,
      apellido_nombre: persona.apellido_nombre,
      dni:      persona.dni || null,
      cue:      persona.cue || '',
      turno:    persona.turno || '',
      cargo:    persona.cargo || '',
      escuela:  persona.escuela_ref || '',
      mail:     persona.mail || '',
      telefono: persona.telefono ? String(persona.telefono) : '',
      esNuevo:  false,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
      if (db) await db.collection('asistencia').add(record);
      setLoading('btn-confirmar', 'spinner-confirmar', 'btn-confirmar-text', false);
      this._mostrarExito(persona.apellido_nombre, record);
    } catch(e) {
      setLoading('btn-confirmar', 'spinner-confirmar', 'btn-confirmar-text', false);
      setAlert('alert-confirmar', 'error',
        'Error al guardar. Verificá la conexión a internet e intentá de nuevo.');
      console.error(e);
    }
  },

  // ── Mostrar pantalla inscripción ────────────────────────────
  _mostrarInscripcion(prefill = {}) {
    const esAplicador = State.role === 'aplicador';
    document.getElementById('fields-aplicador').style.display = esAplicador ? '' : 'none';
    document.getElementById('fields-veedor').style.display    = esAplicador ? 'none' : '';

    if (esAplicador) {
      document.getElementById('insc-dni-ap').value            = prefill.dni || '';
      document.getElementById('insc-apellido-nombre').value   = '';
      document.getElementById('insc-cue-ap').value            = '';
      document.getElementById('insc-mail-ap').value           = '';
      document.getElementById('insc-cargo-ap').value          = '';
      document.getElementById('insc-telefono-ap').value       = '';
    } else {
      document.getElementById('insc-apellido-nombre-v').value = prefill.nombre || '';
      document.getElementById('insc-cue-v').value             = '';
      document.getElementById('insc-turno-v').value           = '';
      document.getElementById('insc-escuela-v').value         = '';
      document.getElementById('insc-telefono-v').value        = '';
      document.getElementById('insc-mail-v').value            = '';
    }

    setAlert('alert-inscripcion', 'info', '');
    showScreen('screen-inscripcion');
  },

  // ── Inscribir nueva persona ─────────────────────────────────
  async inscribir() {
    const esAplicador = State.role === 'aplicador';
    let record = {};

    if (esAplicador) {
      const nombre = document.getElementById('insc-apellido-nombre').value.trim();
      const dni    = document.getElementById('insc-dni-ap').value.trim();
      const cue    = document.getElementById('insc-cue-ap').value.trim();
      if (!nombre || !dni || !cue) {
        setAlert('alert-inscripcion', 'error', 'Completá los campos obligatorios (*)');
        return;
      }
      record = {
        fecha:    hoyISO(),
        hora:     horaLocal(),
        role:     'aplicador',
        idKey:    dni,
        apellido_nombre: nombre,
        dni:      parseInt(dni, 10) || null,
        cue,
        mail:     document.getElementById('insc-mail-ap').value.trim(),
        cargo:    document.getElementById('insc-cargo-ap').value.trim(),
        turno:    document.getElementById('insc-turno-ap').value,
        telefono: document.getElementById('insc-telefono-ap').value.trim(),
        escuela:  '',
        esNuevo:  true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };
    } else {
      const nombre = document.getElementById('insc-apellido-nombre-v').value.trim();
      const cue    = document.getElementById('insc-cue-v').value.trim();
      if (!nombre || !cue) {
        setAlert('alert-inscripcion', 'error', 'Completá los campos obligatorios (*)');
        return;
      }
      record = {
        fecha:    hoyISO(),
        hora:     horaLocal(),
        role:     'veedor',
        idKey:    normalize(nombre),
        apellido_nombre: nombre,
        dni:      null,
        cue,
        turno:    document.getElementById('insc-turno-v').value,
        escuela:  document.getElementById('insc-escuela-v').value.trim(),
        telefono: document.getElementById('insc-telefono-v').value.trim(),
        mail:     document.getElementById('insc-mail-v').value.trim(),
        cargo:    '',
        esNuevo:  true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };
    }

    setLoading('btn-inscribir', 'spinner-inscribir', 'btn-inscribir-text', true);

    // Verificar doble registro
    const yaReg = await this._yaRegistrado(record.idKey, record.role);
    if (yaReg) {
      setLoading('btn-inscribir', 'spinner-inscribir', 'btn-inscribir-text', false);
      setAlert('alert-inscripcion', 'warning',
        '⚠️ Esta persona ya registró asistencia hoy.');
      return;
    }

    try {
      if (db) await db.collection('asistencia').add(record);
      setLoading('btn-inscribir', 'spinner-inscribir', 'btn-inscribir-text', false);
      this._mostrarExito(record.apellido_nombre, record, true);
    } catch(e) {
      setLoading('btn-inscribir', 'spinner-inscribir', 'btn-inscribir-text', false);
      setAlert('alert-inscripcion', 'error',
        'Error al guardar. Verificá la conexión e intentá de nuevo.');
      console.error(e);
    }
  },

  // ── Pantalla de éxito ────────────────────────────────────────
  _mostrarExito(nombre, record, esNuevo = false) {
    document.getElementById('success-name').textContent = nombre;
    document.getElementById('success-sub').textContent  = esNuevo
      ? '✅ Inscripto y asistencia registrada'
      : '✅ Asistencia registrada correctamente';
    document.getElementById('success-details').innerHTML =
      `${record.fecha} · ${record.hora}<br/>${record.role === 'aplicador' ? 'Aplicador' : 'Veedor'}`;

    // Reiniciar animación del countdown
    const fill = document.getElementById('countdown-fill');
    fill.style.animation = 'none';
    void fill.offsetWidth; // reflow
    fill.style.animation = 'countdown 4s linear forwards';

    showScreen('screen-success');
    setTimeout(() => this.goHome(), 4100);
  },

  // ── Admin / Export ──────────────────────────────────────────
  openAdmin() {
    this._refreshStats();
    document.getElementById('modal-admin').classList.add('open');
  },

  closeAdmin() {
    document.getElementById('modal-admin').classList.remove('open');
  },

  closeAdminIfOutside(e) {
    if (e.target === document.getElementById('modal-admin')) this.closeAdmin();
  },

  async _refreshStats() {
    document.getElementById('stat-total').textContent       = '…';
    document.getElementById('stat-aplicadores').textContent = '…';
    document.getElementById('stat-veedores').textContent    = '…';

    if (!db) {
      document.getElementById('stat-total').textContent = '—';
      return;
    }

    try {
      const snap = await db.collection('asistencia')
        .where('fecha', '==', hoyISO())
        .get();
      const docs = snap.docs.map(d => d.data());
      const total = docs.length;
      const ap    = docs.filter(d => d.role === 'aplicador').length;
      const ve    = docs.filter(d => d.role === 'veedor').length;

      document.getElementById('stat-total').textContent       = total;
      document.getElementById('stat-aplicadores').textContent = ap;
      document.getElementById('stat-veedores').textContent    = ve;
    } catch(e) {
      console.error(e);
    }
  },

  async exportExcel() {
    const btn = document.getElementById('btn-export-excel');
    btn.disabled = true;
    btn.textContent = 'Exportando...';

    try {
      if (!db) throw new Error('Firebase no configurado');

      const snap = await db.collection('asistencia').orderBy('fecha').get();
      const rows = snap.docs.map(d => {
        const data = d.data();
        return {
          'Fecha':           data.fecha || '',
          'Hora':            data.hora  || '',
          'Rol':             data.role === 'aplicador' ? 'Aplicador' : 'Veedor',
          'Apellido y Nombre': data.apellido_nombre || '',
          'DNI':             data.dni || '',
          'CUE':             data.cue || '',
          'Turno':           data.turno || '',
          'Cargo':           data.cargo || '',
          'Escuela':         data.escuela || '',
          'Mail':            data.mail || '',
          'Teléfono':        data.telefono || '',
          'Es nuevo':        data.esNuevo ? 'SÍ' : 'NO',
        };
      });

      if (rows.length === 0) {
        alert('No hay registros de asistencia todavía.');
        btn.disabled = false;
        btn.textContent = '⬇️ Exportar asistencia a Excel';
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');

      // Aplicadores sheet
      const apRows = rows.filter(r => r['Rol'] === 'Aplicador');
      if (apRows.length) {
        const wsAp = XLSX.utils.json_to_sheet(apRows);
        XLSX.utils.book_append_sheet(wb, wsAp, 'Aplicadores');
      }

      // Veedores sheet
      const veRows = rows.filter(r => r['Rol'] === 'Veedor');
      if (veRows.length) {
        const wsVe = XLSX.utils.json_to_sheet(veRows);
        XLSX.utils.book_append_sheet(wb, wsVe, 'Veedores');
      }

      const fecha = hoyISO();
      XLSX.writeFile(wb, `asistencia_${fecha}.xlsx`);

    } catch(e) {
      alert('Error al exportar: ' + e.message);
      console.error(e);
    }

    btn.disabled = false;
    btn.textContent = '⬇️ Exportar asistencia a Excel';
  },
};

// ── Enter key en inputs ─────────────────────────────────────────
document.getElementById('input-dni').addEventListener('keydown', e => {
  if (e.key === 'Enter') App.buscarAplicador();
});
document.getElementById('input-nombre').addEventListener('keydown', e => {
  if (e.key === 'Enter') App.buscarVeedor();
});

console.log(`[App] DB cargado: ${DB.aplicadores.length} aplicadores, ${DB.veedores.length} veedores`);
