var initPhotoSwipeFromDOM = function(gallerySelector) {
  var parseThumbnailElements = function(el) {
    var thumbElements = el.childNodes;
    var numNodes = thumbElements.length;
    var items = [];
    var figureEl;
    var linkEl;
    var size;
    var item;

    for (var i = 0; i < numNodes; i++) {

      figureEl = thumbElements[i]; // <figure> element

      // include only element nodes
      if (figureEl.nodeType !== 1) {
        continue;
      }

      linkEl = figureEl.children[0]; // <a> element

      size = linkEl.getAttribute('data-size').split('x');

      // create slide object
      item = {
          src: linkEl.getAttribute('href'),
          w: parseInt(size[0], 10),
          h: parseInt(size[1], 10)
        };

      if (figureEl.children.length > 1) {
        // <figcaption> content
        item.title = figureEl.children[1].innerHTML;
      }

      if (linkEl.children.length > 0) {
        // <img> thumbnail element, retrieving thumbnail url
        item.msrc = linkEl.children[0].getAttribute('src');
      }

      item.el = figureEl; // save link to element for getThumbBoundsFn
      items.push(item);
    }

    return items;
  };

  // find nearest parent element
  var closest = function closest(el, fn) {
    return el && (fn(el) ? el : closest(el.parentNode, fn));
  };

  // triggers when user clicks on thumbnail
  var onThumbnailsClick = function(e) {
    e = e || window.event;
    e.preventDefault ? e.preventDefault() : e.returnValue = false;

    var eTarget = e.target || e.srcElement;

    // find root element of slide
    var clickedListItem = closest(eTarget, function(el) {
        return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
      });

    if (!clickedListItem) {
      return;
    }

    // find index of clicked item by looping through all child nodes
    // alternatively, you may define index via data- attribute
    var clickedGallery = clickedListItem.parentNode;
    var childNodes = clickedListItem.parentNode.childNodes;
    var numChildNodes = childNodes.length;
    var nodeIndex = 0;
    var index;

    for (var i = 0; i < numChildNodes; i++) {
      if (childNodes[i].nodeType !== 1) {
        continue;
      }

      if (childNodes[i] === clickedListItem) {
        index = nodeIndex;
        break;
      }
      nodeIndex++;
    }

    if (index >= 0) {
      // open PhotoSwipe if valid index found
      openPhotoSwipe(index, clickedGallery);
    }
    return false;
  };

  // parse picture index and gallery index from URL (#&pid=1&gid=2)
  var photoswipeParseHash = function() {
    var hash = window.location.hash.substring(1);
    var params = {};

    if (hash.length < 5) {
      return params;
    }

    var vars = hash.split('&');
    for (var i = 0; i < vars.length; i++) {
      if (!vars[i]) {
        continue;
      }
      var pair = vars[i].split('=');
      if (pair.length < 2) {
        continue;
      }
      params[pair[0]] = pair[1];
    }

    if (params.gid) {
      params.gid = parseInt(params.gid, 10);
    }

    return params;
  };

  var openPhotoSwipe = function(index, galleryElement, disableAnimation, fromURL) {
    var pswpElement = document.querySelectorAll('.pswp')[0];
    var gallery;
    var options;
    var items;

    items = parseThumbnailElements(galleryElement);

    // define options (if needed)
    options = {
      // define gallery index (for URL)
      galleryUID: galleryElement.getAttribute('data-pswp-uid'),

      getThumbBoundsFn: function(index) {
        // See Options -> getThumbBoundsFn section of documentation for more info
        var thumbnail = items[index].el.getElementsByTagName('img')[0]; // find thumbnail
        var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
        var rect = thumbnail.getBoundingClientRect();

        return {x: rect.left, y: rect.top + pageYScroll, w: rect.width};
      }
    };

    // PhotoSwipe opened from URL
    if (fromURL) {
      if (options.galleryPIDs) {
        // parse real index when custom PIDs are used
        // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
        for (var j = 0; j < items.length; j++) {
          if (items[j].pid == index) {
            options.index = j;
            break;
          }
        }
      } else {
        // in URL indexes start from 1
        options.index = parseInt(index, 10) - 1;
      }
    } else {
      options.index = parseInt(index, 10);
    }

    // exit if index not found
    if (isNaN(options.index)) {
      return;
    }

    if (disableAnimation) {
      options.showAnimationDuration = 0;
    }

    // Pass data to PhotoSwipe and initialize it
    gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
  };

  // loop through all gallery elements and bind events
  var galleryElements = document.querySelectorAll(gallerySelector);

  for (var i = 0, l = galleryElements.length; i < l; i++) {
    galleryElements[i].setAttribute('data-pswp-uid', i + 1);
    galleryElements[i].onclick = onThumbnailsClick;
  }

  // Parse URL and open gallery if it contains #&pid=3&gid=1
  var hashData = photoswipeParseHash();
  if (hashData.pid && hashData.gid) {
    openPhotoSwipe(hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true);
  }
};

