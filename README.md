bootslide
=========

An iphone style navigation menu.

See an example [here](http://spiderstrategies.github.com/bootslide/)


###

To reset a menu:

`menu.reset()`

A target can be

1. An array of sub menu items

2. A string for an href

3. A callback that's fired when the menu item is clicked. e.g.

  ```

  target: function (e, <args>) {
    // this -> The link they clicked
    // e -> The event
    // args -> you set this
  }

  ```
