const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "You are not logged in! Please log in to get access.",
      });
    }
    
    // 2) Verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token does no longer exist.",
      });
    }
    
    // 4) Check if user changed password after the token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: "User recently changed password! Please log in again.",
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed. Please log in again.",
    });
  }
}; 