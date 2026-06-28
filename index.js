const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SkillSwap Server");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("skillswap_db");
    const usersCollection = database.collection("user");
    const tasksCollection = database.collection("task");

    app.get("/api/freelancers", async (req, res) => {
      const query = { accountType: "freelancer" };
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      console.log(result);
      res.json(result);
    });

    app.get("/api/freelancers/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await usersCollection.findOne(query);
      console.log(result);
      res.json(result);
    });

    app.post("/api/tasks", async (req, res) => {
      const task = req.body;
      const newTask = {
        ...task,
        createdAt: new Date(),
      };
      const result = await tasksCollection.insertOne(newTask);
      res.json(result);
    });

    
    app.get("/api/tasks", async (req, res) => {
      const email = req.email;
      const query = {
        email : email
      };
      const result = await tasksCollection.find(query).toArray();
      console.log(result)
      res.json(result);
    });

    
    app.patch(
      "/api/tasks/:id",async (req, res) => {
        const id = req.params.id;
        const updatedTask = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            status: updatedTask.status,
          },
        };
        const result = await tasksCollection.updateOne(filter, updatedDoc);
        res.json(result);
      }
    );

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
