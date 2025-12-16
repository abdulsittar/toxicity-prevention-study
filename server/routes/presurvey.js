const SelectedUsers = require('../models/SelectedUser');
const PreSurvey = require('../models/PreSurvey');
const User = require('../models/User');
const IDStorage = require('../models/IDStorage');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const PostSurvey = require('../models/PostSurvey');
var ObjectId = require('mongodb').ObjectID;
const sanitizeHtml = require('sanitize-html');
const logger = require('../logs/logger');

const verifyToken = require('../middleware/verifyToken');

function sanitizeInput(input) {
    return sanitizeHtml(input, {
        allowedTags: [], // No HTML allowed
        allowedAttributes: {} // No attributes allowed
    });
}

// Submit pre survey 
router.post('/psurvey/:uniqId', async (req, res) => {
    console.log("PreSurvey Received:", req.body);

    try {
        const idstor = await IDStorage.findOne({ yourID: req.params.uniqId });
        if (!idstor) {
            return res.status(404).json({ error: "Unique ID not found in IDStorage" });
        }

        // Build survey object exactly matching new schema
        const newSurvey = new PreSurvey({
            uniqueId: idstor._id,
            prolificId: req.body.prolificId,
            age: req.body.age,
            gender: req.body.gender,
            political: req.body.political,
            personality: req.body.personality || [],
            completedAt: req.body.completedAt || new Date(),
            surveyVersion: req.body.surveyVersion || "3-stage-v1"
        });

        const savedSurvey = await newSurvey.save();

        // Mark IDStorage as unavailable
        await IDStorage.updateOne(
            { _id: idstor._id },
            { $set: { available: false } }
        );

        res.status(200).json(savedSurvey);
    } catch (err) {
        console.error("Error saving PreSurvey:", err.message);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

    
// Submit pre survey
router.post('/postsurvey/:uniqId',verifyToken,  async (req, res) => {
    console.log('Data received', { data: req.body });
    try{
        console.log("herelkjkl");
        //console.log(req.params.uniqId);
        const idstor = await IDStorage.find({"yourID": req.params.uniqId});
        
        const fid = idstor[0]
        //console.log(fid)
        if(fid._id){
        const newSurvey = new PostSurvey({
            "uniqueId": fid["_id"],
            "q1": req.body.q1,
            "q2": req.body.q2,
            "q3": req.body.q3,
            "q4": req.body.q4,
            "q5": req.body.q5,
            "q6": req.body.q6,
            "q7": req.body.q7,
            "q8": req.body.q8,
            "q9": req.body.q9,
            "q10": req.body.q10,
            "q11": req.body.q11,
            "q12": req.body.q12,
            "q13": req.body.q13,
            "q14": req.body.q14,
            "q15": req.body.q15,
            "q16": req.body.q16,
            "q17": req.body.q17
        });
        console.log("newSurvey")
        //console.log(newSurvey)
        // save user and send response
        const survey = await newSurvey.save();
        //console.log(survey)
        res.status(200).json(survey);

    }else{
        res.status(400).json("Failed");

    }
    
    } catch (err) {
        console.error('Error saving data', { error: err.message });
        console.log(err)
        res.status(500).json(err);
    }
    });

// LOGIN
router.post('/isSubmitted123/:val', async (req, res) => {
    console.log('Data received', { data: req.body });
    try {
        console.log("Received value:", req.params.val);

        // Find the ID in IDStorage
        const idstor = await IDStorage.find({ "yourID": req.params.val });
        if (!idstor || idstor.length === 0) {
            console.log("ID not found in IDStorage");
            res.status(404).json({ error: "ID not found" });
            return;
        }

        const fid = idstor[0];
        console.log("FID object:", fid);

        // Check if there's a PreSurvey entry for the given ID
        const idExists = await PreSurvey.find({ "uniqueId": fid["_id"] });
        console.log("PreSurvey result:", idExists);

        //if (idExists.length > 0) {
            console.log("ID exists in PreSurvey");

            // Check if a User exists with the same ID
            const userExist = await User.find({ "uniqueId": fid["_id"] });
            console.log("User result:", userExist);

            if (userExist[0]) {
                console.log("User found");
                var usr ={}
                const existingSurvey = await PostSurvey.findOne({ userId: req.params.userId });
                console.log(existingSurvey);
                
                if(existingSurvey){
                if (existingSurvey[0].prolific_code) {
                    usr = { "data": true, "login": true, "user": userExist[0], "code": existingSurvey[0].prolific_code};
                    
                    
                }else{
                    usr = { "data": true, "login": true, "user": userExist[0] };
                    
                    
                }
                res.status(200).json(usr);
            }else{
                usr = { "data": true, "login": true, "user": userExist[0] };
                res.status(200).json(usr);
            }
                
            } else {
                    //const ttt = idExists[0]
                    //console.log("ttt.q1:", ttt.q1);
                    //if(ttt.q1 == '' && ttt.q2 == '' && ttt.q3 == ''){
                    //    res.status(200).json("");
                    //}else {
            
                const idstor = await IDStorage.find({ "yourID": req.params.val }).lean();
                console.log("FID:", idstor[0]);
                console.log("FID version:", idstor[0].version);

                /*const users = await SelectedUsers.aggregate([
                    { $match: { available: true } },
                    {
                        $facet: {
                            version1: [
                                { $match: { version: idstor[0].version } },
                                { $sample: { size: 4 } }
                            ]
                        }
                    },
                    {
                        $project: {
                            users: { $concatArrays: ["$version1"] }
                        }
                    }
                ]);*/
                
                    const users = await SelectedUsers.aggregate([
                    {                                             
                        $match: {
                            available: true,           // Ensure users are available
                            version: String(idstor[0].version) // Ensure the version matches the given version
                        }
                    },
                    {
                        $group: {
                            _id: {username_second: "$username_second", username: "$username"},     // Group by username
                            user: { $first: "$$ROOT" } // Select the first document for each username
                        }
                    },
                    {
                        $sample: { size: 20 } // Sample more than the required size to allow further deduplication
                    },
                    {
                        $group: {
                            _id: "$user.username", // Group by `username` to ensure usernames are unique
                            user: { $first: "$user" } // Keep the first user for each unique username
                        }
                    },
                    {
                        $limit: 6 // Limit the result to 4 unique users
                    }
                ]);
                console.log("Selected Users before mapping:", users);
                const result = users.map(user => ({
                    username: user.username,
                    profilePicture: user.profilePicture,
                    available: user.available,
                    username_second: user.username_second,
                    version: user.version
                }));
                
                console.log("Selected Users:", users[0][0]);
                
                const users2 = [users[0],users[1],users[2],users[3] ]
                
                console.log("Selected Users:", users2);

                const usr = {
                    "data": true,
                    "users": users2.length > 0 ? users2 : []
                };
                res.status(200).json(usr);
            //}
            }
       // } else {
        //    console.log("ID does not exist in PreSurvey");
        //    res.status(200).json({ "data": false });
        //}
    } catch (err) {
        console.error('Error saving data', { error: err.message });
        console.log("Error:", err);
        res.status(500).json({ error: "Internal server error", details: err });
    }
});

router.post('/isSubmitted/:val', async (req, res) => {
    console.log('Data received', { data: req.body });
    try {
        console.log("Received value:", req.params.val);

        // Find the ID in IDStorage
        const idstor = await IDStorage.find({ "yourID": req.params.val });
        if (!idstor || idstor.length === 0) {
            console.log("ID not found in IDStorage");
            res.status(404).json({ error: "ID not found" });
            return;
        }

        const fid = idstor[0];
        console.log("FID object:", fid);

        // Check if there's a PreSurvey entry for the given ID
        const idExists = await PreSurvey.find({ "uniqueId": fid["_id"] });
        console.log("PreSurvey result:", idExists);

        console.log("ID exists in PreSurvey");

        // Check if a User exists with the same ID
        const userExist = await User.find({ "uniqueId": fid["_id"] });
        console.log("User result:", userExist);

        if (userExist[0]) {
            console.log("User found");
            let usr = {};
            const existingSurvey = await PostSurvey.findOne({ userId: req.params.userId });
            console.log(existingSurvey);

            if (existingSurvey) {
                if (existingSurvey[0]?.prolific_code) {
                    usr = { data: true, login: true, user: userExist[0], code: existingSurvey[0].prolific_code };
                } else {
                    usr = { data: true, login: true, user: userExist[0] };
                }
                res.status(200).json(usr);
            } else {
                usr = { data: true, login: true, user: userExist[0] };
                res.status(200).json(usr);
            }

        } else {
            const idstor = await IDStorage.find({ "yourID": req.params.val }).lean();
            console.log("FID:", idstor[0]);
            console.log("FID version:", idstor[0].version);

            // Get available users and add counter to duplicate usernames
            const users = await SelectedUsers.aggregate([
                {
                    $match: {
                        available: true,
                        version: String(idstor[0].version)
                    }
                },
                {
                    $group: {
                        _id: "$username",
                        users: { $push: "$$ROOT" } // Push all duplicates
                    }
                },
                { $unwind: { path: "$users", includeArrayIndex: "counter" } }, // Add counter
                {
                    $addFields: {
                        "users.uniqueUsername": {
                            $concat: ["$users.username", " ", { $toString: { $add: ["$counter", 1] } }]
                        }
                    }
                },
                { $replaceRoot: { newRoot: "$users" } },
                { $sample: { size: 20 } }, // sample to allow further deduplication if needed
                { $limit: 6 } // final limit
            ]);

            const result = users.map(u => ({
                username: u.uniqueUsername, // use the unique username with counter
                profilePicture: u.profilePicture,
                available: u.available,
                username_second: u.username_second,
                version: u.version
            }));

            res.status(200).json({ data: true, users: result });
        }

    } catch (err) {
        console.error('Error saving data', { error: err.message });
        console.log("Error:", err);
        res.status(500).json({ error: "Internal server error", details: err });
    }
});



router.post('/topics/isSubmitted/:val', async (req, res) => {
  console.log("Received TOPIC check:", req.params.val);

  try {
    // Step 1: Find ID in IDStorage
    const idstor = await IDStorage.findOne({ yourID: req.params.val });
    if (!idstor) {
      return res.status(404).json({ error: "ID not found" });
    }

    // Step 2: Check if user already exists
    const userExists = await User.findOne({ uniqueId: idstor._id });

    if (userExists) {
      return res.status(200).json({
        login: true,
        user: userExists
      });
    }

    // Step 3: Return updated topics list
    const topics = [
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
    ];

    return res.status(200).json({
      data: true,
      topics
    });

  } catch (err) {
    console.error("Error in topics API:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/topics/saveSelection", async (req, res) => {
  const { uniqId, topics } = req.body;

  if (!topics || topics.length !== 4) {
    return res.status(400).json({ error: "Exactly 4 topics required." });
  }
  
  try {
   const idstor = await IDStorage.findOne({ yourID: req.params.val });
    if (!idstor) {
      return res.status(404).json({ error: "ID not found" });
    }
    
    const userExists = await User.findOne({ uniqueId: idstor._id });

    if (!userExists) {
      return res.status(404).json({ error: "User not found." });
    }

  
    // find user by uniqueId
    const user = await User.findOne({ uniqueId: uniqId });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.selectedTopics = topics;
    await user.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Save topics error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

    module.exports = router;