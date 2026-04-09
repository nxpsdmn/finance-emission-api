module.exports = (validator) => async (req, res, next) => {
  try {
    await validator(req);
    next();
  } catch (error) {
    next(error);
  }
};
