// Copyright © 2013-2017 David Caldwell <david@porkrind.org>
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
// SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
// OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
// CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

// Usage
// -----
// The module exports one entry point, the `renderjson()` function. It takes in
// the JSON you want to render as a single argument and returns an HTML
// element.
//
// Options
// -------
// renderjson.set_icons("+", "-")
//   This Allows you to override the disclosure icons.
//
// renderjson.set_show_to_level(level)
//   Pass the number of levels to expand when rendering. The default is 0, which
//   starts with everything collapsed. As a special case, if level is the string
//   "all" then it will start with everything expanded.
//
// renderjson.set_max_string_length(length)
//   Strings will be truncated and made expandable if they are longer than
//   `length`. As a special case, if `length` is the string "none" then
//   there will be no truncation. The default is "none".
//
// renderjson.set_sort_objects(sort_bool)
//   Sort objects by key (default: false)
//
// renderjson.set_replacer(replacer_function)
//   Equivalent of JSON.stringify() `replacer` argument when it's a function
//
// renderjson.set_property_list(property_list)
//   Equivalent of JSON.stringify() `replacer` argument when it's an array
//
// Theming
// -------
// The HTML output uses a number of classes so that you can theme it the way
// you'd like:
//     .disclosure    ("⊕", "⊖")
//     .syntax        (",", ":", "{", "}", "[", "]")
//     .string        (includes quotes)
//     .number
//     .boolean
//     .key           (object key)
//     .keyword       ("null", "undefined")
//     .object.syntax ("{", "}")
//     .array.syntax  ("[", "]")


// Additions from MJS 2016-06-30
// long arrays are shortened accoding to the two rules below
var long_array_short_limit = 10
var long_array_show_when_shortened = 3
// and a more beautiful style is applied by default

// the lengths of arrays is rendered next to the array syntax

 var styleEl = document.createElement('style'), styleSheet;
            document.head.appendChild(styleEl);
            styleSheet = styleEl.sheet;
            styleSheet.insertRule(".disclosure { color:grey; }", 0);
            styleSheet.insertRule(".syntax { color:black; }", 0);
            styleSheet.insertRule(".string { color:darkblue; }", 0);
            styleSheet.insertRule(".number { color:darkgreen; }", 0);
            styleSheet.insertRule(".boolean { color:red; }", 0);
            styleSheet.insertRule(".key { color:darkred; }", 0);
            styleSheet.insertRule(".keyword { color:pink; }", 0);
            styleSheet.insertRule(".object.syntax { color:grey; }", 0);
            styleSheet.insertRule(".array.syntax { color:grey; }", 0);
            

function online_variance(data){
    var n = 0;
    var mean = 0.0;
    var M2 = 0.0;
    var sum_x = 0;
	var sum_y = 0;
	var sum_xx = 0;
	var sum_xy = 0;
	var maximum = data[0];
	var max_idx = 0;
	var minimum = data[0];
	var min_idx = 0;
    for (var i=0;i<data.length;i++){
		
		var x = data[i];
        n += 1;
        delta = x - mean;
        mean += delta/n;
        M2 += delta*(x - mean);
        
        if (x>maximum){
			maximum = x;
			max_idx = i;
		}
        if (x<minimum){
			minimum = x;
			min_idx = i;
		}
		
		
        sum_x += i;
		sum_xx += i*i;
		sum_y += x;
		sum_xy +=i*x;
	}
	sum_xy -= sum_x*sum_y/n;
	sum_xx -= sum_x*sum_x/n;
	var b = sum_xy / sum_xx;
	var sigma = M2 / (n - 1);
	return {mean:mean,sigma:sigma,b : b,minimum:minimum,maximum:maximum,max_idx:max_idx,min_idx:min_idx}
}

