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

app.get("/", async (req, res) => {
    res.send("helo solosphere")
})


app.listen(port, () => console.log(`server is running ${port}`))