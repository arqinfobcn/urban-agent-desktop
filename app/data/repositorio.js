import NNUU from "./nnuu.js";
import PROT from "./prot.js";

// Repositorio normativo estructurado — jerarquía documental que la app puede
// navegar (PGOUM 1997 → Compendio de Normas Urbanísticas → Título 8 →
// Norma Zonal → grados → artículos). Cada nodo lleva los metadatos que
// permiten saber de dónde sale un dato y si sigue vigente.
// Fecha de la última revisión manual de este repositorio contra el texto
// oficial del PGOUM y el callejero de servicios GIS del Ayuntamiento.
const FECHA_CONSULTA = "2026-08-25";
// Compendio de Normas Urbanísticas oficial (Ayuntamiento de Madrid, Portal de
// Transparencia) — texto consolidado del PGOUM 1997 con las Modificaciones
// Puntuales de Planeamiento General (MPG) incorporadas a fecha 24/09/2025.
// Es la fuente primaria de la que se compiló manualmente nnuu.js/prot.js.
const URL_COMPENDIO = "https://transparencia.madrid.es/UnidadesDescentralizadas/UDCUrbanismo/PGOUM/CompendioNNUU/Compendio_2025_septiembre/COMPENDIO_MPG_NNUU_24_09_2025.pdf";
const URL_PGOUM = URL_COMPENDIO;

const normasZonales = Object.entries(NNUU).map(([key, nz]) => ({
  id: `nz-${key}`,
  tipo: "norma-zonal",
  documento: `Norma Zonal ${key} · ${nz.nombre}`,
  titulo: `Título 8, ${nz.cap} — PGOUM 1997`,
  organismo: "Ayuntamiento de Madrid",
  fecha: "2025-09-24",
  version: "Compendio MPG-NNUU, consolidado a 24/09/2025",
  estado: "vigente",
  url: URL_PGOUM,
  fechaConsulta: FECHA_CONSULTA,
  ambitoTerritorial: "Término municipal de Madrid",
  articulos: Object.entries(nz.grados).map(([gk, g]) => `Grado ${gk} · ${g.label}`),
  materias: ["Edificabilidad", "Usos del suelo", "Condiciones de edificación"],
  relacionConOtrosDocumentos: ["pgoum1997", "compendio-nnuu", "titulo8"],
  prioridadNormativa: 3,
  posiblesModificaciones: "Ver expedientes de planeamiento (MPG) de ámbito municipal que afecten a las Normas Urbanísticas.",
  vigencia: "vigente",
  padre: "titulo8",
}));

const catalogoProteccion = Object.keys(PROT).map((key) => ({
  id: `prot-${key}`,
  tipo: "catalogo-proteccion",
  documento: `Catálogo de Protección · Nivel ${key[0].toUpperCase()}${key.slice(1)}`,
  titulo: "Título 8, Cap. 8.1 PGOUM 1997 — Protección del Patrimonio Histórico",
  organismo: "Ayuntamiento de Madrid — Área de Patrimonio",
  fecha: "2025-09-24",
  version: "Compendio MPG-NNUU, consolidado a 24/09/2025",
  estado: "vigente",
  url: URL_PGOUM,
  fechaConsulta: FECHA_CONSULTA,
  ambitoTerritorial: "Edificios y elementos catalogados del término municipal de Madrid",
  articulos: ["Art. 8.1.31", "Art. 8.1.32"],
  materias: ["Protección patrimonial", "Obras admitidas y prohibidas"],
  relacionConOtrosDocumentos: ["pgoum1997", "compendio-nnuu", "titulo8"],
  prioridadNormativa: 1,
  posiblesModificaciones: "Consultar el Catálogo de Edificios Protegidos actualizado y el registro de BIC del Ayuntamiento.",
  vigencia: "vigente",
  padre: "titulo8",
}));

