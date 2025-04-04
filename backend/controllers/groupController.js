const Group = require("../models/Group");
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const fs = require("fs");
const path = require("path");

/**
 * Create a new group
 */
exports.createGroup = catchAsync(async (req, res) => {
  try {
    console.log("Group creation request received:", req.body);
    console.log("User:", req.user);
    
    const { name, description, members } = req.body;
    const membersArray = JSON.parse(members);
    console.log("Parsed members:", membersArray);

    // Get the avatar path if file was uploaded
    let avatarPath = null;
    if (req.file) {
      avatarPath = req.file.path;
      console.log("Avatar uploaded:", avatarPath);
    }

    // Create new group
    const group = new Group({
      name,
      description,
      avatar: avatarPath,
      created_by: req.user._id,
      admins: [req.user._id],
      members: [
        { user: req.user._id, joined_at: new Date() },
        ...membersArray.map((memberId) => ({
          user: memberId,
          joined_at: new Date(),
        })),
      ],
    });

    console.log("Group object created:", group);

    await group.save();
    console.log("Group saved to database");

    // Populate the group with user details
    await group.populate([
      { path: "created_by", select: "firstName lastName avatar" },
      { path: "admins", select: "firstName lastName avatar" },
      { path: "members.user", select: "firstName lastName avatar" },
    ]);

    // Convert avatar path to full URL if it exists
    if (group.avatar) {
      group.avatar = `${req.protocol}://${req.get('host')}/${group.avatar.replace(/\\/g, '/')}`;
    }

    console.log("Group populated with user details:", group);

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create group",
    });
  }
});

/**
 * Get all groups for the current user
 */
exports.getGroups = catchAsync(async (req, res) => {
  try {
    const groups = await Group.find({
      "members.user": req.user._id,
    }).populate([
      { path: "created_by", select: "firstName lastName avatar" },
      { path: "admins", select: "firstName lastName avatar" },
      { path: "members.user", select: "firstName lastName avatar" },
    ]);

    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch groups",
    });
  }
});

/**
 * Get a specific group by ID
 */
exports.getGroupById = catchAsync(async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate([
      { path: "created_by", select: "firstName lastName avatar" },
      { path: "admins", select: "firstName lastName avatar" },
      { path: "members.user", select: "firstName lastName avatar" },
    ]);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group",
    });
  }
});

/**
 * Update group details
 */
exports.updateGroup = catchAsync(async (req, res) => {
  try {
    const { name, description } = req.body;
    const groupId = req.params.groupId;

    // Find the group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if the user is an admin
    if (!group.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this group",
      });
    }

    // Update fields
    if (name) group.name = name;
    if (description) group.description = description;

    // Handle avatar update if file was uploaded
    if (req.file) {
      // Delete old avatar file if it exists
      if (group.avatar) {
        const oldAvatarPath = group.avatar;
        try {
          fs.unlinkSync(oldAvatarPath);
        } catch (err) {
          console.error("Error deleting old avatar:", err);
        }
      }
      
      // Set new avatar path
      group.avatar = req.file.path;
    }

    await group.save();

    // Populate user details
    await group.populate([
      { path: "created_by", select: "firstName lastName avatar" },
      { path: "admins", select: "firstName lastName avatar" },
      { path: "members.user", select: "firstName lastName avatar" },
    ]);

    // Convert avatar path to full URL if it exists
    if (group.avatar) {
      group.avatar = `${req.protocol}://${req.get('host')}/${group.avatar.replace(/\\/g, '/')}`;
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update group",
    });
  }
});

/**
 * Delete a group
 */
exports.deleteGroup = catchAsync(async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Find the group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if the user is the creator or an admin
    if (group.created_by.toString() !== req.user._id.toString() && 
        !group.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this group",
      });
    }

    // Delete avatar file if it exists
    if (group.avatar) {
      try {
        fs.unlinkSync(group.avatar);
      } catch (err) {
        console.error("Error deleting avatar file:", err);
      }
    }

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete group",
    });
  }
});

/**
 * Add members to a group
 */
exports.addMembers = catchAsync(async (req, res) => {
  try {
    const { members } = req.body;
    const groupId = req.params.groupId;
    
    // Parse member IDs
    const memberIds = JSON.parse(members);
    
    // Find the group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if the user is an admin
    if (!group.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to add members to this group",
      });
    }

    // Get existing member IDs
    const existingMemberIds = group.members.map(member => member.user.toString());
    
    // Filter out members who are already in the group
    const newMembers = memberIds.filter(id => !existingMemberIds.includes(id));
    
    // Add new members
    group.members.push(
      ...newMembers.map(id => ({
        user: id,
        joined_at: new Date(),
      }))
    );

    await group.save();

    // Populate user details
    await group.populate([
      { path: "created_by", select: "firstName lastName avatar" },
      { path: "admins", select: "firstName lastName avatar" },
      { path: "members.user", select: "firstName lastName avatar" },
    ]);

    res.status(200).json({
      success: true,
      data: group,
      message: `${newMembers.length} new members added to the group`,
    });
  } catch (error) {
    console.error("Error adding members:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add members to the group",
    });
  }
});

