const express  = require('express');
const multer   = require('multer');
const { parse } = require('csv-parse/sync');
const fs       = require('fs');
const pool     = require('../db');
const router   = express.Router();

const upload = multer({ dest: 'uploads/' });

// ── Indian location keywords (used in SQL REGEXP) ─────────────────────────────
const INDIAN_REGEXP = [
  'india', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad',
  'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'surat',
  'lucknow', 'kanpur', 'nagpur', 'noida', 'gurgaon', 'gurugram',
  'chandigarh', 'bhopal', 'patna', 'indore', 'visakhapatnam',
  'vadodara', 'ludhiana', 'agra', 'nashik', 'rajkot', 'meerut',
  'coimbatore', 'kochi', 'cochin', 'bhubaneswar', 'dehradun',
].join('|');

// ── Resolve which tables to query ─────────────────────────────────────────────
function getTables(user) {
  if (user === 'garima') return ['garima'];
  if (user === 'lms')    return ['lms'];
  return ['garima', 'lms'];
}

// ── Build WHERE clause ────────────────────────────────────────────────────────
function buildWhere(filters) {
  const { search, location, contact, preference, company, designation } = filters;
  const conditions = [];
  const params     = [];

  // Search
  if (search && search.trim()) {
    const searchFields = [];
    const prefs = (preference || '').split(',').filter(Boolean);

    if (prefs.length === 0 || prefs.includes('name_only')) {
      searchFields.push('name LIKE ?');
      params.push(`%${search}%`);
    }
    if (prefs.length === 0 || prefs.includes('email_only')) {
      searchFields.push('email LIKE ?');
      params.push(`%${search}%`);
    }
    if (prefs.length === 0 || prefs.includes('current')) {
      searchFields.push('current_company_1 LIKE ?', 'current_designation_1 LIKE ?');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (prefs.length === 0 || prefs.includes('previous')) {
      ['1','2','3','4','5'].forEach(n => {
        searchFields.push(`previous_company_${n} LIKE ?`);
        params.push(`%${search}%`);
      });
    }
    if (searchFields.length) conditions.push(`(${searchFields.join(' OR ')})`);
  }

  // Company advanced filter
  if (company && company.trim()) {
    conditions.push(`(current_company_1 LIKE ? OR current_company_2 LIKE ?)`);
    params.push(`%${company}%`, `%${company}%`);
  }

  // Designation advanced filter
  if (designation && designation.trim()) {
    conditions.push(`(current_designation_1 LIKE ? OR current_designation_2 LIKE ?)`);
    params.push(`%${designation}%`, `%${designation}%`);
  }

  // Contact filter
  if (contact === 'with_email')    conditions.push(`(email != '' AND email IS NOT NULL)`);
  if (contact === 'without_email') conditions.push(`(email = '' OR email IS NULL)`);
  if (contact === 'with_phone')    conditions.push(`(phone != '' AND phone IS NOT NULL)`);
  if (contact === 'without_phone') conditions.push(`(phone = '' OR phone IS NULL)`);

  // Location filter — IN SQL (not in memory)
  if (location === 'indian') {
    conditions.push(`(current_location_1 REGEXP ? OR current_location_2 REGEXP ?)`);
    params.push(INDIAN_REGEXP, INDIAN_REGEXP);
  } else if (location === 'non_indian') {
    conditions.push(`(
      (current_location_1 != '' AND current_location_1 IS NOT NULL AND current_location_1 NOT REGEXP ?)
      OR
      (current_location_1 = '' AND current_location_2 != '' AND current_location_2 NOT REGEXP ?)
    )`);
    params.push(INDIAN_REGEXP, INDIAN_REGEXP);
  }

  // Preference filter
  if (preference) {
    const prefs = preference.split(',').filter(Boolean);
    if (prefs.includes('name_only'))
      conditions.push(`(name != '' AND name IS NOT NULL)`);
    if (prefs.includes('email_only'))
      conditions.push(`(email != '' AND email IS NOT NULL)`);
    if (prefs.includes('current'))
      conditions.push(`(current_company_1 != '' AND current_company_1 IS NOT NULL)`);
    if (prefs.includes('previous'))
      conditions.push(`(previous_company_1 != '' AND previous_company_1 IS NOT NULL)`);
  }

  const whereStr = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereStr, params };
}

