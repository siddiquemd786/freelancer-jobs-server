// index.js
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

    const db = client.db("freelancerMarketPlaces");
    const allJobsCollection = db.collection("AllJobs");
    const acceptedTasksCollection = db.collection("AcceptedTasks");

    console.log("✅ MongoDB Connected Successfully");

    // 🔹 1. Get All Jobs
    app.get("/alljobs", async (req, res) => {
      const cursor = allJobsCollection.find().sort({ _id: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // 🔹 2. Get Latest Jobs (limit 6)
    app.get("/jobs", async (req, res) => {
      const limit = parseInt(req.query.limit) || 6;
      const jobs = await allJobsCollection
        .find()
        .sort({ _id: -1 })
        .limit(limit)
        .toArray();
      res.send(jobs);
    });

    // 🔹 3. POST - Add a New Job
    app.post("/jobs", async (req, res) => {
      const newJob = req.body;

      if (!newJob.title || !newJob.category || !newJob.budget) {
        return res.status(400).send({ message: "Missing required fields" });
      }

      newJob.postedDate = new Date(); // auto add timestamp

      const result = await allJobsCollection.insertOne(newJob);
      res.send(result);
    });

    // 4. GET - Single Job Details

    app.get("/allJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await allJobsCollection.findOne(query);
      res.send(job);
    });

    // 🔹 POST: Accept a Job
app.post("/acceptJob", async (req, res) => {
  const { jobId, userEmail } = req.body;

  if (!jobId || !userEmail) {
    return res.status(400).send({ message: "Missing jobId or userEmail" });
  }

  const job = await allJobsCollection.findOne({ _id: new ObjectId(jobId) });
  if (!job) return res.status(404).send({ message: "Job not found" });

  const existing = await acceptedTasksCollection.findOne({
    jobId,
    userEmail,
  });

  if (existing)
    return res.status(400).send({ message: "Already accepted this job" });

  const accepted = {
    ...job,
    jobId,
    acceptedBy: userEmail,
    acceptedDate: new Date(),
  };

  const result = await acceptedTasksCollection.insertOne(accepted);
  res.send(result);
});

// 🔹 GET: My Accepted Tasks
app.get("/myAcceptedTasks", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send({ message: "Missing email" });

  const tasks = await acceptedTasksCollection
    .find({ acceptedBy: email })
    .sort({ _id: -1 })
    .toArray();

  res.send(tasks);
});

    // ✅ Server listen
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

run().catch(console.dir);
