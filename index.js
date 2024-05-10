const express = require('express');
const cors = require('cors');
require("dotenv").config()
const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000
const app = express()

// midleware
app.use(
    cors({
      origin: [
        "http://localhost:5173",
      ],
      credentials: true,
    })
  );
app.use(express.json())
app.use(cookieParser())
const varifyToken = (req, res, next) => {
    const Token = req.cookies.token
    if (!Token) {
        return res.status(401).send({ message: "Unauthorize access" })
    }
    jwt.verify(Token, process.env.ACCE_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: "Unauthorize access" })
        }
        req.user = decoded
        next()
    });

}
// mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kaocfbi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // Send a ping to confirm a successful connection
        const roomsCollection = client.db("H_Booking").collection("rooms")
        
        // create jwt token
        app.post("/jwt", async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCE_TOKEN, { expiresIn: "5h" });
            res.cookie("token", token, { 
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", 
            })
            .send({ success: true })
        })
        app.post("/logout", async (req, res) => {
            const user = req.body
            console.log(user)
            res.clearCookie("token", { maxAge: 0 }).send({ success: true })
        })
        // jwt end

        // Rooms route
        // add room
        app.post("/addroom",async(req,res)=>{
            const room=req.body
            const result=await roomsCollection.insertOne(room)
            res.send(result)
        })
        // gett all rooms
        app.get("/allrooms",async(req,res)=>{
            const result=await roomsCollection.find().toArray()
            res.send(result)
        })
      
       
      
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
    res.send("helo solosphere")
})


app.listen(port, () => console.log(`server is running ${port}`))