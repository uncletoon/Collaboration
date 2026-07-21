const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { createUserNotification } = require('../services/notificationService');

// Get all research documents
async function getAllResearch(req, res) {
  try {
    const sql = `
      SELECT rr.*, 
             u.full_name as uploader_name,
             i.name as institution_name
      FROM research_repository rr
      LEFT JOIN users u ON rr.uploaded_by = u.id
      LEFT JOIN institutions i ON rr.institution_id = i.id
      ORDER BY rr.created_at DESC
    `;
    const result = await query(sql);
    return res.status(200).json({ papers: result.rows });
  } catch (error) {
    console.error('Fetch research papers error:', error);
    return res.status(500).json({ message: 'Internal server error fetching research repository.' });
  }
}

// Upload a research paper
async function uploadResearchPaper(req, res) {
  try {
    const { title, abstract, authors } = req.body;
    const userId = req.user.id;
    const institutionId = req.user.institution_id;

    if (!req.file) {
      return res.status(400).json({ message: 'No research document file was uploaded.' });
    }

    if (!title || !authors) {
      return res.status(400).json({ message: 'Title and authors list are required.' });
    }

    const filepath = `/uploads/research/${req.file.filename}`;

    const insertSql = `
      INSERT INTO research_repository (title, abstract, authors, filepath, uploaded_by, institution_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await query(insertSql, [
      title,
      abstract || '',
      authors,
      filepath,
      userId,
      institutionId
    ]);

    const paper = result.rows[0];

    // Notify other researchers/lecturers of same institution in background
    const notifySql = `
      SELECT id FROM users 
      WHERE institution_id = $1 AND role IN ('researcher', 'lecturer') AND id != $2
    `;
    const usersToNotify = await query(notifySql, [institutionId, userId]);

    for (const row of usersToNotify.rows) {
      createUserNotification({
        userId: row.id,
        title: 'New Institutional Research',
        content: `A new research paper "${title}" was published by authors: ${authors}`,
        type: 'research',
        link: `/research`
      });
    }

    return res.status(201).json({ message: 'Research paper published successfully', paper });
  } catch (error) {
    console.error('Research upload error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Download a research file
async function downloadResearchPaper(req, res) {
  try {
    const paperId = parseInt(req.params.id);

    const paperQuery = await query('SELECT title, filepath FROM research_repository WHERE id = $1', [paperId]);
    if (paperQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Research paper not found.' });
    }

    const paper = paperQuery.rows[0];
    const absolutePath = path.join(__dirname, '..', '..', paper.filepath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Physical file not found on server.' });
    }

    // Set header content disposition & send file download
    return res.download(absolutePath, path.basename(paper.filepath).substring(14)); // strips the unique suffix
  } catch (error) {
    console.error('Download paper error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Delete research publication (owner or admin only)
async function deleteResearchPaper(req, res) {
  try {
    const paperId = parseInt(req.params.id);
    const userId = req.user.id;

    const paperQuery = await query('SELECT * FROM research_repository WHERE id = $1', [paperId]);
    if (paperQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Research paper not found.' });
    }

    const paper = paperQuery.rows[0];

    if (paper.uploaded_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this research paper.' });
    }

    // Delete physically from disk
    const absolutePath = path.join(__dirname, '..', '..', paper.filepath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    // Delete database record
    await query('DELETE FROM research_repository WHERE id = $1', [paperId]);

    return res.status(200).json({ message: 'Research paper deleted successfully.' });
  } catch (error) {
    console.error('Delete paper error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  getAllResearch,
  uploadResearchPaper,
  downloadResearchPaper,
  deleteResearchPaper,
};