const documentos = [
  {
    id: "pgoum1997",
    tipo: "plan-general",
    documento: "Plan General de Ordenación Urbana de Madrid 1997",
    titulo: "PGOUM 1997",
    organismo: "Ayuntamiento de Madrid",
    fecha: "1997-04-17",
    version: "Texto refundido con modificaciones puntuales vigentes",
    estado: "vigente",
    url: URL_PGOUM,
    fechaConsulta: FECHA_CONSULTA,
    ambitoTerritorial: "Término municipal de Madrid",
    articulos: [],
    materias: ["Clasificación del suelo", "Calificación urbanística", "Normas Zonales", "Protección del patrimonio"],
    relacionConOtrosDocumentos: [],
    prioridadNormativa: 1,
    posiblesModificaciones: "Modificado puntualmente por sucesivas Modificaciones Puntuales de Planeamiento General (MPG) — ver expedientes de planeamiento del Ayuntamiento.",
    vigencia: "vigente",
    padre: null,
  },
  {
    id: "compendio-nnuu",
    tipo: "compendio",
    documento: "Compendio de Normas Urbanísticas",
    titulo: "PGOUM 1997",
    organismo: "Ayuntamiento de Madrid",
    fecha: "2025-09-24",
    version: "Compendio MPG-NNUU, consolidado a 24/09/2025",
    estado: "vigente",
    url: URL_PGOUM,
    fechaConsulta: FECHA_CONSULTA,
    ambitoTerritorial: "Término municipal de Madrid",
    articulos: [],
    materias: ["Normas Zonales", "Protección patrimonial"],
    relacionConOtrosDocumentos: ["pgoum1997"],
    prioridadNormativa: 2,
    posiblesModificaciones: null,
    vigencia: "vigente",
    padre: "pgoum1997",
  },
  {
    id: "titulo8",
    tipo: "titulo",
    documento: "Título 8 · Normas Zonales y Protección",
    titulo: "PGOUM 1997",
    organismo: "Ayuntamiento de Madrid",
    fecha: "2025-09-24",
    version: "Compendio MPG-NNUU, consolidado a 24/09/2025",
    estado: "vigente",
    url: URL_PGOUM,
    fechaConsulta: FECHA_CONSULTA,
    ambitoTerritorial: "Término municipal de Madrid",
    articulos: [],
    materias: ["Normas Zonales 1-11", "Catálogo de Protección"],
    relacionConOtrosDocumentos: ["compendio-nnuu"],
    prioridadNormativa: 2,
    posiblesModificaciones: null,
    vigencia: "vigente",
    padre: "compendio-nnuu",
  },
  {
    id: "decreto-19-2023",
    tipo: "normativa-sectorial",
    documento: "Decreto 19/2023, de 15 de marzo — Ordenación de establecimientos hoteleros",
    titulo: "Normativa sectorial de hospedaje (Comunidad de Madrid)",
    organismo: "Comunidad de Madrid — Consejo de Gobierno",
    fecha: "2023-03-15",
    version: "BOCM nº 69, 22/03/2023 — sustituye al Decreto 159/2003",
    estado: "vigente",
    url: "https://gestiona.comunidad.madrid/wleg_pub/secure/normativas/contenidoNormativa.jsf?opcion=VerHtml&nmnorma=13158&eli=true",
    fechaConsulta: FECHA_CONSULTA,
    ambitoTerritorial: "Comunidad de Madrid",
    articulos: [],
    materias: ["Establecimientos hoteleros", "Alojamiento turístico", "Requisitos técnicos mínimos de hospedaje"],
    // Es la "normativa sectorial de hospedaje vigente" a la que remite
    // directamente la pregunta A del Art. 7.6.3 del PGOUM ("¿Cumple los
    // requisitos técnicos mínimos de la normativa sectorial de hospedaje
    // vigente?") — no forma parte del PGOUM, es una norma autonómica
    // (Comunidad de Madrid) distinta y complementaria al planeamiento
    // municipal.
    relacionConOtrosDocumentos: ["compendio-nnuu"],
    prioridadNormativa: 2,
    posiblesModificaciones: "Verificar en el BOCM si existe una modificación o sustitución posterior de este decreto.",
    vigencia: "vigente",
    padre: null,
  },
  ...normasZonales,
  ...catalogoProteccion,
];

