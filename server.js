const express = require('express')//npm install express
const app = express()
const ejs = require("ejs");
const bp = require("body-parser");
const port = 3000
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");
app.use(express.static('public'));
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();
// app.use(express.static('public'));
app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));


app.set('view engine',ejs);
app.use(bp.urlencoded({extended:true}));


app.get("/", function (req, res) {
  res.render(__dirname +"/views/"+ '/main.ejs');
});


app.get("/student", function (req, res) {
  res.render(__dirname +"/views/"+ '/studentLogin.ejs',{error1:""});
});


app.get("/faculty", function (req, res) {
  res.render(__dirname +"/views/"+ '/facultyLogin.ejs',{error2:""});
});

app.post("/studentSignup", function (req, res) {
  db.collection("StudentLogin").add({
    SEmail: req.body.SEmail,
    SPassword: req.body.SPassword,
  }).then(() => {
    res.render(__dirname+"//views"+'/adminDashboard.ejs',{msg:"SignUp successful!!!Now you can proceed to Login..."});
  })
});
app.post("/facultySignup", function (req, res) {
  db.collection("FacultyLogin").add({
    FEmail: req.body.FEmail,
    FPassword: req.body.FPassword,
  }).then(() => {
    res.render(__dirname+"//views"+'/adminDashboard.ejs',{msg:"SignUp successful!!!Now you can proceed to Login..."});
  })
});


app.post("/studentLogin", function (req, res) {
  db.collection("StudentLogin").where("SEmail", "==", req.body.Email).where("SPassword", "==", req.body.Password).get().then((docs)=>{
    if(docs.size>0){
      res.render(__dirname +"//views" +'/studentDashboard.ejs',{list:"",sub1:"",sub2:"",sub3:"",sub4:"",sub5:"",sub6:"",sub7:"",sub8:"",con1:"",con4:"",con2:"",con3:"",con5:"",con6:"",con7:"",con8:""});
    }
    else{
      res.render(__dirname+"//views"+'/studentLogin.ejs',{error1:"Login failed!!!Check your details or Contact yout administrator..."});
    }
  });
});
app.post("/facultyLogin", function (req, res) {
  if(req.body.Email === "admin@gmail.com" && req.body.Password === "admin"){
    res.render(__dirname+"//views"+"/adminDashboard.ejs",{msg:""});
  }
  else{
    db.collection("FacultyLogin").where("FEmail", "==", req.body.Email).where("FPassword", "==", req.body.Password).get().then((docs)=>{
      if(docs.size>0){
        res.render(__dirname +"//views" +'/facultyDashboard.ejs',{list:"",sub1:"",sub2:"",sub3:"",sub4:"",sub5:"",sub6:"",sub7:"",sub8:"",con1:"",con4:"",con2:"",con3:"",con5:"",con6:"",con7:"",con8:""});
      }
      else{
        res.render(__dirname+"//views"+'/facultyLogin.ejs',{error2:"Login failed!!!Check your details or Contact yout administrator..."});
      }
    });
  }
});
async function getdata() {
  const eventsArray = [];
  return db.collection("Events")
  .orderBy("time", "asc")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        eventsArray.push(doc.data());
      });
      return eventsArray; // Return the array of events
    })
    .catch((error) => {
      console.error("Error getting documents:", error);
      return []; // Return an empty array or handle the error as needed
    });
}
function getAndRenderEvents(res) {
  getdata()
    .then((result) => {
      res.render(__dirname + "/views/facultyDashboard.ejs", { list: result,sub1:"",sub2:"",sub3:"",sub4:"",sub5:"",sub6:"",sub7:"",sub8:"",con1:"",con4:"",con2:"",con3:"",con5:"",con6:"",con7:"",con8:""});
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).send("An error occurred.");
    });
}
app.post("/addEvent", async function (req, res) {
  try {
    const newEvent = req.body.events;
    const eventRef = db.collection("Events");
    const querySnapshot = await eventRef.where("events", "==", newEvent).get();
    if (querySnapshot.empty) {
      // No matching events found, safe to insert
      const docRef = await eventRef.add({ events: newEvent ,docID:null , time : new Date()});
      await docRef.update({ docID: docRef.id });
    } else {
      console.log("Event already exists:", newEvent);
    }
    // Refresh the list of events
    await getAndRenderEvents(res);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});

app.post("/deleteEvent", async function (req, res) {
  try {

    const eventId = req.body.eventId;
    // console.log("Received eventId:", eventId);
    if (!eventId || typeof eventId !== "string") {
      // console.log("Invalid eventId:", eventId);
      res.status(400).send("Invalid eventId");
      return;
    }

    // Construct the eventRef with the correct path
    const eventRef = db.collection("Events").doc(eventId);

    // Check if the event exists
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      // Event exists, delete it
      await eventRef.delete();
      // console.log("Event deleted:", eventId);
    } else {
      console.log("Event not found:", eventId);
    }

    // Refresh the list of events
    await getAndRenderEvents(res);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});
app.post("/updateEvent", async function (req, res) {
  try {
    const eventId = req.body.eventId;
    const updatedEvent = req.body.updatedEvent;
    // Check if eventId and updatedEvent are provided and valid
    if (!eventId || typeof eventId !== "string" || !updatedEvent) {
      return res.status(400).send("Invalid eventId or updatedEvent");
    }

    // Update the event data in your Firebase Firestore database
    const eventRef = db.collection("Events").doc(eventId);
    await eventRef.update({ events: updatedEvent });

    // Redirect back to the facultyDashboard or wherever you want to navigate
    res.redirect("/facultyDashboard");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});

app.post("/updateTimetable", async function (req, res) {
  const periodValue = req.body.period;
  const updateSubject = req.body.subject;
  const updateContent = req.body.content;

  // Check if periodValue is defined and not empty (you can adjust this condition as needed)
  if (periodValue !== undefined && periodValue !== '') {
    try {
      const querySnapshot = await db.collection("TimeTable").where("period", "==", periodValue).get();
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (doc) => {
          const newID = doc.id;
          // Process the document data as needed
          const eventRef1 = db.collection("TimeTable").doc(newID); // Use newID
          await eventRef1.update({ subject: updateSubject, content: updateContent });
          res.redirect("/facultyDashboard",);
        });
      } else {
        // Handle the case where no matching documents were found
        console.log("No matching documents found for Period:", periodValue);
        res.status(404).send("No matching documents found");
      }
    } catch (error) {
      console.error("Error querying Firestore:", error);
      // Handle the error as needed
      res.status(500).send("An error occurred");
    }
  } else {
    // Handle the case where req.body.period is not defined or empty
    res.status(400).send("Invalid Period value");
  }
});

