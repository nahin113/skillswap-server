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
    const proposalsCollection = database.collection("proposal");

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
      const query = {};
      console.log("Backend hitted successfully");
      if (req.query.search) {
        query.$or = [
          { title: { $regex: req.query.search, $options: "i" } },
          { client_email: { $regex: req.query.search, $options: "i" } },
        ];
      }

      if (req.query.category) {
        query.category = req.query.category;
      }

      if (req.query.clientId) query.clientId = req.query.clientId;
      if (req.query.status) query.status = req.query.status;

      // pagination
      if (req.query.page) {
        const page = req.query.page;
        const perPage = req.query.perPage || 12;
        const skipItems = (page - 1) * perPage;
        const total = await tasksCollection.countDocuments(query);
        const cursor = tasksCollection
          .find(query)
          .skip(skipItems)
          .limit(perPage);
        const tasks = await cursor.toArray();
        return res.json({ total, tasks });
      }

      console.log("Q", query);
      const cursor = tasksCollection.find(query);
      const result = await cursor.toArray();
      console.log("result", result);
      res.json(result);
    });

    app.get("/api/tasks/my-tasks", async (req, res) => {
      const email = req.email;
      const query = {
        email: email,
      };
      const result = await tasksCollection.find(query).toArray();
      res.json(result);
    });

    app.get("/api/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await tasksCollection.findOne(query);
      res.json(result);
    });

    app.get("/api/proposals/my-proposals", async (req, res) => {
     const email = req.email;
     const query = {
       email: email,
     };
     const result = await proposalsCollection.find(query).toArray();
     res.json(result);
    });

    app.get("/api/proposals/by-task", async (req, res) => {
      try {
        const taskId = req.query.taskId;

        if (!taskId) {
          return res
            .status(400)
            .json({ error: "Missing taskId query parameter" });
        }

        // Find all proposals matching this specific task card ID
        const query = { task_id: taskId };
        const result = await proposalsCollection.find(query).toArray();

        res.json(result);
      } catch (error) {
        console.error("Error fetching proposals by task ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    

    

    app.post("/api/proposals", async (req, res) => {
      try {
        const {
          task_id,
          freelancer_email,
          proposed_budget,
          estimated_days,
          cover_note,
        } = req.body;
        if (
          !task_id ||
          !freelancer_email ||
          !proposed_budget ||
          !estimated_days ||
          !cover_note
        ) {
          return res
            .status(400)
            .json({ error: "All input fields are required" });
        }
        const existingProposal = await proposalsCollection.findOne({
          task_id: task_id,
          freelancer_email: freelancer_email,
        });

        if (existingProposal) {
          return res
            .status(400)
            .json({
              error: "You have already submitted a proposal for this task.",
            });
        }
        const newProposal = {
          task_id: task_id,
          freelancer_email: freelancer_email,
          proposed_budget: parseFloat(proposed_budget),
          estimated_days: parseInt(estimated_days),
          cover_note: cover_note,
          status: "pending",
          submitted_at: new Date(),
        };

        const result = await proposalsCollection.insertOne(newProposal);
        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        console.error("Error saving proposal:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });



    app.patch("/api/tasks/:id", async (req, res) => {
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
    });

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
