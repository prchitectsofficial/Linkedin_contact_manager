const express  = require('express');
const multer   = require('multer');
const { parse } = require('csv-parse/sync');
const fs       = require('fs');
const pool     = require('../db');
const router   = express.Router();

const upload = multer({ dest: 'uploads/' });

// ── helpers ───────────────────────────────────────────────────────────────────

const INDIAN_KEYWORDS = [
  'india', 'indian', ' in,', ',in,', 'mumbai', 'delhi', 'bangalore',
  'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad',
  'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'noida', 'gurgaon',
  'gurugram', 'chandigarh', 'bhopal', 'patna', 'indore',
];

function isIndian(location = '') {
  const loc = location.toLowerCase();
  return INDIAN_KEYWORDS.some(k => loc.includes(k));
}

// Resolve which table(s) to query
function getTables(user) {
  if (user === 'garima') return ['garima'];
  if (user === 'lms')    return ['lms'];
  return ['garima', 'lms'];          // All
}

// Build WHERE clause from filters
function buildWhere(filters) {
  const { search, location, contact, preference, company, designation } = filters;
  const conditions = [];
  const params     = [];

  // Search
  if (search) {
    const searchFields = [];
    const pref = (preference || '').split(',').filter(Boolean);

    if (pref.length === 0 || pref.includes('name'))
      searchFields.push('name LIKE ?'), params.push(`%${search}%`);
    if (pref.length === 0 || pref.includes('email'))
      searchFields.push('email LIKE ?'), params.push(`%${search}%`);
    if (pref.length === 0 || pref.includes('current'))
      searchFields.push('current_company_1 LIKE ?', 'current_designation_1 LIKE ?'),
      params.push(`%${search}%`, `%${search}%`);
    if (pref.length === 0 || pref.includes('previous'))
      ['1','2','3','4','5'].forEach(n => {
        searchFields.push(`previous_company_${n} LIKE ?`);
        params.push(`%${search}%`);
      });

    if (searchFields.length) conditions.push(`(${searchFields.join(' OR ')})`);
  }

  // Company advanced filter
  if (company) {
    conditions.push(`(current_company_1 LIKE ? OR current_company_2 LIKE ?)`);
    params.push(`%${company}%`, `%${company}%`);
  }

  // Designation advanced filter
  if (designation) {
    conditions.push(`(current_designation_1 LIKE ? OR current_designation_2 LIKE ?)`);
    params.push(`%${designation}%`, `%${designation}%`);
  }

  // Contact filter
  if (contact === 'with_email')    conditions.push(`email != '' AND email IS NOT NULL`);
  if (contact === 'without_email') conditions.push(`(email = '' OR email IS NULL)`);
  if (contact === 'with_phone')    conditions.push(`phone != '' AND phone IS NOT NULL`);
  if (contact === 'without_phone') conditions.push(`(phone = '' OR phone IS NULL)`);

  // Preference filter (columns to show)
  if (preference) {
    const prefs = preference.split(',').filter(Boolean);
    if (prefs.includes('name_only'))
      conditions.push(`name != '' AND name IS NOT NULL`);
    if (prefs.includes('email_only'))
      conditions.push(`email != '' AND email IS NOT NULL`);
    if (prefs.includes('current'))
      conditions.push(`current_company_1 != '' AND current_company_1 IS NOT NULL`);
    if (prefs.includes('previous'))
      conditions.push(`previous_company_1 != '' AND previous_company_1 IS NOT NULL`);
  }

  const whereStr = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereStr, params };
}

