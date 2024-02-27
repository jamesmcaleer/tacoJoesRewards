import express from 'express'
import nodemailer from 'nodemailer'
import ejs from 'ejs'

import {getUsers, getUserWithID, getUserWithEmail, createUser, updatePassword, generateTemporaryPassword, updatePoints, useReward} from './database.js'

import dotenv from 'dotenv'
dotenv.config()


const transporter = nodemailer.createTransport({
    pool: true,
    host : 'smtp.gmail.com',
    service: "gmail",
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASSWORD,
    },
});

const mailOptionsTemplate = {
    from: process.env.SENDER_EMAIL,
    subject: 'Forgot Password',
    text: 'This is a test email.',
};

const app = express()

app.use(express.json())

app.get("/users", async (req, res) => {
    const users = await getUsers()
    res.send(users)
})

/*
app.get("/users/:id", async (req, res) => {
    const id = req.params.id
    const user = await getUserWithID(id)
    res.send(user)
})
*/

// FORGOT PASSWORD
app.post("/forgot", async (req, res) => {
    const {email} = req.body
    const user = await getUserWithEmail(email)
    if (!user){
        res.status(404).send("user does not exist") // please provide valid email
    }
    else{
        const temporaryPassword = await generateTemporaryPassword()
        const result = await updatePassword(user.id, temporaryPassword)

        const mailOptionsAdditions = {
            to : email,
            password : temporaryPassword
        }
        
        mailOptionsTemplate.to = email
        mailOptionsTemplate.html = await ejs.renderFile('password-reset-template.ejs', {mailOptionsAdditions})
        
        //res.status(201).send(result)

        transporter.sendMail(mailOptionsTemplate, function(error, info){
            if (error) {
              console.log(error);
              res.status(400).send("email failed to send")
            } else {
              console.log('Email sent: ' + info.response);
              res.status(200).send(result)
            }
        });
    }
    
})

// LOGIN ATTEMPT
app.post("/login", async (req, res) => {
    const {email, password} = req.body
    const user = await getUserWithEmail(email)
    if (!user){
        res.status(404).send("user does not exist")
    }
    else{
        if (user.password === password){
            res.status(200).send(user)
        }
        else {
            res.status(400).send("incorrect password")
        }
        
    }
    
})

// CREATE ACCOUNT
app.post("/create", async (req, res) => {
    const {first, last, password, email} = req.body
    if (!(await getUserWithEmail(email))){
        const user = await createUser(first, last, password, email)
        res.status(201).send(user)
    }
    else{
        res.status(405).send("email taken")
    }
    
})


// USE REWARD **TESTING PURPOSES**
app.get("/rewards/:id", async (req, res) => {
    const id = req.params.id
    const user = await useReward(id)
    res.send(user)
})

// ADD POINTS
app.post("/update", async (req, res) =>{
    const {id, points} = req.body
    const updatedUser = await updatePoints(id, points)
    res.status(200).send(updatedUser)
    // once we have QR and KEYLOG integration, updatePoints should be ran once both actions have occured
    // it should NOT be triggered from a http request like other functions are
    // this POST request is just for testing
})

// SERVER ERROR
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('something broke!')
})

const server = app.listen(8080, () => {
    console.log(`Listening on ${server.address().port}`)
})

console.log(await createUser('james', 'mcaleer', 'jamesjmac', 'lotus'))

// remeber to replace the blank with the IP so that it is not local host
// this way the app can access the server