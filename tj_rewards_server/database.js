import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()


export async function getUsers() {
    const [rows] = await pool.query("SELECT * FROM users")
    return rows
}

export async function getUserWithID(id) {
    const [row] = await pool.query(`
    SELECT *
    FROM users
    WHERE id = ?
    `, [id])
    return row[0]
}

export async function getUserWithEmail(email) {
    const [row] = await pool.query(`
    SELECT *
    FROM users
    WHERE email = ?
    `, [email])
    return row[0]
}

export async function createUser(first, last, password, email) {
    const [result] = await pool.query(`
    INSERT INTO users (first, last, password, email)
    VALUES (?, ?, ?, ?)
    `, [first, last, password, email])
    
    const id = result.insertId
    return getUserWithID(id)
}

export async function updatePassword(id, password){
    await pool.query(`
    UPDATE users
    SET password = ?
    WHERE id = ?
    `, [password, id])

    return getUserWithID(id)

}

export async function generateTemporaryPassword(){
    const baseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let temporaryPassword = '';
    for (let i = 0; i < 6; i++){
        let ind = Math.floor(Math.random() * baseChars.length)
        temporaryPassword += baseChars[ind]
    }

    return temporaryPassword
}

export async function updatePoints(id, points) {
    const user = await getUserWithID(id)
    const currentPoints = user.points

    // need a way for ex. they have 120 points and recieve 10 points, to be left over with 5
    var newPoints = currentPoints + points
    if (newPoints > 125){
        newPoints = 125
    }

    const result = await pool.query(`
    UPDATE users
    SET points = ?
    WHERE id = ?;
    `, [newPoints, id])
    
    if (newPoints >= 125){
        await pointsToRewards(id)
    }
    
    return getUserWithID(id)
}

async function pointsToRewards(id){
    const user = await getUserWithID(id)
    const newPoints = 0
    const currentRewards = user.rewards
    let newRewards = currentRewards
    if (currentRewards === ""){
        newRewards = await generateReward()
    }
    else {
        newRewards = newRewards + "," + await generateReward()
    }

    const result = await pool.query(`
    UPDATE users
    SET points = ?, rewards = ?
    WHERE id = ?;
    `, [newPoints, newRewards, id])
}

export async function useReward(id){
    const user = await getUserWithID(id)
    const currentRewardsString = user.rewards
    const rewardsArray = currentRewardsString.split(",")
    
    const rewardID = rewardsArray.pop()

    // if you want to find which actual number it is
    //const decodedID = await decodeNumber(rewardID)
    //console.log(decodedID)

    const [row] = await pool.query(`
    SELECT *
    FROM rewards
    WHERE id = ?
    `, [rewardID])

    // verify ID
    if (row[0]['id'] === rewardID){
        const newRewardsString = rewardsArray.toString()
    
        const result = await pool.query(`
        UPDATE users
        SET rewards = ?
        WHERE id = ?;
        `, [newRewardsString, id])
    }
    // else return invalid/expired reward
    
    return getUserWithID(id);
}

async function generateReward(){

    const [result] = await pool.query(`
    SELECT COUNT(*) FROM rewards;
    `)
    const newNumID = (result[0]['COUNT(*)'] + 1)
    
    // length of rewards database plus 1 (the new record)

    //console.log(newNumID)

    const newPublicID = await encodeNumber(newNumID)

    await pool.query(`
    INSERT INTO rewards (id)
    VALUES (?)
    `, [newPublicID])


    return newPublicID;
}

async function encodeNumber(number){
    number *= 111
    const baseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const base = baseChars.length;
    let encoded = '';

    while (number > 0) {
        encoded = baseChars.charAt(number % base) + encoded;
        number = Math.floor(number / base);
    }

    return encoded || 'A';
}

async function decodeNumber(encodedString){
    const baseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const base = baseChars.length;
    let number = 0;

    for (let i = 0; i < encodedString.length; i++) {
        number = number * base + baseChars.indexOf(encodedString.charAt(i));
    }

    return number / 111;
}






