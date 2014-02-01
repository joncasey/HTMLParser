// HTML Parser | 2013-2014, Jon Casey http://myschemas.com <-- John Resig http://ejohn.org <-- Erik Arvidsson http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
;(function(global) {
  var tagStart  = /^<(\w+)((?:\s+[\w-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/
  var tagEnd    = /^<\/(\w+)[^>]*>/
  var attr      = /([\w-]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g
  var empty     = makeMap('area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed') // Empty Elements - HTML 4.01
  var block     = makeMap('address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul') // Block Elements - HTML 4.01
  var inline    = makeMap('a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var') // Inline Elements - HTML 4.01
  var closeSelf = makeMap('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr') // can intentionally leave open, will close
  var fillAttrs = makeMap('checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected') // attributes that values equal name, disabled="disbled"
  var special   = makeMap('script,style') // Special Elements (can contain anything)

  function HTMLParser(html, handler) {
    /// <param name="html" type="String"/>
    /// <param name="handler">
    /// {                                         &#10;
    ///   doctype: function(text) {},             &#10;
    ///   start: function(tag, attrs, unary) {},  &#10;
    ///   end: function(tag) {},                  &#10;
    ///   chars: function(text) {},               &#10;
    ///   comment: function(text) {}              &#10;
    /// }                                         &#10;
    /// </param>
    var chars, index, match, stack = [], last = html
    stack.last = function() {return this[Math.max(this.length-1,0)]}
    while (html) {
      chars = true
      if (!stack.last() || !special[stack.last()]) {

        if (html.indexOf('<!--') == 0) {
          index = html.indexOf('-->')
          if (index >= 0) {
            if (handler.comment)
                handler.comment(html.substring(4, index))
            html = html.substring(index + 3)
            chars = false
          }
        }
        else if (html.indexOf('<!') == 0) {
          index = html.indexOf('>')
          if (index >= 0) {
            if (handler.doctype)
                handler.doctype(html.substring(2, index))
            html = html.substring(index + 1)
            chars = false
          }
        }
        else if (html.indexOf('</') == 0) {
          match = html.match(tagEnd)
          if (match) {
            html = html.substring(match[0].length)
            match[0].replace(tagEnd, parseTagEnd)
            chars = false
          }
        }
        else if (html.indexOf('<') == 0) {
          match = html.match(tagStart)
          if (match) {
            html = html.substring(match[0].length)
            match[0].replace(tagStart, parseTagStart)
            chars = false
          }
        }

        if (chars) {
          index = html.indexOf('<')
          var text = index < 0 ? html : html.substring(0, index)
          html = index < 0 ? '' : html.substring(index)
          if (handler.chars)
              handler.chars(text, stack.last())
        }

      } else {
        // special
        var z = Math.max(html.indexOf('</'+ stack.last() +'>'), 0)
          , text = html.substring(0, z)
        if (text != '') {
          text = text.replace(/<!--(.*?)-->/g, '$1')
                     .replace(/<!\[CDATA\[(.*?)]]>/g, '$1')
          if (handler.chars)
              handler.chars(text, stack.last())
        }
        html = html.substring(z + stack.last().length + 3)
        parseTagEnd('', stack.last())
      }

      if (html == last)
        throw new Error('Parse Error: '+ html)
      last = html
    }

    parseTagEnd() // Clean up any remaining tags

    function parseTagStart(tag, tagName, rest, unary) {
      if (block[tagName]) {
        while (stack.last() && inline[stack.last()]) {
          parseTagEnd('', stack.last())
        }
      }

      if (closeSelf[tagName] && stack.last() == tagName) {
        parseTagEnd('', tagName)
      }

      unary = empty[tagName] || !!unary
      if (!unary) stack.push(tagName)

      if (handler.start) {
        var attrs = []
        rest.replace(attr, function(match, name) {
          var value = arguments[2] ? arguments[2]
                    : arguments[3] ? arguments[3]
                    : arguments[4] ? arguments[4]
                    : fillAttrs[name] ? name : ''
          attrs.push({
            'name'    : name,
            'value'   : value,
            'escaped' : value.replace(/(^|[^\\])"/g, '$1\\\"')
          })
        })
        if (handler.start)
            handler.start(tagName, attrs, unary)
      }
    }

    function parseTagEnd(tag, tagName) {
      var i = stack.length - 1
      var pos = tagName ? i : 0
      if (tagName)
        for (; pos >= 0; pos--)
          if (stack[pos] == tagName) break

      if (pos >= 0) {
        for (; i >= pos; i--)
          if (handler.end)
              handler.end(stack[i])
        stack.length = pos
      }
    }

  }

  HTMLParser.toXMLString = function(html, tagFn, attrFn) {
    /// <param name="html" type="String"/>
    /// <param name="tagFn" type="Function" optional="true">function(tagName) {&#10;  return tagName.toLowerCase() &#10;}</param>
    /// <param name="attrFn" type="Function" optional="true">function(attribute) {&#10;  attribute.escaped = attribute.escaped.replace(...)&#10;  return attribute &#10;} </param>
    var x = []
    try {
      HTMLParser(html, {

        'chars' : function(s, tag) {
          if (/^script$/i.test(tag)) s = '<![CDATA['+ s +']]>'
          x.push(s)
        },

        'comment' : function(s) {
          x.push('<!--'+ s +'-->')
        },

        'end' : function(s) {
          if (tagFn) s = tagFn(s)
          if (s == '') return
          x.push('</'+ s +'>')
        },

        'start' : typeof attrFn == 'function'
          ? function(s, a, u) {
              if (tagFn) s = tagFn(s)
              if (s == '') return
              x.push('<'+ s)
              var i = 0
                , l = a.length
              for (; i < l; i++) {
                a[i] = attrFn(a[i])
                x.push(' '+ a[i].name +'-"'+ a[i].escaped +'"')
              }
              x.push(u ? '/' : '', '>')
            }
          : function(s, a, u) {
              if (tagFn) s = tagFn(s)
              if (s == '') return
              x.push('<'+ s)
              var i = 0
                , l = a.length
              for (; i < l; i++) {
                x.push(' '+ a[i].name +'="'+ a[i].escaped +'"')
              }
              x.push(u ? '/' : '', '>')
            }
      })
    } catch (e) {
      e.parsed = x.join('')
      throw e
    }
    return x.join('')
  }

  function makeMap(s) {
    var a = s.split(',')
    var o = {}
    for (var i = 0, l = a.length; i < l; i++) {
      o[a[i].toUpperCase()] = o[a[i]] = true
    }
    return o
  }

  global.HTMLParser = HTMLParser
})(this);
