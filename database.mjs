import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcrypt";

/**
 * 
 * @returns {Promise<Sequelize>}
 */
export async function loadSequelize() {
    try {

        const login = {
            database: "app-database",
            username: "root",
            password: "root"
        };

        // Connexion à la BDD
        const sequelize = new Sequelize(login.database, login.username, login.password, {
            host: '127.0.0.1',
            port: 3307,
            dialect: 'mysql'
        });


        // ----  1. Création de tables via les models ---- 
        // Création des models (tables) -------------//

        const User = sequelize.define("User", {
            username: DataTypes.STRING,
            email: DataTypes.STRING,
            password: {
                type: DataTypes.STRING,
                set(clearPassword) {
                    const hashedPassword = bcrypt.hashSync(clearPassword, 10);
                    this.setDataValue('password', hashedPassword);
                }
            }
        });
        const Post = sequelize.define("Post", {
            title: DataTypes.STRING,
            content: DataTypes.STRING
        });
        const Comment = sequelize.define("Comment", {
            content: DataTypes.STRING
        });


        User.hasMany(Post);
        Post.belongsTo(User);

        User.hasMany(Comment);
        Comment.belongsTo(User);

        Post.hasMany(Comment);
        Comment.belongsTo(Post);

        await sequelize.sync({ force: true });
        console.log("Connexion à la BDD effectuée")

        // Init data
        const userOne = await User.create({
            username: "Amaury",
            email: "amaury@mail.com",
            password: "1234"
        });
        const userTwo = await User.create({
            username: "Meiko",
            email: "meiko@mail.com",
            password: "1234"
        });

        const postOne = await userOne.createPost({ title: "Post test 1", content: "Ceci est le Post 1" });

        const postTwo = await userTwo.createPost({ title: "Post test 2", content: "Ceci est le Post 2" });

        await Comment.create({
            content: "Ceci est un commentaire du Post 1",
            UserId: userOne.id,
            PostId: postOne.id
        });

        await Comment.create({
            content: "Ceci est un autres commentaire du Post 1",
            UserId: userTwo.id,
            PostId: postOne.id
        });

        await Comment.create({
            content: "Ceci est un commentaire du Post 2",
            UserId: userOne.id,
            PostId: postTwo.id
        });

        await Comment.create({
            content: "Ceci est un autres commentaire du Post 2",
            UserId: userTwo.id,
            PostId: postTwo.id
        });

        return sequelize;

    } catch (error) {
        console.log(error);
        throw new Error("Connexion impossible à la BDD :(");
    }
}