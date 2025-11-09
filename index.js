// index.js
const express=require("express")
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors=require('cors')
const app=express()

app.use(cors())
app.use(express.json())

const port=process.env.PORT||3000

const uri = "mongodb+srv://smartdbuser:QGxNfsnhSmFSOdim@cluster0.wejbxsr.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
  
    await client.connect();

    const db = client.db("freelancerMarketPlaces");
    const allJobsCollection = db.collection("AllJobs");

    console.log("✅ MongoDB Connected Successfully");

   
    app.get("/alljobs", async (req, res) => {
      const cursor = allJobsCollection.find().sort({ postedDate: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}

run().catch(console.dir);

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});

