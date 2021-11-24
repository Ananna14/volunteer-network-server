const express = require('express')
const app = express()
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config()
const { MongoClient } = require('mongodb');
app.use(cors());
app.use(express.json())

const fileUpload = require('express-fileupload');



const port =process.env.PORT || 5000

// volunteer-network-websit-1fe53-firebase-adminsdk-vmvrc-2a0942492

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.use(fileUpload());

//mongodb start
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ojutr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri)

async function verifyToken(req, res, next) {
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const token = req.headers.authorization.split(' ')[1];

    try{
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;

    }
    catch{

    }
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("volunteer_website");
    const appointmentCollection = database.collection("appointments");
  const usersCollection = database.collection('users')
  const denationPeopleCollection = database.collection('people');
  //  console.log('database connected successfully');
   
app.get('/appointments', async(req, res)=>{
  const email = req.query.email;
  const query = {email: email}
  console.log(query)
  const cursor = appointmentCollection.find(query);
  const appointments = await cursor.toArray();
  res.json(appointments)
})

  app.post('/appointments', async(req, res)=>{
    const appointment = req.body;
    const result = await appointmentCollection.insertOne(appointment)
    // console.log(appointment);
    // res.json({message: 'hello'})
    res.json(result)
  })
  // img add                                            
  app.get('/people', async(req, res)=>{
    const cursor = denationPeopleCollection.find({});
    const people = await cursor.toArray();
    res.json(people)
  })
//img add
app.post('/people', async(req, res) =>{
  const name = req.body.name;
  const email = req.body.email;
  const pic = req.files.image;
  const picData = pic.data;
  const encodedPic = picData.toString('base64');
  const imageBuffer = Buffer.from(encodedPic, 'base64');
const people = {
  name,
  email,
  image: imageBuffer
}
// console.log('body', req.body);
// console.log('files', req.files);
const result = await denationPeopleCollection.insertOne(people);
res.json(result)
})

  app.get('/users/:email', async(req, res)=>{
    const email = req.params.email;
    const query = {email: email};
    const user = await usersCollection.findOne(query);
    let isAdmin = false;
    if(user?.role == 'admin'){
  isAdmin = true;
    }
    res.json({admin : isAdmin});
  })
  app.post('/users', async(req, res)=>{
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    console.log(result)
    res.json(result)
  });
  app.put('/users', async (req, res)=>{
    const user = req.body;
    // console.log('put', user)
    const filter = {email: user.email};
    const options = { upsert: true };
    const updateDoc = {$set: user}
    const result = await usersCollection.updateOne(filter, updateDoc, options);
  res.json(result)
  });
  app.put('/users/admin', verifyToken, async(req, res)=>{
    const user = req.body;
  const requester = req.decodedEmail;
  if(requester){
    const requesterAccount = await usersCollection.findOne({email: requester})
  if(requesterAccount.role === 'admin'){
    const filter = {email: user.email};
    const updateDoc = {$set: {role: 'admin'}}
    const result = await usersCollection.updateOne(filter, updateDoc);
    res.json(result)
  }
  }
  else{
    res.status(403).json({message: 'you do not have access to make admin'})
  }

  })

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


//mongodb end

app.get('/', (req, res) => {
  res.send('Hello volunteer-network-website!')
})
// app.get('/home', (req, res) => {
//   res.send('Here is my home page')
// })

app.listen(port, () => {
  console.log(`listening at ${port}`)
})