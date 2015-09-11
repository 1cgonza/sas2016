require('harmonize')();
var Metalsmith   = require('metalsmith');
var Handlebars   = require('handlebars');
var ignore       = require('metalsmith-ignore');
var sass         = require('metalsmith-sass');
var autoprefixer = require('metalsmith-autoprefixer');
var markdown     = require('metalsmith-markdown');
var permalinks   = require('metalsmith-permalinks');
var templates    = require('metalsmith-templates');
var htmlMin      = require('metalsmith-html-minifier');
var circularJSON = require('circular-json');
var browserSync  = require('browser-sync');
var metadata     = require('./config')(process.argv);
var fs           = require('fs');

if (metadata.isDev) {
  browserSync({
    server: 'build',
    files: ['src/**/*.md', 'src/scss/**/*.scss', 'src/**/*.js', 'templates/**/*.hbs', 'templates/**/*.html'],
    // logLevel: 'debug',
    notify: false,
    middleware: function (req, res, next) {
      build(next);
    }
  });
} else {
  build(deploy);
}

function deploy() {
  console.log('ready');
}


function build(callback) {
  var metalsmith = new Metalsmith(__dirname);

  metalsmith.metadata(metadata);

  metalsmith.use( ignore(['**/.DS_Store']) );

  metalsmith.use( markdown({
    smartypants: true
  }) );

  metalsmith.use( sass({
    outputStyle: 'compressed',
    outputDir: 'css/'
  }) );

  // metalsmith.use( autoprefixer() );

  metalsmith.use( permalinks({
    pattern: ':title',
    relative: false
  }) );

  metalsmith.use( templates({
    engine: 'handlebars',
    directory: 'templates'
  }) );

  metalsmith.use( htmlMin() );

  metalsmith.build( function(err) {
    if (err) {
      throw err;
    }
    callback();
  } );
}

Handlebars.registerPartial({
  head: fs.readFileSync(__dirname + '/templates/partials/head.hbs').toString(),
  footer: fs.readFileSync(__dirname + '/templates/partials/footer.hbs').toString()
});

Handlebars.registerHelper({
  debug: function (context) {
    return new Handlebars.SafeString(
      '<div class="debug">' + circularJSON.stringify(context) + '</div>'
    );
  },
  pageTitle: function (title) {
    var pageTitle = metadata.siteTitle;

    if (title) {
      pageTitle = title + ' :: ' + metadata.siteTitle;
    }

    return new Handlebars.SafeString(pageTitle);
  },
  slug: function (title) {
    var slug = title ? title.replace(/\W+/g, '-').toLowerCase() : '';

    return new Handlebars.SafeString(slug);
  },
  pageDescription: function (description) {
    var pageDescription = description ? description : metadata.siteDescription;

    return new Handlebars.SafeString(pageDescription);
  },
  featuredImg: function (image) {
    var featuredImg = image ? image : metadata.defaultImage;

    return new Handlebars.SafeString(featuredImg);
  },
  getThumb: function (thumb) {
    var pageThumb = thumb ? thumb : metadata.defaultThumb;

    return new Handlebars.SafeString(pageThumb);
  },
  setURL: setURL
});

function setURL (path) {
  return metadata.baseUrl + path;
}