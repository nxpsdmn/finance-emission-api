const User = require("./schemas/user.schema");

const createUserByNxStartId = async ({ nxstartUserId, accessToken, refreshTokenExpiresAt }) =>
	User.create({
		nxstart_user_id: nxstartUserId,
		accessToken,
		refreshTokenExpiresAt,
	});

const updateUserTokensByNxStartId = async ({ nxstartUserId, accessToken, refreshTokenExpiresAt }) =>
	User.findOneAndUpdate(
		{
			nxstart_user_id: nxstartUserId,
		},
		{
			$set: {
				accessToken,
				refreshTokenExpiresAt,
			},
		},
		{
			new: true,
			runValidators: true,
		}
	).lean();


const findUserByNxStartId = async (nxstartUserId) =>
	User.findOne({ 
		nxstart_user_id: nxstartUserId 
	}).lean();

const findUserByAccessToken = async (accessToken) =>
	User.findOne({ 
		accessToken 
	}).lean();


const clearUserTokensByNxStartId = async (nxstartUserId) =>
	User.findOneAndUpdate(
		{
			nxstart_user_id: nxstartUserId
		},
		{
			$set: {
				accessToken: null,
				refreshTokenExpiresAt: null,
			},
		},
		{
			new: true,
			runValidators: true,
		}
	).lean();

module.exports = {
	createUserByNxStartId,
	updateUserTokensByNxStartId,
	findUserByNxStartId,
	findUserByAccessToken,
	clearUserTokensByNxStartId,
};
