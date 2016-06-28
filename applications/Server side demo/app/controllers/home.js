
/*!
 * Module dependencies.
 */

exports.index = function (req, res) {
  res.render('home/index', {
    user: req.user ? req.user : undefined,
    title: 'Node Express Mongoose Boilerplate'
  });
};
