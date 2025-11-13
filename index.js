// index.js

require('dotenv').config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wejbxsr.mongodb.net/?appName=Cluster0`;

console.log(uri); 

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected Successfully");

  
    const db = client.db("freelancerMarketPlaces");
    const allJobsCollection = db.collection("AllJobs");
    const acceptedTasksCollection = db.collection("AcceptedTasks");


    app.get("/alljobs", async (req, res) => {
      const jobs = await allJobsCollection.find().sort({ _id: -1 }).toArray();
      res.send(jobs);
    });

 

    app.get("/jobs", async (req, res) => {
      const limit = parseInt(req.query.limit) || 6;
      const jobs = await allJobsCollection
        .find()
        .sort({ _id: -1 })
        .limit(limit)
        .toArray();
      res.send(jobs);
    });


    app.post("/alljobs", async (req, res) => {
      const newJob = req.body;

      // Validate required fields
      if (!newJob.title || !newJob.category || !newJob.summary) {
        return res
          .status(400)
          .send({ message: "Missing required fields: title, category, summary" });
      }

      // Add timestamp
      newJob.postedDate = new Date();

      const result = await allJobsCollection.insertOne(newJob);
      res.send(result);
    });

    // -------------------------------
    // 4️⃣ GET: Single Job Details
    // -------------------------------
    app.get("/alljobs/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const job = await allJobsCollection.findOne({ _id: new ObjectId(id) });
        if (!job) return res.status(404).send({ message: "Job not found" });
        res.send(job);
      } catch (error) {
        res.status(400).send({ message: "Invalid job ID" });
      }
    });

    // -------------------------------
    // 5️⃣ POST: Accept a Job
    // -------------------------------
    app.post("/acceptJob", async (req, res) => {
      const { jobId, userEmail } = req.body;

      if (!jobId || !userEmail) {
        return res.status(400).send({ message: "Missing jobId or userEmail" });
      }

      const job = await allJobsCollection.findOne({ _id: new ObjectId(jobId) });
      if (!job) return res.status(404).send({ message: "Job not found" });

      // Prevent duplicate acceptance
      const existing = await acceptedTasksCollection.findOne({ jobId, userEmail });
      if (existing)
        return res.status(400).send({ message: "You have already accepted this job" });

      const acceptedTask = {
        jobId,
        acceptedBy: userEmail,
        acceptedDate: new Date(),
        title: job.title,
        category: job.category,
        summary: job.summary,
        coverImage: job.coverImage,
        postedBy: job.postedBy,
      };

      const result = await acceptedTasksCollection.insertOne(acceptedTask);
      res.send(result);
    });

 
    // 6️⃣ GET: My Accepted Tasks
    // -------------------------------
    app.get("/myAcceptedTasks", async (req, res) => {
      const { email } = req.query;
      if (!email) return res.status(400).send({ message: "Missing email" });

      const tasks = await acceptedTasksCollection
        .find({ acceptedBy: email })
        .sort({ _id: -1 })
        .toArray();

      res.send(tasks);
    });


app.put("/alljobs/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  try {
    const result = await allJobsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Job not found" });
    }

    res.send({ message: "Job updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Invalid job ID" });
  }
});


app.delete("/acceptedTasks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await acceptedTasksCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Task not found" });
    }
    res.send({ message: "Accepted task removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Invalid task ID" });
  }
});

app.post("/addJob", async (req, res) => {
  const newJob = req.body;


  newJob.postedAt = newJob.postedAt || new Date().toISOString();

  try {
    const result = await jobCollection.insertOne(newJob);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error adding job" });
  }
});


app.delete("/alljobs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await allJobsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Job not found" });
    }

    res.send({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Invalid job ID" });
  }
});


app.post("/acceptedTasks", async (req, res) => {
  try {
    const { jobId, acceptedBy, title, category, summary, coverImage, postedBy } = req.body;

    if (!jobId || !acceptedBy) {
      return res.status(400).json({ message: "Missing jobId or acceptedBy" });
    }

    // Prevent duplicate acceptance
    const existing = await acceptedTasksCollection.findOne({ jobId, acceptedBy });
    if (existing) {
      return res.status(400).json({ message: "You have already accepted this job" });
    }

    const acceptedTask = {
      jobId,
      acceptedBy,
      title,
      category,
      summary,
      coverImage,
      postedBy,
      acceptedAt: new Date(),
    };

    const result = await acceptedTasksCollection.insertOne(acceptedTask);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});





   
  
 // ✅ Root route for browser testing
app.get("/", (req, res) => {
  res.send("✅ Freelancer Jobs Server is running successfully!");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

run().catch(console.dir);


