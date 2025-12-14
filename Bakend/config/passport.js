const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error(
    "[Google OAuth] Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL env variables. Google login may fail."
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID || "",
      clientSecret: GOOGLE_CLIENT_SECRET || "",
      callbackURL:
        GOOGLE_CALLBACK_URL || "http://localhost:5000/api/user/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        const name =
          profile.displayName ||
          (profile.name && `${profile.name.givenName || ""} ${profile.name.familyName || ""}`.trim());

        if (!email) {
          return done(null, false, { message: "No email provided by Google" });
        }

        let user = await userModel.findOne({ email });

        if (!user) {
          const randomPassword = await bcrypt.genSalt(10).then(async (salt) => {
            const raw = `${Date.now()}_${Math.random()}_${email}`;
            return bcrypt.hash(raw, salt);
          });

          user = await userModel.create({
            name: name || email.split("@")[0],
            email,
            password: randomPassword,
            avatar:
              (profile.photos && profile.photos[0] && profile.photos[0].value) ||
              undefined,
          });
        }

        return done(null, user);
      } catch (err) {
        console.error("GoogleStrategy error", err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
