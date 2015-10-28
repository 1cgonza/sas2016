var Metalsmith   = require('metalsmith');
var Handlebars   = require('handlebars');
var ignore       = require('metalsmith-ignore');
var collections  = require('metalsmith-collections');
var sass         = require('metalsmith-sass');
var each         = require('metalsmith-each');
var autoprefixer = require('metalsmith-autoprefixer');
var markdown     = require('metalsmith-markdown');
var permalinks   = require('metalsmith-permalinks');
var templates    = require('metalsmith-layouts');
var htmlMin      = require('metalsmith-html-minifier');
var slug         = require('slug');
var moment       = require('moment');
var circularJSON = require('circular-json');
var browserSync  = require('browser-sync');
var chalk        = require('chalk');
var metadata     = require('./config')(process.argv);
var fs           = require('fs');

if (metadata.isDev) {
  build(watch);
} else {
  console.log('ready');
}

function watch () {
  browserSync({
    server: 'build',
    files: [{
      match: ['src/**/*.md', 'src/scss/**/*.scss', 'src/**/*.js', 'templates/**/*.hbs', 'templates/**/*.html'],
      fn: function (event, file) {
        if (event === 'change') {
          build(this.reload);
          console.log( chalk.cyan('Updated file: ') + chalk.yellow(file) );
        }
      }
    }],
    // logLevel: 'debug',
    notify: false
  });
}

function build(callback) {
  var metalsmith = new Metalsmith(__dirname);

  metalsmith.metadata(metadata);

  metalsmith.use( ignore(['**/.DS_Store']) );

  metalsmith.use( collections({
    updates: {
      pattern: 'updates/**/*.md',
      sortBy: 'date',
      reverse: true
    },
    keynotes: {
      pattern: 'keynotes/**/*.md',
      sortBy: 'date',
      reverse: true
    }
  }) );

  metalsmith.use( markdown({
    smartypants: true
  }) );

  metalsmith.use( each(function (file, filename) {
    var safeSlug = file.title ? slug(file.title, {lower: true}) : null;
    if (safeSlug !== null) {
      file.slug = safeSlug;
    }
  }) );

  metalsmith.use( sass({
    outputStyle: 'compressed',
    outputDir: 'css/'
  }) );

  metalsmith.use( autoprefixer() );

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
  setDate: function (date) {
    var d = moment(date).format('MMM D, YYYY');
    return new Handlebars.SafeString(d);
  },
  setURL: setURL
});

function setURL (path) {
  return metadata.baseUrl + path;
}