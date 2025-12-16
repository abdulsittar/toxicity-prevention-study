import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';
import {styles} from './registerPageStyle'
import Avatar from '@material-ui/core/Avatar';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { render } from "react-dom";
import axios from "axios";
import TimeMe from "timeme.js";
import { useParams } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import styled, { keyframes } from 'styled-components';
import LoadingBar from "react-top-loading-bar";

import { Buffer } from 'buffer';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify'; 
import { useScrollBy } from "react-use-window-scroll";
import {  AlertDialog,  AlertDialogLabel,  AlertDialogDescription,  AlertDialogOverlay,  AlertDialogContent,} from "@reach/alert-dialog";

import {  
  Slider  // <-- add this
} from "@mui/material";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import {
  // New constants for three-stage survey
  CONSENT_WELCOME,
  CONSENT_INTRODUCTION,
  CONSENT_STUDY_TITLE,
  CONSENT_RESEARCHERS,
  CONSENT_PURPOSE_TITLE,
  CONSENT_PURPOSE,
  CONSENT_PROCEDURE_TITLE,
  CONSENT_PROCEDURE,
  CONSENT_REQUIREMENTS_TITLE,
  CONSENT_REQUIREMENTS,
  CONSENT_TIME_TITLE,
  CONSENT_TIME,
  CONSENT_VOLUNTARY_TITLE,
  CONSENT_VOLUNTARY,
  CONSENT_DATA_PROTECTION_TITLE,
  CONSENT_DATA_PROTECTION,
  CONSENT_DATA_SHARING_TITLE,
  CONSENT_DATA_SHARING,
  CONSENT_CONTACT_TITLE,
  CONSENT_CONTACT,
  CONSENT_COMPLAINTS_TITLE,
  CONSENT_COMPLAINTS,
  CONSENT_QUESTIONS,
  CONSENT_AGREE,
  CONSENT_DISAGREE,
  ONETIME_INTRO,
  // Demographics Q1
  DEMO_AGE_QUESTION,
  DEMO_AGE_OPTIONS,
  DEMO_GENDER_QUESTION,
  DEMO_GENDER_OPTIONS,
  DEMO_EDUCATION_QUESTION,
  DEMO_EDUCATION_OPTIONS,
  DEMO_EMPLOYMENT_QUESTION,
  DEMO_EMPLOYMENT_OPTIONS,
  // Civil engagement Q2
  CIVIL_ENGAGEMENT_INTRO,
  CIVIL_VOTED_QUESTION,
  CIVIL_VOTED_OPTIONS,
  CIVIL_ACTIVITIES_QUESTION,
  CIVIL_ACTIVITIES_OPTIONS,
  CIVIL_MEMBER_QUESTION,
  CIVIL_MEMBER_OPTIONS,
  // News consumption Q3
  NEWS_CONSUMPTION_INTRO,
  NEWS_FREQUENCY_QUESTION,
  NEWS_FREQUENCY_OPTIONS,
  NEWS_SOURCE_QUESTION,
  NEWS_SOURCE_OPTIONS,
  NEWS_TIME_QUESTION,
  NEWS_TIME_OPTIONS,
  // Weekly questions
  WEEKLY_INTRO,
  WEEKLY_POLITICAL_ISSUE_INTRO,
  WEEKLY_POLITICAL_ISSUE_QUESTION,
  WEEKLY_POLITICAL_ISSUE_SCALE,
  BTN_NEXT,
  BTN_PREVIOUS,
  BTN_SUBMIT,
  BTN_CONTINUE,
  PERSONALITY_QUESTIONS,
  PERSONALITY_SCALE,
  PROGRESS_CONSENT,
  PROGRESS_DEMOGRAPHICS,
  PROGRESS_WEEKLY,
  ERROR_REQUIRED_FIELD,
  ERROR_INVALID_AGE,
  ERROR_NETWORK,
  SUCCESS_CONSENT,
  SUCCESS_DEMOGRAPHICS,
  SUCCESS_WEEKLY,
  // Legacy constants
  followers,
  followings,
  email,
  Password,
  Send,
  comments,
  Write_something,
  A_user_with,
} from '../../constants_STA';
import { Unstable_Grid2 } from '@mui/material';

