import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import Topbar from "../../components/topbar/Topbar";
import Post from "../../components/post/Post";
import { useParams } from "react-router";
import { styles } from "./PostdetailStyle";
import { withStyles } from "@material-ui/core/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMediaQuery } from "react-responsive";
import axios from "axios";
import { useLocation, Link, useHistory } from "react-router-dom";
import LoadingBar from "react-top-loading-bar";
import { io } from 'socket.io-client';
import { COLORS } from "../../components/values/colors.js";
import TimeMe from "timeme.js";

// ✅ Import toast stuff
import { toast, ToastContainer } from "react-toastify";
import { ToastProvider } from "react-toast-notifications";
import "react-toastify/dist/ReactToastify.css";

function Postdetail({ classes }) {
  const history = useHistory();
  const { state } = useLocation();
  const [postObj, setPostObj] = useState(state?.myObj || {});
  const [selectedValue, setSelectedValue] = useState("0");
  const isMobileDevice = useMediaQuery({ query: "(min-device-width: 480px)" });
  const isTabletDevice = useMediaQuery({ query: "(min-device-width: 768px)" });
  const [shouldSendEvent, setShouldSendEvent] = useState(false);

  const { user: currentUser } = useContext(AuthContext);
  const username = useParams().username;
  const [progress, setProgress] = useState(0);

  const token = localStorage.getItem("token");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!socket) {
      try {
        const s = io(undefined, { path: '/socket.io', transports: ['polling', 'websocket'] });
        setSocket(s);
      } catch (err) {
        console.error('Socket init error (Postdetail)', err);
      }
    }
    return () => { if (socket) socket.disconnect(); };
  }, []);

  const handleReadChange = () => {
    axios.put(`/users/${currentUser._id}/read`, {
      postId: state.myObj._id,
      headers: { "auth-token": token },
    });
  };

  const updateStatus_State = async () => {
    try {
      setProgress(30);
      const res = await axios.get(`/posts/${postObj._id}`, {
        headers: { "auth-token": token },
      });
      setPostObj(res.data);
      setProgress(100);

      // ✅ Show toast when post data is updated
      toast.success("Post successfully loaded 🎉");
    } catch (error) {
      console.error("Error fetching post:", error);
      setProgress(100);
      //toast.error("Failed to load post ❌");
    }
  };

  const handleActivityRecorder = () => {
    axios.put(`/users/${currentUser._id}/activity`, {
      page: "DetailPage",
      seconds: TimeMe.getTimeOnCurrentPageInSeconds(),
      headers: { "auth-token": token },
    });
  };

  useEffect(() => {
    updateStatus_State();
  }, [username]);

  useEffect(() => {
    TimeMe.initialize({
      currentPageName: "DetailPage",
      idleTimeoutInSeconds: 10,
    });

    TimeMe.callWhenUserLeaves(() => {
      setShouldSendEvent(true);
    });

    TimeMe.callWhenUserReturns(() => {
      setShouldSendEvent(false);
    });
  }, []);

  return (
    <>
      {/* ✅ ToastContainer must be included once */}
      <ToastContainer
        position="top-center"
        autoClose={6000}
        style={{
          width: !isMobileDevice && !isTabletDevice ? "600px" : "90%",
        }}
      />

      {/* ✅ ToastProvider wrapper (like Home.js) */}
      <ToastProvider placement="top-center">
        <Topbar
          isProfile="true"
          setSelectedValue={setSelectedValue}
          style={{ marginTop: "-20px" }}
          showRefreshIcon={false}
        />

        <div className={classes.feed}>
          <div className={classes.feedWrapper}>
            <Link
              style={{ textDecoration: "none", color: COLORS.textColor }}
            >
              <ArrowBackIcon onClick={() => history.goBack()} />
            </Link>
            <Post socket={socket} key={postObj._id} post={postObj} isDetail={true} />
          </div>
        </div>
      </ToastProvider>
    </>
  );
}

export default withStyles(styles)(Postdetail);
