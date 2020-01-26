export function initToc() {
  var toc = document.querySelector('.toc');
  var tocPath = document.querySelector('.toc-marker path');
  var tocItems;
  var TOP_MARGIN = 0.2, BOTTOM_MARGIN = 0.4;
  var PADDING = 5;
  var pathLength;

  var drawPath = function() {
    tocItems = [].slice.call(toc.querySelectorAll('li'));
    tocItems = tocItems.map(function (item) {
      var anchor = item.querySelector('a');
      var target = document.getElementById(anchor.getAttribute('href').slice(1));
      return {
        listItem: item,
        anchor: anchor,
        target: target
      };
    });
    tocItems = tocItems.filter(function (item) {
      return !!item.target;
    });
    var path = [];
    var pathIndent;
    tocItems.forEach(function (item, i) {
      var x = item.anchor.offsetLeft - 5,
        y = item.anchor.offsetTop,
        height = item.anchor.offsetHeight;
      if (i === 0) {
        path.push('M', x, y, 'L', x, y + height);
        item.pathStart = 0;
      } else {
        if (pathIndent !== x) path.push('L', pathIndent, y);
        path.push('L', x, y);
        tocPath.setAttribute('d', path.join(' '));
        item.pathStart = tocPath.getTotalLength() || 0;
        path.push('L', x, y + height);
      }
      pathIndent = x;
      tocPath.setAttribute('d', path.join(' '));
      item.pathEnd = tocPath.getTotalLength();
    });
    pathLength = tocPath.getTotalLength();
    sync();
  }
  var sync = function() {
    var windowHeight = window.innerHeight;
    var pathStart = pathLength,
      pathEnd = 0;
    var visibleItems = 0;
    tocItems.forEach(function (item) {
      var targetBounds = item.target.getBoundingClientRect();
      if (targetBounds.bottom > windowHeight * TOP_MARGIN && targetBounds.top < windowHeight * (1 - BOTTOM_MARGIN)) {
        pathStart = Math.min(item.pathStart, pathStart);
        pathEnd = Math.max(item.pathEnd, pathEnd);
        visibleItems += 1;
        item.listItem.classList.add('visible');
      } else {
        item.listItem.classList.remove('visible');
      }
    });
    if (visibleItems > 0 && pathStart < pathEnd) {
      tocPath.setAttribute('stroke-dashoffset', '1');
      tocPath.setAttribute('stroke-dasharray', '1, ' + pathStart + ', ' + (pathEnd - pathStart) + ', ' + pathLength);
      tocPath.setAttribute('opacity', 1);
    } else {
      tocPath.setAttribute('opacity', 0);
    }
  }

  drawPath();
  window.addEventListener('resize', drawPath);
  window.addEventListener('scroll', sync);
}