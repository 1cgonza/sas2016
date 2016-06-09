var baseUrl = 'http://localhost:3000';
var ogImg = 'SAS2016-OG-1200x630.jpg';
var thumb = 'SAS2016-OG-500x300.jpg';

var environments = {
  dev: {
    baseUrl: 'http://localhost:3000',
    isDev: true
  },
  prod: {
    baseUrl: 'http://sas2016.adm.ntu.edu.sg',
    isDev: false
  }
};

var defaults = {
  siteTitle: '28th Annual Conference of the Society for Animation Studies :: The Cosmos of Animation',
  author: 'Juan Camilo González',
  email: 'info@juancgonzalez.com',
  siteDescription: 'SAS Conference hosted by the School of Art, Design and Media, Nanyang Technological University of Singapore.',
  defaultImage: baseUrl + '/img/' + ogImg,
  defaultThumb: baseUrl + '/img/' + thumb,
  logos: {
    ntu: {
      name: 'School of Art, Design & Media',
      url: 'http://www.adm.ntu.edu.sg/',
      img: 'img/logo_NTU-ADM.png',
      width: 97,
      height: 45
    },
    sas: {
      name: 'Society for Animation Studies',
      url: 'http://animationstudies.org/',
      img: 'img/logo-sas.png',
      width: 86,
      height: 45
    }
  }
};

function attachOptions(options) {
  for (var option in options) {
    defaults[option] = options[option];
  }
  defaults.defaultImage = options.baseUrl + '/img/' + ogImg;
  return defaults;
}

var defineEnvironment = function(args) {
  var env = attachOptions(environments.dev);

  args.forEach(function(val) {
    if (val === '--prod' || val === '-p') {
      env = attachOptions(environments.prod);
    }
  });

  return env;
};

module.exports = defineEnvironment;
