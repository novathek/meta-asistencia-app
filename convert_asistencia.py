import openpyxl, json, os, re

def clean(val):
    if val is None: return ''
    s = str(val).strip()
    s = re.sub(r'\s*\n\s*', ' ', s)
    return s

wb = openpyxl.load_workbook('asistencia.xlsx', data_only=True)
ws = wb['Listado de asistencia']

data = {}  # { CUE: [ {rol, nombre, dni, nivel, cargo, turno, escuela}, ... ] }

for row in ws.iter_rows(min_row=2, values_only=True):
    if not any(c is not None for c in row):
        continue
    # Cols: ASISTENCIA,ROL,APELLIDO Y NOMBRE,DNI,NIVEL,ESCUELA,CUE_ENCUESTA,
    #       Nombre Institucion,CARGO,TIPO,TURNO,ÁREA,INSTITUCIÓN,TELÉFONO,MAIL,EMAIL,OBSERVACIONES
    asist, rol, nombre, dni, nivel, escuela, cue, nombre_inst, cargo, tipo, turno = row[:11]

    nombre_str = clean(nombre)
    if not nombre_str:
        continue

    cue_str = clean(cue) if cue else 'ND'

    persona = {
        'rol':     clean(rol),
        'nombre':  nombre_str,
        'dni':     clean(dni),
        'nivel':   clean(nivel),
        'cargo':   clean(cargo),
        'turno':   clean(turno),
        'escuela': clean(nombre_inst) or clean(escuela),
        'asistio': str(asist).strip().upper() == 'SI',
    }

    data.setdefault(cue_str, []).append(persona)

json_str = json.dumps(data, ensure_ascii=True, indent=2)
output = "// AUTO-GENERATED - do not edit manually\n"
output += "// Escuelas: " + str(len(data)) + " | Total personas: " + str(sum(len(v) for v in data.values())) + "\n"
asistieron = sum(1 for ps in data.values() for p in ps if p.get('asistio'))
output += "// Asistieron: " + str(asistieron) + " | No asistieron: " + str(sum(len(v) for v in data.values()) - asistieron) + "\n"
output += "var ASISTENCIA_DB = " + json_str + ";\n"

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'asistencia_data.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write(output)

print(f"OK: asistencia_data.js generado")
print(f"   Escuelas: {len(data)}")
print(f"   Total personas: {sum(len(v) for v in data.values())}")
for cue, personas in sorted(data.items()):
    print(f"   {cue}: {len(personas)} personas")
