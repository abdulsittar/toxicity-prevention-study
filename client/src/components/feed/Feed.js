import React from 'react';
import {useState, useEffect} from 'react'
import Post from '../post/Post'
import Share from '../share/Share'
import axios from "axios"
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { withStyles } from '@material-ui/core/styles';
import {styles} from './feedStyle';
import InfiniteScroll from "react-infinite-scroll-component";
import Loader from "../loader/loader";
import LoadingBar from "react-top-loading-bar";
import { useMediaQuery } from 'react-responsive';
import {useRef} from 'react';
import {regSw, subscribe} from '../../helper.js';
import {io} from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import DialogContentText from '@mui/material/DialogContentText';
import Slide from '@mui/material/Slide';
import { useHistory } from "react-router-dom";

import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Typography } from "@mui/material";
import { get } from 'mongoose';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const discussionStatements = [
  { key: "afraid", text: "I felt afraid while reading the previous conversation." },
  { key: "angry", text: "I felt angry while reading the previous conversation." },
  { key: "happy", text: "I felt happy while reading the previous conversation." },
  { key: "sad", text: "I felt sad while reading the previous conversation." },
  { key: "trusting", text: "I felt trusting or accepting toward the previous conversation." },
  { key: "disgusted", text: "I felt disgusted while reading the previous conversation." },
  { key: "curious", text: "I felt curious or eager to see what would happen next." },
  { key: "surprised", text: "I felt surprised by something I read." }
];

function Feed({username, classes, selectedValue, searchTerm, actionTriggered, setHasReadArticle, currentRound}) {
const [posts, setPosts] = useState([]);
const [hasMore, setHasMore] = useState(true);
const [index, setIndex] = useState(0);
const [isFiltered, setIsFiltered] = useState(false);
const [preFilter, setPreFilter] = useState(-1);
const [progress, setProgress] = useState(0);
const [preProfile, setPreProfile] = useState(" ");
const [viewedPosts, setViewedPosts] = useState([]);
const { user: currentUser } = useContext(AuthContext);
const isMobileDevice = useMediaQuery({ query: "(min-device-width: 480px)", });
const isTabletDevice = useMediaQuery({ query: "(min-device-width: 768px)", });
const [socket, setSocket] = useState(null)
const [open, setOpen] = React.useState(false);
const [totalPosts, setTotalPosts] = useState(0);
const [surveyError, setSurveyError] = useState("");
const [surveyLoading, setSurveyLoading] = useState(false);
//const [hasReadArticle, setHasReadArticle] = useState(false);
const history = useHistory();
let postCallCount = 0; 
let maxCalls = 5; 

const [openSurvey, setOpenSurvey] = useState(false);
const [surveyResponses, setSurveyResponses] = useState({
  afraid: "",
  angry: "",
  happy: "",
  sad: "",
  trusting: "",
  disgusted: "",
  curious: "",
  surprised: ""
});
const [currentSurveyPost, setCurrentSurveyPost] = useState(null);


const handleFeedAction = async (e) => {
    console.log("Feed received action from Topbar!");
    const token = localStorage.getItem('token');
    
    const lc = await axios.post("/posts/" + currentUser._id + "/createRefreshData", { version: user.pool, userId: user._id, headers: { 'auth-token': token }});
    fetchPosts(0); 
    
};

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    continueProcess(0)
    setPosts(prevPosts => prevPosts.slice(1));
  };
  
  const handleYes = async (e) => {
    setOpen(false);
    
    const firstPost = posts[0];
    
    setTimeout(() => {
        setPosts(prevPosts => prevPosts.slice(1));
      }, 1000);
    
    const token = localStorage.getItem('token');
        const newPost = {
          userId: user._id,
          desc: firstPost.desc,
          thumb: firstPost.thumb,
          pool:user.pool,
          headers: { 'auth-token': token },
        };
        try {
            const pst = await axios.post("/posts/" + user._id + "/create", newPost);
            socket.emit('sendMessage', pst);
            await axios.post("/posts/UserReadSpecialPost", {"postId": firstPost._id, "userId":user._id , headers: { 'auth-token': token }})
            continueProcess(10000)
            postCallCount++;
    } catch (err) {console.log(err);
    }
  };
  
  const continueProcess = (dlay) => {
    if (postCallCount < maxCalls) {
      // Call showPostsInOrder again after 60 seconds
      setTimeout(() => {
        showPostsInOrder();
        
  
        // Continue the process by checking the condition in handleYes
        if (postCallCount < maxCalls) {
          setTimeout(() => {
            //handleYes();
          }, 5000);  // Wait 20 seconds after showPostsInOrder for handleYes
        }
  
      }, dlay);  // 60000 milliseconds = 60 seconds
    } else {
      console.log("Process stopped after 5 calls.");
    }
  };
  

