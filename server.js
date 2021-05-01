import dotenv from "dotenv";
dotenv.config();
import { rejects } from "assert";
import express from 'express';
//import watermark from 'purejswatermark/dist/watermark';
const PORT = 3000;
const app = express();
import https from 'https';
import fs from 'fs';
import { resolve } from "path";
app.set('view engine', 'ejs');
app.use(express.static("gifs"))
app.use('/static', express.static('public'));

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

async function sortGifs(gifs) {
    return gifs.sort((a, b) => {
        return Number(a.rating > b.rating) - 1;
    });
}

function saveFileAsGif(url, fileName) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(`./gifs/${fileName.replace(/\s/g, '')}.gif`);
        const request = https.get(url, function(response) {
            response.pipe(file);
            resolve();
        });
    });
}

function readLoadedGifs() {
    return new Promise(
        (resolve, reject) => {
            fs.readdir("./gifs", (err, files) => {
                if (err) {
                    reject(err);
                }
                resolve(files);
            })
        }
    );
}

async function saveGifs(gifs) {
    for (let gifIndex in gifs.slice(0, 10)) {
        let gif = gifs[gifIndex];
        const gifTitle = gif.title + gifIndex;
        await saveFileAsGif(gif.images.original.url, gifTitle);
        //await addWatermark(`./gifs/${gifTitle}`);
    }
}

/*async function addWatermark(filepath) {
    const options = { opacity: 0.5 };
    const watermarkPath = "./assets/watermark.png"
    const imageWithWatermark =
        await watermark.addWatermark(
            filepath,
            watermarkPath,
            options,
        );
}
*/

app.get("/", (req, res) => {
    res.render('index');
});

app.get("/search", async(req, res, next) => {
    try {
        const gifs = await sortGifs(await sendQuery(req.query.q));
        await saveGifs(gifs);

        //res.send(gifs);
    } catch (e) {
        next(e);
    }
});

app.get("/display", async(req, res, next) => {
    try {
        res.render('render', { gifs: await readLoadedGifs() });
        //res.send(gifs);
    } catch (e) {
        next(e);
    }
});


app.listen(PORT);