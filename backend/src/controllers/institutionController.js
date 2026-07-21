const { query } = require('../config/db');

// Get all institutions
async function getAllInstitutions(req, res) {
  try {
    const result = await query('SELECT * FROM institutions ORDER BY name ASC');
    return res.status(200).json({ institutions: result.rows });
  } catch (error) {
    console.error('Fetch institutions error:', error);
    return res.status(500).json({ message: 'Internal server error fetching institutions.' });
  }
}

// Get departments for a specific institution
async function getDepartmentsByInstitution(req, res) {
  try {
    const { institutionId } = req.params;
    if (!institutionId) {
      return res.status(400).json({ message: 'Institution ID is required.' });
    }

    const result = await query(
      'SELECT * FROM departments WHERE institution_id = $1 ORDER BY name ASC',
      [parseInt(institutionId)]
    );
    return res.status(200).json({ departments: result.rows });
  } catch (error) {
    console.error('Fetch departments error:', error);
    return res.status(500).json({ message: 'Internal server error fetching departments.' });
  }
}

module.exports = {
  getAllInstitutions,
  getDepartmentsByInstitution,
};
