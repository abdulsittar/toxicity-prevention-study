import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext.js";
import Topbar from "../../components/topbar/Topbar.js";
import { withStyles } from '@material-ui/core/styles';
import { Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Divider, TextField, Button } from "@mui/material";
import { styles } from './postsurveyStyle.js';
import { ToastContainer } from 'react-toastify';
import { useParams } from 'react-router';
import axios from "axios";

function Postsurvey({ classes }) {
  const { user: currentUser } = useContext(AuthContext);
  const username = useParams().username;
  const PF = process.env.REACT_APP_PUBLIC_FOLDER;

  // Survey state
  const [usr, setUsr] = useState({});
  const [usabilityValues, setUsabilityValues] = useState({ q1: "", q2: "" });
  const [manipulationValues, setManipulationValues] = useState({
    q1: "", q2: "", q3: "", q4: "", q5: ""
  });
  const [feedbackText, setFeedbackText] = useState("");

  const handleUsabilityChange = (e) => {
    setUsabilityValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleManipulationChange = (e) => {
    setManipulationValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = {
        uniqueId:currentUser.uniqueId,
        username,
        usability: usabilityValues,
        manipulation: manipulationValues,
        feedback: feedbackText,
      }; 
      
      console.log("Submitting survey data:", data); 
      const res = await axios.post(`/postsurvey/submit/${currentUser._id}`, {data, headers: { 'auth-token': token } });
      
      if (res.status === 200) {
        const code = res.data.prolific_code;
        alert(`🎉 Survey submitted successfully!\n\nYour Prolific ID is:\n\n${code}`);
      }
    } catch (err) {
      console.error(err);
      alert(`🎉 You have already submitted the survey!\n\nYour Prolific ID is:\n\n${err}`);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/users?username=${username}`, { headers: { 'auth-token': token } });
      setUsr(res.data);
    };
    fetchUser();
  }, [username]);

  return (
    <>
      <Topbar isProfile="true" showRefreshIcon={false} />
      <ToastContainer />
      <div className={classes.profile}>
        <div className={classes.profileRight}>
          <div className={classes.profileRightTop}>
            <div className={classes.profileCover}>
              <img
                className={classes.profileCoverImg}
                src={usr.coverPicture ? PF + usr.coverPicture : PF + "person/noCover.png"}
                alt=""
              />
              <img
                className={classes.profileUserImg}
                src={usr.profilePicture ? PF + usr.profilePicture : PF + "person/noAvatar.png"}
                alt=""
              />
            </div>
            <div className={classes.profileInfo}>
              <h4 className={classes.profileInfoName}>{usr.username}</h4>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
        <Typography variant="h4" gutterBottom style={{ color: "#1976d2" }}>
          Post-Survey
        </Typography>

        {/* 3.1 Usability Check */}
        <Typography variant="h5" gutterBottom style={{ marginTop: "24px", color: "#1976d2" }}>
          3.1 Usability Check
        </Typography>
        <FormControl component="fieldset">
          <FormLabel component="legend">The topics were relevant.</FormLabel>
          <RadioGroup row name="q1" value={usabilityValues.q1} onChange={handleUsabilityChange}>
            {[1, 2, 3, 4, 5].map(val => (
              <FormControlLabel key={val} value={val.toString()} control={<Radio />} label={val} />
            ))}
          </RadioGroup>

          <FormLabel component="legend">The comments I read were connected to the initial post.</FormLabel>
          <RadioGroup row name="q2" value={usabilityValues.q2} onChange={handleUsabilityChange}>
            {[1, 2, 3, 4, 5].map(val => (
              <FormControlLabel key={val} value={val.toString()} control={<Radio />} label={val} />
            ))}
          </RadioGroup>
        </FormControl>

        <Divider style={{ margin: "24px 0" }} />

        {/* 3.2 Manipulation Check */}
        <Typography variant="h5" gutterBottom style={{ color: "#1976d2" }}>
          3.2 Manipulation Check
        </Typography>
        <FormControl component="fieldset">
          {[
            "The suggested rewrites improved spelling.",
            "The suggested rewrites improved readability.",
            "The suggested rewrites made my comments more civil.",
            "The suggested rewrites preserved my original opinion.",
            "The suggested rewrites were useful overall."
          ].map((statement, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <FormLabel component="legend">{statement}</FormLabel>
              <RadioGroup row name={`q${i+1}`} value={manipulationValues[`q${i+1}`]} onChange={handleManipulationChange}>
                {[1, 2, 3, 4, 5].map(val => (
                  <FormControlLabel key={val} value={val.toString()} control={<Radio />} label={val} />
                ))}
              </RadioGroup>
            </div>
          ))}
        </FormControl>

        <Divider style={{ margin: "24px 0" }} />

        {/* 3.3 Feedback / Debriefing */}
<Typography variant="h5" gutterBottom style={{ color: "#1976d2", marginTop: "24px" }}>
  3.3 Feedback / Debriefing
</Typography>

<TextField
  label="Your feedback"
  multiline
  rows={4}
  variant="outlined"
  fullWidth
  value={feedbackText}
  onChange={(e) => setFeedbackText(e.target.value)}
  placeholder="Share your thoughts or concerns about the study here."
  style={{ marginBottom: "16px" }}
/>

<Typography variant="body1" paragraph style={{ fontSize: '14px', lineHeight: 1.6 }}>
  Thank you for participating in this study. We would like to explain the full purpose
  of the experiment. This study aimed to understand how people communicate in online
  discussions and how toxic or uncivil language spreads in such environments.
  Some of the posts and the first 1–3 comments in each conversation were created by
  the research team. These initial comments were designed to elicit natural responses from
  participants while reflecting the kind of uncivil language that can appear on social media.
  Subsequent messages were written by participants like you, and in some conditions, you
  were offered optional AI-generated rewrites designed to reduce offensive or harsh wording
  while keeping the original meaning intact.
  The purpose of the study was to explore how proactive, user-centered interventions—like
  AI suggestions—can reduce harmful language in online conversations without restricting
  users’ freedom of expression.
  Your responses remain fully anonymous, and all results will be reported in aggregate. If
you have any questions or wish to withdraw your data, please contact f.tserstevens@uva.nl.
</Typography>

<Button
  variant="contained"
  color="primary"
  style={{ marginTop: "16px" }}
  onClick={handleSubmit}
>
  Submit Post-Survey
</Button>
      </div>
    </>
  );
}

export default withStyles(styles)(Postsurvey);