var galleryOptions = {
  key: 'ab27ebf690f5a9b17c74388da0129e26',
  userID: encodeURIComponent('144180648@N06')
};

// var galleryOptions = {
//   key: 'be429e24fa8362780a1df6ff39ad2e3f',
//   userID: encodeURIComponent('51087543@N08')
// };

function showLoadingContent() {
  var elements = document.querySelectorAll('.loading');

  for (var i = 0; i < elements.length; i++) {
    var ele = elements[i];
    ele.style.opacity = 1;
  }
}

function fetch(url, callback) {
  var req = new XMLHttpRequest();
  req.overrideMimeType('application/json');
  req.open('GET', url, true);
  req.onload = function() {
    if (req.status === 200) {
      callback(JSON.parse(req.response));
    }
  };
  req.send(null);
}

function init() {
  var galleryWrapper = document.getElementById('img-gallery');

  if (!galleryWrapper) {
    return;
  }

  var pswpElement = document.querySelectorAll('.pswp')[0];
  var items = [];

  var url = 'https://api.flickr.com/services/rest/?' +
  'method=flickr.people.getPublicPhotos' +
  '&api_key=' + galleryOptions.key +
  '&user_id=' + galleryOptions.userID +
  '&extras=url_h,url_z,url_b,url_n' +
  '&format=json' +
  '&nojsoncallback=1';

  fetch(url, imagesReady);

  function imagesReady(res) {
    if (res && res.stat == 'ok') {
      var photos = res.photos.photo;

      for (var i = 0; i < photos.length; i++) {
        var imgData = photos[i];
        var obj = {
          src: imgData.url_z,
          w: +imgData.width_z,
          h: +imgData.height_z,
          msrc: imgData.url_n,
          title: imgData.title,
          shareButtons: [
            {
              id: 'facebook',
              label: 'Share on Facebook',
              url: 'https://www.facebook.com/dialog/share?app_id=1726903287597742&amp;href={{url}}&amp;picture={{raw_image_url}}'
            },
            {
              id: 'twitter',
              label: 'Tweet',
              url: 'https://twitter.com/intent/tweet?text={{text}}&url={{image_url}}'
            },
            {
              id: 'pinterest',
              label: 'Pin it',
              url: 'http://www.pinterest.com/pin/create/button/?url={{url}}&media={{image_url}}&description={{text}}'
            },
            {
              id: 'download',
              label: 'Download image',
              url: '{{raw_image_url}}',
              download: true
            }
          ]
        };

        if (imgData.hasOwnProperty('url_b')) {
          obj.src = imgData.url_b;
          obj.w = imgData.width_b,
          obj.h = imgData.height_b
        } else if (imgData.hasOwnProperty('url_h')) {
          obj.src = imgData.url_h;
          obj.w = imgData.width_h;
          obj.h = imgData.height_h;
        }

        var figure = document.createElement('figure');
        figure.setAttribute('itemprop', 'associatedMedia');
        figure.setAttribute('itemscope', '');
        figure.setAttribute('itemtype', 'http://schema.org/ImageObject');
        figure.className = 'gallery-item m-1of2 t-1of2 small-1of3 medium-1of3 large-1of3';

        var link = document.createElement('a');
        link.href = obj.src;
        link.setAttribute('itemprop', 'contentUrl');
        link.dataset.size = obj.w + 'x' + obj.h;

        var img = new Image();
        img.setAttribute('itemprop', 'thumbnail');
        img.setAttribute('alt', obj.title);
        img.src = imgData.url_n;

        var caption = document.createElement('figcaption');
        caption.setAttribute('itemprop', 'caption description');
        caption.innerText = obj.title;

        link.appendChild(img);
        figure.appendChild(link);
        figure.appendChild(caption);
        galleryWrapper.appendChild(figure);

        items[i] = obj;
      };

      initPhotoSwipeFromDOM('#img-gallery');
    }
  }
}

window.addEventListener('load', showLoadingContent);
document.addEventListener('DOMContentLoaded', init);
