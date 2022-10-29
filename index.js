const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6khde.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect();
        const productCollection = client.db("ars-car-parts").collection("products");
        const reviewCollection = client.db("ars-car-parts").collection("reviews");
        const order2Collection = client.db("ars-car-parts").collection("orders2");
        const userCollection = client.db("ars-car-parts").collection("users");


        //Get Products
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        //Add Product
        app.post('/products', async (req, res) => {
            const newProduct = req.body;
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        })
        //Delete Product
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

        //Get Single product by id
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.findOne(query);
            res.send(result);
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })


        //Put User
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, "9b747c40c01ac0af025d192bcb08d5b1512ea8b9df4f7d41a26152d143846c536ee29627a19ecac90194a06ffc22930078b86f3807556e551b4f8386bddc270e", { expiresIn: '1h' })
            res.send({ result, token });
        })

        //Get User
        app.get('/user', async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        })

        //Make admin
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status.send({ message: 'forbidden' });
            }
        })

        //Remove Admin Access
        app.put('/user/remove/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: '' },
                };
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                res.status.send({ message: 'forbidden' });
            }

        })

        //Add Orders
        app.post('/orders2', async (req, res) => {
            const newOrder = req.body;
            const result = await order2Collection.insertOne(newOrder);
            res.send(result);
        })

        //Get Orders by Email
        app.get('/orders2/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const cursor = order2Collection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })

        //Get Orders by Id
        app.get('/orders2/byid/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await order2Collection.findOne(query);
            res.send(order);
        })

        //Get All Orders
        app.get('/orders2', async (req, res) => {
            const query = {};
            const cursor = order2Collection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })

        //Delete Order
        app.delete('/order-delete', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await order2Collection.deleteOne(query);
            res.send(result);

        })


        //Get Reviews
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        //Add Review
        app.post('/reviews', async (req, res) => {
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result);
        })



    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("This is Homepage");
})
app.listen(port, () => {
    console.log("Port is Running");
})