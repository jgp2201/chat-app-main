const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path"); // Add missing path import
dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err);
  console.log("UNCAUGHT Exception! Shutting down ...");
  process.exit(1); // Exit Code 1 indicates that a container shut down, either because of an application failure.
});

const app = require("./app");

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io"); // Add this
const { promisify } = require("util");
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");
const OneToOneMessage = require("./models/OneToOneMessage");
const AudioCall = require("./models/audioCall");
const VideoCall = require("./models/videoCall");
const Group = require("./models/Group"); // Add Group model

// Add this
// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    // useNewUrlParser: true, // The underlying MongoDB driver has deprecated their current connection string parser. Because this is a major change, they added the useNewUrlParser flag to allow users to fall back to the old parser if they find a bug in the new parser.
    // useCreateIndex: true, // Again previously MongoDB used an ensureIndex function call to ensure that Indexes exist and, if they didn't, to create one. This too was deprecated in favour of createIndex . the useCreateIndex option ensures that you are using the new function calls.
    // useFindAndModify: false, // findAndModify is deprecated. Use findOneAndUpdate, findOneAndReplace or findOneAndDelete instead.
    // useUnifiedTopology: true, // Set to true to opt in to using the MongoDB driver's new connection management engine. You should set this option to true , except for the unlikely case that it prevents you from maintaining a stable connection.
  })
  .then((con) => {
    console.log("DB Connection successful");
  });

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

