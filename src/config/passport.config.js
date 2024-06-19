//passport.config.js

import passport from "passport";
import local from "passport-local";
import UsersModel from "../models/users.model.js";
import { createHash, isValidPassword } from "../utils/hashbcryp.js";
import GitHubStrategy from "passport-github2";

const LocalStrategy = local.Strategy;

const initializePassport = () =>{
    passport.use("register", new LocalStrategy({
        //Le digo que quiero acceder al objeto request
        passReqToCallback: true,
        usernameField: "email"
    }, async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body;

        try {
            let usuario = await UsersModel.findOne({email});
            if (usuario) {
                return done(null, false);
            }

            //Si no existe voy a crear un registro de usuario nuevo: 

            let nuevoUsuario = {
                first_name,
                last_name,
                email,
                age,
                password: createHash(password)
            }

            let resultado = await UsersModel.create(nuevoUsuario);
            return done(null, resultado);
            //Si todo resulta bien, podemos mandar done con el usuario generado. 
        } catch (error) {
            return done(error);
        }
    }))

    //Agregamos otra estrategia para el "Login".
    passport.use("login", new LocalStrategy({
        usernameField: "email"
    }, async (email, password, done) => {

        try {
            let usuario = await UsersModel.findOne({email});

            if (!usuario) {
                console.log("Este usuario no existeee ehhhh vamo a mori!");
                return done(null, false);
            }

            //Si existe verifico la contraseña: 
            if (!isValidPassword(password, usuario)) {
                return done(null, false);
            }

            return done(null, usuario);


        } catch (error) {
            return done(error);
        }
    }))


    //serializar y deserealizar

    passport.serializeUser((user, done) => {
        done(null, user._id)
    })


    passport.deserializeUser(async (id, done) => {
        let user = await UsersModel.findById({_id: id});
        done(null, user)
    });

    //generamos la nueva estrategia con github
    passport.use("github", new GitHubStrategy({
        clientID: "Iv23liVkzNCXPxb64kEh",
        clientSecret: "11defeda49832ac1c043b0b27320612a694f751f",
        callbackURL: "http://localhost:8080/api/sessions/githubcallback"
    }, async (accessToken, refreshToken, profile, done) => {
        //Veo los datos del perfil
        console.log("Profile:", profile);

        try {
            let usuario = await UsersModel.findOne({ email: profile._json.email });

            if (!usuario) {
                let nuevoUsuario = {
                    first_name: profile._json.name,
                    last_name: "",
                    age: 30,
                    email: profile._json.email,
                    password: ""
                }

                let resultado = await UsersModel.create(nuevoUsuario);
                done(null, resultado);
            } else {
                done(null, usuario);
            }
        } catch (error) {
            return done(error);
        }
    }))

};





export default initializePassport;