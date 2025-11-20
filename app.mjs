import { loadSequelize } from "./database.mjs";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser';

/**
 * Point d'entrée de l'application
 * Vous déclarer ici les routes de votre API REST
 */
async function main() {

    const sequelize = await loadSequelize();
    const app = express();

    const User = sequelize.models.User;
    const Post = sequelize.models.Post;
    const Comment = sequelize.models.Comment;

    const JWT_SECRET = 'TheSecretPublic';

    app.use(express.json());
    app.use(cookieParser());


    // Register
    app.post('/register', async (req, res) => {
        const { username, email, password, verifiedPassword } = req.body;

        if (!email || !password || !verifiedPassword) {
            return res.status(400).json({ message: 'Email, password and verifiedPassword are required' });
        }

        if (password !== verifiedPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        try {
            const newUser = await User.create({ username, email, password });
            res.status(201).json({ message: 'User registered successfully', userId: newUser.id, username: newUser.username });
        } catch (error) {
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    });

    // Route LOGIN
    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        try {
            const user = await User.findOne({ where: { email } });
            const isPasswordMatch = bcrypt.compareSync(password, user.password);

            if (!user || !isPasswordMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true });
            res.json({ message: 'Login successful' });
        } catch (error) {
            res.status(500).json({ message: 'Error logging in', error: error.message });
        }
    });

    // Route GET ALL Posts and Comments

    app.get("/all", async (req, res) => {
        try {
            const posts = await Post.findAll();
            const comments = await Comment.findAll();

            res.json({ posts, comments });
            
        } catch (error) {
            console.log(error);
            res.status(500).json("Erreur serveur");
        }
    });

    // Middleware pour protection des routes
    app.use(isLoggedInJWT(User));

    // Route Add-Post
    app.post("/post", async (req, res) => {
        const newPostData = req.body;

        try {
            const newPost = await Post.create({
                title: newPostData.title,
                content: newPostData.content,
                UserId: req.user.id
            });
            res.json(newPost);
        } catch (error) {
            res.status(500).json({ error: "Erreur lors de la création du Post" });
        }
    });

    // Route LOGOUT
    app.get('/logout', (req, res) => {
        res.clearCookie('token');
        res.json({ message: 'Logout successful' });
    });

    function isLoggedInJWT(UserModel) {
        return async (req, res, next) => {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({ message: 'Unauthorized: No token provided' });
            }
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.userId = decoded.userId;
                req.user = await UserModel.findByPk(req.userId);

                if (!req.user) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }

                next();
            } catch (error) {
                return res.status(401).json({ message: 'Unauthorized: Invalid token' });
            }
        }
    }


    app.listen(3000, () => {
        console.log("Serveur démarré sur http://localhost:3000");
    });


}
main();