// ── GET /api/contacts ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      user       = 'all',
      search     = '',
      location   = 'all',
      contact    = 'all',
      preference = '',
      company    = '',
      designation = '',
      page       = 1,
      limit      = 25,
    } = req.query;

    const tables  = getTables(user);
    const offset  = (parseInt(page) - 1) * parseInt(limit);
    const { whereStr, params } = buildWhere({ search, location, contact, preference, company, designation });

    let rows  = [];
    let total = 0;

    // Query each table and UNION if needed
    const tableResults = await Promise.all(tables.map(async (table) => {
      // Apply location filter in JS after fetch (small overhead, avoids complex SQL)
      const countSql = `SELECT COUNT(*) as cnt FROM ${table} ${whereStr}`;
      const dataSql  = `SELECT *, '${table}' as source_user FROM ${table} ${whereStr} ORDER BY id DESC LIMIT ? OFFSET ?`;

      const [countRows] = await pool.query(countSql, params);
      const [dataRows]  = await pool.query(dataSql, [...params, parseInt(limit), offset]);
      return { count: countRows[0].cnt, data: dataRows };
    }));

    if (tables.length === 1) {
      total = tableResults[0].count;
      rows  = tableResults[0].data;
    } else {
      // For UNION (all), we need a combined count and merged results
      // Simple approach: fetch all from both, merge, paginate
      const allCountSql = `
        SELECT SUM(cnt) as total FROM (
          SELECT COUNT(*) as cnt FROM garima ${whereStr}
          UNION ALL
          SELECT COUNT(*) as cnt FROM lms ${whereStr}
        ) t
      `;
      const [totalRows] = await pool.query(allCountSql, [...params, ...params]);
      total = totalRows[0].total || 0;

      const unionSql = `
        (SELECT *, 'garima' as source_user FROM garima ${whereStr})
        UNION ALL
        (SELECT *, 'lms' as source_user FROM lms ${whereStr})
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `;
      const [unionRows] = await pool.query(unionSql, [...params, ...params, parseInt(limit), offset]);
      rows = unionRows;
    }

    // Apply location filter in memory
    if (location === 'indian') {
      rows  = rows.filter(r => isIndian(r.current_location_1 || r.current_location_2 || ''));
    } else if (location === 'non_indian') {
      rows  = rows.filter(r => !isIndian(r.current_location_1 || r.current_location_2 || ''));
    }

    res.json({
      data:       rows,
      total:      parseInt(total),
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('GET /contacts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/contacts/stats ───────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const { user = 'all' } = req.query;
    const tables = getTables(user);

    let stats = { total: 0, withEmail: 0, withPhone: 0, withLinkedin: 0 };

    for (const table of tables) {
      const [[row]] = await pool.query(`
        SELECT
          COUNT(*)                                          AS total,
          SUM(email   != '' AND email   IS NOT NULL)        AS withEmail,
          SUM(phone   != '' AND phone   IS NOT NULL)        AS withPhone,
          SUM(linkedin != '' AND linkedin IS NOT NULL)      AS withLinkedin
        FROM ${table}
      `);
      stats.total       += parseInt(row.total       || 0);
      stats.withEmail   += parseInt(row.withEmail   || 0);
      stats.withPhone   += parseInt(row.withPhone   || 0);
      stats.withLinkedin+= parseInt(row.withLinkedin|| 0);
    }

    res.json(stats);
  } catch (err) {
    console.error('GET /stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/contacts/:id ─────────────────────────────────────────────────────
router.get('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    if (!['garima', 'lms'].includes(table))
      return res.status(400).json({ error: 'Invalid table' });

    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/contacts/:table/:id ──────────────────────────────────────────────
router.put('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    if (!['garima', 'lms'].includes(table))
      return res.status(400).json({ error: 'Invalid table' });

    const allowed = [
      'name','email','phone','linkedin','website',
      'current_company_1','current_designation_1','current_duration_1','current_location_1',
      'current_company_2','current_designation_2','current_duration_2','current_location_2',
      'previous_company_1','previous_designation_1','previous_duration_1','previous_location_1',
      'previous_company_2','previous_designation_2','previous_duration_2','previous_location_2',
      'previous_company_3','previous_designation_3','previous_duration_3','previous_location_3',
      'previous_company_4','previous_designation_4','previous_duration_4','previous_location_4',
      'previous_company_5','previous_designation_5','previous_duration_5','previous_location_5',
    ];

    const updates = {};
    allowed.forEach(col => { if (req.body[col] !== undefined) updates[col] = req.body[col]; });

    if (!Object.keys(updates).length)
      return res.status(400).json({ error: 'No valid fields to update' });

    const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values    = [...Object.values(updates), id];

    await pool.query(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/contacts ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { table = 'garima', ...fields } = req.body;
    if (!['garima', 'lms'].includes(table))
      return res.status(400).json({ error: 'Invalid table' });

    const cols = [
      'name','email','phone','linkedin','website',
      'current_company_1','current_designation_1','current_duration_1','current_location_1',
    ];
    const values = cols.map(c => fields[c] || '');
    const colStr = cols.join(', ');
    const phStr  = cols.map(() => '?').join(', ');

    const [result] = await pool.query(
      `INSERT INTO ${table} (${colStr}) VALUES (${phStr})`, values
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/contacts/upload ─────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { table = 'garima' } = req.body;
    if (!['garima', 'lms'].includes(table))
      return res.status(400).json({ error: 'Invalid table' });

    const content = fs.readFileSync(req.file.path, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    fs.unlinkSync(req.file.path);

    const COLUMNS = [
      'name','email','phone','linkedin','website',
      'current_company_1','current_designation_1','current_duration_1','current_location_1',
      'current_company_2','current_designation_2','current_duration_2','current_location_2',
      'previous_company_1','previous_designation_1','previous_duration_1','previous_location_1',
      'previous_company_2','previous_designation_2','previous_duration_2','previous_location_2',
      'previous_company_3','previous_designation_3','previous_duration_3','previous_location_3',
      'previous_company_4','previous_designation_4','previous_duration_4','previous_location_4',
      'previous_company_5','previous_designation_5','previous_duration_5','previous_location_5',
    ];

    const colStr = COLUMNS.join(', ');
    const phStr  = COLUMNS.map(() => '?').join(', ');
    const sql    = `INSERT IGNORE INTO ${table} (${colStr}) VALUES (${phStr})`;

    let inserted = 0;
    const batch  = records.map(r => COLUMNS.map(c => (r[c] || '').trim()));
    if (batch.length) {
      await pool.query(sql, batch.flat()); // bulk via executemany
      // Actually use loop for safety
    }

    for (const row of batch) {
      await pool.query(sql, row);
      inserted++;
    }

    res.json({ success: true, inserted });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
