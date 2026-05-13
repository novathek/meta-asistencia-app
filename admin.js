'use strict';

let db;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
  console.log('[Admin Firebase] conectado');
} catch (e) {
  console.warn('[Admin Firebase] error de configuración:', e.message);
  document.getElementById('admin-list').innerHTML = '<div class="empty-state">Error al conectar con la base de datos.</div>';
}

function hoyISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

const Admin = {
  records: [],
  currentFilter: 'all',

  init() {
    if (!db) return;
    
    // Escuchar cambios en tiempo real para el día de hoy
    db.collection('asistencia')
      .where('fecha', '==', hoyISO())
      .onSnapshot(snap => {
        this.records = [];
        snap.forEach(doc => {
          this.records.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordenar por hora (más recientes primero)
        this.records.sort((a, b) => {
          if (b.timestamp && a.timestamp) return b.timestamp - a.timestamp;
          if (a.hora && b.hora) return b.hora.localeCompare(a.hora);
          return 0;
        });

        this.renderStats();
        this.renderList();
      }, err => {
        console.error("Error al escuchar cambios: ", err);
        document.getElementById('admin-list').innerHTML = '<div class="empty-state">Error de permisos o red.</div>';
      });
  },

  setFilter(role) {
    this.currentFilter = role;
    
    // Update active UI class
    document.querySelectorAll('.filter-chip').forEach(el => el.classList.remove('active'));
    document.getElementById(`filter-${role}`).classList.add('active');
    
    this.renderList();
  },

  renderStats() {
    const total = this.records.length;
    const ap    = this.records.filter(r => r.role === 'aplicador').length;
    const ve    = this.records.filter(r => r.role === 'veedor').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-aplicadores').textContent = ap;
    document.getElementById('stat-veedores').textContent = ve;
  },

  renderList() {
    const container = document.getElementById('admin-list');
    
    // Filtrar records
    let filteredRecords = this.records;
    if (this.currentFilter !== 'all') {
      filteredRecords = this.records.filter(r => r.role === this.currentFilter);
    }
    
    if (filteredRecords.length === 0) {
      container.innerHTML = '<div class="empty-state">No hay registros para mostrar.</div>';
      return;
    }

    container.innerHTML = filteredRecords.map(r => {
      const isAp = r.role === 'aplicador';
      const badge = `<span class="badge ${r.role}">${isAp ? 'Aplicador' : 'Veedor'}</span>`;
      const idInfo = isAp ? `DNI: ${r.dni || 'S/D'}` : `CUE: ${r.cue || 'S/D'}`;
      const nuevoTxt = r.esNuevo ? ' <span style="color:var(--md-warning);font-size:0.75rem;">(Inscripción Nueva)</span>' : '';

      return `
        <div class="admin-item">
          <div class="admin-item-info">
            <div class="admin-item-name">
              ${r.apellido_nombre} ${badge}
            </div>
            <div class="admin-item-meta">
              ${r.hora} · ${idInfo}${nuevoTxt}
            </div>
          </div>
          <button class="btn-delete" onclick="Admin.deleteRecord('${r.id}', '${r.apellido_nombre.replace(/'/g,"\\'")}')" title="Eliminar registro">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  },

  async deleteRecord(docId, name) {
    const ok = confirm(`¿Estás seguro de eliminar el registro de ${name}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    try {
      await db.collection('asistencia').doc(docId).delete();
      console.log('Registro eliminado');
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
    }
  },

  exportExcel() {
    const btn = document.getElementById('btn-export-excel');
    btn.disabled = true;
    btn.innerHTML = 'Exportando...';

    try {
      if (this.records.length === 0) {
        alert('No hay registros de asistencia hoy para exportar.');
        this._resetBtn(btn);
        return;
      }

      // Re-ordenar cronológicamente ascendente para el Excel
      const sortedRecords = [...this.records].sort((a, b) => {
        if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
        return 0;
      });

      const rows = sortedRecords.map(data => ({
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
      }));

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

    this._resetBtn(btn);
  },

  _resetBtn(btn) {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Exportar a Excel
    `;
  }
};

// Iniciar al cargar
document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});
