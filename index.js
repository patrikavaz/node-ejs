const express = require('express');
const sequelize = require('./db');
const { DataTypes, Op  } =require('sequelize');
const session = require('express-session');
const { isAuthenticated } = require('./middlewares/auth.middleware');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: 'mySecretKey123',
        saveUninitialized: true,
        cookie: { maxAge: 3600000 },
    })
);

const User = sequelize.define(
    'User',
    {
        username: {
            type: DataTypes.STRING,
            allowNull : false, 
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull : false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull : false
        },
    },
    {
        timestaamps: true,
    }

);

sequelize
    .sync({ force: false})
    .then(()=> {
        console.log('Database & tables created!');
    })
    .catch((error) => {
        console.error('Error creating database & table: ', error);  
    });

app.get('/',(req, res) => {
    console.log(req.session.user)
    res.render('index');
});

app.get('/login',(req, res) => {
    res.render('user/login');
});

app.get('/profile', isAuthenticated,(req,res)=> {
    res.render('user/profile');
});

// post method -> login
app.post('/login', async (req, res) => {
    const {username,password} = req.body;
    const exists_user = await User.findOne({
        where: {
            username
        }
    });

    if (!exists_user) {
        res.send({message: 'Username is dose not exists.'});
        return;
    }

    if (password == exists_user.password ) {
        req.session.user =  username ;    
        res.redirect('/');

    }else {
        res.send({message: 'Password is dose not exists.'});
    }
});

app.get('/register',(req, res) => {
    res.render('user/register');
});

// post method -> Register
app.post('/register', async (req, res)=> {
    const {username, email,password,confirm_password} = req.body;
    const exists_user = await User.findOne({
        where: {
            [Op.or]: [{ username }, { email }],
        },
    });

    if (exists_user) {
        res.send({message: 'Duplicate email or username...'})
    }

    if ( password !== confirm_password ) {
        res.send({ message: 'Confirm password does not match.'});
        return;
    }

    const user = await User.create({
        username,
        email,
        password, 
    });

    res.redirect('/login');

});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
