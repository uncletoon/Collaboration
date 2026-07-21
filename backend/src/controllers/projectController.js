const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { createUserNotification } = require('../services/notificationService');

// Get projects for current user
async function getUserProjects(req, res) {
  try {
    const userId = req.user.id;
    
    // Get all projects where the user is a member, or that they created
    const sql = `
      SELECT DISTINCT p.*, pm.role as user_role,
             u.full_name as creator_name,
             (SELECT COUNT(*)::int FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE pm.user_id = $1 OR p.created_by = $1
      ORDER BY p.created_at DESC
    `;
    const result = await query(sql, [userId]);
    return res.status(200).json({ projects: result.rows });
  } catch (error) {
    console.error('Fetch user projects error:', error);
    return res.status(500).json({ message: 'Internal server error fetching projects.' });
  }
}

// Get single project details
async function getProjectById(req, res) {
  try {
    const userId = req.user.id;
    const projectId = parseInt(req.params.id);

    // Validate access
    const checkAccess = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    const checkCreator = await query('SELECT created_by FROM projects WHERE id = $1', [projectId]);

    if (checkCreator.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (checkAccess.rowCount === 0 && checkCreator.rows[0].created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You are not a member of this project.' });
    }

    // Fetch details
    const detailsSql = `
      SELECT p.*, u.full_name as creator_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `;
    const detailsRes = await query(detailsSql, [projectId]);

    // Fetch members
    const membersSql = `
      SELECT u.id, u.full_name, u.email, u.role as user_role, u.avatar_url, pm.role as project_role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY u.full_name ASC
    `;
    const membersRes = await query(membersSql, [projectId]);

    // Fetch files
    const filesSql = `
      SELECT pf.*, u.full_name as uploaded_by_name
      FROM project_files pf
      LEFT JOIN users u ON pf.uploaded_by = u.id
      WHERE pf.project_id = $1
      ORDER BY pf.uploaded_at DESC
    `;
    const filesRes = await query(filesSql, [projectId]);

    return res.status(200).json({
      project: detailsRes.rows[0],
      members: membersRes.rows,
      files: filesRes.rows
    });
  } catch (error) {
    console.error('Fetch project details error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Create project
async function createProject(req, res) {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: 'Project title is required.' });
    }

    const insertSql = `
      INSERT INTO projects (title, description, created_by, status)
      VALUES ($1, $2, $3, 'planning')
      RETURNING *
    `;
    const result = await query(insertSql, [title, description || '', userId]);
    const project = result.rows[0];

    // Add creator as lead member
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, userId, 'lead']
    );

    return res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Add member to project
async function addProjectMember(req, res) {
  try {
    const projectId = parseInt(req.params.id);
    const { targetUserId, projectRole } = req.body; // projectRole: lead, contributor, observer
    const userId = req.user.id;

    if (!targetUserId || !projectRole) {
      return res.status(400).json({ message: 'User ID and project role are required.' });
    }

    // Verify current user is project Lead
    const verifyLead = await query(
      "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'lead'",
      [projectId, userId]
    );
    if (verifyLead.rowCount === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only the project lead can invite members.' });
    }

    // Verify user is not already a member
    const checkMember = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, parseInt(targetUserId)]
    );
    if (checkMember.rowCount > 0) {
      return res.status(400).json({ message: 'User is already a member of this project.' });
    }

    // Insert member
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, parseInt(targetUserId), projectRole]
    );

    const projectQuery = await query('SELECT title FROM projects WHERE id = $1', [projectId]);
    const projectTitle = projectQuery.rows[0].title;

    // Send real-time notification
    createUserNotification({
      userId: parseInt(targetUserId),
      title: 'Project Invitation',
      content: `You have been added as a ${projectRole} to project "${projectTitle}"`,
      type: 'project',
      link: `/projects/${projectId}`
    });

    return res.status(200).json({ message: 'Member added successfully.' });
  } catch (error) {
    console.error('Add project member error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Remove member
async function removeProjectMember(req, res) {
  try {
    const projectId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.memberId);
    const userId = req.user.id;

    // Verify current user is project Lead
    const verifyLead = await query(
      "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'lead'",
      [projectId, userId]
    );
    if (verifyLead.rowCount === 0 && req.user.role !== 'admin' && userId !== targetUserId) {
      return res.status(403).json({ message: 'Forbidden: You do not have permissions to remove members.' });
    }

    await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, targetUserId]);

    return res.status(200).json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Upload file to project
async function uploadProjectFile(req, res) {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Verify access
    const checkMember = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    if (checkMember.rowCount === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You must be a project member to upload files.' });
    }

    const filename = req.file.originalname;
    const filepath = `/uploads/projects/${req.file.filename}`;

    const insertSql = `
      INSERT INTO project_files (project_id, filename, filepath, uploaded_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await query(insertSql, [projectId, filename, filepath, userId]);
    const newFile = result.rows[0];

    const projectQuery = await query('SELECT title FROM projects WHERE id = $1', [projectId]);
    const projectTitle = projectQuery.rows[0].title;

    // Notify other members
    const membersRes = await query('SELECT user_id FROM project_members WHERE project_id = $1 AND user_id != $2', [projectId, userId]);
    for (const row of membersRes.rows) {
      createUserNotification({
        userId: row.user_id,
        title: 'Project File Uploaded',
        content: `New file "${filename}" uploaded in project "${projectTitle}"`,
        type: 'project',
        link: `/projects/${projectId}`
      });
    }

    return res.status(201).json({ message: 'File uploaded successfully', file: newFile });
  } catch (error) {
    console.error('Project file upload error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Delete file
async function deleteProjectFile(req, res) {
  try {
    const projectId = parseInt(req.params.id);
    const fileId = parseInt(req.params.fileId);
    const userId = req.user.id;

    // Verify access
    const fileQuery = await query('SELECT * FROM project_files WHERE id = $1 AND project_id = $2', [fileId, projectId]);
    if (fileQuery.rowCount === 0) {
      return res.status(404).json({ message: 'File not found.' });
    }
    const file = fileQuery.rows[0];

    // Only owner of file, project lead, or admin can delete
    const checkLead = await query(
      "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'lead'",
      [projectId, userId]
    );

    if (file.uploaded_by !== userId && checkLead.rowCount === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this file.' });
    }

    // Delete physically from disk
    const absolutePath = path.join(__dirname, '..', '..', file.filepath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    // Delete metadata from DB
    await query('DELETE FROM project_files WHERE id = $1', [fileId]);

    return res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Delete project file error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Update project details (lead or admin only)
async function updateProject(req, res) {
  try {
    const projectId = parseInt(req.params.id);
    const { title, description, status } = req.body;
    const userId = req.user.id;

    const checkLead = await query(
      "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND role = 'lead'",
      [projectId, userId]
    );
    if (checkLead.rowCount === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only the project lead can update status.' });
    }

    const currentProject = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (currentProject.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    const curr = currentProject.rows[0];

    const updatedTitle = title || curr.title;
    const updatedDesc = description !== undefined ? description : curr.description;
    const updatedStatus = status || curr.status;

    const updateSql = `
      UPDATE projects
      SET title = $1, description = $2, status = $3
      WHERE id = $4
      RETURNING *
    `;
    const result = await query(updateSql, [updatedTitle, updatedDesc, updatedStatus, projectId]);

    return res.status(200).json({ message: 'Project updated successfully', project: result.rows[0] });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  getUserProjects,
  getProjectById,
  createProject,
  addProjectMember,
  removeProjectMember,
  uploadProjectFile,
  deleteProjectFile,
  updateProject,
};
