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
  political: 0,
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
  const requiredFields = ['prolificId', 'age', 'gender'];

  const missingFields = requiredFields.filter(
    field => !demographicsData[field] && demographicsData[field] !== 0
  );

  // Separately check political since 0 is a valid value
  const isPoliticalMissing = demographicsData.political === undefined || demographicsData.political === null;

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
    label: "Parteivorsitzende Weidel (AfD) — „Die Einstufung der AfD als extremistisch ist ein politischer Angriff auf die Demokratie."
  },
  {
    id: "1",
    label: "Vorsitzende der Grünen Jugend Nietzard (Die Grünen) — „Wir sollten die AfD mit Waffen bekämpfen."
  },
  {
    id: "2",
    label: "Wirtschafts- und Energieminister Reiche (CDU) — „Wir müssen die Förderung für Wärmepumpen beenden."
  },
  {
    id: "3",
    label: "Bundeskanzler Merz (CDU) — „Familiennachzug aussetzen, um unsere Gemeinden zu schützen."
  },
  {
    id: "4",
    label: "Bundeskanzler Merz (CDU) — „Wir werden keine Vermögenssteuer einführen."
  },
  {
    id: "5",
    label: "Bundestagspräsidentin Klöckner (CDU) — „Keine Regenbogenflaggen während des Pride-Monats."
  },
  {
    id: "6",
    label: "Ex-Gesundheitsminister Lauterbach (SPD) — „Die Legalisierung von Cannabis ist der richtige Schritt."
  },
  {
    id: "7",
    label: "Verteidigungsminister Pistorius (SPD) — „Militärausgaben erhöhen, um die Ukraine wirklich zu unterstützen."
  },
  {
    id: "8",
    label: "Kulturminister Weimer (Unabhängig) — „Sprache ist kein Spielplatz."
  },
  {
    id: "9",
    label: "Umweltminister Schneider (Die Grünen) — „Eine Erhöhung des Deutschlandtickets auf 63 € ist notwendig."
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
      style={{ fontSize: '16px', lineHeight: 1.6, textAlign: 'justify' }}
    >
      Liebe Teilnehmerin, lieber Teilnehmer,
      <br /><br />
      Willkommen zur EU-finanzierten Studie „Twon – Twin of an online social network“ der Fakultät für Sozial- und Verhaltenswissenschaften der Universität Amsterdam (UvA) in Zusammenarbeit mit der Universität Trier in Deutschland und dem Jožef-Stefan-Institut (JSI) in Slowenien. Bitte lesen Sie den folgenden Text sorgfältig durch, bevor Sie beginnen. Falls etwas unklar ist, zögern Sie nicht, uns per E-Mail zu kontaktieren: 
      François t’Serstevens (f.tserstevens@uva.nl). Wir beantworten Ihre Fragen gerne.
    </Typography>

    {/* Objective of the Study */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'justify' }}
    >
      Ziel der Studie
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'justify' }}
    >
      Das Ziel dieser Studie ist es, besser zu verstehen, wie Menschen auf Online-Diskussions-plattformen kommunizieren und interagieren. Wir interessieren uns insbesondere dafür, wie bestimmte Plattformfunktionen beeinflussen können, wie Nutzerinnen und Nutzer ihre Meinungen äußern und aufeinander reagieren. Die Erkenntnisse dieser Forschung werden dazu beitragen, zukünftige soziale Plattformen so zu gestalten, dass sie konstruktive und anregende Online-Diskussionen fördern
    </Typography>

    {/* Procedure of the Study */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'justify' }}
    >
      Ablauf der Studie
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'justify' }}
    >
      In dieser Studie nehmen Sie an einer kurzen Reihe simulierter Online-Diskussionen auf einer vom Projektteam entwickelten Forschungsplattform teil. Sie werden gebeten, kurze Beiträge zu lesen und so zu antworten, wie Sie es normalerweise auf einer sozialen Plattform tun würden. In einigen Fällen erhalten Sie nach dem Absenden Ihres Beitrags einen Überarbeitungsvorschlag, der von einem KI-Sprachmodell generiert wurde. Sie können frei entscheiden, ob Sie Ihre ursprüngliche Version posten, die Überarbeitung übernehmen oder weitere Änderungen vornehmen. Die Entscheidung ist in jedem Schritt vollständig Ihnen überlassen.

      <br /><br />
      Vor und nach den Diskussionsrunden füllen Sie kurze Fragebögen zu Ihren Erfahrungen und Ihrer Person aus. Die gesamte Studiendauer beträgt einschließlich Fragebögen und mehrerer kurzer Gesprächsrunden etwa 15–20 Minuten.

      <br /><br />
      Sie erhalten die über Prolific vereinbarte Vergütung, nachdem Sie alle Studienteile abgeschlossen haben.
    </Typography>

    {/* Voluntary Participation */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'justify' }}
    >
      Freiwillige Teilnahme
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'justify' }}
    >
      Ihre Teilnahme ist freiwillig. Wenn Sie abbrechen möchten, können Sie einfach den Browser schließen.
      <br /><br />
      Auch nach Ihrer Teilnahme können Sie noch entscheiden, dass Ihre Daten für das Projekt nicht verwendet werden dürfen. In diesem Fall können Sie Ihre Einwilligung widerrufen. Um nach der Teilnahme zu widerrufen, kontaktieren Sie bitte Prolific über den bereitgestellten Link. Sie müssen keinen Grund angeben. Beachten Sie bitte, dass wir Ihre Teilnehmer-ID nach Abschluss der Datenerhebung aus dem Datensatz entfernen, wodurch die Forschungsdaten anonymisiert werden. Ab diesem Zeitpunkt ist es nicht mehr möglich, Ihre Daten im Falle eines Widerrufs zu löschen.
    </Typography>

    {/* Data / Privacy */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'justify' }}
    >
      Was passiert mit meinen Daten?
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'justify' }}
    >
      In dieser Studie sammelt die Universität Amsterdam keine personenbezogenen Daten direkt von Ihnen. Wir arbeiten mit einem Drittanbieter zusammen, der die Forschungsdaten erhebt, und haben vertragliche Vereinbarungen getroffen, um Ihre Privatsphäre zu schützen. Forschungsdaten können veröffentlicht und für weitere Forschung wiederverwendet werden, jedoch ausschließlich in einer Form, die keinen Rückschluss auf Ihre Person zulässt.
    </Typography>

    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'justify' }}
    >
      Wie lange werden meine Daten gespeichert?
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'justify' }}
    >
      Die anonymisierten Forschungsdaten und zugehörigen Materialien werden mindestens 10 Jahre nach Abschluss des Projekts sicher archiviert.
    </Typography>

    {/* Further Information */}
    <Typography
      variant="h5"
      gutterBottom
      style={{ marginBottom: '12px', color: '#1976d2', textAlign: 'justify' }}
    >
      Weitere Informationen
    </Typography>
    <Typography
      variant="body1"
      paragraph
      style={{ fontSize: '14px', lineHeight: 1.6, textAlign: 'justify' }}
    >
      Wenn Sie Fragen zur Studie haben, wenden Sie sich bitte an den verantwortlichen Forscher: François t’Serstevens (f.tserstevens@uva.nl).
      <br /><br />
      Wenn Sie Beschwerden über die Studie oder die Forschung haben, kontaktieren Sie bitte das Ethics Review Board von ASCoR, Adresse: Sekretariat des ASCoR Ethics Committee, Universität Amsterdam, Postfach 15793, 1001 NG Amsterdam; Telefon: 020-525 3680; E-Mail: ascor-secr-fmg@uva.nl. Ihre Beschwerde wird vertraulich behandelt.
      <br /><br />
      Wenn Sie Beschwerden über Ihre personenbezogenen Daten haben, wenden Sie sich bitte an die oder den Datenschutzbeauftragten der Universität Amsterdam unter fg@uva.nl.

      <br /><br />
      Mit freundlichen Grüßen,
      <br />
      François t’Serstevens
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
    Bitte geben Sie unten Ihre Prolific-ID ein (wird nur zur Teilnahmebestätigung verwendet und nicht mit Antworten verknüpft):  </Typography>
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
    1.2 Demografische Informationen
  </Typography>
  <Typography variant="body1" style={{ marginBottom: '24px' }}>
    Bitte beantworten Sie die folgenden statistischen Fragen zur Ihrer Person, bevor Sie mit der Hauptaufgabe beginnen:
  </Typography>

  {/* Age */}
  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
      1. Wie alt sind Sie? *
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
          Ganzzahl zwischen 18–99
        </Typography>
    )}
  </FormControl>

  {/* Gender */}
  <FormControl component="fieldset" style={{ width: '100%', marginBottom: '24px' }}>
    <FormLabel component="legend" style={{ marginBottom: '12px', fontSize: '16px' }}>
      2. Was ist Ihr Geschlecht? *
    </FormLabel>
    <RadioGroup
      value={demographicsData.gender || ''}
      onChange={(e) =>
        setDemographicsData({ ...demographicsData, gender: e.target.value })
      }
    >
      {["Männlich", "Weiblich", "Divers", " Keine Angabe"].map((option, index) => (
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
      3. Politische Einstellung: In der Politik reden die Leute häufig von „links" und „rechts". Bitte ordnen Sie sich auf der folgenden Skala ein. (−5 = Links, +5 = Rechts)
    </FormLabel>
    <Slider
      min={-5}
      max={5}
      step={1}
      value={demographicsData.political !== undefined ? demographicsData.political : 0}
      onChange={(e, value) =>
        setDemographicsData({ ...demographicsData, political: value })
      }
      valueLabelDisplay="auto"
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginTop: '4px' }}>
      <span>sehr links</span>
      <span>neutral</span>
      <span>sehr rechts</span>
    </div>
  </FormControl>

  {/* 1.3 Personality Test */}
  <Typography variant="h5" gutterBottom style={{ marginBottom: '16px', color: '#1976d2' }}>
    1.3 Persönlichkeitstest
  </Typography>

  <Typography variant="body1" style={{ marginBottom: '12px' }}>
    Unten finden Sie mehrere Aussagen über Einstellungen und Verhaltensweisen. Bitte geben Sie an, inwieweit Sie jeder Aussage zustimmen oder nicht zustimmen, basierend auf der folgenden Skala:  </Typography>

  <Typography variant="body1" style={{ marginBottom: '20px', fontWeight: 'bold' }}>
    1 = Stimme überhaupt nicht zu &nbsp;&nbsp;&nbsp;
    2 =  Stimme nicht zu &nbsp;&nbsp;&nbsp;
    3 = Neutral &nbsp;&nbsp;&nbsp;
    4 = Stimme zu &nbsp;&nbsp;&nbsp;
    5 = Stimme voll zu

  </Typography>

  {[
    "Es gab Zeiten, in denen ich bereit war, einen kleinen Schaden in Kauf zu nehmen, um jemanden zu bestrafen, der es verdient hatte",
    "Es ist klug, Informationen zu sammeln, die man später gegen Menschen verwenden kann.",
    "Man sollte bestimmte Dinge vor anderen verbergen, um seinen Ruf zu schützen.",
    "Ich bestehe darauf, den Respekt zu bekommen, den ich verdiene.",
    "Ich möchte, dass meine Rivalen scheitern.",
    "Menschen, die sich mit mir anlegen, bereuen es immer."
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
  1.4  Erklärung des Experiments
</Typography>

<Typography
  variant="body1"
  style={{ marginBottom: '24px', textAlign: 'left', lineHeight: 1.6 }}
>
Nachfolgend wählen Sie bitte vier Themen aus einer Liste von zehn Themen aus. Im Anschluss bitte wir Sie, zu jedem ausgewählten Thema in einem Kommentar Ihre Meinung oder Ihre Gedanken äußern.
<br /><br />
Auf jeder Themenseite können Sie auch Kommentare von früheren Teilnehmenden sehen (falls bereits welche eingereicht wurden).
<br /><br />
Bevor Sie mit dem Kommentieren beginnen, haben Sie die Möglichkeit, einen Avatar auszuwählen, damit Ihre Beiträge während des Experiments visuell erkennbar sind. Dieser Avatar repräsentiert Sie innerhalb der Diskussionsumgebung, aber ermöglicht keinerlei Identifikation.
<br /><br />
<strong>Bitte geben Sie in Ihren Kommentaren keine persönlichen oder identifizierenden Informationen an </strong>(z. B. Name, E-Mail-Adresse oder andere Kontaktdaten).
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
    <Typography variant="h4" gutterBottom align="center" style={{ marginBottom: "16px" }}>
      1.5 Themenauswahl
    </Typography>
    
    <Typography variant="body1" style={{ marginBottom: "24px", textAlign: "left", lineHeight: 1.6 }}>
      Bitte wählen Sie vier Themen aus der untenstehenden Liste aus. Anschließend werden Sie gebeten, einen Kommentar zu allen vier ausgewählten Themen zu schreiben.
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
