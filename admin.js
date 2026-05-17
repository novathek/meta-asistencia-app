'use strict';

const SEMANA_1 = [
  { semana:1, dia:1, escuela:'ESCUELA N\u00b0 162 "9 DE JULIO"',                                                 nivel:'PRIMARIA',   cue:'100040600P' },
  { semana:1, dia:2, escuela:'ESCUELA PROVINCIAL DE EDUCACION TECNICA N\u00b07 "ING. JOSE ALSINA ALCOBERT"',    nivel:'SECUNDARIA', cue:'100008600S' },
  { semana:1, dia:3, escuela:'ESCUELA PROVINCIAL DE EDUCACION TECNICA N\u00aa6 "MAESTRO MARIANO FERNANDO PIERI"',nivel:'SECUNDARIA', cue:'100007400S' },
  { semana:1, dia:4, escuela:'ESCUELA PROVINCIAL DE MINERIA "DR. BERNARDO HOUSSAY"',                            nivel:'SECUNDARIA', cue:'100007300S' },
  { semana:1, dia:5, escuela:'ESCUELA SECUNDARIA N\u00b049',                                                     nivel:'SECUNDARIA', cue:'100063100S' }
];

function hoyISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
function horaLocal() {
  return new Date().toLocaleTimeString('es-AR', { hour12: false });
}

let db;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
} catch (e) {
  console.error('[Firebase] error', e);
}

