'use strict';

// ── Datos ────────────────────────────────────────────────────────
const SEMANA_1 = [
  { semana:1, dia:1, escuela:'ESCUELA N\u00b0 162 "9 DE JULIO"',                                                  nivel:'PRIMARIA',   cue:'100040600P' },
  { semana:1, dia:2, escuela:'ESCUELA PROVINCIAL DE EDUCACION TECNICA N\u00b07 "ING. JOSE ALSINA ALCOBERT"',     nivel:'SECUNDARIA', cue:'100008600S' },
  { semana:1, dia:3, escuela:'ESCUELA PROVINCIAL DE EDUCACION TECNICA N\u00aa6 "MAESTRO MARIANO FERNANDO PIERI"', nivel:'SECUNDARIA', cue:'100007400S' },
  { semana:1, dia:4, escuela:'ESCUELA PROVINCIAL DE MINERIA "DR. BERNARDO HOUSSAY"',                             nivel:'SECUNDARIA', cue:'100007300S' },
  { semana:1, dia:5, escuela:'ESCUELA SECUNDARIA N\u00b049',                                                      nivel:'SECUNDARIA', cue:'100063100S' }
];

const SEMANA_2 = [
  { semana:2, dia:6, escuela:'ESCUELA N\u00b0 15 NTRA.SRA.DEL VALLE',                    nivel:'PRIMARIA',   cue:'100063300P' },
  { semana:2, dia:6, escuela:'ESCUELA PRIVADA "MARIA MONTESSORI"',                        nivel:'PRIMARIA',   cue:'100080500P' },
  { semana:2, dia:6, escuela:'ESCUELA SECUNDARIA N\u00b0 93',                             nivel:'SECUNDARIA', cue:'100091500S' },
  { semana:2, dia:7, escuela:'ESCUELA N\u00b0 198',                                       nivel:'PRIMARIA',   cue:'100077300P' },
  { semana:2, dia:7, escuela:'ESCUELA SECUNDARIA N\u00b048 "PBRO.RAMON ROSA OLMOS"',      nivel:'SECUNDARIA', cue:'100034700S' },
  { semana:2, dia:7, escuela:'ESCUELA N\u00b0 324',                                       nivel:'PRIMARIA',   cue:'100042600P' },
  { semana:2, dia:7, escuela:'ESCUELA PRIVADA "MARIA MONTESSORI"',                        nivel:'SECUNDARIA', cue:'100080500S' },
  { semana:2, dia:7, escuela:'ESCUELA SECUNDARIA N\u00b0 89',                             nivel:'SECUNDARIA', cue:'100091100S' },
  { semana:2, dia:8, escuela:'ESCUELA N\u00b0 323 JUAN ALFONSO CARRIZO',                  nivel:'PRIMARIA',   cue:'100008100P' },
  { semana:2, dia:8, escuela:'ESCUELA SECUNDARIA N\u00b050',                              nivel:'SECUNDARIA', cue:'100040300S' },
  { semana:2, dia:8, escuela:'ESCUELA SECUNDARIA N\u00b06 CACIQUE JUAN CHELEMIN',         nivel:'SECUNDARIA', cue:'100040700S' },
  { semana:2, dia:8, escuela:'ESCUELA SECUNDARIA N\u00b0 84',                             nivel:'SECUNDARIA', cue:'100090600S' },
  { semana:2, dia:9, escuela:'ESCUELA N\u00b0 126 BARRIO APOLO',                          nivel:'PRIMARIA',   cue:'100040400P' },
  { semana:2, dia:9, escuela:'ESCUELA N\u00b0992 (ESC. N\u00b044-139)',                   nivel:'PRIMARIA',   cue:'100069400P' },
  { semana:2, dia:9, escuela:'ESCUELA N\u00aa195 "REVOLUCION DE MAYO"',                   nivel:'PRIMARIA',   cue:'100084200P' },
  { semana:2, dia:9, escuela:'ESCUELA SECUNDARIA N\u00b0 92',                             nivel:'SECUNDARIA', cue:'100091400S' }
];