function drawsparklinedata(data,stats,canvas){
	var ctx = canvas.getContext("2d")
	var radius = 4;
	var c = stats.minimum;
	var m = (canvas.height-2*radius) / (stats.maximum - stats.minimum);
	var inc = (canvas.width-2*radius) / (data.length-1);
	var x = radius;
	var y = canvas.height-radius - m*(data[0]-c);
	
	
	ctx.beginPath();
	ctx.strokeStyle = 'lightgray';
	y = canvas.height-radius - m*(stats.mean-c);
	ctx.moveTo(x,y);
	ctx.lineTo(canvas.width-radius,y);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.strokeStyle = 'black';
	
	x = radius;
	y = canvas.height-radius - m*(data[0]-c);
	
	ctx.moveTo(x,y);
	for (var i=1;i<data.length;i++){
		y = canvas.height-radius - m*(data[i]-c);
		x += inc;
		ctx.lineTo(x,y);
	}
	ctx.stroke();
	ctx.beginPath();
	x = radius+stats.min_idx * inc
	y = canvas.height-radius - m*(stats.minimum-c);
	ctx.arc(x, y, 2, 0, 4 * Math.PI, false);
	ctx.fillStyle = 'red';
	ctx.fill();
	ctx.beginPath();
	ctx.fillStyle = 'blue';
	x = radius+stats.max_idx * inc
	y = canvas.height-radius - m*(stats.maximum-c);
	ctx.arc(x, y, 2, 0, 4 * Math.PI, false);
	ctx.fill();
}

function sparkline(data,stats){
	
	//sparkline stuff
	var canvas = document.createElement("canvas");
	canvas.height = 20;
	canvas.width = 300;
	//canvas.id = "sparkline";
	//document.body.appendChild(mycanvas);
	drawsparklinedata(data,stats,canvas)
	canvas.onclick = function(){
		if (canvas.height == 100){
			canvas.height = 20;
		} else {
			canvas.height = 100;
		}
		drawsparklinedata(data,stats,canvas);
	}
	return canvas;
}


function mjs_precision(number,precision){
	if (! isFinite(number)){return  'Nan';}
	if (! isFinite(precision)){return ''+number} //a hell mary aproach of just hoping that it will be ok.
	precision = Math.min(Math.max(1,precision),21);
	var sign = number <0 ? '-' : '';
	number = Math.abs(number);
	
	if ( number <= 2e-3){
		var label = number.toExponential(precision-1);
		//this hack gets the scheme to change on the 0.001 rather than the number higher than in.
		// comparing number <= 1e-3 dosn't work as there might be floating point mess keeping it higher. i.e. 0.0010000000003
		// testing against <= 9.99999e-4 could work but breaks when zoomed in. How many 9s, still has floating point problums.
		if (parseInt(label.split('e')[1]) < -3){ 
			return sign+ label; 
		}
	}
	var label = number.toPrecision(precision);
	//this bit of mess fixes the strings that say 3.1e+2 rather than 310.
	//as '3.1e+2' is longer (6) than '310' (3).
	if (label.length >= number.toPrecision(precision+1).length){
		label =  number.toPrecision(precision+1);
	}
	if (label.length >= number.toPrecision(precision+2).length){
		label =  number.toPrecision(precision+2);
	}
	if (label.length >= number.toPrecision(precision+3).length){
		label =  number.toPrecision(precision+3);
	}
	return sign+label
}

function rightPad(s,l,c){
	// pad string s to a minimum length l using character c
	return s + c.repeat(Math.max(0,l-s.length));
}

function new_window_with_text(text,title,width,height){
 var url = 'data:text/plain;charset=utf-8;base64,' + btoa(text);
 window.open(url, title, "width="+width+", height="+height);		
}

function mjs_time_difference_print(milliseconds){
	//for printing the elapsed time. not absolute time.
	var sign = milliseconds > 0;
	milliseconds = Math.abs(milliseconds);
	
	var d = milliseconds/1000
	milliseconds = milliseconds%1000;
	 var seconds = Math.floor(d%(60));
      var min = Math.floor(d/60%(60));
      var hours = Math.floor(d/60/60%(24));
      var days = Math.floor(d/60/60/24);
	var s = '';
	if (seconds>0){s= seconds+' seconds ' +milliseconds.toFixed(0) +' ms' }
	if (min>0){s=  min+' min ' + seconds+' seconds'}
	if (hours>0){s= hours+' hours '+ min+' min ' + seconds+' seconds' ;}
	if (days>0){s = days+' days ' + hours+' hours ' + min+' min'; }
	if (sign){ s +=  ' ago'} else {  s = 'in ' + s; } 
	return s;
}

