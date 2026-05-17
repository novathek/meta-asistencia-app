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
  const el = document.getElementById(containerId);
  if (!msg) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="alert ${type}">${msg}</div>`;
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
      document.getElementById('results-aplicador').innerHTML = '';
      setAlert('alert-aplicador', 'info', '');
      document.getElementById('btn-buscar-dni').disabled = true;
      showScreen('screen-aplicador');
      setTimeout(() => document.getElementById('input-dni').focus(), 350);
    } else if (role === 'directivo') {
      document.getElementById('input-dni-dir').value = '';
      document.getElementById('results-directivo').innerHTML = '';
      setAlert('alert-directivo', 'info', '');
      document.getElementById('btn-buscar-dni-dir').disabled = true;
      showScreen('screen-directivo');
      setTimeout(() => document.getElementById('input-dni-dir').focus(), 350);
    } else if (role === 'otro') {
      document.getElementById('otros-rol').value     = '';
      document.getElementById('otros-nombre').value  = '';
      document.getElementById('otros-dni').value     = '';
      document.getElementById('otros-cargo').value   = '';
      document.getElementById('otros-cue').value     = '';
      document.getElementById('otros-turno').value   = '';
      document.getElementById('otros-escuela').value = '';
      document.getElementById('otros-mail').value    = '';
      document.getElementById('otros-telefono').value= '';
      setAlert('alert-otros', 'info', '');
      showScreen('screen-otros');
      setTimeout(() => document.getElementById('otros-nombre').focus(), 350);
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
    if (State.role === 'aplicador')  showScreen('screen-aplicador');
    else if (State.role === 'directivo') showScreen('screen-directivo');
    else                             showScreen('screen-veedor');
  },

  // ── Inputs: habilitar botón ─────────────────────────────────
  onDniInput() {
    const val = document.getElementById('input-dni').value.replace(/\D/g,'');
    document.getElementById('input-dni').value = val;
    document.getElementById('btn-buscar-dni').disabled = val.length < 6;
    document.getElementById('results-aplicador').innerHTML = '';
    setAlert('alert-aplicador', 'info', '');
  },

  onDniDirInput() {
    const val = document.getElementById('input-dni-dir').value.replace(/\D/g,'');
    document.getElementById('input-dni-dir').value = val;
    document.getElementById('btn-buscar-dni-dir').disabled = val.length < 6;
    document.getElementById('results-directivo').innerHTML = '';
    setAlert('alert-directivo', 'info', '');
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
    document.getElementById('results-aplicador').innerHTML = '';

    // Buscar en DB local
    const persona = DB.aplicadores.find(p => p.dni === dni);

    // Verificar si ya registró asistencia hoy
    const yaRegistrado = await this._yaRegistrado(dniStr, 'aplicador');
    setLoading('btn-buscar-dni', 'spinner-dni', 'btn-buscar-dni-text', false);

    if (yaRegistrado) {
      setAlert('alert-aplicador', 'warning',
        'Tu asistencia ya fue registrada hoy. Solo se permite un registro por día.');
      return;
    }

    if (persona) {
      State.persona = persona;
      this._mostrarConfirmacion(persona);
    } else {
      // No encontrado → mostrar botón de inscripción
      setAlert('alert-aplicador', 'warning', 'No se encontró ningún aplicador con ese DNI.');
      document.getElementById('results-aplicador').innerHTML = `
        <button class="btn btn-outlined" onclick="App._irACasoExcepcional({rol:'aplicador',dni:'${dniStr}'})" style="margin-top:4px;">No estoy en la lista — Registrarme aquí</button>`;
    }
  },

  // ── DIRECTIVO: Buscar por DNI ───────────────────────────────
  async buscarDirectivo() {
    const dniStr = document.getElementById('input-dni-dir').value.trim();
    const dni    = parseInt(dniStr, 10);
    if (!dni || isNaN(dni)) return;

    setLoading('btn-buscar-dni-dir', 'spinner-dni-dir', 'btn-buscar-dni-dir-text', true);
    setAlert('alert-directivo', 'info', '');
    document.getElementById('results-directivo').innerHTML = '';

    const persona = DB.directivos.find(p => p.dni === dni);
    const yaRegistrado = await this._yaRegistrado(dniStr, 'directivo');
    setLoading('btn-buscar-dni-dir', 'spinner-dni-dir', 'btn-buscar-dni-dir-text', false);

    if (yaRegistrado) {
      setAlert('alert-directivo', 'warning',
        'Tu asistencia ya fue registrada hoy. Solo se permite un registro por día.');
      return;
    }

    if (persona) {
      State.persona = persona;
      this._mostrarConfirmacion(persona);
    } else {
      setAlert('alert-directivo', 'warning', 'No se encontró ningún directivo con ese DNI.');
      document.getElementById('results-directivo').innerHTML = `
        <button class="btn btn-outlined" onclick="App._irACasoExcepcional({rol:'directivo',dni:'${dniStr}'})" style="margin-top:4px;">No estoy en la lista — Registrarme aquí</button>`;
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
      // Botón para caso excepcional
      document.getElementById('results-veedor').innerHTML = `
        <button class="btn btn-outlined" onclick="App._irACasoExcepcional({rol:'veedor',nombre:'${query.replace(/'/g,"\\'")}'})" style="margin-top:4px;">No estoy en la lista — Registrarme aquí</button>`;
      return;
    }

    if (resultados.length === 1) {
      // Un solo resultado → ir directo a confirmar
      const yaRegistrado = await this._yaRegistrado(normalize(resultados[0].apellido_nombre), 'veedor');
      if (yaRegistrado) {
        setAlert('alert-veedor', 'warning',
          'Tu asistencia ya fue registrada hoy. Solo se permite un registro por día.');
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
        'Tu asistencia ya fue registrada hoy. Solo se permite un registro por día.');
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
    const labels = { aplicador: 'Aplicador encontrado', veedor: 'Veedor encontrado', directivo: 'Directivo encontrado' };
    const classes = { aplicador: '', veedor: ' secondary', directivo: ' directivos' };
    chip.textContent = labels[State.role] || 'Persona encontrada';
    chip.className = 'screen-header-label' + (classes[State.role] || '');

    // Card de persona
    const card = document.getElementById('person-card');
    const rows = [];

    if (State.role === 'aplicador') {
      rows.push(['DNI',    persona.dni]);
      rows.push(['Cargo',  persona.cargo || '—']);
      rows.push(['CUE',    persona.cue]);
      rows.push(['Turno',  persona.turno || '—']);
    } else if (State.role === 'directivo') {
      rows.push(['DNI',    persona.dni]);
      rows.push(['Cargo',  persona.cargo || '—']);
      rows.push(['Escuela', persona.escuela || '—']);
      rows.push(['Nivel',  persona.nivel || '—']);
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
      : State.role === 'directivo'
        ? String(persona.dni)
        : normalize(persona.apellido_nombre);

    // Doble-check en caso de race condition entre dispositivos
    const yaReg = await this._yaRegistrado(idKey, State.role);
    if (yaReg) {
      setLoading('btn-confirmar', 'spinner-confirmar', 'btn-confirmar-text', false);
      setAlert('alert-confirmar', 'warning',
        'La asistencia ya fue registrada hoy desde otro dispositivo.');
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
      escuela:  persona.escuela_ref || persona.escuela || '',
      nivel:    persona.nivel || '',
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
    const esDirectivo = State.role === 'directivo';
    // For directivos we reuse the aplicador fields
    document.getElementById('fields-aplicador').style.display = (esAplicador || esDirectivo) ? '' : 'none';
    document.getElementById('fields-veedor').style.display    = (esAplicador || esDirectivo) ? 'none' : '';

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
    const esDirectivo = State.role === 'directivo';
    let record = {};

    if (esAplicador || esDirectivo) {
      const nombre = document.getElementById('insc-apellido-nombre').value.trim();
      const dni    = document.getElementById('insc-dni-ap').value.trim();
      const cue    = document.getElementById('insc-cue-ap').value.trim();
      if (!nombre || !dni) {
        setAlert('alert-inscripcion', 'error', 'Completá los campos obligatorios (*)');
        return;
      }
      record = {
        fecha:    hoyISO(),
        hora:     horaLocal(),
        role:     State.role,
        idKey:    dni,
        apellido_nombre: nombre,
        dni:      parseInt(dni, 10) || null,
        cue,
        mail:     document.getElementById('insc-mail-ap').value.trim(),
        cargo:    document.getElementById('insc-cargo-ap').value.trim(),
        turno:    document.getElementById('insc-turno-ap').value,
        telefono: document.getElementById('insc-telefono-ap').value.trim(),
        escuela:  '',
        nivel:    '',
        esNuevo:  true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };
    } else {
      const nombre = document.getElementById('insc-apellido-nombre-v').value.trim();
      const cue    = document.getElementById('insc-cue-v').value.trim();
      if (!nombre) {
        setAlert('alert-inscripcion', 'error', 'Completá el nombre y apellido (*)');
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
        'Esta persona ya registró asistencia hoy.');
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
      ? 'Inscripto y asistencia registrada'
      : 'Asistencia registrada correctamente';
    const roleLabel = { aplicador: 'Aplicador', veedor: 'Veedor', directivo: 'Directivo', otro: 'Otro' };
    document.getElementById('success-details').innerHTML =
      `${record.fecha} · ${record.hora}<br/>${roleLabel[record.role] || record.role}`;

    // Reiniciar animación del countdown
    const fill = document.getElementById('countdown-fill');
    fill.style.animation = 'none';
    void fill.offsetWidth; // reflow
    fill.style.animation = 'countdown 4s linear forwards';

    showScreen('screen-success');
    setTimeout(() => this.goHome(), 4100);
  },

  // ── Ir a pantalla Caso Excepcional desde otro rol ────────────
  _irACasoExcepcional({ rol = '', dni = '', nombre = '' } = {}) {
    document.getElementById('otros-rol').value      = rol;
    document.getElementById('otros-nombre').value   = nombre;
    document.getElementById('otros-dni').value      = dni;
    document.getElementById('otros-cargo').value    = '';
    document.getElementById('otros-cue').value      = '';
    document.getElementById('otros-turno').value    = '';
    document.getElementById('otros-escuela').value  = '';
    document.getElementById('otros-mail').value     = '';
    document.getElementById('otros-telefono').value = '';
    setAlert('alert-otros', 'info', '');
    State.role = 'otro';
    showScreen('screen-otros');
    // Foco al primer campo vacío
    setTimeout(() => {
      const foco = nombre ? document.getElementById('otros-cargo') : document.getElementById('otros-nombre');
      foco.focus();
    }, 350);
  },

  // ── OTROS: Registro directo ─────────────────────────────────
  async inscribirOtro() {
    const rolSeleccionado = document.getElementById('otros-rol').value;
    const nombre = document.getElementById('otros-nombre').value.trim();

    if (!rolSeleccionado) {
      setAlert('alert-otros', 'error', 'Seleccioná tu rol para continuar (*)');
      return;
    }
    if (!nombre) {
      setAlert('alert-otros', 'error', 'El nombre y apellido es obligatorio (*)');
      return;
    }

    const dniStr = document.getElementById('otros-dni').value.trim();
    // El idKey depende del rol: aplicador/directivo usan DNI, veedor usa nombre
    const idKey = (rolSeleccionado === 'veedor')
      ? normalize(nombre)
      : (dniStr ? dniStr : normalize(nombre));

    setLoading('btn-inscribir-otro', 'spinner-otros', 'btn-inscribir-otro-text', true);

    const yaReg = await this._yaRegistrado(idKey, rolSeleccionado);
    if (yaReg) {
      setLoading('btn-inscribir-otro', 'spinner-otros', 'btn-inscribir-otro-text', false);
      setAlert('alert-otros', 'warning', 'Esta persona ya registró asistencia hoy.');
      return;
    }

    const record = {
      fecha:    hoyISO(),
      hora:     horaLocal(),
      role:     rolSeleccionado,
      idKey,
      apellido_nombre: nombre,
      dni:      parseInt(dniStr, 10) || null,
      cue:      document.getElementById('otros-cue').value.trim(),
      turno:    document.getElementById('otros-turno').value,
      escuela:  document.getElementById('otros-escuela').value.trim(),
      cargo:    document.getElementById('otros-cargo').value.trim(),
      mail:     document.getElementById('otros-mail').value.trim(),
      telefono: document.getElementById('otros-telefono').value.trim(),
      nivel:    '',
      esNuevo:  true,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
      if (db) await db.collection('asistencia').add(record);
      setLoading('btn-inscribir-otro', 'spinner-otros', 'btn-inscribir-otro-text', false);
      this._mostrarExito(record.apellido_nombre, record, true);
    } catch(e) {
      setLoading('btn-inscribir-otro', 'spinner-otros', 'btn-inscribir-otro-text', false);
      setAlert('alert-otros', 'error', 'Error al guardar. Verificá la conexión e intentá de nuevo.');
      console.error(e);
    }
  },

  // ── Admin / Export ──────────────────────────────────────────
  openAdmin() {
    this._refreshStats();
    this._loadVerificaciones();
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
    document.getElementById('stat-directivos').textContent  = '…';
    document.getElementById('stat-otros').textContent       = '…';

    if (!db) {
      document.getElementById('stat-total').textContent = '—';
      return;
    }

    try {
      const snap = await db.collection('asistencia').get();
      const docs = snap.docs.map(d => d.data());
      const total = docs.length;
      const ap    = docs.filter(d => d.role === 'aplicador').length;
      const ve    = docs.filter(d => d.role === 'veedor').length;
      const di    = docs.filter(d => d.role === 'directivo').length;
      const ot    = docs.filter(d => d.role === 'otro').length;

      document.getElementById('stat-total').textContent       = total;
      document.getElementById('stat-aplicadores').textContent = ap;
      document.getElementById('stat-veedores').textContent    = ve;
      document.getElementById('stat-directivos').textContent  = di;
      document.getElementById('stat-otros').textContent       = ot;
    } catch(e) {
      console.error(e);
    }
  },

  // ── Cargar verificaciones de hoy en el panel admin ─────────
  async _loadVerificaciones() {
    const el = document.getElementById('verif-list');
    if (!el) return;
    if (!db) {
      el.innerHTML = '<div style="padding:12px;text-align:center;font-size:.85rem;color:#DC2626;">Firebase no disponible</div>';
      return;
    }
    try {
      const hoy = hoyISO();
      const snap = await db.collection('verificacion').where('fecha', '==', hoy).get();
      if (snap.empty) {
        el.innerHTML = '<div style="padding:12px;text-align:center;font-size:.85rem;color:var(--md-on-surface-var);">Sin verificaciones registradas hoy</div>';
        return;
      }
      // Sort by hora client-side
      const docs = snap.docs.sort((a,b) => (b.data().hora||'').localeCompare(a.data().hora||''));
      el.innerHTML = docs.map(doc => {
        const d = doc.data();
        const safe = (d.apellido_nombre||'').replace(/'/g, "\\'");
        return `<div class="verif-item" id="vi-${doc.id}">
          <div style="flex:1;min-width:0;">
            <div style="font-size:.83rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.apellido_nombre||'—'}</div>
            <div style="font-size:.72rem;color:var(--md-on-surface-var);">D\u00eda ${d.dia||'?'} \u00b7 ${d.rol||d.role||'—'} \u00b7 ${d.hora||'—'}</div>
          </div>
          <button class="icon-btn" style="width:36px;height:36px;color:#DC2626;flex-shrink:0;"
            onclick="App._deleteVerificacion('${doc.id}','${safe}')" title="Revertir">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        </div>`;
      }).join('');
    } catch(e) {
      el.innerHTML = '<div style="padding:12px;text-align:center;font-size:.85rem;color:#DC2626;">Error al cargar. Verific\u00e1 los permisos de Firebase.</div>';
      console.error('[verif]', e);
    }
  },

  // ── Revertir una verificación accidental ─────────────────
  async _deleteVerificacion(docId, nombre) {
    if (!confirm('\u00bfRevertir la verificaci\u00f3n de ' + nombre + '?')) return;
    try {
      if (db) await db.collection('verificacion').doc(docId).delete();
      // Limpiar estado local para que el badge se actualice
      if (window._verificadosNombres && nombre) {
        const nom = normalize(nombre);
        window._verificadosNombres.delete(nom);
      }
      // Recargar la lista del panel
      this._loadVerificaciones();
      // Re-renderizar lista de escuela si est\u00e1 abierta
      const listaScreen = document.getElementById('screen-lista');
      if (listaScreen && listaScreen.classList.contains('active') && typeof renderLista === 'function') {
        renderLista(window._listaPersonasFiltered || window._listaPersonas || []);
      }
    } catch(e) {
      alert('Error al revertir: ' + e.message);
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
      const rolLabels = { aplicador: 'Aplicador', veedor: 'Veedor', directivo: 'Directivo', otro: 'Otro' };
      const rows = snap.docs.map(d => {
        const data = d.data();
        return {
          'Fecha':             data.fecha || '',
          'Hora':              data.hora  || '',
          'Rol':               rolLabels[data.role] || data.role || '',
          'Apellido y Nombre': data.apellido_nombre || '',
          'DNI':               data.dni || '',
          'CUE':               data.cue || '',
          'Turno':             data.turno || '',
          'Cargo':             data.cargo || '',
          'Nivel':             data.nivel || '',
          'Escuela':           data.escuela || '',
          'Mail':              data.mail || '',
          'Teléfono':          data.telefono || '',
          'Es nuevo':          data.esNuevo ? 'SÍ' : 'NO',
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

      // Directivos sheet
      const diRows = rows.filter(r => r['Rol'] === 'Directivo');
      if (diRows.length) {
        const wsDi = XLSX.utils.json_to_sheet(diRows);
        XLSX.utils.book_append_sheet(wb, wsDi, 'Directivos');
      }

      // Otros sheet
      const otRows = rows.filter(r => r['Rol'] === 'Otro');
      if (otRows.length) {
        const wsOt = XLSX.utils.json_to_sheet(otRows);
        XLSX.utils.book_append_sheet(wb, wsOt, 'Otros');
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
document.getElementById('input-dni-dir').addEventListener('keydown', e => {
  if (e.key === 'Enter') App.buscarDirectivo();
});
document.getElementById('input-nombre').addEventListener('keydown', e => {
  if (e.key === 'Enter') App.buscarVeedor();
});

console.log(`[App] DB cargado: ${DB.aplicadores.length} aplicadores, ${DB.veedores.length} veedores, ${DB.directivos.length} directivos`);