const SEMANA_3 = [
  { semana:3, dia:10, escuela:'COLEGIO PRIVADO JUAN PABLO II',                                    nivel:'SECUNDARIA', cue:'100007800S' },
  { semana:3, dia:10, escuela:'ESCUELA N\u00b0 182 "LUIS LEOPOLDO FRANCO"',                       nivel:'PRIMARIA',   cue:'100002700P' },
  { semana:3, dia:10, escuela:'ESCUELA N\u00b0196 GOBERNADOR CRISANTO GOMEZ',                     nivel:'PRIMARIA',   cue:'100083400P' },
  { semana:3, dia:10, escuela:'ESCUELA PRIVADA VIRGEN NI\u00d1A',                                 nivel:'SECUNDARIA', cue:'100044200S' },
  { semana:3, dia:11, escuela:'COLEGIO PRIVADO F.A.S.T.A.',                                       nivel:'PRIMARIA',   cue:'100061000P' },
  { semana:3, dia:11, escuela:'ESCUELA N\u00b0 180 "REP\u00daBLICA ARGENTINA"',                   nivel:'PRIMARIA',   cue:'100002000P' },
  { semana:3, dia:12, escuela:'COLEGIO PRIVADO PIA DIDOMENICO',                                   nivel:'SECUNDARIA', cue:'100060700S' },
  { semana:3, dia:13, escuela:'COLEGIO PRIVADO ENRIQUE G.HOOD',                                   nivel:'PRIMARIA',   cue:'100002400P' },
  { semana:3, dia:13, escuela:'COLEGIO PRIVADO GENERAL MANUEL BELGRANO',                          nivel:'PRIMARIA',   cue:'100008800P' },
  { semana:3, dia:14, escuela:'COLEGIO PRIVADO PADRE RAMON DE LA QUINTANA',                       nivel:'SECUNDARIA', cue:'100061300S' },
  { semana:3, dia:14, escuela:'ESCUELA N\u00b0 127 SAN JOSE OBRERO',                              nivel:'PRIMARIA',   cue:'100009700P' },
  { semana:3, dia:14, escuela:'COLEGIO SANTA ROSA DE LIMA',                                       nivel:'PRIMARIA',   cue:'100034500P' }
];

const SEMANA_4 = [
  { semana:4, dia:15, escuela:'COLEGIO PRIVADO SRA. DEL VALLE',                                    nivel:'SECUNDARIA', cue:'100002800S' },
  { semana:4, dia:15, escuela:'COLEGIO PRIVADO PIA DIDOMENICO',                                    nivel:'PRIMARIA',   cue:'100060700P' },
  { semana:4, dia:16, escuela:'ESCUELA N\u00b0 428 "DR. ENRIQUE OCAMPO"',                          nivel:'PRIMARIA',   cue:'100034400P' },
  { semana:4, dia:16, escuela:'ESCUELA SECUNDARIA N\u00b07 "GRAL. JOSE MARIA PAZ"',                nivel:'SECUNDARIA', cue:'100034600S' },
  { semana:4, dia:17, escuela:'CENTRO EDUCATIVO N\u00b04 "DR. ROMIS AMADO RAIDEN" \u2013 PRI',     nivel:'PRIMARIA',   cue:'100085800P' },
  { semana:4, dia:17, escuela:'CENTRO EDUCATIVO N\u00b04 "DR. ROMIS AMADO RAIDEN" \u2013 SEC',     nivel:'SECUNDARIA', cue:'100085800S' },
  { semana:4, dia:17, escuela:'ESCUELA N\u00b0 201 WOLF SCHCOLNIK',                                nivel:'PRIMARIA',   cue:'100054100P' },
  { semana:4, dia:17, escuela:'ESCUELA N\u00b0 272 PROVINCIA DE CORRIENTES',                       nivel:'PRIMARIA',   cue:'100062200P' },
  { semana:4, dia:18, escuela:'CENTRO EDUCATIVO N\u00b03 "MARIA EMILIA AZAR"',                     nivel:'PRIMARIA',   cue:'100082700P' },
  { semana:4, dia:18, escuela:'COLEGIO PRIVADO NUESTRA SRA. DE GUADALUPE',                         nivel:'SECUNDARIA', cue:'100060400S' },
  { semana:4, dia:30, escuela:'ESCUELA N\u00b0 126 BARRIO APOLO',                                  nivel:'PRIMARIA',   cue:'100040400P', esRezagados:true },
  { semana:4, dia:30, escuela:'ESCUELA PRIVADA "MARIA MONTESSORI"',                                nivel:'PRIMARIA',   cue:'100080500P', esRezagados:true },
  { semana:4, dia:30, escuela:'ESCUELA SECUNDARIA N\u00b0 92',                                     nivel:'SECUNDARIA', cue:'100091400S', esRezagados:true },
  { semana:4, dia:30, escuela:'ESCUELA N\u00b0 701 "C. J. ARMSTRONG"',                             nivel:'PRIMARIA',   cue:'100007700P', esRezagados:true }
];