// ── CSV columns ───────────────────────────────────────────────────────────────
const ALL_COLUMNS = [
  'name','email','phone','linkedin','website',
  'current_company_1','current_designation_1','current_duration_1','current_location_1',
  'current_company_2','current_designation_2','current_duration_2','current_location_2',
  'previous_company_1','previous_designation_1','previous_duration_1','previous_location_1',
  'previous_company_2','previous_designation_2','previous_duration_2','previous_location_2',
  'previous_company_3','previous_designation_3','previous_duration_3','previous_location_3',
  'previous_company_4','previous_designation_4','previous_duration_4','previous_location_4',
  'previous_company_5','previous_designation_5','previous_duration_5','previous_location_5',
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(row, source) {
  const values = ALL_COLUMNS.map(col => escapeCSV(row[col]));
  values.push(escapeCSV(source)); // Source column
  return values.join(',');
}

// ── GET /api/contacts ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      user        = 'all',
      search      = '',
      location    = 'all',
      contact     = 'all',
      preference  = '',
      company     = '',
      designation = '',
      page        = 1,
      limit       = 25,
    } = req.query;

    const tables  = getTables(user);
    const offset  = (parseInt(page) - 1) * parseInt(limit);
    const { whereStr, params } = buildWhere({ search, location, contact, preference, company, designation });

    let rows  = [];
    let total = 0;

    if (tables.length === 1) {
      const table = tables[0];
      const [[countRow]] = await pool.query(`SELECT COUNT(*) as cnt FROM ${table} ${whereStr}`, params);
      const [dataRows]   = await pool.query(
        `SELECT *, '${table}' as source_user FROM ${table} ${whereStr} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );
      total = countRow.cnt;
      rows  = dataRows;
    } else {
      // UNION both tables
      const countSql = `
        SELECT SUM(cnt) as total FROM (
          SELECT COUNT(*) as cnt FROM garima ${whereStr}
          UNION ALL
          SELECT COUNT(*) as cnt FROM lms ${whereStr}
        ) t
      `;
      const [[totalRow]] = await pool.query(countSql, [...params, ...params]);
      total = totalRow.total || 0;

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
          COUNT(*)                                                AS total,
          SUM(email    != '' AND email    IS NOT NULL)            AS withEmail,
          SUM(phone    != '' AND phone    IS NOT NULL)            AS withPhone,
          SUM(linkedin != '' AND linkedin IS NOT NULL)            AS withLinkedin
        FROM ${table}
      `);
      stats.total        += parseInt(row.total        || 0);
      stats.withEmail    += parseInt(row.withEmail    || 0);
      stats.withPhone    += parseInt(row.withPhone    || 0);
      stats.withLinkedin += parseInt(row.withLinkedin || 0);
    }

    res.json(stats);
  } catch (err) {
    console.error('GET /stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/contacts/download ────────────────────────────────────────────────
// Downloads ALL matching contacts as CSV (no pagination)
router.get('/download', async (req, res) => {
  try {
    const {
      user        = 'all',
      search      = '',
      location    = 'all',
      contact     = 'all',
      preference  = '',
      company     = '',
      designation = '',
    } = req.query;

    const tables = getTables(user);
    const { whereStr, params } = buildWhere({ search, location, contact, preference, company, designation });

    let rows = [];

    if (tables.length === 1) {
      const table = tables[0];
      const [dataRows] = await pool.query(
        `SELECT * FROM ${table} ${whereStr} ORDER BY id DESC`,
        params
      );
      rows = dataRows.map(r => ({ ...r, _source: table }));
    } else {
      const unionSql = `
        (SELECT *, 'garima' as _source FROM garima ${whereStr})
        UNION ALL
        (SELECT *, 'lms' as _source FROM lms ${whereStr})
        ORDER BY id DESC
      `;
      const [unionRows] = await pool.query(unionSql, [...params, ...params]);
      rows = unionRows;
    }

    // Build CSV
    const csvHeader = [...ALL_COLUMNS, 'Source'].join(',');
    const csvLines  = rows.map(row => rowToCSV(row, row._source || row.source_user || ''));
    const csvContent = [csvHeader, ...csvLines].join('\n');

    // Generate filename with timestamp
    const now      = new Date();
    const dateStr  = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const userPart = user === 'all' ? 'all' : user;
    const filename = `linkedin_contacts_${userPart}_${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (err) {
    console.error('GET /contacts/download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/contacts/:table/:id ──────────────────────────────────────────────
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

    const allowed = [...ALL_COLUMNS];
    const updates = {};
    allowed.forEach(col => { if (req.body[col] !== undefined) updates[col] = req.body[col]; });

    if (!Object.keys(updates).length)
      return res.status(400).json({ error: 'No valid fields to update' });

    const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...Object.values(updates), id]);
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

    const cols   = ['name','email','phone','linkedin','website','current_company_1','current_designation_1','current_duration_1','current_location_1'];
    const values = cols.map(c => fields[c] || '');
    const [result] = await pool.query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      values
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

    const sql = `INSERT IGNORE INTO ${table} (${ALL_COLUMNS.join(', ')}) VALUES (${ALL_COLUMNS.map(() => '?').join(', ')})`;
    let inserted = 0;
    for (const row of records) {
      const values = ALL_COLUMNS.map(c => (row[c] || '').trim());
      await pool.query(sql, values);
      inserted++;
    }
    res.json({ success: true, inserted });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
