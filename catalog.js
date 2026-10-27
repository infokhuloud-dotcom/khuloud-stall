// Khuloud product list for the stall, taken from khuloudperfumes.com (28 Oct 2026).
// No prices on purpose: staff type the final amount for each sale.
const IMG = 'https://cdn.shopify.com/s/files/1/0752/3555/7562/files/';
const PERFUME_SIZES = ['100 mL', '30 mL', '10 mL'];
const ATTAR_SIZES = ['6 mL', '12 mL'];

const CATALOG = [
  // Perfumes
  ['Amber Pulse', 'White_BG_1.png?v=1775019984'],
  ['Citrus Reverence', 'citurs_rev.png?v=1775227291'],
  ['Crimson Veil', 'crimson_veil.png?v=1775227479'],
  ['Desert Eclipse', 'desert_eclliopse.png?v=1775227456'],
  ['Emerald Vale', 'emerland_vale.png?v=1775227209'],
  ['Femme Tempest', '6.png?v=1775018799'],
  ['Fleur Pale', 'fleurpale_1.png?v=1776848555'],
  ['Glacial Instinct', 'glacial_instinct.png?v=1775227348'],
  ['Golden Bloom', 'golden_2.png?v=1777116451'],
  ['Imperial Legacy', 'imperial_legacy_092fcaca-80f5-4d8f-aed8-fc96eab92125.png?v=1775227227'],
  ['Ivory Resonance', 'ivory_reso.png?v=1775227002'],
  ['Majestic Eclipse', 'majestic.png?v=1775227170'],
  ['Midnight Bloom', 'midnight_bloom_2.png?v=1777114791'],
  ['Midnight Horizon', 'midnoght_hori.png?v=1775227409'],
  ['Midnight Ruse', 'midnightruse.png?v=1776407217'],
  ['Noir Suede', 'noir_2.png?v=1777116973'],
  ['Obsidian Reverie', '4.png?v=1775018842'],
  ['Sylvan Radiance', 'sylvan_radience_2.png?v=1775227080'],
  ['Terra Absolu', 'teraaabsolu.png?v=1776800514'],
  ['Velour Roast', 'velour_roast_c5e3533c-5dba-4ee9-bd54-d17cf0ae3acd.png?v=1775227030'],
  ['Velvet Authority', 'velevt_authority.png?v=1775227391'],
].map(([name, img]) => ({ cat: 'Perfumes', name, img: IMG + img, sizes: PERFUME_SIZES }))
.concat([
  // Attars
  ['Citrus Reverence Attar', 'cirtus_cfe40c5e-2f00-415e-83c0-39314c238c6c.png?v=1778035682'],
  ['Crimson Veil Attar', 'crimsonattarveil.png?v=1776759687'],
  ['Desert Eclipse Attar', 'Desert_Eclipse.png?v=1776758821'],
  ['Glacial Instinct Attar', 'Glacial_Instinct_7d43d6ec-3434-4568-91b6-0b4d69172656.png?v=1776758821'],
  ['Golden Bloom Attar', 'Golden_Bloom_18afc6f4-0eee-4aab-9fa3-9cfc7374c7e9.png?v=1776758821'],
  ['Ivory Resonance Attar', 'Ivory_Resonance_6872c0f5-8907-4f4f-abb9-f434a6f76a46.png?v=1776758820'],
  ['Majestic Eclipse Attar', 'Majestic_Eclipse.png?v=1776758821'],
  ['Midnight Ruse Attar', '735383.png?v=1776794221'],
].map(([name, img]) => ({ cat: 'Attars', name, img: IMG + img, sizes: ATTAR_SIZES })));

CATALOG.forEach(p => { if (p.img) p.img += '&width=240'; });
