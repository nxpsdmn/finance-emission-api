const mongoose = require("mongoose");
const env = require("../../../config/env");

const userSchema = new mongoose.Schema(
    {
		nxstart_user_id: { 
			type: String, 
			required: true, 
			unique: true, 
			index: true 
		},
		accessToken: { 
			type: String, 
			default: null,
		},
		refreshTokenExpiresAt: { 
			type: Date, 
			default: null,
		},
    },
    { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema, env.collectionNames.users);
