-- ============================================================
--  TEAM SOCCER — Esquema de base de datos local
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS equipos (
  id           SERIAL PRIMARY KEY,
  nombre       TEXT    NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
  color        TEXT,
  escudo       TEXT
);

CREATE TABLE IF NOT EXISTS jugadores (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT    NOT NULL,
  numero    INTEGER,
  equipo_id INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
  foto      TEXT,
  baja      BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS rol (
  id                    SERIAL PRIMARY KEY,
  categoria_id          INTEGER UNIQUE REFERENCES categorias(id) ON DELETE CASCADE,
  jornadas              JSONB   DEFAULT '[]',
  equipos_en_rol        JSONB   DEFAULT '[]',
  partidos_jugados      JSONB   DEFAULT '{}',
  jornadas_jugadas      JSONB   DEFAULT '[]',
  jornadas_doradas      JSONB   DEFAULT '[]',
  partidos_agregados    JSONB   DEFAULT '{}',
  partidos_movidos      JSONB   DEFAULT '{}',
  jornada_actual_marcada INTEGER,
  sugerencia_fija       JSONB
);

CREATE TABLE IF NOT EXISTS goles (
  id           SERIAL PRIMARY KEY,
  categoria_id INTEGER UNIQUE REFERENCES categorias(id) ON DELETE CASCADE,
  datos        JSONB   DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS penales (
  id           SERIAL PRIMARY KEY,
  categoria_id INTEGER UNIQUE REFERENCES categorias(id) ON DELETE CASCADE,
  datos        JSONB   DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS disenos (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT,
  datos       JSONB   DEFAULT '{}',
  asignado_a  TEXT[]  DEFAULT '{}',
  activo_para TEXT[]  DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS horarios (
  id    SERIAL PRIMARY KEY,
  datos JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS colores (
  id    SERIAL PRIMARY KEY,
  datos JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS publico (
  id     SERIAL PRIMARY KEY,
  tipo   TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  datos  JSONB DEFAULT '{}',
  UNIQUE (tipo, ref_id)
);

-- Tablas para gráficas
CREATE TABLE IF NOT EXISTS partidos_dia (
  id           SERIAL PRIMARY KEY,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
  dia          TEXT NOT NULL,
  partidos     INTEGER DEFAULT 0,
  UNIQUE (categoria_id, dia)
);

CREATE TABLE IF NOT EXISTS rendimiento (
  id           SERIAL PRIMARY KEY,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
  mes          INTEGER NOT NULL,
  valor        NUMERIC DEFAULT 0,
  UNIQUE (categoria_id, mes)
);

CREATE TABLE IF NOT EXISTS config_ingresos (
  id               SERIAL PRIMARY KEY,
  categoria_id     INTEGER UNIQUE REFERENCES categorias(id) ON DELETE CASCADE,
  costo_credencial NUMERIC DEFAULT 0,
  premio_1         NUMERIC DEFAULT 0,
  premio_2         NUMERIC DEFAULT 0,
  premio_3         NUMERIC DEFAULT 0,
  premio_4         NUMERIC DEFAULT 0
);
