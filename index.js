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
            "https://h-booking-96145.web.app",
            "https://h-booking-96145.firebaseapp.com"
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
        const booksCollection = client.db("H_Booking").collection("books")
        const reviewsCollection = client.db("H_Booking").collection("reviews")

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
        app.post("/addroom", async (req, res) => {
            const room = req.body
            const result = await roomsCollection.insertOne(room)
            res.send(result)
        })
        // gett all rooms
        app.get("/allrooms", async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size)
            const result = await roomsCollection.find().skip(page * size).limit(size).toArray();
            res.send(result);
        })
        // total room
        app.get("/roomcount", async (req, res) => {
            const count = await roomsCollection.estimatedDocumentCount()
            res.send({ count })
        })
        // get single room
        app.get("/singleroom/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await roomsCollection.findOne(query)
            res.send(result)
        })
        // update room ability
        app.patch("/availability/:id", async (req, res) => {
            const id = req.params.id
            const Availability = req.body
            const filter = { _id: new ObjectId(id) }
            const udpadeDoc = {
                $set: Availability
            }
            const result = await roomsCollection.updateOne(filter, udpadeDoc)
            res.send(result)
        })
        // serch rooms
        app.get("/searchroom", async (req, res) => {
            const roomInfo = req.query
            const minprice = roomInfo.minPrice
            const maxprice = roomInfo.maxPrice
            const result = await roomsCollection.find({ Price: { $gte: minprice, $lte: maxprice } }).toArray();
            res.send(result)
            console.log(roomInfo)
        })



        //   books rooms------------------
        app.post("/bookrooms", async (req, res) => {
            const room = req.body
            const result = await booksCollection.insertOne(room)
            res.send(result)
        })
        // my book list
        app.get("/mybookedlist/:email", varifyToken, async (req, res) => {
            const email = req.params.email
            if (email !== req.user.email) {
                return res.status(403).send("forbidden...")
            }
            const filter = { email }
            const result = await booksCollection.find(filter).toArray()
            res.send(result)
        })
        // delete booking
        app.delete("/deletemybookedlist/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const result = await booksCollection.deleteOne(filter)
            res.send(result)
        })

        // update room date
        app.patch("/updatedate/:id", async (req, res) => {
            const id = req.params.id
            const startDate = req.body
            const filter = { _id: new ObjectId(id) }
            const udpadeDoc = {
                $set: startDate
            }
            const result = await booksCollection.updateOne(filter, udpadeDoc)
            res.send(result)
        })
        // add reviews
        app.post("/reviews", async (req, res) => {
            const reviewInfo = req.body

            const query = {
                email: reviewInfo.reviewEmail,
                bookId: reviewInfo.reviewRoomID,
            }
            const query2 = {
                reviewEmail: reviewInfo.reviewEmail,
                reviewRoomID: reviewInfo.reviewRoomID,
            }
            const findRoomReview = await booksCollection.findOne(query)
            const alreadyReviewRoom = await reviewsCollection.findOne(query2)

            if (alreadyReviewRoom) {
                return res.status(401).send("You already Review")
            }
            if (findRoomReview) {
                const result = await reviewsCollection.insertOne(reviewInfo)
                res.send(result)
            }

        })
        // find room basis reviews
        app.get("/findroomreviewa/:id", async (req, res) => {
            const id = req.params.id
            const query = { reviewRoomID: id }
            const result = await reviewsCollection.find(query).toArray()
            res.send(result)
        })
        // sort decending order reviews
        app.get("/decendingreviews", async (req, res) => {
            const result = await reviewsCollection.find().sort({ reviewDate: -1 }).toArray()
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