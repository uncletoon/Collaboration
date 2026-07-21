const { query } = require('../config/db');
const { sendNotification } = require('../config/socket');

// Create a user notification in database and trigger Socket.IO emit
async function createUserNotification({ userId, title, content, type, link }) {
  try {
    const insertQuery = `
      INSERT INTO notifications (user_id, title, content, type, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await query(insertQuery, [
      parseInt(userId),
      title,
      content,
      type,
      link || null
    ]);

    const notification = result.rows[0];

    // Broadcast through socket helper
    sendNotification(userId, notification);

    return notification;
  } catch (error) {
    console.error('Error creating user notification:', error);
  }
}

module.exports = {
  createUserNotification,
};