const Admin = {
  selectedDayIdx: -1,
  personas: [],

  init() {
    this.renderTabs();
    if(db) this.selectDay(0);
    else document.getElementById('people-list').innerHTML = '<div class="empty-state">Error: Firebase no configurado</div>';
  },

  renderTabs() {
    const tabs = document.getElementById('day-tabs');
    tabs.innerHTML = SEMANA_1.map((d, i) => `
      <button class="day-tab" id="tab-${i}" onclick="Admin.selectDay(${i})">D\u00eda ${d.dia}</button>
    `).join('');
  },

  async selectDay(idx) {
    if(this.selectedDayIdx === idx) return;
    this.selectedDayIdx = idx;
    
    document.querySelectorAll('.day-tab').forEach(el => el.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${idx}`);
    if(activeTab) activeTab.classList.add('active');
    
    const dayData = SEMANA_1[idx];
    
    document.getElementById('school-header').innerHTML = `
      <div class="school-day">D\u00eda ${dayData.dia}</div>
      <div class="school-title">${dayData.escuela} <span style="color:#64748B;font-size:0.85rem;font-weight:400;">(CUE: ${dayData.cue})</span></div>
      <input type="text" id="search" class="search-box" placeholder="Buscar por nombre o DNI..." oninput="Admin.renderList()">
    `;
    
    document.getElementById('stats-bar').style.display = 'none';
    document.getElementById('people-list').innerHTML = '<div class="empty-state">Cargando base de datos...</div>';
    
    try {
      // 1. Obtener los esperados (capacitacion)
      const snapCap = await db.collection('capacitacion').where('cue', '==', dayData.cue).get();
      
      // 2. Obtener los verificados en campo (practica)
      const snapVerif = await db.collection('verificacion')
        .where('dia', '==', dayData.dia)
        .where('cue', '==', dayData.cue)
        .get();
        
      const verifMap = new Map(); // Para saber el ID del documento si queremos borrarlo
      snapVerif.docs.forEach(doc => {
        const d = doc.data();
        if(d.dni) verifMap.set(String(d.dni), doc.id);
        if(d.apellido_nombre) verifMap.set(d.apellido_nombre.toLowerCase().trim(), doc.id);
      });

      this.personas = snapCap.docs.map(doc => {
        const d = doc.data();
        let verifId = null;
        if (d.dni && verifMap.has(String(d.dni))) verifId = verifMap.get(String(d.dni));
        else if (d.nombre && verifMap.has(d.nombre.toLowerCase().trim())) verifId = verifMap.get(d.nombre.toLowerCase().trim());
        
        return { 
          id: doc.id, 
          ...d, 
          verifId: verifId, 
          presente: !!verifId 
        };
      });
      
      this.personas.sort((a,b) => (a.nombre||'').localeCompare(b.nombre||''));
      this.renderList();
    } catch(e) {
      console.error(e);
      document.getElementById('people-list').innerHTML = '<div class="empty-state" style="color:#DC2626">Error al cargar datos. Verifica tu conexi\u00f3n y permisos.</div>';
    }
  },

  renderList() {
    const list = document.getElementById('people-list');
    const searchEl = document.getElementById('search');
    const q = searchEl ? searchEl.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
    
    const filtered = this.personas.filter(p => {
      const nom = (p.nombre||'').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const dni = String(p.dni||'');
      return nom.includes(q) || dni.includes(q);
    });
    
    // Stats
    const total = filtered.length;
    const asistieronCap = filtered.filter(p => p.asistio).length;
    const asistieronPrac = filtered.filter(p => p.presente).length;
    const statsBar = document.getElementById('stats-bar');
    statsBar.style.display = 'flex';
    statsBar.innerHTML = `
      <div>Total: ${total}</div>
      <div style="color:#2563EB">Capacitados: ${asistieronCap}</div>
      <div style="color:#166534">En pr\u00e1ctica: ${asistieronPrac}</div>
    `;

    if (filtered.length === 0) {
      list.innerHTML = '<div class="empty-state">No se encontraron personas</div>';
      return;
    }

    list.innerHTML = filtered.map(p => `
      <div class="person-item">
        <div class="person-info">
          <div class="person-name">${p.nombre}</div>
          <div class="person-meta">DNI: ${p.dni||'S/D'} \u2022 ${p.rol||'S/D'}</div>
          ${p.cargo ? `<div class="person-badge">${p.cargo}</div>` : ''}
          ${p.turno ? `<div class="person-badge" style="background:#F3E8FF;color:#6B21A8;">Turno ${p.turno}</div>` : ''}
        </div>
        
        <div class="actions-col">
          <!-- Toggle Capacitaci\u00f3n -->
          <div class="switch-container">
            <div class="switch-label ${p.asistio ? 'yes' : ''}" style="${p.asistio ? 'color:#2563EB' : ''}" id="lbl-cap-${p.id}">Capacit.</div>
            <label class="switch">
              <input type="checkbox" id="chk-cap-${p.id}" ${p.asistio ? 'checked' : ''} onchange="Admin.toggleCapacitacion('${p.id}', this)">
              <span class="slider blue"></span>
            </label>
          </div>
          
          <!-- Toggle Pr\u00e1ctica -->
          <div class="switch-container">
            <div class="switch-label ${p.presente ? 'yes' : ''}" id="lbl-prac-${p.id}">Pr\u00e1ctica</div>
            <label class="switch">
              <input type="checkbox" id="chk-prac-${p.id}" ${p.presente ? 'checked' : ''} onchange="Admin.togglePractica('${p.id}', this)">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>
    `).join('');
  },

  async toggleCapacitacion(docId, checkbox) {
    checkbox.disabled = true;
    const nuevoEstado = checkbox.checked;
    const lbl = document.getElementById(`lbl-cap-${docId}`);
    if(lbl) { lbl.textContent = '...'; lbl.style.color = '#94A3B8'; }

    try {
      await db.collection('capacitacion').doc(docId).update({ asistio: nuevoEstado });
      const p = this.personas.find(x => x.id === docId);
      if (p) p.asistio = nuevoEstado;
      
      if(lbl) {
        lbl.textContent = 'Capacit.';
        lbl.style.color = nuevoEstado ? '#2563EB' : '#94A3B8';
      }
      checkbox.disabled = false;
      this.updateStatsUI();
    } catch(e) {
      alert('Error: ' + e.message);
      checkbox.checked = !nuevoEstado;
      checkbox.disabled = false;
      if(lbl) {
        lbl.textContent = 'Capacit.';
        lbl.style.color = !nuevoEstado ? '#2563EB' : '#94A3B8';
      }
    }
  },

  async togglePractica(personId, checkbox) {
    checkbox.disabled = true;
    const nuevoEstado = checkbox.checked;
    const lbl = document.getElementById(`lbl-prac-${personId}`);
    if(lbl) { lbl.textContent = '...'; lbl.className = 'switch-label'; }

    const p = this.personas.find(x => x.id === personId);
    const dayData = SEMANA_1[this.selectedDayIdx];

    try {
      if (nuevoEstado) {
        // Crear registro en verificacion
        const record = {
          fecha: hoyISO(), hora: horaLocal(),
          semana: dayData.semana, dia: dayData.dia,
          escuela: dayData.escuela, cue: dayData.cue,
          rol: p.rol || '', apellido_nombre: p.nombre, dni: p.dni || null,
          cargo: p.cargo || '', turno: p.turno || '',
          capacitado: p.asistio, esNuevo: false
        };
        const docRef = await db.collection('verificacion').add(record);
        p.verifId = docRef.id;
        p.presente = true;
      } else {
        // Eliminar registro
        if (p.verifId) {
          await db.collection('verificacion').doc(p.verifId).delete();
          p.verifId = null;
        }
        p.presente = false;
      }

      if(lbl) {
        lbl.textContent = 'Pr\u00e1ctica';
        lbl.className = `switch-label ${nuevoEstado ? 'yes' : ''}`;
      }
      checkbox.disabled = false;
      this.updateStatsUI();
    } catch(e) {
      alert('Error: ' + e.message);
      checkbox.checked = !nuevoEstado;
      checkbox.disabled = false;
      if(lbl) {
        lbl.textContent = 'Pr\u00e1ctica';
        lbl.className = `switch-label ${!nuevoEstado ? 'yes' : ''}`;
      }
    }
  },

  updateStatsUI() {
    const searchEl = document.getElementById('search');
    const q = searchEl ? searchEl.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
    const filtered = this.personas.filter(x => {
      const nom = (x.nombre||'').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const dni = String(x.dni||'');
      return nom.includes(q) || dni.includes(q);
    });
    const total = filtered.length;
    const asistieronCap = filtered.filter(x => x.asistio).length;
    const asistieronPrac = filtered.filter(x => x.presente).length;
    document.getElementById('stats-bar').innerHTML = `
      <div>Total: ${total}</div>
      <div style="color:#2563EB">Capacitados: ${asistieronCap}</div>
      <div style="color:#166534">En pr\u00e1ctica: ${asistieronPrac}</div>
    `;
  },
  
  async exportExcel() {
    const btn = document.getElementById('btn-export');
    btn.disabled = true;
    btn.textContent = 'Exportando...';

    try {
      // Para exportar todo cruzado necesitamos ambas colecciones globales
      const snapCap = await db.collection('capacitacion').get();
      const snapVerif = await db.collection('verificacion').get();
      
      if(snapCap.empty) { alert("No hay datos"); btn.disabled=false; btn.textContent='Exportar Todos'; return; }
      
      const verifMap = new Set();
      snapVerif.docs.forEach(doc => {
        const d = doc.data();
        if(d.dni) verifMap.add(String(d.dni));
        if(d.apellido_nombre) verifMap.add(d.apellido_nombre.toLowerCase().trim());
      });

      const rows = snapCap.docs.map(doc => {
        const d = doc.data();
        const presente = (d.dni && verifMap.has(String(d.dni))) || (d.nombre && verifMap.has(d.nombre.toLowerCase().trim()));
        return {
          'CUE': d.cue || '',
          'Escuela': d.escuela || '',
          'DNI': d.dni || '',
          'Apellido y Nombre': d.nombre || '',
          'Rol': d.rol || '',
          'Cargo': d.cargo || '',
          'Nivel': d.nivel || '',
          'Turno': d.turno || '',
          'Capacitado': d.asistio ? 'S\u00cd' : 'NO',
          'Asisti\u00f3 Pr\u00e1ctica': presente ? 'S\u00cd' : 'NO'
        };
      });

      rows.sort((a,b) => (a.CUE.localeCompare(b.CUE)) || (a['Apellido y Nombre'].localeCompare(b['Apellido y Nombre'])));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Datos Globales');

      XLSX.writeFile(wb, `Reporte_Completo_${hoyISO()}.xlsx`);
    } catch(e) {
      alert('Error: ' + e.message);
    }
    btn.disabled = false;
    btn.textContent = 'Exportar Todos';
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
