
/**
 * Expose
 */

module.exports = {
  db: 'mongodb://localhost/your_project_development',
  github: {
      clientID: '7caf24031b74c56ccec8',
      clientSecret: '8c672731265276334253618c7e3447e798907b7a',
      callbackURL: 'http://localhost:3000/github/callback',
  },
  facebook: {
    clientID: 'APP_ID',
    clientSecret: 'SECRET',
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    scope: [
      'email',
      'user_about_me',
      'user_friends'
    ]
  },
  google: {
    clientID: 'APP_ID',
    clientSecret: 'SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.google.com/m8/feeds',
    ]
  }
};
