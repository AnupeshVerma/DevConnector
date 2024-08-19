const express = require("express");
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const ProfileModel = require('../../models/Profile');
const UserModel = require('../../models/User');
const PostModel = require('../../models/Posts');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post("/", [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

    // The select('-password') used to exclude the password being fetched
    try {
        const user = await UserModel.findById(req.user.id).select('-password');
        const newPost = new PostModel({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        const post = await newPost.save();
        res.json(post);
        console.log("A new post created");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
    console.log("Fetching all posts.");
    try {
        const posts = await PostModel.find().sort({date:-1});
        res.json(posts);
    }
    catch(err){
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  Private
router.get("/:id", auth, async (req, res) => {
    console.log("Fetching post.");
    try {
        const post = await PostModel.findById(req.params.id);

        if(!post)
            return res.status(404).json({ msg: "Post not found" });
        res.json(post);
    }
    catch(err){
        console.error(err.message);
        if(err.kind === 'ObjectId')
            return res.status(404).json({ msg: "Post not found" });
        res.status(500).send("Server Error");
    }
});

// @route   DELETE api/posts
// @desc    Delete a post
// @access  Private
router.delete("/:id", auth, async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.id);
        // Check if post exist
        if(!post)
            return res.status(404).json({ msg: "Post not found" });
        // Check user
        if(post.user.toString() !== req.user.id)
            return res.status(401).json({msg:'User not authorized'});

        await PostModel.deleteOne({ _id: req.params.id });
        res.json({ msg: "Post removed" });
    }
    catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId')
            return res.status(404).json({ msg: "Post not found" });
        res.status(500).send("Server Error");
    }
});

module.exports = router;
