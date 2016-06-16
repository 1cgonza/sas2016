function showLoadingContent() {
  var elements = document.querySelectorAll('.loading');

  for (var i = 0; i < elements.length; i++) {
    var ele = elements[i];
    ele.style.opacity = 1;
  }
}

window.addEventListener('load', showLoadingContent);
