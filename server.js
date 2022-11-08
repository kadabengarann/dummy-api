const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()
const router = jsonServer.router('./database.json')
let userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))

server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789'

const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload){
  return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

// Verify the token 
function verifyToken(token){
  return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

// Check if the user exists in database
function isAuthenticated({email, password}){
  userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
  return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}
// Check if the email exists in database
function isEmailExist({email}){
  userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))
  return userdb.users.findIndex(user => user.email === email) !== -1
}
// / route
server.get('/hello', (req, res) => {
  res.json({msg: 'Hello'})
})


// / route  /activity
server.get('/activity', (req, res) => {

  const query = req.query
  const filter = query.status

  //show json file
  fs.readFile("./activity.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({status, message})
      return
    };
    data = JSON.parse(data.toString());
    if (filter !== undefined) {
      data = data.filter(item => item.status === filter)
    }
    res.status(200).json(data);
  });
})


// get /activity/:id
server.get('/activity/:id', (req, res) => {
  const id = req.params.id
  fs.readFile("./activity.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({status, message})
      return
    };
    data = JSON.parse(data.toString());
    data = data.filter(item => item.id == id)
    if (data.length > 0) {
      res.status(200).json(data[0]);
    } else {
      res.status(404).json({msg: "Not found"});
    }
  });
})

// get /notification
server.get('/notification', (req, res) => {
  const query = req.query
  let isRead = query.isRead
  isRead = isRead === "true" ? true : isRead === "false" ? false : undefined
  console.log(isRead);
  fs.readFile("./notification.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({status, message})
      return
    };
    data = JSON.parse(data.toString());
    if (isRead !== undefined) {
      data = data.filter(item => item.read == isRead)
    }
    res.status(200).json(data);
  });
})


// Register New User
server.post('/auth/register', (req, res) => {
  console.log("register endpoint called; request body:");
  console.log(req.body);
  const {email, password} = req.body;

  if(isEmailExist({email}) === true) {
    const status = 401;
    const message = 'Email already exist';
    res.status(status).json({status, message});
    return
  }

fs.readFile("./users.json", (err, data) => {  
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({status, message})
      return
    };

    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user
    var last_item_id = data.users[data.users.length-1].id;

    //Add new user
    data.users.push({id: last_item_id + 1, email: email, 
      level: "customer",
      password: password}); //add some data
    var writeData = fs.writeFileSync("./users.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({status, message})
          return
        }
    });
});

// Create token for new user
  const access_token = createToken({email, password})
  const level_access = "customer"
  console.log("Access Token:" + access_token);
  res.status(200).json({access_token, level_access})
})

// Login to one of the users from ./users.json
server.post('/auth/login', (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const {email, password} = req.body;
  if (isAuthenticated({email, password}) === false) {
    const status = 401
    const message = 'Incorrect email or password'
    res.status(status).json({status, message})
    return
  }
  const user = userdb.users.find(user => user.email === email && user.password === password)
  const access_token = createToken({email, password})
  if (user.level === undefined) {
    user.level = "customer"
  }
  const level_access = user.level
  console.log("Access Token:" + access_token);
  res.status(200).json({access_token, level_access})
})

server.use(/^(?!\/auth).*$/,  (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Error in authorization format'
    res.status(status).json({status, message})
    return
  }
  try {
    let verifyTokenResult;
     verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

     if (verifyTokenResult instanceof Error) {
       const status = 401
       const message = 'Access token not provided'
       res.status(status).json({status, message})
       return
     }
     next()
  } catch (err) {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({status, message})
  }
})

server.use(router)

server.listen(process.env.PORT || 3000, () => {
  console.log('Run Auth API Server')
})

// UYEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE
// EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE

// ashfashfahfaafsaffffffffffffffffffffffasfsafasjjafjqwfjwjjabfbajfbasfjsbafbjsafbajsfjlqwfjlblewq