const { query } = require('../config/db');
const { createUserNotification } = require('../services/notificationService');

// Get all events
async function getAllEvents(req, res) {
  try {
    const userId = req.user.id;
    const sql = `
      SELECT e.*, 
             u.full_name as organizer_name,
             i.name as institution_name,
             (SELECT COUNT(*)::int FROM event_registrations WHERE event_id = e.id) as registered_count,
             EXISTS(SELECT 1 FROM event_registrations WHERE event_id = e.id AND user_id = $1) as is_registered
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN institutions i ON e.institution_id = i.id
      ORDER BY e.event_date ASC
    `;
    const result = await query(sql, [userId]);
    return res.status(200).json({ events: result.rows });
  } catch (error) {
    console.error('Fetch events error:', error);
    return res.status(500).json({ message: 'Internal server error fetching events.' });
  }
}

// Get single event details
async function getEventById(req, res) {
  try {
    const userId = req.user.id;
    const eventId = parseInt(req.params.id);

    const eventSql = `
      SELECT e.*, 
             u.full_name as organizer_name,
             i.name as institution_name,
             (SELECT COUNT(*)::int FROM event_registrations WHERE event_id = e.id) as registered_count,
             EXISTS(SELECT 1 FROM event_registrations WHERE event_id = e.id AND user_id = $1) as is_registered
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN institutions i ON e.institution_id = i.id
      WHERE e.id = $2
    `;
    const eventRes = await query(eventSql, [userId, eventId]);
    if (eventRes.rowCount === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Fetch attendees
    const attendeesSql = `
      SELECT u.id, u.full_name, u.email, u.role, u.avatar_url, er.registered_at
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = $1
      ORDER BY er.registered_at ASC
    `;
    const attendeesRes = await query(attendeesSql, [eventId]);

    return res.status(200).json({
      event: eventRes.rows[0],
      attendees: attendeesRes.rows
    });
  } catch (error) {
    console.error('Fetch event details error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Create event (Lecturers, Researchers, Admins only)
async function createEvent(req, res) {
  try {
    const { title, description, eventDate, location, capacity, isInstitutional } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'student') {
      return res.status(403).json({ message: 'Forbidden: Students cannot organize events.' });
    }

    if (!title || !eventDate || !location) {
      return res.status(400).json({ message: 'Title, date, and location are required.' });
    }

    const institutionId = isInstitutional ? req.user.institution_id : null;

    const insertSql = `
      INSERT INTO events (title, description, event_date, location, organizer_id, institution_id, capacity)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await query(insertSql, [
      title,
      description || '',
      new Date(eventDate),
      location,
      userId,
      institutionId,
      capacity ? parseInt(capacity) : 100
    ]);
    const event = result.rows[0];

    // Fetch institution details if restricted
    let instName = 'All Institutions';
    if (institutionId) {
      const instQuery = await query('SELECT name FROM institutions WHERE id = $1', [institutionId]);
      instName = instQuery.rows[0]?.name || '';
    }

    // Broadcast notification to users in the same institution or all users
    const notifySql = institutionId 
      ? 'SELECT id FROM users WHERE institution_id = $1 AND id != $2'
      : 'SELECT id FROM users WHERE id != $1';
    
    const usersToNotify = institutionId 
      ? await query(notifySql, [institutionId, userId])
      : await query(notifySql, [userId]);

    for (const row of usersToNotify.rows) {
      createUserNotification({
        userId: row.id,
        title: 'New Academic Event',
        content: `A new event "${title}" was scheduled for ${new Date(eventDate).toLocaleDateString()} (${instName})`,
        type: 'event',
        link: `/events/${event.id}`
      });
    }

    return res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Register / Cancel registration toggle
async function toggleEventRegistration(req, res) {
  try {
    const userId = req.user.id;
    const eventId = parseInt(req.params.id);

    const eventQuery = await query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const event = eventQuery.rows[0];

    // Check institutional restriction
    if (event.institution_id && event.institution_id !== req.user.institution_id) {
      return res.status(403).json({ message: 'Forbidden: This event is restricted to members of the hosting institution.' });
    }

    const regCheck = await query(
      'SELECT 1 FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (regCheck.rowCount > 0) {
      // Cancel
      await query('DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
      return res.status(200).json({ message: 'Registration cancelled successfully', isRegistered: false });
    } else {
      // Register (Check capacity)
      const countRes = await query('SELECT COUNT(*)::int FROM event_registrations WHERE event_id = $1', [eventId]);
      const currentAttendees = countRes.rows[0].count;

      if (currentAttendees >= event.capacity) {
        return res.status(400).json({ message: 'Registration failed: Event is fully booked.' });
      }

      await query('INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2)', [eventId, userId]);
      
      // Notify organizer
      if (event.organizer_id && event.organizer_id !== userId) {
        createUserNotification({
          userId: event.organizer_id,
          title: 'Event Booking Update',
          content: `${req.user.full_name} registered for your event "${event.title}"`,
          type: 'event',
          link: `/events/${eventId}`
        });
      }

      return res.status(200).json({ message: 'Registered successfully', isRegistered: true });
    }
  } catch (error) {
    console.error('Toggle event registration error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Delete Event (Organizer or Admin only)
async function deleteEvent(req, res) {
  try {
    const eventId = parseInt(req.params.id);
    const userId = req.user.id;

    const eventQuery = await query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
    if (eventQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    if (eventQuery.rows[0].organizer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only the organizer can delete this event.' });
    }

    await query('DELETE FROM events WHERE id = $1', [eventId]);
    return res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  toggleEventRegistration,
  deleteEvent,
};
