const express = require("express");
const https = require("https");
const ejs = require("ejs");
const Pokedex = require('pokedex');
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");

const User = require('./models/User');

const app = express();
const pokedex = new Pokedex();


app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
}))
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user);
});
  
passport.deserializeUser((user, done) => {
    done(null, user);
});
    
app.get("/", function(req,res) {
    if(req.isAuthenticated()) {
        res.render("home-logined", {user: req.user});
    }
    else {
        res.render("home-guest");
    }
    
})

app.get("/pokemon/:page", function(req,res) {
    const page = parseInt(req.params.page) || 1;
    const pageSize = 20;
    var pageSkip = (page-1) * pageSize;
    const pokemons = pokedex.pokemon()
    .slice(0,721)
    .slice(pageSkip, pageSize*page);
    if(req.isAuthenticated()) {
        res.render("allpokemon-logined", {user: req.user, results: pokemons, current: page, pages: Math.ceil( 720/ pageSize)})
    }
    else {
        res.render("allpokemon-guest", {user: false,results: pokemons, current: page, pages: Math.ceil( 720/ pageSize)})

    }
})

app.get("/pokemon/detail/:pokemonId", function(req,res) {
    if(req.isAuthenticated()) {
        const pokeId = Number.parseInt(req.params.pokemonId);
        const foundPokemon = pokedex.pokemon(pokeId);
        res.render("detail", {pokemonDetail: foundPokemon, user: req.user});
    }
    else {
        res.redirect("/login");
    }
})

app.post("/pokemon/detail/:pokemonId", function(req,res) {
    if(req.isAuthenticated()) {
        var existed = false;
        const pokemonId = parseInt(req.params.pokemonId);
        const pokemonTarget = pokedex.pokemon(pokemonId);
        User.findOne({_id : req.user}, function(err, foundUser) {
            foundUser.pokemonTeam.forEach(element => {
                if (element.name === pokemonTarget.name) {
                    existed = true
                }
            });
            console.log()
            if(!existed) {
                var newMember = {
                    id: pokemonTarget.id,
                    name: pokemonTarget.name,
                    weight: pokemonTarget.weight,
                    height: pokemonTarget.height,
                    imageUrl: pokemonTarget.sprites.normal,
                    gifUrl: pokemonTarget.sprites.animated
                }
                User.updateOne({_id: req.user._id}, {$push: {pokemonTeam: newMember}}, function(err) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        res.redirect("/team");
                    }
                });
            } else {
                console.error("This pokemon is existed in your team");
                res.redirect("/pokemon/1");
            }
        })
    } else {
        res.redirect("/login");
    }
})

app.get("/team", function(req,res) {
    User.findOne({_id: req.user._id}, function(err, foundUser) {
        if(err) {
            console.log(err);
        } else {
            res.render("team", {results: foundUser.pokemonTeam, user: req.user})
        }
    })
})

app.post("/pokemon/delete", function(req, res) {
    User.updateOne({_id: req.user._id}, {$pull: {pokemonTeam: {id: req.body.btnDelete}}}, function(err) {
        if(err) {
            console.log(err);
        }
        else {
            res.redirect("/team");
        }
    });
})


var options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit"
}
var today = new Date();
var day = today.toLocaleDateString("en-US", options);

app.get("/list", function(req,res) {
    User.findOne({_id: req.user._id}, function(err, foundUser) {
        if(err) {
            console.log(err);
        } else {
            res.render("list", {kindOfDay: day, ListItems : foundUser.todolist, user: req.user})
        }
    })
})

app.post("/list", function(req,res) {
    if(req.isAuthenticated()) {
        const newItem = req.body.addItem;
        User.updateOne({_id: req.user._id}, {$push : {todolist: newItem}}, function(err) {
            if(err) {
                console.log(err);
            }
            else {
                res.redirect("/list")
            }
        })
    } else {
        res.redirect("/login");
    }
})

app.post("/list/delete", function(req,res) {
    if(req.isAuthenticated()) {
        const deleteItem = req.body.checkbox;
        User.updateOne({_id: req.user._id}, {$pull : {todolist: deleteItem}}, function(err) {
            if(err) {
                console.log(err);
            }
            else {
                res.redirect("/list")
            }
        })
    } else {
        res.redirect("/login");
    }
})
app.get("/register", function(req,res) {
    res.render("register");
})

app.post("/register", function(req,res) {
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res, function() {
                res.redirect("/login");
            })
        }
    })
})

app.get("/login", function(req,res) {
    res.render("login");
})

app.post("/login", function(req,res) {
    const user = new User ({
        username: req.body.userName,
        password: req.body.password
    })
    req.login(user, function(err) {
        if(err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req,res, function() {
                res.redirect("/");
            })
        }
    })

})

app.get("/logout", function(req,res) {
    if(req.isAuthenticated()) {
        req.logout(function(err) {
            if(err) {
                console.log(err);
            }
            else {
                res.redirect("/");
            }
        });
    }
    else {
        res.redirect("/login");
    }

})

app.listen(process.env.PORT || 3000, function() {
    console.log("Server is running up on port 3000");
})