var module, window;
(module||{}).exports = (window||{}).renderjson = (function() {
    var themetext = function(/* [class, text]+ */) {
        var spans = [];
        while (arguments.length)
            spans.push(append(span(Array.prototype.shift.call(arguments)),
                              text(Array.prototype.shift.call(arguments))));
        return spans;
    };
    var setTitle= function(el,title){
		if (el.constructor == Array){
			for (var i=0; i<el.length; i++){
				setTitle(el[i],title);
			}
		} else {
			el.title = title;
		}
		return el;
	};
	var joinPath = function(path){
		r = '';
		for (var i=0; i<path.length; i++){
			if (  typeof path[i] === 'number'  ){
				r+= '[' + path[i] + ']';
			} else {
				r+= '["' + path[i] + '"]';
			}
		}
		return r;
	};
	
	
	var indentText = '  ';
	var cloneAndNew = function(a,b){
		var c = a.slice();
		c.push(b);
		return c;
		//clones array a, and appends b returning the new array. 
	}
	
    var append = function(/* el, ... */) {
        var el = Array.prototype.shift.call(arguments);
        for (var a=0; a<arguments.length; a++)
            if (arguments[a].constructor == Array)
                append.apply(this, [el].concat(arguments[a]));
            else
                el.appendChild(arguments[a]);
        return el;
    };
    var prepend = function(el, child) {
        el.insertBefore(child, el.firstChild);
        return el;
    }
    var isempty = function(obj, pl) { var keys = pl || Object.keys(obj);
                                      for (var i in keys) if (Object.hasOwnProperty.call(obj, keys[i])) return false;
                                      return true; }
    var text = function(txt) { return document.createTextNode(txt) };
    var div = function() { return document.createElement("div") };
    var span = function(classname) { var s = document.createElement("span");
                                     if (classname) s.className = classname;
                                     return s; };
    var A = function A(txt, classname, callback) { var a = document.createElement("a");
                                                   if (classname) a.className = classname;
                                                   a.appendChild(text(txt));
                                                   a.href = '#';
                                                   a.onclick = function(e) { callback(); if (e) e.stopPropagation(); return false; };
                                                   return a; };

    function _renderjson(json, indent, dont_indent, show_level, options,keypath) {
        var my_indent = dont_indent ? "" : indent;

        var disclosure = function(open, placeholder, close, type, builder) {
            var content;
            var empty = span(type);
            var show = function() { if (!content) append(empty.parentNode,
                                                         content = prepend(builder(),
                                                                           A(options.hide, "disclosure",
                                                                             function() { content.style.display="none";
                                                                                          empty.style.display="inline"; } )));
                                    content.style.display="inline";
                                    empty.style.display="none"; };
            append(empty,
                   A(options.show, "disclosure", show),
                   themetext(type+ " syntax", open),
                   A(placeholder, null, show),
                   close
                   );

            var el = append(span(), text(my_indent.slice(0,-1)), empty);
            if (show_level > 0)
                show();
            return el;
        };

        if (json === null) return themetext(null, my_indent, "keyword", "null");
        if (json === void 0) return themetext(null, my_indent, "keyword", "undefined");

		//long strings
        if (typeof(json) == "string" && json.length > options.max_string_length)
            return disclosure('"', json.substr(0,options.max_string_length)+" ...", themetext("string syntax", '"')  , "", function () {
                return append(span("string"), themetext(null, my_indent, "string", JSON.stringify(json)));
            });
        // strings that look like dates
         if (typeof(json) == "string" && json.length > 15  && json.length < 30 && Date.parse(json) )
            return disclosure('"', json, themetext("string syntax", '"', null, '(Datetime)' )  , "", function () {
				 
				var d = new Date(json);
				var as = append(span("string"), themetext("string syntax", " ", null, "\n"));
				append(as, themetext('string', indent + "    "+  '"' +json+'"' ,null,'\n'));
				append(as, themetext(null, indent+"    ", "string syntax",   'local: ' +  d.toString() ,null,'\n'));
				append(as, themetext(null, indent+"    ", "string syntax",   mjs_time_difference_print( Date.now() - d.getTime() )  ,null,'\n'));
				append(as, themetext(null, indent+"    ", "string syntax",   'epoch : ' +  d.getTime()  ,null,'\n'));
				
                return append(as, themetext(null, indent, "string syntax", " "));
                
            }); 
        //multi line strings that are kind of long. 
        if (typeof(json) == "string" && json.length > 26 && json.indexOf("\n") >= 0 )
            return disclosure('"', json.substr(0,26)+" ...", themetext("string syntax", '"')  , "", function () {
				var as = append(span("string"), themetext("string syntax", " ", null, "\n"));
				// new_window_with_text(text,title,width,height)
				var openButton = document.createElement("button");
				openButton.innerHTML = "open in new window";
				openButton.onclick = function(){   new_window_with_text(json,keypath[keypath.lngth-1],800,600)  };
				openButton.className = 'openButton';
				append(as,  themetext(null, indent+"    "), openButton, themetext(null, "\n"));
				
				
				var parts = json.split('\n');
				
				
				for (var i=0; i<parts.length; i++){
					append(as, themetext('string', indent + "    "+  parts[i]   ,null,'\n'));
				}
				
                return append(as, themetext(null, indent, "string syntax", " "));
                
            });  

        if (typeof(json) != "object" || [Number, String, Boolean, Date].indexOf(json.constructor) >= 0) // Strings, numbers and bools
            return themetext(null, my_indent, typeof(json), JSON.stringify(json));

        if (json.constructor == Array) {
            if (json.length == 0) return themetext(null, my_indent, "array syntax", "[]");
			
			var setxbutton = document.createElement("button");
				setxbutton.innerHTML = "Set x";
				setxbutton.onclick = function(){ loadX(json,keypath)}
				
				var setybutton = document.createElement("button");
				setybutton.innerHTML = "Set y";
				setybutton.onclick = function(){ loadY(json,keypath)}
				
			
            return disclosure("[", " ... ", append( span(''), themetext("array syntax",  "] ("+json.length+' items)') ,setxbutton, setybutton), "array", function () {
                var as = append(span("array"), themetext("array syntax", "[", null, "\n"));
				indent+=indentText;
				var setxbutton = document.createElement("button");
				setxbutton.innerHTML = "Set x";
				setxbutton.onclick = function(){ loadX(json,keypath)}
				
				var setybutton = document.createElement("button");
				setybutton.innerHTML = "Set y";
				setybutton.onclick = function(){ loadY(json,keypath)}
				
				append(as, text(indent+indentText), setxbutton,  setybutton , text("\n") );
	

                var allAreNumbers = true;
                
                for (var i=0; i<json.length; i++){
					allAreNumbers = allAreNumbers && (typeof(json[i]) == "number");
					append(as, themetext(null, indent+indentText, "array syntax", rightPad("["+i+"]",6,' '), "object syntax", ': '),
						   _renderjson(  options.replacer.call(json, i, json[i]), indent , true, show_level-1, options, cloneAndNew(keypath,i) ), //
						   i != json.length-1 ? themetext("syntax", ",") : [],
						   text("\n"));
					// skip to near the end of the array.
                    if (i == long_array_show_when_shortened-1  && json.length > long_array_short_limit){
						i = json.length - long_array_show_when_shortened-1;
						
						append(as, themetext(null, indent+indentText, "array syntax", "..." + ( json.length - 2*long_array_show_when_shortened) + ' others',null,'\n'));
						//append(as, themetext(null, '...'));
					}
                }
                if (allAreNumbers && json.length > 1){
					// do some stats on the data
					var stats = online_variance(json);
					append(as, themetext(null, indent+"    ", "array syntax",   'mean: ' + mjs_precision(stats.mean,2)   +
					' sigma:'+  mjs_precision(stats.sigma,2)  +
					' max:'+  mjs_precision(stats.maximum,2)  +
					' min:'+ mjs_precision(stats.minimum,2)   +
					' gradient:' + mjs_precision(stats.b,2)    ,null,'\n'));
					if (stats.maximum > stats.minimum){
						append(as, themetext(null, indent+indentText), sparkline(json,stats),themetext(null,'\n') );  
					}
				}			   
                append(as, themetext(null, indent, "array syntax", "]"));
				
				
                return as;
            });
        }

        // object
        if (isempty(json, options.property_list))
            return themetext(null, my_indent, "object syntax", "{}");
		
		// an object with stuff.
        return disclosure("{", "...", themetext("object syntax", "} (" + Object.keys(json).length + ' keys)') , "object", function () {
            var os = append(span("object"), themetext("object syntax", "{", null, "\n"));
            for (var k in json) var last = k;
            var keys = options.property_list || Object.keys(json);
            if (options.sort_objects)
                keys = keys.sort();
            for (var i in keys) {
                var k = keys[i];
                if (!(k in json)) continue;
                var newpath = cloneAndNew(keypath,k)
                append(os,  setTitle(  themetext(null, indent+"    ", "key", '"'+rightPad(k+'"',12,' '), "object syntax", ': '),joinPath(newpath))  ,
                       _renderjson(options.replacer.call(json, k, json[k]), indent+indentText, true, show_level-1, options,newpath),
                       k != last ? themetext("syntax", ",") : [],
                       text("\n"));
            }
            append(os, themetext(null, indent, "object syntax", "}"));
            return os;
        });
    }

    var renderjson = function renderjson(json,filename,reloadable)
    {
        var options = Object.assign({}, renderjson.options);
        options.replacer = typeof(options.replacer) == "function" ? options.replacer : function(k,v) { return v; };
        var pre = append(document.createElement("pre"), themetext("object syntax",filename+': '), _renderjson(json, "", false, options.show_to_level, options,[filename]));
        
        var removebutton = document.createElement("button");
		removebutton.innerHTML = "remove";
		removebutton.onclick = function(){  pre.remove(); removeJson(filename); }
		removebutton.className = 'removeButton'
		append(pre, removebutton )
		if (reloadable){
		var reloadbutton = document.createElement("button");
			reloadbutton.innerHTML = "reload";
			reloadbutton.onclick = function(){  pre.remove(); reloadFile(filename);   }
			reloadbutton.className = 'removeButton'
			append(pre, reloadbutton )
		}
		//append(as, text(indent+indentText), setxbutton,  setybutton , text("\n") );

        
        pre.className = "renderjson";
        
        return pre;
    }
    renderjson.set_icons = function(show, hide) { renderjson.options.show = show;
                                                  renderjson.options.hide = hide;
                                                  return renderjson; };
    renderjson.set_show_to_level = function(level) { renderjson.options.show_to_level = typeof level == "string" &&
                                                                                        level.toLowerCase() === "all" ? Number.MAX_VALUE
                                                                                                                      : level;
                                                     return renderjson; };
    renderjson.set_max_string_length = function(length) { renderjson.options.max_string_length = typeof length == "string" &&
                                                                                                 length.toLowerCase() === "none" ? Number.MAX_VALUE
                                                                                                                                 : length;
                                                          return renderjson; };
    renderjson.set_sort_objects = function(sort_bool) { renderjson.options.sort_objects = sort_bool;
                                                        return renderjson; };
    renderjson.set_replacer = function(replacer) { renderjson.options.replacer = replacer;
                                                   return renderjson; };
    renderjson.set_property_list = function(prop_list) { renderjson.options.property_list = prop_list;
                                                         return renderjson; };
    // Backwards compatiblity. Use set_show_to_level() for new code.
    renderjson.set_show_by_default = function(show) { renderjson.options.show_to_level = show ? Number.MAX_VALUE : 0;
                                                      return renderjson; };
    renderjson.options = {};
    renderjson.set_icons('⊕', '⊖');
    renderjson.set_show_by_default(false);
    renderjson.set_sort_objects(false);
    renderjson.set_max_string_length('none');
    renderjson.set_replacer(void 0);
    renderjson.set_property_list(void 0);
    console.log('loaded renderjson');
    return renderjson;
})();
