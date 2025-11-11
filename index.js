const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri =
  "mongodb+srv://smartdbuser:QGxNfsnhSmFSOdim@cluster0.wejbxsr.mongodb.net/?appName=Cluster0";

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

    // Database & Collections
    const db = client.db("freelancerMarketPlaces");
    const allJobsCollection = db.collection("AllJobs");
    const acceptedTasksCollection = db.collection("AcceptedTasks");

    // -------------------------------
    // 1️⃣ GET: All Jobs
    // -------------------------------
    app.get("/alljobs", async (req, res) => {
      const jobs = await allJobsCollection.find().sort({ _id: -1 }).toArray();
      res.send(jobs);
    });

    // -------------------------------
    // 2️⃣ GET: Latest Jobs (optional limit)
    // -------------------------------
    app.get("/jobs", async (req, res) => {
      const limit = parseInt(req.query.limit) || 6;
      const jobs = await allJobsCollection
        .find()
        .sort({ _id: -1 })
        .limit(limit)
        .toArray();
      res.send(jobs);
    });

    // -------------------------------
    // 3️⃣ POST: Add New Job
    // -------------------------------
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

    // -------------------------------
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

    // -------------------------------
    // Start server
    // -------------------------------
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

run().catch(console.dir);
