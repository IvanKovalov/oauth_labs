const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');
var request = require("request");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_KEY = 'Authorization';
const CLIENT_ID = '${client_id}';
const CLISENT_SECRET = '${client_secret}';
const AUDIENCE = '${audience}';

let oauthToken;

class Session {
    #sessions = {}

    constructor() {
        try {
            this.#sessions = fs.readFileSync('./sessions.json', 'utf8');
            this.#sessions = JSON.parse(this.#sessions.trim());

            console.log(this.#sessions);
        } catch(e) {
            this.#sessions = {};
        }
    }

    #storeSessions() {
        fs.writeFileSync('./sessions.json', JSON.stringify(this.#sessions), 'utf-8');
    }

    set(key, value) {
        if (!value) {
            value = {};
        }
        this.#sessions[key] = value;
        this.#storeSessions();
    }

    get(key) {
        return this.#sessions[key];
    }

    init(res) {
        const sessionId = uuid.v4();
        this.set(sessionId);

        return sessionId;
    }

    destroy(req, res) {
        const sessionId = req.sessionId;
        delete this.#sessions[sessionId];
        this.#storeSessions();
    }
}

const sessions = new Session();

app.use((req, res, next) => {
    let currentSession = {};
    let sessionId = req.get(SESSION_KEY);

    if (sessionId) {
        currentSession = sessions.get(sessionId);
        if (!currentSession) {
            currentSession = {};
            sessionId = sessions.init(res);
        }
    } else {
        sessionId = sessions.init(res);
    }

    req.session = currentSession;
    req.sessionId = sessionId;

    onFinished(req, () => {
        const currentSession = req.session;
        const sessionId = req.sessionId;
        sessions.set(sessionId, currentSession);
    });

    next();
});

app.get('/', (req, res) => {
    if (req.session.username) {
        return res.json({
            username: req.session.username,
            logout: 'http://localhost:3000/logout'
        })
    }
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/logout', (req, res) => {
    sessions.destroy(req, res);
    res.redirect('/');
});

let users = []

const axios = require('axios');

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        let userHasAccess = false;
        let loginUser;
        var options = {
            method: 'GET',
            url: 'https://dev-h3816xplrlj7v6b1.us.auth0.com/api/v2/users',
            headers: {authorization: 'Bearer ' + oauthToken}
          };
          
         await axios.request(options).then(function (response) {
            response.data.forEach(user => {
                if(user.email == login){
                    console.log(login + " has access")
                    userHasAccess = true;
                    loginUser = user;
                }
            });
          }).catch(function (error) {
            console.error(error);
          });
        
        
       

        if(userHasAccess){
            const auth0Response = await axios.post('https://dev-h3816xplrlj7v6b1.us.auth0.com/oauth/token', {
                grant_type: 'password',
                username: login,
                password: password,
                client_id: CLIENT_ID,
                client_secret: CLISENT_SECRET,
                audience: AUDIENCE,
            });
     
            const access_token  = auth0Response.data;
    
            console.log(access_token)

            if (access_token) {
                console.log(loginUser);
                req.session.username = loginUser.nickname;
                req.session.login = loginUser.email;

                res.json({ token: req.sessionId });
            } else {
                res.status(401).send('Unauthorized');
            }
        } else {
            res.status(401).send('Unauthorized');
        }
        
    } catch (error) {
        console.log(error)
        res.status(401).send('Unauthorized');
    }
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

function getAccesToken(){
    var options = { method: 'POST',
    url: 'https://dev-h3816xplrlj7v6b1.us.auth0.com/oauth/token',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form:
     { client_id: CLIENT_ID,
       client_secret:CLISENT_SECRET,
       audience: AUDIENCE,
       grant_type: 'client_credentials' }
     };
  
    request(options, function (error, response, body) {
      if (error) throw new Error(error);
  
      const responseBody = JSON.parse(body);
      // Display the access token
      oauthToken = responseBody.access_token;
      console.log(oauthToken)
  });
}

function getTokenPeriodically() {
    const filePath = './doc/tokenData.json';
    const tokenData = readTokenAndTimeFromFile(filePath);

    if (tokenData) {
        if(hasDayPassed(tokenData.time)) {
            getAccesToken();
            setTimeout(function() {
                saveTokenAndTimeToFile(oauthToken, Date.now(), filePath);
              }, 2000);
        } else {
            oauthToken = tokenData.token;
        }
        console.log('Токен:', tokenData.token);
        console.log('Час:', tokenData.time);
    } else {
        getAccesToken();
        setTimeout(function() {
            saveTokenAndTimeToFile(oauthToken, Date.now(), filePath);
          }, 2000);
    }
    
  }
  
  // Запускаємо оновлення токену
  getTokenPeriodically();

  function saveTokenAndTimeToFile(token, time, filePath) {
    console.log(token)
    const data = {
      token: token,
      time: time
    };

    const jsonData = JSON.stringify(data);
  
    try {
      fs.writeFileSync(filePath, '', 'utf8');
  
      fs.writeFileSync(filePath, jsonData, { flag: 'w', encoding: 'utf8' });
      console.log('Дані збережено у файлі:', filePath);
    } catch (err) {
      console.error('Помилка при записі у файл:', err);
    }
  }

  function readTokenAndTimeFromFile(filePath) {
    try {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile(filePath,'', (err) => {
                if (err) {
                    console.error('Помилка при створенні файлу:', err);
                } else {
                    console.log('Створено новий файл:', filePath);
                }
              });
            } else {
                console.log('Файл вже існує:', filePath);
            }
        });
    
        const fileData = fs.readFileSync(filePath);
        const data = JSON.parse(fileData);
        return data;
    } catch (error) {
        console.error('Помилка при зчитуванні файлу:', error);
        return null;
    }
  }

  function hasDayPassed(previousTime) {
    const millisecondsInDay = 24 * 60 * 60 * 1000; 
  
    const currentTime = new Date().getTime(); 
  
    const timeDifference = currentTime - previousTime;

    if (timeDifference >= millisecondsInDay) {
      return true; 
    } else {
      return false;
    }
  }