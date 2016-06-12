var Metalsmith   = require('metalsmith');
var Handlebars   = require('handlebars');
var ignore       = require('metalsmith-ignore');
var collections  = require('metalsmith-collections');
var drafts       = require('metalsmith-drafts');
var sass         = require('metalsmith-sass');
var each         = require('metalsmith-each');
var autoprefixer = require('metalsmith-autoprefixer');
var markdown     = require('metalsmith-markdown');
var permalinks   = require('metalsmith-permalinks');
var templates    = require('metalsmith-layouts');
var htmlMin      = require('metalsmith-html-minifier');
var uglify       = require('metalsmith-uglify');
var slug         = require('slug');
var moment       = require('moment-timezone');
var circularJSON = require('circular-json');
var browserSync  = require('browser-sync');
var chalk        = require('chalk');
var metadata     = require('./config')(process.argv);
var fs           = require('fs');

if (metadata.isDev) {
  build(watch);
} else {
  build(prodBuildReady);
}

function watch() {
  browserSync({
    server: 'build',
    files: [{
      match: ['src/**/*.md', 'src/**/*.html', 'src/scss/**/*.scss', 'src/**/*.js', 'templates/**/*.hbs'],
      fn: function(event, file) {
        if (event === 'change') {
          build(this.reload);
          console.log(chalk.cyan('Updated file: ') + chalk.yellow(file));
        }
      }
    }],
    // logLevel: 'debug',
    notify: false
  });
}

function prodBuildReady() {
  console.log(chalk.yellow('..:: Production build ready ::..'));
}

function build(callback) {
  var metalsmith = new Metalsmith(__dirname);

  metalsmith.metadata(metadata);

  metalsmith.use(ignore(['**/.DS_Store']));

  metalsmith.use(collections({
    updates: {
      pattern: 'updates/**/*.md',
      sortBy: 'date',
      reverse: true
    },
    keynotes: {
      pattern: 'keynotes/**/*.md',
      sortBy: 'order'
    },
    events: {
      pattern: 'events/**/*.md',
      sortBy: 'date'
    },
    schedule: {
      pattern: 'schedule/**/*.html',
      sortBy: 'dateStart'
    }
  }));

  metalsmith.use(drafts());

  metalsmith.use(markdown({
    smartypants: true,
    gfm: true,
    tables: true
  }));

  metalsmith.use(each(function(file, filename) {
    var safeSlug = file.title ? slug(file.title, {lower: true}) : null;
    if (safeSlug !== null) {
      file.slug = safeSlug;
    }
  }));

  metalsmith.use(sass({
    sourceMap: true,
    sourceMapContents: true,
    outputStyle: 'compressed',
    outputDir: 'css/'
  }));

  metalsmith.use(autoprefixer());

  metalsmith.use(permalinks({
    pattern: ':title',
    relative: false
  }));

  metalsmith.use(templates({
    engine: 'handlebars',
    directory: 'templates'
  }));

  metalsmith.use(htmlMin());

  metalsmith.use(uglify());

  metalsmith.build(function(err) {
    if (err) {
      throw err;
    }
    callback();
  });
}

Handlebars.registerPartial({
  head: fs.readFileSync(__dirname + '/templates/partials/head.hbs').toString(),
  footer: fs.readFileSync(__dirname + '/templates/partials/footer.hbs').toString(),
  scheduleNav: fs.readFileSync(__dirname + '/templates/partials/schedule-nav.hbs').toString()
});

Handlebars.registerHelper({
  debug: function(context) {
    return new Handlebars.SafeString(
      '<div class="debug">' + circularJSON.stringify(context) + '</div>'
    );
  },

  slug: function(string) {
    if (typeof string !== 'string') {
      return;
    }
    return new Handlebars.SafeString(slug(string));
  },

  pageTitle: function(title) {
    var pageTitle = metadata.siteTitle;

    if (title) {
      pageTitle = title + ' :: ' + metadata.siteTitle;
    }

    return new Handlebars.SafeString(pageTitle);
  },

  slug: function(title) {
    var slug = title ? title.replace(/\W+/g, '-').toLowerCase() : '';
    return new Handlebars.SafeString(slug);
  },

  pageDescription: function(description) {
    var pageDescription = description ? description : metadata.siteDescription;
    return new Handlebars.SafeString(pageDescription);
  },

  featuredImg: function(image, asImageTag, width, height) {
    var featuredImg = '';
    var src = image ? setURL('img/' + image, false) : metadata.defaultImage;
    var w = typeof width === 'number' ? width : '500';
    var h = typeof height === 'number' ? height : '300';

    if (typeof asImageTag === 'boolean' && asImageTag) {
      featuredImg = '<img src="' + src + '" width="' + w + '" height="' + h + '">';
    } else {
      featuredImg = src;
    }

    return new Handlebars.SafeString(featuredImg);
  },

  setDate: function(date, formatString) {
    var d = moment(date).tz('Asia/Singapore').format(formatString);
    return new Handlebars.SafeString(d);
  },

  isActive: function(current, compareTo) {
    var newClass = '';
    if (current === compareTo) {
      newClass = 'active';
    }

    return new Handlebars.SafeString(newClass);
  },

  setURL: setURL
});

function setURL(url, withTail) {
  var URL = !url ? metadata.baseUrl : metadata.baseUrl + '/' + url;
  var tail = typeof withTail === 'boolean' && withTail && url ? '/' : '';
  return URL + tail;
}
