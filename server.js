require('dotenv').config();
const express = require('express');
const path  = require('path');
const mongoose = require('mongoose');
const session  = require('express-session');
const MongoStore = require('connect-mongo');
const cookieparser = require('cookie-parser');
const expressWs = require('express-ws');
const { registerSessionWs } = require('./wsHub');



const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const sessionRoutes = require('./routes/sessions');


const app = express();
expressWs(app);


//connect to mongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then( () => console.log('Mongo connected '))
    .catch( (err) => console.error('Mongo connection error: ', err));


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//middleware
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieparser());
app.use(express.static("public"));
// use auth routes




app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized:false,
        store: MongoStore.create({ 
            mongoUrl: process.env.MONGO_URI,
            collectionName:"sessions",
        
        }),
        cookie:{
            httpOnly:true,
            sameSite:"lax"
        }
    })
);

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(sessionRoutes);

registerSessionWs(app);




// Simple in-memory map: sessionId -> Set of websocket connections
const sessionSockets = new Map();

app.ws('/ws/sessions/:id', (ws, req) => {
  const sessionId = req.params.id;

  if (!sessionSockets.has(sessionId)) {
    sessionSockets.set(sessionId, new Set());
  }
  const clients = sessionSockets.get(sessionId);
  clients.add(ws);

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    
    if (data.type === 'noteUpdate') {
      for (const client of clients) {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'noteUpdate',
            text: data.text,
          }));
        }
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (clients.size === 0) {
      sessionSockets.delete(sessionId);
    }
  });
});


// routes 
app.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

//test
app.get('/cause500', (req, res) => {
  throw new Error("Intentional test error!");
});


app.use((req, res) => {
  res.status(404).render('error404', { title: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error500', { title: 'Server Error' });
});







app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});