async function getsubjects() {
  const subjects = [];
  return db.collection("TimeTable")
  .orderBy("period", "asc")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        subjects.push(doc.data().subject);
      });
      return subjects; 
    })
    .catch((error) => {
      console.error("Error getting documents:", error);
      return []; 
    });
}
async function getcontents() {
  const contents = [];
  return db.collection("TimeTable")
  .orderBy("period", "asc")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        contents.push(doc.data().content);
      });
      return contents; 
    })
    .catch((error) => {
      console.error("Error getting documents:", error);
      return []; 
    });
}
// app.get("/viewDashboard",async function(req,res){
//   res.render(__dirname + "/views/studentDashboard.ejs", { list: "",sub1:"",sub2:"",sub3:"",sub4:"",sub5:"",sub6:"",sub7:"",sub8:"",con1:"",con4:"",con2:"",con3:"",con5:"",con6:"",con7:"",con8:""});

// });

app.get("/facultyDashboard", async function (req, res) {
  try {
    const result = await getdata();
    const subjects = await getsubjects();
    const contents = await getcontents();
    res.render(__dirname +"//views" +'/facultyDashboard.ejs',{list:result,sub1:subjects[0],sub2:subjects[1],sub3:subjects[2],sub4:subjects[3],sub5:subjects[4],sub6:subjects[5],sub7:subjects[6],sub8:subjects[7],con1:contents[0],con4:contents[3],con2:contents[1],con3:contents[2],con5:contents[4],con6:contents[5],con7:contents[6],con8:contents[7]});

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});
app.get("/studentDashboard", async function (req, res) {
  try {
    const result = await getdata();
    const subjects = await getsubjects();
    const contents = await getcontents();
    res.render(__dirname +"//views" +'/studentDashboard.ejs',{list:result,sub1:subjects[0],sub2:subjects[1],sub3:subjects[2],sub4:subjects[3],sub5:subjects[4],sub6:subjects[5],sub7:subjects[6],sub8:subjects[7],con1:contents[0],con4:contents[3],con2:contents[1],con3:contents[2],con5:contents[4],con6:contents[5],con7:contents[6],con8:contents[7]});

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred.");
  }
});



app.listen(3000);