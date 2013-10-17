# HTMLParser

Updated version of John Resig's [htmlparser.js](http://ejohn.org/files/htmlparser.js) - [read blog post](http://ejohn.org/blog/pure-javascript-html-parser/)  
Which was based on Erik Arvidsson's [simplehtmlparser.js](http://erik.eae.net/simplehtmlparser/simplehtmlparser.js)  

* `toDOM()` removed, was not needed
* `this` context corrected for WScript
* `throw Error()` to work for WScript
* `toXMLString` can pass in `tag()`, `attr()`
* `makeMap` will also make uppercase versions

## Usage

    var xmlString = HTMLParser.toXMLString(htmlString)

or

    var xmlString = HTMLParser.toXMLString(
                      htmlString
                    , function(tag) {
                        return tag.toLowerCase()
                      }
                    , function(attr) {
                        attr.escaped = attr.escaped.replace(/&/g, '&amp;')
                        return attr
                      }
                    )

