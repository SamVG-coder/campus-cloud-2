require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport") ;
const LocalStrategy = require('passport-local').Strategy;
const nodemailer = require('nodemailer');
const flash = require('connect-flash');
var userOtp;
var generatedOtp;
var userMail,success_msg,error_msg;
var newUser;
const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(express.static("public"));
app.set('view engine', 'ejs');



app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true,useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

var userSchema = new mongoose.Schema({
    username: String,
    fname: String,
    lname: String,
    usn: String,
    email: String,
    password: String,
    phone: String
   });
const User = mongoose.model("User", userSchema);

passport.use(new LocalStrategy({usernameField:User.username},(username,password,done)=>{
 User.findOne({username:username})
 .then(user=>{
   if(!user){
     return done(null,false,{masssage:"Invalid user!!!"});
   }
   if(password!==user.password){
      return done(null,false,{masssage:"Incorrect password!!!"});
    }else{
      return done(null,user);
    }
  })

  .catch(err=> {
    console.log(err);
   })
}));

passport.serializeUser(function(user, done) {
  done(null,user.id); 
});

passport.deserializeUser(function(id, done) {
  User.findById(id,function(err,user){
    done(err,user);
  })
});
newUser=new User();



















app.get("/", function(req, res){
    res.render("home");
  });
app.get("/signup", function(req, res){
    res.render("signup");
  });
  app.get("/login", function(req, res){
    res.render("login");
  });
app.get("/reset-pass",(req,res)=>{
  res.render("reset-pass");
});

app.post("/otp",(req,res)=>{
  mongoose.Promise = global.Promise;
  mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true ,useUnifiedTopology: true});
  mongoose.set("useCreateIndex", true);  
  User.findOne({email :req.body.email},function(err, foundUser){
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser==null) {
        error_msg="Invalid username or password";
        res.send("/login",{error_msg:error_msg});
      }
      else
      {
        userMail=req.body.email;
        generatedOtp=Math.floor(Math.random()*10000);
        console.log("otp : "+generatedOtp);
        const transport = nodemailer.createTransport({
          service : 'gmail',
          auth: {
            user: 'sdmectcampuscloud@gmail.com',
            pass: 'ccsdmcet'
          }
        });
        const message = {
          from: 'sdmectcampuscloud@gmail.com', // Sender address
          to: userMail,         // List of recipients
          subject: 'Campus Cloud Student Verification ', // Subject line
          text: "Hi Peppy, Welcome to Campus cloud !!!", // Plain text body
          html:"<h1> your verification code is "+generatedOtp+"</h1>"
        };
        transport.sendMail(message, function(err, info) {
          if (err) {
            console.log(err)
          } 
          else 
          {
            console.log(info);
          }
        });
        res.render("otp");
      }
    }
  });
});  
app.post('/auth',(req , res,next)=> {
  var error_msg="Invalid USN or password";
  mongoose.Promise = global.Promise;
  mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true ,useUnifiedTopology: true});
  mongoose.set("useCreateIndex", true);  
    passport.authenticate('local', function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.render('login',{error_msg:error_msg}); }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
        return res.render("home");
      });
    })(req, res, next);
  });

app.get("/home",checkAuthentication,(req,res)=>{
  res.render("home");
});
function checkAuthentication(req,res,next){
  if(req.isAuthenticated()){
      //req.isAuthenticated() will return true if user is logged in
      next();
  } else{
      res.redirect("/");
  }
}
app.post('/logout', function (req, res){
  req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
  });
});

/*app.post('/login',(req,res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true ,useUnifiedTopology: true});
    mongoose.set("useCreateIndex", true);  
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function(){
          res.send("Logged Successfully");
        });
      }
    });
}
  );*/

app.post("/register",(req,res)=>{
  newUser=new User(req.body);
  userMail=req.body.email;




    mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true ,useUnifiedTopology: true});
    mongoose.set("useCreateIndex", true);  
    User.findOne({ $or: [ {usn :newUser.usn}, { email: newUser.email } ] },function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser==null) {
          newUser.username=newUser.usn;
          generatedOtp=Math.floor(Math.random()*10000);
          console.log("otp : "+generatedOtp);
          var userOtp=parseInt(req.body.otp);
          const transport = nodemailer.createTransport({
          service : 'gmail',
          auth: {
            user: 'sdmectcampuscloud@gmail.com',
            pass: 'ccsdmcet'
          }
        });
        const message = {
          from: 'sdmectcampuscloud@gmail.com', // Sender address
          to: userMail,         // List of recipients
          subject: 'Campus Cloud Student Verification ', // Subject line
          text: "Hi Peppy, Welcome to Campus cloud !!!", // Plain text body
          html:"<h1> your verification code is "+generatedOtp+"</h1>"
      };
      transport.sendMail(message, function(err, info) {
      if (err) {
        console.log(err)
      } else {
         console.log(info);
      }
  });
  res.render("newUser-otp");
}
else{
      error_msg="user exists with entered USN : "+newUser.usn+" or Gmail: " +userMail;
        res.render("signup",{error_msg:error_msg});
      }
    }
  });
});
app.post("/retry-otp",(req,res)=>{
  userOtp=parseInt(req.body.otp);
  if(generatedOtp===userOtp){
    res.render("set-pass");
  }else{
    var Verified=false;
    res.render("retry-otp",{isVerified : Verified});
  }
});
app.post("/reEnter-otp",(req,res)=>{
  userOtp=parseInt(req.body.otp);
  if(generatedOtp===userOtp){


    mongoose.Promise = global.Promise;
    mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true ,useUnifiedTopology: true});
    mongoose.set("useCreateIndex", true);  
    User.findOne({usn :newUser.usn},function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser==null) {
          newUser.username=newUser.usn;
          newUser.save(function(error){
            if(error){
              console.log(error);
            }else{
          res.render("login",{success_msg:"Registered Successfully !!! Please login."});
            }
          });
      }else{
        res.render("login",{success_msg:"Registered Successfully !!! Please login."});
        db.close();
      }
    }
  });

  }else{
    var Verified=false;
    res.render("reEnter-otp",{isVerified : Verified});
  }
});

app.post("/set-pass",(req,res)=>{
  res.render("set-pass");
});
app.post("/update-pass",(req,res)=>{
  mongoose.Promise = global.Promise;
  mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true ,useUnifiedTopology: true});
  mongoose.set("useCreateIndex", true);  
  User.findOne({email :userMail},function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser==null) {
        res.send("Something went wrong ");
      }
      else{
        console.log(req.body);
        console.log(foundUser);
        User.findOneAndUpdate({email:userMail}, {$set : {password:req.body.new_pass}}, function(err, doc) {
          if (err) throw err;
          else
            console.log(doc);
          console.log("1 document updated");
          db.close();
        });
        res.render("login",{success_msg:"Password updated !!! Please login."});
      }
    }
  });  
});

app.get("/miniproject",(req,res)=>{
  res.render("projects/miniproject");
});
app.listen(process.env.PORT||3000, function() {
    console.log("Server started on port 3000.");
  });