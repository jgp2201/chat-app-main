import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, Slide, Stack, Tab, Tabs, Typography, CircularProgress } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  FetchFriendRequests,
  FetchFriends,
  FetchUsers,
} from "../../redux/slices/app";
import { FriendElement, FriendRequestElement, UserElement } from "../../components/UserElement";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UsersList = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const { users } = useSelector((state) => state.app);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await dispatch(FetchUsers());
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" height="100%" py={3}>
        <CircularProgress size={32} />
      </Stack>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" py={3}>
        <Typography variant="body2" color="text.secondary">
          No users found
        </Typography>
      </Stack>
    );
  }

  return (
    <>
      {users.map((el, idx) => {
        if (!el || !el._id) return null;
        return <UserElement key={el._id || idx} {...el} />;
      })}
    </>
  );
};

const FriendsList = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const { friends } = useSelector((state) => state.app);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await dispatch(FetchFriends());
        setLoading(false);
      } catch (error) {
        console.error("Error fetching friends:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" height="100%" py={3}>
        <CircularProgress size={32} />
      </Stack>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" py={3}>
        <Typography variant="body2" color="text.secondary">
          No friends yet
        </Typography>
      </Stack>
    );
  }

  return (
    <>
      {friends.map((el, idx) => {
        if (!el || !el._id) return null;
        return <FriendElement key={el._id || idx} {...el} />;
      })}
    </>
  );
};

const RequestsList = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const { friendRequests } = useSelector((state) => state.app);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await dispatch(FetchFriendRequests());
        setLoading(false);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" height="100%" py={3}>
        <CircularProgress size={32} />
      </Stack>
    );
  }

  if (!friendRequests || friendRequests.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" py={3}>
        <Typography variant="body2" color="text.secondary">
          No friend requests
        </Typography>
      </Stack>
    );
  }

  return (
    <>
      {friendRequests.map((el, idx) => {
        if (!el || !el._id || !el.sender) return null;
        return <FriendRequestElement 
          key={el._id || idx} 
          {...el.sender} 
          id={el._id} 
          email={el.sender?.email || ''} 
        />;
      })}
    </>
  );
};

const Friends = ({ open, handleClose }) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
      sx={{ p: 4 }}
    >
      {/* <DialogTitle>{"Friends"}</DialogTitle> */}
      <Stack p={2} sx={{ width: "100%" }}>
        <Tabs value={value} onChange={handleChange} centered>
          <Tab label="Explore" />
          <Tab label="Friends" />
          <Tab label="Requests" />
        </Tabs>
      </Stack>
      <DialogContent>
        <Stack sx={{ height: "100%" }}>
          <Stack spacing={2.4}>
            {(() => {
              switch (value) {
                case 0: // display all users in this list
                  return <UsersList />;

                case 1: // display friends in this list
                  return <FriendsList />;

                case 2: // display request in this list
                  return <RequestsList />;

                default:
                  return null;
              }
            })()}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default Friends;