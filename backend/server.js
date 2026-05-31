require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
const pool = new Pool({
  host:     process.env.DB_HOST     || 'ep-green-feather-apw0gn0b-pooler.c-7.us-east-1.aws.neon.tech',
  port:     parseInt(process.env.DB_PORT || '6543'),
  database: process.env.DB_NAME     || 'neondb',
  user:     process.env.DB_USER     || 'neondb_owner',
  password: process.env.DB_PASSWORD || 'npg_Jr93WiZEaQfI',
  ssl: { rejectUnauthorized: false }
});


// ── CATEGORÍAS ──────────────────────────────────────────────────────
app.get('/categorias', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY id')
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/categorias', async (req, res) => {
  try {
    const { nombre } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO categorias (nombre) VALUES ($1) RETURNING *', [nombre]
    );
    res.status(201).json(rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/categorias/:id', async (req, res) => {
  try {
    const { nombre } = req.body;
    const { rows } = await pool.query(
      'UPDATE categorias SET nombre=$1 WHERE id=$2 RETURNING *', [nombre, req.params.id]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/categorias/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categorias WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── EQUIPOS ─────────────────────────────────────────────────────────
app.get('/equipos/:categoriaId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM equipos WHERE categoria_id=$1 ORDER BY id', [req.params.categoriaId]
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/equipos', async (req, res) => {
  try {
    const { nombre, categoria_id, color, escudo } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO equipos (nombre, categoria_id, color, escudo) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, categoria_id, color || null, escudo || null]
    );
    res.status(201).json(rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/equipos/:id', async (req, res) => {
  try {
    const { nombre, color, escudo } = req.body;
    const { rows } = await pool.query(
      'UPDATE equipos SET nombre=$1, color=$2, escudo=$3 WHERE id=$4 RETURNING *',
      [nombre, color || null, escudo || null, req.params.id]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/equipos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM equipos WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── JUGADORES ────────────────────────────────────────────────────────
app.get('/jugadores/:equipoId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM jugadores WHERE equipo_id=$1 ORDER BY id', [req.params.equipoId]
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/jugadores', async (req, res) => {
  try {
    const { nombre, numero, equipo_id, foto } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO jugadores (nombre, numero, equipo_id, foto) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, numero || null, equipo_id, foto || null]
    );
    res.status(201).json(rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/jugadores/:id', async (req, res) => {
  try {
    const { nombre, numero, foto } = req.body;
    const { rows } = await pool.query(
      'UPDATE jugadores SET nombre=$1, numero=$2, foto=$3 WHERE id=$4 RETURNING *',
      [nombre, numero || null, foto || null, req.params.id]
    );
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/jugadores/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM jugadores WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── ROL (estado del torneo) ──────────────────────────────────────────
app.get('/rol/:categoriaId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM rol WHERE categoria_id=$1', [req.params.categoriaId]
    );
    res.json(rows[0] || {});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/rol', async (req, res) => {
  try {
    const {
      categoria_id, jornadas, equipos_en_rol,
      partidos_jugados, jornadas_jugadas, jornadas_doradas,
      partidos_agregados, partidos_movidos,
      jornada_actual_marcada, sugerencia_fija
    } = req.body;

    await pool.query(`
      INSERT INTO rol (categoria_id, jornadas, equipos_en_rol, partidos_jugados,
        jornadas_jugadas, jornadas_doradas, partidos_agregados, partidos_movidos,
        jornada_actual_marcada, sugerencia_fija)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (categoria_id) DO UPDATE SET
        jornadas=$2, equipos_en_rol=$3, partidos_jugados=$4,
        jornadas_jugadas=$5, jornadas_doradas=$6, partidos_agregados=$7,
        partidos_movidos=$8, jornada_actual_marcada=$9, sugerencia_fija=$10
    `, [
      categoria_id,
      JSON.stringify(jornadas || []),
      JSON.stringify(equipos_en_rol || []),
      JSON.stringify(partidos_jugados || {}),
      JSON.stringify(jornadas_jugadas || []),
      JSON.stringify(jornadas_doradas || []),
      JSON.stringify(partidos_agregados || {}),
      JSON.stringify(partidos_movidos || {}),
      jornada_actual_marcada ?? null,
      sugerencia_fija ? JSON.stringify(sugerencia_fija) : null
    ]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/rol/:categoriaId', async (req, res) => {
  try {
    await pool.query('DELETE FROM rol WHERE categoria_id=$1', [req.params.categoriaId]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── GOLES ────────────────────────────────────────────────────────────
app.get('/goles/:categoriaId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM goles WHERE categoria_id=$1', [req.params.categoriaId]
    );
    res.json(rows[0] || {});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/goles', async (req, res) => {
  try {
    const { categoria_id, datos } = req.body;
    await pool.query(`
      INSERT INTO goles (categoria_id, datos) VALUES ($1,$2)
      ON CONFLICT (categoria_id) DO UPDATE SET datos=$2
    `, [categoria_id, JSON.stringify(datos)]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PENALES ──────────────────────────────────────────────────────────
app.get('/penales/:categoriaId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM penales WHERE categoria_id=$1', [req.params.categoriaId]
    );
    res.json(rows[0] || {});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/penales', async (req, res) => {
  try {
    const { categoria_id, datos } = req.body;
    await pool.query(`
      INSERT INTO penales (categoria_id, datos) VALUES ($1,$2)
      ON CONFLICT (categoria_id) DO UPDATE SET datos=$2
    `, [categoria_id, JSON.stringify(datos)]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── DISEÑOS ──────────────────────────────────────────────────────────
// Helper: flatten datos JSONB into the row object so frontend reads d.bgColor1 directly
function flattenDisenos(rows) {
  return rows.map(r => {
    const datos = (typeof r.datos === 'object' && r.datos) ? r.datos : {};
    return { ...datos, ...r, datos: datos };
  });
}

app.get('/disenos/:categoria', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM disenos WHERE $1 = ANY(asignado_a) OR asignado_a = '{}' ORDER BY id",
      [req.params.categoria]
    );
    res.json(flattenDisenos(rows));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/disenos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM disenos ORDER BY id');
    res.json(flattenDisenos(rows));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/disenos', async (req, res) => {
  try {
    const { nombre, datos, asignado_a, ...rest } = req.body;
    // Accept design fields either nested under 'datos' or flat at root
    const datosToStore = (datos && typeof datos === 'object') ? datos : rest;
    const nombreFinal = nombre || datosToStore.nombre || 'Sin nombre';
    const { rows } = await pool.query(
      'INSERT INTO disenos (nombre, datos, asignado_a) VALUES ($1,$2,$3) RETURNING *',
      [nombreFinal, JSON.stringify(datosToStore), asignado_a || []]
    );
    res.status(201).json({ ...datosToStore, ...rows[0], datos: datosToStore });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/disenos/:id', async (req, res) => {
  try {
    const { nombre, datos, asignado_a, ...rest } = req.body;
    const datosToStore = (datos && typeof datos === 'object') ? datos : rest;
    const nombreFinal = nombre || datosToStore.nombre || 'Sin nombre';
    const { rows } = await pool.query(
      'UPDATE disenos SET nombre=$1, datos=$2, asignado_a=COALESCE($3, asignado_a) WHERE id=$4 RETURNING *',
      [nombreFinal, JSON.stringify(datosToStore), asignado_a || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ ...datosToStore, ...rows[0], datos: datosToStore });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// FIX: was PUT but galeria calls POST, and also support PUT for backward compat
async function activarDiseno(req, res) {
  try {
    const { categoria } = req.body;
    if (!categoria) return res.status(400).json({ error: 'categoria required' });
    // Add to both asignado_a (for filtering) and activo_para (for marking active)
    await pool.query(
      `UPDATE disenos SET
        asignado_a = array_append(COALESCE(asignado_a,'{}'), $1),
        activo_para = array_append(COALESCE(activo_para,'{}'), $1)
       WHERE id=$2 AND NOT ($1 = ANY(COALESCE(asignado_a,'{}')))`,
      [categoria, req.params.id]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
}
app.post('/disenos/:id/activar', activarDiseno);
app.put('/disenos/:id/activar', activarDiseno);

// Full assignment: replace asignado_a with new list of categories
app.post('/disenos/:id/asignar', async (req, res) => {
  try {
    const { categorias } = req.body; // array of category names
    const lista = Array.isArray(categorias) ? categorias : [];
    await pool.query(
      'UPDATE disenos SET asignado_a=$1, activo_para=$1 WHERE id=$2',
      [lista, req.params.id]
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/disenos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM disenos WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── HORARIOS ─────────────────────────────────────────────────────────
// FIX: Store all schedule data as a single JSON blob (not per-row), so it can be retrieved correctly
app.get('/horarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT datos FROM horarios ORDER BY id LIMIT 1');
    if (rows.length === 0) {
      return res.json({ datos: {} });
    }
    // datos is the whole scheduleMap stored as JSONB
    res.json({ datos: rows[0].datos });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/horarios', async (req, res) => {
  try {
    const { datos } = req.body;
    // Store the entire schedule map as one JSONB value
    await pool.query('DELETE FROM horarios');
    await pool.query('INSERT INTO horarios (datos) VALUES ($1)', [JSON.stringify(datos || {})]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── COLORES ──────────────────────────────────────────────────────────
app.get('/colores', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM colores LIMIT 1');
    res.json(rows[0] || {});
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/colores', async (req, res) => {
  try {
    const { datos } = req.body;
    await pool.query('DELETE FROM colores');
    await pool.query('INSERT INTO colores (datos) VALUES ($1)', [JSON.stringify(datos)]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PUBLICO (imágenes base64 almacenadas) ────────────────────────────
app.get('/publico/:tipo/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT datos FROM publico WHERE tipo=$1 AND ref_id=$2',
      [req.params.tipo, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(rows[0].datos);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/publico', async (req, res) => {
  try {
    const { tipo, ref_id, datos } = req.body;
    await pool.query(`
      INSERT INTO publico (tipo, ref_id, datos) VALUES ($1,$2,$3)
      ON CONFLICT (tipo, ref_id) DO UPDATE SET datos=$3
    `, [tipo, ref_id, JSON.stringify(datos)]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── GRÁFICAS: PARTIDOS POR DÍA ──────────────────────────────────────
app.get('/partidos-dia/:categoriaId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT dia, partidos FROM partidos_dia WHERE categoria_id=$1 ORDER BY dia',
      [req.params.categoriaId]
    );
    res.json(rows);
  } catch(e) { res.json([]); }
});

app.post('/partidos-dia', async (req, res) => {
  try {
    const { categoria_id, dia, partidos } = req.body;
    await pool.query(`
      INSERT INTO partidos_dia (categoria_id, dia, partidos) VALUES ($1,$2,$3)
      ON CONFLICT (categoria_id, dia) DO UPDATE SET partidos=$3
    `, [categoria_id, dia, partidos]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── GRÁFICAS: RENDIMIENTO MENSUAL ───────────────────────────────────
app.get('/rendimiento/:categoriaId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT mes, valor FROM rendimiento WHERE categoria_id=$1 ORDER BY mes',
      [req.params.categoriaId]
    );
    res.json(rows);
  } catch(e) { res.json([]); }
});

app.post('/rendimiento', async (req, res) => {
  try {
    const { categoria_id, mes, valor } = req.body;
    await pool.query(`
      INSERT INTO rendimiento (categoria_id, mes, valor) VALUES ($1,$2,$3)
      ON CONFLICT (categoria_id, mes) DO UPDATE SET valor=$3
    `, [categoria_id, mes, valor]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── GRÁFICAS: CONFIGURACIÓN DE INGRESOS ─────────────────────────────
app.get('/config/:categoriaId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM config_ingresos WHERE categoria_id=$1',
      [req.params.categoriaId]
    );
    res.json(rows[0] || null);
  } catch(e) { res.json(null); }
});

app.post('/config', async (req, res) => {
  try {
    const { categoria_id, costo_credencial, premio_1, premio_2, premio_3, premio_4 } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO config_ingresos (categoria_id, costo_credencial, premio_1, premio_2, premio_3, premio_4)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (categoria_id) DO UPDATE SET
        costo_credencial=$2, premio_1=$3, premio_2=$4, premio_3=$5, premio_4=$6
      RETURNING *
    `, [categoria_id, costo_credencial||0, premio_1||0, premio_2||0, premio_3||0, premio_4||0]);
    res.json(rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── START ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Backend local corriendo en http://localhost:${PORT}`);
});