
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, './mongodb')));
console.log(__dirname);
const bodyParser = require('body-parser');

app.set('view engine', 'ejs');

const pr = (bodyParser.urlencoded({extended: false}));
const mongo = require('mongodb');

const mongoclient = mongo.MongoClient;

const url = "mongodb://127.0.0.1:27017/";

const client = new mongoclient(url);
let imgname = '';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        imgname = Date.now() + file.originalname
        return cb(null, imgname);
    }
});
const upload = multer({storage: storage});

const mainpath = path.join(__dirname, "./mongodb");

app.use(express.static(mainpath));
app.use(express.static("uploads"));

async function data() {
    try {
        await client.connect();
        console.log("Connect");
        const db = client.db("test");
        const collection = db.collection("user");
        let userdata = await collection.find({}).toArray();
        let user = '';
        // console.log(user);

        // insert data

        app.get('/crud', (req, res) => {
            res.render('index', {
                data: userdata,
                user: user
            });

        });



        app.post('/savedata', upload.single('image'), async (req, res) => {

            id = req.body.id;

            user = '';
            user = userdata.find((i) => {
                return i.id == id;

            });

            old = (imgname != '') ? imgname : '';



            if (id != '') {

                if (req.file && imgname != '') {
                    let image = 'uploads/' + user.image;

                    fs.unlink(image, () => {
                        console.log("deleted");
                    });
                }

                userdata.forEach((i) => {
                    if (i.id == id) {
                        i.name = req.body.name;
                        i.age = req.body.age;
                        i.image = (req.file && imgname != undefined) ? imgname : old;
                    }
                });
                let r = await collection.updateOne({id: id}, {$set: {name: req.body.name, age: req.body.age}});

            } else {
                let data = {
                    id: (userdata.length + 1).toString(),
                    name: req.body.name,
                    age: req.body.age,
                    image: (imgname != undefined) ? imgname : old
                }
                console.log(data);
                userdata.push(data);
                let r = await collection.insertOne(data);
                console.log(r);
            }



            user = '';
            res.redirect('/crud');

        });

        app.get('/del/:id', async (req, res) => {
            let id = req.params.id;
            let images = userdata.find((i) => {
                return i.id == id;

            });

            let image = 'uploads/' + images.image;

            fs.unlink(image, () => {
                console.log("deleted");
            });


            let c = await collection.deleteOne({id: id});
            let n = await collection.find({}).toArray();



            userdata = n;
            res.redirect('/crud');
        });

        app.get('/edit/:id', (req, res) => {
            let id = req.params.id;
            user = userdata.find((i) => {
                return i.id == id;

            });
            res.render('index', {
                data: userdata,
                user: user
            });
            // req.redirect('/crud');

        });


    } catch (err) {
        console.log(err);

    }
}

data();


app.get('/', (req, res) => {
    console.log("hello");
    res.end();

});

app.listen(3001, "127.0.0.1", () => {
    console.log("server is running");
}); 