/**
 * Remove a member from a group
 */
exports.removeMember = catchAsync(async (req, res) => {
  try {
    const { memberId } = req.params;
    const groupId = req.params.groupId;
    
    // Find the group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check permissions - only admins can remove members, or users can remove themselves
    const isAdmin = group.admins.some(id => id.toString() === req.user._id.toString());
    const isSelfRemoval = memberId === req.user._id.toString();
    
    if (!isAdmin && !isSelfRemoval) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to remove this member",
      });
    }

    // Cannot remove the creator
    if (memberId === group.created_by.toString()) {
      return res.status(400).json({
        success: false,
        error: "Cannot remove the group creator",
      });
    }

    // Remove the member
    group.members = group.members.filter(member => 
      member.user.toString() !== memberId
    );

    // If an admin is removed, also remove from admins array
    if (group.admins.includes(memberId)) {
      group.admins = group.admins.filter(id => 
        id.toString() !== memberId
      );
    }

    await group.save();

    // Populate user details
    await group.populate([
      { path: "created_by", select: "firstName lastName avatar" },
      { path: "admins", select: "firstName lastName avatar" },
      { path: "members.user", select: "firstName lastName avatar" },
    ]);

    res.status(200).json({
      success: true,
      data: group,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove member from the group",
    });
  }
});

/**
 * Add admin to a group
 */
exports.addAdmin = catchAsync(async (req, res) => {
  try {
    const { memberId } = req.params;
    const groupId = req.params.groupId;
    
    // Find the group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if the current user is an admin
    if (!group.admins.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to add admins to this group",
      });
    }

    // Check if the user is already an admin
    if (group.admins.includes(memberId)) {
      return res.status(400).json({
        success: false,
        error: "User is already an admin",
      });
    }

    // Check if the user is a member of the group
    const isMember = group.members.some(
      member => member.user.toString() === memberId
    );
    
    if (!isMember) {
      return res.status(400).json({
        success: false,
        error: "User is not a member of this group",
      });
    }

    // Add user to admins
    group.admins.push(memberId);
    await group.save();

    // Populate user details
    await group.populate([
      { path: "created_by", select: "firstName lastName avatar" },
      { path: "admins", select: "firstName lastName avatar" },
      { path: "members.user", select: "firstName lastName avatar" },
    ]);

    res.status(200).json({
      success: true,
      data: group,
      message: "Admin added successfully",
    });
  } catch (error) {
    console.error("Error adding admin:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add admin to the group",
    });
  }
});

/**
 * Remove admin from a group
 */
exports.removeAdmin = catchAsync(async (req, res) => {
  try {
    const { adminId } = req.params;
    const groupId = req.params.groupId;
    
    // Find the group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if the current user is the creator
    if (group.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the group creator can remove admins",
      });
    }

    // Cannot remove the creator from admin role
    if (adminId === group.created_by.toString()) {
      return res.status(400).json({
        success: false,
        error: "Cannot remove creator from admin role",
      });
    }

    // Check if the user is an admin
    if (!group.admins.includes(adminId)) {
      return res.status(400).json({
        success: false,
        error: "User is not an admin of this group",
      });
    }

    // Remove user from admins
    group.admins = group.admins.filter(id => 
      id.toString() !== adminId
    );
    
    await group.save();

    // Populate user details
    await group.populate([
      { path: "created_by", select: "firstName lastName avatar" },
      { path: "admins", select: "firstName lastName avatar" },
      { path: "members.user", select: "firstName lastName avatar" },
    ]);

    res.status(200).json({
      success: true,
      data: group,
      message: "Admin removed successfully",
    });
  } catch (error) {
    console.error("Error removing admin:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove admin from the group",
    });
  }
});

/**
 * Get all messages for a group
 */
exports.getGroupMessages = catchAsync(async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Find the group
    const group = await Group.findById(groupId)
      .populate({
        path: "messages.from",
        select: "firstName lastName avatar"
      });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if the user is a member of the group
    const isMember = group.members.some(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: "You are not a member of this group",
      });
    }

    res.status(200).json({
      success: true,
      data: group.messages,
    });
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group messages",
    });
  }
});

/**
 * Leave a group
 */
exports.leaveGroup = catchAsync(async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Find the group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if the user is a member of the group
    const isMember = group.members.some(
      member => member.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      return res.status(400).json({
        success: false,
        error: "You are not a member of this group",
      });
    }

    // Creator cannot leave the group, they must delete it
    if (group.created_by.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "As the creator, you cannot leave the group. You must delete it or transfer ownership.",
      });
    }

    // Remove the user from members
    group.members = group.members.filter(
      member => member.user.toString() !== req.user._id.toString()
    );

    // Remove the user from admins if they are an admin
    if (group.admins.includes(req.user._id)) {
      group.admins = group.admins.filter(
        id => id.toString() !== req.user._id.toString()
      );
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: "You have left the group successfully",
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to leave the group",
    });
  }
}); 