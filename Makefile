VERSION = $(shell node -e 'require("./package.json").version' -p)
HEADER = "/*!\n * bootslide.js v$(VERSION) \n * Copyright 2012, Spider Strategies <nathan.bowser@spiderstrategies.com> \n * bootslide.js may be freely distributed under the BSD license. \n*/"
DIST = dist/bootslide-$(VERSION).js
MIN = dist/bootslide-$(VERSION).min.js

clean:
	@rm -rf dist

build: clean
	@mkdir dist
	@cp src/bootslide.css dist/bootslide-$(VERSION).css
	@echo $(HEADER) > $(DIST) && cat src/bootslide.js >> $(DIST)
	@echo $(HEADER) > $(MIN) && node_modules/.bin/uglifyjs src/bootslide.js >> $(MIN)

test:

.PHONY: build clean test
