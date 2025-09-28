const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user's joined groups
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('joinedGroups', 'name description inviteCode createdBy members');
    res.json(user.joinedGroups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const inviteCode = await Group.generateInviteCode();

    const group = new Group({
      name: name.trim(),
      description: description ? description.trim() : '',
      inviteCode,
      createdBy: req.user.id,
      members: [req.user.id]
    });

    await group.save();

    // Add group to user's joinedGroups
    await User.findByIdAndUpdate(req.user.id, {
      $push: { joinedGroups: group._id }
    });

    await group.populate('members', 'name email');
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a group by invite code
router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.length !== 6) {
      return res.status(400).json({ message: 'Valid invite code is required' });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if user is already a member
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add user to group members
    group.members.push(req.user.id);
    await group.save();

    // Add group to user's joinedGroups
    await User.findByIdAndUpdate(req.user.id, {
      $push: { joinedGroups: group._id }
    });

    await group.populate('members', 'name email');
    res.json(group);
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group members
router.get('/:id/members', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email avatar');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(group.members);
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a group
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    // Remove user from group members
    group.members = group.members.filter(memberId => memberId.toString() !== req.user.id);

    // Remove group from user's joinedGroups
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { joinedGroups: group._id }
    });

    // If user's current group is this group, switch to personal
    const user = await User.findById(req.user.id);
    if (user.currentGroup === group._id.toString()) {
      user.currentGroup = 'personal';
      await user.save();
    }

    // If no members left, delete the group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(group._id);
      res.json({ message: 'Left group successfully. Group was deleted as it had no remaining members.' });
    } else {
      await group.save();
      res.json({ message: 'Left group successfully' });
    }
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Switch current group
router.put('/switch', auth, async (req, res) => {
  try {
    const { groupId } = req.body;

    // Validate groupId (can be 'personal' or a valid group ObjectId)
    if (groupId !== 'personal') {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      // Check if user is a member
      if (!group.members.includes(req.user.id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Update user's current group
    await User.findByIdAndUpdate(req.user.id, {
      currentGroup: groupId
    });

    res.json({ message: 'Switched group successfully', currentGroup: groupId });
  } catch (error) {
    console.error('Error switching group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
