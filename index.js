import dotenv from "dotenv";
dotenv.config();
import { rejects } from "assert";
import express from 'express';
const PORT = 3000;
const app = express();
import https from 'https';
import fs from 'fs';

function sendQuery(query) {
    return new Promise(
        (resolve, reject) => {
            https.get(`https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${query}&limit=20`, (res) => {
                let data = '';
                res.on('data', (dataPart) => {
                    data += dataPart;
                });
                res.on('end', () => {
                    resolve(JSON.parse(data).data);
                });
            }).on('error', (e) => {
                reject(e);
            });
        }
    );
}

async function sortGifs(query) {
    return (await sendQuery(query)).sort((a, b) => {
        return Number(a > b);
    });
}

async function saveFile(url, fileName) {
    const file = fs.createWriteStream(fileName);
    const request = http.get(url, function(response) {
        response.pipe(file);
    });
}

async function saveGifs(gifs) {
    for (let gif of gifs) {
        saveFile(gif.images.original.url, gif.title);
    }
}

app.get("/search", async (req, res) => {
    gifs = await sortGifs(req.query.q);
    saveGifs(gifs);
    res.send(gifs);
})

app.listen(PORT);