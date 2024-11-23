const http = require("http");
const path = require("path");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const mongoUri = "mongodb+srv://tangadipallirohith:DF4wWWxC8CwaL4F8@cluster0.rpzy6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "Weather_Data_US";
const collectionName = "Weather_Data";

async function setupChangeStream() {
    try {
        const client = await MongoClient.connect(mongoUri);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const changeStream = collection.watch();

        changeStream.on("change", async (change) => {
            const data = await collection.find({}).toArray();
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFile(path.join(__dirname, 'public', 'db.json'), jsonData, (err) => {
                if (err) {
                    console.error("Error writing to db.json:", err);
                } else {
                    console.log("db.json updated with the latest data.");
                }
            });
        });
    } catch (err) {
        console.error("Error setting up change stream:", err);
    }
}

setupChangeStream();

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } else if (req.url.endsWith('.css')) {
        const cssPath = path.join(__dirname, 'public', req.url);
        fs.readFile(cssPath, (err, content) => {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(content);
        });
    } else if (req.url.endsWith('.png')) {
        const imagePath = path.join(__dirname, 'public', req.url);
        fs.readFile(imagePath, (err, content) => {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(content);
        });
    } else if (req.url === '/api') {
        fs.readFile(path.join(__dirname, 'public', 'db.json'), 'utf-8', (err, content) => {
            if (err) throw err;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(content);
        });
    } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - Not Found</h1>");
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
