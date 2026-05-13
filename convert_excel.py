import openpyxl
import json
import re
import os

def fix_encoding(s):
    """Fix mojibake: Excel stored strings as latin-1 bytes but decoded as cp1252/wrong codec."""
    if not s:
        return s
    try:
        # Try to re-encode as latin-1 and decode as utf-8 (common Excel mojibake fix)
        fixed = s.encode('latin-1').decode('utf-8')
        return fixed
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    try:
        # Fallback: encode as cp1252, decode as utf-8
        fixed = s.encode('cp1252').decode('utf-8')
        return fixed
    except (UnicodeEncodeError, UnicodeDecodeError):
        return s   # return as-is if nothing works

def clean_str(val):
    if val is None:
        return ""
    s = str(val).strip()
    # Remove embedded newlines
    s = re.sub(r'\s*\n\s*', ' ', s)
    s = fix_encoding(s)
    return s.strip()

def clean_int(val):
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None

wb = openpyxl.load_workbook(
    r'uniraplicadoresyveedores.xlsx',
    data_only=True
)

# ── APLICADORES ──────────────────────────────────────────────
ws_ap = wb['APLICADORES']
aplicadores = []
for row in ws_ap.iter_rows(min_row=2, values_only=True):
    if not any(cell is not None for cell in row):
        continue
    cue, tipo, apellido_nombre, dni, mail, cargo, division, turno, telefono, cargo_campo = row
    dni_int = clean_int(dni)
    if not dni_int:          # skip rows without DNI (empty rows)
        continue
    aplicadores.append({
        "cue":             clean_str(cue),
        "tipo":            clean_str(tipo),
        "apellido_nombre": clean_str(apellido_nombre),
        "dni":             dni_int,
        "mail":            clean_str(mail),
        "cargo":           clean_str(cargo),
        "division":        clean_str(division),
        "turno":           clean_str(turno),
        "telefono":        clean_str(telefono),
        "cargo_campo":     clean_str(cargo_campo),
    })

# ── VEEDORES ─────────────────────────────────────────────────
ws_ve = wb['VEEDORES']
veedores = []
for row in ws_ve.iter_rows(min_row=2, values_only=True):
    if not any(cell is not None for cell in row):
        continue
    cue, turno, apellido_nombre, dni, cargo, telefono, mail, observaciones, escuela_ref, cargo_campo = row
    nombre = clean_str(apellido_nombre)
    if not nombre:
        continue
    veedores.append({
        "cue":             clean_str(cue),
        "turno":           clean_str(turno),
        "apellido_nombre": nombre,
        "dni":             clean_int(dni),
        "cargo":           clean_str(cargo),
        "telefono":        clean_str(telefono),
        "mail":            clean_str(mail),
        "observaciones":   clean_str(observaciones),
        "escuela_ref":     clean_str(escuela_ref),
        "cargo_campo":     clean_str(cargo_campo),
    })

# ── DIRECTIVOS ───────────────────────────────────
ws_di = wb['DIRECTIVOS']
directivos_dict = {}  # keyed by DNI to deduplicate
for row in ws_di.iter_rows(min_row=2, values_only=True):
    if not any(cell is not None for cell in row):
        continue
    # CUEANEXO, NIVEL, Nombre(escuela), Ano_Grado, Seccion, Turno,
    # Localidad_padron, NIVEL2, NOMBRE_APELLIDO, CARGO, DNI, CORREO
    cue, nivel, escuela, ano_grado, seccion, turno, localidad, nivel2, apellido_nombre, cargo, dni, mail = row
    dni_int = clean_int(dni)
    if not dni_int:
        continue
    if dni_int not in directivos_dict:   # keep first occurrence only
        directivos_dict[dni_int] = {
            "cue":             clean_str(cue),
            "nivel":           clean_str(nivel),
            "escuela":         clean_str(escuela),
            "turno":           clean_str(turno),
            "localidad":       clean_str(localidad),
            "apellido_nombre": clean_str(apellido_nombre),
            "cargo":           clean_str(cargo),
            "dni":             dni_int,
            "mail":            clean_str(mail),
        }
directivos = list(directivos_dict.values())

data = {
    "aplicadores": aplicadores,
    "veedores": veedores,
    "directivos": directivos,
}

json_str = json.dumps(data, ensure_ascii=False, indent=2)
output = (
    f"// AUTO-GENERATED — do not edit manually\n"
    f"// Aplicadores: {len(aplicadores)} | Veedores: {len(veedores)} | Directivos: {len(directivos)}\n"
    f"const DB = {json_str};\n"
)

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.js')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(output)

print(f"OK: data.js generado correctamente")
print(f"   Aplicadores: {len(aplicadores)}")
print(f"   Veedores:    {len(veedores)}")
print(f"   Directivos:  {len(directivos)}")
