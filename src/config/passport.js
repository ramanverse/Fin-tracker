const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userModel = require('../models/userModel');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findByGoogleId(profile.id);

        if (!user) {
          // Check if user exists by email
          const email = profile.emails[0].value;
          user = await userModel.findByEmail(email);

          if (user) {
            // Update user with Google ID
            // Assuming this would just require a direct DB query for now
            // We can skip this edge case for MVP or add it to userModel later
          } else {
            user = await userModel.createUser({
              name: profile.displayName,
              email: profile.emails[0].value,
              google_id: profile.id,
              password_hash: null, // No password for OAuth
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
