var $ = require('jquery')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')

var getLabel = function (text) {
  return text.replace(/\ /g,'-')
             .replace(/[^\w\s-]/g, '')
}

var getId = function (menu) {
  return menu.id || getLabel(menu.label)
}

var Bootslide = function (menu, opts) {
  var opts = opts || {}
  this.width = opts.width || 250

  // By default the back control is the bootstrap left arrow
  this.backIcon = '<div class="bootslide-back">' + (opts.back || '<i class="icon-chevron-left"></i>') + '</div>'
  this.nextIcon = '<div class="bootslide-next">' + (opts.next || '<i class="icon-chevron-right"></i>') + '</div>'

  // Sets a default target function
  this.defaultTarget = opts.defaultTarget

  // This provides an icon to be displayed on the deepest menu items.
  if (opts.last) {
    this.last = '<div class="bootslide-next">' + opts.last  + '</div>'
  }

  this.menu = menu
}

util.inherits(Bootslide, EventEmitter)

Bootslide.prototype.render = function () {
  var div = this.el = $('<div>').addClass('bootslide-container').width(this.width)
    , slider = $('<div>').addClass('bootslide-menu-slider')
    , self = this

  div.append(slider)

  var sections = []
  this.buildSections(this.menu, sections)
  slider.append(sections)
  this.resetMargins(div)

  $('.bootslide-menu a.bootslide-scrollable', div).click(function (e) {
    e.preventDefault()

    var target = $($(this).attr('href'))
      , previous = $(this).parents('.bootslide-section')

    previous.after(target)
    self.resetMargins()
    self.slide(target)
  })

  process.nextTick(this.reset.bind(this))

  return div
}

Bootslide.prototype.reset = function () {
  this.slide($('.bootslide-container .bootslide-section:first'))
}

Bootslide.prototype.resetMargins = function (ctx) {
  $('.bootslide-section', ctx).css('transform', function (i) {
    // Figure out width of all previous sections (ie sections to the left)
    var prevWidth = $(this).prevAll()
      .map(function () { return $(this).width() }).get()
      .reduce(function (sum, current) { return sum + current }, 0)

    // Store the point that bootslide-menu-slider has to translate to
    // to show this section
    $(this).data('target-translate', prevWidth * -1)

    return 'translate(' + prevWidth + 'px,0)'
  })
}

Bootslide.prototype.slide = function (target, back) {
  // Make sure the menu we're going to is visible
  $(target).css('visibility', 'visible')

  if (!back) {
    // Make all subsequent menus invisible, so we don't have overlap
    // (easier than dealing with zindex). Particularly important with
    // contentEndpoints
    // We don't want to do this if going backwards, because the next
    // item is sliding out of view.
    $(target).nextAll().css('visibility', 'hidden')
  }

  $(target).addClass('bootslide-current').siblings().removeClass('bootslide-current')

  this.emit('slide', target.index(), target)

  $('.bootslide-menu-slider').css('transform', 'translate(' + $(target).data('target-translate') + 'px,0)')

  // Now animate the height and width
  $('.bootslide-container').height(target.height())
                           .width(target.width())
}

Bootslide.prototype.buildSections = function (menu, sections, back) {
  var header = $('<div>').addClass('bootslide-header').text(menu.label)
    , l = getLabel(menu.label)
    , section = $('<div>').attr('id', 'bootstrap-' + getId(menu))
                          .addClass('bootslide-section')
                          .width(menu.width || this.width)
                          .append(header)
    , self = this

  if (back) {
    header.prepend(this.backIcon).click(function () {
      var target = $(this).parents('.bootslide-section')
                          .prev('.bootslide-section')
      self.slide(target, true)
    })
  }

  if (menu.contentEndpoint) {
    // If we're at a content endpoint, then just stick a placeholder
    // and we're done. The content will be set if/when the item
    // is selected
    section.addClass('bootslide-content-placeholder')

    sections.unshift(section.get(0))
    return section
  }

  var ul = $('<ul>').addClass('bootslide-menu nav nav-list')
    , self = this

  $.each(menu.target, function (index, target) {
    var label = getLabel(target.label)
      , content = target.content ? target.content() : target.label
      , a = $('<a href="#' + ('bootstrap-' + getId(target)) + '">')
                .append(content)
                .addClass(label.toLowerCase())
      , li = $('<li>').append(a)

    ul.append(li)

    function addAndContinue () {
      li.addClass('bootslide-step')
      // Keep digging
      a.addClass('bootslide-scrollable')
      a.prepend(self.nextIcon)
      return self.buildSections(target, sections, true)
    }

    if (target.contentEndpoint) {
      var newSection = addAndContinue()

      a.click(function (e) {
        if (newSection.hasClass('bootslide-content-placeholder')) {
          newSection.removeClass('bootslide-content-placeholder')
          newSection.append(target.contentEndpoint())
          newSection.css('width', '')
        }
      })
    } else if (typeof target.target === 'function' || (typeof target.target === 'undefined' && self.defaultTarget)) {
      var fn = (typeof target.target === 'undefined' && self.defaultTarget) || target.target
        , args = target.args || []

      // If it's a function, that means it's the last step
      li.addClass('bootslide-endpoint')
      a.click(function (e) {
        var _args = args.concat()
        _args.unshift(e)
        fn.apply(this, _args)
      })
      // If they set up a last icon for each item
      if (self.last) {
        a.prepend(self.last)
      }
    } else if (typeof target.target === 'string' ) {
      li.addClass('bootslide-endpoint')
      // If it's a string, treat it as a basic url
      a.attr('href', target.target)
    } else {
      addAndContinue()
    }
  })

  sections.unshift(section.append(ul).get(0))

  return section
}

Bootslide.prototype.back = function () {
  var previous = $('.bootslide-section.bootslide-current').prev()
  
  if (previous.length > 0) {
    this.slide(previous, true)
  }
}

module.exports = Bootslide
