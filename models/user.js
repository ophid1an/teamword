const mongoose = require('mongoose');
const limits = require('../config');
const Schema = mongoose.Schema;

const UserSchema = Schema({
    username: {
        type: String,
        required: true,
        minlength: limits.USERNAME_MIN_LENGTH,
        maxlength: limits.USERNAME_MAX_LENGTH,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    pwd: {
        type: String,
        required: true
    },
    friends: [{
        friend: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        completedGames: {
            type: Number,
            min: 0,
            default: 0
        }
    }],
    isAdmin: Boolean
});

module.exports = mongoose.model('User', UserSchema);