const TODOS = [...SEMANA_1, ...SEMANA_2, ...SEMANA_3, ...SEMANA_4];

// ── Helpers ──────────────────────────────────────────────────────
function hoyISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}
function horaLocal() { return new Date().toLocaleTimeString('es-AR', { hour12: false }); }
function norm(s) { return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

// ── Firebase ─────────────────────────────────────────────────────
let db;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
} catch(e) { console.error('[Firebase]', e); }

// ── Admin ────────────────────────────────────────────────────────
const Admin = {
  activeCue: null,   // CUE de la escuela activa
  personas: [],
  // Estado de apertura del árbol: { 's1': true, 's2': true, 'd1': true, ... }
  treeOpen: { s1: true, s2: false },

  // ── Init ────────────────────────────────────────────────────
  init() {
    this.buildTree(TODOS);
    if (!db) this.showError('Firebase no configurado');
  },

  // ── Construir árbol ─────────────────────────────────────────
  buildTree(data) {
    // Agrupar: semana → día → escuelas
    const tree = {};
    data.forEach(d => {
      const sk = `s${d.semana}`;
      const dk = `d${d.dia}`;
      if (!tree[sk]) tree[sk] = { semana: d.semana, dias: {} };
      if (!tree[sk].dias[dk]) tree[sk].dias[dk] = { dia: d.dia, escuelas: [] };
      tree[sk].dias[dk].escuelas.push(d);
    });

    let html = '';
    Object.values(tree).forEach(s => {
      const sk = `s${s.semana}`;
      const isOpen = !!this.treeOpen[sk];
      const totalEsc = Object.values(s.dias).reduce((a,d) => a + d.escuelas.length, 0);
      html += `
      <div class="tree-semana s${s.semana} ${isOpen ? 'open' : ''}" id="ts-${sk}">
        <div class="tree-semana-header" onclick="Admin.toggleSemana('${sk}')">
          <svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span class="tree-semana-label">Semana ${s.semana}</span>
          <span class="tree-semana-count">${totalEsc} escuelas</span>
        </div>
        <div class="tree-dia-list">`;

      Object.values(s.dias).sort((a,b) => a.dia - b.dia).forEach(d => {
        const dk = `d${d.dia}`;
        const isDiaOpen = !!this.treeOpen[dk];
        html += `
          <div class="tree-dia s${s.semana} ${isDiaOpen ? 'open' : ''}" id="td-${dk}">
            <div class="tree-dia-header" onclick="Admin.toggleDia('${dk}')">
              <svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span class="tree-dia-label">Día ${d.dia}${d.escuelas && d.escuelas[0] && d.escuelas[0].esRezagados ? ' <span style="color:#D97706;font-size:.7rem;">· Rezagados</span>' : ''}</span>
              <span class="tree-dia-count">${d.escuelas.length}</span>
            </div>
            <div class="tree-esc-list">`;

        d.escuelas.forEach(esc => {
          const isActive = esc.cue === this.activeCue;
          const activeClass = isActive ? ` active-s${s.semana}` : '';
          html += `
              <button class="tree-esc${activeClass}" id="te-${esc.cue}"
                onclick="Admin.selectEscuela('${esc.cue}')">
                <span class="tree-esc-nivel">${esc.nivel === 'PRIMARIA' ? 'PRI' : 'SEC'}</span>
                <span class="tree-esc-name">${esc.escuela}</span>
              </button>`;
        });

        html += `
            </div>
          </div>`;
      });

      html += `
        </div>
      </div>`;
    });

    document.getElementById('tree').innerHTML = html;
  },

  // ── Toggle semana ────────────────────────────────────────────
  toggleSemana(sk) {
    this.treeOpen[sk] = !this.treeOpen[sk];
    const el = document.getElementById(`ts-${sk}`);
    if (el) el.classList.toggle('open', this.treeOpen[sk]);
  },

  // ── Toggle día ───────────────────────────────────────────────
  toggleDia(dk) {
    this.treeOpen[dk] = !this.treeOpen[dk];
    const el = document.getElementById(`td-${dk}`);
    if (el) el.classList.toggle('open', this.treeOpen[dk]);
  },

  // ── Filtrar árbol por texto ──────────────────────────────────
  filterTree() {
    const q = norm(document.getElementById('sidebar-search').value);
    if (!q) { this.buildTree(TODOS); return; }
    const filtered = TODOS.filter(d => norm(d.escuela).includes(q) || d.cue.includes(q));
    // Abrir todo cuando hay filtro
    const prevOpen = { ...this.treeOpen };
    filtered.forEach(d => {
      this.treeOpen[`s${d.semana}`] = true;
      this.treeOpen[`d${d.dia}`] = true;
    });
    this.buildTree(filtered);
    // Restaurar estado si se borra el filtro
    if (!q) this.treeOpen = prevOpen;
  },

  // ── Seleccionar escuela ──────────────────────────────────────
  async selectEscuela(cue) {
    if (this.activeCue === cue) return;
    this.activeCue = cue;

    const dayData = TODOS.find(d => d.cue === cue);
    if (!dayData) return;

    // Abrir el día correspondiente en el árbol
    this.treeOpen[`s${dayData.semana}`] = true;
    this.treeOpen[`d${dayData.dia}`] = true;
    this.buildTree(TODOS);

    // Breadcrumb
    document.getElementById('breadcrumb').innerHTML = `
      <span>Semana ${dayData.semana}</span>
      <span class="sep">›</span>
      <span>Día ${dayData.dia}</span>
      <span class="sep">›</span>
      <span>${dayData.escuela}</span>
    `;

    // Mostrar header de escuela
    const isS2 = dayData.semana === 2;
    document.getElementById('main').innerHTML = `
      <div class="school-header">
        <div class="school-header-meta">
          <span class="school-chip s${dayData.semana}">Semana ${dayData.semana} · Día ${dayData.dia}</span>
          <span class="school-chip nivel">${dayData.nivel}</span>
        </div>
        <div class="school-name">${dayData.escuela}</div>
        <div class="school-cue">CUE: ${dayData.cue}</div>
        <div class="school-search-row">
          <input type="text" class="school-search" id="search"
            placeholder="Buscar por nombre o DNI…" oninput="Admin.renderList()" />
        </div>
      </div>
      <div class="stats-row" id="stats-row" style="display:none;"></div>
      <div class="people-wrap" id="people-list">
        <div class="empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div class="empty-title">Cargando datos…</div>
        </div>
      </div>
    `;

    try {
      const [snapCap, snapVerif, snapNuevosCue, snapNuevosSinCue] = await Promise.all([
        db.collection('capacitacion').where('cue', '==', cue).get(),
        db.collection('verificacion').where('dia', '==', dayData.dia).where('cue', '==', cue).get(),
        // Registros directos que declararon este CUE exacto
        db.collection('asistencia').where('cue', '==', cue).where('esNuevo', '==', true).get(),
        // Registros directos sin CUE (campo vacío) — los mostramos igual para no perderlos
        db.collection('asistencia').where('cue', '==', '').where('esNuevo', '==', true).get()
      ]);

      // Mapa de verificaciones: dni/nombre → docId
      const verifMap = new Map();
      snapVerif.docs.forEach(doc => {
        const d = doc.data();
        if (d.dni) verifMap.set(String(d.dni), doc.id);
        if (d.apellido_nombre) verifMap.set(d.apellido_nombre.toLowerCase().trim(), doc.id);
      });

      // Personas del padrón base
      this.personas = snapCap.docs.map(doc => {
        const d = doc.data();
        let verifId = null;
        if (d.dni && verifMap.has(String(d.dni))) verifId = verifMap.get(String(d.dni));
        else if (d.nombre && verifMap.has(d.nombre.toLowerCase().trim())) verifId = verifMap.get(d.nombre.toLowerCase().trim());
        return { id: doc.id, ...d, verifId, presente: !!verifId, esNuevo: false };
      });

      // Set de DNIs/nombres ya en el padrón para evitar duplicados
      const padronDNIs    = new Set(this.personas.map(p => p.dni ? String(p.dni) : null).filter(Boolean));
      const padronNombres = new Set(this.personas.map(p => norm(p.nombre || '')).filter(Boolean));

      // Función para agregar un registro nuevo si no está ya en el padrón
      const agregarNuevo = (doc, sinCue = false) => {
        const d = doc.data();
        const dniStr  = d.dni ? String(d.dni) : null;
        const nomNorm = norm(d.apellido_nombre || '');

        if (dniStr && padronDNIs.has(dniStr)) return;
        if (nomNorm && padronNombres.has(nomNorm)) return;

        // Si no tiene CUE, filtrar por nombre de escuela como fallback
        if (sinCue) {
          const escNorm = norm(d.escuela || '');
          const cueNorm = norm(dayData.escuela);
          // Solo incluir si el nombre de escuela coincide o si no declaró ninguna escuela
          if (escNorm && !escNorm.includes(cueNorm.substring(0, 8)) && !cueNorm.includes(escNorm.substring(0, 8))) {
            // No coincide con esta escuela, saltar
            return;
          }
        }

        let verifId = null;
        if (dniStr && verifMap.has(dniStr)) verifId = verifMap.get(dniStr);
        else if (d.apellido_nombre && verifMap.has(d.apellido_nombre.toLowerCase().trim()))
          verifId = verifMap.get(d.apellido_nombre.toLowerCase().trim());

        this.personas.push({
          id:             doc.id,
          nombre:         d.apellido_nombre || '',
          dni:            d.dni || null,
          rol:            d.role || d.rol || '',
          cargo:          d.cargo || '',
          turno:          d.turno || '',
          tipo:           d.tipo || '',
          nivel:          d.nivel || '',
          escuela:        d.escuela || '',
          cue:            d.cue || '',
          asistio:        false,
          verifId,
          presente:       !!verifId,
          esNuevo:        true,
          sinCueAsignado: sinCue,
          fechaRegistro:  d.fecha || '',
          horaRegistro:   d.hora  || '',
        });

        if (dniStr)   padronDNIs.add(dniStr);
        if (nomNorm)  padronNombres.add(nomNorm);
      };

      snapNuevosCue.docs.forEach(doc => agregarNuevo(doc, false));
      snapNuevosSinCue.docs.forEach(doc => agregarNuevo(doc, true));

      // Ordenar: padrón primero (alfabético), nuevos al final
      this.personas.sort((a,b) => {
        if (a.esNuevo !== b.esNuevo) return a.esNuevo ? 1 : -1;
        return (a.nombre||'').localeCompare(b.nombre||'');
      });

      this.renderList();
    } catch(e) {
      console.error(e);
      this.showError('Error al cargar datos. Verificá tu conexión y permisos de Firebase.');
    }
  },

  // ── Renderizar lista ─────────────────────────────────────────
  renderList() {
    const listEl = document.getElementById('people-list');
    const statsEl = document.getElementById('stats-row');
    if (!listEl) return;

    const q = norm(document.getElementById('search')?.value || '');
    const filtered = this.personas.filter(p =>
      norm(p.nombre).includes(q) || String(p.dni||'').includes(q)
    );

    // Stats
    const total  = filtered.length;
    const cap    = filtered.filter(p => p.asistio).length;
    const prac   = filtered.filter(p => p.presente).length;
    const pend   = total - prac;
    const nuevos = filtered.filter(p => p.esNuevo).length;

    if (statsEl) {
      statsEl.style.display = 'flex';
      statsEl.innerHTML = `
        <div class="stat-card total"><div class="stat-num">${total}</div><div class="stat-lbl">Total</div></div>
        <div class="stat-card cap"><div class="stat-num">${cap}</div><div class="stat-lbl">Capacitados</div></div>
        <div class="stat-card prac"><div class="stat-num">${prac}</div><div class="stat-lbl">En práctica</div></div>
        <div class="stat-card pend"><div class="stat-num">${pend}</div><div class="stat-lbl">Pendientes</div></div>
        ${nuevos ? `<div class="stat-card nuevo"><div class="stat-num">${nuevos}</div><div class="stat-lbl">Rec. registrados</div></div>` : ''}
      `;
    }

    if (!filtered.length) {
      listEl.innerHTML = `<div class="empty"><div class="empty-title">Sin resultados</div><div class="empty-sub">Probá con otro nombre o DNI</div></div>`;
      return;
    }

    listEl.innerHTML = filtered.map(p => {
      const rowClass = p.esNuevo ? ' is-nuevo' : (p.presente ? ' is-present' : '');
      const badgeNuevo = p.esNuevo
        ? p.sinCueAsignado
          ? `<span class="tag tag-nuevo">⚡ Recién registrado · sin escuela asignada${p.fechaRegistro ? ' · ' + p.fechaRegistro : ''}</span>`
          : `<span class="tag tag-nuevo">⚡ Recién registrado${p.fechaRegistro ? ' · ' + p.fechaRegistro : ''}</span>`
        : '';
      // Toggle capacitación deshabilitado para nuevos (no están en el padrón)
      const capDisabled = p.esNuevo ? 'disabled title="No está en el padrón de capacitación"' : '';
      return `
      <div class="person-row${rowClass}">
        <div class="person-info">
          <div class="person-name">${p.nombre}</div>
          <div class="person-meta">DNI: ${p.dni||'S/D'} &bull; ${p.rol||'S/D'}</div>
          <div class="person-tags">
            ${badgeNuevo}
            ${p.tipo  ? `<span class="tag tag-tipo">${p.tipo}</span>` : ''}
            ${p.cargo ? `<span class="tag tag-cargo">${p.cargo}</span>` : ''}
            ${p.turno ? `<span class="tag tag-turno">T. ${p.turno}</span>` : ''}
          </div>
        </div>
        <div class="toggles">
          <div class="toggle-wrap">
            <div class="toggle-lbl ${p.asistio ? 'on-cap' : ''}" id="lbl-cap-${p.id}">Capacit.</div>
            <label class="sw">
              <input type="checkbox" id="chk-cap-${p.id}" ${p.asistio ? 'checked' : ''} ${capDisabled}
                onchange="Admin.toggleCapacitacion('${p.id}', this)">
              <span class="sw-track blue"></span>
            </label>
          </div>
          <div class="toggle-wrap">
            <div class="toggle-lbl ${p.presente ? 'on-prac' : ''}" id="lbl-prac-${p.id}">Práctica</div>
            <label class="sw">
              <input type="checkbox" id="chk-prac-${p.id}" ${p.presente ? 'checked' : ''}
                onchange="Admin.togglePractica('${p.id}', this)">
              <span class="sw-track"></span>
            </label>
          </div>
        </div>
      </div>`;
    }).join('');
  },

  // ── Toggle Capacitación ──────────────────────────────────────
  async toggleCapacitacion(docId, checkbox) {
    checkbox.disabled = true;
    const val = checkbox.checked;
    const lbl = document.getElementById(`lbl-cap-${docId}`);
    if (lbl) { lbl.textContent = '…'; lbl.className = 'toggle-lbl'; }
    try {
      await db.collection('capacitacion').doc(docId).update({ asistio: val });
      const p = this.personas.find(x => x.id === docId);
      if (p) p.asistio = val;
      if (lbl) { lbl.textContent = 'Capacit.'; lbl.className = `toggle-lbl ${val ? 'on-cap' : ''}`; }
      checkbox.disabled = false;
      this.updateStats();
    } catch(e) {
      alert('Error: ' + e.message);
      checkbox.checked = !val; checkbox.disabled = false;
      if (lbl) { lbl.textContent = 'Capacit.'; lbl.className = `toggle-lbl ${!val ? 'on-cap' : ''}`; }
    }
  },

  // ── Toggle Práctica ──────────────────────────────────────────
  async togglePractica(personId, checkbox) {
    checkbox.disabled = true;
    const val = checkbox.checked;
    const lbl = document.getElementById(`lbl-prac-${personId}`);
    if (lbl) { lbl.textContent = '…'; lbl.className = 'toggle-lbl'; }
    const p = this.personas.find(x => x.id === personId);
    const dayData = TODOS.find(d => d.cue === this.activeCue);
    try {
      if (val) {
        const rec = {
          fecha: hoyISO(), hora: horaLocal(),
          semana: dayData.semana, dia: dayData.dia,
          escuela: dayData.escuela, cue: dayData.cue, nivel: dayData.nivel||'',
          rol: p.rol||'', apellido_nombre: p.nombre, dni: p.dni||null,
          cargo: p.cargo||'', turno: p.turno||'',
          capacitado: p.asistio, esNuevo: false
        };
        const ref = await db.collection('verificacion').add(rec);
        p.verifId = ref.id; p.presente = true;
      } else {
        if (p.verifId) { await db.collection('verificacion').doc(p.verifId).delete(); p.verifId = null; }
        p.presente = false;
      }
      // Actualizar fila visualmente sin re-renderizar todo
      const row = checkbox.closest('.person-row');
      if (row) row.classList.toggle('is-present', val);
      if (lbl) { lbl.textContent = 'Práctica'; lbl.className = `toggle-lbl ${val ? 'on-prac' : ''}`; }
      checkbox.disabled = false;
      this.updateStats();
    } catch(e) {
      alert('Error: ' + e.message);
      checkbox.checked = !val; checkbox.disabled = false;
      if (lbl) { lbl.textContent = 'Práctica'; lbl.className = `toggle-lbl ${!val ? 'on-prac' : ''}`; }
    }
  },

  // ── Actualizar stats sin re-renderizar lista ─────────────────
  updateStats() {
    const statsEl = document.getElementById('stats-row');
    if (!statsEl) return;
    const q = norm(document.getElementById('search')?.value || '');
    const filtered = this.personas.filter(p =>
      norm(p.nombre).includes(q) || String(p.dni||'').includes(q)
    );
    const total  = filtered.length;
    const cap    = filtered.filter(p => p.asistio).length;
    const prac   = filtered.filter(p => p.presente).length;
    const pend   = total - prac;
    const nuevos = filtered.filter(p => p.esNuevo).length;
    statsEl.innerHTML = `
      <div class="stat-card total"><div class="stat-num">${total}</div><div class="stat-lbl">Total</div></div>
      <div class="stat-card cap"><div class="stat-num">${cap}</div><div class="stat-lbl">Capacitados</div></div>
      <div class="stat-card prac"><div class="stat-num">${prac}</div><div class="stat-lbl">En práctica</div></div>
      <div class="stat-card pend"><div class="stat-num">${pend}</div><div class="stat-lbl">Pendientes</div></div>
      ${nuevos ? `<div class="stat-card nuevo"><div class="stat-num">${nuevos}</div><div class="stat-lbl">Rec. registrados</div></div>` : ''}
    `;
  },

  // ── Exportar Excel ───────────────────────────────────────────
  async exportExcel() {
    const btn = document.getElementById('btn-export');
    btn.disabled = true; btn.textContent = 'Exportando…';
    try {
      const [snapCap, snapAsist, snapVerif] = await Promise.all([
        db.collection('capacitacion').get(),
        db.collection('asistencia').get(),
        db.collection('verificacion').get()
      ]);
      if (snapCap.empty) { alert('No hay datos en el padrón'); btn.disabled=false; btn.textContent='Exportar Excel'; return; }

      // ── Índice de asistencia: dni → registro (o nombre → registro como fallback)
      // Guardamos el primero encontrado por persona (puede haber varios si registró más de una vez)
      const asistByDni  = new Map(); // String(dni) → {fecha, hora, esNuevo, role, ...}
      const asistByNom  = new Map(); // norm(nombre) → {fecha, hora, esNuevo, role, ...}
      snapAsist.docs.forEach(doc => {
        const d = doc.data();
        const key = d.dni ? String(d.dni) : null;
        const nom = norm(d.apellido_nombre || '');
        const entry = {
          fechaRegistro: d.fecha || '',
          horaRegistro:  d.hora  || '',
          esNuevo:       !!d.esNuevo,
          rolRegistro:   d.role  || d.rol || '',
          mailRegistro:  d.mail  || '',
          telRegistro:   d.telefono || '',
        };
        if (key && !asistByDni.has(key)) asistByDni.set(key, entry);
        if (nom && !asistByNom.has(nom))  asistByNom.set(nom, entry);
      });

      // ── Índice de verificación (práctica): dni → registro
      const verifByDni = new Map(); // String(dni) → {fecha, hora, semana, dia, capacitado}
      const verifByNom = new Map(); // norm(nombre) → {fecha, hora, semana, dia, capacitado}
      snapVerif.docs.forEach(doc => {
        const d = doc.data();
        const key = d.dni ? String(d.dni) : null;
        const nom = norm(d.apellido_nombre || '');
        const entry = {
          fechaPractica:  d.fecha    || '',
          horaPractica:   d.hora     || '',
          semana:         d.semana   != null ? String(d.semana) : '',
          dia:            d.dia      != null ? String(d.dia)    : '',
          escuelaPractica:d.escuela  || '',
          cuePractica:    d.cue      || '',
          capacitadoVerif:d.capacitado ? 'SÍ' : 'NO',
        };
        if (key && !verifByDni.has(key)) verifByDni.set(key, entry);
        if (nom && !verifByNom.has(nom))  verifByNom.set(nom, entry);
      });

      // ── Mapear CUE → semana
      const cueToSemana = {};
      TODOS.forEach(d => { cueToSemana[d.cue] = d.semana; });

      // ── Función para buscar en índice por dni o nombre
      const lookup = (map1, map2, dni, nombre) => {
        if (dni && map1.has(String(dni))) return map1.get(String(dni));
        const n = norm(nombre || '');
        if (n && map2.has(n)) return map2.get(n);
        return null;
      };

      // ── Construir filas del padrón enriquecidas
      const rowsBySemana = { 1: [], 2: [], 3: [], 4: [], otros: [] };

      snapCap.docs.forEach(doc => {
        const d = doc.data();
        const cue    = d.cue || '';
        const semana = cueToSemana[cue] || 0;

        const asist = lookup(asistByDni, asistByNom, d.dni, d.nombre);
        const verif = lookup(verifByDni, verifByNom, d.dni, d.nombre);

        const row = {
          // Datos del padrón
          'CUE':                cue,
          'Escuela':            d.escuela  || '',
          'Semana':             semana     || '',
          'DNI':                d.dni      || '',
          'Apellido y Nombre':  d.nombre   || '',
          'Rol':                d.rol      || '',
          'Tipo':               d.tipo     || '',
          'Cargo':              d.cargo    || '',
          'Nivel':              d.nivel    || '',
          'Turno':              d.turno    || '',
          // Estado capacitación
          'Capacitado':         d.asistio  ? 'SÍ' : 'NO',
          // Registro de asistencia (app móvil)
          'Fecha Registro':     asist?.fechaRegistro || '',
          'Hora Registro':      asist?.horaRegistro  || '',
          'Recién Registrado':  asist?.esNuevo       ? 'SÍ' : 'NO',
          // Confirmación de práctica (admin)
          'Asistió Práctica':   verif ? 'SÍ' : 'NO',
          'Fecha Práctica':     verif?.fechaPractica  || '',
          'Hora Práctica':      verif?.horaPractica   || '',
          'Día Operativo':      verif?.dia            || '',
        };

        if (semana === 1)      rowsBySemana[1].push(row);
        else if (semana === 2) rowsBySemana[2].push(row);
        else if (semana === 3) rowsBySemana[3].push(row);
        else if (semana === 4) rowsBySemana[4].push(row);
        else                   rowsBySemana.otros.push(row);
      });

      // ── Hoja extra: todos los registros directos (esNuevo) con sus datos completos
      const rowsNuevos = [];
      snapAsist.docs.forEach(doc => {
        const d = doc.data();
        if (!d.esNuevo) return;
        const verif = lookup(verifByDni, verifByNom, d.dni, d.apellido_nombre);
        rowsNuevos.push({
          'Fecha Registro':     d.fecha    || '',
          'Hora Registro':      d.hora     || '',
          'Rol':                d.role || d.rol || '',
          'Apellido y Nombre':  d.apellido_nombre || '',
          'DNI':                d.dni      || '',
          'CUE Declarado':      d.cue      || '',
          'Escuela Declarada':  d.escuela  || '',
          'Cargo':              d.cargo    || '',
          'Turno':              d.turno    || '',
          'Mail':               d.mail     || '',
          'Teléfono':           d.telefono || '',
          'Asistió Práctica':   verif ? 'SÍ' : 'NO',
          'Fecha Práctica':     verif?.fechaPractica || '',
          'Hora Práctica':      verif?.horaPractica  || '',
          'Día Operativo':      verif?.dia           || '',
        });
      });
      rowsNuevos.sort((a,b) => (a['Fecha Registro']+a['Hora Registro']).localeCompare(b['Fecha Registro']+b['Hora Registro']));

      // ── Ordenar y generar libro
      const sortRows = rows => rows.sort((a,b) =>
        String(a.CUE||'').localeCompare(String(b.CUE||'')) ||
        String(a['Apellido y Nombre']||'').localeCompare(String(b['Apellido y Nombre']||''))
      );

      const wb = XLSX.utils.book_new();

      if (rowsBySemana[1].length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortRows(rowsBySemana[1])), 'Semana 1');
      }
      if (rowsBySemana[2].length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortRows(rowsBySemana[2])), 'Semana 2');
      }
      if (rowsBySemana[3].length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortRows(rowsBySemana[3])), 'Semana 3');
      }
      if (rowsBySemana[4].length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortRows(rowsBySemana[4])), 'Semana 4');
      }

      const allPadron = sortRows([...rowsBySemana[1], ...rowsBySemana[2], ...rowsBySemana[3], ...rowsBySemana[4], ...rowsBySemana.otros]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allPadron), 'Todos');

      if (rowsNuevos.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsNuevos), 'Recién Registrados');
      }
      if (rowsBySemana.otros.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sortRows(rowsBySemana.otros)), 'Sin semana');
      }

      XLSX.writeFile(wb, `Reporte_META_${hoyISO()}.xlsx`);
    } catch(e) { alert('Error: ' + e.message); console.error(e); }
    btn.disabled = false; btn.textContent = 'Exportar Excel';
  },

  // ── Error state ──────────────────────────────────────────────
  showError(msg) {
    const main = document.getElementById('main');
    if (main) main.innerHTML = `<div class="empty"><div class="empty-title" style="color:#DC2626">${msg}</div></div>`;
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
