var express = require("express");
var app = express();
var path = require("path");
var fs = require("fs");
var dotenv = require('dotenv');
const port = process.env.PORT || 3000;
dotenv.config();

//config express.js
app.use ((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
 
    next();
});

app.use(function(req, res, next){
    console.log(`${req.method} ${req.path} time: ${new Date()}`);
    next();
});
 
app.use(express.json());

app.use(function(req, res, next){
    var filePath = path.join(__dirname, "static", req.url);
    fs.stat(filePath, function(err, fileInfo){
        if (err){
            next();
            return;
        }
        if(fileInfo.isFile())
            res.sendFile(filePath);
        else
            next();
    });
});

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGODB_URI;

let db;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    db = client.db('lessonsDB');
});

app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g., /collection/messages');
});

app.param('collectionName', (req, res, next, collectionName) => {
    console.log('GET /collection/' + req.params.collectionName);
    req.collection = db.collection(collectionName);
    return next();
});

app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    }); 
});

app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e);
        res.send(results.ops);
    });
});

const ObjectID = require('mongodb').ObjectID;
// app.get('/collection/:collectionName/:id', (req, res, next) => {
//     req.collection.findOne({_id: new ObjectID(req.params.id) }, (e, result) => {
//         if (e) return next(e)
//         res.send(result);
//     });
// });

app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.update(
        {_id: new ObjectID(req.params.id)},
        {$set: req.body},
        {safe: true, multi: false},
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? {msg: 'success'} : {msg: 'error'});
        });
});

app.delete('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.deleteOne(
        {_id: ObjectID(req.params.id) }, (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? {msg: 'success'} : {msg: 'error'});
        });
});
 
app.listen(port, function(){
    console.log("App started on port 3000");
});