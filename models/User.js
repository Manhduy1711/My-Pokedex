require("dotenv").config()
const mongoose = require("mongoose");
const passportLocalMongoose =  require("passport-local-mongoose");
mongoose.connect("mongodb+srv://andou-duy:" + process.env.PASSWORD + "@cluster0.n771ixt.mongodb.net/userDB", {useNewUrlParser: true});
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        requied: true
    },
    password: {
        type: String,
        requied: true
    },
    pokemonTeam:[{
            id:  Number,
            name: String,
            weight:  Number,
            height:  Number,
            imageUrl:  String,
            gifUrl: String
    }], 
    todolist: [String],
})
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);
module.exports = User;