const [windowSize, setWindowSize] = useState(getWindowSize());

//useEffect(() => {
    //console.log("setSocket");
    //setSocket(io('wss://cleopatra.ijs.si/chat', {
     //   transports: [ 'polling'],
    //    withCredentials: true
    //  }));
      
    
//}, [])

useEffect(() => { 
    if (actionTriggered) {
        handleFeedAction();
    }
}, [actionTriggered]);

useEffect(() => {
    console.log('Posts updated: ', posts);
}, [posts]);

useEffect(() => {
  // only initialize once
  if (socket) return;

  try {
    // Use same origin — no explicit port!
    const SOCKET_URL = `${window.location.protocol}//${window.location.host}`;

    const newSocket = io('/', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  withCredentials: true
});
    setSocket(newSocket);

    // handle connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      if (user?.id) newSocket.emit('addUser', user.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    // handle server events
    newSocket.on('getUsers', (users) => {
      console.log('Active users:', users);
    });

    newSocket.on('getMessage', (res) => {
      console.log('Message received:', res.data);
      if (res?.data?.pool === user?.pool) {
        setPosts(res.data);
      }
    });

    newSocket.on('newComment', (data) => {
      console.log('Received newComment', data);
      setPosts((prev) =>
        Array.isArray(prev)
          ? prev.map((p) =>
              p?._id?.toString() === data?.postId?.toString()
                ? { ...p, comments: [...(p.comments || []), data.comment] }
                : p
            )
          : prev
      );
    });

    // cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket listeners...');
      newSocket.off('getUsers');
      newSocket.off('getMessage');
      newSocket.off('newComment');
      newSocket.disconnect();
    };
  } catch (err) {
    console.error('Socket init error', err);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // empty deps → run once

const showPostsInOrder = async () => {
    const token = localStorage.getItem('token');
    console.log("showPostsInOrder");
    const res = await axios.get("/posts/" + currentUser._id + "/getSpecialPosts", {headers: { 'auth-token': token }})
    console.log(res.data);
    
    if(res.data['no']){
        const arr = [{"_id": res.data["_id"], "desc":res.data["desc"], "pool":res.data["pool"] , "userId": "66f590ae38f16e2cea8d0646", "thumb":"https://fastly.picsum.photos/id/451/200/300.jpg?blur=5&hmac=Cs_EydLmPTWdSMrzBl8vXIG9b3CaH9iP_yVdDFiXUhU", "likes":[],
        "dislikes":[], "comments":[], "reposts":[], "rank":1000}]
        //setPosts((prevItems) => [...arr, ...prevItems]);
        setPosts(arr);
        console.log('posts data: >>', posts );

        //postCallCount++;
        setTimeout(handleClickOpen, 5000);
}

  };


const increment  = async (pv, iv) => {
    console.log("increatem");
    console.log(pv);
    console.log(iv);
    setIndex(pv+iv);
    console.log(index);
};

    /*async function registerAndSubscribe () {
    try {
        const serviceWorkerReg = await regSw ();
        await subscribe (serviceWorkerReg);
    } catch (error) {
        console.log (error);
    }
}*/

const {user} = useContext(AuthContext);
const [followed, setFollowed] = useState([]
    //currentUser.followings.includes(user?.id)
    );

    if(preFilter == -1){
    console.log(preFilter);
    setPreFilter(selectedValue);

    } else if(preFilter !== selectedValue){
    setIndex(0);
    setPosts([]);
    setPreFilter(selectedValue);

    }

const chek = username ?  true : false;
if(chek == true) {
    console.log(preProfile);
    console.log("User name1");
    console.log(username);
    const ii = (preProfile === username) ? true : false;
    console.log(ii);
if (preProfile === " ") {
    setPreProfile(username);
    console.log("User name2");
    console.log(username);
    console.log(preProfile);
    console.log(user.username);
} else if(preProfile !== username) {
    console.log("a NEW User name");
    console.log(username);
    setIndex(0);
    setPosts([]);
    setPreProfile(username);
}
}

  const fetchPost = async (page) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/posts/timelinePag/${user._id}?page=${page}`, {
        headers: { 'auth-token': token, 'userId': user._id }
      });

      if (res.data.length > 0) {
        setPosts(res.data);
        console.log("Fetched post for page", posts.length);
        setTotalPosts(res.data.length + page); // approximate total posts
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

const saveResponses = async () => {
  await axios.post('/posts/api/responses', {
    postId: currentSurveyPost._id,
    userId: currentUser._id,
    responses: {
      afraid: 2,
      angry: 1,
      happy: 4,
      sad: 1,
      trusting: 3,
      disgusted: 1,
      curious: 5,
      surprised: 2
    }
  });
};

const handleContinue = async (post) => {
  try {
    const response = await axios.post(`/posts/${post._id}/has-commented/${user._id}`);
    const data = response.data;

    if (!data.hasCommented) {
      toast.warning("Please write at least one comment before continuing.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // 2️⃣ Fetch user's previous discussion response
    const res = await axios.get(`/posts/responses/${post._id}`);

    console.log("Previous responses:", res.data);
    const existing = res.data.find(
      (r) => r.userId?._id?.toString() === user._id.toString()
    );

    // 3️⃣ If already submitted → pre-fill
    if (existing) {
      setSurveyResponses(existing.responses);
    } else {
      // empty form
      setSurveyResponses({
        afraid: "",
        angry: "",
        happy: "",
        sad: "",
        trusting: "",
        disgusted: "",
        curious: "",
        surprised: "",
      });
    }

    setCurrentSurveyPost(post);
    setSurveyError("");
    setOpenSurvey(true);

  } catch (err) {
    console.error("Error in handleContinue:", err);
    toast.error("Could not load survey data.", {
      position: "top-center",
      autoClose: 3000
    });
  }
};

  const handleNext = () => {
    setOpenSurvey(true);
  };

  const handlePrevious = () => {
    const prevIndex = index > 0 ? index - 1 : 0;
    setIndex(prevIndex);
    fetchPost(prevIndex);
  };


const filterLoadedPosts = async () => {
    console.log("filterLoadedPosts");
    if (searchTerm === '') {
        setPosts(posts);
    } else {
        const filteredData = posts.filter((post) => {
        return post.desc.toLowerCase().includes(searchTerm.toLowerCase())
        });
        setPosts(filteredData);
    }
    
}

const fetchPosts = async (selectedValue) => {
    setProgress(30);
    console.log("fetchpost")
    const chek = username ?  true : false;
if(chek == true) {
    console.log(preProfile);
    console.log("User name1");
    console.log(username);
    const ii = (preProfile === username) ? true : false;
    console.log(ii);
if (preProfile === " ") {
    setPreProfile(username);
    console.log("User name2");
    console.log(username);
    console.log(preProfile);
    console.log(user.username);
} else if(preProfile !== username) {
    console.log("a NEW User name");
    console.log(username);
    setIndex(0);
    setPosts([]);
    setPreProfile(username);
}
}

    var whPosts = "/posts/timelinePag/";

    if(selectedValue == 0){
    var whPosts = "/posts/timelinePag/";
    }
    else if (selectedValue == 1){
        whPosts = "/posts/onlyFollowersPag/"
    }
    else if (selectedValue == 2){
        whPosts = "/posts/onlyFollowingsPag/"
    }
    console.log(preFilter);
    console.log(whPosts);
    const token = localStorage.getItem('token');
    const res = username ?  await axios.get("/posts/profile/" + username+`?page=${index}`, {headers: { 'auth-token': token, 'userId': user._id }}) : await axios.get(whPosts + user._id+`?page=${index}`, {headers: { 'auth-token': token, 'userId': user._id }});
    console.log(res.data);
    console.log("fetch posts");
    if(res.data.length){
    if(res.data.length > 0){
        setPosts([])
        console.log("Fetched post for pagen2", posts.length); 
        setPosts(res.data)
        //setPosts((prevItems) => [...prevItems, ...res.data
            //.sort((p1,p2) => {return new Date(p2.createdAt) - new Date(p1.createdAt);})
        //]); 
        res.data.length%20 > 0 ? setHasMore(false) : setHasMore(true);
        //setIndex((index) => index + 1);
        increment(index, 0);
        setProgress(100);
    } else {
        setHasMore(false);
        setProgress(100);
        //setPosts([]);
        //setIndex((index) => 0);
        //increment(index, -index);
    }

    //setPreFilter(whPosts);
    console.log(whPosts);
    //setPosts(res.data.sort((p1,p2) => {return new Date(p2.createdAt) - new Date(p1.createdAt);})); 
}
};

function updateViewdPosts( post) {
    /*const oldViewed = [...viewedPosts, post];
    setViewedPosts(oldViewed);
    console.log("array  ", viewedPosts);
    console.log("post id  ", post);
    console.log("viewed length ", viewedPosts.length);
    if(viewedPosts.length == 10){
        axios.put("/users/" + currentUser._id + "/viewed", { postId: post });
        setViewedPosts([]);
    }*/
    }
    
    
    const handleSubmitSurvey = async () => {
  if (!validateResponses()) {
    alert("❗ Please answer all questions before submitting.");
    return;
  }

  try {
    await axios.post("/posts/responses", {
      postId: currentSurveyPost._id,
      userId: user._id,
      responses: surveyResponses
    });

    // Update local UI
    setPosts(prev =>
      prev.map(p =>
        p._id === currentSurveyPost._id
          ? {
              ...p,
              discussionResponses: [
                ...(p.discussionResponses || []),
                { userId: user._id, responses: surveyResponses }
              ]
            }
          : p
      )
    );

    setOpenSurvey(false);

    // Move to next post
    const nextIndex = index + 1;
    setIndex(nextIndex);
    fetchPost(nextIndex);

  } catch (err) {
    console.error(err);
    alert("Failed to save responses. Please try again.");
  }
};
    
  const validateResponses = () => {
      return Object.values(surveyResponses).every(v => v !== "");
    };


  const handleSurveyChange = (key, value) => {
  setSurveyResponses(prev => ({
    ...prev,
    [key]: value
  }));
};

  const handleSurveySubmit = () => {
    console.log("Survey Responses:", surveyResponses);
    setOpenSurvey(false);
    const surveySubmitted = currentSurveyPost.discussionResponses?.some(
      (r) => r.userId.toString() === user._id.toString()
    );


const nextIndex = index + 1;
    setIndex(nextIndex);
    fetchPost(nextIndex);
    
    // Continue logic after survey submission
  };

const fetchMoreData = async () => {
    setProgress(30);
    if(searchTerm? searchTerm.length !== 0 : false){
        console.log("searchTerm");
        console.log(searchTerm.length);
        setProgress(100);
        return
    }

    if(index == 0){
        setProgress(100);
        return
    }
    //console.log("fetchpost")
    
    console.log("fetch more  posts");
    console.log(selectedValue);
    var whPosts = "/posts/timelinePag/";

    if(selectedValue == 0){
        whPosts = "/posts/timelinePag/"
    }
    else if (selectedValue == 1){
        whPosts = "/posts/onlyFollowersPag/"
    }
    else if (selectedValue == 2){
        whPosts = "/posts/onlyFollowingsPag/"
    }

    const token = localStorage.getItem('token');
    const res = username ?  await axios.get("/posts/profile/" + username+`?page=${index}`, {headers: { 'auth-token': token }}): await axios.get(whPosts + user._id+`?page=${index}`, {headers: { 'auth-token': token }});
    //console.log(res.data);
    
    if(res.data.length > 0){
        //setPosts((prevItems) => [...prevItems, ...res.data
            //.sort((p1,p2) => {return new Date(p2.createdAt) - new Date(p1.createdAt);})
        //]);
        setPosts([])
        setPosts(res.data)
         res.data.length%20 > 0 ? setHasMore(false) : setHasMore(true);
        increment(index, 0);
        setProgress(100);
    }else {
        setHasMore(false);
        setProgress(100);
        //setPosts([]);
        //setIndex((index) => 0);
        //increment(index, -index);
    }
};

function getWindowSize() {
    const {innerWidth, innerHeight} = window;
    return {innerWidth, innerHeight};
    };

useEffect(() => {
    //registerAndSubscribe();
    console.log("use effects!");
    //showPostsInOrder();
    if (selectedValue !=10){
    ///// Remove this breakpoint during the casestudy
        //filterLoadedPosts()
        if(searchTerm? searchTerm.length !== 0 : false){
            console.log("searchTerm");
            console.log(searchTerm.length);
            filterLoadedPosts()
        } else {
            //filterLoadedPosts()
            fetchPosts(selectedValue);
        }
    }

    function handleWindowResize() {
        setWindowSize(getWindowSize());
    }
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
        window.removeEventListener('resize', handleWindowResize);
    };

}, [username, user._id, selectedValue, searchTerm])

const refreshed = async (selectedValue) => {
    console.log("refreshed");
    setPosts([]);
    const chek = username ?  true : false;
if(chek == true) {
    console.log(preProfile);
    console.log("User name1");
    console.log(username);
    const ii = (preProfile === username) ? true : false;
    console.log(ii);
    
if (preProfile === " ") {
    setPreProfile(username);
    console.log("User name2");
    console.log(username);
    console.log(preProfile);
    console.log(user.username);
    
} else if(preProfile !== username) {
    console.log("a NEW User name");
    console.log(username);
    setIndex(0);
    setPosts([]);
    setPreProfile(username);
}
}

    var whPosts = "/posts/timelinePag/";

    if(selectedValue == 0){
    var whPosts = "/posts/timelinePag/";
    }
    else if (selectedValue == 1){
        whPosts = "/posts/onlyFollowersPag/"
    }
    else if (selectedValue == 2){
        whPosts = "/posts/onlyFollowingsPag/"
    }
    console.log(preFilter);
    console.log(whPosts);
    const token = localStorage.getItem('token');
    const res = username ?  await axios.get("/posts/profile/" + username+`?page=${0}`, {headers: { 'auth-token': token }}) : await axios.get(whPosts + user._id+`?page=${0}`, {headers: { 'auth-token': token }});
    console.log(res.data);
    console.log("fetch posts");
    if(res.data.length){
    if(res.data.length > 0){
        //setPosts((prevItems) => [...prevItems, ...res.data
            //.sort((p1,p2) => {return new Date(p2.createdAt) - new Date(p1.createdAt);})
        //]);
        setPosts([])
        setPosts(res.data)
        res.data.length%20 > 0 ? setHasMore(false) : setHasMore(true);
        //setIndex((index) => index + 1);
        increment(0, 0);
    } else {
        setHasMore(false)
        //setPosts([]);
        //setIndex((index) => 0);
        //increment(index, -index);
    }

    //setPreFilter(whPosts);
    console.log(whPosts);
}}

      return (
        <div className={classes.feed}>
          <LoadingBar
            color="#f11946"
            progress={progress}
            onLoaderFinished={() => setProgress(0)}
          />
    
          <div className={classes.feedWrapper} style={{ width: (!isMobileDevice && !isTabletDevice) && (windowSize.innerWidth-10)+"px" }}>
            {( !username || username === user.username )}
            {Array.isArray(posts) && posts.length > 0 ? (
              posts.map((p) => (
                <Post
                  socket={socket}
                  onScrolling={updateViewdPosts}
                  key={p._id}
                  post={p}
                  isDetail={false}
                  setHasReadArticle={setHasReadArticle}
                  currentRound={currentRound}
                />
              ))
            ) : (
  <div style={{ textAlign: "center", marginTop: "20px" }}>
    <h3>No posts yet</h3>

    <button
      onClick={() => {
        toast.info("Posts finished — moving to post survey...");
        history.push(`/postsurvey/${currentUser.username}`);
      }}
      style={{
        marginTop: "15px",
        padding: "10px 20px",
        backgroundColor: "red",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      MOVE TO POST SURVEY
    </button>
  </div>
)
}
          </div>
    
           {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', maxWidth: '800px', margin: '32px auto 0' }}>
            <Button
              variant="outlined"
              onClick={handlePrevious}
              style={{ minWidth: '120px', padding: '12px 24px' }}
            >
              Previous
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleContinue(posts[0])}> Continue </Button>
          </div>
    
          <Dialog open={openSurvey} onClose={() => setOpenSurvey(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Discussion Perception</DialogTitle>
    
      <DialogContent>
        <Typography variant="body1" paragraph> 
          Please indicate the extent to which you felt each of the following emotions while reading the previous conversation.  
          Use the scale:  
          <strong>1 = Not at all, 2 = Slightly, 3 = Moderately, 4 = Strongly, 5 = Extremely</strong>
        </Typography>
    
        {discussionStatements.map((s) => (
  <FormControl
    key={s.key}
    fullWidth
    style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}
  >
    <FormLabel>{s.text}</FormLabel>

    <RadioGroup
      row
      value={surveyResponses[s.key] || ""}
      onChange={(e) => handleSurveyChange(s.key, e.target.value)}
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      {[1, 2, 3, 4, 5].map((val) => (
        <FormControlLabel
          key={val}
          value={val.toString()}
          control={<Radio />}
          label={val.toString()}
          style={{ flex: 1, textAlign: 'center' }} // spread evenly
        />
      ))}
    </RadioGroup>
  </FormControl> 

        ))}
      </DialogContent>
    
      <DialogActions>
        <Button onClick={() => setOpenSurvey(false)}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleSubmitSurvey}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
        </div>
      );
    };
    
    export default withStyles(styles)(Feed);