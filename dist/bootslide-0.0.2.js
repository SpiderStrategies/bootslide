/*!
 * bootslide.js v0.0.2 
 * Copyright 2012, Spider Strategies <nathan.bowser@spiderstrategies.com> 
 * bootslide.js may be freely distributed under the BSD license. 
*/
(function (root) {

  var Bootslide = function (menu, opts) {
    var opts = opts || {}
    this.width = opts.width || 250

    // By default the back control is the bootstrap left arrow
    this.back = '<div class="bootslide-back">' + (opts.back || '<i class="icon-chevron-left"></i>') + '</div>'
    this.next = '<div class="bootslide-next">' + (opts.next || '<i class="icon-chevron-right"></i>') + '</div>'
    this.menu = menu
  }

  Bootslide.prototype.render = function () {
    var div = $('<div>').addClass('bootslide-container').width(this.width)
      , slider = $('<div>').addClass('bootslide-menu-slider')
      , width = this.width
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
      $('.bootslide-menu-slider').css('margin-left', target.index() * width * -1)
    })

    return div
  }

  Bootslide.prototype.reset = function () {
    $('.bootslide-menu-slider').css('margin-left', 0)
  }

  Bootslide.prototype.resetMargins = function (ctx) {
    var width = this.width
    $('.bootslide-section', ctx).css('margin-left', function (i) {
      return width * i
    })
  }

  Bootslide.prototype.buildSections = function (menu, sections, back) {
    var width = this.width
      , header = $('<div>').addClass('bootslide-header').text(menu.label)
      , section = $('<div>').attr('id', 'bootstrap-' + menu.label.replace(/\ /,'-'))
                            .addClass('bootslide-section')
                            .width(this.width)
                            .append(header)

    if (back) {
      header.prepend(this.back).click(function () {
        var ml = (($(this).parents('.bootslide-section').index() * width) - width) * -1
        $('.bootslide-menu-slider').css('margin-left', ml)
      })
    }

    var ul = $('<ul>').addClass('bootslide-menu nav nav-list')
      , self = this

    $.each(menu.target, function (index, target) {
      var a = $('<a href="#' + ('bootstrap-' + target.label.replace(/\ /,'-')) + '">').text(target.label)
      var li = $('<li>').append(a)
      ul.append(li)
      if (typeof target.target === 'function') {
        a.click(function (e) {
          target.target.call(this, e, target.label, target.data)
        })
      } else if (typeof target.target === 'string' ) {
        a.attr('href', target.target)
      } else {
        a.addClass('bootslide-scrollable')
        a.prepend(self.next)
        self.buildSections(target, sections, true)
      }
    })

    sections.unshift(section.append(ul).get(0))
  }

  root.Bootslide = Bootslide

})(window)