function Register({classes}) {
  const history = useHistory();
  const scrollBy = useScrollBy();
  const PF = process.env.REACT_APP_PUBLIC_FOLDER;
  const [progress, setProgress] = useState(0);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const {user, isFetching, error, dispatch} = useContext(AuthContext);
  
  // Core survey state
  const [currentStage, setCurrentStage] = useState('consent'); // 'consent', 'demographics', 'weekly', 'userSelection'
  const [uniqId, setUniqId] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [topics, setTopics] = useState([]);
  
  
  // Form data state
  const [consentAnswers, setConsentAnswers] = useState([]);
const [demographicsData, setDemographicsData] = useState({
  age: "",
  gender: "",
  education: "",
  employment: "",
  politicalLeanings: 6,
  voted: "",
  politicalActivities: "",
  partyMember: "",
  newsFrequency: "",
  newsSource: "",
  newsTime: "",
  personality: {} // <--- NEW block for all personality answers
});

  const [weeklyData, setWeeklyData] = useState({});
  
  // UI state
  const [isButtonDisabled, setButtonDisabled] = useState(false);
  const [showDialog, setShowDialog] = React.useState(false);
  const cancelRef = React.useRef();

  // User account state (keep these for account creation flow)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [proPic, setProPic] = useState("");
  
  // User selection state (for the 4 profile options)
  const [selectedUserOption, setSelectedUserOption] = useState("");
  const [userProfiles, setUserProfiles] = useState([]);
  
  const initialized = useRef(false);

  useEffect(() => {
    // Extract unique ID from URL
    const urlParts = window.location.pathname.split('/');
    const uniqueId = urlParts[urlParts.length-1];
    setUniqId(uniqueId);
    
    // Check if user has already submitted survey
    checkUserSurveyStatus(uniqueId);
  }, []);

  // Helper functions
  const getRandomNumber = () => Math.floor(Math.random() * 4) + 1;
  
  const checkUserSurveyStatus = async (val) => {
    try {
      setProgress(30);
      const token = localStorage.getItem('token');
      const res = await axios.post(`/presurvey/isSubmitted/${val}`, { 
        headers: { 'auth-token': token }
      }); 
      
      // TODO: Add logic to check survey status and redirect accordingly
      // For now, just proceed to consent form
      setCurrentStage('consent');
      
      setProgress(100);
      
    } catch (err) {
      console.log(err);
      setProgress(100);
    }
  };

  // Animation keyframes
  const fadeInOut = keyframes`
    0% {
      opacity: 0;
      transform: translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  
  const fadeOut = keyframes`
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px);
    }
  `;
  
  // Styled component with dynamic animation
  const AnimatedDiv = styled.div`
    &.fade-enter {
      animation: ${fadeInOut} 1s forwards;
    }
    &.fade-exit {
      animation: ${fadeOut} 1s forwards;
    }
  `;
    
  const slideIn = keyframes`
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `;

  const slideOut = keyframes`
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-100%);
    }
  `;

  const SlideDiv = styled.div`
    &.slide-enter {
      animation: ${slideIn} 1s forwards;
      opacity: 0;
    }
    &.slide-enter-active {
      animation: ${slideIn} 1s forwards;
      opacity: 1;
    }
    &.slide-exit {
      animation: ${slideOut} 1s forwards;
      opacity: 1;
    }
    &.slide-exit-active {
      animation: ${slideOut} 1s forwards;
      opacity: 0;
    }
  `;
    
  // Handler functions for three-stage survey
 const handleConsentSubmit = () => {
  setCurrentStage("demographics");
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
};

const handleDemographicsSubmit = async () => {
  const requiredFields = ['prolificId', 'age', 'gender', 'political'];

  const missingFields = requiredFields.filter(
    field => !demographicsData[field] && demographicsData[field] !== 0
  );

  const unansweredPersonality = PERSONALITY_QUESTIONS.filter(
    (_, index) => !demographicsData[`pers_${index}`]
  );

  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  if (missingFields.length === 0 && unansweredPersonality.length === 0) {

    // OPTIONAL if you still want to show message
    toast.success("Demographics saved!");

    // ⬇️ **CALL WEEKLY SUBMIT DIRECTLY**
    await handleWeeklySubmit();

  } else {
    toast.error("Please complete all required fields.");
  }
};




const fetchTopicsAndProceed = async () => {
  try {
    const res = await axios.post(`/presurvey/topics/isSubmitted/${uniqId}`);

    if (res.data.login === true) {
      history.push(`/login/${uniqId}`);
      return;
    }

    // Set topics (real or fallback)
    if (res.data.topics?.length) {
      setTopics(res.data.topics);
    } else {
      setTopics([
  "Party Chairwoman Weidel (AfD) — “Classifying the AfD as ’extremist’ is a political attack on democracy”",
  "Green Youth Leader Nietzard (Die Grünen) — “We should beat the AfD with weapons”",
  "Minister of Economic Affairs and Energy Reiche (CDU) — “We must end heat-pump subsidies”",
  "Chancellor Merz (CDU) — “Suspend family reunification to protect our communities”",
  "Chancellor Merz (CDU) — “We will not introduce a wealth tax”",
  "Bundestag President Klöckner (CDU) — “No rainbow flags during Pride month”",
  "Former Health Minister Lauterbach (SPD) — “Legalisation of cannabis is the right move”",
  "Defense Minister Pistorius (SPD) — “Increase military spending to truly support Ukraine”",
  "Culture Minister Weimer (Independent) — “Language is not a playground”",
  "Environment Minister Schneider (Die Grünen) — “Raising the Deutschland ticket to €63 is necessary”"
]);
    }

  } catch (err) {
    setTopics([
  "Party Chairwoman Weidel (AfD) — “Classifying the AfD as ’extremist’ is a political attack on democracy”",
  "Green Youth Leader Nietzard (Die Grünen) — “We should beat the AfD with weapons”",
  "Minister of Economic Affairs and Energy Reiche (CDU) — “We must end heat-pump subsidies”",
  "Chancellor Merz (CDU) — “Suspend family reunification to protect our communities”",
  "Chancellor Merz (CDU) — “We will not introduce a wealth tax”",
  "Bundestag President Klöckner (CDU) — “No rainbow flags during Pride month”",
  "Former Health Minister Lauterbach (SPD) — “Legalisation of cannabis is the right move”",
  "Defense Minister Pistorius (SPD) — “Increase military spending to truly support Ukraine”",
  "Culture Minister Weimer (Independent) — “Language is not a playground”",
  "Environment Minister Schneider (Die Grünen) — “Raising the Deutschland ticket to €63 is necessary”"
]);
    toast.error("Using fallback topics.");
  }

  // 🔥 ALWAYS MOVE TO NEXT STAGE — NEVER GET STUCK
  setCurrentStage("topicSelection");
};

 const handleWeeklySubmit = async () => {
  try {
    // Build payload using ONLY fields actually collected
    const personalityAnswers = PERSONALITY_QUESTIONS.map((_, index) => ({
      question: PERSONALITY_QUESTIONS[index],
      answer: demographicsData[`pers_${index}`],
    }));

    const surveyData = {
      prolificId: demographicsData.prolificId,
      age: demographicsData.age,
      gender: demographicsData.gender,
      political: demographicsData.political,
      personality: personalityAnswers,

      completedAt: new Date().toISOString(),
      surveyVersion: "3-stage-v1"
    };

    console.log("Submitting survey data:", surveyData);

    const res = await axios.post(`/presurvey/psurvey/${uniqId}`, surveyData);

    if (res.status === 200) {
      toast.success("Survey completed successfully!");

      setTimeout(() => {
        setCurrentStage("topicSelection"); 
      }, 800);
    } else {
      toast.error("Error submitting survey. Please try again.");
    }
  } catch (error) {
    console.error("Survey submission error:", error);
    toast.error("Error submitting survey. Please try again.");
  }
};


  const fetchUserProfiles = async () => {
    try {
      console.log('Fetching user profiles for uniqId:', uniqId);
      
      // Use the presurvey endpoint to get real user profiles like the original system
      const res = await axios.post(`/presurvey/isSubmitted/${uniqId}`);
      console.log('Presurvey response:', res.data);
      
      // Check if user already exists and should login instead
      if (res.data.login === true) {
        console.log('User already exists, redirecting to login');
        toast.info('User already registered. Please login instead.');
        history.push(`/login/${uniqId}`);
        return;
      }
      
      // Check if we have user profiles for selection
      if (res.data.users && res.data.users.length > 0) {
        // Extract users from the response format similar to backup
        const profiles = res.data.users.map(userObj => {
          const user = userObj.user || userObj; // Handle both formats
          return {
            _id: user._id || user.username,
            username: user.username,
            profilePicture: user.profilePicture,
            version: user.version
          };
        });
        
        console.log('Setting real user profiles:', profiles);
           // <- this sets topicSelection, but stage was already userSelection
        setUserProfiles(profiles.slice(0, 4));
      } else {
        // Use fallback mock data if no real users available
        console.log('No real user profiles available, using fallback');
        const fallbackProfiles = [
          { _id: "temp1", username: "user1", profilePicture: "person/1.jpeg" },
          { _id: "temp2", username: "user2", profilePicture: "person/2.jpeg" },
          { _id: "temp3", username: "user3", profilePicture: "person/3.jpeg" },
          { _id: "temp4", username: "user4", profilePicture: "person/4.jpeg" }
        ];
        setUserProfiles(fallbackProfiles);
      }
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      // Use fallback mock data if API fails
      const fallbackProfiles = [
        { _id: "temp1", username: "user1", profilePicture: "person/1.jpeg" },
        { _id: "temp2", username: "user2", profilePicture: "person/2.jpeg" },
        { _id: "temp3", username: "user3", profilePicture: "person/3.jpeg" },
        { _id: "temp4", username: "user4", profilePicture: "person/4.jpeg" }
      ];
      setUserProfiles(fallbackProfiles);
      toast.error('Using fallback profiles. Backend user profiles not available.');
    }
  };  
  
  
  const fetchTopics = async () => {
  try {
    const res = await axios.post(`/presurvey/topics/isSubmitted/${uniqId}`);
    if (res.data.topics && res.data.topics.length > 0) {
      setTopics(res.data.topics);
    } else {
      setTopics([
        "Party Chairwoman Weidel (AfD) — “Classifying the AfD as ’extremist’ is a political attack on democracy”",
        "Green Youth Leader Nietzard (Die Grünen) — “We should beat the AfD with weapons”",
        "Minister of Economic Affairs and Energy Reiche (CDU) — “We must end heat‑pump subsidies”",
        "Chancellor Merz (CDU) — “Suspend family reunification to protect our communities”",
        "Chancellor Merz (CDU) — “We will not introduce a wealth tax”",
        "Bundestag President Klöckner (CDU) — “No rainbow flags during Pride month”",
        "Former Health Minister Lauterbach (SPD) — “Legalisation of cannabis is the right move”",
        "Defense Minister Pistorius (SPD) — “Increase military spending to truly support Ukraine”",
        "Culture Minister Weimer (Independent) — “Language is not a playground”",
        "Environment Minister Schneider (Die Grünen) — “Raising the Deutschland ticket to €63 is necessary”"
      ]);
    }
  } catch (err) {
    console.error(err);
    toast.error("Could not fetch topics, using fallback.");
  }
};
  
  
const handleTopicSelection = () => {
  if (selectedTopics.length !== 4) {
    toast.error("Please select exactly 4 topics.");
    return;
  }

  axios.post("/presurvey/topics/saveSelection", {
    uniqId,
    topics: selectedTopics
  });

  history.push("/home");
};
  
const TOPICS_LIST = [
  {
    id: "0",
    label: "Parteivorsitzende Weidel kritisiert Einstufung der AfD als extremistisch"
  },
  {
    id: "1",
    label: "Grüne-Jugend-Vorsitzende Nietzard sorgt mit Aussagen zu Gewalt gegen AfD für Empörung"
  },
  {
    id: "2",
    label: "Bundesregierung überdenkt Förderung für Wärmepumpen"
  },
  {
    id: "3",
    label: "Kanzler Merz kündigt strengere Migrationskontrollen an"
  },
  {
    id: "4",
    label: "Merz lehnt Einführung einer Vermögenssteuer ab"
  },
  {
    id: "5",
    label: "Bundestagspräsidentin Klöckner beendet Regenbogenflagge am Bundestag"
  },
  {
    id: "6",
    label: "Karl Lauterbach treibt Cannabis-Legalisierung weiter voran"
  },
  {
    id: "7",
    label: "Verteidigungsminister Pistorius fordert höhere Militärausgaben"
  },
  {
    id: "8",
    label: "Kulturminister Weimer verbietet gendergerechte Sternchenformen"
  },
  {
    id: "9",
    label: "Preis des Deutschlandtickets soll auf 63 Euro steigen"
  }
];



const toggleTopicSelection = (index) => {
  setSelectedTopics(prev => {
    if (prev.includes(index)) return prev.filter(i => i !== index);
    if (prev.length >= 4) return prev; // Only 4 allowed
    return [...prev, index];
  });
};

const handleSubmitTopics = () => {
  // send selected topics to backend if needed
  setCurrentStage("userSelection"); // or next stage
};

const handleTopicSelectionSubmit = async () => {
  if (selectedTopics.length !== 4) {
    toast.error("Please select exactly 4 topics.");
    return;
  }

  try {
   /* await axios.post("/presurvey/topics/saveSelection", {
      uniqId,
      topics: selectedTopics
    });*/
    toast.success("Topics saved!");
    setCurrentStage("userSelection");
    fetchUserProfiles();
    //history.push("/home"); // go to home screen
  } catch (err) {
    console.error(err);
    toast.error("Failed to save topics.");
  }
};
  
  const submitNext = async (e) => {
    e.preventDefault();
    
    if (!selectedUserOption) {
      toast.error('Please select a user profile to continue.');
      return;
    }

    try {
      console.log('Selected user option:', selectedUserOption);
      console.log('Available user profiles:', userProfiles);
      
      // Find the selected user profile
      const selectedIndex = parseInt(selectedUserOption.replace('option', '')) - 1;
      const selectedUser = userProfiles[selectedIndex];
      
      console.log('Selected user data:', selectedUser);

      if (selectedUser) {
        // Create user object with survey data like the old system
        const user = {
          ...demographicsData, // Include demographic data
          ...weeklyData,       // Include weekly survey data  
          username: selectedUser.username, // Add suffix to avoid conflicts
          password: "defaultPassword123", // Default password since users endpoint doesn't include it
          username_second: selectedUser.username + "_second", // Original username
          profilePicture: selectedUser.profilePicture,
          pool: 1, // Default pool
          uniqId: uniqId,
          selectedTopics: selectedTopics.map(i => TOPICS_LIST[i].id)
        };

        console.log('Creating user account with survey data and selected profile:', user);
        
        // Register the user using the same API as the old system
        const userRes = await axios.post(`/auth/register/${uniqId}`, user);
        console.log('User registration response:', userRes);
        
        if (userRes.data) {
          const createdUser = userRes.data;
          console.log('Created user:', createdUser);
          
          // Try to login to get the auth token
          try {
            const loginRes = await axios.post(`/auth/login`, {
              username: selectedUser.username, // Match the registered username
              password: "defaultPassword123"
            });
            
            if (loginRes.data && loginRes.data.token) {
              console.log('Login successful, got token:', loginRes.data.token);
              localStorage.setItem("token", loginRes.data.token);
              localStorage.setItem("user", JSON.stringify(loginRes.data.user));
              dispatch({ type: "LOGIN_SUCCESS", payload: loginRes.data.user });
              
              // Successfully logged in after registration
              const token = loginRes.data.token;
              const user = loginRes.data.user;
              console.log('Login successful, user created and logged in');
              
              // Try to create initial data, but don't fail if it doesn't work
              try {
                console.log('Attempting to create initial data...');
                /*const initialDataRes = await axios.post(`/posts/${uniqId}/createInitialData/`, {
                  pool: user.version || '3',  // Use user's version or default to '3'
                  userId: user._id
                }, {
                  headers: { 'auth-token': token }
                });*/
                
                const initialDataRes = await axios.post(`/posts/${uniqId}/createInitialData/`, { 
                pool: user.pool, 
                userId: user._id, 
                selectedTopics: selectedTopics.map(i => TOPICS_LIST[i].id), 
                headers: { 'auth-token': token }});
                
                console.log('Initial data creation response:', initialDataRes.data);
              } catch (initialDataError) {
                console.warn('Initial data creation failed, but continuing anyway:', initialDataError);
                // Don't fail the entire registration process for this
              }
              
              toast.success('Account created successfully! Redirecting...');
              
              setTimeout(() => {
                console.log('Redirecting to homepage...');
                history.push('/');
              }, 2000);
            }
          } catch (loginError) {
            console.error('Login error after registration:', loginError);
            toast.error('Account created but login failed. Please try logging in manually.');
          }
        }
      } else {
        toast.error('Invalid user selection. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        toast.error(`Registration failed: ${error.response.data.message || error.response.status}`);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

 const handlePreviousStage = () => {
  switch (currentStage) {
    case "demographics":
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
      setCurrentStage("consent");
      break;
    case "topicSelection":
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
      setCurrentStage("demographics");
      break;
    default:
      break;
  }
};

  const MemoizedSlideDiv = React.memo(({ children }) => <SlideDiv>{children}</SlideDiv>);

  return (
    <div>
      <LoadingBar color="#f11946" progress={progress} onLoaderFinished={() => setProgress(0)} />
      
      <div className={classes.register}>
        <form className={classes.form} noValidate autoComplete="off">
          
          {/* TODO: Replace with new three-stage survey JSX */}
          <div className={classes.wrapper}>
            <h1>Pre-survey</h1>
            
            {currentStage === 'consent' && (
  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
    <Typography
      variant="h4"
      gutterBottom
      align="center"
      style={{ marginBottom: '32px' }}
    >
      TWON Research Study - Informed Consent
    </Typography>

    {/* Introductory text */}
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '16px', lineHeight: 1.6 }}
    >
      Dear Participant,
      <br /><br />
      Welcome to the EU-funded study “Twon – Twin of an online social network” of the Faculty
      of Social and Behavioural Sciences at the University of Amsterdam (UvA) in collaboration
      with the University of Trier in Germany and the Jozef Stefan Institute (JSI) in Slovenia.
      Please read the following text carefully before you begin. If anything is unclear, please
      do not hesitate to contact us by email: Francois t’Serstevens (f.tserstevens@uva.nl). We
      will be happy to answer your questions.
    </Typography>

    {/* Objective of the Study */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'left' }}
    >
      Objective of the Study
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'left' }}
    >
      The aim of this study is to better understand how people communicate and interact
      on online discussion platforms. We are particularly interested in how certain platform
      features can influence the way users express their opinions and respond to one another.
      The findings of this research will help inform the design of future social platforms
      that encourage constructive and engaging online exchanges.
    </Typography>

    {/* Procedure of the Study */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'left' }}
    >
      Procedure of the Study
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'left' }}
    >
      In this study, you will participate in a short series of simulated online discussions on a
      research platform developed by the study team. You will be asked to read short posts
      and reply as you would normally do on a social platform. In some cases, after posting
      your message, you may see an optional rewrite suggestion generated by an AI language
      model. You can choose freely whether to post your original version, adopt the rewrite,
      or make further changes. Participation is fully voluntary at each step.
      <br /><br />
      Before and after the discussion sessions, you will complete short questionnaires about
      your experience and background. The total duration of the study will be approximately
      15–20 minutes, including the questionnaires and participation in several short conversation
      rounds.
      <br /><br />
      You will receive the compensation previously agreed upon with Prolific after completing
      all parts of the study.
    </Typography>

    {/* Voluntary Participation */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'left' }}
    >
      Voluntary Participation
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'left' }}
    >
      Your participation is voluntary. If you want to stop, you can simply close the browser.
      After your participation you may not want us to use your data for the project anymore.
      In that case, you can still withdraw your consent. To withdraw after your participation,
      please contact Prolific using the link provided to you for your participation. You do not
      need to provide a reason. Note that we will remove your participant ID from the dataset
      after data collection is finished, making the UvA research data anonymous. From that
      moment, it is no longer possible for us to remove your data when consent is withdrawn.
    </Typography>

    {/* Data / Privacy */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'left' }}
    >
      What happens to my data?
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'left' }}
    >
      In this study, the University of Amsterdam will not collect your personal data directly.
      We make use of a third party to collect the research data and have a contract in place
      to guarantee your privacy. Research data can be published and reused in other research,
      but only in such a way that it cannot be traced back to you.
    </Typography>

    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'left' }}
    >
      How long will my data be stored?
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'left' }}
    >
      The anonymous research data and related materials will be securely archived for a minimum
      of 10 years after the project has finished.
    </Typography>

    {/* Further Information */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'left' }}
    >
      Further Information
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'left' }}
    >
      If you have any questions about the study, please contact the responsible researcher:
      Francois t’Serstevens (f.tserstevens@uva.nl).
      <br /><br />
      If you have any complaints about the study or the research, please contact the Ethics
      Review Board of ASCoR, address: Secretariat of the ASCoR Ethics Committee, University
      of Amsterdam; phone: 020-525 3680; email: ascor-secr-fmg@uva.nl. Your complaint will
      be treated confidentially.
      <br /><br />
      If you have any complaints about your personal data, please contact the Data Protection
      Officer of the University of Amsterdam at fg@uva.nl.
      <br /><br />
      Sincerely,
      <br />
      Francois t’Serstevens
    </Typography>

    {/* Action Buttons */}
    <div style={{ textAlign: 'center', marginTop: '32px' }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleConsentSubmit}
        style={{
          marginRight: '16px',
          minWidth: '200px',
          padding: '12px 24px',
          fontSize: '16px',
          opacity: 1
        }}
      >
        {CONSENT_AGREE}
      </Button>
      <Button
        variant="outlined"
        onClick={() => {
          alert('Thank you for your time. You will be redirected to the login page.');
          window.location.href = '/login';
        }}
        style={{
          minWidth: '200px',
          padding: '12px 24px',
          fontSize: '16px'
        }}
      >
        {CONSENT_DISAGREE}
      </Button>
    </div>
  </div>
)}
            
            {currentStage === 'demographics' && (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Typography variant="h4" gutterBottom align="center" style={{ marginBottom: '32px' }}>
                  {ONETIME_INTRO}
                </Typography>
                
                {/* --- Demographics Section (updated) --- */}
<Paper elevation={2} style={{ padding: '32px', marginBottom: '24px' }}>
  {/* 1.1 Prolific ID */}
  <Typography variant="h5" gutterBottom style={{ marginBottom: '16px', color: '#1976d2' }}>
    1.1 Prolific ID
  </Typography>
  <Typography variant="body1" style={{ marginBottom: '12px' }}>
    Please enter your Prolific ID below (used only for participation verification, not linked to responses):
  </Typography>
  <input
    type="text"
    value={demographicsData.prolificId || ''}
    onChange={(e) =>
      setDemographicsData({ ...demographicsData, prolificId: e.target.value })
    }
    style={{
      width: '250px',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '16px',
      marginBottom: '24px'
    }}
  />

  {/* 1.2 Demographic Information */}
  <Typography variant="h5" gutterBottom style={{ marginBottom: '16px', color: '#1976d2' }}>
    1.2 Demographic Information
  </Typography>
  <Typography variant="body1" style={{ marginBottom: '24px' }}>
    Please answer the following questions before starting the main task:
  </Typography>

  {/* Age */}
  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
      Age *
    </FormLabel>
    <input
      type="number"
      min={18}
      max={99}
      value={demographicsData.age || ''}
      onChange={(e) =>
        setDemographicsData({ ...demographicsData, age: e.target.value })
      }
      style={{
        width: '120px',
        padding: '8px',
        borderRadius: '4px',
        border: `1px solid ${
          demographicsData.age && (demographicsData.age < 18 || demographicsData.age > 99)
            ? '#f44336'
            : '#ccc'
        }`,
        fontSize: '16px'
      }}
    />
    {demographicsData.age &&
      (demographicsData.age < 18 || demographicsData.age > 99) && (
        <Typography variant="caption" style={{ color: '#f44336', display: 'block', marginTop: '4px' }}>
          Age must be between 18 and 99
        </Typography>
    )}
  </FormControl>

  {/* Gender */}
  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
      Gender *
    </FormLabel>
    <RadioGroup
      value={demographicsData.gender || ''}
      onChange={(e) =>
        setDemographicsData({ ...demographicsData, gender: e.target.value })
      }
    >
      {["Male", "Female", "Diverse", "Prefer not to say"].map((option, index) => (
        <FormControlLabel
          key={index}
          value={option}
          control={<Radio />}
          label={<Typography variant="body1">{option}</Typography>}
          style={{ marginBottom: '8px', textAlign: 'left' }}
        />
      ))}
    </RadioGroup>
  </FormControl>

  {/* Political Leanings */}
  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
      Political Leanings (1 = Very Left-leaning, 11 = Very Right-leaning)
    </FormLabel>
    <Slider
      min={1}
      max={11}
      step={1}
      value={demographicsData.political || 6}
      onChange={(e, value) =>
        setDemographicsData({ ...demographicsData, political: value })
      }
      valueLabelDisplay="auto"
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginTop: '4px' }}>
      <span>Very Left</span>
      <span>Moderate</span>
      <span>Very Right</span>
    </div>
  </FormControl>

  {/* 1.3 Personality Test */}
  <Typography variant="h5" gutterBottom style={{ marginBottom: '16px', color: '#1976d2' }}>
    1.3 Personality Test
  </Typography>

  <Typography variant="body1" style={{ marginBottom: '12px' }}>
    Below are several statements about attitudes and behaviours. Please indicate how much you agree or disagree with each statement using the following scale:
  </Typography>

  <Typography variant="body1" style={{ marginBottom: '20px', fontWeight: 'bold' }}>
    1 = Do not agree at all &nbsp;&nbsp;&nbsp;
    2 = Slightly agree &nbsp;&nbsp;&nbsp;
    3 = Neutral &nbsp;&nbsp;&nbsp;
    4 = Agree &nbsp;&nbsp;&nbsp;
    5 = Fully agree
  </Typography>

  {[
    "There have been times when I was willing to suffer some small harm so that I could punish someone else who deserved it.",
    "It’s wise to keep track of information that you can use against people later.",
    "There are things you should hide from other people to preserve your reputation.",
    "I insist on getting the respect I deserve.",
    "I want my rivals to fail.",
    "People who mess with me always regret it."
  ].map((statement, idx) => (
    <FormControl component="fieldset" key={idx} style={{ width: '100%', marginBottom: '24px' }}>
      <Typography variant="body1" style={{ marginBottom: '8px', textAlign: 'left', lineHeight: 1.4 }}>
        {statement}
      </Typography>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
  {[1, 2, 3, 4, 5].map((n) => (
    <label
      key={n}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '16px',
      }}
    >
      <input
        type="radio"
        name={`pers_${idx}`}
        value={n}
        onChange={() =>
          setDemographicsData({ ...demographicsData, [`pers_${idx}`]: n })
        }
        style={{ transform: 'scale(1.2)' }}
      />
      <Typography variant="body1">{n}</Typography>
    </label>
  ))}
</div>
    </FormControl>
  ))}
  
{/* 1.4 Experiment Explanation */}
<Typography
  variant="h5"
  gutterBottom
  style={{ marginBottom: '16px', color: '#1976d2', textAlign: 'left' }}
>
  1.4 Experiment Explanation
</Typography>

<Typography
  variant="body1"
  style={{ marginBottom: '24px', textAlign: 'left', lineHeight: 1.6 }}
>
  In this experiment, you will be asked to select 4 topics out of a list of 10. For each of
  the selected topics, you will be invited to write a comment expressing your thoughts or
  opinions. On each topic page, you may also see comments from previous participants who
  took part in this study (if any were submitted). Before you begin commenting, you will
  have the opportunity to choose an avatar so that your posts can be visually identified
  throughout the experiment. This avatar will serve as a consistent representation of you
  within the discussion environment. Importantly, your avatar will not enable your
  identification in any way. Do not include any personal or identifying information (e.g.,
  your name, email address, or contact details) in any of your written responses or
  messages during this study.
</Typography>

{/* 1.5 Topic Selection */}
<Typography
  variant="h5"
  gutterBottom
  style={{ marginBottom: '16px', color: '#1976d2', textAlign: 'left' }}
>
  1.5 Topic Selection
</Typography>

<Typography
  variant="body1"
  component="div"
  style={{ marginBottom: '24px', textAlign: 'left' }}
>
  <ul style={{ paddingLeft: '20px', marginTop: '8px', textAlign: 'left' }}>
    <li>Party Chairwoman Weidel (AfD) — “Classifying the AfD as ’extremist’ is a political attack on democracy”</li>
    <li>Green Youth Leader Nietzard (Die Grünen) — “We should beat the AfD with weapons”</li>
    <li>Minister of Economic Affairs and Energy Reiche (CDU) — “We must end heat‑pump subsidies”</li>
    <li>Chancellor Merz (CDU) — “Suspend family reunification to protect our communities”</li>
    <li>Chancellor Merz (CDU) — “We will not introduce a wealth tax”</li>
    <li>Bundestag President Klöckner (CDU) — “No rainbow flags during Pride month”</li>
    <li>Former Health Minister Lauterbach (SPD) — “Legalisation of cannabis is the right move”</li>
    <li>Defense Minister Pistorius (SPD) — “Increase military spending to truly support Ukraine”</li>
    <li>Culture Minister Weimer (Independent) — “Language is not a playground”</li>
    <li>Environment Minister Schneider (Die Grünen) — “Raising the Deutschland ticket to €63 is necessary”</li>
  </ul>
</Typography>

  
</Paper>

                {/*<Paper elevation={2} style={{ padding: '32px', marginBottom: '24px' }}>
                  <Typography variant="h5" gutterBottom style={{ marginBottom: '24px', color: '#1976d2' }}>
                    {CIVIL_ENGAGEMENT_INTRO}
                  </Typography>
                  
                  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
                    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
                      {CIVIL_VOTED_QUESTION} *
                    </FormLabel>
                    <RadioGroup
                      value={demographicsData.voted || ''}
                      onChange={(e) => setDemographicsData({...demographicsData, voted: e.target.value})}
                    >
                      {CIVIL_VOTED_OPTIONS.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={<Radio />}
                          label={option}
                          style={{ marginBottom: '8px' }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                  
                  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
                    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
                      {CIVIL_ACTIVITIES_QUESTION} *
                    </FormLabel>
                    <RadioGroup
                      value={demographicsData.politicalActivities || ''}
                      onChange={(e) => setDemographicsData({...demographicsData, politicalActivities: e.target.value})}
                    >
                      {CIVIL_ACTIVITIES_OPTIONS.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={<Radio />}
                          label={option}
                          style={{ marginBottom: '8px' }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>

               
                  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
                    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
                      {CIVIL_MEMBER_QUESTION} *
                    </FormLabel>
                    <RadioGroup
                      value={demographicsData.partyMember || ''}
                      onChange={(e) => setDemographicsData({...demographicsData, partyMember: e.target.value})}
                    >
                      {CIVIL_MEMBER_OPTIONS.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={<Radio />}
                          label={option}
                          style={{ marginBottom: '8px' }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Paper>*/}

                 {/*er elevation={2} style={{ padding: '32px', marginBottom: '32px' }}>
                   
                  <Typography variant="h5" gutterBottom style={{ marginBottom: '24px', color: '#1976d2' }}>
                    {NEWS_CONSUMPTION_INTRO}
                  </Typography>
                  
                   
                  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
                    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
                      {NEWS_FREQUENCY_QUESTION} *
                    </FormLabel>
                    <RadioGroup
                      value={demographicsData.newsFrequency || ''}
                      onChange={(e) => setDemographicsData({...demographicsData, newsFrequency: e.target.value})}
                    >
                      {NEWS_FREQUENCY_OPTIONS.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={<Radio />}
                          label={option}
                          style={{ marginBottom: '8px' }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>

                   
                  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
                    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
                      {NEWS_SOURCE_QUESTION} *
                    </FormLabel>
                    <RadioGroup
                      value={demographicsData.newsSource || ''}
                      onChange={(e) => setDemographicsData({...demographicsData, newsSource: e.target.value})}
                    >
                      {NEWS_SOURCE_OPTIONS.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={<Radio />}
                          label={option}
                          style={{ marginBottom: '8px' }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>

                   
                  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
                    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
                      {NEWS_TIME_QUESTION} *
                    </FormLabel>
                    <RadioGroup
                      value={demographicsData.newsTime || ''}
                      onChange={(e) => setDemographicsData({...demographicsData, newsTime: e.target.value})}
                    >
                      {NEWS_TIME_OPTIONS.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={<Radio />}
                          label={option}
                          style={{ marginBottom: '8px' }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Paper>*/}

                {/* Navigation Buttons */}
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreviousStage}
                    style={{ 
                      marginRight: '16px',
                      minWidth: '120px',
                      padding: '12px 24px'
                    }}
                  >
                    {BTN_PREVIOUS}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDemographicsSubmit}
                    style={{ 
                      minWidth: '120px',
                      padding: '12px 24px'
                    }}
                  >
                    {BTN_CONTINUE}
                  </Button>
                </div>
              </div>
            )}
            
            
            {currentStage === 'topicSelection' && (
  <div style={{ maxWidth: "800px", margin: "0 auto" }}>
    <Typography variant="h4" gutterBottom align="center" style={{ marginBottom: "32px" }}>
      Select 4 Topics
    </Typography>

    <Paper elevation={2} style={{ padding: "24px", marginBottom: "24px" }}>
      {TOPICS_LIST.map((topic, index) => (
      <div
          key={index}
          onClick={() => toggleTopicSelection(index)}
          style={{
          cursor: 'pointer',
          padding: '10px',
          marginBottom: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: selectedTopics.includes(index) ? '#d0f0ff' : 'white'
    }}
  >
          <Typography>{topic.label}</Typography>
        </div>
      ))}
    </Paper>

    <div style={{ textAlign: "center", marginTop: "32px" }}>
      <Button
        variant="outlined"
        onClick={() => setCurrentStage("demographics")}
        style={{ marginRight: "16px", minWidth: "120px", padding: "12px 24px" }}
      >
        Back
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={handleTopicSelectionSubmit}
        disabled={selectedTopics.length !== 4}
        style={{ minWidth: "120px", padding: "12px 24px" }}
      >
        Continue
      </Button>
    </div>
  </div>
)}
            
            
            {/*currentStage === 'weekly' && (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Typography variant="h4" gutterBottom align="center" style={{ marginBottom: '32px' }}>
                  {WEEKLY_INTRO}
                </Typography>
                
                <Paper elevation={2} style={{ padding: '32px', marginBottom: '24px' }}>
                  <Typography variant="h5" gutterBottom style={{ marginBottom: '24px', color: '#1976d2' }}>
                    {WEEKLY_POLITICAL_ISSUE_INTRO}
                  </Typography>
                  
                  <Typography variant="body1" paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                    <strong>Note:</strong> This section would contain weekly assessment questions about specific political topics.
                    The questions would be dynamically generated based on current political issues and would include:
                  </Typography>
                  
                  <ul style={{ marginLeft: '20px', marginBottom: '24px' }}>
                    <li style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                      Attitude toward specific political issues (0-100 scale)
                    </li>
                    <li style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                      Rating of political opponents on various traits (0-10 scales)
                    </li>
                    <li style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                      Social distance measures (comfort with political out-group members)
                    </li>
                  </ul>
                  
                  <Typography variant="body2" style={{ 
                    padding: '16px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    marginBottom: '24px'
                  }}>
                    <strong>Example Question:</strong><br />
                    "{WEEKLY_POLITICAL_ISSUE_QUESTION.replace('[specific political issue]', 'legal access to abortion')}"<br />
                    <em>{WEEKLY_POLITICAL_ISSUE_SCALE}</em>
                  </Typography>
                </Paper>

           
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreviousStage}
                    style={{ 
                      marginRight: '16px',
                      minWidth: '120px',
                      padding: '12px 24px'
                    }}
                  >
                    {BTN_PREVIOUS}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleWeeklySubmit}
                    style={{ 
                      minWidth: '120px',
                      padding: '12px 24px'
                    }}
                  >
                    {BTN_SUBMIT}
                  </Button>
                </div>
              </div>
            )*/}

            {currentStage === 'userSelection' && (
              <div>
                <Typography variant="h6" gutterBottom>
                  Select Your Profile
                </Typography>
                <Typography variant="body2" style={{ marginBottom: 20 }}>
                  Please choose one of the following user profiles to continue.
                </Typography>
                
                
                
                {userProfiles.length > 0 ? (
                  <div>
                    {userProfiles && userProfiles.length > 0 && userProfiles.slice(0, 4).map((user, index) => {
                      const optionValue = `option${index + 1}`;
                      
                      return (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          marginBottom: '16px',
                          padding: '12px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          backgroundColor: selectedUserOption === optionValue ? '#f0f8ff' : 'white'
                        }}>
                          <input 
                            type="radio" 
                            value={optionValue}
                            checked={selectedUserOption === optionValue}
                            onChange={(e) => setSelectedUserOption(e.target.value)}
                            style={{ accentColor: 'red', marginRight: '12px' }}
                          />
                          <img 
                            width="50" 
                            height="50"
                            src={user.profilePicture ? `${PF}${user.profilePicture}` : `${PF}person/noCover.png`}
                            alt={user.username || `Profile ${index + 1}`}
                            style={{ 
                              borderRadius: '50%',
                              marginRight: '12px',
                              objectFit: 'cover'
                            }}
                          />
                          <span style={{ fontSize: '16px' }}>
                            {user.username || `User ${index + 1}`}
                          </span>
                        </div>
                      );
                    })}
                    
                    {(!userProfiles || userProfiles.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        Loading user profiles...
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                      <Button
                        variant="outlined"
                        onClick={handlePreviousStage}
                        style={{ 
                          minWidth: '120px',
                          padding: '12px 24px'
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={submitNext}
                        disabled={!selectedUserOption}
                        style={{ 
                          minWidth: '120px',
                          padding: '12px 24px'
                        }}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Typography variant="body1">Loading user profiles...</Typography>
                  </div>
                )}
                
                
                
                
                
                
              </div>
            )}
          </div>
          
        </form>
      </div>
      
      <ToastContainer />
    </div>
  );
}

export default withStyles(styles)(Register);
