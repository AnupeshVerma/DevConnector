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
        const posts = await PostModel.find().sort({ date: -1 });
        res.json(posts);
    }
    catch (err) {
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

        if (!post)
            return res.status(404).json({ msg: "Post not found" });
        res.json(post);
    }
    catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId')
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
        if (!post)
            return res.status(404).json({ msg: "Post not found" });
        // Check user
        if (post.user.toString() !== req.user.id)
            return res.status(401).json({ msg: 'User not authorized' });

        await PostModel.deleteOne({ _id: req.params.id });
        res.json({ msg: "Post removed" });
    }
    catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId')
            return res.status(404).json({ msg: "Post not found" });
        res.status(500).send("Server Error");
    }
});

// ####################### LIKES ########################

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.id);

        // Check if the post is already liked by the user
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: "Post already liked" });
        }

        post.likes.unshift({ user: req.user.id });    // unshift is used to add the content in the beginning
        await post.save();

        res.json(post.likes);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.id);

        // Check if the post is already liked by the user
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: "Post has not yet been liked" });
        }

        //get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);
        await post.save();

        res.json(post.likes);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

// ################# COMMENTS ####################### 
// @route   POST api/posts/comments/:id
// @desc    Comment on a post
// @access  Private
router.post("/comment/:id", [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

    // The select('-password') used to exclude the password being fetched
    try {
        const user = await UserModel.findById(req.user.id).select('-password');
        const post = await PostModel.findById(req.params.id);

        const newComments = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(newComments);
        await post.save();
        res.json(post.comments);
        console.log("A new comment created");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   DELETE api/posts/comments/:id/:comment_id
// @desc    Delete Comment on a post
// @access  Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
    // The select('-password') used to exclude the password being fetched
    try {
        const user = await UserModel.findById(req.user.id).select('-password');
        const post = await PostModel.findById(req.params.id);

        // Pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Make sure comment exists
        if (!comment)
            return res.status(400).json({ msg: 'Comment does not exists' });

        // Check user
        if (comment.user.toString() !== req.user.id)
            return res.status(401).json({ msg: 'User not authorized' });
        // Delete comment
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
        post.comments.splice(removeIndex, 1);
        await post.save();

        res.json(post.comments);
        console.log("Comment deleted.");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
