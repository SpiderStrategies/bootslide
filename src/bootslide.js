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

  if (opts.el) {
    this.el = $(opts.el)
  } else {
    this.el = $('<div>')
  }

  this.menu = menu
}

util.inherits(Bootslide, EventEmitter)

Bootslide.prototype.render = function () {
  this.el.addClass('bootslide-container').width(this.width)
  
  var slider = $('<div>').addClass('bootslide-menu-slider')
    , self = this

  this.el.append(slider)

  var sections = []
  this.buildSections(this.menu, sections)
  slider.append(sections)
  this.resetMargins(this.el)

  $('.bootslide-menu .bootslide-scrollable', this.el).click(function (e) {
    e.preventDefault()

    var target = $($(this).attr('data-target-id'), self.el)
      , previous = $(this).parents('.bootslide-section')

    previous.after(target)
    self.resetMargins()
    self.slide(target)
  })

  process.nextTick(this.reset.bind(this))

  return this.el
}

Bootslide.prototype.reset = function () {
  this.slide($('.bootslide-section:first', this.el))
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

/**
 * Programmatic API to navigate/slide to a given target.
 *
 * @param {String} targetId - ID of the target to slide to
 *
 * @param {Object} [options] - if the target has an onNavigate callback, this
 * object will be passed to the callback
 */
Bootslide.prototype.navigate = function (targetId, options) {
  let target = $('#bootstrap-' + targetId, this.el)
  let current = $('.bootslide-current', this.el)

  // Move the target menu directly after the current menu
  current.after(target)
  // Shift positions around so that the target menu is visibly right up against
  // the current menu
  this.resetMargins()

  this.slide(target, false)

  let onNavigate = target.data('onNavigate')
  if (onNavigate) {
    onNavigate(options)
  }
}

Bootslide.prototype.slide = function (target, back) {
  prepareContentEndpoint(target)

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

  $('.bootslide-menu-slider', this.el).css('transform', 'translate(' + $(target).data('target-translate') + 'px,0)')

  let targetHeight = adjustTargetToFitWindow(target)

  // Now animate the height and width
  this.el.height(targetHeight)
                           .width(target.width())
}

function adjustTargetToFitWindow (target) {
  let targetHeight = target.height()
  let maxHeight = document.documentElement.clientHeight
  let navList = target.find('.nav-list')

  // If the target is a "standard" menu (a list of menu items, as opposed to a
  // contentEndpoint), and it's taller than the window, then make it scrollable
  if (navList.length > 0 && targetHeight > maxHeight) {
    // First fit the target menu to the window
    target.height(maxHeight)

    // Then explicitly set the height for the nav-list (leaving out the header,
    // which shouldn't scroll) so we can use overflow
    let headerHeight = target.find('.bootslide-header').outerHeight()
    target.find('.nav-list').height(maxHeight - headerHeight)

    targetHeight = maxHeight

    target.addClass('is-overflowing')
  }

  return targetHeight
}

/**
 * If necessary, render any on-first-view content before sliding to the target
 */
function prepareContentEndpoint (target) {
  if (target.hasClass('bootslide-content-placeholder')) {
    target.removeClass('bootslide-content-placeholder')
    target.append(target.data('contentEndpoint')())
    target.css('width', '')
  }
}

Bootslide.prototype.buildSections = function (menu, sections, backTo) {
  var header = $('<div>').addClass('bootslide-header').text(menu.label)
    , l = getLabel(menu.label)
    , section = $('<div>').attr('id', 'bootstrap-' + getId(menu))
                          .addClass('bootslide-section')
                          .width(menu.width || this.width)
                          .append(header)
    , self = this

  if (backTo) {
    header.prepend(this.backIcon).click(function () {
      self.slide(backTo, true)
    })
  }

  if (menu.contentEndpoint) {
    // If we're at a content endpoint, then just stick a placeholder
    // and we're done. The content will be set if/when the item
    // is selected
    section
      .addClass('bootslide-content-placeholder')
      .data({
        contentEndpoint: menu.contentEndpoint,
        onNavigate: menu.onNavigate
      })

    // A contentEndpoint can still have child menu items, though, so we need
    // to build those, too
    if (menu.target) {
      menu.target.forEach(target => {
        self.buildSections(target, sections, section)
      })
    }

    sections.unshift(section.get(0))
    return section
  }

  var ul = $('<ul>')
    .addClass('bootslide-menu nav nav-list')
    .toggleClass('bootslide-tiles', menu.layout === 'tiles')

  var self = this

  $.each(menu.target, function (index, target) {
    var label = getLabel(target.label)
      , content = target.content ? target.content() : target.label
      , a = $('<div data-target-id="#' + ('bootstrap-' + getId(target)) + '" class="bootslide-menu-item">')
                .append(content)
                .addClass(label.toLowerCase())
      , li = $('<li>').append(a)
                .css('display', target.hidden ? 'none' : '')

    ul.append(li)

    function addAndContinue () {
      li.addClass('bootslide-step')
      // Keep digging
      a.addClass('bootslide-scrollable')
      a.prepend(self.nextIcon)
      return self.buildSections(target, sections, section)
    }

    if (target.contentEndpoint) {
      var newSection = addAndContinue()

      a.click(function (e) {
        prepareContentEndpoint(newSection)
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
      a.attr('data-target-id', target.target)
    } else {
      addAndContinue()
    }
  })

  sections.unshift(section.append(ul).get(0))

  return section
}

Bootslide.prototype.back = function () {
  var previous = $('.bootslide-section.bootslide-current', this.el).prev()
  
  if (previous.length > 0) {
    this.slide(previous, true)
  }
}

/**
 * For a menu item matching the given id, shows the item if show=true,
 * hides it otherwise.
 */
Bootslide.prototype.toggleItem = function (id, show) {
  let item = $(this.el).find(`[data-target-id="#bootstrap-${id}"]`)
  if (item.parent().length === 0) {
    return
  } 

  item.parent().css('display', show ? '' : 'none')

  // If the item we toggled is in the currently displayed menu, adjust
  // the main element's height to compensate for the menu's new height
  let section = item.closest('.bootslide-section')
  if (section.hasClass('bootslide-current')) {
    $(this.el).height(section.height())
  }
}

/**
 * Changes the width of the visible bootslide window; uses animation.
 * Calling code is responsible for making sure the content properly
 * fits the new bootslide window.
 */
Bootslide.prototype.setWidth = function (newWidth) {
  $(this.el).width(newWidth)
}

module.exports = Bootslide
