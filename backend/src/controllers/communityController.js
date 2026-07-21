const { query } = require('../config/db');
const { createUserNotification } = require('../services/notificationService');

// Get all academic communities
async function getAllCommunities(req, res) {
  try {
    const userId = req.user.id;
    // Get all communities and flag if user is a member
    const sql = `
      SELECT ac.*, 
             u.full_name as creator_name,
             (SELECT COUNT(*)::int FROM community_members WHERE community_id = ac.id) as member_count,
             EXISTS(SELECT 1 FROM community_members WHERE community_id = ac.id AND user_id = $1) as is_member
      FROM academic_communities ac
      LEFT JOIN users u ON ac.created_by = u.id
      ORDER BY ac.name ASC
    `;
    const result = await query(sql, [userId]);
    return res.status(200).json({ communities: result.rows });
  } catch (error) {
    console.error('Fetch communities error:', error);
    return res.status(500).json({ message: 'Internal server error fetching communities.' });
  }
}

// Get single community details
async function getCommunityById(req, res) {
  try {
    const userId = req.user.id;
    const communityId = parseInt(req.params.id);

    const communitySql = `
      SELECT ac.*, u.full_name as creator_name,
             EXISTS(SELECT 1 FROM community_members WHERE community_id = ac.id AND user_id = $1) as is_member
      FROM academic_communities ac
      LEFT JOIN users u ON ac.created_by = u.id
      WHERE ac.id = $2
    `;
    const result = await query(communitySql, [userId, communityId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Community not found.' });
    }

    // Fetch members
    const membersSql = `
      SELECT u.id, u.full_name, u.email, u.role, u.avatar_url
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = $1
      ORDER BY u.full_name ASC
    `;
    const membersRes = await query(membersSql, [communityId]);

    return res.status(200).json({
      community: result.rows[0],
      members: membersRes.rows
    });
  } catch (error) {
    console.error('Fetch community details error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Create community
async function createCommunity(req, res) {
  try {
    const { name, description, category, isInstitutional } = req.body;
    const userId = req.user.id;
    const institutionId = isInstitutional ? req.user.institution_id : null;

    if (!name || !category) {
      return res.status(400).json({ message: 'Community name and category are required.' });
    }

    // Check unique name
    const checkName = await query('SELECT id FROM academic_communities WHERE name = $1', [name]);
    if (checkName.rowCount > 0) {
      return res.status(400).json({ message: 'A community with this name already exists.' });
    }

    const insertSql = `
      INSERT INTO academic_communities (name, description, category, created_by, institution_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await query(insertSql, [name, description || '', category, userId, institutionId]);
    const community = result.rows[0];

    // Creator automatically joins community
    await query('INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)', [community.id, userId]);

    return res.status(201).json({
      message: 'Community created successfully',
      community
    });
  } catch (error) {
    console.error('Create community error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Join / Leave community toggle
async function toggleJoinCommunity(req, res) {
  try {
    const userId = req.user.id;
    const communityId = parseInt(req.params.id);

    const checkComm = await query('SELECT name FROM academic_communities WHERE id = $1', [communityId]);
    if (checkComm.rowCount === 0) {
      return res.status(404).json({ message: 'Community not found.' });
    }

    const memberCheck = await query(
      'SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2',
      [communityId, userId]
    );

    if (memberCheck.rowCount > 0) {
      // Leave
      await query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
      return res.status(200).json({ message: 'Left community successfully', isMember: false });
    } else {
      // Join
      await query('INSERT INTO community_members (community_id, user_id) VALUES ($1, $2)', [communityId, userId]);
      return res.status(200).json({ message: 'Joined community successfully', isMember: true });
    }
  } catch (error) {
    console.error('Join/Leave community error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Get Community Posts
async function getCommunityPosts(req, res) {
  try {
    const userId = req.user.id;
    const communityId = parseInt(req.params.communityId);

    const postsSql = `
      SELECT p.*, 
             u.full_name as author_name, 
             u.avatar_url as author_avatar,
             u.role as author_role,
             (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) as comment_count,
             (SELECT COUNT(*)::int FROM likes WHERE post_id = p.id) as like_count,
             EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.community_id = $2
      ORDER BY p.created_at DESC
    `;
    const result = await query(postsSql, [userId, communityId]);
    return res.status(200).json({ posts: result.rows });
  } catch (error) {
    console.error('Fetch posts error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Create Post
async function createPost(req, res) {
  try {
    const { title, content } = req.body;
    const communityId = parseInt(req.params.communityId);
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    // Verify membership
    const checkMem = await query('SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, userId]);
    if (checkMem.rowCount === 0) {
      return res.status(403).json({ message: 'Must be a community member to create posts.' });
    }

    const insertSql = `
      INSERT INTO posts (title, content, user_id, community_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const postRes = await query(insertSql, [title, content, userId, communityId]);
    const post = postRes.rows[0];

    // Fetch author details to append immediately in front-end
    const authorRes = await query('SELECT full_name, avatar_url, role FROM users WHERE id = $1', [userId]);
    post.author_name = authorRes.rows[0].full_name;
    post.author_avatar = authorRes.rows[0].avatar_url;
    post.author_role = authorRes.rows[0].role;
    post.comment_count = 0;
    post.like_count = 0;
    post.is_liked = false;

    // Send notifications to other community members in background
    const membersRes = await query('SELECT user_id FROM community_members WHERE community_id = $1 AND user_id != $2', [communityId, userId]);
    const communityNameRes = await query('SELECT name FROM academic_communities WHERE id = $1', [communityId]);
    const commName = communityNameRes.rows[0]?.name || 'Community';
    
    for (const row of membersRes.rows) {
      createUserNotification({
        userId: row.user_id,
        title: `New Post in ${commName}`,
        content: `${req.user.full_name} posted: "${title}"`,
        type: 'community',
        link: `/communities/${communityId}`
      });
    }

    return res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Like / Unlike Post toggle
async function toggleLikePost(req, res) {
  try {
    const userId = req.user.id;
    const postId = parseInt(req.params.postId);

    const postQuery = await query('SELECT user_id, title, community_id FROM posts WHERE id = $1', [postId]);
    if (postQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    const post = postQuery.rows[0];

    const likeCheck = await query('SELECT 1 FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);

    if (likeCheck.rowCount > 0) {
      // Unlike
      await query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
      return res.status(200).json({ message: 'Unliked post', isLiked: false });
    } else {
      // Like
      await query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
      
      // Notify author
      if (post.user_id !== userId) {
        createUserNotification({
          userId: post.user_id,
          title: 'Post Liked',
          content: `${req.user.full_name} liked your post "${post.title}"`,
          type: 'community',
          link: `/communities/${post.community_id}`
        });
      }
      return res.status(200).json({ message: 'Liked post', isLiked: true });
    }
  } catch (error) {
    console.error('Like toggle error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Get comments for post
async function getPostComments(req, res) {
  try {
    const postId = parseInt(req.params.postId);
    const sql = `
      SELECT c.*, u.full_name as author_name, u.avatar_url as author_avatar, u.role as author_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `;
    const result = await query(sql, [postId]);
    return res.status(200).json({ comments: result.rows });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Add Comment
async function addComment(req, res) {
  try {
    const { content } = req.body;
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required.' });
    }

    const postQuery = await query('SELECT user_id, title, community_id FROM posts WHERE id = $1', [postId]);
    if (postQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found.' });
    }
    const post = postQuery.rows[0];

    const insertSql = `
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const commentRes = await query(insertSql, [postId, userId, content]);
    const comment = commentRes.rows[0];

    // Fetch author details
    const authorRes = await query('SELECT full_name, avatar_url, role FROM users WHERE id = $1', [userId]);
    comment.author_name = authorRes.rows[0].full_name;
    comment.author_avatar = authorRes.rows[0].avatar_url;
    comment.author_role = authorRes.rows[0].role;

    // Notify author
    if (post.user_id !== userId) {
      createUserNotification({
        userId: post.user_id,
        title: 'New Comment',
        content: `${req.user.full_name} commented on your post "${post.title}"`,
        type: 'community',
        link: `/communities/${post.community_id}`
      });
    }

    return res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

// Delete Post
async function deletePost(req, res) {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.id;
    const userRole = req.user.role;

    const postQuery = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);
    if (postQuery.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Only creator or admin can delete
    if (postQuery.rows[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this post.' });
    }

    await query('DELETE FROM posts WHERE id = $1', [postId]);
    return res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  toggleJoinCommunity,
  getCommunityPosts,
  createPost,
  toggleLikePost,
  getPostComments,
  addComment,
  deletePost,
};