// Fuentes vivas: servicios GIS que la app consulta en cada búsqueda. No son
// documentos normativos — son la procedencia del DATO OBTENIDO en cada ficha.
const fuentesVivas = [
  { id: "gis-geocoder", documento: "Geocodificador oficial de vías (NDPS)", organismo: "Ayuntamiento de Madrid · SIGMA", url: "https://sigma.madrid.es/hosted/rest/services/GEOLOCATOR/GEOLOCATOR_NDPS_VIAS_PRIORIDAD/GeocodeServer", tipo: "servicio-gis", estado: "activo", ambitoTerritorial: "Término municipal de Madrid" },
  { id: "gis-normas-zonales", documento: "Normas Zonales (capa GIS)", organismo: "Ayuntamiento de Madrid · SIGMA", url: "https://sigma.madrid.es/hosted/rest/services/DESARROLLO_URBANO_ACTUALIZADO/NORMAS_ZONALES/MapServer", tipo: "servicio-gis", estado: "activo", ambitoTerritorial: "Término municipal de Madrid" },
  { id: "gis-condiciones-edificacion", documento: "Condiciones de Edificación (capa GIS)", organismo: "Ayuntamiento de Madrid · SIGMA", url: "https://sigma.madrid.es/hosted/rest/services/PGOUM97/PG_CONDICIONES_EDIFICACION/MapServer", tipo: "servicio-gis", estado: "activo", ambitoTerritorial: "Término municipal de Madrid" },
  { id: "gis-edificios-protegidos", documento: "Edificios Protegidos (capa GIS)", organismo: "Ayuntamiento de Madrid · SIGMA", url: "https://sigma.madrid.es/hosted/rest/services/PGOUM97/PG_EDIFICIOS_PROTEGIDOS/MapServer", tipo: "servicio-gis", estado: "activo", ambitoTerritorial: "Término municipal de Madrid" },
  { id: "gis-parcelas-urbanisticas", documento: "Parcelas Urbanísticas (capa GIS, visor de planeamiento)", organismo: "Ayuntamiento de Madrid · SIGMA", url: "https://sigma.madrid.es/hosted/rest/services/DESARROLLO_URBANO_ACTUALIZADO/USOS_SUELO/MapServer", tipo: "servicio-gis", estado: "activo", ambitoTerritorial: "Término municipal de Madrid" },
  { id: "gis-limites-administrativos", documento: "Límites Administrativos — Distritos y Barrios (capa GIS)", organismo: "Ayuntamiento de Madrid · SIGMA", url: "https://sigma.madrid.es/hosted/rest/services/CARTOGRAFIA/LIMITES_ADMINISTRATIVOS/MapServer", tipo: "servicio-gis", estado: "activo", ambitoTerritorial: "Término municipal de Madrid" },
  { id: "gis-expedientes-planeamiento", documento: "Expedientes de Planeamiento AD — Modificaciones y Planes Especiales (capa GIS)", organismo: "Ayuntamiento de Madrid · SIGMA", url: "https://sigma.madrid.es/hosted/rest/services/DESARROLLO_URBANO_ACTUALIZADO/EXPEDIENTES_PLANEAMIENTO_AD/MapServer", tipo: "servicio-gis", estado: "activo", ambitoTerritorial: "Término municipal de Madrid" },
  { id: "catastro-parcela", documento: "Referencia catastral y superficie real de parcela (Parcelas Catastrales INSPIRE)", organismo: "Dirección General del Catastro · Ministerio de Hacienda", url: "https://ovc.catastro.meh.es/OVCServWeb/OVCWcfLibres/OVCFotoFachada.svc/help", tipo: "servicio-oficial", estado: "activo", ambitoTerritorial: "Territorio de régimen catastral común (España, excl. País Vasco y Navarra)" },
];

export default { documentos, fuentesVivas };