// Add this
// Listen for when the client connects via socket.io-client
io.on("connection", async (socket) => {
  console.log(JSON.stringify(socket.handshake.query));
  const user_id = socket.handshake.query["user_id"];

  console.log(`User connected ${socket.id}`);

  if (user_id != null && Boolean(user_id)) {
    try {
      await User.findByIdAndUpdate(user_id, { // Add await here
        socket_id: socket.id,
        status: "Online",
      });
    } catch (e) {
      console.log(e);
    }
  }

  // We can write our socket event listeners in here...
  socket.on("friend_request", async (data) => {
    const to = await User.findById(data.to).select("socket_id");
    const from = await User.findById(data.from).select("socket_id");

    // create a friend request
    await FriendRequest.create({
      sender: data.from,
      recipient: data.to,
    });
    // emit event request received to recipient
    io.to(to?.socket_id).emit("new_friend_request", {
      message: "New friend request received",
    });
    io.to(from?.socket_id).emit("request_sent", {
      message: "Request Sent successfully!",
    });
  });

  socket.on("accept_request", async (data) => {
    // accept friend request => add ref of each other in friends array
    console.log(data);
    const request_doc = await FriendRequest.findById(data.request_id);

    console.log(request_doc);

    const sender = await User.findById(request_doc.sender);
    const receiver = await User.findById(request_doc.recipient);

    sender.friends.push(request_doc.recipient);
    receiver.friends.push(request_doc.sender);

    await receiver.save({ new: true, validateModifiedOnly: true });
    await sender.save({ new: true, validateModifiedOnly: true });

    await FriendRequest.findByIdAndDelete(data.request_id);

    // delete this request doc
    // emit event to both of them

    // emit event request accepted to both
    io.to(sender?.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
    io.to(receiver?.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
  });

  socket.on("get_direct_conversations", async ({ user_id }, callback) => {
    const existing_conversations = await OneToOneMessage.find({
      participants: { $all: [user_id] },
    }).populate("participants", "firstName lastName avatar _id email status");

    // db.books.find({ authors: { $elemMatch: { name: "John Smith" } } })

    console.log(existing_conversations);

    callback(existing_conversations);
  });

  socket.on("start_conversation", async (data) => {
    // data: {to: from:}

    const { to, from } = data;

    // check if there is any existing conversation

    const existing_conversations = await OneToOneMessage.find({
      participants: { $size: 2, $all: [to, from] },
    }).populate("participants", "firstName lastName _id email status");

    console.log(existing_conversations[0], "Existing Conversation");

    // if no => create a new OneToOneMessage doc & emit event "start_chat" & send conversation details as payload
    if (existing_conversations.length === 0) {
      let new_chat = await OneToOneMessage.create({
        participants: [to, from],
      });

      new_chat = await OneToOneMessage.findById(new_chat).populate(
        "participants",
        "firstName lastName _id email status"
      );

      console.log(new_chat);

      socket.emit("start_chat", new_chat);
    }
    // if yes => just emit event "start_chat" & send conversation details as payload
    else {
      socket.emit("start_chat", existing_conversations[0]);
    }
  });

  socket.on("get_messages", async (data, callback) => {
    try {
      const conversation = await OneToOneMessage.findById(data.conversation_id);
      
      if (!conversation) {
        callback([]);
        return;
      }
      
      const messages = conversation.messages || [];
      callback(messages);
    } catch (error) {
      console.log(error);
      callback([]);
    }
  });

  // Handle incoming text/link messages
  socket.on("text_message", async (data) => {
    console.log("Received message:", data);

    const { message, conversation_id, from, to, type, reply } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    // message => {to, from, type, created_at, text, file}

    const new_message = {
      to: to,
      from: from,
      type: type,
      created_at: Date.now(),
      text: message,
    };

    // If this is a reply, add reply data
    if (reply) {
      console.log("Adding reply data to message:", reply);
      new_message.reply = {
        message_id: reply.message_id,
        text: reply.text,
        from: reply.from,
        type: reply.type,
        subtype: reply.subtype,
        file: reply.file
      };
    }

    // fetch OneToOneMessage Doc & push a new message to existing conversation
    const chat = await OneToOneMessage.findById(conversation_id);
    if (!chat) {
      console.error("Conversation not found:", conversation_id);
      return;
    }
    
    chat.messages.push(new_message);
    // save to db
    await chat.save({ new: true, validateModifiedOnly: true });

    console.log("Message saved successfully:", new_message);

    // emit incoming_message -> to user
    if (to_user?.socket_id) {
      io.to(to_user.socket_id).emit("new_message", {
        conversation_id,
        message: new_message,
      });
      console.log("Message emitted to recipient:", to_user.socket_id);
    }

    // emit outgoing_message -> from user
    if (from_user?.socket_id) {
      io.to(from_user.socket_id).emit("new_message", {
        conversation_id,
        message: new_message,
      });
      console.log("Message emitted to sender:", from_user.socket_id);
    }
  });

  // handle Media/Document Message
  socket.on("file_message", async (data) => {
    console.log("Received file message:", data);

    const { conversation_id, from, to, file, type } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    // Create a new message with file reference
    const new_message = {
      to: to,
      from: from,
      type: type,
      created_at: Date.now(),
      file: {
        url: file.url,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }
    };

    // Update conversation with new message
    const chat = await OneToOneMessage.findById(conversation_id);
    chat.messages.push(new_message);
    await chat.save({ new: true, validateModifiedOnly: true });

    // Emit to both users
    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });

    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });
  });

  // Handle message deletion
  socket.on("delete_message", async (data, callback) => {
    try {
      const { conversation_id, message_id } = data;
      console.log("Attempting to delete message:", { conversation_id, message_id });

      // Find the conversation first
      const conversation = await OneToOneMessage.findById(conversation_id);
      if (!conversation) {
        console.log("Conversation not found");
        callback({ success: false, error: "Conversation not found" });
        return;
      }

      // Remove the message from the messages array
      conversation.messages = conversation.messages.filter(
        msg => msg._id.toString() !== message_id
      );

      // Save the updated conversation
      await conversation.save();
      console.log("Message deleted successfully");

      // Notify all participants
      for (const participant_id of conversation.participants) {
        const participant = await User.findById(participant_id).select("socket_id");
        if (participant?.socket_id) {
          io.to(participant.socket_id).emit("message_deleted", {
            success: true,
            conversation_id,
            message_id
          });
        }
      }

      callback({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle forwarding messages
  socket.on("forward_message", async (data, callback) => {
    try {
      const { message_id, from_conversation_id, to_conversation_id, to_user_id } = data;
      console.log("Forwarding message - Input data:", {
        message_id,
        from_conversation_id,
        to_conversation_id,
        to_user_id,
        current_user_id: socket.handshake.query.user_id
      });

      // Validate IDs
      if (!message_id || !from_conversation_id || !to_conversation_id || !to_user_id) {
        console.log("Missing required fields:", {
          message_id: !!message_id,
          from_conversation_id: !!from_conversation_id,
          to_conversation_id: !!to_conversation_id,
          to_user_id: !!to_user_id
        });
        callback({ success: false, error: "Missing required fields" });
        return;
      }

      // Find the source conversation and message
      console.log("Attempting to find source conversation with ID:", from_conversation_id);
      const sourceConversation = await OneToOneMessage.findById(from_conversation_id);
      console.log("Source conversation found:", sourceConversation ? "Yes" : "No");
      if (sourceConversation) {
        console.log("Source conversation details:", {
          id: sourceConversation._id,
          participants: sourceConversation.participants,
          messageCount: sourceConversation.messages?.length
        });
      }
      
      if (!sourceConversation) {
        console.log("Error: Source conversation not found");
        callback({ success: false, error: "Source conversation not found" });
        return;
      }

      const sourceMessage = sourceConversation.messages.find(
        msg => msg._id.toString() === message_id
      );
      console.log("Source message found:", sourceMessage ? "Yes" : "No");
      if (sourceMessage) {
        console.log("Source message details:", {
          id: sourceMessage._id,
          type: sourceMessage.type,
          text: sourceMessage.text,
          from: sourceMessage.from
        });
      }
      
      if (!sourceMessage) {
        console.log("Error: Source message not found");
        callback({ success: false, error: "Source message not found" });
        return;
      }

      // Find the target conversation
      console.log("Attempting to find target conversation with ID:", to_conversation_id);
      const targetConversation = await OneToOneMessage.findById(to_conversation_id);
      console.log("Target conversation found:", targetConversation ? "Yes" : "No");
      if (targetConversation) {
        console.log("Target conversation details:", {
          id: targetConversation._id,
          participants: targetConversation.participants,
          messageCount: targetConversation.messages?.length
        });
      }
      
      if (!targetConversation) {
        console.log("Error: Target conversation not found");
        callback({ success: false, error: "Target conversation not found" });
        return;
      }

      // Create forwarded message
      const forwardedMessage = {
        to: to_user_id,
        from: socket.handshake.query.user_id,
        type: sourceMessage.type,
        created_at: Date.now(),
        text: sourceMessage.text,
        file: sourceMessage.file,
        preview: sourceMessage.preview,
        isForwarded: true,
        originalMessage: {
          text: sourceMessage.text,
          from: sourceMessage.from,
          created_at: sourceMessage.created_at
        }
      };
      console.log("Created forwarded message:", forwardedMessage);

      // Add message to target conversation
      targetConversation.messages.push(forwardedMessage);
      await targetConversation.save({ new: true, validateModifiedOnly: true });
      console.log("Message added to target conversation");

      // Get target user's socket ID
      const toUser = await User.findById(to_user_id).select("socket_id");
      console.log("Target user socket ID:", toUser?.socket_id);
      
      // Emit to both users
      if (toUser?.socket_id) {
        io.to(toUser.socket_id).emit("new_message", {
          conversation_id: to_conversation_id,
          message: forwardedMessage,
        });
        console.log("Message emitted to target user");
      }

      socket.emit("new_message", {
        conversation_id: to_conversation_id,
        message: forwardedMessage,
      });
      console.log("Message emitted to sender");

      callback({ success: true });
      console.log("Forward message operation completed successfully");
    } catch (error) {
      console.error("Error in forward_message handler:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle starring/unstarring messages
  socket.on("toggle_star_message", async (data, callback) => {
    try {
      const { conversation_id, message_id, starred } = data;
      console.log(`Attempting to ${starred ? 'star' : 'unstar'} message:`, { conversation_id, message_id });

      // Find the conversation and update the message's starred status
      const result = await OneToOneMessage.findOneAndUpdate(
        { 
          _id: conversation_id,
          "messages._id": message_id 
        },
        { 
          $set: { "messages.$.starred": starred } 
        },
        { new: true }
      );

      if (!result) {
        console.log("Conversation or message not found");
        callback({ success: false, error: "Conversation or message not found" });
        return;
      }

      console.log(`Message ${starred ? 'starred' : 'unstarred'} successfully`);

      // Notify all participants
      for (const participant_id of result.participants) {
        const participant = await User.findById(participant_id).select("socket_id");
        if (participant?.socket_id) {
          io.to(participant.socket_id).emit("message_starred", {
            conversation_id,
            message_id,
            starred
          });
        }
      }

      callback({ success: true });
    } catch (error) {
      console.error("Error toggling star status:", error);
      callback({ success: false, error: error.message });
    }
  });

  // -------------- HANDLE AUDIO CALL SOCKET EVENTS ----------------- //

  // handle start_audio_call event
  socket.on("start_audio_call", async (data) => {
    const { from, to, roomID } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    console.log("to_user", to_user);

    // send notification to receiver of call
    io.to(to_user?.socket_id).emit("audio_call_notification", {
      from: from_user,
      roomID,
      streamID: from,
      userID: to,
      userName: to,
    });
  });

  // handle audio_call_not_picked
  socket.on("audio_call_not_picked", async (data) => {
    console.log(data);
    // find and update call record
    const { to, from } = data;

    const to_user = await User.findById(to);

    await AudioCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Missed", status: "Ended", endedAt: Date.now() }
    );

    // TODO => emit call_missed to receiver of call
    io.to(to_user?.socket_id).emit("audio_call_missed", {
      from,
      to,
    });
  });

  // handle audio_call_accepted
  socket.on("audio_call_accepted", async (data) => {
    const { to, from } = data;

    const from_user = await User.findById(from);

    // find and update call record
    await AudioCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Accepted" }
    );

    // TODO => emit call_accepted to sender of call
    io.to(from_user?.socket_id).emit("audio_call_accepted", {
      from,
      to,
    });
  });

  // handle audio_call_denied
  socket.on("audio_call_denied", async (data) => {
    // find and update call record
    const { to, from } = data;

    await AudioCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Denied", status: "Ended", endedAt: Date.now() }
    );

    const from_user = await User.findById(from);
    // TODO => emit call_denied to sender of call

    io.to(from_user?.socket_id).emit("audio_call_denied", {
      from,
      to,
    });
  });

  // handle user_is_busy_audio_call
  socket.on("user_is_busy_audio_call", async (data) => {
    const { to, from } = data;
    // find and update call record
    await AudioCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Busy", status: "Ended", endedAt: Date.now() }
    );

    const from_user = await User.findById(from);
    // TODO => emit on_another_audio_call to sender of call
    io.to(from_user?.socket_id).emit("on_another_audio_call", {
      from,
      to,
    });
  });

  // --------------------- HANDLE VIDEO CALL SOCKET EVENTS ---------------------- //

  // handle start_video_call event
  socket.on("start_video_call", async (data) => {
    const { from, to, roomID } = data;

    console.log(data);

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    console.log("to_user", to_user);

    // send notification to receiver of call
    io.to(to_user?.socket_id).emit("video_call_notification", {
      from: from_user,
      roomID,
      streamID: from,
      userID: to,
      userName: to,
    });
  });

  // handle video_call_not_picked
  socket.on("video_call_not_picked", async (data) => {
    console.log(data);
    // find and update call record
    const { to, from } = data;

    const to_user = await User.findById(to);

    await VideoCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Missed", status: "Ended", endedAt: Date.now() }
    );

    // TODO => emit call_missed to receiver of call
    io.to(to_user?.socket_id).emit("video_call_missed", {
      from,
      to,
    });
  });

  // handle video_call_accepted
  socket.on("video_call_accepted", async (data) => {
    const { to, from } = data;

    const from_user = await User.findById(from);

    // find and update call record
    await VideoCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Accepted" }
    );

    // TODO => emit call_accepted to sender of call
    io.to(from_user?.socket_id).emit("video_call_accepted", {
      from,
      to,
    });
  });

  // handle video_call_denied
  socket.on("video_call_denied", async (data) => {
    // find and update call record
    const { to, from } = data;

    await VideoCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Denied", status: "Ended", endedAt: Date.now() }
    );

    const from_user = await User.findById(from);
    // TODO => emit call_denied to sender of call

    io.to(from_user?.socket_id).emit("video_call_denied", {
      from,
      to,
    });
  });

  // handle user_is_busy_video_call
  socket.on("user_is_busy_video_call", async (data) => {
    const { to, from } = data;
    // find and update call record
    await VideoCall.findOneAndUpdate(
      {
        participants: { $size: 2, $all: [to, from] },
      },
      { verdict: "Busy", status: "Ended", endedAt: Date.now() }
    );

    const from_user = await User.findById(from);
    // TODO => emit on_another_video_call to sender of call
    io.to(from_user?.socket_id).emit("on_another_video_call", {
      from,
      to,
    });
  });

  // -------------- HANDLE SOCKET DISCONNECTION ----------------- //

  socket.on("end", async (data) => {
    // Find user by ID and set status as offline

    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    // broadcast to all conversation rooms of this user that this user is offline (disconnected)

    console.log("closing connection");
    socket.disconnect(0);
  });

  // Get all groups for a user
  socket.on("get_groups", async ({ user_id }, callback) => {
    try {
      const groups = await Group.find({
        "members.user": user_id
      }).populate([
        { path: "created_by", select: "firstName lastName avatar" },
        { path: "admins", select: "firstName lastName avatar" },
        { path: "members.user", select: "firstName lastName avatar status" }
      ]);
      
      callback({ success: true, groups });
    } catch (error) {
      console.error("Error fetching groups:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Get messages for a group
  socket.on("get_group_messages", async ({ group_id }, callback) => {
    try {
      const group = await Group.findById(group_id);
      if (!group) {
        callback({ success: false, error: "Group not found" });
        return;
      }

      callback({ success: true, messages: group.messages });
    } catch (error) {
      console.error("Error fetching group messages:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Send message to a group
  socket.on("group_message", async (data) => {
    try {
      const { group_id, from, message, type, reply } = data;
      
      // Find the group
      const group = await Group.findById(group_id);
      if (!group) {
        console.error("Group not found:", group_id);
        return;
      }

      // Create the new message
      const newMessage = {
        from: from,
        type: type,
        text: message,
        created_at: Date.now()
      };

      // Add reply data if present
      if (reply) {
        newMessage.reply = {
          message_id: reply.message_id,
          text: reply.text,
          from: reply.from,
          type: reply.type,
          subtype: reply.subtype,
          file: reply.file
        };
      }

      // Add the message to the group
      group.messages.push(newMessage);
      await group.save();

      // Get the updated message with populated fields
      const updatedGroup = await Group.findById(group_id)
        .populate("messages.from", "firstName lastName avatar");
      
      const sentMessage = updatedGroup.messages[updatedGroup.messages.length - 1];

      // Emit the message to all members of the group
      for (const member of group.members) {
        const user = await User.findById(member.user).select("socket_id");
        if (user && user.socket_id) {
          io.to(user.socket_id).emit("new_group_message", {
            group_id,
            message: sentMessage
          });
        }
      }
    } catch (error) {
      console.error("Error sending group message:", error);
    }
  });

  // Send file message to a group
  socket.on("group_file_message", async (data) => {
    try {
      const { group_id, from, file, type } = data;
      
      // Find the group
      const group = await Group.findById(group_id);
      if (!group) {
        console.error("Group not found:", group_id);
        return;
      }

      // Create the new message with file
      const newMessage = {
        from: from,
        type: type,
        created_at: Date.now(),
        file: {
          url: file.url,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }
      };

      // Add the message to the group
      group.messages.push(newMessage);
      await group.save();

      // Get the updated message with populated fields
      const updatedGroup = await Group.findById(group_id)
        .populate("messages.from", "firstName lastName avatar");
      
      const sentMessage = updatedGroup.messages[updatedGroup.messages.length - 1];

      // Emit the message to all members of the group
      for (const member of group.members) {
        const user = await User.findById(member.user).select("socket_id");
        if (user && user.socket_id) {
          io.to(user.socket_id).emit("new_group_message", {
            group_id,
            message: sentMessage
          });
        }
      }
    } catch (error) {
      console.error("Error sending group file message:", error);
    }
  });

  // Delete a message from a group
  socket.on("delete_group_message", async (data, callback) => {
    try {
      const { group_id, message_id } = data;
      
      // Find and update the group
      const result = await Group.findOneAndUpdate(
        { _id: group_id },
        { $pull: { messages: { _id: message_id } } },
        { new: true }
      );

      if (!result) {
        callback({ success: false, error: "Group or message not found" });
        return;
      }

      // Notify all group members
      for (const member of result.members) {
        const user = await User.findById(member.user).select("socket_id");
        if (user && user.socket_id) {
          io.to(user.socket_id).emit("group_message_deleted", {
            group_id,
            message_id
          });
        }
      }

      callback({ success: true });
    } catch (error) {
      console.error("Error deleting group message:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Star/unstar a group message
  socket.on("toggle_star_group_message", async (data, callback) => {
    try {
      const { group_id, message_id, starred } = data;
      
      // Find and update the message
      const result = await Group.findOneAndUpdate(
        { _id: group_id, "messages._id": message_id },
        { $set: { "messages.$.starred": starred } },
        { new: true }
      );

      if (!result) {
        callback({ success: false, error: "Group or message not found" });
        return;
      }

      // Notify all group members
      for (const member of result.members) {
        const user = await User.findById(member.user).select("socket_id");
        if (user && user.socket_id) {
          io.to(user.socket_id).emit("group_message_starred", {
            group_id,
            message_id,
            starred
          });
        }
      }

      callback({ success: true });
    } catch (error) {
      console.error("Error starring group message:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Leave a group
  socket.on("leave_group", async (data, callback) => {
    try {
      const { group_id, user_id } = data;
      
      // Find the group and remove the user
      const result = await Group.findOneAndUpdate(
        { _id: group_id },
        { $pull: { members: { user: user_id } } },
        { new: true }
      )
      .populate({
        path: "members.user",
        select: "firstName lastName avatar _id socket_id"
      })
      .populate({
        path: "admins",
        select: "firstName lastName _id"
      })
      .populate({
        path: "created_by",
        select: "firstName lastName _id"
      });

      if (!result) {
        callback({ success: false, error: "Group not found" });
        return;
      }

      // Format user data for emitting back to client
      const leavingUser = await User.findById(user_id).select("firstName lastName");
      const userFullName = leavingUser ? `${leavingUser.firstName} ${leavingUser.lastName}` : "A user";
      
      // Notify all remaining group members
      for (const member of result.members) {
        if (member.user && member.user.socket_id) {
          io.to(member.user.socket_id).emit("user_left_group", {
            group_id,
            user_id,
            user_name: userFullName,
            group: result
          });
        }
      }
      
      // Also notify the user who left
      const leavingUserSocketId = socket.id;
      if (leavingUserSocketId) {
        io.to(leavingUserSocketId).emit("user_left_group", {
          group_id,
          user_id,
          user_name: userFullName
        });
      }

      callback({ success: true });
    } catch (error) {
      console.error("Error leaving group:", error);
      callback({ success: false, error: error.message });
    }
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION! Shutting down ...");
  server.close(() => {
    process.exit(1); //  Exit Code 1 indicates that a container shut down, either because of an application failure.
  });
});