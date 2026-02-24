# Toxicity Prevention Study Platform

This repository contains a web platform used for a study on toxicity prevention in online commenting.
Participants move through a fixed sequence of pages, interact with LLM-based comment suggestions, and complete pre/post study questionnaires.

Website: [https://socialapp.ijs.si/](https://socialapp.ijs.si/)

## Participant Flow

1. Landing page
2. Consent form
3. Pre-survey
4. Topic selection (choose 4 topics)
5. Username selection
6. Feed and per-post interaction loop:
    - You are shown one post/article at a time
    - You write a comment for that post
    - The system provides an LLM suggestion to reduce toxicity
    - You accept or reject the suggestion
    - You complete a questionnaire for that specific post
    - You are then moved to the next post
7. Repeat this loop until all 4 posts (from the 4 selected topics) are completed
8. After the 4th post questionnaire, you are redirected to the post-survey

## App Structure

- `client/`: React frontend for participant flow pages and feed interactions
- `server/`: Node/Express backend, APIs, and MongoDB models
- `server/routes/`: API route definitions
- `server/controllers/`: request handlers and study logic
- `server/models/`: MongoDB schemas for users, posts, surveys, and interaction data
- `screenshots/toxicity screenshots/`: UI screenshots used in this README

## Screenshots by Study Step

### 1) Landing Page
![Landing Page](screenshots/toxicity%20screenshots/landingpage.png)

### 2) Consent Form
![Consent Form](screenshots/toxicity%20screenshots/consent.png)

### 3) Pre-Survey
![Pre-Survey](screenshots/toxicity%20screenshots/presurvey.png)

### 4) Topic Selection
![Choose Topics](screenshots/toxicity%20screenshots/topics.png)

### 5) Username Selection
![Choose Username](screenshots/toxicity%20screenshots/username.png)

### 6) Feed
![Feed](screenshots/toxicity%20screenshots/feed.png)

### 7) Comment Editing with LLM Suggestion
![Comment Suggestion Intervention](screenshots/toxicity%20screenshots/comment_changing_suggestion.png)

### 8) Post/Article Questionnaire
![Article Questionnaire](screenshots/toxicity%20screenshots/article_questionaire.png)

### 9) Post-Survey
![Post-Survey](screenshots/toxicity%20screenshots/postsurvey.png)

## Local Development (Quick Start)

1. Ensure MongoDB is running and environment variables are configured.
2. Install server dependencies:
    - `cd server && npm install`
3. Install client dependencies:
    - `cd client && npm install`
4. Run server and client (in separate terminals):
    - Server: `cd server && npm start`
    - Client: `cd client && npm run build`

## Deployment Note

The production deployment is available on:

- [https://socialapp.ijs.si/](https://socialapp.ijs.si/)

When started on your server, backend logs may show entries similar to:

- `Server started on port 1077 and https://socialapp.ijs.si/`
- `Connected to the database successfully!`


