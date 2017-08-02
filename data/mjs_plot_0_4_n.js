/* **********************************************
                    mjs_plot

  CC MATTHEW SARSBY, 2017,Some Rights Reserved.
  
You are free to use, copy, and modify this
software in non-profit applications.
Modifications must retain this header, and a file
name in the format mjs_plot_*.js
 
mjs_plot is distributed with hope it will be useful
but WITHOUT ANY WARRANTY.

see CHANGES.txt for more details.
*********************************************** */

mjs_plot = (function () {

var MJS_PLOT_VERSION = '0_4_n_q';
var MJS_PLOT_AUTOR = 'MJS';
var MJS_PLOT_DATE = '2017';
var MJS_PLOT_WEBSITE = 'http://generalsarsby.github.io/mjs_plot/';
var MJS_PLOT_LINK_LOADER = "http://generalsarsby.github.io/mjs_plot/load_4.html#";
var DEBUGG_FORCE_TOUCH = false;
var DEBUGG_FPS = false;

var svgNS = "http://www.w3.org/2000/svg";  

var vals = [1,2,5]; // only go up in steps of 1s 2s or 5s. 
var few_minor_ticks = [2,2,5]; // with two or five ticks between
var many_minor_ticks = [5,4,5]; // or 5 or 4 ticks between.

//initial color table. hand picked for up to 7 colours.
//after 7 they are generated automatically.
var color_table = [['#aa3939'],
['#aa3939','#383276'],
['#aa3939','#236467','#7b9f35'],
['#aa3939','#aa6d39','#236467','#2d882d'],
['#aa3939','#aa6d39','#236467','#2d882d','#304473'],
['#aa3939','#aa6d39','#236467','#2d882d','#304473','#ac873c']];

var swatch = ['#aa3939','#aa6d39','#236467','#2d882d','#ffffff','#000000'];

function hslToRgb(h, s, l){
	var r, g, b;
	if(s == 0){
		r = g = b = l; // achromatic
	} else {
		function hue2rgb(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}
		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	return [ Math.round(r * 255),Math.round(g * 255),Math.round(b * 255)];
}

function rgbToHsl(d){
    var r = d[0]/255;
    var g = d[1]/255;
    var b = d[2]/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}
function hslToRgbString(h,s,l){
	var d = hslToRgb(h, s, l);
	return 'rgb(' +  d[0] +',' + d[1] +',' + d[2]  + ')';
}

function modifyColor(c,extraLightness,extraSaturation){
	var d = [parseInt(c[1]+c[2],16),parseInt(c[3]+c[4],16),parseInt(c[5]+c[6],16)];
	d = rgbToHsl(d);
	return hslToRgbString(d[0],d[1]+extraSaturation,d[2]+extraLightness);
}

function get_color(i,j,extraLightness,extraSaturation){
	//j is number of colors
	//i is current color(0 starting). i.e get color 1 of 7
	//i 0-->(j-1)
	if (j<color_table.length){
		return modifyColor(color_table[j][i],extraLightness,extraSaturation);
	}
	var sat = trim(1 - Math.exp(-1.1*j)+extraSaturation,0,1);
	//console.log('saturation',sat);
	var lightness = trim(0.5 + (1-Math.exp(-1.1*j))*Math.cos(i*Math.PI)*0.15 + extraLightness,0,1);
	//console.log('lightness',lightness);
	return hslToRgbString( i/(j+1) , sat, lightness);
}

function get_mono_color(i,j,hue){
	return hslToRgbString( hue , 0.8, 0.25+0.5*(i/(j+1))  );
}

function get_adjecent_color(i,j,hue){ // this mimics http://paletton.com/#uid=1080u0kllllyVb7r9gefxqs9Hvz adjecect color system.
	// use the hue, and +- 0.083 on ether side.
	var hues = [hue,(hue-0.083+1)%1,(hue+0.083)%1];  // center, left, right
	var variation = Math.floor(i/3);
	var steps = Math.floor(j/3);
	return get_mono_color(steps - variation,steps,hues[i%3]);
}

function get_spectrum_color(i,j){
	return hslToRgbString( i/(j+1) , 1.0, 0.7);
}

//this contains the most plain graph style and acts as a template for
//what constitues only the style of the graph. 
plainGraphStyle = {graph_line_thickness : 1, 
			 symbol_size : 5,
			 line_thickness: 1, 
			 tick_len : 7,
			 symbol_mode : 'circ_fill', //to be used for each item, 
			 line_mode : 'line',  // can be used without knowing how many series will be drawn
			 dash_mode : 'solid',  // but keywords can cause special behavour like incromenting/automatic
			 color : 'byOne', // this means to change the color for each line.
			 symbol_modes : [],  // these however refere to each series in order
			 line_modes : [], // and can set precisly which drawing method to use
			 dash_modes : [], // these are left blank so they will be filled by the auto system 
			 line_colours :[],
			 font_name : "serif", // be vague when specifiing fonts, try  to use serif sans-serif and mono
			 title_font_size : 20,
			 tick_labels_font_size : 10,
			 tick_lables_font_padding : 2, 
			 axis_labels_font_size: 10,
			 lable_spacing : 4,
			 minor_tick_len : 5,
			 guideWidthx : 35, 
			 guideWidthy : 20,
			 showTransformTexts : true, 
			 show_caption_symbol : false, 
			 show_caption_line: false, 
			 show_caption_box: false,
			 show_caption_reader: false, 
			 caption_font_size: 12, 
			 color_fg : '#000',
			 color_bg : '#fff', 
			 color_mg : '#555', 
			 show_xgrid: 0,
			 show_ygrid: 0
			 }

graphStyles = {
	"Plain" :plainGraphStyle, //this is applied first, then the customisations below
	"Thin Print":{graph_line_thickness:0.5, line_thickness:0.5, tick_len:5, symbol_mode:"byOne", title_font_size:12, tick_lables_font_padding:1.5, lable_spacing:2, minor_tick_len:2, guideWidthx:30, showTransformTexts:false, show_caption_symbol:true, show_caption_line:true, show_caption_box:true, color_mg:"#eee", show_xgrid:1, show_ygrid:1, color:"black"},
	"Print":{symbol_size:8, symbol_mode:"byOne", title_font_size:12, tick_labels_font_size:12, axis_labels_font_size:12, minor_tick_len:3, guideWidthy:25, showTransformTexts:false, show_caption_symbol:true, show_caption_line:true, show_caption_box:true, color_mg:"#888",  color:"#000"},
	"Thick Print" : {"graph_line_thickness":2,"symbol_size":7,"line_thickness":3,"tick_len":9,"symbol_mode":"Emptymarks","color":"darkGreys","font_name":"sans-serif","title_font_size":12,"tick_labels_font_size":11,"axis_labels_font_size":11,"show_caption_symbol":true,"show_caption_line":true},
	"Light On Dark":{line_thickness:2, line_mode:"approx", font_name:"sans-serif", color_fg:"#fff", color_bg:"#333", show_xgrid:1, show_ygrid:1, color:"byOneLight"},
	"Dark On Light":{line_thickness:2, line_mode:"approx", font_name:"sans-serif", color_bg:"#eee", color_mg:"#fff", show_xgrid:1, show_ygrid:1, color:"byOneDark"},
	"Mono":{symbol_size:4, tick_len:5, symbol_mode:"dot", font_name:"mono", title_font_size:9, tick_labels_font_size:9, axis_labels_font_size:9, lable_spacing:3, minor_tick_len:4, guideWidthx:30, guideWidthy:15, color_mg:"#eee", show_xgrid:2, show_ygrid:2},
	"Pickett":{graph_line_thickness:2, line_thickness:3, font_name:"sans", tick_labels_font_size:15, tick_lables_font_padding:3, axis_labels_font_size:15, minor_tick_len:3, guideWidthx:40, guideWidthy:30, showTransformTexts:false, caption_font_size:15, color_fg:"#ffff00", color_bg:"#003468", color_mg:"#4aa",  color:"byOneLight"},
	"Dark Fills": {"symbol_size":10,"line_thickness":0.7,"symbol_mode":"none","line_mode":"HighlightAndFill","color":"verticalGrad","font_name":"sans-serif","guideWidthy":30,"showTransformTexts":false,"color_fg":"#baa7cf","color_bg":"#1e1d36","color_mg":"#aaa"},
	"Neon Lollypop" : {"symbol_size":10.4,"line_thickness":3,"symbol_mode":"circ_gap","color":"byOneBold","color_fg":"#c8cce1","color_bg":"!L:2:black:#516265","show_xgrid":1,"show_ygrid":1},
	"Labeled Lines" : {"symbol_size":13,"line_thickness":3,"symbol_mode":"ytext","line_mode":"newinterp","color":"viridas","show_caption_line":true,"color_fg":"#3e4673","color_bg":"!R:8:#dde:#e6ebd9"},
	"White and Green" : {"symbol_size":11,"line_thickness":3,"tick_len":9,"symbol_mode":"Emptymarks","line_mode":"interp","color":"white","font_name":"sans-serif","title_font_size":19,"minor_tick_len":6,"showTransformTexts":false,"show_caption_symbol":true,"show_caption_line":true,"show_caption_box":true,"color_fg":"#ffffff","color_bg":"!L:2:#a8d37a:#80b647 ","color_mg":"#7a8e8f","show_ygrid":1},
	"Baby Blue" : {"graph_line_thickness":1.6,"line_thickness":2.5,"tick_len":10,"line_mode":"HighlightAndFill","color":"white","dash_modes":["dotted","long-dash","dashed","solid",'long-dash-dot','dotted'],"font_name":"sans-serif","tick_labels_font_size":12,"axis_labels_font_size":12,"minor_tick_len":0.1,"showTransformTexts":false,"color_fg":"#ffffff","color_bg":"!L:2:#51acfd:#2584d8","color_mg":"#5eb2fb","show_xgrid":1,"show_ygrid":1},
	"Solid Fills" : {"graph_line_thickness":1.1,"symbol_size":1,"line_thickness":2.5,"tick_len":10,"symbol_mode":"none","line_mode":"LineAndFill","color":"verticalGrad","font_name":"monospace","title_font_size":11,"tick_labels_font_size":9,"axis_labels_font_size":9,"minor_tick_len":0.1,"guideWidthx":24,"guideWidthy":13,"showTransformTexts":false,"show_caption_box":true,"color_fg":"#ffffff","color_bg":"!L:2:#20313b:#000000","color_mg":"#35444b","show_xgrid":1,"show_ygrid":1},
	"Mono Labeled" : {"graph_line_thickness":1.1,"symbol_size":18,"line_thickness":1.4,"tick_len":10,"symbol_mode":"ytext","line_mode":"line","color":"byOnePastle","font_name":"monospace","title_font_size":15,"tick_labels_font_size":11,"axis_labels_font_size":11,"minor_tick_len":0.1,"guideWidthx":52.5,"guideWidthy":45,"showTransformTexts":false,"show_caption_line":true,"show_caption_box":true,"color_fg":"#27282d","color_bg":"#ffffff","color_mg":"#aaa","show_xgrid":1,"show_ygrid":1},
	"Bright Blocks" : {"graph_line_thickness":1.1,"symbol_size":7.199999999999999,"line_thickness":2,"tick_len":4,"symbol_mode":"Emptymarks","line_mode":"LineAndFill","color":"plasma","symbol_modes":["box_bg","circ_bg","diamond_bg","box_bg","circ_bg"],"line_modes":["line","line","line","line","line"],"dash_modes":["solid","solid","solid","solid","solid"],"line_colours":["#0d0887","#6100a7","#ad2793","#e16462","#fdab33"],"font_name":"sans-serif","title_font_size":10,"minor_tick_len":4.1,"guideWidthx":52.5,"guideWidthy":45,"showTransformTexts":false,"show_caption_symbol":true,"show_caption_line":true,"show_caption_box":true,"color_fg":"#000000","color_bg":"!R:8:white:grey","color_mg":"#c2cac5"},
	"Spectrumise" : {"symbol_size":7.2,"line_thickness":2,"symbol_mode":"none","line_mode":"approx","color":"spectrum","font_name":"sans-serif","showTransformTexts":false,"show_caption_symbol":true,"show_caption_line":true,"show_caption_box":true,"color_fg":"#ffffff","color_bg":"!R:5:#444:#222","color_mg":"#222","show_xgrid":1,"show_ygrid":1},
	"Thesis" : {"graph_line_thickness":0.6,"symbol_size":1.6,"line_thickness":1.6,"tick_len":6,"color":"byOnePastle","font_name":"Latin Modern Roman","title_font_size":10,"showTransformTexts":false,"show_caption_symbol":true,"show_caption_line":true,"show_caption_box":true,"color_fg":"#000000","color_bg":"#ffffff","color_mg":"#aaa","show_xgrid":1,"show_ygrid":1},
}


graphStyleNames = [];
for (var style in graphStyles) {
    if (graphStyles.hasOwnProperty(style)) {
		graphStyleNames.push(style);
    }
}

//load viridas.js and load a very large array of vales 
//a = viridas.filter( (e,i) => i%9 == 0)
// reduce the count so there are 29 items
//then convert them to integers
//b = a.map( e =>  {return '' + Math.floor(256*e[0]) + ',' + Math.floor(256*e[1]) + ',' + Math.floor(256*e[2]) } )
viridasColors = ["#440154", "#470e61", "#481b6d", "#482677", "#46327e", "#433d84", "#3f4788", "#3b518b", "#375b8d", "#32648e", "#2e6d8e", "#2b758e", "#277e8e", "#24868e", "#218f8d", "#1f978b", "#1fa088", "#22a884", "#2ab07f", "#37b878", "#46c06f", "#58c765", "#6ccd5a", "#81d34d", "#98d83e", "#b0dd2f", "#c8e020", "#dfe318", "#f6e620"];

function get_viridas_color(i,j){
	return viridasColors[ Math.floor(viridasColors.length*i/(j+1)) ];
}

//https://github.com/politiken-journalism/scale-color-perceptual
// check out implementing other common color maps?

plasmaColors = ["#0d0887", "#240691", "#350498", "#44039e", "#5302a3", "#6100a7", "#6f00a8", "#7d03a8", "#8a09a5", "#9613a1", "#a21d9a", "#ad2793", "#b7318a", "#c13b82", "#ca457a", "#d24f71", "#da5a6a", "#e16462", "#e76f5a", "#ed7a52", "#f3854b", "#f79143", "#fa9e3b", "#fdab33", "#feb82c", "#fdc627", "#fbd524", "#f7e425", "#f1f426"];
function get_plasma_color(i,j){
	return plasmaColors[ Math.floor(viridasColors.length*i/(j+1)) ];
}

function get_greyscale_color(i,j, offset, band){
	// 4,6 for light greys
	// 0,6 for darg greys
	return hslToRgbString( 0, 0, offset + band * i/(j+1)  );
}


function get_simple_gradient_color(i,j,extraLightness,extraSaturation,position){
	//position = position || 2; // by default have a vertical gradient that gets lighter?
	return generateGradientString( position!=5?'linear':'radial',
		position,
		[get_color(i,j,extraLightness+0.15,extraSaturation),
		get_color(i,j,extraLightness-0.15,extraSaturation)]
	);
}

function generateGradientString(type,position,colors){
	// type is a string of "linear" or "radial"
	// position is an int in the range 1 -- 9 for the positions around the square starting in the top left, moving book-wise
	// colors is an array of string that represent valid css colors to be used for each of the color stops. i.e. ['red','#ff0000','rgb(255,0,0)'] ect.
	var r ='';
	if (type ==='linear'){
		r += '!L';
	} else if (type ==='radial'){
		r += '!R';
	} else {
		console.log('unknown gradient string type: ' + type );
	}
	r += ':' + position;
	for (var i=0;i<colors.length;i++){
		r += ':' + colors[i];
	}
	return r;
}

function parseExpression(graph,text,ax,ay){
	//move some functions around from the math namespace to local so
	//they can be used inside eval.
	//ax and ay are arrays
	var sin = Math.sin;
	var cos = Math.cos;
	var tan = Math.tan;
	var ln = Math.log;
	var pi = Math.PI;
	var e = Math.E;
	var pow = Math.pow;
	var sqrt = Math.sqrt;
	var log = function(x){
		return Math.log(x)/Math.log(10);
	}
	var now = (new Date()).getTime();
	var returny = [];
	text = text.replace(/x/g,'ax[i]');
	text = text.replace(/y/g,'ay[i]');
	var wrapper = "for (var i = 0;i<ax.length;i++){"+
		"returny.push( "+  text + ");}";
	try{
		eval(wrapper);
	}catch(e){
		graph.errors.push('Evaluation of ' + text + ' failed');
	}
	return returny;
	
}

function string_hash(s){
	var hash =321;
    for (var i = 0; i < s.length*50; i++) {
       hash = s.charCodeAt(i%s.length) + ((hash << 5) - hash);
    }
	return hash & hash; //convert to 32bit int (signed)
}
function color_from_string(s){
	hash = string_hash(s);
	hue = Math.abs((hash%256)/256);
	sat = 0.9;
	lightness = 0.3 + 0.2*(Math.abs(hash)%3);
	return hslToRgbString(hue,sat,lightness);
}

function clone(existingArray) {
   var newObj = (existingArray instanceof Array) ? [] : {};
   for (i in existingArray) {
      if (i == 'clone') continue;
      if (existingArray[i] && typeof existingArray[i] == "object") {
         newObj[i] = clone(existingArray[i]);
      } else {
         newObj[i] = existingArray[i]
      }
   }
   return newObj;
}

function hasLocalStorage(){
    try {
        localStorage.setItem("MJSplot","Stored");
        localStorage.removeItem("MJSplot");
        return true;
    } catch(e) {
        return false;
    }
}
function isMobile(){
	var platforms = {
    Android: function() {
        return /Android/i.test(navigator.userAgent);
    },
    BlackBerry: function() {
        return /BlackBerry/i.test(navigator.userAgent);
    },
    iOS: function() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    Windows: function() {
        return /IEMobile/i.test(navigator.userAgent);
    },
    any: function() {
        return (platforms.Android() || platforms.BlackBerry() || platforms.iOS() || platforms.Windows());
    }
	};
	return platforms.any();
};
function is_touch_device() {
	var can_touch = (('ontouchstart' in window)
		  || (navigator.MaxTouchPoints > 0)
		  || (navigator.msMaxTouchPoints > 0));
	return ((can_touch && isMobile()) || DEBUGG_FORCE_TOUCH );
}
var mouse_down = false;
var start_x = 0;
var end_x = 0;
var full_screen_graph;
//fix f****ng google chrome and ie. 
try {
	//might not even have log10. 
	Math.log10(100);
}
catch(e) {
	//have to add it!
	Math.log10 = function(x){
	  return Math.log(x) / Math.LN10;
	};
}

var symbols = ['x', 'cross','asterix','hash','burst',
'flower','linestar','star','fivestar','shuriken','none','ytext',
'circ','circ_fill','circ_gap','circ_bg',
'box','box_fill','box_gap','box_bg',
'diamond','diamond_fill', 'diamond_gap','diamond_bg'];
var symbolsNames = ['X', 'Cross','Asterix','Hash','Burst',
'Flower','Star with lines','Star','5 point Star','Shuriken','None','Y position',
'Circle','Filled Circle','Circle with gap','Empty Circle',
'Square','Filled Square','Square with gap','Empty Square',
'Diamond','Filled Diamond','Diamond with gap','Empty Diamond'];

var lines = [  'line','approx','simiapprox','newinterp','interp','zag','zig','mid','hist','sketch','scribble','fillBelow','HighlightAndFill','LineAndFill','none' ];
var lineNames = ['Straight line','Approximating curve','Weakly approximating curve','Interpolating curve','Weakly interpolating curve',
'Horizontal then vertical','Vertical then horizontal','Midpoint vertical','Histogram bars','Webbing','Scribble (fun)','Fill Below','Line and Transparent Fill','Line and Fill','No line'];

var dashmodes = ['solid','dotted','dashed','dash-dot','long-dash','long-dash-dot'];

var fakeGraph = {
			canvas : {width:100,height:100},
			graphics_style : {color_fg:'black',color_bg:'white'},
			units_to_pixels:function(x,s){return x},
			get_axis_string:function(n,s){return '2.1'},
			points_drawn:0,
			data : [  [ [0],[0] ] ]
			}

var log_vals = [[1],
		[1,3],
		[1,2,5],
		[1,2,3,6],
		[1,2,3,4,6],
		[1,2,3,4,6,8],
		[1,1.5,2,3,4,6,8],
		[1,1.5,2,2.5,3,4,6,8],
		[1,1.5,2,2.5,3,4,6,7,8],
		[1,1.2,1.5,2,2.5,3,4,5,6,7,9],
		[1,1.2,1.5,2,2.5,3,4,5,6,7,8,9],
		[1,1.2,1.4,1.6,1.8,2,2.5,3,4,5,6,7,8,9],
		[1,1.1,1.2,1.3,1.4,1.6,1.8,2,2.2,2.4,2.6,2.8,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5],
		[1,1.1,1.2,1.3,1.4,1.6,1.8,2,2.2,2.4,2.6,2.8,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5],
		[1,1.05,1.1,1.15,1.2,1.25,1.3,1.4,1.6,1.8,2,2.2,2.4,2.6,2.8,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5],
		[1,1.05,1.1,1.15,1.2,1.25,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.2,2.4,2.6,2.8,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5],
		[1,1.05,1.1,1.15,1.2,1.25,1.3,1.35,1.4,1.45,1.5,1.55,1.6,1.65,1.7,1.75,1.8,1.85,1.9,1.95,2,2.1,2.2,2.3,2.4,2.5,2.6,2.7,2.8,2.9,3,3.2,3.4,3.6,3.8,4,4.2,4.4,4.6,4.8,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5],
		[1,1.02,1.04,1.06,1.08,1.1,1.12,1.14,1.16,1.18,1.2,1.22,1.24,1.26,1.28,1.3,1.32,1.34,1.36,1.38,1.4,1.42,1.44,1.46,1.48,1.5,1.52,1.54,1.56,1.58,1.6,1.62,1.64,1.66,1.68,1.7,
		1.72,1.74,1.76,1.78,1.8,1.82,1.84,1.86,1.88,1.9,1.92,1.94,1.96,1.98,
		2,2.05,2.1,2.15,2.2,2.25,2.3,2.35,2.4,2.45,2.5,2.55,2.6,2.65,2.7,2.75,2.8,2.85,2.9,2.95,
		3,3.1,3.2,3.3,3.4,3.5,3.6,3.7,3.8,3.9,4,4.1,4.2,4.3,4.4,4.5,4.6,4.7,4.8,4.9,
		5,5.2,5.4,5.6,5.8,6,6.2,6.4,6.6,6.8,7,7.2,7.4,7.6,7.8,8,8.2,8.4,8.6,8.8,9,9.2,9.4,9.6,9.8],
		[1,1.01,1.02,1.03,1.04,1.05,1.06,1.07,1.08,1.09,1.1,1.11,1.12,1.13,1.14,1.15,1.16,1.17,1.18,1.19,1.2,1.21,1.22,1.23,1.24,1.25,1.26,1.27,1.28,1.29,
		1.3,1.31,1.32,1.32,1.34,1.35,1.36,1.37,1.38,1.39,1.4,1.41,1.42,1.43,1.44,1.45,1.46,1.47,1.48,1.49,1.5,1.51,1.52,1.53,1.54,1.55,1.56,1.57,1.58,1.59,1.6,1.61,1.62,1.63,1.64,1.65,1.66,1.67,1.68,1.69,
		1.7,1.71,1.72,1.73,1.74,1.75,1.76,1.77,1.78,1.79,1.8,1.81,1.82,1.83,1.84,1.85,1.86,1.87,1.88,1.89,1.9,1.91,1.92,1.93,1.94,1.95,1.96,1.97,1.98,1.99,
		2,2.02,2.04,2.06,2.08,2.1,2.12,2.14,2.16,2.18,2.2,2.22,2.24,2.26,2.28,2.3,2.32,2.34,2.36,2.38,2.4,2.42,2.44,2.46,2.48,2.5,2.52,2.54,2.56,2.58,2.6,2.62,2.64,2.68,2.7,2.72,2.74,2.76,2.78,2.8,2.82,2.84,2.86,2.88,
		2.9,2.92,2.94,2.96,2.98,
		3,3.05,3.1,3.15,3.2,3.25,3.3,3.35,3.4,3.45,3.5,3.55,3.6,3.65,3.7,3.75,3.8,3.85,3.9,3.95,4,4.05,4.1,4.15,4.2,4.25,4.3,4.35,4.4,4.45,4.5,4.55,4.6,4.65,4.7,4.75,4.8,4.85,4.9,4.95,
		5,5.1,5.2,5.3,5.4,5.5,5.6,5.7,5.8,5.9,6,6.1,6.2,6.3,6.4,6.5,6.6,6.7,6.8,6.9,7,7.1,7.2,7.3,7.4,7.5,7.6,7.7,7.8,7.9,8,8.1,8.2,8.3,8.4,8.5,8.6,8.7,8.8,8.9,9,9.1,9.2,9.3,9.4,9.5,9.6,9.7,9.8,9.9]
		];

var log_vals_ticks = [[1,3],
		[1,2,3,4,5,6,7,8,9],
		[1,2,3,4,5,6,7,8,9],
		[1,2,3,4,5,6,7,8,9],
		[1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,3,4,5,6,7,8,9],
		[1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.5,3,4,5,6,7,8,9],
		[1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,8,9],
		[1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.25,2.75,3,3.5,4,4.5,5,5.5,6,6.5,7,8,9],
		[1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.25,2.75,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,9],
		[1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.2,2.4,2.6,2.8,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,9],
		[1,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2.2,2.4,2.6,2.8,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,9]
		]; //minor tick mode changes after this many. 

		
		//There is no ruleset to generate the allowed time intervals. so I've just written them out. all in milliseconds.
 //                      all the miliseeconds up to   the seconds - a base 60 system   minuilts - a base 60 system               hours -  a base 12/24system                      days
//                       500 ms                     1s   2s   5s   10s   15s   20s   30s   1m    2m     5m     10m    15m    20m     30m     1h      2h      3h       6h       12h      1d       2d        5d        7d        14d        30d        60d        180d        1y          2y          5y           10y          20y          50y           100y          200y          500y           1000y
var allowed_intervals = [1,2,5,10,20,50,100,200,500,1000,2000,5000,10000,15000,20000,30000,60000,120000,300000,600000,900000,1200000,1800000,3600000,7200000,10800000,21600000,43200000,86400000,172800000,432000000,604800000,1209600000,2592000000,5184000000,15552000000,31536000000,63072000000,157680000000,315360000000,630720000000,1576800000000,3153600000000,6307200000000,15768000000000,31536000000000 ];
     var time_ticks=[0.2,0.5,1,2 ,5 ,10,20 ,50 ,100,200 ,500 ,1000,2000 ,5000, 5000 ,10000,20000,30000 ,60000 ,120000,300000,300000 ,600000 ,1200000,1800000,3600000 ,7200000 ,10800000,21600000,43200000 ,86400000 , 86400000 ,172800000 ,864000000 ,1728000000,2592000000 ,7884000000 ,31536000000,31536000000 ,63072000000 ,157680000000,315360000000 ,630720000000 ,1576800000000,3153600000000,6307200000000 ];
//                                                                                                                                                                                                                        2d         10d        20d        30d         1/4y        1/y
	var string_precisions = [8,8,8,7, 7 ,7 ,6  ,6  ,6  ,5   ,5   ,5   ,5    ,5    ,5    ,5    ,4    ,4     ,4     ,4     ,4      ,4      ,4      ,3      ,3      ,3      ,3       ,3       ,2       ,2        ,2        ,2         ,2         ,1         ,1          , 0         ,0        ,0          ,0           ,0            ,0          ,0            ,0            ,0            ,0              , 0];
	
	
	//line dash modes

	var lineDashModes = {'solid':[],
		'dotted':[1,1],
		'dashed':[3,1],
		'dash-dot':[3,1,1,1],
		'long-dash':[5,1],
		'long-dash-dot':[5,1,1,1]
		}

	function buildDashArrayFromString(s){
		var r = [];
		var ss = '';
		for (var i=0;i<s.length;i++){
			ss = s[i];
			switch(ss){
			case ',':
				r.push(0.5);r.push(1);
				break;
			case '.':
				r.push(1);r.push(1);
				break;
			case '-':
				r.push(3);r.push(1);
				break;
			case '/':
				r.push(5);r.push(1);
				break;
			}
			
		}
		return r
	}
	
	
//181 is the character code for the micro - mu symbol.
si_prefixes = ['y','z','a','f','p','n',String.fromCharCode( 181 ),'m','.','k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
function eng_form_infix(number,precision){

	if (!isFinite(precision)){precision = 5;}
	if (precision<1){precision =1;}
	if (precision>21){precision =21;}
	
	if (Math.abs(number) < 1e-24 || Math.abs(number) >= 1e27){
		return mjs_precision(number,precision);
	}
	//return an infix engeneering form number with at least precision significant figures.
	var neg_sign = '';
	if (number<0){neg_sign = '-';}
	number = Math.abs(number);
	var degree = Math.floor(Math.log10(number) / 3);
    var scaled = number * Math.pow(1000, -degree);
	var first_parts = ( scaled.toFixed(Math.max((precision-3),0)) +'.').split('.');
	var last_parts =  ( scaled.toFixed(Math.max(0,precision - first_parts[0].length)) +'.').split('.');
	var infix_form = last_parts[0] + si_prefixes[degree+8] + last_parts[1];
	if (last_parts[1].length==0 && degree ==0){
		infix_form = last_parts[0]
	}
	return neg_sign+infix_form;
}

function eng_form_postfix(number,precision){
	//return an postfix engeneering form number with at least precision significant figures.
	if (!isFinite(precision)){precision = 5;}
	if (precision<1){precision =1;}
	if (precision>21){precision =21;}
	
	if (Math.abs(number) < 1e-24 || Math.abs(number) >= 1e27){
		return mjs_precision(number,precision);
	}
	var neg_sign = '';
	if (number<0){neg_sign = '-';}
	number = Math.abs(number);
	var degree = Math.floor(Math.log10(number) / 3);
    var scaled = number * Math.pow(1000, -degree);
	var first_parts = ( scaled.toFixed(Math.max((precision-3),0)) +'.').split('.');
	var last_parts =  ( scaled.toFixed(Math.max(0,precision - first_parts[0].length)) +'.').split('.');
	var postfix_form = last_parts[0]+'.'+last_parts[1] + si_prefixes[degree+8];
	if (last_parts[1].length!=0 && degree ==0){
		postfix_form = last_parts[0]+'.'+last_parts[1];
	}
	if (last_parts[1].length==0 && degree !=0){
		postfix_form = last_parts[0] + si_prefixes[degree+8];
	}
	if (last_parts[1].length==0 && degree ==0){
		postfix_form = last_parts[0];
	}
	return neg_sign+postfix_form;
}
var superscriptCharacters = [8304,185,178,179,8308,8309,8310,8311,8312,8313]; //zero to 9 in unicode superscripts. 
var superscriptMinus = String.fromCharCode(8315);
var superscriptPlus = String.fromCharCode(8314);
var unicodeTimes = String.fromCharCode(215);
function toSuperscript(n){
	var s;
	if (n<0){s = superscriptMinus; n*=-1;}
	else{s=''}
	n=parseInt(n).toString();
	for (var i=0;i<n.length;i++){
		s+=String.fromCharCode( superscriptCharacters[parseInt(n[i])] )
	}
	return s;
}

function maths_form(number,precision){
	var s = number.toExponential(trim(precision-1,0,20));
	var parts = s.split('e');
	if (parts[0] === '1'){
		return '10' + toSuperscript(parts[1]);
	} else {
		return parts[0] + unicodeTimes+'10' + toSuperscript(parts[1])
	}
}
	
function download_text(text,filename,type){
	var ftype = type || 'data:text/plain;charset=utf-8';
	var pom = document.createElement('a');
	//data:image/svg+xml;charset=utf-8
	pom.setAttribute('href', ftype+',' + encodeURIComponent(text));
	//pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	//pom.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text));
	pom.setAttribute('download', filename);
	pom.style.display = 'none';
	document.body.appendChild(pom);
	pom.click();
	document.body.removeChild(pom);
}

function updateDict(o,d){
	//update the dict d with values from o
	for (var key in o) {
		if (o.hasOwnProperty(key) && d.hasOwnProperty(key)) {
			d[key] = o[key];
		}
	}
}

function simplifyDict(o,d){
	//simplify o if d already has identical key values.
	for (var key in o) {
		if (o.hasOwnProperty(key) && d.hasOwnProperty(key)) {
			if (d[key] === o[key]){
				delete o[key]; 
			}
		}
	}
}

function new_window_with_text(text,title,width,height){
 var url = 'data:text/plain;charset=utf-8;base64,' + btoa(text);
 window.open(url, title, "width="+width+", height="+height);		
}

function save_gs(name, gs){
	//bake_cookie(name, gs);
	if (hasLocalStorage()){
		var string = JSON.stringify(gs);
		localStorage.setItem(name, string);
	} else {
		console.log("No local storage!");
	}
}

function load_gs(graphname){
	var gs  = mjs_plot.get_graph_style();
	if (hasLocalStorage()){
		var result = localStorage.getItem(graphname);
		result && (result = JSON.parse(result));
		result && (gs = result);
	} else {
		console.log("No local storage!");
	}
	 return gs;
}

function linear_regression(x,y){
	var sum_x = 0;
	var sum_y = 0;
	var sum_xx = 0;
	var sum_xy = 0;
	for (var i = 0;i<x.length;i++){
		sum_x += x[i];
		sum_xx += x[i]*x[i];
		sum_y += y[i];
		sum_xy +=x[i]*y[i];
	}
	var n = x.length;
	sum_xy -= sum_x*sum_y/n;
	sum_xx -= sum_x*sum_x/n;
	var b = sum_xy / sum_xx;
	var a = sum_y/n - b * sum_x/n;
	return slope = {a : a,b : b}
}

function online_variance(data){
    var n = 0;
    var mean = 0.0;
    var M2 = 0.0;
    for (var i=0;i<data.length;i++){
		var x = data[i];
        n += 1;
        delta = x - mean;
        mean += delta/n;
        M2 += delta*(x - mean);
	}
	var sigma = M2 / (n - 1);
    return {mean:mean,sigma:sigma}
}

function series_stats(x,y){
	var sum_x = 0;
	var sum_y = 0;
	var sum_xx = 0;
	var sum_xy = 0;
	var sum_yy = 0;
	for (var i = 0;i<x.length;i++){
		sum_x += x[i];
		sum_xx += x[i]*x[i];
		sum_y += y[i];
		sum_xy +=x[i]*y[i];
		sum_yy +=y[i]*y[i];
	}
	var n = x.length;
	sum_xy -= sum_x*sum_y/n;
	sum_xx -= sum_x*sum_x/n;
	sum_yy -= sum_y*sum_y/n;
	
	//the r^2 value
	var r_2 = sum_xy * sum_xy / sum_xx / sum_yy;
	
	var x_mean = sum_x/n;
	var y_mean = sum_y/n;
	var sigma_x = Math.sqrt(sum_xx / n);
	var sigma_y = Math.sqrt(sum_yy / n);
	//covarience(x,y)
	var cov = sum_xy / n;
	//slope of linear regression
	var b = sum_xy / sum_xx;
	//intercept of linear regression
	var a = sum_y/n - b * sum_x/n;
	// s is varience in regression error
	var s = Math.sqrt( (sum_yy - sum_xy*sum_xy/sum_xx)/(n-2) );
	// standard error on b
	var s_b = s / Math.sqrt(sum_xx);
	//standard error in a
	var s_a = s * Math.sqrt( 1/n + x_mean * x_mean/sum_xx );
	var ymin = Math.min.apply(null, y );
	var ymax = Math.max.apply(null, y );
	var xmin = Math.min.apply(null, x );
	var xmax = Math.max.apply(null, x );
	
	return stats = {x_mean : x_mean,
					y_mean : y_mean,
					sigma_x: sigma_x,
					sigma_y:sigma_y,
					cov    : cov,
					b      : b,
					a      : a,
					s_b    : s_b,
					s_a    : s_a,
					n      : n,
					r_2    : r_2,
					ymin   : ymin,
					ymax   : ymax,
					xmin   : xmin,
					xmax   : xmax};
}

 
function padLeft(nr, n, str){
    return Array(n-String(nr).length+1).join(str||'0')+nr;
}


var colorPickerCanvas,colorPickerSize = 0,colorPickerSaturation=0;
function getColorPickerImage(size,saturation){
	size = Math.round(size);
	if (size == colorPickerSize && saturation === colorPickerSaturation){
		return colorPickerCanvas; //don't remake it.
	}
	colorPickerSize = size;
	colorPickerSaturation = saturation;
	// or remake everything to the new size.
	if (! colorPickerCanvas){
		colorPickerCanvas = document.createElement('canvas');
	}
	var canvas = colorPickerCanvas;
	canvas.width = size;
	canvas.height = size;
	
	
	var ctx = canvas.getContext('2d');
	var imgData = ctx.getImageData(0,0,size,size);
	var data = imgData.data;
	var color;
	for (var y=0;y<size;y++){
		for (var x=0;x<size;x++){
			color = getPickerColor(x/size,y/size,saturation);
			data[ y*size*4 + x*4    ] = color[0];
			data[ y*size*4 + x*4 + 1] = color[1];
			data[ y*size*4 + x*4 + 2] = color[2];
			data[ y*size*4 + x*4 + 3] = 0xff;
		} 
	}
	ctx.putImageData(imgData,0,0);
	return canvas;
}

function getPickerColor(x,y,s){ // x,y,and s are all between 0 and 1.
	return hslToRgb((x+0.95)%1,s,y);
}

function trim(n,l,h){
	//trimps a number to the range l<-->h
	n = Math.max(n,l);
	n = Math.min(n,h);
	return n;
}
function getFloat(promptString,fallback){
	var r = parseFloat(prompt(promptString,fallback));
	if (isFinite(r)){
		return r;
	} else {
	 return fallback;
	}
}
function getInt(promptString,fallback){
	var r = parseInt(prompt(promptString,fallback));
	if (isFinite(r)){
		return r;
	} else {
	 return fallback;
	}
}
function getString(promptString,fallback){
	var r = prompt(promptString,fallback);
	if (typeof r ==='string'){
		return r;
	} else {
	 return fallback;
	}
}

function eye(ctx,x,y,r,open){
	ctx.beginPath();
	var h = r*2/3;
	if (open){
		ctx.moveTo(x-r,y);
		ctx.quadraticCurveTo(x,y+h,x+r,y);
		ctx.quadraticCurveTo(x,y-h,x-r,y);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(x,y,h/2,0,2*Math.PI,0,false);
		ctx.stroke();
	} else {
		ctx.moveTo(x-r,y);
		ctx.quadraticCurveTo(x,y+h,x+r,y);
		ctx.stroke();
	}
	
}

function star(ctx,x,y,r,ratio,n,t){
   var m = t + Math.PI * 2;
   var px = x - r * Math.sin(t);
   var py = y - r * Math.cos(t);
   var dt = Math.PI / n;
   ctx.beginPath();
   ctx.moveTo(px, py);
   t += dt ;
   px = x - ratio * r * Math.sin(t);
   py = y - ratio * r * Math.cos(t);
   t += dt;
   ctx.lineTo(px, py);
   while (t < m) {
       px = x - r * Math.sin(t);
       py = y - r * Math.cos(t);
       ctx.lineTo(px, py);
       t += dt;
       px = x - ratio * r * Math.sin(t);
       py = y - ratio * r * Math.cos(t);
       ctx.lineTo(px, py);
       t += dt;
   }
   ctx.closePath();
}
function fivestar(ctx,x,y,r){ //this goes around twice connecting all the points. 
   var px = x;
   var py = y-r;
   var t=0;
   var dt = 4 * Math.PI / 5;
   var m = 4 * Math.PI;
   ctx.beginPath();
   ctx.moveTo(px, py);
   while (t < m) {
	   t+=dt;
       px = x - r * Math.sin(t);
       py = y - r * Math.cos(t);
       ctx.lineTo(px, py);
   }
   ctx.closePath();
}

// TODO probably remove the logo drawing code. 
// DONE all references to logo and drawLogo are removed. 
// the loading of images takes time, so they are not avaliable when the graph first plots. this sucks. 

/*
var logodata = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'+
'<svg id="MJSPlot" version="1.1" width="1500" height="650" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'+
'<path stroke-linejoin="round" d="m51.4 609 241-137 120 73 278-139 249 119 211-116 130-240 170-119" stroke="#25c4cb" stroke-linecap="round" stroke-width="38.2" fill="none"/>'+
'<path fill="#666" d="m365 322-7.69-149c-1.36-25.8 3.62-34.8 17.6-40.7 18-7.69 21.7-9.04 21.7-13.6 0-4.52-1.8-7.69-7.23-7.69-14.5 0-45.6 4.52-57.5 4.52-11.8 0-18 0-23.1 10.4l-71 147c-8.59 17.2-10.4 9.95-14.1 0.452l-52-128c-8.59-20.3-16.2-28.5-28.5-28.5-20.7 0-33.9-2.27-50.2-2.27-5.42 0-15.4-0.452-15.4 6.33 0 7.23 16.2 14.1 24.4 21.7 11.3 10.4 18.6 19 14.5 51.1l-15.4 120c-3.17 22.7-10.9 40.7-26.2 47.5-10.4 4.52-24.8 6.78-24.8 13.6 0 4.52 9.95 7.23 14.9 7.69 3.17 0 20.3-2.72 41.6-2.72 21.7 0 41.6 2.72 44.8 2.72 4.97-0.452 14.5-3.17 14.5-7.69 0-6.78-14.9-9.04-24.8-13.6-11.8-5.42-14.9-27.6-14.1-39.7l7.69-126c0.452-11.3 4.52-17.6 11.3-0.452l55.6 142c9.49 24.4 13.1 28 17.6 28 4.07 0 23.1-38.9 24.8-43l61-141c3.17-8.14 11.3-9.95 11.8-1.36l5.87 142c0.904 16.8-5.87 31.1-21.3 37.9-9.95 4.52-24.8 6.78-24.8 13.6 0 4.52 9.95 7.23 14.9 7.69 3.17 0 29.9-2.72 51.1-2.72 21.7 0 51.6 2.72 54.7 2.72 4.97-0.452 14.5-3.17 14.5-7.69 0-6.78-14.9-9.04-24.8-13.6-15.4-6.78-20.3-21.3-21.3-37.9z"/>'+
'<path fill="#666" d="m502 172c0-26.2 11.8-26.6 37.5-33.9 4.07-1.36 6.78-3.62 6.78-7.69 0-5.42-9.04-8.14-15.8-8.14-15.4 0-33.9 2.27-49.7 2.27-16.2 0-32.5-2.27-50.2-2.27-6.78 0-15.8 2.72-15.8 8.14 0 4.07 3.17 6.33 7.23 7.69 25.8 7.23 37.1 7.69 37.1 33.9v214c0 43.8-4.97 71-26.2 71-7.69 0-14.5-6.78-21.3-17.2-5.42-8.14-10.9-11.8-22.7-11.8-8.14 0-16.2 13.1-16.2 25.3 0 9.49 13.1 22.7 42.5 22.7 26.6 0 45.2-9.95 59.7-25.8 14.1-15.4 27.2-29.9 27.2-125v-154z"/>'+
'<path fill="#666" d="m652 117c-44.4 0-80.4 33.4-80.4 75.9 0 22.1 10.4 38.4 26.6 52l61 51.6c11.3 9.49 18 20.7 18 36.2 0 22.7-16.8 43.4-39.3 43.4-26.2 0-43.8-13.1-48.9-29.3-4.07-13.6-8.14-21.3-15.4-21.3-4.52 0-7.69 5.42-8.59 10.9-1.36 5.88-2.72 24.8-2.72 31.1 0 6.33 4.07 8.59 20.7 16.2 10.9 4.97 31.7 9.95 47.5 9.95 45.2 0 90.9-33 90.9-77.3 0-19-7.69-34.4-21.7-46.1l-63.7-53.8c-13.6-11.3-23.1-23.1-23.1-37.9 0-19.9 17.6-35.8 37.1-35.8 13.1 0 31.1 5.42 35.8 16.2 6.78 16.2 12.7 20.7 18 20.7 6.78 0 9.04-6.33 9.04-12.2 0-8.59-0.904-18.6-1.8-25.8-1.36-4.97-5.42-8.59-13.6-13.1-10.4-4.97-31.1-11.8-45.6-11.8z"/>'+
'<path fill="#aa3939" d="m829 145c0-6.78 6.33-10.4 22.7-10.4 30.3 0 56.9 22.1 56.9 52.4 0 23.5-9.95 39.7-27.6 54.7-12.7 10.9-19.4 11.8-19.4 16.2 0 5.42 3.17 7.69 8.14 7.69s12.2 0 28.9-9.04c31.7-17.2 55.1-39.3 55.1-76.4 0-45.6-50.6-65.5-96.2-65.5-40.3 0-58.8 1.36-98.6 4.52-9.49 0.452-15.8 2.72-15.8 8.14 0 4.07 3.17 6.33 7.23 7.69 25.8 7.23 37.1 7.69 37.1 33.4v165c0 16.8-5.87 25.8-21.3 32.5-9.95 4.52-24.8 6.78-24.8 13.6 0 4.52 9.95 7.23 14.9 7.69 3.17 0 30.3-2.72 49.7-2.72 21.7 0 51.6 2.72 54.7 2.72 4.97-0.452 14.5-3.17 14.5-7.69 0-6.78-14.9-9.04-24.8-13.6-15.4-6.78-21.3-15.8-21.3-32.5v-188z"/>'+
'<path fill="#aa3939" d="m1.02e3 131v207c0 11.3-4.97 25.3-17.2 28.9-12.2 3.62-19.9 7.23-19.9 11.8 0 4.52 4.07 9.04 15.8 9.04 9.95 0 31.1-2.72 40.3-2.72 7.23 0 29.9 2.72 39.7 2.72 11.8 0 15.4-4.52 15.4-9.04s-7.23-8.14-19.4-11.8c-12.2-3.62-17.2-17.6-17.2-28.9v-247c0-8.59 0-12.2-5.42-12.2-4.52 0-28.9 7.69-47 10.9-6.33 0.904-13.1 4.52-13.1 9.49s5.42 8.59 10.4 10.4c10.9 4.07 17.6 13.1 17.6 20.7z"/>'+
'<path fill="#aa3939" d="m1.16e3 281c0-32.5 17.2-68.3 49.7-68.3 39.3 0 60.1 43.4 60.1 83.7 0 33.4-14.1 74.1-47.5 74.1-42 0-62.4-47-62.4-89.5zm52.8-87.2c-48.9 0-98.1 43-98.1 97.2 0 53.8 40.7 101 95.8 101 57.9 0 104-49.3 104-108 0-52.4-49.3-90.4-102-90.4z"/>'+
'<path fill="#aa3939" d="m1.4e3 390c27.2 0 51.6-22.1 51.6-32.5 0-4.52-2.27-6.33-6.78-6.33-4.52 0-15.8 8.14-32.5 8.14-15.8 0-23.5-9.95-23.5-41.6v-84.5c0-6.33 1.8-8.59 7.23-8.59h44.8c6.33 0 10.9-11.8 10.9-16.2 0-4.52-1.8-10.4-9.04-10.4h-43.8c-5.88 0-9.95-2.27-9.95-6.78v-12.7c0-7.69-0.904-11.3-6.33-11.3-5.87 0-23.1 17.2-29.3 22.7-11.3 9.49-30.3 22.1-30.3 28.5 0 4.52 10.4 6.33 14.5 6.33 16.8 0 14.1 2.27 14.1 6.33v108c0 38.4 22.1 51.6 48.9 51.6z"/>'+
'</svg>';

var DOMURL = window.URL || window.webkitURL || window;
var logoloaded = false;
var logoimg = new Image();

logoimg.addEventListener('load', function() { //this is what screws everything up. 
	logoloaded = true;
	console.log('logo image loaded');
}, false);

var logosvg = new Blob([logodata], {type: 'image/svg+xml'});
var logourl = DOMURL.createObjectURL(logosvg);
logoimg.src = logourl;

function drawLogo(graph,ctx,x,y,w,h){
	if (!logoloaded) {return} //the logo isn't rendered when mjsplot starts up. 
	//draw the logo in the space xywh
	//the logo is 1500 by 650. 
	var lw = 1500;
	var lh = 650;
	var s = Math.min( w/lw,h/lh );
	var dx = x+0.5*( w-lw*s);
	var dy = y+0.5*(h-lh*s)
	
	if (graph.isSVG){
		//return;
		//put in a base64 encoded svg image. this only  works with a few editors. it loads in some svg viewers but not others. 
		ctx.image(dx, dy,lw*s,lh*s,'data:image/svg+xml;base64,'+btoa(logodata) );
		
	} else {
		ctx.drawImage(logoimg, dx, dy,lw*s,lh*s);
	}
}
* */

// line break on double spaces.
function drawPin(ctx,x,y,text,fontSize, bgfill){
	//draws a pin pointing at position x,y, that has the text text.
	ctx.textAlign = 'center';
	
	var textfill = ctx.fillStyle;
	
	var lines = text.split('  ');
	var w = 0;
	for(var i=0;i<lines.length;i++){
		w = Math.max( ctx.measureText( lines[i] ).width ,w);
	}
	var r = 0.5*Math.max(w,1.3*fontSize*lines.length) + fontSize/2* Math.min(1,0.2*w/fontSize); // radius of circle
	// the extra padding is scaled so that text things get more space, but single characters and
	// emoji filled pins are drawn with less extra padding. there may be a nicer function for this.
	var R = 1.66* r; //distance between tip to center. adjustable to preference
	var a = Math.asin(r/R);
	//ctx.arc(x,y-R,r,a,Math.PI-a,true);
	ctx.fillStyle = bgfill;
	ctx.beginPath();
	ctx.moveTo(x,y);
	var xa = Math.cos(a) * r;
	var ya = Math.sin(a) * r;
	ctx.lineTo(x - xa, y - R + ya ); //lower left corner
	ctx.quadraticCurveTo(x-r,y-R+ya/2,
						 x-r,y-R); // left 
	ctx.quadraticCurveTo(x-r,y-R-r,x,y-R-r); // to top
	ctx.quadraticCurveTo(x+r,y-R-r,x+r,y-R); //to right
	ctx.quadraticCurveTo(x+r,y-R+ya/2,x+xa,y-R+ya);
	
//	ctx.lineTo(x + xa, y - R + ya );
	ctx.lineTo(x,y);
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.fillStyle= textfill;
	for(var i=0;i<lines.length;i++){
		ctx.fillText(lines[i],x, y-R + fontSize*4/5 - lines.length*fontSize/2 + i*fontSize);
	}
} 

/*
function getDrawFunctionRotateable(s){
	var t = s.split(' '); //split on spaces
	var commands = [],d = [];
	for (var i =0;i<t.length;i++){
		if (isNaN(t[i])){ commands.push(t[i]); } 
		else { d.push(parseFloat(t[i])); }
	}
	str = 'var d=['+d.join(',')+']; var n=0;';
	for (var i =0;i<commands.length;i++){
		switch (commands[i]){
			case "b":
				str+="ctx.beginPath();";break;
			case "l":
				str+="ctx.lineTo(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]));n+=2;";break;
			case "m":
				str+="ctx.moveTo(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]));n+=2;";break;
			case "c":
				str+="ctx.closePath();";break;
			case "f":
				str+="ctx.fill();";break;
			case "s":
				str+="ctx.stroke();";break;	
			case "q":
				str+="ctx.quadraticCurveTo(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]),x + s*(Math.cos(r)*d[n+2] - Math.sin(r)*d[n+3] ),y + s*(Math.sin(r)*d[n+2] + Math.cos(r)*d[n+3]));n+=4;";break;
			case "a": // x y r start stop ( in frac of tau)
				str+="ctx.arc(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]),s*d[n+2],r + d[n+3]*6.283185307179586,r + d[n+4]*6.283185307179586,false);n+=5;";break;
		}
	}
	//make this into a compialable function so it runs at full speed.
	return new Function('ctx','x','y','s','r',str);	
}

//all the shapes make using the get draw function
//call any of these using (context, x, y, scale, rotation)
var arrow = 'b m 1 0 l -5 -2 l -4 0 l -5 2 l 1 0 c f';
drawArrow= getDrawFunctionRotateable(arrow);
console.log(drawArrow.toSource());
*/

// the above is renders the arrow funciton to below
function drawArrow(ctx, x, y, s, r) {
var d=[1,0,-5,-2,-4,0,-5,2,1,0];var n=0;ctx.beginPath();ctx.moveTo(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]));n+=2;ctx.lineTo(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]));n+=2;ctx.lineTo(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]));n+=2;ctx.lineTo(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]));n+=2;ctx.lineTo(x + s*(Math.cos(r)*d[n] - Math.sin(r)*d[n+1] ),y + s*(Math.sin(r)*d[n] + Math.cos(r)*d[n+1]));n+=2;ctx.closePath();ctx.fill();
}

function sumArray(a){
	var buf = 0;
	for (var i=0,l=a.length;i<l;i++){
		buf += a[i];
	}
	return buf;
}

function mjs_time_difference_print(milliseconds){
	//for printing the elapsed time. not absolute time.
	milliseconds = Math.abs(milliseconds);
	var d = milliseconds/1000
	milliseconds = milliseconds%1000;
	 var seconds = Math.floor(d%(60));
      var min = Math.floor(d/60%(60));
      var hours = Math.floor(d/60/60%(24));
      var days = Math.floor(d/60/60/24);
	var s = '';
	if (seconds>0){s= seconds+'seconds ' +milliseconds.toFixed(0) +'ms' }
	if (min>0){s=  min+'min ' + seconds+'seconds'}
	if (hours>0){s= hours+'hours '+ min+'min ' + seconds+'seconds' ;}
	if (days>0){s = days+'days ' + hours+'hours ' + min+'min'; }
	return s;
}

function ordinalSuffix(n){
    var j = n % 10,
        k = n % 100;
    if (j == 1 && k != 11) { return n + "st";}
    if (j == 2 && k != 12) { return n + "nd";} // String.fromCharCode( 8319 ) + 
    if (j == 3 && k != 13) { return n + "rd";} 
    return n + "th";
}
function datePad(n){return ('0' + n).slice(-2);} //like leftpad but faster and only for leftpad(n,'0',2).
function twelveHourTime(n){return n==12?'noon': (n<12?''+n+'am':''+(n-12)+'pm');}
var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function mjs_date_print(milliseconds,hp,lp){
	//milliseconds is the date
	//hp and lp in the range 0-8 inclusive
	// yyyy-mm-dd HH:MM:ss.###
	//   0   1 2  3  4  5  678
	//eg     hp   -> lp
    //     mm-dd HH:mm
	//
	hp = isFinite(hp) ? hp : 0;
	lp = isFinite(lp) ? lp : 8;
	hp = trim(hp,0,8);
	lp = trim(lp,0,8);
	hp = Math.min(hp,lp);
	var d = new Date(milliseconds);
	var s = '';
	
	if (hp==0){
		if (lp==0){
			return ''+d.getFullYear();
		} else if (lp==1){
			return ''+d.getFullYear() + '-' + (d.getMonth()+1);
		} else if (lp==2){
			return ''+d.getFullYear() + '-' + datePad(d.getMonth()+1) + '-' + datePad(d.getDate());
		} else if (lp==3){
			return ''+d.getFullYear() + '-' + datePad(d.getMonth()+1) + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours());
		} else if (lp==4){
			return ''+d.getFullYear() + '-' + datePad(d.getMonth()+1) + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes());
		} else if (lp==5){
			return ''+d.getFullYear() + '-' + datePad(d.getMonth()+1) + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes())+':' + datePad(d.getSeconds()) ;
		} else if (lp==6){
			return ''+d.getFullYear() + '-' + datePad(d.getMonth()+1) + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes())+':' + datePad(d.getSeconds()) +'.'+ Math.round(d.getMilliseconds()/100);
		} else if (lp==7){
			return ''+d.getFullYear() + '-' + datePad(d.getMonth()+1) + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes())+':' + datePad(d.getSeconds()) +'.'+ datePad(Math.round(d.getMilliseconds()/10));
		} else if (lp==8){
			return ''+d.getFullYear() + '-' + datePad(d.getMonth()+1) + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes())+':' + datePad(d.getSeconds()) +'.'+  padLeft(d.getMilliseconds(),3,'0');
		}
	} else if (hp==1){
		if (lp==1){
			return  months[d.getMonth()];
		} else if (lp==2){
			return  months[d.getMonth()] + '-' + datePad(d.getDate());
		} else if (lp==3){
			return '' + d.getDate() + months[d.getMonth()] + ' ' +  twelveHourTime(d.getHours());
		} else if (lp==4){
			return months[d.getMonth()] + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes());
		} else if (lp==5){
			return months[d.getMonth()] + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds()) ;
		} else if (lp==6){
			return months[d.getMonth()] + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds())  +'.'+ Math.round(d.getMilliseconds()/100);
		} else if (lp==7){
			return months[d.getMonth()] + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds())  +'.'+ datePad(Math.round(d.getMilliseconds()/10));
		} else if (lp==8){
			return months[d.getMonth()] + '-' + datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds()) + '.'+  padLeft(d.getMilliseconds(),3,'0');
		}
	} else if (hp==2){
		if (lp==2){
			return  months[d.getMonth()] + '-' + datePad(d.getDate()); //special case
		} else if (lp==3){
			//return ordinalSuffix(d.getDate()) + ' ' +  twelveHourTime(d.getHours());
			return '' + d.getDate() + ' ' +  d.getHours() + 'h';
		} else if (lp==4){
			return '' + d.getDate() + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes());
		} else if (lp==5){
			return datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds()) ;
		} else if (lp==6){
			return datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds())  +'.'+ Math.round(d.getMilliseconds()/100);
		} else if (lp==7){
			return datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds())  +'.'+ datePad(Math.round(d.getMilliseconds()/10));
		} else if (lp==8){
			return datePad(d.getDate()) + ' ' + datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds()) + '.'+  padLeft(d.getMilliseconds(),3,'0');
		}
	} else if (hp==3){ 
		if (lp==3){
			return datePad(d.getHours()) + ':' + datePad(d.getMinutes());
		} else if (lp==4){
			return datePad(d.getHours()) + ':' + datePad(d.getMinutes());
		} else if (lp==5){
			return datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds()) ;
		} else if (lp==6){
			return datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds())  +'.'+ Math.round(d.getMilliseconds()/100);
		} else if (lp==7){
			return datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds())  +'.'+ datePad(Math.round(d.getMilliseconds()/10));
		} else if (lp==8){
			return datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds()) + '.'+  padLeft(d.getMilliseconds(),3,'0');
		}
	} else if (hp==4){
		if (lp==4){
			return datePad(d.getHours()) + ':' + datePad(d.getMinutes());
		} else if (lp==5){
			return datePad(d.getHours()) + ':' + datePad(d.getMinutes()) + ':' + datePad(d.getSeconds()) ;
		} else if (lp==6){
			return ''+d.getMinutes() + 'm' + datePad(d.getSeconds())  +'.'+ Math.round(d.getMilliseconds()/100);
		} else if (lp==7){
			return ''+d.getMinutes() + 'm' + datePad(d.getSeconds())  +'.'+ datePad(Math.round(d.getMilliseconds()/10));
		} else if (lp==8){
			return ''+d.getMinutes() + 'm' + datePad(d.getSeconds()) + '.'+  padLeft(d.getMilliseconds(),3,'0');
		}
	} else if (hp==5){
		if (lp==5){
			return ''+d.getSeconds()+'s' ;
		} else if (lp==6){
			return ''+d.getSeconds()  +'.'+ Math.round(d.getMilliseconds()/100)+'s';
		} else if (lp==7){
			return ''+d.getSeconds()  +'.'+ datePad(Math.round(d.getMilliseconds()/10))+'s';
		} else if (lp==8){
			return ''+d.getSeconds() + '.'+  padLeft(d.getMilliseconds(),3,'0')+'s';
		}
	} else if (hp==6){
		if (lp==6){
			return ''+d.getSeconds()  +'.'+ Math.round(d.getMilliseconds()/100)+'s';
		} else if (lp==7){
			return datePad(Math.round(d.getMilliseconds()/10))+'ms';
		} else if (lp==8){
			return padLeft(d.getMilliseconds(),3,'0')+'ms';
		}
	} else if (hp==7){
		if (lp==7){
			return datePad(Math.round(d.getMilliseconds()/10))+'ms';
		} else if (lp==8){
			return padLeft(d.getMilliseconds(),3,'0')+'ms';
		}
	} else if (hp==8){
		return padLeft(d.getMilliseconds(),3,'0')+'ms';
	}	
}

function round_to_month(milliseconds){
	//takes a milliseconds date and returns milliseconds rounded to the nearest month
	var d = new Date(milliseconds);
	var nextMonth = (new Date(d.getFullYear(),d.getMonth()+1,1)).getTime();
	var thisMonth = (new Date(d.getFullYear(),d.getMonth(),1)).getTime();
	if (milliseconds - thisMonth < nextMonth - milliseconds){
		return thisMonth;
	} else {
		return nextMonth;
	}
}
 
 function round_to_year(milliseconds){
	var d = new Date(milliseconds);
	var down = new Date(d.getFullYear(),0,1);
	var up = new Date(d.getFullYear()+1,0,1);
	if (d.getTime()-down.getTime() < up.getTime() - d.getTime()  ){
		return down.getTime();
	} else {
		return up.getTime();
	}
 }
 

function centredPopupText(graph,ctx,x,y,text){
	//this also ensures that the text will appear on screen. 
	ctx.textAlign = 'center';
	var w = ctx.measureText(text).width;
	var h = graph.ui.size;
	var lw = graph.graphics_style.scaling_factor * graph.graphics_style.graph_line_thickness;
	x = Math.min(graph.canvas.width - w/2-lw-h*2/3,x);
	x = Math.max(w/2+lw+h*2/3,x);
	y = Math.min(graph.canvas.height - h/2-lw,y);
	y = Math.max(h/2+lw,y);
	ctx.lineWidth = lw;
	ctx.fillStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_bg);
	ctx.strokeStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_fg);
	ctx.beginPath();
	ctx.rect(x-w/2-lw-h/3,y-h/2-lw,w+2*lw+2*h/3,h+2*lw);
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_fg);
	ctx.fillText(text,x,y+h/3);
}

var fits = {
	//each fit has some_fit and some_fun
	//some_fun takes an array of x and the params for the fit returning an array of y
	//some_fit takes an array of x and and array of y
	//returning parameters - arbitary length array of numbers from the result of the fit
	//returning strings - an array length 3 of string to describe to the user the results (ofern printed)
	//returning fun - a function that will realise this fit.
	exponential_fun : function(x,params){
		var y = [];
		for (var i=0;i<x.length;i++){
			y.push(params[0] * Math.pow(Math.E, params[1] * x[i]));
		}
		return y;
	},
	exponential : function(ox,oy){
		//y = Ae^Bx
		var x = [];
		var y = [];
		for (var i=0; i<ox.length;i++){
			if ( oy[i] >0){
				x.push(ox[i]);
				y.push(oy[i]);
			}
		}
		var sum = [0, 0, 0, 0, 0, 0];
		var results = [];
		for (var n=0; n < x.length; n++) {
			sum[0] += x[n];
			sum[1] += y[n];
			sum[2] += x[n] * x[n] * y[n];
			sum[3] += y[n] * Math.log(y[n]);
			sum[4] += x[n] * y[n] * Math.log(y[n]);
			sum[5] += x[n] * y[n];
		}
		var denominator = (sum[1] * sum[2] - sum[5] * sum[5]);
		var A = Math.pow(Math.E, (sum[2] * sum[3] - sum[5] * sum[4]) / denominator);
		var B = (sum[1] * sum[4] - sum[5] * sum[3]) / denominator;
		var string = 'y = ' +mjs_precision(A,5)  + 'e^(' + mjs_precision(B,5) + 'x)';
		
		return { parameters:[A,B], strings : [string,'',''], fun : fits.exponential_fun}
	},
	exponential_plus_c_fun : function(x,params){
		var y = [];
		for (var i=0;i<x.length;i++){
			y.push(  params[0] + params[1]*Math.exp(params[2]*x[i]) );
		}
		return y;
	},
	exponential_plus_c : function(x,y){
		//a + b exp(c*x);
		var len = x.length;
		var S_xx=0,S_xs=0,S_ss=0,S_yx=0,S_ys=0,s=[];
		s[0] = 0
		for (var i=1; i < len; i++) {
			s[i] = s[i-1]+0.5*(y[i]+y[i-1])*(x[i]-x[i-1]);
		}
		for (var i=0; i < len; i++) {
			S_xx += (x[i]-x[0])*(x[i]-x[0]);
			S_xs += (x[i]-x[0])*s[i];
			S_ss += s[i]*s[i];
			S_yx += (y[i]-y[0])*(x[i]-x[0]);
			S_ys += (y[i]-y[0])*s[i];
		}
		var f = 1.0/(S_xx*S_ss-S_xs*S_xs);
		var A_1 = f * (S_ss*S_yx - S_xs*S_ys);
		var B_1 = f * (S_xx*S_ys - S_xs*S_yx);//B_1 = C_1 =C_2
		a = -1*A_1/B_1;
		var S_t=0,S_tt=0,S_y=0,S_yt=0,t=0;
		for (var i=0; i < len; i++) {
			t = Math.exp(B_1*x[i]);
			S_t += t;
			S_tt += t*t;
			S_y += y[i];
			S_yt += y[i]*t;
		}
		f = 1/(S_tt*len - S_t*S_t);
		var a_2 = f*(S_tt*S_y-S_t*S_yt);
		var b_2 = f*(len*S_yt-S_t*S_y);
		a=a_2;
		var string = 'y = ' + mjs_precision(a,5) + '+'+mjs_precision(b_2,5)+'e^(' + mjs_precision(B_1,5)+ 'x)';
		return {parameters: [a, b_2,B_1], strings: [string,'',''],fun:fits.exponential_plus_c_fun};
	},
	gauss_fun : function(x,params){
		var y = [];
		var mu = params[0];
		var sig = params[1];
		var root_two_pi = Math.sqrt(Math.PI * 2);
		for (var i=0;i<x.length;i++){
			y.push( params[2]/root_two_pi/sig * Math.exp(-0.5* Math.pow((x[i]-mu)/sig,2)) );
		}
		return y;
	},
	gauss : function(x,y){
		//taken from Cad de la fonction densite de probabilite de Gauss
		// Regression et Equation Intergrale
		// application a la distrobution Gaussienne
		var len = x.length;
		var s=[];
		s[0] = 0;
		var area = 0;
		
		for (var i=1; i < len; i++) {
			s[i] = s[i-1]+0.5*(y[i]+y[i-1])*(x[i]-x[i-1]);
			
		}
		area =Math.abs(s[i-1]);
		var t = [];
		t[0] = 0;
		for (var i=1; i < len; i++) {
			t[i] = t[i-1]+0.5*(x[i]*y[i]+x[i-1]*y[i-1])*(x[i]-x[i-1]);
		}
		var S_ss=0,S_st=0,S_tt=0,S_ys=0,S_yt=0;
		for (var i=0; i < len; i++) {
			S_ss +=s[i]*s[i];
			S_st +=s[i]*t[i];
			S_tt +=t[i]*t[i];
			S_ys +=(y[i]-y[0])*s[i];
			S_yt +=(y[i]-y[0])*t[i];
		}
		var f = 1/(S_ss*S_tt - S_st*S_st);
		var A = f * ( S_tt*S_ys - S_st*S_yt );
		var B = f * ( S_ss*S_yt - S_st*S_ys );
		//book says:
		var sig = -1.0/B* Math.sqrt(2.0/Math.PI);
		// I found:
		var sig = Math.sqrt(-1.0/B);
		var mu = -A/B;
		var string1 = 'A/(sig * sqrt(2pi)) exp(-0.5*((x-mu)/sig)^2)';
		var string2 = 'sig = ' + mjs_precision(sig,5) + ",  A = " + + mjs_precision(area,5);
		var string3 = 'mu = ' + mjs_precision(mu,5);
		
		return {parameters: [mu,sig,area], strings: [string1,string2,string3],fun:fits.gauss_fun};
	},
	
	linear_fun : function(x,params){
		var y = [];
		for (var i=0;i<x.length;i++){
			y.push( x[i]*params[0]+params[1] );
		}
		return y;
	},
	linear : function(x,y){
		var sum_x = 0;
		var sum_y = 0;
		var sum_xx = 0;
		var sum_xy = 0;
		var sum_yy = 0;
		for (var i = 0;i<x.length;i++){
			sum_x += x[i];
			sum_xx += x[i]*x[i];
			sum_y += y[i];
			sum_xy +=x[i]*y[i];
			sum_yy +=y[i]*y[i];
		}
		var n = x.length;
		sum_xy -= sum_x*sum_y/n;
		sum_xx -= sum_x*sum_x/n;
		sum_yy -= sum_y*sum_y/n;
		var x_mean = sum_x/n;
		var y_mean = sum_y/n;
		//the r^2 value
		var r_2 = sum_xy * sum_xy / sum_xx / sum_yy;
		//slope of linear regression
		var b = sum_xy / sum_xx;
		//intercept of linear regression
		var a = sum_y/n - b * sum_x/n;
		// s is varience in regression error
		var s = Math.sqrt( (sum_yy - sum_xy*sum_xy/sum_xx)/(n-2) );
		// standard error on b
		var s_b = s / Math.sqrt(sum_xx);
		var s_a = s * Math.sqrt( 1/n + x_mean * x_mean/sum_xx );
		var squared = String.fromCharCode( 178 ); //σ²
		string1 = 'r'+squared+' = ' + number_quote(r_2,1-r_2);
		string2 = 'intecept a = ' + number_quote(a,s_a) +String.fromCharCode( 177 ) +mjs_precision(s_a,2);
		string3 = 'slope b = ' + number_quote(b,s_b) + String.fromCharCode( 177 )+mjs_precision(s_b,2);
		return {parameters: [b,a], strings: [string1,string2,string3],fun:fits.linear_fun};
	},
	constant_fun : function(x,params){
		var y = [];
		for (var i=0;i<x.length;i++){
			y.push( params[0] );
		}
		return y;
	},
	constant : function(x,y){
		var sum_y = 0;
		var sum_yy = 0;
		for (var i = 0;i<x.length;i++){
			sum_y += y[i];
			sum_yy +=y[i]*y[i];
		}
		var n = x.length;
		sum_yy -= sum_y*sum_y/n;
		var y_mean = sum_y/n;
		var sigma_y = Math.sqrt(sum_yy / n);
		string1 = 'y='+number_quote(y_mean,sigma_y) + String.fromCharCode( 177 ) + mjs_precision(sigma_y,2);
		return {parameters: [y_mean], strings: [string1,'',''],fun:fits.constant_fun};
	},
	poly2 : function(x,y){
		return fits.polyn_fit(x,y,2);
	},
	poly3 : function(x,y){
		return fits.polyn_fit(x,y,3);
	},
	poly4 : function(x,y){
		return fits.polyn_fit(x,y,4);
	},
	poly5 : function(x,y){
		return fits.polyn_fit(x,y,5);
	},
	poly6 : function(x,y){
		return fits.polyn_fit(x,y,6);
	},
	poly7 : function(x,y){
		return fits.polyn_fit(x,y,7);
	},
	poly8 : function(x,y){
		return fits.polyn_fit(x,y,8);
	},
	//polynomial function break the normal api internally
	//as they forward to the generic poly n method with different order
	polyn_fun : function(x,params){
		var y = [];
		for (var i = 0; i < x.length; i++) {
			y[i] = 0;
			for (var w = 0; w < params.length; w++) {
				y[i] += params[w] * Math.pow(x[i], w);
			}
		 }
		 return y;
	},
	polyn_fit : function(x,y,o){
		var lhs = [], rhs = [], a = 0, b = 0, i = 0, k = o + 1;
		for (var i = 0; i < k; i++) {
			for (var l = 0, len = x.length; l < len; l++) {
				a += Math.pow(x[l], i) * y[l];
			}
			lhs.push(a);
			a = 0;
			var c = [];
			for (var j = 0; j < k; j++) {
				for (var l = 0, len = x.length; l < len; l++) {
					b += Math.pow(x[l], i + j);
				}
				c.push(b), b = 0;
			}
			rhs.push(c);
		}
		rhs.push(lhs);
		//begin gaussian elemination  . . . 
	   var j = 0, k = 0, maxrow = 0, tmp = 0, n = rhs.length - 1;
	   for (i = 0; i < n; i++) {
		  maxrow = i;
		  for (j = i + 1; j < n; j++) {
			 if (Math.abs(rhs[i][j]) > Math.abs(rhs[i][maxrow]))
				maxrow = j;
		  }
		  for (k = i; k < n + 1; k++) {
			 tmp = rhs[k][i];
			 rhs[k][i] = rhs[k][maxrow];
			 rhs[k][maxrow] = tmp;
		  }
		  for (j = i + 1; j < n; j++) {
			 for (k = n; k >= i; k--) {
				rhs[k][j] -= rhs[k][i] * rhs[i][j] / rhs[i][i];
			 }
		  }
	   }
	   var  coeffs = [];
	   for (j = n - 1; j >= 0; j--) {
		  tmp = 0;
		  for (k = j + 1; k < n; k++)
			 tmp += rhs[k][j] * coeffs[k];
		  coeffs[j] = (rhs[n][j] - tmp) / rhs[j][j];
	   }
	   fit = [];
		for (var i = 0; i < x.length; i++) {
			fit[i] = 0;
			for (var w = 0; w < coeffs.length; w++) {
				fit[i] += coeffs[w] * Math.pow(x[i], w);
			}
		 }
		var sum_x = 0;
		var sum_y = 0;
		var sum_xx = 0;
		//var sum_xy = 0;
		var sum_yy = 0;
		var sum_ff = 0;
		for (var i = 0;i<x.length;i++){
			sum_x += x[i];
			sum_xx += x[i]*x[i];
			sum_y += y[i];
			//sum_xy +=x[i]*y[i];
			sum_yy +=y[i]*y[i];
		}
		var y_mean = sum_y/x.length;
		var ss_reg = 0;
		var ss_res = 0;
		for (var i = 0;i<x.length;i++){
			ss_reg += (fit[i] - y_mean)*(fit[i] - y_mean);
			ss_res += (fit[i] - y[i])*(fit[i] - y[i]);
		}
		
		var n = x.length;
		var ss_tot = sum_yy - sum_y*sum_y/n;
		var ss_reg = sum_ff;
		var r_squared = 1-ss_res/ss_tot;
		var squared = String.fromCharCode( 178 ); //σ²
		var string2 = '';
		var string3 = '';
		
		if (coeffs.length>4){
		for(var i = coeffs.length-1; i >= 4; i--){
		  if(i > 1) string2 += mjs_precision(coeffs[i],4)+ 'x^' + i + ' + ';
		  else if (i == 1) string2 += mjs_precision(coeffs[i],4) + 'x' + ' + ';
		  else string2 += mjs_precision(coeffs[i],4);
		}
		for(; i >= 0; i--){
		  if(i > 1) string3 += mjs_precision(coeffs[i],4)+ 'x^' + i + ' + ';
		  else if (i == 1) string3 += mjs_precision(coeffs[i],4) + 'x' + ' + ';
		  else string3 += mjs_precision(coeffs[i],4);
		}
		} else {
		for(var i = coeffs.length-1; i >= 0; i--){
		  if(i > 1) string2 += mjs_precision(coeffs[i],4)+ 'x^' + i + ' + ';
		  else if (i == 1) string2 += mjs_precision(coeffs[i],4) + 'x' + ' + ';
		  else string2 += mjs_precision(coeffs[i],4);
		}
		}
		
		string1 = 'r'+squared+' = ' + number_quote(r_squared,1-r_squared);
		//return coeffs;
		return {parameters: coeffs, strings: [string1,string2,string3],fun:fits.polyn_fun};
	},
	log_fun : function(x,params){
		var y = [];
		for (var i = 0; i < x.length; i++) {
			y.push( params[0] + params[1]*Math.log(x[i] ));
		}
		return y;
	},
	log : function(ox,oy){
		//protect against negative x
		var x = [];
		var y = [];
		for (var i=0; i<ox.length;i++){
			if ( ox[i] > 0 ){
				x.push(ox[i]);
				y.push(oy[i]);
			}
		}
		var S_lx = 0;
		var S_ylx = 0;
		var S_y = 0;
		var S_lxlx=0;
		var l = x.length;
		for (n=0; n < l; n++) {
			S_lx += Math.log(x[n]);
			S_ylx += y[n] * Math.log(x[n]);
			S_y += y[n];
			S_lxlx += Math.pow(Math.log(x[n]), 2);
		}

		var B = (n * S_ylx - S_y * S_lx) / (n * S_lxlx - S_lx * S_lx);
		var A = (S_y - B * S_lx) / n;

		var string = 'y=' + mjs_precision(A,4) + ' + ' + mjs_precision(B,4) + ' ln(x)';

		return {parameters: [A, B], strings: [string,'',''], fun:fits.log_fun};
	},
	power_plus_c_fun : function(x,params){
		var y = [];
		for (var i=0;i<x.length;i++){
			y.push(  params[0] + params[1]*Math.pow(x[i],params[2]) );
		}
		return y;
	},
	power_plus_c : function(x,y){
		var nx = [];
		var ny = [];
		for (var i=0; i<x.length;i++){
			xi = Math.log(x[i]);
			if (isFinite(xi)){
				nx.push(xi);
				ny.push(y[i]);
			}
		}
		var r = fits.exponential_plus_c(nx,ny);
		var string = 'y = ' + mjs_precision(r.parameters[0],5) + '+'+mjs_precision(r.parameters[1],5)+'x^' + mjs_precision(r.parameters[2],5);
		r.strings = [string,'',''];
		r.fun = fits.power_plus_c_fun;
		return r
		
	},
	power_fun : function(x,params){
		var y = [];
		for (var i = 0; i < x.length; i++) {
			y.push( params[0] *Math.pow(x[i] , params[1] )   );
		}
		return y;
	},
	power : function(ox,oy){
		var x = [];
		var y = [];
		for (var i=0; i<ox.length;i++){
			if ( ox[i] > 0 && oy[i] >0){
				x.push(ox[i]);
				y.push(oy[i]);
			}
		}
		var l = x.length
		var S_lx = 0;
		var  S_lylx = 0;
		var S_ly = 0;
		var S_lxlx = 0;
		for (var i=0; i < l; i++) {
			S_lx += Math.log(x[i]);
			S_lylx += Math.log(y[i]) * Math.log(x[i]);
			S_ly += Math.log(y[i]);
			S_lxlx += Math.pow(Math.log(x[i]), 2);
		}
		var B = (l * S_lylx - S_ly * S_lx) / (l * S_lxlx - S_lx * S_lx);
		var A = Math.pow(Math.E, (S_ly - B * S_lx) / l);
		var string = 'y=' + mjs_precision(A,4)+ 'x^' + mjs_precision(B,4);
		return {parameters: [A, B], strings: [string,'',''], fun:fits.power_fun};
	},
	pre_fit_normalizing : function(x){
		//var s = series_stats(x,x);
		var s = online_variance(x); // to avoid castrophic cancellation.
		// https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Na.C3.AFve_algorithm
		var x_primed = clone(x);
		for (var i = 0;i<x.length;i++){
			x_primed[i] = (x[i] - s.mean)/s.sigma;
		}
		var string1 = "normalized (x-" + s.mean.toFixed()+")/"+s.sigma.toFixed();
		return {x:x_primed,s:string1,x_mean:s.mean,sigma_x:s.sigma}
	},
	post_fit_normalizing : function(x,normalised){
		var x_primed = clone(x);
		for (var i = 0;i<x.length;i++){
			x_primed[i] = (x[i] - normalised.x_mean)/normalised.sigma_x;
		}
		return x_primed
	}
}
fits.fit_strings = ['exp','exp_c','linear','quad', 'cubic','poly4','poly5','poly6','poly7','const','log','power','power_c','gauss'];
fits.fit_funs = [fits.exponential,fits.exponential_plus_c,fits.linear,fits.poly2,fits.poly3,fits.poly4,fits.poly5,fits.poly6,fits.poly7,fits.constant,fits.log,fits.power,fits.power_plus_c,fits.gauss];
			
function mjs_precision(number,precision){
	if (! isFinite(number)){return  'Nan';}
	if (! isFinite(precision)){return ''+number} //a hell mary aproach of just hoping that it will be ok.
	precision = trim(precision,1,21);
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

function number_quote(number,error){
	//returns a string which would be correct to quote to the given error.
	// assuming that error is given to 2 sig fig.
	if (! isFinite(error)){error = 1e-20;}
	if (! isFinite(number)){number = 0;}
	return mjs_precision(number, Math.max(2,Math.floor(Math.log10(Math.abs(number))) -   Math.floor(Math.log10(Math.abs(error))) + 2) );
}

function drawEllipse(graph,ctx, centerX, centerY, radiusX, radiusY) {
	ctx.beginPath();
	
	var rotationAngle = 0.5;
	
	for (var i = 0 * Math.PI; i < 2 * Math.PI; i += 0.01 ) {
		var xPos = centerX - (radiusX * Math.sin(i)) * Math.sin(rotationAngle * Math.PI) + (radiusY * Math.cos(i)) * Math.cos(rotationAngle * Math.PI);
		var yPos = centerY + (radiusY * Math.cos(i)) * Math.sin(rotationAngle * Math.PI) + (radiusX * Math.sin(i)) * Math.cos(rotationAngle * Math.PI);
		if (i == 0) {
			ctx.moveTo(graph.units_to_pixels(xPos,'x'),graph.units_to_pixels(yPos,'y') );
		} else {
			ctx.lineTo(graph.units_to_pixels(xPos,'x'),graph.units_to_pixels(yPos,'y'));
		}
	}
	ctx.stroke();
}

function mouse_move_event(event,graph){
	graph.ui.latestEvent = event;
	mjs_plot.activeGraph = graph;
	if(!graph.ui.ticking) {
		graph.ui.ticking = true;
		requestAnimationFrame( function(){mouse_move_event_shim(graph.ui.latestEvent,graph);} );
		//setTimeout(function(){mouse_move_event_shim(graph.ui.latestEvent,graph);}, 10);
	}
}

function mouse_move_event_shim(event,graph){
	var start_time = new Date();
	mouse_move_event_actual(event,graph);
	var end_time = new Date();
	graph.ui.copy_time=end_time.getTime() - start_time.getTime();
	graph.ui.ticking=false;
}

function getClosestDataPointToX(graph,series,x){
	var pj = 0;// index in the series. 
	var best_dist = 1e200; 
	var best_dist = 1e200;
	for (j = 0;j<graph.data[series][0].length;j++){
		dist = Math.abs(graph.data[series][0][j]-x,2);
		if (dist < best_dist){
			best_dist = dist;
			pj = j;
		}
	}
	return pj;
}

function measureDeltaString(graph,delta,axis){
	var mode = axis === 'x' ? graph.graphics_style.x_scale_mode : graph.graphics_style.y_scale_mode; 
	return 	mode === 'time' ? mjs_time_difference_print(delta) : graph.get_axis_string(delta,axis);
}

function measureGradString(graph,grad){
	var unit = '';
	var p = Math.min(graph.graphics_style.y_precision,graph.graphics_style.x_precision);
	if ( (graph.graphics_style.y_scale_mode === 'lin' || graph.graphics_style.y_scale_mode === 'log' ) && graph.graphics_style.x_scale_mode === 'time'){
		unit = '/ms';
		if (Math.abs(grad)<1){grad*=1000; unit='/s';}
		if (Math.abs(grad)<1){grad*=60; unit='/m';}
		if (Math.abs(grad)<1){grad*=60; unit='/h';}
		if (Math.abs(grad)<1){grad*=24; unit='/d';}
		grad = mjs_precision(grad,p+1)+unit;
	}
	else {	
		grad = mjs_precision(grad, p+1)+unit;
	}
	return grad
}

function roundRectQuad(ctx,x,y,w,h,r) {
   if (!Array.isArray(r)){
      r = Math.abs(r);
      r = Math.min(r,Math.min(w/2,h/2));
      r = [r,r,r,r];
   } else {
      for (var i =0;i<4;i++){r[i] =  Math.min(Math.abs(r[i]),Math.min(w/2,h/2)) || 0;}
   }
   var tpi = 2*Math.PI;
   ctx.beginPath();
   ctx.moveTo(x+r[0],y);
   ctx.lineTo(x+w-r[1],y);
   ctx.quadraticCurveTo(x+w,y,x+w,y+r[1]);
   ctx.lineTo(x+w,y+h-r[2]);
   ctx.quadraticCurveTo(x+w,y+h,x+w-r[2],y+h);
   ctx.lineTo(x+r[3],y+h);
   ctx.quadraticCurveTo(x,y+h,x,y+h-r[3]);
   ctx.lineTo(x,y+r[0]);
   ctx.quadraticCurveTo(x,y,x+r[0],y);
   ctx.closePath();
}

function mouse_move_event_actual(event,graph){
	
	var gs = graph.graphics_style;
	if (gs.interactivity === 'none'){ return }
	
	var canvas = graph.canvas;
	var ctx = canvas.getContext('2d');
	
	//ctx.stroke();
	var rect = canvas.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	if (mjs_plot.CTRL){
		var n = modify_for_grid_snap(graph,x,y);
		x = n.rx;
		y = n.ry;
	}
	var px = graph.pixels_to_units(x,'x');
	var py = graph.pixels_to_units(y,'y');
	
	if (graph.graph_image){
		ctx.putImageData(graph.graph_image,0,0);
	} else {
		return;
	}
	
	if (graph.ui.touch){
		var edge = 	Math.min(Math.min(canvas.width / 22, canvas.height/15));
	} else {
		var edge = 	Math.min(gs.tick_labels_font_size/0.55 * gs.scaling_factor,Math.min(canvas.width / 22, canvas.height/15));
	}
	graph.ui.size = edge;
	var cs = edge/4;
	ctx.font = (0.55*edge) + 'px ' + gs.font_name;//"24px Courier New";
	if (DEBUGG_FPS){
		ctx.fillText('fps: '+ (1/graph.ui.copy_time*1000),30,30);
	}
	
	
	
	//if there is any menue being drawn on screen currentlly.
	var anymenu = graph.drawStylemenu || graph.drawymenu || graph.drawxmenu || graph.drawmarkermenu || graph.drawgraphmenu
		|| graph.drawFontMenu || graph.drawexportmenu || graph.drawcaptionmenu || graph.drawfxmenu || graph.drawtimemenu
		|| graph.drawlinemenu || graph.drawfitsmenu || graph.drawmodemenu || graph.drawinlinecolormenu;// || y<edge || canvas.height-y < edge;
		
	graph.ui.anymenu = anymenu;
	
	if (mouse_down == false){
		
		ctx.textAlign="left";
		//not at the very edges draw interactive stuff
		ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
 		ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg); 
		//do the mouse modes
		if ( !anymenu &&  x>edge && y>edge && canvas.height-y > edge && canvas.width-x > edge ){
			if (gs.mouse_mode === 'zoom'){
				ctx.beginPath();
				ctx.arc(x, y, cs , 0 ,Math.PI*2, true);
				ctx.stroke();
			}
			
			if (gs.mouse_mode === 'zoom' || gs.mouse_mode === 'drag' || gs.mouse_mode === 'measure' ){
				
				var labelx = graph.get_axis_string(px,'x');
				var labelxWidth = ctx.measureText(labelx).width;
				var labely = graph.get_axis_string(py,'y');
				
				lw = labely.length * gs.scaling_factor*gs.axis_labels_font_size;
				
				if (graph.ui.touch && graph.ui.is_touching ){
					ctx.fillText(labelx,Math.min(x+cs, canvas.width-edge-labelxWidth), canvas.height-2*edge );
					ctx.fillText(labely,2*edge,y-cs);
				} else {
					ctx.fillText(labelx,Math.min(x+cs, canvas.width-edge-labelxWidth), Math.min(y+2*cs+2*edge,canvas.height-2*edge) );
					ctx.fillText(labely,Math.max(x-2*cs-lw-2*edge,2*edge),Math.max(y-cs,gs.scaling_factor*gs.axis_labels_font_size+edge));
				}
				
				ctx.beginPath();
				ctx.moveTo(x,y+edge);
				ctx.lineTo(x,canvas.height );
				ctx.moveTo(x,y-edge);
				ctx.lineTo(x,0);
				ctx.moveTo(x-edge,y);
				ctx.lineTo(0,y);
				ctx.moveTo(x+edge,y);
				ctx.lineTo(canvas.width,y);
				ctx.stroke();
				ctx.beginPath();
				ctx.stroke();
			}
			
			if (gs.mouse_mode === 'trim'){
				ctx.fillText('trim',x+cs*2,y-cs*2);
				ctx.beginPath();
				ctx.moveTo(x,0);
				ctx.lineTo(x,canvas.height);
				ctx.moveTo(0,y);
				ctx.lineTo(canvas.width,y);
				ctx.stroke();
			}
			if (gs.mouse_mode === 'cut'){
				ctx.fillText('cut',x+cs*2,y-cs*2);
				ctx.beginPath();
				ctx.moveTo(x,0);
				ctx.lineTo(x,canvas.height);
				ctx.moveTo(0,y);
				ctx.lineTo(canvas.width,y);
				ctx.stroke();
			}
			if (gs.mouse_mode === 'sublin'){
				ctx.fillText('draw a line to subtract',x+cs*2,y-cs*2);
			}
			if (gs.mouse_mode === 'x-c'){
				label = graph.get_axis_string(px,'x');
				ctx.fillText('x-'+label,x+cs*2,y-cs*2);
				ctx.beginPath();
				ctx.moveTo(x,0);
				ctx.lineTo(x,canvas.height);
				ctx.stroke();
			}
			if (gs.mouse_mode === 'y-c'){
				label = graph.get_axis_string(py,'y');
				ctx.fillText('y-'+label,x+cs*2,y-cs*2);
				ctx.beginPath();
				ctx.moveTo(0,y);
				ctx.lineTo(canvas.width,y);
				ctx.stroke();
			}
			
			if (gs.mouse_mode === 'add1ptmarker' || gs.mouse_mode === 'add2ptmarker'){
				ctx.beginPath();
				ctx.moveTo(0,y);
				ctx.lineTo(canvas.width,y);
				ctx.moveTo(x,0);
				ctx.lineTo(x,canvas.height);
				ctx.stroke();
			}
			if (gs.mouse_mode === 'add1ptmarker'){
				markerDrawing[graph.ui.addMarker](graph,canvas,ctx,graph.ui.addMarkerText,[[x,y]],0.55*edge);
			}
			
			if (gs.mouse_mode === 'removeMarker' ||
			gs.mouse_mode === 'markeredit' ||
			gs.mouse_mode === 'markerRecolor' ||
			gs.mouse_mode === 'markerStroke' ||
			gs.mouse_mode === 'markerFont' ||
			gs.mouse_mode === 'markerSwap'){
				for (var i=0;i<gs.markers.length;i++){
					var m = gs.markers[i];
					ctx.beginPath();
					ctx.arc(graph.units_to_pixels(m.x,'x'), graph.units_to_pixels(m.y,'y'), cs , 0 ,Math.PI*2, true);
					ctx.stroke();
				}
			}
			if (gs.mouse_mode === 'removeMarker' ){ctx.fillText('  click to remove' ,x+cs,y+cs);}
			if (gs.mouse_mode === 'markeredit' ){ctx.fillText('  click to edit text' ,x+cs,y+cs);}
			
			if (gs.mouse_mode === 'markerRecolor' ){ctx.fillText('  click to edit color' ,x+cs,y+cs);}
			if (gs.mouse_mode === 'markerFont' ){ctx.fillText('  click to edit font' ,x+cs,y+cs);}
			if (gs.mouse_mode === 'markerStroke' ){ctx.fillText('  click to edit stroke' ,x+cs,y+cs);}
			
			
			if (gs.mouse_mode === 'mouse'){
				//go through all the handles of a marker to see if any are near the curser.
				// if any are, draw all the handles. 
				var m,mx,my,near;
				for (var i=0;i<gs.markers.length;i++){
					m = gs.markers[i];
					near = false;
					for (var j=0;j<m.handles.length;j++){
						mx = graph.units_to_pixels(m.handles[j][0],'x');
						my = graph.units_to_pixels(m.handles[j][1],'y');
						if (Math.sqrt(Math.pow(x-mx,2)+Math.pow(y-my,2)) < 5*cs ){
							near = true;
						}
					}
					mx = graph.units_to_pixels(m.x,'x');
					my = graph.units_to_pixels(m.y,'y');
					if (Math.sqrt(Math.pow(x-mx,2)+Math.pow(y-my,2)) < 5*cs ){
						near = true;
					}
					if (near){
						ctx.beginPath();
						ctx.arc(mx, my, cs , 0 ,Math.PI*2, true);
						ctx.stroke();
						for (var j=0;j<m.handles.length;j++){
							mx = graph.units_to_pixels(m.handles[j][0],'x');
							my = graph.units_to_pixels(m.handles[j][1],'y');
							ctx.beginPath();
							ctx.arc(mx, my, cs , 0 ,Math.PI*2, true);
							ctx.stroke();
						}
						
						
					}
				}
				
				
				//fit text handle
				if (gs.fits !== 'none'){
					ctx.beginPath();
					ctx.arc(gs.fit_text_position.x*canvas.width, gs.fit_text_position.y*canvas.height, cs , 0 ,Math.PI*2, true);
					ctx.stroke();
				}
				//title spacing handle
				ctx.beginPath();
				var title_y = (gs.tick_len+gs.title_spacing+gs.title_font_size)*gs.scaling_factor;
				ctx.arc(canvas.width/2, title_y, cs , 0 ,Math.PI*2, true);
				ctx.stroke();
				if (gs.show_captions>0){
						//there are captions visable
					//caption position handle
					var cap_x = gs.scaling_factor*gs.caption_position.x;
					if (gs.caption_position.x>0){
						cap_x += gs.scaling_factor*gs.tick_len;
					} else {
						cap_x = canvas.width + cap_x;
						cap_x -= gs.scaling_factor*gs.tick_len;
					}
					cap_y = gs.scaling_factor*gs.caption_position.y;
					if (gs.caption_position.y>0){
						//going down from top
						cap_y += gs.scaling_factor*gs.tick_len;
					} else {
						//up from botton
						cap_y = canvas.height + cap_y;
						cap_y -= gs.scaling_factor*gs.tick_len;
					}
					ctx.beginPath();
					ctx.arc(cap_x, cap_y, cs , 0 ,Math.PI*2, true);
					ctx.stroke();
				}
				
			}
			ctx.beginPath();
			ctx.stroke();
			
			if (gs.mouse_mode === 'measure'){
				//measure mode
				ctx.beginPath();
				ctx.moveTo(x-cs,y-cs);
				ctx.lineTo(x+cs,y+cs);
				ctx.moveTo(x-cs,y+cs);
				ctx.lineTo(x+cs,y-cs);
				ctx.stroke();
				ctx.beginPath();
				ctx.stroke();
			}
			if (gs.mouse_mode === 'drag'){
				//center lines
				drag_x = x-0.5*edge;
				drag_y = y-0.5*edge;
				ctx.beginPath();
				ctx.moveTo(drag_x+edge*0.2,drag_y+edge*0.5);
				ctx.lineTo(drag_x+edge*0.8,drag_y+edge*0.5);
				ctx.moveTo(drag_x+edge*0.5,drag_y+edge*0.2);
				ctx.lineTo(drag_x+edge*0.5,drag_y+edge*0.8);
				//diagonals
				ctx.moveTo(drag_x+edge*0.2,drag_y+edge*0.5);
				ctx.lineTo(drag_x+edge*0.3,drag_y+edge*0.6);
				ctx.moveTo(drag_x+edge*0.2,drag_y+edge*0.5);
				ctx.lineTo(drag_x+edge*0.3,drag_y+edge*0.4);
				
				ctx.moveTo(drag_x+edge*0.8,drag_y+edge*0.5);
				ctx.lineTo(drag_x+edge*0.7,drag_y+edge*0.6);
				ctx.moveTo(drag_x+edge*0.8,drag_y+edge*0.5);
				ctx.lineTo(drag_x+edge*0.7,drag_y+edge*0.4);
				
				ctx.moveTo(drag_x+edge*0.5,drag_y+edge*0.2);
				ctx.lineTo(drag_x+edge*0.4,drag_y+edge*0.3);
				ctx.moveTo(drag_x+edge*0.5,drag_y+edge*0.2);
				ctx.lineTo(drag_x+edge*0.6,drag_y+edge*0.3);
				
				ctx.moveTo(drag_x+edge*0.5,drag_y+edge*0.8);
				ctx.lineTo(drag_x+edge*0.4,drag_y+edge*0.7);
				ctx.moveTo(drag_x+edge*0.5,drag_y+edge*0.8);
				ctx.lineTo(drag_x+edge*0.6,drag_y+edge*0.7);
				
				ctx.stroke();
				
				ctx.beginPath();
				ctx.stroke();
			}
			
			
			if (gs.mouse_mode === 'hreader'){
				//read the points from the graph, in a vertical line
				
				var dist = 1e200;
				var labelWidth=0;
				var fliplabel =1;
				var lx,ly;
				var lb = 0.55*edge;
				var pj=0;
				
				if (gs.hreader_mode === "vertical"){
					ctx.beginPath();
					ctx.moveTo(x,0);
					ctx.lineTo(x,canvas.height);
					ctx.stroke();
					var labelsToDraw = []; // need to record the positions of the drawn labels so that new labels don't overlap. 
					// each label has target in pixels {x:x,y:y,color:color,label:label}
					// we will take care of the positioning and label flipping afterwards.
					// the x and y is the pixel targets for the labels. 
					 for (i = 0;i<graph.data.length;i++){
						 
						pj = getClosestDataPointToX(graph,i,graph.pixels_to_units(x,'x'));
						label = graph.get_axis_string(graph.data[i][1][pj],'y')+ ' : ' + graph.captions[i];
						
						labelsToDraw.push({x:graph.units_to_pixels(graph.data[i][0][pj],'x'),
											y:graph.units_to_pixels(graph.data[i][1][pj],'y'),
											color:graph.colors[i],
											label:graph.get_axis_string(graph.data[i][1][pj],'y')+ ' : ' + graph.captions[i]
											})
					}
					
					// use a tiny physics simulation to 'ease' the labels to not overlap.
					
					var sumforce = 1;
					var f = 0;
					var loops = 0;
					//initialise the drawn y position to the requested position. the arrow will point to y, but the label drawn at ly.
					for (var i=0;i<labelsToDraw.length;i++){
						labelsToDraw[i]['ly'] = labelsToDraw[i]['y'];
						labelsToDraw[i]['f'] = 0;
					}
					//physics 'main' loop. repeat until stopped moving or 5 loops
					while (loops < 20 && sumforce > 0){
						sumforce =0;
						loops++;
						//calculate all inter-label forces.
						for (var i=0;i<labelsToDraw.length;i++){
							for (var j=i+1;j<labelsToDraw.length;j++){
								//check between i and j
								var d =  labelsToDraw[i]['ly'] - labelsToDraw[j]['ly']; // distance between adjecent labels
								if (d == 0){ d = 1}; //give it a pixel sized push to seperate idintical points.
								if ( Math.abs(d) < 2.5*lb){
									f =  Math.min( lb,Math.max( -1 * lb,lb*lb/d));
									sumforce += Math.abs(f);
									labelsToDraw[i]['f'] += f;
									labelsToDraw[j]['f'] -= f;
								}
							}
						}
						//move and reset forces
						for (var i=0;i<labelsToDraw.length;i++){
							labelsToDraw[i]['ly'] += labelsToDraw[i]['f'];
							
							labelsToDraw[i]['f'] = 0;
						}
					}
					//all the labels should be seperated.
					for (var i=0;i<labelsToDraw.length;i++){
						var l = labelsToDraw[i];
						if (l.y < 0 || l.y > canvas.height) {continue; }
						
						labelWidth = ctx.measureText(l.label).width;
						fliplabel = 1;
						if (labelWidth +edge+2*lb > canvas.width-l.x){
							fliplabel=-1;
						}
						ctx.beginPath()
						ctx.arc(l.x,l.y,  Math.max( gs.symbol_size*gs.scaling_factor*0.626, gs.scaling_factor*gs.line_thickness*0.8, 4 )  ,0,Math.PI*2,false);
						ctx.stroke();
						ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
						ctx.beginPath();
						ctx.moveTo(l.x,l.y);
						ctx.lineTo(l.x+fliplabel*lb,l.ly-lb);
						ctx.lineTo(l.x+fliplabel*(2*lb+labelWidth),l.ly-lb);
						ctx.lineTo(l.x+fliplabel*(2*lb+labelWidth),l.ly+lb);
						ctx.lineTo(l.x+fliplabel*(lb),l.ly+lb);
						ctx.closePath();
						ctx.fill();
						ctx.stroke();
						//ctx.fillStyle = gs.color_fg;
						ctx.fillStyle = renderColor(canvas,ctx,l.color);
						if (fliplabel>0){		
							ctx.fillText(l.label,l.x+1.5*lb,l.ly+lb/2);
						} else {
							ctx.fillText(l.label,l.x-1.5*lb-labelWidth,l.ly+lb/2);
						}
					}
					
					
					
					
					label = graph.get_axis_string(px,'x');			
					labelWidth = ctx.measureText(label).width;
					ctx.beginPath();
					ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
					ctx.rect(x-0.5*labelWidth-0.5*lb, canvas.height-0.5*edge - 1.5*lb, labelWidth + lb, 2*lb );
					ctx.rect(x-0.5*labelWidth-0.5*lb, 0.5*edge -0.5*lb, labelWidth + lb, 2*lb );
					
					ctx.fill();
					ctx.stroke();
					ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
					ctx.fillText(label,x - labelWidth/2,  canvas.height-0.5*edge  );
					ctx.fillText(label,x - labelWidth/2,  0.5*edge +lb );
					ctx.beginPath();
				}
				
				if (gs.hreader_mode === 'boxed'){
					ctx.beginPath();
					ctx.moveTo(x,0);
					ctx.lineTo(x,canvas.height);
					ctx.stroke();
					var longestLabelWidth = 0;
					var labels = [];
					label = graph.get_axis_string(px,'x');	
					labelWidth = ctx.measureText(label).width;
					longestLabelWidth = Math.max(longestLabelWidth,ctx.measureText(label).width);
					labels.push(label);
					for (i = 0;i<graph.data.length;i++){
						pj = getClosestDataPointToX(graph,i,graph.pixels_to_units(x,'x'));
						lx = graph.units_to_pixels(graph.data[i][0][pj],'x');
						ly = graph.units_to_pixels(graph.data[i][1][pj],'y');
						ctx.beginPath();
						ctx.arc(lx,ly,lb/2,0,Math.PI*2,false);
						ctx.stroke();
						label = graph.captions[i] + ' : ' + graph.get_axis_string(graph.data[i][1][pj],'y');
						longestLabelWidth = Math.max(longestLabelWidth,ctx.measureText(label).width);
						labels.push(label);
						
					}
					var shift = labels.length * 2 * lb *   (  y/canvas.height  ) - lb  ;
					fliplabel = canvas.width - x < longestLabelWidth + 4*lb ? longestLabelWidth+4*lb : 0;
					
					
					
					ctx.beginPath();
					ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
					ctx.rect(x+lb - fliplabel , canvas.height-(y-shift-2*lb) - labels.length*2*lb-lb-lb ,longestLabelWidth+2*lb, labels.length*2*lb+lb);
					ctx.fill();
					ctx.stroke();
					ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
					ctx.fillText(labels[0],x+2*lb - fliplabel,canvas.height-( y - shift));
					labels.shift();
					for (i = 0;i<labels.length;i++){
						ctx.fillStyle = renderColor(canvas,ctx,graph.colors[i]);
						ctx.fillText(labels[i],x+2*lb - fliplabel, canvas.height-( y + (1+i)*2*lb - shift));
					}
					
					
				}
			}
			
			if (gs.mouse_mode === 'reader'){
				var pi = graph.reader_index[0];
				var pj = graph.reader_index[1];
				var xi = graph.units_to_pixels(graph.data[pi][0][pj],'x');
				var yi = graph.units_to_pixels(graph.data[pi][1][pj],'y');
				var dy = gs.axis_labels_font_size*1.6;
				var ly = y - dy;
				var old_line_width = ctx.lineWidth;
				
				ctx.beginPath();
				ctx.moveTo(xi,yi);
				ctx.lineTo(x,y);
				ctx.arc(x,y, edge*0.3*0.8 , 0 ,Math.PI*2, true);
				ctx.moveTo(x,y-edge*.3);
				ctx.lineTo(x,y+edge*.3);
				ctx.moveTo(x+edge*0.3,y);
				ctx.lineTo(x-edge*0.3,y);
				ctx.stroke();
				
				ctx.strokeStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.lineWidth =  gs.scaling_factor*gs.axis_labels_font_size/3;
				
				label = graph.captions[pi];
				ctx.strokeText(label,x+2*cs,ly);
				ctx.fillText(label,x+2*cs,ly);
				ly+=dy;
				
				
				if (gs.x_scale_mode ==='lin' || gs.x_scale_mode ==='log'){
					label= mjs_precision(graph.data[pi][0][pj],gs.x_precision+5);
				}
				if (gs.x_scale_mode ==='time'){
					label= mjs_date_print(graph.data[pi][0][pj],0,8);
				}
				label='x:'+label;
				ctx.strokeText(label,x+2*cs,ly);
				ctx.fillText(label,x+2*cs,ly);
				ly+=dy;
				
				if (gs.y_scale_mode ==='lin' || gs.y_scale_mode ==='log'){
					label= mjs_precision(graph.data[pi][1][pj],gs.y_precision+5);
				}
				if (gs.y_scale_mode ==='time'){
					label= mjs_date_print(graph.data[pi][1][pj],0,8);
				}
				label='y:'+label;
				ctx.strokeText(label,x+2*cs,ly);
				ctx.fillText(label,x+2*cs,ly);
				ly+=dy;
				var grad = (graph.data[pi][1][Math.min(pj+1,graph.data[pi][1].length-1)] - graph.data[pi][1][Math.max(pj-1,0)]) /
				(graph.data[pi][0][Math.min(pj+1,graph.data[pi][0].length-1)] - graph.data[pi][0][Math.max(pj-1,0)]);  
				
				label = measureGradString(graph,grad);
				label='g:'+label;
				ctx.strokeText(label,x+2*cs,ly);
				ctx.fillText(label,x+2*cs,ly);
				ly+=dy;
				
				label = 'i='+pj;//the index of the data point in the series.
								//called j internally, as i if for which series. 
				ctx.strokeText(label,x+2*cs,ly);
				ctx.fillText(label,x+2*cs,ly);
				ly+=dy;
				
				ctx.lineWidth = old_line_width;
				ctx.strokeStyle = gs.color_fg;
			}
		}
		
		ctx.beginPath();
		
		if (gs.interactivity === 'view' && y < edge){ //show the edit button.
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.beginPath();
			ctx.rect(0,0,edge*5,edge);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			ctx.fillText("Edit Graph",0.2*edge,0.8*edge);
		};
		
		if (gs.interactivity !== 'full' ){return};
		// draw some buttons.... top edge
		if (y<edge){
			
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			
			ctx.beginPath();
			ctx.rect(0,0,edge*4,edge);
			ctx.rect(4*edge,0,edge*4,edge);
			ctx.rect(14*edge,0,edge*3,edge);
			ctx.rect(canvas.width-5*edge,0,edge*3,edge);
			ctx.fill();
			ctx.stroke();
			
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			
			ctx.beginPath();
			ctx.fillText("symbol/line",0.2*edge,0.8*edge);
			ctx.fillText("Graph",4.2*edge,0.8*edge);
			ctx.fillText("Style",canvas.width-4.8*edge,0.8*edge);
			ctx.fillText("Markers",14.2*edge,0.8*edge);
			
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			
			
			//hreader mode
			ctx.rect(edge*8,0,edge,edge);
			ctx.fill();
			ctx.stroke();
			
			
			
			//mouse mode to drag button
			ctx.rect(edge*9,0,edge,edge);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			//hreader
			ctx.moveTo(edge*8.3,edge*0.2);
			ctx.lineTo(edge*8.3,edge*0.8);
			ctx.moveTo(edge*8.3,edge*0.2);
			ctx.lineTo(edge*8.6,edge*0.2);
			ctx.moveTo(edge*8.3,edge*0.5);
			ctx.lineTo(edge*8.6,edge*0.5);
			ctx.moveTo(edge*8.3,edge*0.8);
			ctx.lineTo(edge*8.6,edge*0.8);
			
			//center lines
			ctx.moveTo(edge*9.2,edge*0.5);
			ctx.lineTo(edge*9.8,edge*0.5);
			ctx.moveTo(edge*9.5,edge*0.2);
			ctx.lineTo(edge*9.5,edge*0.8);
			//diagonals
			ctx.moveTo(edge*9.2,edge*0.5);
			ctx.lineTo(edge*9.3,edge*0.6);
			ctx.moveTo(edge*9.2,edge*0.5);
			ctx.lineTo(edge*9.3,edge*0.4);
			
			ctx.moveTo(edge*9.8,edge*0.5);
			ctx.lineTo(edge*9.7,edge*0.6);
			ctx.moveTo(edge*9.8,edge*0.5);
			ctx.lineTo(edge*9.7,edge*0.4);
			
			ctx.moveTo(edge*9.5,edge*0.2);
			ctx.lineTo(edge*9.4,edge*0.3);
			ctx.moveTo(edge*9.5,edge*0.2);
			ctx.lineTo(edge*9.6,edge*0.3);
			
			ctx.moveTo(edge*9.5,edge*0.8);
			ctx.lineTo(edge*9.4,edge*0.7);
			ctx.moveTo(edge*9.5,edge*0.8);
			ctx.lineTo(edge*9.6,edge*0.7);
			
			ctx.stroke();
			
			//mouse mode to zoom button
			ctx.rect(edge*10,0,edge,edge);
			ctx.fill();
			ctx.stroke();
			
			ctx.beginPath();
			ctx.arc(edge*10.5, edge*0.5, edge*0.3*0.8 , 0 ,Math.PI*2, true);
			ctx.moveTo(edge*10.4,edge*0.5);
			ctx.lineTo(edge*10.6,edge*0.5);
			ctx.moveTo(edge*10.5,edge*0.4);
			ctx.lineTo(edge*10.5,edge*0.6);
			ctx.moveTo(edge*10.5+edge*0.3*0.8*0.707,edge*0.5+edge*0.3*0.8*0.707);
			ctx.lineTo(edge*10.9,edge*0.9);
			ctx.stroke();
			
			//measure mode
			ctx.rect(edge*11,0,edge,edge);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(edge*11.2,edge*0.8);
			ctx.lineTo(edge*11.8,edge*0.8);
			ctx.lineTo(edge*11.8,edge*0.2);
			ctx.lineTo(edge*11.2,edge*0.8);
			ctx.stroke();
			
			//datareader button
			ctx.rect(edge*12,0,edge,edge);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(edge*12.5, edge*0.5, edge*0.3*0.8 , 0 ,Math.PI*2, true);
			ctx.moveTo(edge*12.5,edge*0.2);
			ctx.lineTo(edge*12.5,edge*0.8);
			ctx.moveTo(edge*12.2,edge*0.5);
			ctx.lineTo(edge*12.8,edge*0.5);
			ctx.stroke();
			
			//hand/mouse button
			ctx.rect(edge*13,0,edge,edge);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(edge*13.3,edge*0.2);
			ctx.lineTo(edge*13.3,edge*0.8);
			ctx.lineTo(edge*13.7,edge*0.6);
			ctx.lineTo(edge*13.3,edge*0.2);

			//show/hide captions button
			ctx.fillStyle =renderColor(canvas,ctx,gs.color_bg);
			ctx.rect(canvas.width-edge,0,edge,edge);
			ctx.rect(canvas.width-edge*2,0,edge,edge);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			//ctx.font = (0.7*edge) + 'px ' + gs.font_name;//"24px Courier New";
			ctx.fillText('c',canvas.width-0.7*edge, edge*0.7);
			
			// infomation button
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			ctx.fillText('i',canvas.width-1.7*edge, edge*0.7);
			
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			//flush the drawing code
			ctx.beginPath();
			ctx.stroke();
		}
		//draw bottom buttons
		if (y>canvas.height-edge){
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.beginPath();
			ctx.rect(0,canvas.height-edge,edge*2,edge);
			
			ctx.rect(2*edge,canvas.height-edge,edge*2,edge);
			ctx.fill();
			ctx.stroke();
			
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			ctx.beginPath();
			ctx.fillText('x',0.2*edge, canvas.height - edge*0.3);
			ctx.fillText('y',2.2*edge, canvas.height - edge*0.3);
			
			//grid button
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.rect(4*edge,canvas.height-edge,edge,edge);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			var lx = 4*edge;
			var ly = canvas.height-edge;
			ctx.moveTo(lx+0.2*edge,ly+0.4*edge);
			ctx.lineTo(lx+0.8*edge,ly+0.4*edge);
			ctx.moveTo(lx+0.2*edge,ly+0.6*edge);
			ctx.lineTo(lx+0.8*edge,ly+0.6*edge);
			ctx.moveTo(lx+0.4*edge,ly+0.2*edge);
			ctx.lineTo(lx+0.4*edge,ly+0.8*edge);
			ctx.moveTo(lx+0.6*edge,ly+0.2*edge);
			ctx.lineTo(lx+0.6*edge,ly+0.8*edge);
			ctx.stroke();
			
			//lin log buttons
			
			ctx.rect(5*edge,canvas.height-edge,edge,edge);
			ctx.fill();
			ctx.stroke();
			ctx.rect(6*edge,canvas.height-edge,edge,edge);
			ctx.fill();
			ctx.stroke();
			ctx.rect(7*edge,canvas.height-edge,edge,edge);
			ctx.fill();
			ctx.stroke();
			
			if (gs.y_scale_mode == 'log'){
				//draw lines showing linear
				ctx.moveTo(5*edge,canvas.height-0.2*edge);
				ctx.lineTo(6*edge,canvas.height-0.2*edge);
				ctx.moveTo(5*edge,canvas.height-0.4*edge);
				ctx.lineTo(6*edge,canvas.height-0.4*edge);
				ctx.moveTo(5*edge,canvas.height-0.6*edge);
				ctx.lineTo(6*edge,canvas.height-0.6*edge);
				ctx.moveTo(5*edge,canvas.height-0.8*edge);
				ctx.lineTo(6*edge,canvas.height-0.8*edge);
			} else {
				//draw log like lines
				ctx.moveTo(5*edge,canvas.height-0.4*edge);
				ctx.lineTo(6*edge,canvas.height-0.4*edge);
				ctx.moveTo(5*edge,canvas.height-0.65*edge);
				ctx.lineTo(6*edge,canvas.height-0.65*edge);
				ctx.moveTo(5*edge,canvas.height-0.8*edge);
				ctx.lineTo(6*edge,canvas.height-0.8*edge);
				ctx.moveTo(5*edge,canvas.height-0.9*edge);
				ctx.lineTo(6*edge,canvas.height-0.9*edge);
			}
			if (gs.x_scale_mode === 'log'){
				ctx.moveTo(6.2*edge,canvas.height);
				ctx.lineTo(6.2*edge,canvas.height-edge);
				ctx.moveTo(6.4*edge,canvas.height);
				ctx.lineTo(6.4*edge,canvas.height-edge);
				ctx.moveTo(6.6*edge,canvas.height);
				ctx.lineTo(6.6*edge,canvas.height-edge);
				ctx.moveTo(6.8*edge,canvas.height);
				ctx.lineTo(6.8*edge,canvas.height-edge);
			} else {
				ctx.moveTo(6.4*edge,canvas.height);
				ctx.lineTo(6.4*edge,canvas.height-edge);
				ctx.moveTo(6.65*edge,canvas.height);
				ctx.lineTo(6.65*edge,canvas.height-edge);
				ctx.moveTo(6.8*edge,canvas.height);
				ctx.lineTo(6.8*edge,canvas.height-edge);
				ctx.moveTo(6.9*edge,canvas.height);
				ctx.lineTo(6.9*edge,canvas.height-edge);
			}
			ctx.stroke();
			//time axis button
			var lx = 7*edge;
			var ly = canvas.height-edge;
			ctx.beginPath();
			ctx.moveTo(lx+0.1*edge,ly+0.6*edge);
			ctx.lineTo(lx+0.1*edge,ly+0.9*edge);
			ctx.lineTo(lx+0.9*edge,ly+0.9*edge);
			ctx.lineTo(lx+0.9*edge,ly+0.6*edge);
			ctx.moveTo(lx+0.5*edge,ly+0.9*edge);
			ctx.lineTo(lx+0.5*edge,ly+0.8*edge);
			
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(lx+0.5*edge,ly+0.4*edge, edge*0.3 , 0 ,Math.PI*2, true);
			ctx.moveTo(lx+0.5*edge,ly+0.2*edge);
			ctx.lineTo(lx+0.5*edge,ly+0.4*edge);
			ctx.lineTo(lx+0.6*edge,ly+0.4*edge);
			ctx.stroke();
			
			//f() button
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.rect(8*edge,canvas.height-edge,edge*3,edge);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			//ctx.font= (0.7*edge) + 'px ' + gs.font_name;//"24px Courier New";
			ctx.fillText('f()',8.2*edge, canvas.height - edge*0.3);
			ctx.stroke();
			
			//line menu button
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.rect(11*edge,canvas.height-edge,edge*4,edge);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			ctx.fillText('lines',11.2*edge, canvas.height - edge*0.3);
			ctx.stroke();
			
			//fits menu button
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.rect(15*edge,canvas.height-edge,edge*4,edge);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			ctx.fillText('fits',15.2*edge, canvas.height - edge*0.3);
			ctx.stroke();
			
			//draw data out button
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.rect(canvas.width-edge,canvas.height-edge,edge,edge);
			//the fullscreen button
			ctx.rect(canvas.width-edge*3,canvas.height-edge,edge,edge);
			ctx.rect(canvas.width-edge*2.8,canvas.height-edge*.8,edge*0.6,edge*0.6);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			ctx.fillText('e',canvas.width-0.7*edge, canvas.height - edge*0.3);
			ctx.stroke();
			
			//draw day/nightmode button
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			ctx.beginPath();
			ctx.rect(canvas.width-2*edge,canvas.height-edge,edge,edge);
			ctx.fill();
			ctx.stroke();
			
			ctx.beginPath();
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.moveTo(canvas.width-2*edge,canvas.height);
			ctx.lineTo(canvas.width-edge-1,canvas.height-edge+1);
			ctx.lineTo(canvas.width-edge-1,canvas.height);
			ctx.closePath();
			ctx.fill();
			
			ctx.beginPath();
			ctx.fill();
			ctx.stroke();
		}
		
		if (graph.drawStylemenu){
			if (x < canvas.width-2*edge && x > canvas.width-10*edge && y < 14*edge){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(canvas.width-10*edge,0,edge*8,edge*14);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				var ly = edge*0.8;
				var dy = -1*edge;
				var lx = canvas.width-10*edge+0.2*edge;
				ctx.textAlign="left";
				ctx.fillText('Style',lx+5*edge, ly);ly-=dy;
				ctx.fillText('Pick Font',lx, ly);
				if (gs.font_name.length <10){
					ctx.fillText(gs.font_name,lx+4*edge, ly);
				} else {
					ctx.fillText(gs.font_name.slice(0,9)+'...',lx+4*edge, ly);
				}
				ly-=dy;
				ctx.fillText('Font Size:',lx, ly);
				ctx.fillText('Title:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('Ticks:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('Axis:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('Spacing:',lx, ly);
				ctx.fillText('Title:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('Ticks:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('Axis:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('Colors:',lx, ly);
				ctx.fillText('FG:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('BG:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('MG:',lx+4*edge, ly);ly-=dy;
				ctx.fillText('Line Width:',lx, ly);ly-=dy;
				ctx.fillText('Tick Len -major:',lx, ly);ly-=dy;
				ctx.fillText('Tick Len -minor:',lx, ly);ly-=dy;
				ly =  edge*2.8;
				ctx.textAlign="center";
				lx = canvas.width-3.5*edge;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
				ctx.fillText('[edit]',lx+0.5*edge, ly);ly-=dy;
				ctx.fillText('[edit]',lx+0.5*edge, ly);ly-=dy;
				ctx.fillText('[edit]',lx+0.5*edge, ly);ly-=dy;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
				ctx.fillText('[-]',lx, ly);ctx.fillText('[+]',lx+edge, ly);ly-=dy;
			} else {
				graph.drawStylemenu = false;
			}
		}
		if (graph.drawxmenu){
			if (x < 12*edge && y > canvas.height - 9*edge){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(0,canvas.height-edge*9,edge*12,edge*9);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle =renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				var ly = canvas.height - edge*0.2;
				var dy = edge;
				var lx = 0.2*edge;
				ctx.textAlign="left";
				ctx.fillText('x:',lx, ly);ly-=dy;
				ctx.fillText('Min:' + graph.get_axis_string(gs.x_manual_min,'x'),lx, ly);ly-=dy;
				ctx.fillText('Max:' + graph.get_axis_string(gs.x_manual_max,'x'),lx, ly);ly-=dy;
				ctx.fillText('Mode:',lx, ly);ly-=dy;
				ctx.fillText('Spacing: ' + mjs_precision(gs.guideWidthx,2) ,lx, ly);ly-=dy;
				ctx.fillText('Style:',lx, ly);ly-=dy;
				ctx.fillText('Set Prefix:',lx, ly);ly-=dy;
				ctx.fillText('Set Postfix:',lx, ly);ly-=dy;
				ctx.fillText('Set Label:',lx, ly);ly-=dy;
				ly = canvas.height - edge*1.2;
				ctx.textAlign="center";
				ctx.fillText('[auto]',6*edge, ly);
				ctx.fillText('[manual]',10*edge, ly);ly-=dy;
				ctx.fillText('[auto]',6*edge, ly);
				ctx.fillText('[manual]',10*edge, ly);ly-=dy;
				ctx.fillText('[lin]',4.5*edge, ly);
				ctx.fillText('[log]',7.5*edge, ly);
				ctx.fillText('[time]',10.5*edge, ly);ly-=dy;
				ctx.fillText('[-]',6*edge, ly);
				ctx.fillText('[+]',10*edge, ly);ly-=dy;
				ctx.fillText('[1200]',5*edge, ly);
				ctx.fillText('[1k2]',7*edge, ly);
				ctx.fillText('[1.2k]',9*edge, ly);
				ctx.fillText('[1.2e3]',11*edge, ly);ly-=dy;
				
				ctx.fillText('"'+gs.x_axis_prefix+'"',8*edge, ly);ly-=dy;
				ctx.fillText('"'+gs.x_axis_postfix+'"',8*edge, ly);ly-=dy;
				ctx.fillText('"'+gs.x_axis_title+'"',8*edge, ly);
				ctx.textAlign="left";
			}else {
				graph.drawxmenu = false;
			}
		}
		if (graph.drawymenu){
			if (x < 14*edge && x>2*edge && y > canvas.height - 9*edge){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(2*edge,canvas.height-edge*9,edge*12,edge*9);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				var ly = canvas.height - edge*0.2;
				var dy = edge;
				var lx = 2.2*edge;
				ctx.textAlign="left";
				ctx.fillText('y:',lx, ly);ly-=dy;
				ctx.fillText('Min:' + graph.get_axis_string(gs.y_manual_min,'y'),lx, ly);ly-=dy;
				ctx.fillText('Max:' + graph.get_axis_string(gs.y_manual_max,'y'),lx, ly);ly-=dy;
				ctx.fillText('Mode:',lx, ly);ly-=dy;
				ctx.fillText('Spacing: ' + mjs_precision(gs.guideWidthy,2) ,lx, ly);ly-=dy;
				ctx.fillText('Style: 1200',lx, ly);ly-=dy;
				ctx.fillText('Set Prefix:',lx, ly);ly-=dy;
				ctx.fillText('Set Postfix:',lx, ly);ly-=dy;
				ctx.fillText('Set Label:',lx, ly);ly-=dy;
				ly = canvas.height - edge*1.2;
				ctx.textAlign="center";
				var lx = 2*edge;
				ctx.fillText('[auto]',lx+6*edge, ly);
				ctx.fillText('[manual]',lx+10*edge, ly);ly-=dy;
				ctx.fillText('[auto]',lx+6*edge, ly);
				ctx.fillText('[manual]',lx+10*edge, ly);ly-=dy;
				ctx.fillText('[lin]',lx+4.5*edge, ly);
				ctx.fillText('[log]',lx+7.5*edge, ly);
				ctx.fillText('[time]',lx+10.5*edge, ly);ly-=dy;
				ctx.fillText('[-]',lx+6*edge, ly);
				ctx.fillText('[+]',lx+10*edge, ly);ly-=dy;
				ctx.fillText(maths_form(1200,2),lx+5*edge, ly);
				ctx.fillText('1k2',lx+7*edge, ly);
				ctx.fillText('1.2k',lx+9*edge, ly);
				ctx.fillText('1.2e3',lx+11*edge, ly);ly-=dy;
				
				ctx.fillText('"'+gs.y_axis_prefix+'"',lx+8*edge, ly);ly-=dy;
				ctx.fillText('"'+gs.y_axis_postfix+'"',lx+8*edge, ly);ly-=dy;
				ctx.fillText('"'+gs.y_axis_title+'"',lx+8*edge, ly);
				ctx.textAlign="left";
			}else {
				graph.drawymenu = false;
			}
		}
		
		if (graph.drawgridmenu){
			if (x < 6*edge && x>2*edge && y > canvas.height - 7*edge){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(2*edge,canvas.height-edge*7,edge*4,edge*6);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				
				/*
				var ly = canvas.height - edge*1.2;
				var dy = edge;
				var lx = 2.2*edge;
				ctx.textAlign="left";
				ctx.fillText('No Vertical Grid',lx, ly);ly-=dy;
				ctx.fillText('Vertical Grid:' ,lx, ly);ly-=dy;
				ctx.fillText('Fine Vertical Grid' ,lx, ly);ly-=dy;
				ctx.fillText('No Horisontal Grid',lx, ly);ly-=dy;
				ctx.fillText('Horisontal Grid',lx, ly);ly-=dy;
				ctx.fillText('Fine Horisontal Grid',lx, ly);ly-=dy;
				
				*/
				
				
				
				var ly = canvas.height - edge*5;
				
				var lx = 4*edge;
				var e = 2*edge;
				var dy = 0.25*e;
				ctx.beginPath();
				
				ctx.rect(e+0.1*edge,canvas.height - 3*edge - gs.show_xgrid * e + 0.1*edge, 1.8*edge,1.8*edge );
				ctx.rect(2*e+0.1*edge,canvas.height - 3*edge - gs.show_ygrid * e + 0.1*edge, 1.8*edge,1.8*edge );
				
				
				for (var i=1;i<4;i++){
					ctx.moveTo( lx-e+i*dy, ly + dy );
					ctx.lineTo( lx-e+i*dy, ly + e - dy );
					ctx.moveTo( lx-e+i*dy, ly - e + dy );
					ctx.lineTo( lx-e+i*dy, ly - dy );
					ctx.moveTo( lx +dy,ly+dy*i);
					ctx.lineTo( lx+e - dy,ly+dy*i);
					ctx.moveTo( lx +dy,ly+dy*i - e);
					ctx.lineTo( lx+e - dy,ly+dy*i - e);
				}
				
				for (var i=1;i<3;i++){
					ctx.moveTo( lx-e+i*dy + dy/2, ly - e + 1.2*dy );
					ctx.lineTo( lx-e+i*dy + dy/2, ly - 1.2*dy );
					ctx.moveTo( lx +1.2*dy,ly+dy*i - e + dy/2);
					ctx.lineTo( lx+e - 1.2*dy,ly+dy*i - e + dy/2);
				}	
				
				ctx.stroke();
				
				
			}else {
				graph.drawgridmenu = false;
			}
		}
		
		if (graph.drawmodemenu || graph.drawremakecolormenu){
			if (x < 10*edge && y < edge*7){
				var lx = 0.1*edge;
				var ly = 0.8*edge;
				var dy = -1*edge;
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg); // TODO create a color fg and color bg at the beginning of this function.
				ctx.rect(0,0,edge*10,edge*7);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				ctx.textAlign="left";
				ctx.fillText('Line / Symbols',lx, ly);ly-=dy;
				ctx.fillText('All line modes ...',lx, ly);ly-=dy;
				ctx.fillText('All Symbol modes ...',lx, ly);ly-=dy;
				ctx.fillText('Line Thickness : ' + gs.line_thickness.toPrecision(2),lx, ly);ly-=dy;
				ctx.fillText('Symbol Size : ' + gs.symbol_size.toPrecision(2),lx, ly);ly-=dy;
				ctx.fillText('Recolor Lines ...',lx, ly);ly-=dy;
				ctx.fillText('Auto Incroment Symbols ...',lx, ly);ly-=dy;
				
				ctx.textAlign="right";
				ly = 3.8*edge;
				lx = 9.8*edge;
				
				ctx.fillText('...',lx, ly);ctx.fillText('+',lx-edge, ly); ctx.fillText('-',lx-2*edge, ly);ly-=dy;
				ctx.fillText('...',lx, ly);ctx.fillText('+',lx-edge, ly); ctx.fillText('-',lx-2*edge, ly);ly-=dy;
				
			} else {
				graph.drawmodemenu = false;
			}
		}
		
		if (graph.drawmarkermenu){
			if (x < 21*edge && x > 1*edge && y < edge*11){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(1*edge,0,edge*20,edge*11);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = gs.color_fg;
				
				var ly = edge*0.8;
				var dy = -edge;
				
				ctx.beginPath();
				ctx.moveTo(1*edge,1*edge);ctx.lineTo(21*edge,1*edge);
				ctx.moveTo(1*edge,3*edge);ctx.lineTo(21*edge,3*edge);
				ctx.moveTo(6*edge,3*edge);ctx.lineTo(6*edge,11*edge);
				ctx.moveTo(11*edge,3*edge);ctx.lineTo(11*edge,11*edge);
				ctx.moveTo(16*edge,3*edge);ctx.lineTo(16*edge,11*edge);
				ctx.stroke();
				
				var lx = 1.2*edge;
				var lx2 = 4.2*edge;
				var lx3 = 0;
				ly-=dy;
				ctx.fillText('Set Color',lx, ly); ly-=dy;
				ctx.fillText('Set Font',lx, ly); ly-=dy; //ctx.fillText('edit',lx2, ly);ly-=dy;
				
				ctx.fillText('Line',lx,  ly);ctx.fillText('+text',lx2, ly);ly-=dy; 
				ctx.fillText('Arrows',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Bracket',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Brace',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Arch',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Span',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Extended',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				
				lx = 6.2*edge; lx2 = 9.2*edge; ly = edge*1.8;
				ctx.fillText('Set Stroke',lx, ly); ly-=dy;
				ctx.fillText('Set Text',lx, ly); ly-=dy;
				ctx.fillText('Arrow',lx,  ly);ctx.fillText('+text',lx2, ly);ly-=dy; 
				ctx.fillText('Lolli',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('1:1 Arrow',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('1:1 Lolli',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				
				ctx.fillText('H-line',lx,  ly);ctx.fillText('+text',lx2, ly);ly-=dy; 
				ctx.fillText('V-line',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Pin',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				
				lx = 11.2*edge; lx2 = 14.2*edge; ly = edge*1.8;
				ctx.fillText('Remove',lx, ly); ly-=dy;
				ctx.fillText('Swap Nodes',lx, ly); ly-=dy;
				ctx.fillText('Box',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Ellipse',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Bg Box',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				ctx.fillText('Bg Ellipse',lx,  ly); ctx.fillText('+text',lx2, ly);ly-=dy;
				//ctx.fillText('Logo',lx,  ly);ly-=dy;
				
				lx = 16.2*edge; lx2 = 19.2*edge; ly = edge*1.8;
				ctx.fillText('Clear All',lx, ly); ly-=dy;
				ctx.fillText('Hide/Show',lx, ly); ly-=dy;
				ctx.fillText('Left Text',lx,  ly);ly-=dy; 
				ctx.fillText('Center Text',lx,  ly);ly-=dy;
				ctx.fillText('Right Text',lx,  ly);ly-=dy;
				ctx.fillText('Left Text Box',lx,  ly);ly-=dy; 
				ctx.fillText('Center Text Box',lx,  ly);ly-=dy;
				ctx.fillText('Right Text Box',lx,  ly);ly-=dy;
				
				ctx.fillText('Marker',10.2*edge, ly = edge*0.8);
				
				ctx.beginPath();
			} else {
				graph.drawmarkermenu = false;
			}
		}
		
		if (graph.drawgraphmenu || graph.drawapplystylemenu ){
			if (graph.drawapplystylemenu || ( x < 12*edge && x > 4*edge && y < edge*12)){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(4*edge,0,edge*8,edge*12);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				var ly = edge*0.8;
				var dy = -edge;
				var lx = 4.2*edge;
				ctx.fillText('Graph',lx, ly);ly-=dy;
				ctx.fillText('Apply Style >',lx,  ly);ly-=dy;
				ctx.fillText('Set title',lx,  ly);ly-=dy;
				ctx.fillText('Set subtitle',lx,  ly);ly-=dy;
				ctx.fillText('Set subtitle2',lx,  ly);ly-=dy;
				ctx.fillText('Toggle show transforms',lx,  ly);ly-=dy;
				ctx.fillText('set x-axis title',lx,  ly);ly-=dy;
				ctx.fillText('set y-axis title',lx, ly);ly-=dy;
				ctx.fillText('Scaling Factor down',lx,  ly);ly-=dy;
				ctx.fillText('Scaling Factor up',lx,  ly);ly-=dy;
				ctx.fillText('Import JSON series',lx,  ly);ly-=dy;
				ctx.fillText('Reset Graph',lx,  ly);ly-=dy;
				
			} else {
				graph.drawgraphmenu = false;
			}
		}
		
		if (graph.drawapplystylemenu){
			
			if (x < 21*edge && x > 5*edge && y < edge + 12*edge && y > 1*edge){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(5*edge,1*edge,edge*16,edge*12);
				ctx.fill();
				ctx.stroke();
				
				ctx.beginPath();
				var itemrow = Math.floor( y / edge ) - 1;
				var itemcol = Math.floor((x - 5*edge) / 8 /edge);
				ctx.rect(5*edge + itemcol*8*edge,itemrow*edge + edge,edge*8,edge);
				ctx.stroke();
				
				ctx.beginPath();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				
				var ly = edge*1.8;
				var dy = -edge;
				var lx = 5.2*edge;
				ctx.fillText('Custom ...',lx, ly);ly-=dy;
				for (var i = 0;i<graphStyleNames.length;i++){
					ctx.fillText(graphStyleNames[i],lx, ly);ly-=dy;
					if (ly > 13*edge){
						ly = edge*1.8;
						lx = 13.2*edge;
					}
				}
			} else {
				graph.drawapplystylemenu = false;
			}
		}
		
		if (graph.drawremakecolormenu){
			/*
			var menuTopx = 9*edge;
			var menuTopy = 2*edge;
			*/
			if (x < 15*edge && x > 1*edge && y < edge*14 && y > 2*edge){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(1*edge,2*edge,edge*14,edge*12);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				var ly = edge*2.8;
				var dy = -edge;
				var lx = 1.2*edge;
				ctx.textAlign="left";
				ctx.fillText('Custom...',lx, ly);ly-=dy;
				ctx.fillText('Generate from captions',lx, ly);ly-=dy;
				ctx.fillText('Greyscale (on white)',lx, ly);ly-=dy;
				ctx.fillText('Greyscale (on black)',lx, ly);ly-=dy;
				
				ctx.fillText('Standard Pallet',lx, ly);ly-=dy;
				ctx.fillText('  Darker',lx, ly);ly-=dy;
				ctx.fillText('  Lighter',lx, ly);ly-=dy;
				ctx.fillText('  Pastle',lx, ly);ly-=dy;
				ctx.fillText('  Saturated',lx, ly);ly-=dy;
				
				ctx.fillText('Spectrum',lx, ly);ly-=dy;
				ctx.fillText('Viridas',lx, ly);ly-=dy;
				ctx.fillText('Plasma',lx, ly);ly-=dy;
				
				lx = 8.2*edge;
				ly = edge*2.8;
				ctx.fillText('Vertical Gradients',lx, ly);ly-=dy;
				ctx.fillText('Horisontal Gradients',lx, ly);ly-=dy;
				ctx.fillText('Radial Gradients',lx, ly);ly-=dy;
				
				
			} else {
				graph.drawremakecolormenu = false;
			}
		}
		if (graph.drawremakesymbolsmenu){
			/* change all of the line symbols to different things
			*/
			if (x < 9*edge && x > 1*edge && y < edge*9 && y > 4*edge){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(1*edge,4*edge,edge*8,edge*5);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				var ly = edge*4.8;
				var dy = -edge;
				var lx = 1.2*edge;
				ctx.textAlign="left";
				ctx.fillText('Line Shapes',lx, ly);ly-=dy;
				ctx.fillText('Solid Shapes',lx, ly);ly-=dy;
				ctx.fillText('Shapes with gap',lx, ly);ly-=dy;
				ctx.fillText('Empty Shapes',lx, ly);ly-=dy;
				ctx.fillText('Shapes with no fill',lx, ly);ly-=dy;
			} else {
				graph.drawremakesymbolsmenu = false;
			}
		}
		
		
		if (graph.drawFontMenu){
			var items = MJSFontList.fontList.length+1;
			if (x < canvas.width-2*edge && x > canvas.width-10*edge && y < edge*items){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(canvas.width-10*edge,0,edge*8,edge*items);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				var ly = edge*0.8;
				var dy = -1*edge;
				var lx = canvas.width-10*edge+0.2*edge;
				ctx.textAlign="left";
				ctx.fillText('Other ...',lx, ly);ly-=dy;
				for (var i =0;i<items-1;i++){
					ctx.fillText(MJSFontList.fontList[i],lx, ly);ly-=dy;
				}
			} else {
				graph.drawFontMenu = false;
			}
		}
		
		if (graph.drawexportmenu){
			if (x > canvas.width - 16*edge && y > canvas.height-edge*14){
				//ctx.font= (0.55*edge) + 'px ' + gs.font_name;//"24px Courier New";
				//box
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(canvas.width - 16*edge,canvas.height-edge*14,edge*16,edge*14);
				ctx.fill();
				ctx.stroke();
				ctx.beginPath();
				var itemrow = Math.floor((canvas.height -y) / edge)+1;
				var itemcol = Math.floor((x - canvas.width + 16*edge) / 8 /edge);
				ctx.rect(canvas.width - 16*edge + 8*edge*itemcol,canvas.height-edge*itemrow,edge*8,edge);
				ctx.stroke();
				
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				var ly = canvas.height - edge*0.1;
				var dy = edge;
				var lx = canvas.width - 7.8*edge;
				var labels = ['export','data (csv)','data (code)','data (code [matlab])','data (JSON)','data (tabbed)','png (hi res)',
				'png (low res)','png (small figure)','png (large figure)','svg','svg (small figure)','svg (large figure)',
				'HTML [Full link]'];
				for (var i=0;i<labels.length;i++){
					ctx.fillText(labels[i],lx, ly);ly-=dy;
				}
				lx = canvas.width - 15.8*edge;
				ly = canvas.height - edge*2.1;
				
				ctx.fillText('JSON - Graph Style',lx,  ly);ly-=dy;
				ctx.fillText('JSON - Full Config',lx,  ly);ly-=dy;
				ctx.fillText('JSON Data for MJSplot',lx,  ly);ly-=dy;
				ly-=dy;
				ctx.fillText('jpeg (hi res)',lx, ly);ly-=dy;
				ctx.fillText('jpeg (low res)',lx,  ly);ly-=dy;
				ctx.fillText('jpeg (small figure)',lx,  ly);ly-=dy;
				ctx.fillText('jpeg (large figure)',lx,  ly);ly-=dy;
				ctx.fillText('svg+png',lx,  ly);ly-=dy;
				ctx.fillText('svg+png(small fig)',lx,  ly);ly-=dy;
				ctx.fillText('svg+png(large fig)',lx,  ly);ly-=dy;
				ctx.fillText('HTML [Short link]',lx,  ly);ly-=dy;
			} else {
				graph.drawexportmenu = false;
			}
		}
		
		if (graph.drawcaptionmenu){
			if (x>canvas.width-12*edge && y < edge*8){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.beginPath();
				ctx.rect(canvas.width-12*edge,0,edge*12,edge*8);
				ctx.fill();
				ctx.stroke();
				ctx.beginPath();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				var lx = canvas.width-5.8*edge;
				var ly = 0.8*edge;
				var dy = 1*edge;
				ctx.fillText('captions',lx, ly);ly+=dy;
				ctx.fillText( (gs.show_captions?'Hide':'Show')+ ' All',lx, ly);ly+=dy;
				ctx.fillText( (gs.show_caption_symbol?'Hide':'Show')+ ' Symbols',lx, ly);ly+=dy;
				ctx.fillText( (gs.show_caption_line?'Hide':'Show')+ ' Line',lx, ly);ly+=dy;
				ctx.fillText( (gs.show_caption_reader?'Hide':'Show')+ ' Reader',lx, ly);ly+=dy;
				ctx.fillText( (gs.show_caption_box?'Hide':'Show')+ ' Box',lx, ly);ly+=dy;
				
				ctx.fillText('Font Size',lx,ly); ly+=dy;
				ctx.fillText('[-]',lx,ly);
				ctx.fillText('[+]',lx+3*edge,ly);
				
				if (gs.show_caption_reader){
					ctx.globalAlpha = 0.7;
				}
				lx = canvas.width-11.8*edge;
				ly = 1.8*edge;
				ctx.fillText('Data Reader:',lx, ly);ly+=dy;
				ctx.fillText('X First',lx, ly);ly+=dy;
				ctx.fillText('X Last',lx, ly);ly+=dy;
				ctx.fillText('X Min',lx, ly);ly+=dy;
				ctx.fillText('X Max',lx, ly);ly+=dy;
				ctx.fillText('Extra Precision:'+gs.captions_extra_precision ,lx,ly);ly+=dy;
				ctx.fillText('[-]',lx,ly);
				
				lx = canvas.width-8.8*edge;
				ly = 2.8*edge;
				ctx.fillText('Y First',lx, ly);ly+=dy;
				ctx.fillText('Y Last',lx, ly);ly+=dy;
				ctx.fillText('Y Min',lx, ly);ly+=dy;
				ctx.fillText('Y Max',lx, ly);ly+=dy;
				ly+=dy;
				ctx.fillText('[+]',lx, ly);ly+=dy;
				ctx.globalAlpha = 1.0;
			} else {
				graph.drawcaptionmenu = false;
			}
		}
		
		//draw fx menue
		if (graph.drawfxmenu){
			
			if (x>8*edge && x<22*edge && y > canvas.height-edge*14){
				//f() button
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(8*edge,canvas.height-edge*14,edge*14,edge*14);
				ctx.fill();
				ctx.stroke();
				ctx.beginPath();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				//ctx.font= (0.55*edge) + 'px ' + gs.font_name;//"24px Courier New";
				ctx.fillText('functions',8.2*edge, canvas.height - edge*0.3);
				ctx.stroke();
				
				//the lines seperating buttons
				ctx.beginPath();
				for (var i  = 1;i<14;i++){
					ctx.moveTo(edge*8,canvas.height - edge*i);
					ctx.lineTo(edge*22,canvas.height - edge*i);
				}
				ctx.moveTo(edge*12,canvas.height);
				ctx.lineTo(edge*12,canvas.height - edge*14);
				ctx.moveTo(edge*16,canvas.height);
				ctx.lineTo(edge*16,canvas.height - edge*14);
				ctx.moveTo(edge*10,canvas.height - edge*9);
				ctx.lineTo(edge*10,canvas.height - edge*13);
				ctx.moveTo(edge*10,canvas.height - edge*4);
				ctx.lineTo(edge*10,canvas.height - edge*5);
				ctx.moveTo(edge*14,canvas.height - edge*9);
				ctx.lineTo(edge*14,canvas.height - edge*13);
				ctx.moveTo(edge*14,canvas.height - edge*3);
				ctx.lineTo(edge*14,canvas.height - edge*5);
				ctx.stroke();
				
				ctx.fillText('Reset',8.2*edge, canvas.height - edge*1.3);
				ctx.fillText('Cut',8.2*edge, canvas.height - edge*2.3);
				ctx.fillText('Norm(y)',8.2*edge, canvas.height - edge*3.3);
				ctx.fillText('y-c',8.2*edge, canvas.height - edge*4.3);
				ctx.fillText('x-c',10.2*edge, canvas.height - edge*4.3);
				
				ctx.fillText('Smooth',8.2*edge, canvas.height - edge*5.3);
				ctx.fillText('Interpolate',8.2*edge, canvas.height - edge*6.3);
				ctx.fillText('-(mx+c)',8.2*edge, canvas.height - edge*7.3);
				ctx.fillText('dy/dx',8.2*edge, canvas.height - edge*8.3);
				ctx.fillText('ln x',8.2*edge, canvas.height - edge*9.3);
				ctx.fillText('e^x',10.2*edge, canvas.height - edge*9.3);
				ctx.fillText('log x',8.2*edge, canvas.height - edge*10.3);
				ctx.fillText('10^x',10.2*edge, canvas.height - edge*10.3);
				ctx.fillText('10x',8.2*edge, canvas.height - edge*11.3);
				ctx.fillText('x/10',10.2*edge, canvas.height - edge*11.3);
				ctx.fillText('-x',8.2*edge, canvas.height - edge*12.3);
				ctx.fillText('1/x',10.2*edge, canvas.height - edge*12.3);
				ctx.fillText('x<->y',12.2*edge, canvas.height - edge*1.3);
				ctx.fillText('Trim',12.2*edge, canvas.height - edge*2.3);
				ctx.fillText('x^n',12.2*edge, canvas.height - edge*3.3);
				ctx.fillText('y^n',14.2*edge, canvas.height - edge*3.3);
				ctx.fillText('rt x',12.2*edge, canvas.height - edge*4.3);
				ctx.fillText('rt y',14.2*edge, canvas.height - edge*4.3);
				ctx.fillText('Sum',12.2*edge, canvas.height - edge*5.3);
				//ctx.fillText('B-A',14.2*edge, canvas.height - edge*5.3);
				ctx.fillText('Jitter',12.2*edge, canvas.height - edge*6.3);
				ctx.fillText('Hist',12.2*edge, canvas.height - edge*7.3);
				ctx.fillText('Intergrate',12.2*edge, canvas.height - edge*8.3);
				ctx.fillText('ln y',12.2*edge, canvas.height - edge*9.3);
				ctx.fillText('e^y',14.2*edge, canvas.height - edge*9.3);
				ctx.fillText('log y',12.2*edge, canvas.height - edge*10.3);
				ctx.fillText('10^y',14.2*edge, canvas.height - edge*10.3);
				ctx.fillText('10y',12.2*edge, canvas.height - edge*11.3);
				ctx.fillText('y/10',14.2*edge, canvas.height - edge*11.3);
				ctx.fillText('-y',12.2*edge, canvas.height - edge*12.3);
				ctx.fillText('1/y',14.2*edge, canvas.height - edge*12.3);
				ctx.fillText('Pop',12.2*edge, canvas.height - edge*0.3);
				ctx.fillText('y vs y',8.2*edge, canvas.height - edge*13.3);
				
				ctx.fillText('Nothing',12.2*edge, canvas.height - edge*13.3);
				
				
				ctx.fillText('Subtract fit',16.2*edge, canvas.height - edge*13.3);
				ctx.fillText('Rmv outliers',16.2*edge, canvas.height - edge*12.3);
				ctx.fillText('Keep outliers',16.2*edge, canvas.height - edge*11.3);
				ctx.fillText('Custom y=f(x,y)',16.2*edge, canvas.height - edge*10.3);
				ctx.fillText('Custom filter',16.2*edge, canvas.height - edge*9.3);
				
				
				ctx.fillText('Visvalingam',16.2*edge, canvas.height - edge*8.3);
				ctx.fillText('Subdivide',16.2*edge, canvas.height - edge*7.3);
				ctx.fillText('Kernal Density',16.2*edge, canvas.height - edge*6.3);
				ctx.fillText('Mean binning',16.2*edge, canvas.height - edge*5.3);
				ctx.fillText('Accumulate(y)',16.2*edge, canvas.height - edge*4.3);
				ctx.fillText('View last n',16.2*edge, canvas.height - edge*3.3);
				ctx.fillText('(y - mean)/sigma',16.2*edge, canvas.height - edge*2.3);
				ctx.fillText('x spacing',16.2*edge, canvas.height - edge*1.3);
				ctx.fillText('time to number',16.2*edge, canvas.height - edge*0.3);
			} else {
				graph.drawfxmenu = false;
			}
		}
		
		if (graph.drawtimemenu){
			graph.drawfxmenu = false;
			if (x>10*edge && x<20*edge && y > canvas.height-edge*6){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.beginPath();
				ctx.rect(10*edge,canvas.height-edge*6,edge*10,edge*6);
				ctx.fill();
				ctx.stroke();
				ctx.beginPath();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				//ctx.font= (0.55*edge) + 'px ' + gs.font_name;//"24px Courier New";
				ctx.fillText('time->number',10.2*edge, canvas.height - edge*0.3);
				
				var timeoptionsstrings = [['days','hours','mins','sec'],['now','ago','start','end']];
				var lx = 10.2*edge;
				var ldx = 2*edge;
				var ly =  canvas.height - edge*3.3;
				var ldy = edge;
				
				for (var i = 0;i<2;i++){
					for (var j = 0;j<4;j++){
						var label = timeoptionsstrings[i][j];
						if (graph.timemenuoptions[i] == j ){
						 label = '['+label+']';
						} else 
						{
						 label = ' '+label+' ';
						}
						ctx.fillText(label,lx+j*ldx, ly -i*ldy);
					}
				}
				ctx.fillText('Pick reference and unit',lx, ly -2*ldy);
				ctx.fillText('apply on x',lx, ly +2*ldy);
				ctx.fillText('apply on y',lx+3*ldx, ly +2*ldy);
				
			} else {
				graph.drawtimemenu = false;
			}
		}
		
		
		
		//draw line menu buttons
		if (graph.drawlinemenu ){
			
			//get number of lines
			var no_of_lines = graph.data_backup.length;
			//add in the number of function lines
			var no_of_function_lines = gs.function_lines.length;
			
			for (var i = 0;i<no_of_lines;i++){
				gs.hidden_lines[i] = gs.hidden_lines[i] || false;		
			}
			graph._check_line_order();
			
			//draw the menu
			if ( (x>3*edge && x<21*edge && y > canvas.height-edge*(no_of_lines+no_of_function_lines+2))){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(3*edge,canvas.height-edge*(no_of_lines+no_of_function_lines+2),edge*18,edge*(no_of_lines+no_of_function_lines+2));
				ctx.fill();
				ctx.stroke();
				
				ctx.beginPath();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.globalAlpha = 0.2;
				ctx.rect(edge*3,canvas.height -  Math.floor( ( canvas.height - y) / edge +1 ) * edge,18*edge,edge);
				ctx.fill(); 
				ctx.globalAlpha = 1;
				//ctx.moveTo(edge*3, );
				//ctx.lineTo(edge*21,canvas.height -  Math.floor( ( canvas.height - y) / edge ) * edge );
				ctx.beginPath();
				ctx.moveTo(edge*3,canvas.height - edge);
				ctx.lineTo(edge*21,canvas.height - edge);
				ctx.moveTo(edge*3,canvas.height - edge*(no_of_lines+1));
				ctx.lineTo(edge*21,canvas.height - edge*(no_of_lines+1));
				ctx.stroke();
				
				
				ctx.fillText('line menu',11.2*edge+0.2, canvas.height -edge*0.2);
				var ly = canvas.height - no_of_lines*edge - 0.2*edge;
				var lx = 6.2*edge;
				for (var i = 0;i<no_of_function_lines;i++){
					ly -= edge;
					ctx.fillText(gs.function_lines[i],lx, ly);
					ctx.fillText( '(-)' ,3.2*edge, ly);
					
				}
				ly -= edge;
				ctx.fillText( 'new function line',lx, ly);
				
				for (var ii = no_of_lines-1;ii+1>0;ii--){
					
					var i = gs.line_order[ii];
					//take infomation from i, but draw in the ii position
					var label = graph.captions_backup[i] ||  'label' ;
					//ctx.fillStyle = graph.colors_backup[i];
					ctx.fillText(label,4.2*edge, canvas.height -no_of_lines*edge + edge*(ii-0.2));
					//show or hide button
					
					eye(ctx,3.5*edge, canvas.height - no_of_lines*edge + edge*(ii-0.5),edge/3,!gs.hidden_lines[i]);
					/*
					if (gs.hidden_lines[i]){
						ctx.fillText('( )',11.2*edge,);
					} else {
						ctx.fillText('(+)',11.2*edge, canvas.height - no_of_lines*edge + edge*(i-0.2));
					}
					* */
					//ctx.beginPath();
					//ctx.rect(20.2*edge,canvas.height - no_of_lines*edge + edge*(i-0.8),0.6*edge,0.6*edge);
					//ctx.fill();
					
					previewColor(ctx,17.2*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8),0.6*edge,0.6*edge,graph.colors_backup[i]);
					
					ctx.beginPath();
					//ctx.arc(18.5*edge,canvas.height - no_of_lines*edge + edge*(i-0.8),0.3*edge,0,Math.pi*2,false);
					ctx.arc(15.5*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8)+0.3*edge,0.25*edge,0,3.1415*2,false);
					ctx.stroke();
					
					ctx.beginPath();
					ctx.moveTo(16.2*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8));
					ctx.lineTo(16.8*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8)+0.6*edge);
					ctx.stroke();
					
					ctx.beginPath();
					ctx.moveTo(18.2*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8));
					ctx.lineTo(18.4*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8)+0.2*edge);
					ctx.moveTo(18.6*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8)+0.4*edge);
					ctx.lineTo(18.8*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8)+0.6*edge);
					ctx.stroke();
					
					drawArrow(ctx,19.5*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8) + 0.5*edge,edge/12,Math.PI/2);
					drawArrow(ctx,20.5*edge,canvas.height - no_of_lines*edge + edge*(ii-0.8) + 0.2*edge,edge/12,-0.5*Math.PI);
					
				}
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				//all button
				//none button
				ctx.fillText('all',15.2*edge+0.2, canvas.height -edge*0.2);
				ctx.fillText('none',17.2*edge+0.2, canvas.height -edge*0.2);
				ctx.beginPath();
			}else {
				graph.drawlinemenu = false;
			}
		
		}
		
		if (graph.drawinlinecolormenu){
			//draw some amazing color picker with swatch, custom, alpha, etc...
			// somehow....
			
			//get the position of the menu from the graph.ui object
			var menupos = graph.ui.inlinemenyposition;
			//this is the centre of the inline menu, unlike the other inline menues
			
			var e=edge*1;
			var inlinemenuheight = 6*e;
			var inlinemenuwidth = 9*e;
			
			//confine the menu to be drawn fully on the canvas
			
			menupos.x = Math.max(Math.min(canvas.width - inlinemenuwidth/2,menupos.x),inlinemenuwidth/2);
			menupos.y = Math.max(Math.min(canvas.height - inlinemenuheight/2,menupos.y),inlinemenuheight/2);
			
			if (x < menupos.x + inlinemenuwidth/2 && x > menupos.x - inlinemenuwidth/2 &&
				y < menupos.y + inlinemenuheight/2 && y > menupos.y - inlinemenuheight/2){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(menupos.x - inlinemenuwidth/2,menupos.y-inlinemenuheight/2,inlinemenuwidth,inlinemenuheight);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				//draw the contents of the menu here
				var lx = menupos.x - inlinemenuwidth/2; 
				var ly = menupos.y - inlinemenuheight/2; 
				
				ctx.drawImage( getColorPickerImage(4.8*e,menupos.saturation),lx+0.1*e,ly+0.1*e);
				//draw the saturation slider
				ctx.moveTo(lx+0.1*e,ly+5.5*e);ctx.lineTo(lx+4.9*e,ly+5.5*e);
				
				ctx.moveTo(lx+0.1*e+menupos.saturation*4.8*e,ly+5.3*e);
				ctx.lineTo(lx+0.1*e+menupos.saturation*4.8*e,ly+5.7*e);
				ctx.stroke();
				for (var i=0;i<swatch.length;i++){
					ctx.beginPath();
					ctx.rect( lx+5.1*e,ly+0.1*e+i*e,0.8*e,0.8*e );
					ctx.fillStyle = swatch[i];
					ctx.fill();
					ctx.stroke();
				}
				ctx.beginPath();
				previewColor(ctx, lx+6.5*e,ly+0.5*e,2*e,2*e , menupos.current);
				
				//the current selected color
				ctx.rect( lx+6.5*e,ly+0.5*e,2*e,2*e );
				//ctx.fillStyle = menupos.current;
				//ctx.fill();
				ctx.stroke();
				
				
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				
				ctx.fillText(menupos.current,lx+6.1*e,ly+3.8*e);
				ctx.fillText('Custom...',lx+6.1*e,ly+4.8*e);
				ctx.fillText('OK',lx+6.1*e,ly+5.8*e);
				
			} else {
				graph.drawinlinecolormenu = false;
			}
			
		}
		
		if (graph.drawinlinedashmenu){
			graph.drawlinemenu = true; //keep the parent menu open
			//get the position of the menu from the graph.ui object
			var menupos = graph.ui.inlinemenyposition;
			//this is the upper left corner of the inline menu
			var inlinemenuheight = dashmodes.length+1;
			var inlinemenuwidth = 3;
			var e=edge*1;
			// look to move the menu left if it is off screen...
			menupos.x = Math.min(menupos.x, graph.canvas.width - inlinemenuwidth*e );
			menupos.y = Math.min(menupos.y, graph.canvas.height - inlinemenuheight*e );
			
			if (x < menupos.x + inlinemenuwidth*e && x > menupos.x && y < menupos.y + e*inlinemenuheight && y > menupos.y){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(menupos.x,menupos.y,e*inlinemenuwidth,e*inlinemenuheight);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				
				ctx.lineWidth = Math.max(gs.line_width*gs.scaling_factor,e/10);
				fakeGraph.graphics_style.color_bg = gs.color_bg;
				fakeGraph.graphics_style.color_fg = gs.color_fg;
				
				var ly = menupos.y + e*0.5;
				var dy = e;
				var lx = menupos.x + 0.2*e;
				for (var i=0;i<dashmodes.length;i++){
					fakeGraph.data[0][0][0] = lx ;
					fakeGraph.data[0][1][0] = ly ;
					fakeGraph.data[0][0][1] = lx + +2.6*e ;
					fakeGraph.data[0][1][1] = ly ;
					ly+=dy;
					applyDashMode(ctx,dashmodes[i],ctx.lineWidth);
					graph.drawing_methods[ 'line' ](fakeGraph,ctx,0,0,2, ly );
				}
				applyDashMode(ctx,'solid',ctx.lineWidth);
				
				var item = Math.floor((y - menupos.y)/e);
				if (item < dashmodes.length){
					centredPopupText(graph,ctx,x,y-e, dashmodes[item] ) ;
				}
				ctx.textAlign='left';
				ctx.fillText('Custom...',lx,ly);
				
			} else {
				graph.drawinlinedashmenu = false;
			}
		}
		
		
		if (graph.drawinlinelinemenu){
			//graph.drawlinemenu = true; //keep the parent menu open
			//get the position of the menu from the graph.ui object
			var menupos = graph.ui.inlinemenyposition;
			//this is the upper left corner of the inline menu
			var inlinemenuwidth = 4;
			menupos.inlinemenuwidth = inlinemenuwidth;
			var inlinemenuheight = Math.ceil(lines.length / inlinemenuwidth);
			
			var e=edge*2;
			// look to move the menu left if it is off screen...
			menupos.x = Math.min(menupos.x, graph.canvas.width - inlinemenuwidth*e );
			menupos.y = Math.min(menupos.y, graph.canvas.height - inlinemenuheight*e );
			
			if (x < menupos.x + inlinemenuwidth*e && x > menupos.x && y < menupos.y + e*inlinemenuheight && y > menupos.y){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(menupos.x,menupos.y,e*inlinemenuwidth,e*inlinemenuheight);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				//ctx.lineWidth = gs.graph_line_width;
				var symbol_mode = [];
				//fakeGraph.graphics_style.color_bg = gs.color_bg;
				//fakeGraph.graphics_style.color_fg = gs.color_fg;
				fakeGraph.graphics_style = gs;
				var ly, ly ;
				for (var i=0;i<lines.length;i++){
					lx =  menupos.x + 0.2*e + (i % inlinemenuwidth)*e ;
					ly =  menupos.y + e*0.8 + Math.floor(i / inlinemenuwidth)*e;
					fakeGraph.data[0][0][0] = lx;
					fakeGraph.data[0][1][0] = ly;
					fakeGraph.data[0][0][1] = lx + 0.4*e ;
					fakeGraph.data[0][1][1] = ly - 0.6*e;
					fakeGraph.data[0][0][2] = lx + 0.6*e ;
					fakeGraph.data[0][1][2] = ly - 0.3*e;
					graph.drawing_methods[ 'circ_fill' ](fakeGraph,ctx,0,0,3, 0.1*e );
					graph.drawing_methods[ lines[i%lines.length] ](fakeGraph,ctx,0,0,3, ly+0.1*e );
				}
				
				var item = Math.floor((x - menupos.x)/e) + inlinemenuwidth *  Math.floor((y - menupos.y)/e);
				centredPopupText(graph,ctx,x,y-e, lineNames[item] ) ;
				
				
			} else {
				graph.drawinlinelinemenu = false;
			}
		}
		
		if (graph.drawinlinesymbolmenu){
			//get the position of the menu from the graph.ui object
			var menupos = graph.ui.inlinemenyposition;
			//this is the upper left corner of the inline menu
			
			
			var inlinemenuwidth = 4;
			menupos.inlinemenuwidth = inlinemenuwidth;
			var inlinemenuheight = Math.ceil(symbols.length / inlinemenuwidth);
			
			menupos.x = Math.max(Math.min(canvas.width - inlinemenuwidth*edge,menupos.x),0);
			menupos.y = Math.max(Math.min(canvas.height - inlinemenuheight*edge,menupos.y),0);
			
			
			if (x < menupos.x + inlinemenuwidth*edge && x > menupos.x && y < menupos.y + edge*inlinemenuheight && y > menupos.y){
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(menupos.x,menupos.y,edge*inlinemenuwidth,edge*inlinemenuheight);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				//ctx.lineWidth = gs.graph_line_width;
				var symbol_mode = [];
				fakeGraph.graphics_style = gs;
				var ly = menupos.y + edge*0.5;
				var dy = -edge;
				var lx = menupos.x + 0.5*edge;
				for (var i=0;i<symbols.length;i++){
					fakeGraph.data[0][0][0] = lx + (i % inlinemenuwidth) * edge ;
					fakeGraph.data[0][1][0] = ly + Math.floor(i / inlinemenuwidth)*edge;
					graph.drawing_methods[ symbols[i%symbols.length] ](fakeGraph,ctx,0,0,1,0.7*edge);
				}
				var item = Math.floor((x - menupos.x)/edge) +  inlinemenuwidth *  Math.floor((y - menupos.y)/edge)  ;
				centredPopupText(graph,ctx,x,y-edge, symbolsNames[item] ) ;
				
			} else {
				graph.drawinlinesymbolmenu = false;
			}
		}
		
		//draw fit's menu buttons
		if (graph.drawfitsmenu){
			if (x>15*edge && x<21*edge && y > canvas.height-edge*10){
				//f() button
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.rect(15*edge,canvas.height-edge*10,edge*6,edge*10);
				ctx.fill();
				ctx.stroke();
				ctx.beginPath();
				ctx.stroke();
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				//ctx.font= (0.55*edge) + 'px ' + gs.font_name;//"24px Courier New";

				var label = '';
				if (gs.extrapolate){
					label = '(+) extrapolate';
				} else {
					label = '( ) extrapolate';
				}
				var lx = 18.2*edge;
				var ly= canvas.height - edge*0.3;
				var dly = edge;
				ctx.fillText('none',lx, ly);ly-=dly;
				ly-=dly;//extrapolate takes up two.
				ctx.fillText('stats',lx,  ly);ly-=dly;
				ctx.fillText('ae^bx',lx, ly);ly-=dly;
				ctx.fillText('a+be^cx',lx,  ly);ly-=dly;
				ctx.fillText('a+blnx',lx,  ly);ly-=dly;
				ctx.fillText('ax^b',lx, ly);ly-=dly;
				ctx.fillText('a+bx^c',lx, ly);ly-=dly;
				ctx.fillText('gauss',lx, ly);ly-=dly;
				lx = 15.2*edge;
				ly = canvas.height - edge*0.3;
				ctx.fillText('fits',lx, ly);ly-=dly;
				ctx.fillText(label,lx, ly);ly-=dly;
				ctx.fillText('y=c',lx, ly);ly-=dly;
				ctx.fillText('linear',lx, ly);ly-=dly;
				ctx.fillText('quad',lx,ly);ly-=dly;
				ctx.fillText('cubic',lx, ly);ly-=dly;
				ctx.fillText('poly 4',lx, ly);ly-=dly;
				ctx.fillText('poly 5',lx,ly);ly-=dly;
				ctx.fillText('poly 6',lx, ly);ly-=dly;
				ctx.fillText('poly 7',lx,ly);ly-=dly;
			
			} else {
				graph.drawfitsmenu = false;
			}
		}
		//the x and y menu should not be under the button. Don't draw if the menus are open.
		if (graph.ui.touch && graph.ui.is_touching && (gs.mouse_mode === 'zoom' || gs.mouse_mode === 'drag'|| gs.mouse_mode === 'hreader') && !( graph.drawxmenu || graph.drawymenu) ){
			//big zoom out button 
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.rect(0,canvas.height-2*edge,edge*4,edge);
			ctx.fill();
			ctx.stroke();
			if (gs.mouse_mode === 'zoom'){
				ctx.rect(0,canvas.height-3*edge,edge*4,edge);
				ctx.fill();
				ctx.stroke();
			}
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			//ctx.font= (0.55*edge) + 'px ' + gs.font_name;//"24px Courier New";
			
			ctx.fillText('Auto Zoom',0.2*edge, canvas.height - edge*1.3);
			if (gs.mouse_mode === 'zoom'){
				ctx.fillText('Zoom out',0.2*edge, canvas.height - edge*2.3);
			}
		}
		
		if (graph.ui.touch && graph.ui.is_touching && ( gs.mouse_mode !== 'hreader' || anymenu || graph.inlinecolormenu || y<edge || canvas.height-y < edge )){
			//draw the bit under the finger. in the middle. under finger view
			var image = ctx.getImageData(x-2*edge,y-2*edge,edge*4,4*edge);
			ctx.beginPath();
			ctx.moveTo(x,y);
			ctx.lineTo(canvas.width/2,canvas.height/2);
			ctx.stroke();
			//the bit is 4edge by 4edge. the boarder has 2px on each side as well.
			ctx.rect(canvas.width/2-2*edge-2,canvas.height/2-2*edge-2,4*edge+4,4*edge+4);
			ctx.stroke();
			ctx.putImageData(image,canvas.width/2-2*edge,canvas.height/2-2*edge);
			ctx.beginPath();
			var cd = Math.max(0.1*edge,2); //center dot size
			ctx.rect(canvas.width/2-cd,canvas.height/2-cd,2*cd,2*cd);
			ctx.fill();
		}
		//drawArrow(ctx,x,y,edge/10, 0.54);
	}
	
	
	ctx.beginPath();
	ctx.stroke();
	
	if (mouse_down){	
		
		if (mjs_plot.SHIFT){
			var n = modify_for_shift(start_x,start_y,x,y);
			x = n.rx;
			y = n.ry;
		}
		
		if (mjs_plot.CTRL){
			var n = modify_for_grid_snap(graph,x,y);
			x = n.rx;
			y = n.ry;
		}
		
		
		
		if (gs.mouse_mode === 'zoom' || (gs.mouse_mode === 'hreader'&& !graph.ui.is_touching )){
			//is dragging for zoom
			end_x = x;
			end_y = y;
			//draw bounding box
			ctx.beginPath();
			ctx.rect(start_x+1,start_y+1,end_x-start_x-1,end_y-start_y-1);
			ctx.moveTo(start_x,0);
			ctx.lineTo(start_x,2*edge);
			ctx.moveTo(start_x,canvas.height);
			ctx.lineTo(start_x,canvas.height-2*edge);
			ctx.moveTo(end_x,canvas.height);
			ctx.lineTo(end_x,canvas.height-2*edge);
			ctx.moveTo(end_x,0);
			ctx.lineTo(end_x,2*edge);
			
			ctx.moveTo(0,start_y);
			ctx.lineTo(2*edge,start_y);
			ctx.moveTo(canvas.width-2*edge,start_y);
			ctx.lineTo(canvas.width,start_y);
			
			ctx.moveTo(0,end_y);
			ctx.lineTo(2*edge,end_y);
			ctx.moveTo(canvas.width-2*edge,end_y);
			ctx.lineTo(canvas.width,end_y);
			ctx.stroke();
			
			//this is a hack to get the screen to redraw correctly. 
			ctx.beginPath();
			ctx.stroke();
		}
		if (gs.mouse_mode === 'drag' || (gs.mouse_mode === 'hreader'&& graph.ui.is_touching )){
			//is dragging
			
			if (graph.ui.is_touching){
			
				is_touch_dragging = true;
				start_x = 0.5*(touch_start_x[0]+touch_start_x[1]);
				start_y = 0.5*(touch_start_y[0]+touch_start_y[1]);
				
				end_x = 0.5*(touch_x[0]+touch_x[1]);
				end_y = 0.5*(touch_y[0]+touch_y[1]);
				
				scale_x = (touch_x[0]-touch_x[1]) / (touch_start_x[0]-touch_start_x[1]);
				scale_y = (touch_y[0]-touch_y[1]) / (touch_start_y[0]-touch_start_y[1]);
				scale_x = trim(Math.abs(scale_x),0.1,10);
				scale_y = trim(Math.abs(scale_y),0.1,10);
				
				ctx.putImageData(graph.graph_image_for_drag,0,0);
				ctx.save();
				ctx.translate((start_x) ,(start_y) );
				ctx.scale(scale_x,scale_y);
				ctx.translate((end_x-start_x)/scale_x ,(end_y-start_y)/scale_y );
				//draw the canvas on its self. Crazy. 
				ctx.drawImage(canvas, -start_x, -start_y);// this dam line too me ages to figure out.
				
				ctx.restore();
			} else {
				end_x = x;
				end_y = y;
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg); 
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.putImageData(graph.graph_image_for_drag,end_x-start_x,end_y-start_y);
			}
		}
		if (gs.mouse_mode === 'measure'){
			ctx.beginPath();
			ctx.moveTo(start_x,start_y);
			ctx.lineTo(x,y);
			ctx.stroke();
			dx = x - start_x;
			dy = y - start_y;
			px = graph.pixels_to_units(x,'x');
			py = graph.pixels_to_units(y,'y');
			px_start = graph.pixels_to_units(start_x,'x');
			py_start = graph.pixels_to_units(start_y,'y');
		
			label = graph.get_axis_string(px,'x');
			ctx.fillText(label,x+cs,canvas.height-1.5*edge);
			
			label = graph.get_axis_string(py,'y');
			ctx.fillText(label,2*edge,y-cs*2);
			
			ctx.beginPath();
			ctx.moveTo(x,canvas.height);
			ctx.lineTo(x,canvas.height - 1.5*edge );
			ctx.moveTo(x,0);
			ctx.lineTo(x,2*edge);
			ctx.moveTo(0,y);
			ctx.lineTo(2*edge,y);
			ctx.moveTo(canvas.width,y);
			ctx.lineTo(canvas.width-2*edge,y);
			ctx.stroke();
			ctx.beginPath();
			ctx.stroke();
			label = graph.get_axis_string(px_start,'x');
			ctx.fillText(label,start_x+cs,canvas.height-2*edge);
			label = graph.get_axis_string(py_start,'y');
			ctx.fillText(label,2*edge,start_y-cs*2);
			ctx.beginPath();
			ctx.moveTo(start_x,canvas.height);
			ctx.lineTo(start_x,canvas.height - 2*edge );
			ctx.moveTo(start_x,0);
			ctx.lineTo(start_x,2*edge);
			ctx.moveTo(0,start_y);
			ctx.lineTo(2*edge,start_y);
			ctx.moveTo(canvas.width,start_y);
			ctx.lineTo(canvas.width-2*edge,start_y);
			ctx.stroke();
			ctx.beginPath();
			ctx.stroke();
				
			//show dx infomation
			if (dx > edge/2 || dx < -edge/2){
				x_meas = Math.min(y,start_y)-edge;
				ctx.beginPath();
				ctx.moveTo(x,x_meas-0.3*edge);
				ctx.lineTo(x,x_meas+0.3*edge);
				ctx.moveTo(start_x,x_meas-0.3*edge);
				ctx.lineTo(start_x,x_meas+0.3*edge);
				ctx.moveTo(x,x_meas);
				ctx.lineTo(start_x,x_meas);
				ctx.stroke();
				
				
				label = measureDeltaString(graph,px-px_start,'x');
				ctx.fillText(label,(x+start_x)/2-.3*gs.scaling_factor*gs.axis_labels_font_size*label.length,x_meas-.4*gs.axis_labels_font_size);
				
			}
			
			//show dy infomation
			if (dy > edge/2 || dy < -edge/2){
				y_meas = Math.min(x,start_x)-edge;
				label = measureDeltaString(graph,py-py_start,'y');
				label_pos = y_meas - .7*gs.axis_labels_font_size*gs.scaling_factor*label.length;
				ctx.beginPath();
				ctx.moveTo(y_meas-0.3*edge,y);
				ctx.lineTo(y_meas+0.3*edge,y);
				ctx.moveTo(y_meas-0.3*edge,start_y);
				ctx.lineTo(y_meas+0.3*edge,start_y);
				ctx.moveTo(y_meas,y);
				ctx.lineTo(y_meas,start_y);
				ctx.stroke();
				ctx.fillText(label,label_pos,(y+start_y)/2);
			}
			//show grad
			if ((dx > edge/2 || dx < -edge/2) && (dy > edge/2 || dy < -edge/2)){
				grad =  (py-py_start) / (px-px_start);
				label = measureGradString(graph,grad);
				ctx.fillText('g = ' + label,x+cs,y-cs);
				//show tau if semi log y graph.
				if ( gs.y_scale_mode === 'log' && (gs.x_scale_mode === 'lin' || gs.x_scale_mode === 'time' )){
					var tau =  (Math.log10(py)-Math.log10(py_start)) / (px-px_start);
					
					if ( gs.x_scale_mode === 'time'){
					
						unit = '/ms';
						if (Math.abs(tau)<1){tau*=1000; unit='/s';}
						if (Math.abs(tau)<1){tau*=60; unit='/m';}
						if (Math.abs(tau)<1){tau*=60; unit='/h';}
						if (Math.abs(tau)<1){tau*=24; unit='/d';}
						tau = mjs_precision(tau,5);
						
					} else {
						unit = '';
						tau = mjs_precision(tau, Math.min(gs.y_precision,gs.x_precision));
					
					}
					ctx.fillText('tau =' + tau+unit,x+cs,y+cs);
					
					var n = Math.ceil(Math.max(dx,dy)/4);
					
					ctx.beginPath();
					for (var k = 0;k<n;k++){
						var yi = graph.units_to_pixels(py_start+k*(py-py_start)/n,'y');
						var xi =  graph.units_to_pixels(px_start+k*(px-px_start)/n,'x');
						ctx.moveTo(xi,yi);
						var yi =  graph.units_to_pixels(py_start+(k+1)*(py-py_start)/n,'y');
						var xi =  graph.units_to_pixels(px_start+(k+1)*(px-px_start)/n,'x');
						ctx.lineTo(xi,yi);
					}
					ctx.stroke();
				}
				
				//show powerlaw if log log graph.
				if ( gs.y_scale_mode === 'log' && gs.x_scale_mode === 'log'){
					var powerlaw =  (Math.log10(py)-Math.log10(py_start)) / (Math.log10(px)-Math.log10(px_start));
					powerlaw = mjs_precision(powerlaw, Math.min(gs.y_precision,gs.x_precision));
					ctx.fillText('p =' + powerlaw,x+cs,y+cs);
					
					var n = Math.ceil(Math.max(dx,dy)/2);
					
					ctx.beginPath();
					var yi = 0;
					var xi = 0;
					for (var k = 0;k<n;k++){
						xi = Math.exp(Math.log(px_start)+k*(Math.log(px)-Math.log(px_start))/n);
						yi = (xi-px_start) * grad+py_start;
						xi = graph.units_to_pixels(xi,'x');
						yi = graph.units_to_pixels(yi,'y');
						ctx.moveTo(xi,yi);
						xi = Math.exp(Math.log(px_start)+(k+1)*(Math.log(px)-Math.log(px_start))/n);
						yi = (xi-px_start) * grad+py_start;
						xi = graph.units_to_pixels(xi,'x');
						yi = graph.units_to_pixels(yi,'y');
						ctx.lineTo(xi,yi);
					}
					ctx.stroke();
				}
			}
			
			ctx.beginPath();
			ctx.stroke();
		}
		
		if (gs.mouse_mode === 'trim'){
			//is dragging for trim
			end_x = x;
			end_y = y;
			//draw bounding box
			ctx.beginPath();
			ctx.rect(start_x,start_y,end_x-start_x,end_y-start_y);
			ctx.stroke();
			//this is a hack to get the screen to redraw correctly. 
			ctx.beginPath();
			ctx.stroke();
		}
		if (gs.mouse_mode === 'cut'){
			//is dragging for cut
			end_x = x;
			end_y = y;
			//draw bounding box
			ctx.beginPath();
			ctx.rect(start_x,start_y,end_x-start_x,end_y-start_y);
			ctx.stroke();
			//this is a hack to get the screen to redraw correctly. 
			ctx.beginPath();
			ctx.stroke();
		}
		if (gs.mouse_mode === 'x-c'){
			label = mjs_precision(px,gs.y_precision+1);
			ctx.fillText('x-'+label,x+cs*2,y-cs*2);
			ctx.beginPath();
			ctx.moveTo(x,0);
			ctx.lineTo(x,canvas.height);
			ctx.stroke();
			ctx.beginPath();
			ctx.stroke();
		}
		if (gs.mouse_mode === 'y-c'){
			label = mjs_precision(py,gs.y_precision+1);
			ctx.fillText('y-'+label,x+cs*2,y-cs*2);
			ctx.beginPath();
			ctx.moveTo(0,y);
			ctx.lineTo(canvas.width,y);
			ctx.stroke();
			ctx.beginPath();
			ctx.stroke();
		}
		if (gs.mouse_mode === 'sublin'){
			ctx.fillText('draw line to subtract',x+cs*2,y-cs*2);
			ctx.beginPath();
			ctx.moveTo(start_x,start_y);
			ctx.lineTo(x,y);
			ctx.stroke();
			ctx.beginPath();
			ctx.stroke();
		}
		
		if (gs.mouse_mode === 'mouse'){
			
			graph.ui.mouse_is_dragging = false;
			
			//distance from fit text handle
			var d = Math.sqrt(Math.pow(start_x-gs.fit_text_position.x*canvas.width,2)+Math.pow(start_y-gs.fit_text_position.y*canvas.height,2));
			if (d<2*cs){
				ctx.beginPath();
				ctx.moveTo(start_x,start_y);
				ctx.lineTo(x,y);
				ctx.stroke();
				graph.ui.mouse_is_dragging = true;
				graph.ui.drag_object = 'fit_text';
				return;
			}
			
			//distance from title spacing handle
			d = Math.sqrt(Math.pow(start_x-canvas.width/2,2)+Math.pow((start_y-(gs.tick_len+gs.title_spacing+gs.title_font_size)*gs.scaling_factor),2));
			if (d<2*cs){
				ctx.beginPath();
				ctx.moveTo(canvas.width/2,start_y);
				ctx.lineTo(canvas.width/2,y); //force a vertical line
				ctx.stroke();
				graph.ui.mouse_is_dragging = true;
				graph.ui.drag_object = 'title_spacing';
				return;
			}
			//distance from caption handle
			var cap_x = gs.scaling_factor*gs.caption_position.x;
			if (gs.caption_position.x>0){
				cap_x += gs.scaling_factor*gs.tick_len;
			} else {
				cap_x = canvas.width + cap_x;
				cap_x -= gs.scaling_factor*gs.tick_len;
			}
			cap_y = gs.scaling_factor*gs.caption_position.y;
			if (gs.caption_position.y>0){
				//going down from top
				cap_y += gs.scaling_factor*gs.tick_len;
			} else {
				//up from botton
				cap_y = canvas.height + cap_y;
				cap_y -= gs.scaling_factor*gs.tick_len;
			}
			d = Math.sqrt(Math.pow(start_x-cap_x,2) + Math.pow(start_y-cap_y,2));
			if (d<2*cs){
				ctx.beginPath();
				ctx.moveTo(start_x,start_y);
				ctx.lineTo(x,y);
				ctx.stroke();
				
				var l = 2*cs;
				ctx.beginPath();
				
				if (x>canvas.width/2 && y>canvas.height/2){
					ctx.moveTo(x-l,y);ctx.lineTo(x,y);ctx.lineTo(x,y-l);
				}
				if (x>canvas.width/2 && y<canvas.height/2){
					ctx.moveTo(x-l,y);ctx.lineTo(x,y);ctx.lineTo(x,y+l);
				}
				if (x<canvas.width/2 && y>canvas.height/2){
					ctx.moveTo(x+l,y);ctx.lineTo(x,y);ctx.lineTo(x,y-l);
				}
				if (x<canvas.width/2 && y<canvas.height/2){
					ctx.moveTo(x+l,y);ctx.lineTo(x,y);ctx.lineTo(x,y+l);
				}
				ctx.stroke();
				
				graph.ui.mouse_is_dragging = true;
				graph.ui.drag_object = 'caption_position';
				
				return;
			}
			
			//go through the markers and find the item being clicked
			var best = 1e200;
			var bi = 0;
			var bj = 0;
			var d = 1e200;
			for (var i=0;i<gs.markers.length;i++){
				var m = gs.markers[i];
				for (var j=0;j<m.handles.length;j++){
					d = Math.sqrt( Math.pow(start_x - graph.units_to_pixels(m.handles[j][0],'x'),2) + 
					Math.pow(start_y - graph.units_to_pixels(m.handles[j][1],'y'),2));
					if (d<best){
						best = d;
						bi = i;
						bj = j;
					}
						
				}
			}
			if (best<2*cs){
				//have picked up a marker by it's handle, i , j 
				graph.ui.mouse_is_dragging = true;
				graph.ui.drag_object = {item:'marker',i:bi,j:bj};
				//draw construction lines. All of them!
				ctx.strokeStyle=renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				ctx.moveTo(0,y);
				ctx.lineTo(canvas.width,y);
				ctx.moveTo(x,0);
				ctx.lineTo(x,canvas.height);
				
				var newhandles = clone( gs.markers[bi].handles );
				var tempMarker = clone(gs.markers[bi]);
				
				if (gs.markers[bi].handles.length == 2){
					
					var ox = graph.units_to_pixels(gs.markers[bi].handles[(bj+1)%2][0],'x');
					var oy = graph.units_to_pixels(gs.markers[bi].handles[(bj+1)%2][1],'y');
					
					var o = modify_for_snap(x,y,ox,oy,2*cs)
					x = o.rx;
					y = o.ry;
					// between the other marker and the new
					ctx.moveTo(ox,oy);
					ctx.lineTo(x,y);
					// between the other marker and the new
					ctx.moveTo(ox,oy);
					ctx.lineTo(x,oy);
					ctx.moveTo(ox,oy);
					ctx.lineTo(ox,y);
					
				} else { // a signle handle
				//from old position to new
					ctx.moveTo(graph.units_to_pixels(gs.markers[bi].handles[bj][0],'x'),
					graph.units_to_pixels(gs.markers[bi].handles[bj][1],'y'));
					ctx.lineTo(x,y);
				}
				ctx.stroke();
				newhandles[bj] = [ graph.pixels_to_units(x,'x'),graph.pixels_to_units(y,'y') ];
				tempMarker.handles = newhandles;
				drawMarker(graph,canvas,ctx,tempMarker);
				return;
			}
			//go through marker centers
			for (var i=0;i<gs.markers.length;i++){
				var m = gs.markers[i];
				d = Math.sqrt( Math.pow(start_x - graph.units_to_pixels(m.x,'x'),2) + 
				Math.pow(start_y - graph.units_to_pixels(m.y,'y'),2));
				if (d<best){
					best = d;
					bi = i;
				}
			}
			if (best<2*cs){
				//have picked up a marker by it's center handle, i , j 
				graph.ui.mouse_is_dragging = true;
				graph.ui.drag_object = {item:'markercenter',i:bi};
				ctx.strokeStyle=renderColor(canvas,ctx,gs.color_fg);
				ctx.beginPath();
				ctx.moveTo(0,y);
				ctx.lineTo(canvas.width,y);
				ctx.moveTo(x,0);
				ctx.lineTo(x,canvas.height);
				ctx.stroke();
				var dx = x - graph.units_to_pixels(gs.markers[bi].x,'x');
				var dy = y - graph.units_to_pixels(gs.markers[bi].y,'y');
				var newhandles = [];
				for (var i=0;i<gs.markers[bi].handles.length;i++){
					newhandles.push([  graph.pixels_to_units(graph.units_to_pixels(gs.markers[bi].handles[i][0] ,'x') + dx,'x')  ,
					graph.pixels_to_units(graph.units_to_pixels( gs.markers[bi].handles[i][1] ,'y') + dy,'y')  ]);
					
				}
				var tempMarker = clone(gs.markers[bi]);
				tempMarker.handles = newhandles
				drawMarker(graph,canvas,ctx,tempMarker);
				
				
				return;
			}
		}
		
		if ( gs.mouse_mode === 'add2ptmarker'){
			ctx.lineWidth = gs.graph_line_thickness * gs.scaling_factor;
			markerDrawing[graph.ui.addMarker](graph,canvas,ctx,graph.ui.addMarkerText,[[start_x,start_y],[x,y]],0.55*edge);
		}
		if ( gs.mouse_mode === 'add1ptmarker'){
			ctx.lineWidth = gs.graph_line_thickness * gs.scaling_factor;
			markerDrawing[graph.ui.addMarker](graph,canvas,ctx,graph.ui.addMarkerText,[[x,y]],0.55*edge);
		}
	}
}

var markerDrawing={
	line : function(graph,canvas,ctx,text,pts,h){
		ctx.beginPath();
		ctx.moveTo(pts[0][0],pts[0][1]);
		ctx.lineTo(pts[1][0],pts[1][1]);
		ctx.stroke();
		if (text){markerDrawing._offSetText(canvas,ctx,text,pts,h,0) }
	},
	brace : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		var xm = (x1+x2)/2;
		var ym = (y1+y2)/2;
		var t = Math.atan((y2-y1)/(x2-x1)) - Math.PI/2;
		if (x1>x2){t+=Math.PI};
		var box = h*Math.cos(t);
		var boy = h*Math.sin(t);
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.quadraticCurveTo(x1+box,y1+boy, (x1+xm+box)/2, (y1+ym+boy)/2);
		ctx.quadraticCurveTo(xm,ym, xm+box, ym+boy);	
		ctx.moveTo(x2,y2);
		ctx.quadraticCurveTo(x2+box,y2+boy, (x2+xm+box)/2, (y2+ym+boy)/2);
		ctx.quadraticCurveTo(xm,ym, xm+box, ym+boy);
		ctx.stroke();
		if (text){markerDrawing._offSetText(canvas,ctx,text,pts,h,h) }
	},
	bracket : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		var xm = (x1+x2)/2;
		var ym = (y1+y2)/2;
		var t = Math.atan((y2-y1)/(x2-x1)) - Math.PI/2;
		if (x1>x2){t+=Math.PI};
		var box = h*Math.cos(t);
		var boy = h*Math.sin(t);
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x1+box,y1+boy);
		ctx.lineTo(x2+box,y2+boy);
		ctx.lineTo(x2,y2);
		ctx.stroke();
		if (text){markerDrawing._offSetText(canvas,ctx,text,pts,h,h) }
	},
	span : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		var xm = (x1+x2)/2;
		var ym = (y1+y2)/2;
		var t = Math.atan((y2-y1)/(x2-x1)) - Math.PI/2;
		if (x1>x2){t+=Math.PI};
		var box = h*Math.cos(t)/2;
		var boy = h*Math.sin(t)/2;
		ctx.beginPath();
		ctx.moveTo(x1-box,y1-boy);
		ctx.lineTo(x1+box,y1+boy);
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.moveTo(x2-box,y2-boy);
		ctx.lineTo(x2+box,y2+boy);
		ctx.stroke();
		if (text){markerDrawing._offSetText(canvas,ctx,text,pts,h,0) }
	},
	arch : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		var xm = (x1+x2)/2;
		var ym = (y1+y2)/2;
		var t = Math.atan((y2-y1)/(x2-x1)) - Math.PI/2;
		if (x1>x2){t+=Math.PI};
		var box = h*Math.cos(t);
		var boy = h*Math.sin(t);
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.quadraticCurveTo(x1+box,y1+boy, xm+box, ym+boy);
		ctx.quadraticCurveTo(x2+box,y2+boy, x2, y2);	
		ctx.stroke();
		if (text){markerDrawing._offSetText(canvas,ctx,text,pts,h,h) }
	},
	arrows:function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		var t = Math.atan((y2-y1)/(x2-x1));
		t -= Math.PI/2;
		if (x1>x2){t+=Math.PI}
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		ctx.lineTo(x2,y2);
		ctx.stroke();
		drawArrow(ctx,x1,y1,h/6, t+3*Math.PI/2);
		drawArrow(ctx,x2,y2,h/6, t+Math.PI/2);
		if (text){markerDrawing._offSetText(canvas,ctx,text,pts,h,0) }
	},
	extended : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		var g = (y2-y1)/(x2-x1);
		var c = y1 - g*x1;
		var gi = (x2-x1)/(y2-y1);
		var ci = x1 - gi*y1;
		var textheight =h; 
		var w = canvas.width;
		var h = canvas.height;
		var xaxis = 0;
		var yaxis = 1;
		if (Math.abs(g) > Math.abs(gi) ){
			// invert everything.
			w = canvas.height;
			h = canvas.width;
			xaxis = 1;
			yaxis = 0;
			g = gi;
			c = ci;
		}
		var left =  c;
		var right = w * g + c;
		var top = (0-c)/g;
		var bottom = (h - c)/g;
		
		var edges = [];
		if(left >= 0 && left <= h){
			 edges.push([0,left]);
		 }
		if(right >= 0 && right <= h){
			 edges.push([w,right]);
		 } 
		 if (top > 0 && top < w){
			 edges.push([top,0]);
		 }
		 if (bottom > 0 && bottom < w){
			 edges.push([bottom,h]);
		 }
		if (edges.length >= 2){
			ctx.beginPath();
			ctx.moveTo(edges[0][xaxis],edges[0][yaxis]);
			ctx.lineTo(edges[1][xaxis],edges[1][yaxis]);
			ctx.stroke();
		}
		if (text){markerDrawing._offSetText(canvas,ctx,text,pts,textheight,0) }
	},
	_collisionFreeLine:function(ctx,x1,y1,x2,y2,text,h){
		var p=h/5;
		ctx.beginPath();
		ctx.moveTo(x1,y1);
		if (text){
			ctx.textAlign="center";
			var w = ctx.measureText(text).width;
			var minX = x2-w/2-p;
			var maxX = x2+w/2+p;
			var minY = y2-h/2-p;
			var maxY= y2+h/2+p;
			if ((minX <= x1 && x1 <= maxX) && (minY <= y1 && y1 <= maxY)){
				ctx.fillText(text,x2,y2);
				return;
			}
			var midX = (minX + maxX) / 2;
			var midY = (minY + maxY) / 2;
			var m = (midY - y1) / (midX - x1);
			if (x1 < midX) { // check "left" side
				var minXy = m * (minX - x1) + y1;
				if (minY < minXy && minXy < maxY)
					ctx.lineTo(minX,minXy);
			}  	if (x1 > midX) { // check "right" side
				var maxXy = m * (maxX - x1) + y1;
				if (minY < maxXy && maxXy < maxY)
					ctx.lineTo(maxX,maxXy);
			}  	if (y1 < midY) { // check "top" side
				var minYx = (minY - y1) / m + x1;
				if (minX < minYx && minYx < maxX)
					ctx.lineTo(minYx,minY);
			}  	if (y1 > midY) { // check "bottom" side
				var maxYx = (maxY - y1) / m + x1;
				if (minX < maxYx && maxYx < maxX)
					ctx.lineTo(maxYx,maxY);
			}
			ctx.stroke();
			ctx.fillText(text,x2,y2+h/3);
		} else {
			ctx.lineTo(x2,y2);
			ctx.stroke();
		}
	},
	arrow:function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		markerDrawing._collisionFreeLine(ctx,x2,y2,x1,y1,text,h)
		var angle = Math.atan((y2-y1)/(x2-x1)) + ((x2>=x1)?Math.PI:0);
		drawArrow(ctx,x2,y2,h/6, angle + Math.PI);
	},
	lolli:function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		markerDrawing._collisionFreeLine(ctx,x2,y2,x1,y1,text,h)
		ctx.beginPath();
		ctx.arc(x2,y2,h/4,0,Math.PI*2,false);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	},
	_diagLine:function(ctx,x1,y1,x2,y2,text,h){
		var dx = x2>x1?1:-1;
		var dy = y2>y1?1:-1;
		var ox = 0;
		var oy = 0;
		var p=0;
		var w =0;
		if (text){
			ctx.textAlign="center";
			ctx.fillText(text,x1,y1);
			w = ctx.measureText(text).width;
			p = h/5;
		} 
		ctx.beginPath();
		ctx.moveTo(x1-dx*w/2-dx*p,y1+p);
		ctx.lineTo(x1+dx*w/2+dx*p,y1+p);
		if (Math.abs(y2-y1) < Math.abs(x2-x1 - dx*w/2) && Math.abs(x2-x1) > Math.abs(w/2) ){
			ox = x1+dx*w/2+dx*p+dx*Math.abs(y2-y1); oy = y2;
		} else {
			if(w/2+p >= Math.abs(x2-x1)){
				if (y2<y1){
					ctx.lineTo(x1+dx*w/2+dx*p*2+dx*h,y1+p);
					ox = x2;oy=y1 - dx*( dx*w/2+dx*p*2+dx*h - (x2-x1) );
				} else {
					ox = x2; oy = y1+p;
				}
			} else {
				ox = x2;oy=y1 - p*dy + dy*dx*(x2-x1-dx*w/2)
			}
		}
		//allow diagonal arrow heads if it is very close to the corner.
		if (Math.abs( ox - x2) < h/2 && Math.abs(oy-y2) < h/2  ){
			ox = x1;oy=y1;
		} else{
			ctx.lineTo(ox,oy);
		}
		ctx.lineTo(x2,y2);
		ctx.stroke();
		var angle = Math.atan((y2-oy)/(x2-ox)) + ((x2>=ox)?0:Math.PI);
		angle = Math.round(angle / (2*Math.PI) * 8) * Math.PI * 2 / 8;
		return angle;
	},
	diagArrow:function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		drawArrow(ctx,x2,y2,h/6, markerDrawing._diagLine(ctx,x1,y1,x2,y2,text,h) );
	},
	diagLolli:function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		markerDrawing._diagLine(ctx,x1,y1,x2,y2,text,h);
		ctx.beginPath();
		ctx.arc(x2,y2,h/4,0,Math.PI*2,false);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	},
	//includes an extra paramter for the offset, usually o=h. 
	_offSetText : function(canvas,ctx,text,pts,h,o){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		//find out where to place the text!
		var w = ctx.measureText(text).width;
		var xm = (x1+x2)/2;
		var ym = (y1+y2)/2;
		var t = Math.atan((y2-y1)/(x2-x1));
		t -= Math.PI/2;
		if (x1>x2){t+=Math.PI};
		var sw =0.8*Math.sin(2*t)*w;
		var mag =  Math.abs(Math.cos(t) * (w- Math.abs(sw))/2)+h;
		if (x1>x2){sw*=-1.0;};	
		var ox = mag * Math.cos(t);
		var oy = mag*Math.sin(t);
		var box = o*Math.cos(t);
		var boy = o*Math.sin(t);
		ctx.textAlign="center";
		ctx.fillText(text,xm+ox+box-sw/2,ym+oy+boy+h/2);
	},
	text : function(graph,canvas,ctx,text,pts,h){
		ctx.textAlign="center";
		ctx.fillText(text,pts[0][0],pts[0][1]);
	},
	boxedText : function(graph,canvas,ctx,text,pts,h){
		ctx.textAlign="center";
		var p = h/5;
		var line_thickness = graph.graphics_style.line_thickness;
		var w = ctx.measureText(text).width;
		//ctx.fillText(text,pts[0][0],pts[0][1]);
		var x = pts[0][0];
		var y = pts[0][1];
		ctx.lineWidth = line_thickness/2;
		ctx.fillStyle = renderColor(canvas,ctx,graph.graphics_style.color_bg);// #TODO check this
		ctx.fillRect(x-w/2-p-line_thickness,y-h-p-line_thickness,w+2*p+2*line_thickness,h+2*p+2*line_thickness);
		ctx.beginPath()
		ctx.rect(x-w/2-p-line_thickness,y-h-p-line_thickness,w+2*p+2*line_thickness,h+2*p+2*line_thickness);
		ctx.stroke();
		ctx.fillStyle = renderColor(canvas,ctx,graph.graphics_style.color_fg);
		ctx.fillText(text,x, y);
		ctx.lineWidth = line_thickness;
	},
	/*
	logo: function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		//ctx.rect(x1,y1,x2-x1,y2-y1);
		drawLogo(graph,ctx,Math.min(x1,x2),Math.min(y1,y2), Math.abs(x2-x1) ,Math.abs(y2-y1));
	},*/
	pin: function(graph,canvas,ctx,text,pts,h){
		var bgfill = renderColor(canvas,ctx,graph.graphics_style.color_bg);
		drawPin(ctx,pts[0][0],pts[0][1],text,h,bgfill);
	},
	vline : function(graph,canvas,ctx,text,pts,h){
		ctx.beginPath();
		ctx.moveTo(pts[0][0],0);
		ctx.lineTo(pts[0][0],canvas.height);
		ctx.stroke();
		if (text){
			ctx.textAlign="left";
			ctx.fillText(text,pts[0][0]+h/5, pts[0][1]);
		}
	},
	hline : function(graph,canvas,ctx,text,pts,h){
		ctx.beginPath();
		ctx.moveTo(0,pts[0][1]);
		ctx.lineTo(canvas.width,pts[0][1]);
		ctx.stroke();
		if (text){
			ctx.textAlign="center";
			ctx.fillText(text,pts[0][0], pts[0][1]-h/5);
		}
	},
	_textAroundShape: function(ctx,x1,y1,x2,y2,text,h){
		ctx.textAlign="center";
		if (y1>y2){
			ctx.fillText(text,(x1+x2)/2, y1+h+ h/5+ctx.lineWidth);
		} else {
			ctx.fillText(text,(x1+x2)/2, y1-h/3-h/5-ctx.lineWidth);
		}
	},
	box : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		ctx.beginPath();
		ctx.rect(x1,y1,x2-x1,y2-y1);
		ctx.stroke();
		if (text){
			markerDrawing._textAroundShape(ctx,x1,y1,x2,y2,text,h);
		}
	},
	cBox : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		ctx.beginPath();
		ctx.rect(x1,y1,x2-x1,y2-y1);
		ctx.fill();
		if (text){
			markerDrawing._textAroundShape(ctx,x1,y1,x2,y2,text,h);
		}
	},
	ellipse : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		var xm = (x1+x2)/2;
		var ym = (y1+y2)/2;
		ctx.beginPath();
		ctx.moveTo(x1,ym);
		ctx.quadraticCurveTo(x1,y1,xm,y1);
		ctx.quadraticCurveTo(x2,y1,x2,ym);
		ctx.quadraticCurveTo(x2,y2,xm,y2);
		ctx.quadraticCurveTo(x1,y2,x1,ym);
		ctx.closePath();
		ctx.stroke();
		if (text){
			markerDrawing._textAroundShape(ctx,x1,y1,x2,y2,text,h);
		}
	},
	cEllipse : function(graph,canvas,ctx,text,pts,h){
		var x1 = pts[0][0];
		var y1 = pts[0][1];
		var x2 = pts[1][0];
		var y2 = pts[1][1];
		var xm = (x1+x2)/2;
		var ym = (y1+y2)/2;
		ctx.beginPath();
		ctx.moveTo(x1,ym);
		ctx.quadraticCurveTo(x1,y1,xm,y1);
		ctx.quadraticCurveTo(x2,y1,x2,ym);
		ctx.quadraticCurveTo(x2,y2,xm,y2);
		ctx.quadraticCurveTo(x1,y2,x1,ym);
		ctx.closePath();
		ctx.fill();
		if (text){
			markerDrawing._textAroundShape(ctx,x1,y1,x2,y2,text,h);
		}
	},
	Ltext : function(graph,canvas,ctx,text,pts,h){
		ctx.textAlign="left";
		ctx.fillText(text,pts[0][0],pts[0][1] );
	},
	Rtext : function(graph,canvas,ctx,text,pts,h){
		ctx.textAlign="right";
		ctx.fillText(text,pts[0][0],pts[0][1] );
	},
	Ctext : function(graph,canvas,ctx,text,pts,h){
		ctx.textAlign="center";
		ctx.fillText(text,pts[0][0],pts[0][1] );
	},
	CTBox : function(graph,canvas,ctx,text,pts,h){
		var x = pts[0][0];
		var y = pts[0][1];
		var line_thickness = ctx.lineWidth;
		var fillColor = ctx.fillStyle; // for the text.
		var p = h/5;
		var w = ctx.measureText(text).width;
		ctx.fillStyle = renderColor(canvas,ctx,graph.graphics_style.color_bg);
		ctx.beginPath();
		ctx.rect(x-w/2-p-line_thickness,y-h-p-line_thickness,w+2*p+2*line_thickness,h+2*p+2*line_thickness);
		ctx.fill();
		ctx.stroke();
		ctx.fillStyle = fillColor;
		ctx.textAlign="center";
		ctx.fillText(text,x, y);
	},
	RTBox : function(graph,canvas,ctx,text,pts,h){
		var x = pts[0][0];
		var y = pts[0][1];
		var line_thickness = ctx.lineWidth;
		var fillColor = ctx.fillStyle; // for the text.
		var p = h/5;
		var w = ctx.measureText(text).width;
		ctx.fillStyle = renderColor(canvas,ctx,graph.graphics_style.color_bg);//graph.graphics_style.color_bg;
		ctx.beginPath()
		ctx.rect(x -w-2*p-2*line_thickness,y-h-p-line_thickness,w+2*p+2*line_thickness,h+2*p+2*line_thickness);
		ctx.fill();
		ctx.stroke();
		ctx.fillStyle = fillColor;
		ctx.textAlign="right";
		ctx.fillText(text,x - p - line_thickness , y);
	},
	LTBox : function(graph,canvas,ctx,text,pts,h){
		var x = pts[0][0];
		var y = pts[0][1];
		var line_thickness = ctx.lineWidth;
		var fillColor = ctx.fillStyle; // for the text.
		var p = h/5;
		var w = ctx.measureText(text).width;
		ctx.fillStyle = renderColor(canvas,ctx,graph.graphics_style.color_bg);
		ctx.beginPath()
		ctx.rect(x,y-h-p-line_thickness,w+2*p+2*line_thickness,h+2*p+2*line_thickness);
		ctx.fill();
		ctx.stroke();
		ctx.fillStyle = fillColor;
		ctx.textAlign="left";
		ctx.fillText(text,x + p + line_thickness , y);
	},
	
}
function arraySwap(a,i,j){
	var t =  a[i];
	a[i] = a[j];
	a[j] = t;
}
function swapLeft(a,i){
	arraySwap(a,i, Math.max(0,i-1));
}
function swapRight(a,i){
	 arraySwap(a,i, Math.min(a.length-1,i+1));
}

function colorReplacement(color,graph){
	if (color.indexOf('%')>-1){
		color = color.replace( '%fg',  graph.graphics_style.color_fg );
		color = color.replace( '%bg',  graph.graphics_style.color_bg );
		color = color.replace( '%mg',  graph.graphics_style.color_mg );
		//copy from the line colors
		var color_idx = color.indexOf('%')
		if (color_idx > -1){
			color = graph.colors_backup[ parseInt(color.slice(color_idx+1,color_idx+3) ) % graph.colors_backup.length ];
		}
	}
	return color;
}

function drawMarker(graph,canvas,ctx,marker){
	var handles = marker.handles;
	var gs = graph.graphics_style;
	var pts = [];
	marker.x = 0;
	marker.y = 0;
	for (var j=0,l=handles.length;j<l;j++){
		marker.x += handles[j][0];
		marker.y += handles[j][1];
		pts.push( [ graph.units_to_pixels(handles[j][0],'x') , graph.units_to_pixels(handles[j][1],'y') ] );
	}
	marker.x /= handles.length;
	marker.y /= handles.length;
	// if marker has a specific color change the drawing context here. 
	// the markerDrawing methods assume a correctally setup drawing context.
	//
	var h = gs.axis_labels_font_size*gs.scaling_factor;
	if (marker.font){
		var newh = parseFloat(marker.font);
		if (newh && newh > 0){
			h = h*newh
			ctx.font = h + 'px ' + (marker.font.split(' ').slice(1).join(' '));
		} else{
			ctx.font = h + 'px ' + marker.font;
		}
	} else {
		ctx.font= h + 'px ' + gs.font_name//"14px Courier New";
	}
	ctx.lineWidth = gs.graph_line_thickness * gs.scaling_factor;
	
	if (marker.stroke){
		ctx.strokeStyle = renderColor(canvas,ctx,colorReplacement(marker.stroke,graph));
	} else {
		ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
	}
	if (marker.color){
		ctx.fillStyle = renderColor(canvas,ctx,colorReplacement(marker.color,graph));
	} else {
		ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
	}
	
	//process the text replacements
	var text = marker.text;
	if(text && text.indexOf('%')>-1){
		if (handles.length ==2){
			text = text.replace( '%g', measureGradString(graph, (handles[1][1]-handles[0][1])/(handles[1][0]-handles[0][0] )  ) );
			text = text.replace( '%dx', measureDeltaString(graph, handles[1][0]-handles[0][0] ,'x') );
			text = text.replace( '%dy', measureDeltaString(graph, handles[1][1]-handles[0][1] ,'y') );
			text = text.replace( '%y1',  graph.get_axis_string( handles[0][1] ,'y') );
			text = text.replace( '%y2',  graph.get_axis_string( handles[1][1] ,'y') );
			text = text.replace( '%x1',  graph.get_axis_string( handles[0][0] ,'x') );
			text = text.replace( '%x2',  graph.get_axis_string( handles[1][0] ,'x') );
			
		}
		if (handles.length ==1){
			text = text.replace( '%x1',  graph.get_axis_string( handles[0][0] ,'x') );
			text = text.replace( '%y1',  graph.get_axis_string( handles[0][1] ,'y') );
			text = text.replace( '%x',  graph.get_axis_string( handles[0][0] ,'x') );
			text = text.replace( '%y',  graph.get_axis_string( handles[0][1] ,'y') );
		}
		text = text.replace( '%time',  mjs_date_print(Date.now(),3,5)  );
		text = text.replace( '%isodatetime',  mjs_date_print(Date.now(),0,4)  );
		text = text.replace( '%datetime',  mjs_date_print(Date.now(),1,4)  );
		text = text.replace( '%date',  mjs_date_print(Date.now(),1,2)  );
		text = text.replace( '%author',  "Matthew Sarsby"  );
		
	}
	
	markerDrawing[marker.type](graph,canvas,ctx,text,pts,h);
}

function mouse_down_event(event,graph){
		if (graph.graphics_style.interactivity === 'none'){ return }
		mouse_down = true;
		var canvas = graph.canvas;
		var ctx = canvas.getContext('2d');
		var rect = canvas.getBoundingClientRect();
		start_x = event.clientX - rect.left;
		start_y = event.clientY - rect.top;
		
		if (mjs_plot.CTRL){
			var n = modify_for_grid_snap(graph,start_x,start_y);
			start_x = n.rx;
			start_y = n.ry;
		}
		
		//freeze the scaling stuff in place for the duration of the drag
		drag_x_max = graph.pixels_to_units(canvas.width,'x');
		drag_x_min = graph.pixels_to_units(0,'x');
		drag_y_max = graph.pixels_to_units(0,'y');
		drag_y_min = graph.pixels_to_units(canvas.height,'y');
		
		//if using the middle mouse button go to the drag mouse mode regardless. 
		//if the spacebar is held down also force the drag option.
		if (event.button == 1 || mjs_plot.SPACE ){
			graph.ui.middleMouseDragRecoveryMode = graph.graphics_style.mouse_mode;
			graph.ui.isMiddleMouseDrag = true;
			graph.graphics_style.mouse_mode = 'drag';
		}
		
}
var dotcount = 0;

function bail_middle_mouse_drag(graph){
	if (graph.ui.isMiddleMouseDrag){
		graph.ui.isMiddleMouseDrag = false;
		graph.graphics_style.mouse_mode = graph.ui.middleMouseDragRecoveryMode;
	}
}

function mouse_out_event(event,graph){
	var canvas = graph.canvas;
	var ctx = canvas.getContext('2d');
	ctx.putImageData(graph.graph_image,0,0);
	graph.ui.anymenu = false;
	graph.drawfxmenu = false;
	graph.drawlinemenu = false;
	graph.drawmodemenu=false;
	graph.drawfitsmenu = false;
	graph.drawtimemenu = false;
	graph.drawgraphmenu = false;
	graph.drawapplystylemenu = false;
	graph.drawremakecolormenu = false;
	graph.drawremakesymbolsmenu = false;
	graph.drawcaptionmenu=false;
	bail_middle_mouse_drag(graph);
	graph.drawxmenu=false;
	graph.drawymenu=false;
	graph.drawgridmenu=false;
	if (graph.graphics_style.o == 1 ){
		graph.graphics_style.mouse_mode = graph.pre_mouse_mode;
		graph.graphics_style.o = 0;
	}
	mjs_plot.activeGraph = false;
}

//internal function to aid starting adding a marker.
function _startAddNewMarker(graph,type,text,numberOfNodes,extras){
	graph.pre_mouse_mode = graph.graphics_style.mouse_mode;
	graph.ui.addMarker = type;
	graph.ui.addMarkerExtras = extras;
	graph.ui.addMarkerText = text;
	switch (numberOfNodes){
		case 1:
			graph.graphics_style.mouse_mode = "add1ptmarker";
			break
		case 2:
			graph.graphics_style.mouse_mode = "add2ptmarker"
			break
	}
}


function applyDashMode(ctx,dash_mode,line_thickness){
	var dashVector = [];
	if (lineDashModes[dash_mode]){
		for (var lineDashIndex=0;lineDashIndex<lineDashModes[dash_mode].length;lineDashIndex++){
			dashVector[lineDashIndex] = lineDashModes[dash_mode][lineDashIndex]  * line_thickness;
		}
		ctx.setLineDash(dashVector);
	} else if (buildDashArrayFromString(dash_mode)){
		dashVector = buildDashArrayFromString(dash_mode)
		for (var lineDashIndex=0;lineDashIndex<dashVector.length;lineDashIndex++){
			dashVector[lineDashIndex] = dashVector[lineDashIndex]  * line_thickness;
		}
		ctx.setLineDash(dashVector);
	}
}

function addMarker(graph,type,text,handles,extras){
		r = {type:type,
			text:text,
			handles:handles,
			layer:1}
		for (var key in extras) {
		  if (extras.hasOwnProperty(key)) {
			r[key] = extras[key];
		  }
		}
		graph.graphics_style.markers.push(r);
	}

function mouse_wheel_handler(event,graph) {
	if (graph.graphics_style.interactivity === 'none'){ return }
	
	console.log('scrolling');
	event.preventDefault();
	event.stopPropagation(); //this should stop the page scrolling by when you mean to scroll the graph. 
	// cross-browser wheel delta
	var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
	//negative is outwards posative is inwards
	
	var ac = 4.1*delta;
	var rect = graph.canvas.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	var leftness = x / graph.canvas.width;
	var topness = y / graph.canvas.height;
	gs = graph.graphics_style;
	if (x > graph.ui.size && x < graph.canvas.width - graph.ui.size){
		gs.x_manual_min = graph.pixels_to_units(gs.widthx*ac*leftness,'x');
		gs.x_manual_max = graph.pixels_to_units(graph.canvas.width-gs.widthx*ac*(1-leftness),'x');
	}
	if (y > graph.ui.size && y < graph.canvas.height - graph.ui.size){
		gs.y_manual_max = graph.pixels_to_units(gs.widthy*ac*topness,'y');
		gs.y_manual_min = graph.pixels_to_units(graph.canvas.height-gs.widthy*ac*(1-topness),'y');
	}
	
	gs.x_scale_auto_min = false;
	gs.y_scale_auto_min = false;
	gs.x_scale_auto_max = false;
	gs.y_scale_auto_max = false;
	gs.y_scale_tight = true;
	gs.x_scale_tight = true;

	graph.draw();
	
	return false;
}

function keypress_event(event){
	var c = String.fromCharCode(event.keyCode || event.charCode);

	//console.log(event.key);
	if (event.type === 'keydown' && event.key==='Shift'){
		mjs_plot.SHIFT = true;
	}
	if (event.type === 'keyup' && event.key==='Shift'){
		mjs_plot.SHIFT = false;
	}
	if (event.type === 'keydown' && event.key==='Control'){
		mjs_plot.CTRL = true;
	}
	if (event.type === 'keyup' && event.key==='Control'){
		mjs_plot.CTRL = false;
	}
	
	if (event.type === 'keydown' && event.key===' '){
		mjs_plot.SPACE = true;
	}
	if (event.type === 'keyup' && event.key===' '){
		mjs_plot.SPACE = false;
	}
	if (event.type === 'keydown' && mjs_plot.activeGraph){
		g = mjs_plot.activeGraph;
		gs = g.graphics_style;
		if (gs.interactivity === 'none'){ return }
	//function menu
	if (g.drawfxmenu){
		if ( event.key==='c'){
			g.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'cut';
		}
		if ( event.key==='t'){
			g.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'trim';
		}
		if ( event.key==='r'){
			g.graphics_style.data_transforms = [];
			g.graphics_style.data_transforms_args = [];
			g.mjs_plot();
		}
		if ( event.key==='p'){
			g.graphics_style.data_transforms.pop();
			g.graphics_style.data_transforms_args.pop();
			g.mjs_plot();
		}
		if ( event.key==='s'){
			transforms.applySmooth(g);
			g.mjs_plot();
		}
		if ( event.key==='v'){
			g.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'x-c';
		}
		if ( event.key==='h'){
			g.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'y-c';
		}
		if ( event.key==='l'){
			g.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'sublin';
		}
		g.drawfxmenu = false;
		mouse_move_event(event,g);
		return
	}
	
	if ( event.key==='f'){
		g.drawfxmenu = !g.drawfxmenu;
		//need to move a fake mouse to over the function menue
		var rect = g.canvas.getBoundingClientRect();
		var x = 10 * g.ui.size;
		var y = g.canvas.height -  2*g.ui.size;
		event.clientX = x + rect.left;
		event.clientY = y + rect.top;
		mouse_move_event(event,g);
	}
	
	
	if ( event.key==='z'){
		gs.mouse_mode = 'zoom';
		mouse_move_event(event,g);
	}
	if ( event.key==='d'){
		gs.mouse_mode = 'drag';
		g.needs_drag_image = true;
		g.mjs_plot();
		//mouse_move_event(event,mjs_plot.activeGraph);
	}
	if ( event.key==='m'){
		gs.mouse_mode = 'measure';
		mouse_move_event(event,g);
	}
	if ( event.key==='c'){
		gs.mouse_mode = 'mouse';
		mouse_move_event(event,g);
	}
	if ( event.key==='r'){
		gs.mouse_mode = 'reader';
		mouse_move_event(event,gs);
	}
	if ( event.key==='a'){
		gs.x_scale_auto_max = true;
		gs.x_scale_auto_min = true;
		gs.y_scale_auto_max = true;
		gs.y_scale_auto_min = true;
		g.draw();
	}
	
	function arrowmove(){
		gs.x_scale_auto_min = false;
		gs.y_scale_auto_min = false;
		gs.x_scale_auto_max = false;
		gs.y_scale_auto_max = false;
		gs.y_scale_tight = true;
		gs.x_scale_tight = true;
	}
	var ac = 1.0; // arrow movement accelleration 
	if ( event.key==='ArrowRight'){
		arrowmove();
		gs.x_manual_min = g.pixels_to_units(-1*gs.widthx*ac,'x');
		gs.x_manual_max = g.pixels_to_units(g.canvas.width-gs.widthx*ac,'x');
		g.draw();
	}
	if ( event.key==='ArrowLeft'){
		arrowmove();
		gs.x_manual_min = g.pixels_to_units(gs.widthx*ac,'x');
		gs.x_manual_max = g.pixels_to_units(g.canvas.width+gs.widthx*ac,'x');
		g.draw();
	}
	if ( event.key==='ArrowDown'){
		arrowmove();
		gs.y_manual_min = g.pixels_to_units(-1*gs.widthy*ac,'y');
		gs.y_manual_max = g.pixels_to_units(g.canvas.height-gs.widthy*ac,'y');
		g.draw();
	}
	if ( event.key==='ArrowUp'){
		arrowmove();
		gs.y_manual_min = g.pixels_to_units(gs.widthy*ac,'y');
		gs.y_manual_max = g.pixels_to_units(g.canvas.height+gs.widthy*ac,'y');
		g.draw();
	}
	
	
	
	
	}
	
}

function modify_for_shift(startx,starty,endx,endy){
	var dx = endx-startx;
	var dy = endy-starty;
	var angle = Math.atan(dy/dx);
	if (dx<0){angle-=Math.PI}
	var r = Math.sqrt(dx*dx+dy*dy);
	var q = Math.PI/8; //set the quantisation
	angle = Math.round(angle/q)*q;
	rx = startx + r*Math.cos(angle);
	ry = starty + r*Math.sin(angle);
	return {rx:rx,ry:ry};
}

function modify_for_grid_snap(graph,x,y){
	
	//find the closest value
	var rx=0;
	var d=0;
	var id = 0;
	for (var i=0;i<graph.snap_positions.x.length;i++){
		id = 1 / (Math.abs(x - graph.snap_positions.x[i])+1);
		if ( id > d ){
			d = id;
			rx = graph.snap_positions.x[i];
		}
	}
	var ry=0;
	var d=0;
	var id=0;
	for (var i=0;i<graph.snap_positions.y.length;i++){
		id = 1 / (Math.abs(y - graph.snap_positions.y[i])+1);
		if ( id > d ){
			d = id;
			ry = graph.snap_positions.y[i];
		}
	}
	
	return {rx:rx,ry:ry};	
}

function modify_for_snap(x,y,ox,oy,distance){
	 if ( Math.abs(x-ox)< distance ){
		 x = ox;
	 }
	 if ( Math.abs(y-oy)< distance ){
		 y = oy;
	 }
	 return {rx:x,ry:y}
}

function mouse_up_event(event,graph){
	"use strict";
	var canvas = graph.canvas;
	var gs = graph.graphics_style;
	if (gs.interactivity === 'none'){ return }
	
	var ctx = canvas.getContext('2d');
	mouse_down = false;
	var rect = canvas.getBoundingClientRect();
	var end_x = event.clientX - rect.left;
	var end_y = event.clientY - rect.top;
	
	if (mjs_plot.SHIFT){
		var n = modify_for_shift(start_x,start_y,end_x,end_y)
		end_x = n.rx;
		end_y = n.ry;
	}
	if (mjs_plot.CTRL){
		var n = modify_for_grid_snap(graph,end_x,end_y);
		end_x = n.rx;
		end_y = n.ry;
	}
	
	var no_drag_size = gs.tick_len;
	var is_finishing_drag = Math.abs(start_x - end_x) > no_drag_size && Math.abs(start_y - end_y) > no_drag_size;
	var edge = graph.ui.size;
	//zooming with rectangle. 
	if (gs.mouse_mode === 'zoom' || (gs.mouse_mode === 'hreader'&& !graph.ui.touch )){
		
		if (is_finishing_drag){
			 start_x = graph.pixels_to_units(start_x,'x');
			 start_y = graph.pixels_to_units(start_y,'y');
			 end_x = graph.pixels_to_units(end_x,'x');
			 end_y = graph.pixels_to_units(end_y,'y');
			
			gs.x_manual_min = Math.min(start_x,end_x);
			gs.x_manual_max = Math.max(start_x,end_x);
			gs.y_manual_min = Math.min(start_y,end_y);
			gs.y_manual_max = Math.max(start_y,end_y);
			gs.x_scale_auto_min = false;
			gs.y_scale_auto_min = false;
			gs.x_scale_auto_max = false;
			gs.y_scale_auto_max = false;
			gs.y_scale_tight = true;
			gs.x_scale_tight = true;
			graph.mjs_plot();
			return;
		}  
	}
	//touch zoom out button
	if (graph.ui.touch && (gs.mouse_mode === 'zoom' || gs.mouse_mode === 'drag'  ||  gs.mouse_mode === 'hreader')  && end_x < 4*edge && end_y >canvas.height-2*edge && end_y <canvas.height-1*edge ){
	//document.getElementById('errors').innerHTML="zoom out button";
		gs.y_scale_auto_min = true;
		gs.y_scale_tight = false;
		gs.y_scale_auto_max = true;
		gs.y_scale_tight = false;
		gs.x_scale_auto_min = true;
		gs.x_scale_tight = false;
		gs.x_scale_auto_max = true;
		gs.x_scale_tight = false;
	}
	
	//touch zoom out button event.button === 2
	if (graph.ui.touch && (gs.mouse_mode === 'zoom') && end_x < 4*edge && end_y >canvas.height-3*edge && end_y <canvas.height-2*edge ){
		event.button = 2;
	}
	
	//process the menus
	if (gs.interactivity === 'full' && !is_finishing_drag){ 
	
	
	if (graph.drawinlinelinemenu){
		var pos = graph.ui.inlinemenyposition;
		var e = 2*edge;
		var item = Math.floor((end_x - pos.x)/e) +  Math.floor((end_y - pos.y)/e)* pos.inlinemenuwidth;
		graph.ui.inlinemenyposition.callback(lines[item]);
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if (graph.drawinlinedashmenu){
		var pos = graph.ui.inlinemenyposition;
		var item = Math.floor((end_y - pos.y)/edge);
		if (item == dashmodes.length){
			gs.dash_modes[pos.item] = getString("new dash mode, build with ,.-/' ",graph.dash_modes_backup[pos.item] );
		}
		else {
			gs.dash_modes[pos.item] = dashmodes[item];
		}
		graph.do_line_modes();
		graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if (graph.drawinlinesymbolmenu){
		var pos = graph.ui.inlinemenyposition;
		var item = Math.floor((end_x - pos.x)/edge) +  Math.floor((end_y - pos.y)/edge)* pos.inlinemenuwidth;
		graph.ui.inlinemenyposition.callback(symbols[item]);
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if (graph.drawinlinecolormenu){
		var pos = graph.ui.inlinemenyposition;
		var e=edge*1;
		var inlinemenuheight = 6*e;
		var inlinemenuwidth = 9*e;
		var lx = pos.x - inlinemenuwidth/2; 
		var ly = pos.y - inlinemenuheight/2; 
		if (end_x-lx < 4.9*e && end_y-ly< 4.9*e && end_x-lx > 0.1*e && end_y-ly > 0.1*e ){
			pos.current = getPickerColor( (end_x - 0.1*e - lx)/4.8/e , (end_y - 0.1*e-ly)/4.8/e,pos.saturation);
			pos.current = '#'+padLeft(pos.current[0].toString(16), 2, '0')+padLeft(pos.current[1].toString(16), 2, '0')+padLeft(pos.current[2].toString(16), 2, '0');
			//pos.current[0].toString(16)+pos.current[1].toString(16)+pos.current[2].toString(16);
		}
		if (end_x-lx < 4.9*e && end_y-ly< 5.9*e && end_x-lx > 0.1*e && end_y-ly > 5.1*e ){
			pos.saturation = (end_x - 0.1*e - lx)/4.8/e;
		}
		if (end_x-lx < 5.9*e && end_x-lx > 5.1*e  ){
			pos.current = swatch[Math.floor((end_y-ly)/e)];
		}
		
		if (end_x-lx < 9*e && end_y-ly< 5*e && end_x-lx > 6*e && end_y-ly > 4*e ){
			pos.current = getString("new color name or hex",pos.current );
			pos.callback(pos.current);
			graph.drawinlinecolormenu=false;
		}
		
		if (end_x-lx < 9*e && end_y-ly< 6*e && end_x-lx > 6*e && end_y-ly > 5*e ){
			pos.callback(pos.current);
			graph.drawinlinecolormenu=false;
		}
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	
	if(graph.drawcaptionmenu){
		var item = Math.floor((canvas.width-end_x)/3/edge)*10 + Math.floor(end_y/edge);
		
		if (item == 10 || item == 0){ graph.drawcaptionmenu=false; }
		else if (item == 11 || item == 1){ gs.show_captions= !gs.show_captions; }
		else if (item == 12 || item == 2){ gs.show_caption_symbol= !gs.show_caption_symbol; }
		else if (item == 13 || item == 3){ gs.show_caption_line= !gs.show_caption_line; }
		else if (item == 14 || item == 4){ gs.show_caption_reader= !gs.show_caption_reader; }
		else if (item == 15 || item == 5){ gs.show_caption_box= !gs.show_caption_box; }
		else if (item == 7 ){ gs.caption_font_size *= 1.3 }
		else if (item == 17 ){ gs.caption_font_size /= 1.3 }
		else if (item == 32 ){ gs.captions_display = "xfirst"; }
		else if (item == 33 ){ gs.captions_display = "xlast"; }
		else if (item == 34 ){ gs.captions_display = "xmin"; }
		else if (item == 35 ){ gs.captions_display = "xmax"; }
		else if (item == 22 ){ gs.captions_display = "yfirst"; }
		else if (item == 23 ){ gs.captions_display = "ylast"; }
		else if (item == 24 ){ gs.captions_display = "ymin"; }
		else if (item == 25 ){ gs.captions_display = "ymax"; }
		else if (item == 27 ){ gs.captions_extra_precision = Math.min(gs.captions_extra_precision + 1, 10); }
		else if (item == 37 ){ gs.captions_extra_precision = Math.max(0,gs.captions_extra_precision - 1); }
		
		graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if (graph.drawxmenu){
		var lx = Math.floor(end_x/edge);
		var ly = Math.floor((canvas.height-end_y)/edge);
		switch(ly){
			case 0:
				graph.drawxmenu = false
				mouse_move_event(event,graph);
				return;
			case 1:
				if (lx < 8){
					gs.x_scale_auto_min=true;
					gs.x_scale_tight=false;
				} else {
					gs.x_scale_auto_min=false;
					if (gs.x_scale_mode ==='time'){
						var d  =  new Date(gs.x_manual_min);
						var r = Date.parse( prompt("new low limit",d.toISOString() ) );
						gs.x_manual_min = r || gs.x_manual_min;
					} else {
						gs.x_manual_min = getFloat("new low limit",gs.x_manual_min );
					}
				}
				break;
			case 2:
				if (lx < 8){
					gs.x_scale_auto_max=true;
					gs.x_scale_tight=false;
				} else {
					gs.x_scale_auto_max=false;
					if (gs.x_scale_mode ==='time'){
						var d  =  new Date(gs.x_manual_max);
						var r = Date.parse( prompt("new high limit",d.toISOString() ) );
						gs.x_manual_max = r || gs.x_manual_max;
					} else {
						gs.x_manual_max = getFloat("new high limit",gs.x_manual_max );
					}
				}
				break;
			case 3:
				if (lx < 6){
					gs.x_scale_mode='lin';
				} else if ( lx > 9) {
					gs.x_scale_mode='time';
				} else {
					gs.x_scale_mode='log';
				}
				break;
			case 4:
				if (lx < 8){
					gs.guideWidthx /= 1.5;
				} else {
					gs.guideWidthx *= 1.5;
				}
				break;
			case 5:
				if (lx < 6){
					gs.x_label_mode='norm';
				} else if ( lx >= 10) {
					gs.x_label_mode='sci';
				} else if ( lx >= 8) {
					gs.x_label_mode='postfix';
				} else {
					gs.x_label_mode='infix';
				}
				break;
			case 6:
				gs.x_axis_prefix = getString("new prefix",gs.x_axis_prefix);
				break;
			case 7:
				gs.x_axis_postfix = getString("new postfix",gs.x_axis_postfix );
				break;
			case 8:
				gs.x_axis_title = getString("new title",gs.x_axis_title );
				graph.transform_index--;
				break;
		}
		graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if (graph.drawymenu){
		var lx = Math.floor(end_x/edge)-2;
		var ly = Math.floor((canvas.height-end_y)/edge);
		switch(ly){
			case 0:
				graph.drawymenu = false
				mouse_move_event(event,graph);
				return;
			case 1:
				if (lx < 8){
					gs.y_scale_auto_min=true;
					gs.y_scale_tight=false;
				} else {
					gs.y_scale_auto_min=false;
					if (gs.y_scale_mode ==='time'){
						var d  =  new Date(gs.y_manual_min);
						var r = Date.parse( prompt("new low limit",d.toISOString() ) );
						gs.y_manual_min = r || gs.y_manual_min;
					} else {
						gs.y_manual_min = getFloat("new low limit",gs.y_manual_min );
					}
				}
				break;
			case 2:
				if (lx < 8){
					gs.y_scale_auto_max=true;
					gs.y_scale_tight=false;
				} else {
					gs.y_scale_auto_max=false;
					if (gs.y_scale_mode ==='time'){
						var d  =  new Date(gs.y_manual_max);
						var r = Date.parse( prompt("new high limit",d.toISOString() ) );
						gs.y_manual_max = r || gs.y_manual_max;
					} else {
						gs.y_manual_max =getFloat("new high limit",gs.y_manual_max )
					}
				}
				break;
			case 3:
				if (lx < 6){
					gs.y_scale_mode='lin';
				} else if ( lx > 9) {
					gs.y_scale_mode='time';
				} else {
					gs.y_scale_mode='log';
				}
				break;
			case 4:
				if (lx < 8){
					gs.guideWidthy /= 1.5;
				} else {
					gs.guideWidthy *= 1.5;
				}
				break;
			case 5:
				if (lx < 4){
					gs.y_label_mode='norm';
				} else if ( lx < 6 ) {
					gs.y_label_mode='maths';
				} else if ( lx < 8) {
					gs.y_label_mode='infix';
				} else if ( lx < 10) {
					gs.y_label_mode='postfix';
				} else {
					gs.y_label_mode='sci';
				}
				break;
			case 6:
				gs.y_axis_prefix = getString("new prefix",gs.y_axis_prefix );
				break;
			case 7:
				gs.y_axis_postfix = getString("new postfix",gs.y_axis_postfix );
				break;
			case 8:
				gs.y_axis_title = getString("new title",gs.y_axis_title );
				graph.transform_index--;
				break;
		}
		graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	if (graph.drawgridmenu){
		var lx = Math.floor((Math.floor(end_x/edge)-2)/2);
		var ly = Math.floor((Math.floor((canvas.height-end_y)/edge) - 1)/2);
		if (ly == -1 ){ graph.drawgridmenu = false;}
		else if (lx == 0 ){ gs.show_xgrid = ly;}
		else if (lx == 1 ){ gs.show_ygrid = ly;}
		graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if(graph.drawremakesymbolsmenu){
		var ly = Math.floor(end_y/edge)-4;
		graph.graphics_style.symbol_modes = [];
		
		if (ly==0){  graph.graphics_style.symbol_mode = "LineMarks" }
		else if (ly==1){  graph.graphics_style.symbol_mode = "SolidMarks" }
		else if (ly==2){  graph.graphics_style.symbol_mode = "GapedMarks" }
		else if (ly==3){  graph.graphics_style.symbol_mode = "Emptymarks" }
		else if (ly==4){  graph.graphics_style.symbol_mode = "ShapeMarks" }
		graph.do_symbols();
		graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if(graph.drawremakecolormenu){
		var ly = Math.floor(end_y/edge)-2;
		var lx = Math.floor( (Math.floor(end_x/edge)-1)/7 );
		if (lx==0){
			if (ly==0){  graph.graphics_style.color = getString("Enter a color", 'black' ); }
			else if (ly==1){  graph.graphics_style.color = "caption" }
			else if (ly==2){  graph.graphics_style.color = "darkGreys" }
			else if (ly==3){  graph.graphics_style.color = "lightGreys" }
			else if (ly==4){  graph.graphics_style.color = "byOne" }
			else if (ly==5){  graph.graphics_style.color = "byOneDark" }
			else if (ly==6){  graph.graphics_style.color = "byOneLight" }
			else if (ly==7){  graph.graphics_style.color = "byOnePastle" }
			else if (ly==8){  graph.graphics_style.color = "byOneBold" }
			else if (ly==9){  graph.graphics_style.color =  "spectrum"}
			else if (ly==10){  graph.graphics_style.color =  "viridas"}
			else if (ly==11){  graph.graphics_style.color =  "plasma"}	
		} else {
			if (ly==0){  graph.graphics_style.color =  "verticalGrad"}
			else if (ly==1){  graph.graphics_style.color =  "horisontalGrad"}
			else if (ly==2){  graph.graphics_style.color =  "RadialGrad"}
			//else if (ly==8){  graph.graphics_style.color =  "monoRed"}
			//else if (ly==9){  graph.graphics_style.color =  "monoRand"}
			//else if (ly==11){  graph.graphics_style.color =  "adjecentRed"}
			
		}
		graph.redo_colours();
		graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if(graph.drawmodemenu){
		var lx = Math.floor(end_x/edge);
		var ly = Math.floor(end_y/edge);
		if (ly==0){
			graph.drawmodemenu=false;
			setTimeout(function(){ mouse_move_event(event,graph); }, 0);
			return;
		}
		if (ly == 5){
			graph.drawremakecolormenu = true;
		}
		if (ly == 6){
			graph.drawremakesymbolsmenu = true;
		}
		if (ly == 1){ // change all line modes
			graph.drawinlinelinemenu=true;
			graph.ui.inlinemenyposition = {item:0,x:end_x-1*edge , y: end_y - 1*edge,
				callback:function(I){ gs.line_modes = []; gs.line_mode = I;graph.do_line_modes(); graph.mjs_plot(); }  }; // graph.drawinlinelinemenu=false; 
		}
		if (ly == 2){ // change all symbols
			graph.drawinlinesymbolmenu=true;
			graph.ui.inlinemenyposition = {item:0,x:end_x-1*edge , y: end_y - 1*edge,
				callback:function(I){ gs.symbol_modes = []; gs.symbol_mode = I;graph.do_symbols(); graph.mjs_plot();  }  }; //graph.drawinlinesymbolmenu=false;
		}
		if (ly == 3){
			if (lx == 9){	gs.line_thickness = getFloat('New Line Thickness:',gs.line_thickness);}
			if (lx == 8){	gs.line_thickness*=1.2;}
			if (lx == 7){	gs.line_thickness/=1.2;}
			graph.mjs_plot();
		}
		if (ly == 4){
			if (lx == 9){	gs.symbol_size = getFloat('New Symbol Size:',gs.symbol_size);}
			if (lx == 8){	gs.symbol_size*=1.2;}
			if (lx == 7){	gs.symbol_size/=1.2;}
			graph.mjs_plot();
		}
		
		
		//graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	
	
	if(graph.drawapplystylemenu){
		var ly = Math.floor(end_y/edge)-1 + 12 * Math.floor((end_x - 5*edge) / 8 /edge);
		console.log(ly);		
		if (ly==0){ graph.applyStyle(   JSON.parse( getString('paste in style JSON','{}') ) ); }
		else { graph.applyStyle( graphStyleNames[ly-1] )}
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if(graph.drawgraphmenu){
	var ly = Math.floor(end_y/edge);
	switch(ly){
		case 0:
			graph.drawgraphmenu=false;
			mouse_move_event(event,graph);
			return;
		case 1:
			graph.drawapplystylemenu=true;
			break;
		case 2:
			gs.title = getString("new title",gs.title );
			break;
		case 3:
			gs.subtitle = getString("new subtitle",gs.subtitle );
			break;
		case 4:
			gs.subtitle2 = getString("new subtitle",gs.subtitle2 );
			break;
		case 5:
			gs.showTransformTexts = !gs.showTransformTexts;
			break;
		case 6:
			gs.x_axis_title = getString("new x axis title",gs.x_axis_title )
			graph.transform_index--;
			break;
		case 7:
			gs.y_axis_title = getString("new y axis title",gs.y_axis_title )
			graph.transform_index--;
			break;
		case 8:
			gs.scaling_factor/=1.1;
			break;
		case 9:
			gs.scaling_factor*=1.1;
			break;
		case 10:
			//paste json data
			var s = getString("Paste JSON series",'');
			if (s && s.length > 15){ // the shortest valid s. a quick and dirty way to fix it. 
				graph.add_data_from_json(s);
			}
			break;
		case 11:
			graph.reset();
			break;
		}
		graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if(graph.drawmarkermenu){
		var ly = Math.floor((end_y-edge)/edge);
		var lx = Math.floor((end_x-edge)/edge/2.5);
		var item = lx * 10 + ly;
		if (item == 2){  _startAddNewMarker(graph,"line","",2); }
		else if (item == 12){  _startAddNewMarker(graph,"line",getString("Text:",'' ),2); }
		else if (item == 3){  _startAddNewMarker(graph,"arrows","",2); }
		else if (item == 13){  _startAddNewMarker(graph,"arrows",getString("Text:",'' ),2); }
		else if (item == 4){  _startAddNewMarker(graph,"bracket","",2); }
		else if (item == 14){  _startAddNewMarker(graph,"bracket",getString("Text:",'' ),2); }
		else if (item == 5){  _startAddNewMarker(graph,"brace","",2); }
		else if (item == 15){  _startAddNewMarker(graph,"brace",getString("Text:",'' ),2); }
		else if (item == 6){  _startAddNewMarker(graph,"arch","",2); }
		else if (item == 16){  _startAddNewMarker(graph,"arch",getString("Text:",'' ),2); }
		else if (item == 7){  _startAddNewMarker(graph,"span","",2); }
		else if (item == 17){  _startAddNewMarker(graph,"span",getString("Text:",'' ),2); }
		else if (item == 8){  _startAddNewMarker(graph,"extended","",2); }
		else if (item == 18){  _startAddNewMarker(graph,"extended",getString("Text:",'' ),2); }
		
		else if (item == 22){  _startAddNewMarker(graph,"arrow","",2); }
		else if (item == 32){  _startAddNewMarker(graph,"arrow",getString("Text:",'' ),2); }
		else if (item == 23){  _startAddNewMarker(graph,"lolli","",2); }
		else if (item == 33){  _startAddNewMarker(graph,"lolli",getString("Text:",'' ),2); }
		else if (item == 24){  _startAddNewMarker(graph,"diagArrow","",2); }
		else if (item == 34){  _startAddNewMarker(graph,"diagArrow",getString("Text:",'' ),2); }
		else if (item == 25){  _startAddNewMarker(graph,"diagLolli","",2); }
		else if (item == 35){  _startAddNewMarker(graph,"diagLolli",getString("Text:",'' ),2); }
		else if (item == 26){  _startAddNewMarker(graph,"hline","",1); }
		else if (item == 36){  _startAddNewMarker(graph,"hline",getString("Text:",'' ),1); }
		else if (item == 27){  _startAddNewMarker(graph,"vline","",1); }
		else if (item == 37){  _startAddNewMarker(graph,"vline",getString("Text:",'' ),1); }
		else if (item == 28){  _startAddNewMarker(graph,"pin","!",1); }
		else if (item == 38){  _startAddNewMarker(graph,"pin",getString("Text:",'' ),1); }
		
		
		else if (item == 42){  _startAddNewMarker(graph,"box","",2); }
		else if (item == 52){  _startAddNewMarker(graph,"box",getString("Text:",'' ),2); }
		else if (item == 43){  _startAddNewMarker(graph,"ellipse","",2); }
		else if (item == 53){  _startAddNewMarker(graph,"ellipse",getString("Text:",'' ),2); }
		else if (item == 44){  _startAddNewMarker(graph,"cBox","",2,{layer:0,color:'%mg'}); }
		else if (item == 54){  _startAddNewMarker(graph,"cBox",getString("Text:",'' ),2,{layer:0,color:'%mg'}); }
		else if (item == 45){  _startAddNewMarker(graph,"cEllipse","",2,{layer:0,color:'%mg'}); }
		else if (item == 55){  _startAddNewMarker(graph,"cEllipse",getString("Text:",'' ),2,{layer:0,color:'%mg'}); }
		
		//else if (item == 56 || item == 46){  _startAddNewMarker(graph,"logo",'',2,{layer:0,color:'%mg'}); }
		
		else if (item == 62 || item == 72){  _startAddNewMarker(graph,"Ltext",getString("Text:",'' ),1); }
		else if (item == 63 || item == 73){  _startAddNewMarker(graph,"Ctext",getString("Text:",'' ),1); }
		else if (item == 64 || item == 74){  _startAddNewMarker(graph,"Rtext",getString("Text:",'' ),1); }
		else if (item == 65 || item == 75){  _startAddNewMarker(graph,"LTBox",getString("Text:",'' ),1); }
		else if (item == 66 || item == 76){  _startAddNewMarker(graph,"CTBox",getString("Text:",'' ),1); }
		else if (item == 67 || item == 77){  _startAddNewMarker(graph,"RTBox",getString("Text:",'' ),1); }
		
		else if (item == 0 || item == 10){ gs.mouse_mode = 'markerRecolor'; }
		else if (item == 1 || item == 11){ gs.mouse_mode = 'markerFont'; }
		else if (item == 20 || item == 30){ gs.mouse_mode = 'markerStroke'; }
		else if (item == 21 || item == 31){ gs.mouse_mode = 'markeredit'; }
		else if (item == 40 || item == 50){ gs.mouse_mode = 'removeMarker'; }
		else if (item == 41 || item == 51){ gs.mouse_mode = 'markerSwap'; }
		else if (item == 60 || item == 70){ gs.markers = []; graph.mjs_plot();}
		else if (item == 61 || item == 71){ gs.show_markers = ! gs.show_markers; graph.mjs_plot();}
		
		graph.drawmarkermenu=false;
		//graph.mjs_plot();
		setTimeout(function(){ mouse_move_event(event,graph); }, 0);
		return;
	}
	
	if(graph.drawStylemenu){
		var ly = Math.floor(end_y/edge);
		var lx = Math.floor((canvas.width-end_x)/edge)-2; //true for right side false for left
		switch(ly){
		case 0:
			graph.drawStylemenu=false;
			mouse_move_event(event,graph);
			return;
		case 1:
			//pick font
			graph.drawStylemenu=false;
			graph.drawFontMenu=true;
			mouse_move_event(event,graph);
			return;
		case 2:
			if (lx){gs.title_font_size--;} else {gs.title_font_size++;}
			break;
		case 3:
			if (lx){gs.tick_labels_font_size--;} else {gs.tick_labels_font_size++;}
			break;
		case 4:
			if (lx){gs.axis_labels_font_size--;} else {gs.axis_labels_font_size++;}
			break;	
		case 5:
			if (lx){gs.title_spacing--;} else {gs.title_spacing++;}
			break;	
		case 6:
			if (lx){gs.tick_lables_font_padding--;} else {gs.tick_lables_font_padding++;}
			break;	
		case 7:
			if (lx){gs.lable_spacing--;} else {gs.lable_spacing++;}
			break;	
		case 8:
			graph.drawinlinecolormenu=true;graph.drawStylemenu=false; 
			graph.ui.inlinemenyposition = {item:item,x:end_x , y: end_y , saturation:0.3,current: gs.color_fg,
				callback:function(c){gs.color_fg = c;graph.mjs_plot();mouse_move_event(event,graph); } };
			break;
		case 9:
			graph.drawinlinecolormenu=true;graph.drawStylemenu=false;  
			graph.ui.inlinemenyposition = {item:item,x:end_x , y: end_y , saturation:0.3,current: gs.color_bg,
				callback:function(c){gs.color_bg = c;graph.mjs_plot();mouse_move_event(event,graph); } };
			break;
		case 10:
			graph.drawinlinecolormenu=true; graph.drawStylemenu=false; 
			graph.ui.inlinemenyposition = {item:item,x:end_x , y: end_y , saturation:0.3,current: gs.color_mg,
				callback:function(c){gs.color_mg = c;graph.mjs_plot();mouse_move_event(event,graph); } };
			break;
		case 11:
			if (lx){gs.graph_line_thickness = Math.max(0.1,gs.graph_line_thickness-0.5);} else {gs.graph_line_thickness+=0.5;}
			break;
		case 12:
			if (lx){gs.tick_len = Math.max(0.1,gs.tick_len-1);} else {gs.tick_len+=1;}
			break;
		case 13:
			if (lx){gs.minor_tick_len = Math.max(0.1,gs.minor_tick_len-1);} else {gs.minor_tick_len+=1;}
			break;
		} 
		
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
	}
	if(graph.drawFontMenu){
		var ly = Math.floor(end_y/edge)-1;
		if (ly == -1){
		gs.font_name = getString("font",gs.font_name );
		} else {
		gs.font_name = MJSFontList.fontList[ly];
		}	
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
	}
	
	//top buttons
	if (end_y < edge){
		if ( end_x < 4*edge){
			graph.drawmodemenu = true;
			mouse_move_event(event,graph);
			return;
		}
		if ( end_x  >4*edge && end_x  <8 *edge){
			graph.drawgraphmenu = true;
			mouse_move_event(event,graph);
			return;
		}
		
		
		if ( end_x < 9*edge && end_x > 8*edge){
		//hreader button
		gs.mouse_mode = 'hreader';
		graph.needs_drag_image = true;
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
		}
		
		if ( end_x < 10*edge && end_x > 9*edge){
		//drag button
		gs.mouse_mode = 'drag';
		graph.needs_drag_image = true;
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
		}
		if ( end_x < 11*edge && end_x > 10*edge){
		//zoom button
		gs.mouse_mode = 'zoom';
		mouse_move_event(event,graph);
		return;
		}
		if ( end_x < 12*edge && end_x > 11*edge){
		//measure button
		gs.mouse_mode = 'measure';
		mouse_move_event(event,graph);
		return;
		}
		if ( end_x < 13*edge && end_x > 12*edge){
		//data reader button
		gs.mouse_mode = 'reader';
		mouse_move_event(event,graph);
		return;
		}
		if ( end_x < 14*edge && end_x > 13*edge){
		//mouse button
		gs.mouse_mode = 'mouse';
		mouse_move_event(event,graph);
		return;
		}
		if ( end_x > 14*edge && end_x < 17*edge){
			//mouse button
			graph.drawmarkermenu = true;
			mouse_move_event(event,graph);
			return;
		}
		if ( end_x < canvas.width && end_x > canvas.width - edge){
		//show/hide captions
			graph.drawcaptionmenu = true;
			mouse_move_event(event,graph);
			return;
		}
		if ( end_x < canvas.width - edge && end_x > canvas.width - 2*edge){
		//infomation button 
			gs.i =  (gs.i + 1)%2;//a two state button.
		}
		if ( end_x < canvas.width - 2*edge && end_x > canvas.width - 5*edge){
			graph.drawStylemenu = true;
			mouse_move_event(event,graph);
			return;
		}
		
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
	}
	
	if(graph.drawtimemenu){
		var lx = 10*edge;
		var ldx = 2*edge;
		var ly =  canvas.height - edge*3;
		var ldy = edge;
		
		for (var i = 0;i<2;i++){
			if (end_y > ly-(i+1)*ldy && end_y < ly-i*ldy && end_x>lx && end_x < lx+4*ldx){
				for (var j = 0;j<4;j++){
					var selected = end_x>lx+j*ldx && end_x < lx+(j+1)*ldx;
					if (selected){graph.timemenuoptions[i] = j;}
				}
			}
		}
		if (end_y < ly +2*ldy && end_y > ly +1*ldy && end_x > lx && end_x < lx+3*ldx){
			//apply to x button
			var n = gs.data_transforms.length;
			gs.data_transforms[n] = "time_to_num";
			gs.x_scale_mode ='lin';
			var now = new Date();
			gs.data_transforms_args[n] = [graph.timemenuoptions[1],graph.timemenuoptions[0],'x',now.getTime()];
			graph.drawtimemenu = false;
			graph.mjs_plot();
			
		}
		if (end_y < ly +2*ldy && end_y > ly +1*ldy && end_x > lx+3*ldx && end_x < lx+6*ldx){
			//apply to ybutton
			var n = gs.data_transforms.length;
			gs.data_transforms[n] = "time_to_num";
			gs.y_scale_mode ='lin';
			var now = new Date();
			gs.data_transforms_args[n] = [graph.timemenuoptions[1],graph.timemenuoptions[0],'y',now.getTime()];
			graph.drawtimemenu = false;
			graph.mjs_plot();
		}
		
		mouse_move_event(event,graph);
		return;
	}
	//function buttons
	if (graph.drawfxmenu){
		var n = gs.data_transforms.length;
		var item = 100+Math.floor((end_x - 8*edge)/(2*edge))*100 + Math.floor( (canvas.height - end_y)/edge);
		
		if ( item == 100 || item == 200){
			graph.drawfxmenu = false;
			mouse_move_event(event,graph);
			return;
		}
		else if ( item == 101 || item == 201){// reset button
			graph.graphics_style.data_transforms = [];
			graph.graphics_style.data_transforms_args = [];
		}
		else if ( item == 300 || item == 400){// pop button
			graph.popTransform();
		}
		else if ( item == 113 || item == 213){// y vs y button
			if (gs.data_transforms[n-1] == "y_vs_y"){
				gs.data_transforms_args[n-1][0] += 1;
				graph.transform_index--;
			} else {
				graph.addTransform("y_vs_y",[1]);
			}
		}
		else if ( item == 102 || item == 202){// cut button button
			graph.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'cut';
			graph.drawfxmenu = false;
		}
		else if ( item == 103 || item == 203){// normalise button
			if (gs.data_transforms[n-1] == "normalise"){
				graph.popTransform();
			} else {
				graph.addTransform("normalise",[0]);
			}
			gs.y_scale_auto_min = true;
			gs.y_scale_auto_max = true;
		}
		else if ( item == 104 ){// y-c button
			graph.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'y-c';
			graph.drawfxmenu = false;
		}
		else if ( item == 204 ){// x-c button
			graph.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'x-c';
			graph.drawfxmenu = false;
		}
		else if ( item == 105 || item == 205){// smooth button
			transforms.applySmooth(graph);
		}
		else if ( item == 106 || item == 206){// interpolate button
			if (gs.data_transforms[n-1] == "interpolate"){
				gs.data_transforms_args[n-1][0] *= 2;
				graph.transform_index--;
			} else {
				graph.addTransform("interpolate",[20]);
			}
		}
		else if ( item == 107 || item == 207){// subtract user defined line
			graph.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'sublin';
			graph.drawfxmenu = false;
		}
		else if ( item == 108 || item == 208){// differentiate button
			graph.addTransform("differentiate",[0]);
			gs.y_scale_auto_min = true;
			gs.y_scale_auto_max = true;
		}
		else if ( item == 209){// e to the power x button
			if (gs.data_transforms[n-1] == "ln_x"){
				graph.popTransform();
			} else {
				graph.addTransform("e_to_x",[0]);
			}
		}
		else if ( item == 109){// ln x button
			if (gs.data_transforms[n-1] == "e_to_x"){
				graph.popTransform();
			} else {
				graph.addTransform("ln_x",[0]);
			}
		}
		else if ( item == 210){// ten to the x button
			if (gs.data_transforms[n-1] == "log_x"){
				graph.popTransform();
			} else {
				graph.addTransform("ten_to_x",[0]);
			}
		}
		else if ( item == 110){// log x button
			if (gs.data_transforms[n-1] == "ten_to_x"){
				graph.popTransform();
			} else {
				graph.addTransform("log_x",[0]);
			}
		}
		else if ( item == 211){// x over 10 button
			if (gs.data_transforms[n-1] == "scale_x"){
				gs.data_transforms_args[n-1][0] *= 0.1;
				graph.transform_index--;
			} else {
				graph.addTransform("scale_x",[0.1]);
			}
			gs.x_manual_min *=0.10;
			gs.x_manual_max *=0.10;
		}
		else if ( item == 111){// ten x button
			if (gs.data_transforms[n-1] == "scale_x"){
				gs.data_transforms_args[n-1][0] *= 10;
				graph.transform_index--;
			} else {
				graph.addTransform("scale_x",[10]);
			}
			gs.x_manual_min *=10;
			gs.x_manual_max *=10;
		}
		else if ( item == 212){// one over x button
			if (gs.data_transforms[n-1] == "one_over_x"){
				graph.popTransform();
			} else {
				graph.addTransform("one_over_x",[]);
			}
		}
		else if ( item == 112){// neg x button		
			if (gs.data_transforms[n-1] == "scale_x"){
				gs.data_transforms_args[n-1][0] *= -1;
				graph.transform_index--;
			} else {
				graph.addTransform("scale_x",[-1]);
			}
			var oldmin = gs.x_manual_min*-1;
			var oldmax = gs.x_manual_max*-1;
			gs.x_manual_min = Math.min(oldmin,oldmax);
			gs.x_manual_max = Math.max(oldmin,oldmax);
		}
		else if ( item == 301 || item == 401){// swap button
			if (gs.data_transforms[n-1] == "swap_x_y"){
				graph.popTransform();
			} else {
				graph.addTransform("swap_x_y",[]);
			}
			var temp = gs.x_manual_min;
			gs.x_manual_min =gs.y_manual_min;
			gs.y_manual_min =temp;
			temp =gs.x_manual_max;
			gs.x_manual_max =gs.y_manual_max;
			gs.y_manual_max =temp;
			temp = gs.x_scale_mode;
			gs.x_scale_mode = gs.y_scale_mode;
			gs.y_scale_mode = temp;
			//swap the axis prefixs postfixes 
			temp = gs.x_axis_prefix;
			gs.x_axis_prefix = gs.y_axis_prefix;
			gs.y_axis_prefix = temp;
			temp = gs.x_axis_postfix
			gs.x_axis_postfix = gs.y_axis_postfix;
			gs.y_axis_postfix = temp;
			temp = gs.x_label_mode;
			gs.x_label_mode = gs.y_label_mode;
			gs.y_label_mode = temp;
		}
		else if ( item == 302 || item == 402){// trim button
			graph.pre_mouse_mode = gs.mouse_mode;
			gs.mouse_mode = 'trim';
			graph.drawfxmenu = false;
		}
		else if (item ==403){// y^(n) button
			if (gs.data_transforms[n-1] == "y_pow_n"){
				gs.data_transforms_args[n-1][0] += 1;
				var pwr = gs.data_transforms_args[n-1][0];
				gs.y_manual_min = Math.pow(gs.y_manual_min,pwr/(pwr-1));
				gs.y_manual_max = Math.pow(gs.y_manual_max,pwr/(pwr-1));
				graph.transform_index--;
			} else {
				graph.addTransform("y_pow_n",[2]);
				gs.y_manual_min = Math.pow(gs.y_manual_min,2);
				gs.y_manual_max = Math.pow(gs.y_manual_max,2);
			}
		}
		else if ( item == 303 ){// x^n
			if (gs.data_transforms[n-1] == "x_pow_n"){
				gs.data_transforms_args[n-1][0] += 1;
				var pwr = gs.data_transforms_args[n-1][0];
				gs.x_manual_min = Math.pow(gs.x_manual_min,pwr/(pwr-1));
				gs.x_manual_max = Math.pow(gs.x_manual_max,pwr/(pwr-1));
				graph.transform_index--;
			} else {
				graph.addTransform("x_pow_n",[2]);
				gs.x_manual_min = Math.pow(gs.x_manual_min,2);
				gs.x_manual_max = Math.pow(gs.x_manual_max,2);
			}
		}
		else if (  item == 404){// sqrt y
			if (gs.data_transforms[n-1] == "y_nth_root"){
				gs.data_transforms_args[n-1][0] += 1;
				var pwr = gs.data_transforms_args[n-1][0];
				graph.transform_index--;
			} else {
				graph.addTransform("y_nth_root",[2]);
				var pwr = 2;
			}
			var rtmin = Math.pow(Math.abs(gs.y_manual_min),1/2);
			var rtmax = Math.pow(Math.abs(gs.y_manual_max),1/2)
			if (gs.y_manual_min < 0 && gs.y_manual_max > 0){
			//if graph is accross zero then make the minimum zero. max could be ether still.
				var make_zero = 0;
			} else {make_zero = 1;}
			gs.y_manual_min = Math.min( rtmin,rtmax)*make_zero;
			gs.y_manual_max = Math.max( rtmin,rtmax);
		}
		else if ( item == 304 ){ // sqrt x
			if (gs.data_transforms[n-1] == "x_nth_root"){
				gs.data_transforms_args[n-1][0] += 1;
				var pwr = gs.data_transforms_args[n-1][0];
				graph.transform_index--;
			} else {
				graph.addTransform("x_nth_root",[2]);
				var pwr = 2;
			}
			var rtmin = Math.pow(Math.abs(gs.x_manual_min),1/2);
			var rtmax = Math.pow(Math.abs(gs.x_manual_max),1/2)
			if (gs.x_manual_min < 0 && gs.x_manual_max > 0){
			//if graph is accross zero then make the minimum zero. max could be ether still.
				var make_zero = 0;
			} else {make_zero = 1;}
			gs.x_manual_min = Math.min( rtmin,rtmax)*make_zero;
			gs.x_manual_max = Math.max( rtmin,rtmax);
		}
		else if ( item == 305 || item == 405){// sum button
			graph.addTransform("sum",[]);
		}
		else if ( item == 306 || item == 406){// jitter button
			if (gs.data_transforms[n-1] == "jitter"){
				gs.data_transforms_args[n-1][0] += 1;
				graph.transform_index--;
			} else {
				graph.addTransform("jitter",[1]);
			}
		}
		else if ( item == 307 || item == 407){// hist button
			graph.addTransform("hist",[0]);
			gs.x_scale_auto_max = true;
			gs.x_scale_auto_min = true;
			gs.y_scale_auto_max = true;
			gs.y_scale_auto_min = true;
			gs.x_scale_mode = 'lin';
			gs.y_scale_mode = 'lin';
		}
		else if ( item == 308 || item == 408){// Intergrate button
			graph.addTransform("intergrate",[0]);
			gs.y_scale_auto_min = true;
			gs.y_scale_auto_max = true;
		}
		else if ( item == 409){// e^y button
			graph.addTransform("e_to_y",[0]);
		}
		else if ( item == 309){// ln y button
			graph.addTransform("ln_y",[0]);
		}
		else if ( item == 410){// 10^y button
			graph.addTransform("ten_to_y",[0]);
		}
		else if ( item == 310){// log y button
			graph.addTransform("log_y",[0]);
		}
		else if (  item == 411){// y/10 button
			if (gs.data_transforms[n-1] == "scale_y"){
				gs.data_transforms_args[n-1][0] *= 0.1;
				graph.transform_index--;
			} else {
				graph.addTransform("scale_y",[0.1]);
			}
		}
		else if ( item == 311  ){// 10y button
			if (gs.data_transforms[n-1] == "scale_y"){
				gs.data_transforms_args[n-1][0] *= 10;
				graph.transform_index--;
			} else {
				graph.addTransform("scale_y",[10]);
			}
		}
		else if (item == 412){// 1/y button
			if (gs.data_transforms[n-1] == "one_over_y"){
				gs.data_transforms.pop();
				gs.data_transforms_args.pop();
			} else {
				graph.addTransform("one_over_y",[]);
			}
		}
		else if ( item == 312){// -y button
			if (gs.data_transforms[n-1] == "scale_y"){
				gs.data_transforms_args[n-1][0] *= -1;
				graph.transform_index--;
			} else {
				graph.addTransform("scale_y",[-1]);
			}
			var oldmin = gs.y_manual_min*-1;
			var oldmax = gs.y_manual_max*-1;
			gs.y_manual_min = Math.min(oldmin,oldmax);
			gs.y_manual_max = Math.max(oldmin,oldmax);
		}
		else if ( item == 313 || item == 413){// a do nothing transform
			if (gs.data_transforms[n-1] != "nothing"){
				graph.addTransform("nothing",0);	
			}
		}
		
		else if ( item == 513 || item == 613 || item == 713){// subtract trend button
			if (fits.fit_strings.indexOf(gs.fits)>-1){
				graph.addTransform("subtract_fit",[gs.fits]);
				gs.fits = 'none';
			} else {
				graph.errors.push('No fit chosen');
			}	
		}
		else if ( item == 512 || item == 612 || item == 712){// remove outliers button
			if (gs.data_transforms[n-1] == "remove_outliers"){
				gs.data_transforms_args[n-1][1] -= 1;
				graph.transform_index--;
			} else {
				if (fits.fit_strings.indexOf(gs.fits)>-1){
					//only add if there is a valid fit 
					graph.addTransform("remove_outliers",[gs.fits,5]);
					gs.fits = 'old';
				} else {
					graph.errors.push('No fit chosen');
				}
			}
		}
		else if ( item == 511 || item == 611 || item == 711){// keep outliers button
			if (gs.data_transforms[n-1] == "keep_outliers"){
				gs.data_transforms_args[n-1][1] += 1;
				graph.transform_index--;
			} else {
				if (fits.fit_strings.indexOf(gs.fits)>-1){
				graph.addTransform("keep_outliers",[gs.fits,0]);
				gs.fits = 'old';
				} else {
					graph.errors.push('No fit chosen');
				}
			}
		}
		else if ( item == 510 || item == 610 || item == 710){//custom f(x) button
			var f = prompt('y = f(x,y) =','y');
			if (f){
				graph.addTransform("custom_y",[f]);
			}
		}
		else if ( item == 509 || item == 609 || item == 709){//custom filter button
			var f;
			if (gs.x_scale_mode ==='time' || gs.y_scale_mode ==='time' ){
				f = prompt('use, >, <, >=, <=, ==, x, y, now (time) and maths','x > now - 1000*60*60');
			} else {
				f = prompt('use, >, <, >=, <=, ==, x, y and maths','x*2+y*2 < 16');
			}
			if (f){
				graph.addTransform("custom_filter",[f]);
			}
		}
		else if ( item == 501 || item == 601 || item == 701){// spacing button
			graph.addTransform("spacing",[ ]);
		}
		
		else if ( item == 508 || item == 608 || item == 708){
			
			if (gs.data_transforms[n-1] == "visvalingam"){
				gs.data_transforms_args[n-1] += 1;
				graph.transform_index--;
			} else {
				graph.addTransform("visvalingam",2);
			}
			
		}
		
		else if ( item == 507 || item == 607 || item == 707){
			if (gs.data_transforms[n-1] == "subdivide"){
				gs.data_transforms_args[n-1] += 1;
				graph.transform_index--;
			} else {
				graph.addTransform("subdivide",2);
			}
		}
		
		else if ( item == 506 || item == 606 || item == 706){
			if (gs.data_transforms[n-1] == "kernals"){
				gs.data_transforms_args[n-1][0] += 0.1;
				graph.transform_index--;
			} else {
				graph.addTransform("kernals",[0.1]);
			}
		}
		
		else if ( item == 505 || item == 605 || item == 705){
			if (gs.data_transforms[n-1] == "mean_bin"){
				gs.data_transforms_args[n-1][0] += 1;
				graph.transform_index--;
			} else {
				graph.addTransform("mean_bin",[2]);
			}
		}
		else if ( item == 504 || item == 604 || item == 704){
			graph.addTransform("accumulate",[ ]);
		}
		else if ( item == 503 || item == 603 || item == 703){// view last n button
			graph.addTransform("view_last_n",[ getInt("How Many Points",512) ]);
		}
		else if ( item == 502 || item == 602 || item == 702){// mean_normalise button
			graph.addTransform("mean_normalise",[]);
		}
		else if ( item == 500 || item == 600 || item == 700){// time menu button
			graph.drawtimemenu=true;
			graph.drawfxmenu = false;
		}
		
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
	}
	
	
	//line menu buttons
	if (graph.drawlinemenu){
		if ( end_x < 15*edge && end_x > 11*edge && end_y > canvas.height-edge){
			//pressed the fit menu button again
			graph.drawlinemenu = false;
			mouse_move_event(event,graph);
			return;
		}
		//pressed hide/show
		if ( end_x < 22*edge && end_x > 3*edge && end_y < canvas.height-edge){
			
			var no_of_lines = graph.data_backup.length;
			var no_of_function_lines = gs.function_lines.length;
			
			var item = Math.floor((no_of_lines+no_of_function_lines+1)-((canvas.height-end_y) / edge -1));
			
			if (item == 0){
				var f;
				if (gs.x_scale_mode === 'time'){
				f = prompt('y = f(x)','cos(2*pi*x/1000/60/60/24)');
				} else {
				f = prompt('y = f(x)','x*x/2');
				}
				if (f){
					gs.function_lines.push(f);
				}
			}
			item -=1;
			if (item < no_of_function_lines && item >= 0 && end_x < 13*edge){
				gs.function_lines.splice(no_of_function_lines-item-1,1);
			}
			if (item < no_of_function_lines && item >= 0 && end_x > 13*edge){
				var f = prompt('y = f(x)',gs.function_lines[no_of_function_lines-item-1]);
				if (f){
					gs.function_lines[no_of_function_lines-item-1] = f;
				}
			}
			
			item -= no_of_function_lines;
			var uiitem = item;
			if (item >= 0){
				item = gs.line_order[item];
				
				if (end_x > 20*edge){
					swapLeft( gs.line_order,uiitem );
				} else if (end_x > 19*edge){
					swapRight( gs.line_order, uiitem );
				} else if (end_x > 18*edge){
					graph.drawinlinedashmenu=true;
					graph.ui.inlinemenyposition = {item:item,x:end_x - 2*edge , y: canvas.height - (no_of_lines-item + 4.5)*edge  };	
				} else if (end_x > 17*edge){
					//line colour stuff
					graph.drawinlinecolormenu=true;
					graph.drawlinemenu=false; // must close the menu behind it. 
					graph.ui.inlinemenyposition = {item:item,x:end_x , y: end_y , saturation:0.7,current: gs.line_colours[item],
						callback:function(c){gs.line_colours[item] = c;graph.do_colours();graph.mjs_plot();mouse_move_event(event,graph); } };
				} else if (end_x > 16*edge){
					graph.drawinlinelinemenu=true;
					graph.ui.inlinemenyposition = {item:item,x:16*edge , y: canvas.height - (no_of_lines-item + 1.5)*edge,
						callback:function(I){ gs.line_modes[item] = I;graph.do_line_modes(); graph.mjs_plot();  }   };
				} else if (end_x > 15*edge){
					graph.drawinlinesymbolmenu=true;
					graph.ui.inlinemenyposition = {item:item,x:end_x - 2*edge , y: canvas.height - (no_of_lines-item + 1.5)*edge,
						callback:function(I){ gs.symbol_modes[item] = I;graph.do_symbols(); graph.mjs_plot();  }  };
				} else {
					gs.hidden_lines[item] = !gs.hidden_lines[item];
				}
			}
		}
		//all button
		if ( end_x < 17*edge && end_x > 15*edge && end_y > canvas.height-edge){
			for (var k = 0;k<gs.hidden_lines.length;k++){
				gs.hidden_lines[k] = false;
			} 
		}
		//none button
		if ( end_x < 19*edge && end_x > 17*edge && end_y > canvas.height-edge){
			for (var k = 0;k<gs.hidden_lines.length;k++){
				gs.hidden_lines[k] = true;
			} 
		}
		
		graph.transform_index--;
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
	}
	
	//export menu buttons
	if (graph.drawexportmenu){
		graph.drawexportmenu = false;
		mouse_move_event(event,graph);
		var my = canvas.height;
		var dy = edge;
		//from zero at the bottom
		var item = Math.floor((canvas.height - end_y) / edge);
		if (item==0){
			return;
		}
		if (end_x < canvas.width - 8*edge){
			//left side
			if (item==6){
				graph.export_jpeg(graph.canvas.width*3,graph.canvas.height*3,3);
			}
			if (item==7){
				graph.export_jpeg(graph.canvas.width,graph.canvas.height,1);
			}
			if (item==8){
				graph.export_jpeg(1000,750,2.5);
			}
			if (item==9){
				graph.export_jpeg(1000*2,750*2,2.5);
			}
			if (item==10){//svgpng
				graph.export_svg_png(graph.canvas.width,graph.canvas.height,3);
			}
			if (item==11){//svgpng (small fig)
				graph.export_svg_png(1000/2.5,750/2.5,3);
			}
			if (item==12){//svgpng (large fig)
				graph.export_svg_png(2*1000/2.5,2*750/2.5,3);
			}		
			if (item==13){
				var text = '';
				var nl= ' \n';
				var graph_name = 'egraph';
				var data_code = JSON.stringify(graph.data);
				var ngs = clone(graph.graphics_style);
				ngs.data_transforms = [];
				ngs.data_transforms_args = [];
				var gs_code = JSON.stringify(ngs);
				var captions_code = JSON.stringify(graph.captions);
				text+= graph_name+'.set_data( '+data_code+' );'+nl;
				text+= graph_name+'.set_captions( '+captions_code+' ); '+nl;
				text+= graph_name+'.default_graphics_style = '+gs_code+'; '+nl;
				var shower = MJS_PLOT_LINK_LOADER;
				var url = shower+LZString.compressToEncodedURIComponent(text);
				window.open(url, graph.graphics_style.title, "width="+graph.canvas.width+", height="+graph.canvas.height);
			}
			
			if (item==4){
				//copy code for another MJSPlot graph
				//get the caption, color, and data(post any transforms)
				//wrap it in an array of objects {caption:'',data:[[],[],[],[]],color,linetype,dashtpye,symboltype}
				var objs = [];
				for (i = 0;i<graph.data.length;i++){
					objs.push({
						caption: graph.captions[i],
						color:graph.colors[i],
						data:graph.data[i],
						symbol_mode:graph.symbol_modes[i],
						line_mode: graph.line_modes[i],
						dash_mode:graph.dash_modes[i]
					});
				}
				new_window_with_text(JSON.stringify(objs),
									graph.graphics_style.title,
									graph.canvas.width,
									graph.canvas.height
									);
			}
			if (item == 3){
				//the full graph configuration.
				//aka the graphics_style object.
				   
                var objs = JSON.parse(JSON.stringify( mjs_plot.get_graph_style() )); // clone a whole new graphics style
				updateDict(gs,objs); // update it with the current graphics style
				simplifyDict(objs, mjs_plot.get_graph_style() ); // simplify it compated to the defaults
				new_window_with_text(JSON.stringify(objs),
									graph.graphics_style.title,
									graph.canvas.width,
									graph.canvas.height
									);
                                    
			}
			if (item == 2){
				//the graph style only
				
				var objs = JSON.parse(JSON.stringify(plainGraphStyle));
				updateDict(gs,objs);
				simplifyDict(objs,plainGraphStyle);
				new_window_with_text(JSON.stringify(objs),
									graph.graphics_style.title,
									graph.canvas.width,
									graph.canvas.height
									);
			}
			
				
		} else {
		//right side
		if (item==1){
			//find longest data set
			len = 0;
			for (i = 0;i<graph.data.length;i++){
				len = Math.max(len,graph.data[i][0].length);
			}
			//traverse the data variable in an odd way.
			//just to get copy and paste to origin/matlab working
			var text = "";
				for(var ii = 0; ii <len; ii++) {
					for (i = 0;i<graph.data.length;i++){
						try{
						text += graph.data[i][0][ii].toString() + ","+ graph.data[i][1][ii].toString() + ",";
						} catch(e){
						text += ",,";
						}
					}
					text = text.substring(0, text.length - 1); //removes the trailing comma
					text += "\n";
				}
			download_text(text,'mjsplot_graph.csv');
		}
		if (item==2){//code
			var theBody = document.getElementsByTagName('body')[0];
			var text = '';
			for (i = 0;i<graph.data.length;i++){
				text += graph.captions[i].replace( /\W/g, "")+'_x = [';
				for (ii = 0;ii<graph.data[i][0].length-1;ii++){
					text += graph.data[i][0][ii] + ','
				}
				text += graph.data[i][0][ii] + '];\n';
				
				text += graph.captions[i].replace( /\W/g, "")+'_y = [';
				for (ii = 0;ii<graph.data[i][1].length-1;ii++){
					text += graph.data[i][1][ii] + ','
				}
				text += graph.data[i][1][ii] + '];\n';
				
				
			}
			new_window_with_text(text,
				graph.graphics_style.title,
				graph.canvas.width,
				graph.canvas.height
			);
		}
		if (item==3){//code matlab
			var theBody = document.getElementsByTagName('body')[0];
			var text = '';
			for (i = 0;i<graph.data.length;i++){
				text += graph.captions[i].replace( /\W/g, "")+'_x = [';
				for (ii = 0;ii<graph.data[i][0].length-1;ii++){
					text += graph.data[i][0][ii] + ' '
				}
				text += graph.data[i][0][ii] + '];\n';
				
				text += graph.captions[i].replace( /\W/g, "")+'_y = [';
				for (ii = 0;ii<graph.data[i][1].length-1;ii++){
					text += graph.data[i][1][ii] + ' '
				}
				text += graph.data[i][1][ii] + '];\n';
			}
			new_window_with_text(text,
				graph.graphics_style.title,
				graph.canvas.width,
				graph.canvas.height
			);
		}
		if (item==4){//code JSON
			var text = '';
			text = JSON.stringify(graph.data);
			download_text(text,'mjsplot_graph.json');
		}
		if (item==5){//tabbed
			//find longest data set
			var len = 0;
			for (i = 0;i<graph.data.length;i++){
				len = Math.max(len,graph.data[i][0].length);
			}
			//traverse the data variable in an odd way.
			//just to get copy and paste to origin/matlab working
			var text = "";
				for(var ii = 0; ii <len; ii++) {
					for (i = 0;i<graph.data.length;i++){
						try{
						text += graph.data[i][0][ii].toString() + "\t"+ graph.data[i][1][ii].toString() + "\t";
						} catch(e){
						text += "\t\t";
						}
					}
					text += "\n";
				}
			download_text(text,'mjsplot_graph.dat');
		}
		if (item==6){//png hi
			graph.export_png(graph.canvas.width*3,graph.canvas.height*3,3);
		}
		if (item==7){//png low
			graph.export_png(graph.canvas.width,graph.canvas.height,1);
		}
		if (item==8){//png (small figure)
			graph.export_png(1000,750,2.5);
		}
		if (item==9){//png (large figure)
			graph.export_png(1000*2,750*2,2.5);
		}
		if (item==10){//svg
			graph.export_svg(graph.canvas.width,graph.canvas.height);
		}
		if (item==11){//svg (small fig)
			graph.export_svg(1000/2.5,750/2.5);
		}
		if (item==12){//svg (large fig)
			graph.export_svg(2*1000/2.5,2*750/2.5);
		}	
		if (item==13){
			var text = '';
			var nl= ' \n';
			var graph_name = 'egraph';
			var data_code = JSON.stringify(graph.data_backup);
			var gs_code = JSON.stringify(graph.graphics_style);
			var captions_code = JSON.stringify(graph.captions_backup);
			text+= graph_name+'.set_data( '+data_code+' );'+nl;
			text+= graph_name+'.set_captions( '+captions_code+' ); '+nl;
			text+= graph_name+'.default_graphics_style = '+gs_code+'; '+nl;
			var shower = MJS_PLOT_LINK_LOADER;
			var url = shower+LZString.compressToEncodedURIComponent(text);
			window.open(url, graph.graphics_style.title, "width="+graph.canvas.width+", height="+graph.canvas.height);
		}
		} //end of right side
		return;
	}
	//fit menu buttons
	if (graph.drawfitsmenu){
		var item = Math.floor((end_x - 15*edge)/(3*edge))*10 + Math.floor((canvas.height - end_y)/(edge));
		if ( item == 12){gs.fits = 'stats'; }
		else if ( item == 13){gs.fits = 'exp'; }
		else if ( item == 14){gs.fits = 'exp_c'; }
		else if ( item == 15){gs.fits = 'log'; }
		else if ( item == 16){gs.fits = 'power'; }
		else if ( item == 17){gs.fits = 'power_c'; }
		else if ( item == 18){gs.fits = 'gauss'; }
		else if ( item == 2){gs.fits = 'const'; }
		else if ( item == 3){gs.fits = 'linear'; }
		else if ( item == 4){gs.fits = 'quad'; }
		else if ( item == 5){gs.fits = 'cubic'; }
		else if ( item == 6){gs.fits = 'poly4'; }
		else if ( item == 7){gs.fits = 'poly5'; }
		else if ( item == 8){gs.fits = 'poly6'; }
		else if ( item == 9){gs.fits = 'poly7'; }
		else if ( item == 0){graph.drawfitsmenu = false;}
		else if ( item ==10){gs.fits = 'none';graph.drawfitsmenu = false;}
		else if ( item ==1 || item == 11){gs.extrapolate = !gs.extrapolate;}
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
	}
	//bottom buttons
	if (end_y>canvas.height-edge){
		if ( end_x < 2*edge && end_x > 0*edge){
			graph.drawxmenu = true;
			mouse_move_event(event,graph);
				return;
		}
		if ( end_x < 4*edge && end_x > 2*edge){
			graph.drawymenu = true;
			mouse_move_event(event,graph);
				return;
		}
		if ( end_x < 5*edge && end_x > 4*edge){
			graph.drawgridmenu = true;
			//gs.show_xgrid = (gs.show_xgrid+1)%3;
			//gs.show_ygrid = (gs.show_ygrid+1)%3;
		}
		if ( end_x < 6*edge && end_x > 5*edge){
			//y scalemode button
			if (gs.y_scale_mode === 'log' ){
				gs.y_scale_mode = 'lin';
			} else {
				gs.y_scale_mode = 'log';
			}
		}
		if ( end_x < 7*edge && end_x > 6*edge){
			//x scalemode button
			if (gs.x_scale_mode === 'log' ){
				gs.x_scale_mode = 'lin';
			} else {
				gs.x_scale_mode = 'log';
			}
		}
		if ( end_x < 8*edge && end_x > 7*edge){
			//x scalemode button
			gs.x_scale_mode = 'time';
		}
		if ( end_x < 11*edge && end_x > 8*edge){
			//f() menu button
			graph.drawfxmenu = true;
			mouse_move_event(event,graph);
			return;
		}
		if ( end_x < 15*edge && end_x > 11*edge){
			//line menu button
			graph.drawlinemenu = true;
			mouse_move_event(event,graph);
			return;
		}
		if ( end_x < 19*edge && end_x > 15*edge){
			//fits menu button
			graph.drawfitsmenu = true;
			mouse_move_event(event,graph);
			return;
		}
		if ( end_x < canvas.width && end_x > canvas.width - edge){
			graph.drawexportmenu = true;
			mouse_move_event(event,graph);
				return;
		}
		if ( end_x < canvas.width-edge && end_x > canvas.width - 2*edge){
			//day/night data button
			var temp = gs.color_fg 
			gs.color_fg = gs.color_bg;
			gs.color_bg = temp;
		}
		if ( end_x < canvas.width-edge*2 && end_x > canvas.width - edge*3){
			//fullscreen button
			if (graph.isFullscreen){
				graph.exit_full_screen();
			} else {
				graph.make_full_screen(graph);
			}
		}
		graph.mjs_plot();
		mouse_move_event(event,graph);
		return;
	}
	
	
	} // end of processing the menus
	
	if (gs.interactivity === 'view' && end_x < 5*edge && end_y < edge){ //show the edit button.
			gs.interactivity = 'full';
			setTimeout(function(){ mouse_move_event(event,graph); }, 0);
			return;
		};
	
	//zoom without drag
	if (gs.mouse_mode === 'zoom' ||  (gs.mouse_mode === 'hreader'&& !graph.ui.touch )){
		ctx.rect(start_x-no_drag_size*0.5,start_y-no_drag_size*0.5,no_drag_size,no_drag_size);
		ctx.stroke();
		 if( event.button=== 0){
			gs.x_scale_auto_min = true;
			gs.y_scale_auto_min = true;
			gs.x_scale_auto_max = true;
			gs.y_scale_auto_max = true;
			gs.y_scale_tight = false;
			gs.x_scale_tight = false;
		}
		else if(event.button === 2){//was right click
			gs.x_scale_auto_min = false;
			gs.y_scale_auto_min = false;
			gs.x_scale_auto_max = false;
			gs.y_scale_auto_max = false;
			gs.y_scale_tight = false;
			gs.x_scale_tight = false;
			var f = 0.8;
			gs.x_manual_min = graph.pixels_to_units(-f*gs.guideWidthx,'x');
			gs.x_manual_max = graph.pixels_to_units(canvas.width+f*gs.guideWidthx,'x');
			gs.y_manual_min = graph.pixels_to_units(canvas.height+f*gs.guideWidthy,'y');
			gs.y_manual_max = graph.pixels_to_units(-f*gs.guideWidthy,'y');
			//graph.ylim(graph.pixels_to_units(canvas.height+f*gs.guideWidthy,'y'),graph.pixels_to_units(-f*gs.guideWidthy,'y'));
		}
	}
	
	//on mobile, don't replot the graph if using the measure mode. 
	if (graph.ui.touch && gs.mouse_mode === 'measure' && graph.ui.is_touching){
		graph.graph_image = ctx.getImageData(0,0,canvas.width,canvas.height);
		return;
	}
	//on mobile, don't replot the graph if using the measure mode. 
	if (graph.ui.touch && gs.mouse_mode === 'measure'){
		graph.mjs_plot();return;
	}
	//dragging
	if (gs.mouse_mode === 'drag' || (gs.mouse_mode === 'hreader'&& graph.ui.touch )){
		if (graph.ui.touch && graph.ui.is_touching){
		
			start_x = 0.5*(touch_start_x[0]+touch_start_x[1]);
			start_y = 0.5*(touch_start_y[0]+touch_start_y[1]);
			
			end_x = 0.5*(touch_x[0]+touch_x[1]);
			end_y = 0.5*(touch_y[0]+touch_y[1]);
			
			var scale_x = (touch_x[0]-touch_x[1]) / (touch_start_x[0]-touch_start_x[1]);
			var scale_y = (touch_y[0]-touch_y[1]) / (touch_start_y[0]-touch_start_y[1]);
			scale_x = trim(Math.abs(scale_x),0.1,10);
			scale_y = trim(Math.abs(scale_y),0.1,10);
			
			//p + (1-1/scale)*( start-p )+ end - start
			//this set of equations took two days of trial and fuck error. Lots of error. 
			var new_max_y = 0 + (1-1/scale_y)*( start_y-0 ) +(- end_y + start_y)/scale_y;
			var new_min_y = canvas.height + (1-1/scale_y)*( start_y-canvas.height )+(- end_y + start_y)/scale_y
			
			var new_max_x = canvas.width + (1-1/scale_x)*( start_x-canvas.width ) +(- end_x + start_x)/scale_x;
			var new_min_x = 0 + (1-1/scale_x)*( start_x-0 ) +(- end_x + start_x)/scale_x
			
			gs.y_manual_max = Math.min(1e250,graph.pixels_to_units(new_max_y,'y'));
			gs.y_manual_min = Math.max(-1e250,graph.pixels_to_units(new_min_y,'y'));
			gs.x_manual_min = Math.max(-1e250,graph.pixels_to_units(new_min_x,'x'));
			gs.x_manual_max = Math.min(1e250,graph.pixels_to_units(new_max_x,'x'));
			//the 1e250 is to protect the 
			
			gs.x_scale_auto_min = false;
			gs.y_scale_auto_min = false;
			gs.x_scale_auto_max = false;
			gs.y_scale_auto_max = false;
			gs.y_scale_tight = true;
			gs.x_scale_tight = true;

			graph.mjs_plot();return;
		}
		if (!graph.ui.touch){
		
			gs.y_manual_max = graph.pixels_to_units(start_y-end_y+gs.guideWidthy+1,'y');
			gs.y_manual_min = graph.pixels_to_units(canvas.height+start_y-end_y-gs.guideWidthy-1,'y');
			gs.x_manual_min = graph.pixels_to_units(start_x-end_x+gs.guideWidthx-1,'x');
			gs.x_manual_max = graph.pixels_to_units(canvas.width+start_x-end_x-gs.guideWidthx+1,'x');
			gs.x_scale_auto_min = false;
			gs.y_scale_auto_min = false;
			gs.x_scale_auto_max = false;
			gs.y_scale_auto_max = false;
			gs.y_scale_tight = true;
			gs.x_scale_tight = true;
			bail_middle_mouse_drag(graph);
			graph.mjs_plot();return;
		}
	}
	if (gs.mouse_mode === 'reader'){
		//the the point that is closed to whene the mouse ended the click
		 //end_x = graph.pixels_to_units(end_x,'x');
		 //end_y = graph.pixels_to_units(end_y,'y');
		 var pi = 0;//index of the series it is in
		 var pj = 0;// index in the series. 
		 var best_dist = 1e200; 
		 var dist = 1e200;
		 for (i = 0;i<graph.data.length;i++){
			for (j = 0;j<graph.data[i][0].length;j++){
				var xi =  graph.units_to_pixels(graph.data[i][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[i][1][j],'y');
				dist = Math.sqrt( Math.pow(xi-end_x,2) + Math.pow(yi-end_y,2)  );
				if (dist < best_dist){
					best_dist = dist;
					pi = i;
					pj = j;
				}
			}
		}
		graph.reader_index = [pi,pj];
		mouse_move_event(event,graph);
		return;
	}
	
	if (gs.mouse_mode === 'trim'){//running trim
		var start_px = graph.pixels_to_units(start_x,'x');
		var start_py = graph.pixels_to_units(start_y,'y');
		var end_px = graph.pixels_to_units(end_x,'x');
		var end_py = graph.pixels_to_units(end_y,'y');
		var xlow = Math.min(start_px,end_px);
		var ylow = Math.min(start_py,end_py);
		var xhigh = Math.max(start_px,end_px);
		var yhigh = Math.max(start_py,end_py);
		graph.addTransform("trim",[xlow,xhigh,ylow,yhigh]);
		gs.mouse_mode = graph.pre_mouse_mode;
		graph.mjs_plot();
		return;
	}
	
	if (gs.mouse_mode === 'sublin'){//running sublin
		var start_px = graph.pixels_to_units(start_x,'x');
		var start_py = graph.pixels_to_units(start_y,'y');
		var end_px = graph.pixels_to_units(end_x,'x');
		var end_py = graph.pixels_to_units(end_y,'y');
		var grad = (end_py-start_py) /(end_px-start_px);
		var intercept = start_py-(grad*start_px);
		
		if (isFinite(grad) && isFinite(intercept)){
			graph.addTransform("sublin",[grad,intercept]);
			gs.mouse_mode = graph.pre_mouse_mode;
			graph.mjs_plot();
		}
		gs.mouse_mode = graph.pre_mouse_mode;
		return;
	}
	
	if (gs.mouse_mode === 'cut'){
		//running cut
		var start_px = graph.pixels_to_units(start_x,'x');
		var start_py = graph.pixels_to_units(start_y,'y');
		var end_px = graph.pixels_to_units(end_x,'x');
		var end_py = graph.pixels_to_units(end_y,'y');
		var xlow = Math.min(start_px,end_px);
		var ylow = Math.min(start_py,end_py);
		var xhigh = Math.max(start_px,end_px);
		var yhigh = Math.max(start_py,end_py);
		graph.addTransform("cut",[xlow,xhigh,ylow,yhigh]);
		gs.mouse_mode = graph.pre_mouse_mode;
		graph.mjs_plot();
		return;
	}
	
	if (graph.graphics_style.mouse_mode === 'y-c'){//running y-c
		var c = graph.pixels_to_units(end_y,'y');
		graph.addTransform("y_c",[c]);
		gs.mouse_mode = graph.pre_mouse_mode;
		graph.mjs_plot();
		return;
	}
	if (gs.mouse_mode === 'x-c'){//running cut
		var c = graph.pixels_to_units(end_x,'x');
		graph.addTransform("x_c",[c]);
		gs.mouse_mode = graph.pre_mouse_mode;
		graph.mjs_plot();
		return;
	}
	if (gs.mouse_mode === 'add1ptmarker'){
		var x = graph.pixels_to_units(end_x,'x');
		var y = graph.pixels_to_units(end_y,'y');
		addMarker(graph,graph.ui.addMarker,graph.ui.addMarkerText,[ [x,y] ],graph.ui.addMarkerExtras);
		gs.mouse_mode = graph.pre_mouse_mode;
		graph.mjs_plot();
		return;
	}
	if (gs.mouse_mode === 'add2ptmarker'){
		var sx = graph.pixels_to_units(start_x,'x');
		var sy = graph.pixels_to_units(start_y,'y');
		var ex = graph.pixels_to_units(end_x,'x');
		var ey = graph.pixels_to_units(end_y,'y');
		//gs.markers.push( { type:graph.ui.addMarker,text:graph.ui.addMarkerText, handles:[[sx,sy],[ex,ey]]}  );
		addMarker(graph,graph.ui.addMarker,graph.ui.addMarkerText,[[sx,sy],[ex,ey]],graph.ui.addMarkerExtras);
		gs.mouse_mode = graph.pre_mouse_mode;
		graph.mjs_plot();
		return;
	}
	
	
	//the marker tools. 
	if (gs.mouse_mode === 'markeredit' ||
		gs.mouse_mode === 'markerRecolor' ||
		gs.mouse_mode === 'markerFont' ||
		gs.mouse_mode === 'markerStroke' ||
		gs.mouse_mode === 'removeMarker' ||
		gs.mouse_mode === 'markerSwap'){
		var best_dist = 1e200; 
		var dist = 1e200;
		var pi=0;
		for (i = 0;i<gs.markers.length;i++){
			var m = gs.markers[i];
			dist = Math.sqrt( Math.pow(graph.units_to_pixels(m.x,'x')-end_x,2) + Math.pow(graph.units_to_pixels(m.y,'y')-end_y,2)  );
			if (dist < best_dist){
				best_dist = dist;
				pi = i;
			}
		}
		if (best_dist < edge){
			
			if (gs.mouse_mode === 'markeredit'){ gs.markers[pi].text = getString("New Text:",gs.markers[pi].text ); }
			else if (gs.mouse_mode === 'removeMarker'){ gs.markers.splice(pi,1); }
			else if (gs.mouse_mode === 'markerRecolor'){ gs.markers[pi].color = getString("New Color:",gs.markers[pi].color );  }
			else if (gs.mouse_mode === 'markerFont'){ gs.markers[pi].font = getString("New font:",gs.markers[pi].font );  }
			else if (gs.mouse_mode === 'markerStroke'){ gs.markers[pi].stroke = getString("New stroke color:",gs.markers[pi].stroke );  }
			else if (gs.mouse_mode === 'markerSwap'){  gs.markers[pi].handles.reverse();  }
			
			graph.mjs_plot();
			return;
		}
	}
	
	
	if (gs.mouse_mode === 'mouse'){
			
		if (graph.ui.mouse_is_dragging && graph.ui.drag_object.item === 'marker'){
			
			if (gs.markers[graph.ui.drag_object.i].handles.length == 2){
				
				
				var o = modify_for_snap(end_x,end_y,
							graph.units_to_pixels(gs.markers[graph.ui.drag_object.i].handles[(graph.ui.drag_object.j+1)%2][0],'x'),
							graph.units_to_pixels(gs.markers[graph.ui.drag_object.i].handles[(graph.ui.drag_object.j+1)%2][1],'y'),
							edge/2);
					end_x = o.rx;
					end_y = o.ry;
					
			}
			
			gs.markers[graph.ui.drag_object.i].handles[graph.ui.drag_object.j][0] = 
				graph.pixels_to_units(end_x,'x');
			gs.markers[graph.ui.drag_object.i].handles[graph.ui.drag_object.j][1] = 
				graph.pixels_to_units(end_y,'y');
			
		}
		
		if (graph.ui.mouse_is_dragging && graph.ui.drag_object.item === 'markercenter'){
				var dx = end_x - graph.units_to_pixels(gs.markers[graph.ui.drag_object.i].x,'x');
				var dy = end_y - graph.units_to_pixels(gs.markers[graph.ui.drag_object.i].y,'y');
				var h  = gs.markers[graph.ui.drag_object.i].handles;
				for (var j=0;j<h.length;j++){
					h[j][0] = graph.pixels_to_units(graph.units_to_pixels( h[j][0] ,'x') + dx,'x') ; 
					h[j][1] = graph.pixels_to_units(graph.units_to_pixels( h[j][1] ,'y') + dy,'y') ; 
				}
		}
		
		
		if (graph.ui.mouse_is_dragging && graph.ui.drag_object === 'fit_text'){
			gs.fit_text_position.x = end_x/canvas.width;
			gs.fit_text_position.y = end_y/canvas.height;
		}
		if (graph.ui.mouse_is_dragging && graph.ui.drag_object === 'title_spacing'){
			gs.title_spacing = (end_y - (gs.tick_len+gs.title_font_size)*gs.scaling_factor)/gs.scaling_factor;
			
			//gs.+gs.title_font_size
		}
		if (graph.ui.mouse_is_dragging && graph.ui.drag_object === 'caption_position'){
			if (end_x > canvas.width/2){
				//on right side
				gs.caption_position.x = (canvas.width-end_x-gs.tick_len*gs.scaling_factor)*-1/gs.scaling_factor;
			} else {
				gs.caption_position.x = (end_x-gs.tick_len*gs.scaling_factor)/gs.scaling_factor;
			}
			if (end_y > canvas.height/2){
				//on bottom half
				gs.caption_position.y = (canvas.height-end_y-gs.tick_len*gs.scaling_factor)*-1/gs.scaling_factor;
			} else {
				gs.caption_position.y = (end_y-gs.tick_len*gs.scaling_factor)/gs.scaling_factor;
			}
		}
		graph.mjs_plot();
		mouse_move_event(event,graph);
		graph.ui.mouse_is_dragging = false;
		return;
	}
	// if the mouse mode is 'i' then the covering rectangle hides everything
	// clicking in this mode changes the mouse to zoom and remove the info panel.
	//this should stop users feeling stuck.
	if (gs.mouse_mode === 'i'){
		gs.mouse_mode = graph.pre_mouse_mode;
		gs.i = 0;
		//if the last mouse mode was laso 'i' then just switch to zoom. a psudo default.
		if (gs.mouse_mode === 'i'){
			gs.mouse_mode = 'zoom';
		}
	}
	
	graph.mjs_plot();
} // end of mouse up event

var touch_start_x = [];
var touch_start_y = [];
var touch_x = [];
var touch_y = [];

function touch_start_event(event,graph){
	event.preventDefault();
	graph.ui.is_touching = true;
	var rect = graph.canvas.getBoundingClientRect();
	touch_start_x[0] =  event.targetTouches[0].clientX-rect.left;
	touch_start_y[0] =  event.targetTouches[0].clientY-rect.top;
	if (event.targetTouches.length >= 2){
		touch_start_x[1] =  event.targetTouches[1].clientX-rect.left;
		touch_start_y[1] =  event.targetTouches[1].clientY-rect.top;
	}
	touch_move_event(event,graph);
}

function touch_move_event(event,graph){
	my_touches = event.targetTouches;
	event.preventDefault();
	graph.ui.is_touching = true;
	mouse_down = my_touches.length >=2;
	var rect = graph.canvas.getBoundingClientRect();
	
	start_x =  event.targetTouches[0].clientX-rect.left;
	start_y =  event.targetTouches[0].clientY-rect.top;
	
	touch_x[0] =  event.targetTouches[0].clientX-rect.left;
	touch_y[0] =  event.targetTouches[0].clientY-rect.top;
	if (event.targetTouches.length > 1){
		touch_x[1] =  event.targetTouches[1].clientX-rect.left;
		touch_y[1] =  event.targetTouches[1].clientY-rect.top;
	}
	event.clientX =  my_touches[my_touches.length-1].clientX;//+rect.left;
	event.clientY =  my_touches[my_touches.length-1].clientY;//+rect.top;
	mouse_move_event(event,graph);
	
	}

function touch_cancel_event(event,graph){
graph.ui.is_touching = event.targetTouches.length != 0;
	event.preventDefault();
	touch_end_event(event,graph);
}
function touch_leave_event(event,graph){
	touch_end_event(event,graph);
}

function touch_click_event(event,graph){
	rect = graph.canvas.getBoundingClientRect();
	start_x = event.clientX - rect.left;
	start_y = event.clientY - rect.top;
	mouse_up_event(event,graph);
	
}
function touch_end_event(event,graph){
	//event.preventDefault();
	graph.ui.is_touching = event.targetTouches.length != 0;
	rect = graph.canvas.getBoundingClientRect();
	start_x =  my_touches[0].clientX-rect.left;;//+rect.left;
	start_y =  my_touches[0].clientY-rect.top;;//+rect.top;
	event.clientX =  my_touches[my_touches.length-1].clientX;//+rect.left;
	event.clientY =  my_touches[my_touches.length-1].clientY;//+rect.top;
	mouse_up_event(event,graph);
}


function keep_parent_sized(graph){
		graph.canvas.style.width ='100%';
		graph.canvas.style.height='100%';
		graph.canvas.width  = graph.canvas.offsetWidth;
		graph.canvas.height = graph.canvas.offsetHeight;
		//graph.canvas.style.width =graph.canvas.height;
		//graph.canvas.style.height=graph.canvas.width;
		graph.mjs_plot();
}

var gradientPreviewCanvas = document.createElement("canvas"); // a small canvas for previews and stuff.

function previewColor(ctx,x,y,w,h,color){ // preview a color by drawing a rect with the approperate gradient and position.
	gradientPreviewCanvas.width = w;
	gradientPreviewCanvas.height = h;
	var gradientPreviewCanvasctx = gradientPreviewCanvas.getContext('2d');
	gradientPreviewCanvasctx.fillStyle = renderColor(gradientPreviewCanvas,gradientPreviewCanvasctx,color);
	gradientPreviewCanvasctx.fillRect(0,0,w,h);
	ctx.drawImage(gradientPreviewCanvas, x, y,w,h);
}

function renderColor(canvas,ctx,color){
	if (color[0]!=='!'){
		return color;
	} else if (color[0]==='!') {
		//we build the relivant gradient
		var parts = color.split(':'); // split by the delimiter
		if ( parts.length < 4 ){
			console.log('malformed gradient definition string' + color); return 'pink';
		}
		//ctx.createLinearGradient(x0, y0, x1, y1);
		//ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
		var grd;
		var w = canvas.width;
		var h = canvas.height;
		var dir = parseInt(parts[1]); // a number between 1-9 that specifies the location and direction of the gradients.
		if (parts[0] === '!L'){
			//building a linear gradient depending on the chosen direction, there are only nine, so just write them out.
			if      (dir == 1) {grd = ctx.createLinearGradient(0  ,0  ,w  ,h  );}
			else if (dir == 2) {grd = ctx.createLinearGradient(w/2,0  ,w/2,h  );}
			else if (dir == 3) {grd = ctx.createLinearGradient(w  ,0  ,0  ,h  );}
			else if (dir == 4) {grd = ctx.createLinearGradient(0  ,h/2,w  ,h/2);}
			else if (dir == 5) {console.log('invalid linear gradient position');return 'pink'}
			else if (dir == 6) {grd = ctx.createLinearGradient(w  ,h/2,0  ,h/2);}
			else if (dir == 7) {grd = ctx.createLinearGradient(0  ,h  ,w  ,0  );}
			else if (dir == 8) {grd = ctx.createLinearGradient(w/2,h  ,w/2,0  );}
			else if (dir == 9) {grd = ctx.createLinearGradient(w  ,h  ,0  ,0  );}	
		} else if (parts[0] === '!R'){
			//building a radial gradient
			var l =  Math.sqrt(h*h+w*w);
			if      (dir == 1) { grd = ctx.createRadialGradient(0  ,0  ,0  ,0  ,0  , l); }
			else if (dir == 2) { grd = ctx.createRadialGradient(w/2,0  ,0  ,w/2,0  , l); }
			else if (dir == 3) { grd = ctx.createRadialGradient(w  ,0  ,0  ,w  ,0  , l); }
			else if (dir == 4) { grd = ctx.createRadialGradient(0  ,h/2,0  ,0  ,h/2, l); }
			else if (dir == 5) { grd = ctx.createRadialGradient(w/2,h/2,0  ,w/2,h/2, 0.5*l); }
			else if (dir == 6) { grd = ctx.createRadialGradient(w  ,h/2,0  ,w  ,h/2, l); }
			else if (dir == 7) { grd = ctx.createRadialGradient(0  ,h  ,0  ,0  ,h  , l); }
			else if (dir == 8) { grd = ctx.createRadialGradient(w/2,h  ,0  ,w/2,h  , l); }
			else if (dir == 9) { grd = ctx.createRadialGradient(w  ,h  ,0  ,w  ,h  , l); }
		}
		
		for (var i=2;i<parts.length;i++){
			grd.addColorStop( (i-2)/(parts.length-3), parts[i]);
			grd.addColorStop( (i-2)/(parts.length-3), parts[i]);
		}
		
		//grd.addColorStop(0, parts[2]);
		//grd.addColorStop(1, parts[3]);
		return grd;
	} else {
		console.log('rendering a color has failed:' + color); return 'pink'
	}
}

function keep_page_sized(graph){
	//document.getElementById("view").setAttribute('content','user-scalable=no, width=device-width, minimum-scale=1, maximum-scale=1');
	document.querySelector('meta[name="viewport"]').content = 'user-scalable=no, initial-scale=1, minimum-scale=1, maximum-scale=1';
	graph.canvas.style.position = 'absolute'
	graph.canvas.style.left = 0;
	graph.canvas.style.top = 0;
	graph.canvas.width =  window.innerWidth;
	graph.canvas.height =  window.innerHeight;
	graph.mjs_plot();
} 

function make_interactive(graph){
	if (graph.ui.touch){
		graph.canvas.addEventListener("touchstart", function(event){touch_start_event(event,graph);}, false);
		graph.canvas.addEventListener("touchend", function(event){touch_end_event(event,graph);}, false);
		graph.canvas.addEventListener("touchmove", function(event){touch_move_event(event,graph);}, false);
		graph.canvas.addEventListener("touchcancel", function(event){touch_cancel_event(event,graph);}, false);
		graph.canvas.addEventListener("touchleave", function(event){touch_leave_event(event,graph);}, false);
		graph.canvas.addEventListener("click", function(event){touch_click_event(event,graph);}, false);
	} else {
		graph.canvas.addEventListener('mousemove', function(event){mouse_move_event(event,graph);}, false);
		graph.canvas.addEventListener('mousedown', function(event){mouse_down_event(event,graph);}, false);
		graph.canvas.addEventListener('mouseup', function(event){mouse_up_event(event,graph);} , false);
		graph.canvas.addEventListener('mouseout', function(event){mouse_out_event(event,graph);} , false);
		
		
		graph.canvas.addEventListener("mousewheel", function(event){mouse_wheel_handler(event,graph);}, false);
		graph.canvas.addEventListener("DOMMouseScroll", function(event){mouse_wheel_handler(event,graph);}, false);
	}

	graph.canvas.oncontextmenu = function (e) {e.preventDefault();};
	// TODO get keyboard to work. z for zoom, m for measure, c for cut etc....
	
}


document.addEventListener('keydown', keypress_event , false);
document.addEventListener('keyup', keypress_event , false);

function handleVisibilityChange() {
  if (document[hidden]) {
    // is now hidden, changed tab or something else    
	mjs_plot.CTRL = false;
	mjs_plot.SHIFT = false;
	mjs_plot.SPACE = false;
    // the keyboard detection can get stuck with something left on. so turn them all off. 
  } // can use else to do stuff when returning to the page
}

var hidden, visibilityChange; 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}
if (typeof document[hidden] === "undefined") {
  console.log("Missing Page Visibility API.");
} else {
  // Handle page visibility change   
  document.addEventListener(visibilityChange, handleVisibilityChange, false);
}

//when interpreting which is the active graph for the keyboard shortcuts.
var activeGraph = false;

var svgGradientIDcounter = 0;
function svgGradient(x1,y1,x2,y2,type){
	this.type = type; //ether "linear" or "radial"
	this.x1 = x1;
	this.x2 = x2;
	this.y1 = y1;
	this.y2 = y2;
	this.stops = [];
	this.isAdded = false;
	this.id = "grad"+svgGradientIDcounter++;
	this.colors = [];
	this.addColorStop = function(stop,color){
		this.stops.push(stop);
		this.colors.push(color);
	}
	
}

function SVGContext(ctx){
	this.target = document.getElementById("_mjsplotSVG");
	this.targetStack = [];
	this._ctx = ctx;//borrow from the 2dcanvas context
	this.x=0;
	this.y=0;
	this.strokeStyle = '#000';
	this.lineWidth = 2;
	this.lineCap;
	this.lineJoin;
	this.miterLimit=10;
	//.getLineDash()
	this.__lineDashArray = false;
	this.setLineDash = function(lineDashArray){
		if (lineDashArray.length==0){
			this.__lineDashArray = false;
		} else {
			this.__lineDashArray = '';
			for (var i=0;i<lineDashArray.length-1;i++){
				this.__lineDashArray += lineDashArray[i].toPrecision(this._pixel_precision)+', ';
			}
			this.__lineDashArray += lineDashArray[i].toPrecision(this._pixel_precision);
		}
	}
	this.__applyLineDash = function(){
		if (this.__lineDashArray){
			this._shape.setAttributeNS(null, "stroke-dasharray", this.__lineDashArray);
		}
	}
	//.lineDashOffset
	this.font;
	this.textAlign = 'left';// or center or right
	this.textBaseline = 'alphabetic';//or top hanging middle ideographic bottom.
	this.direction = 'inherit';//or ltr rtl
	
	this.defs = document.createElementNS(svgNS, "defs");
	this.target.appendChild(this.defs);
	
	this.__addGradient = function(gradient){
		
		if (gradient.isAdded){return}
		
		var v;
		if (gradient.type ==='linear'){
			v = document.createElementNS(svgNS, "linearGradient");
			v.setAttributeNS(null, "x1", gradient.x1);
			v.setAttributeNS(null, "x2", gradient.x2);
			v.setAttributeNS(null, "y1", gradient.y1);
			v.setAttributeNS(null, "y2", gradient.y2);
		} else if (gradient.type ==='radial'){
			v = document.createElementNS(svgNS, "radialGradient");
			v.setAttributeNS(null, "cx", gradient.x1);
			v.setAttributeNS(null, "cy", gradient.y1);
			v.setAttributeNS(null, "fx", gradient.x1);
			v.setAttributeNS(null, "fy", gradient.y1);
			v.setAttributeNS(null, "r", gradient.x2); //this is a bit hacky. :( 
		} else {
			console.log('done goofed');
			v = document.createElementNS(svgNS, "linearGradient");	
		}
		
		v.setAttributeNS(null, "id", gradient.id);
		v.setAttributeNS(null, "gradientUnits", "userSpaceOnUse");

		var s;
		for (var i=0;i<gradient.stops.length;i++){
			s = document.createElementNS(svgNS, "stop");
			s.setAttributeNS(null, "offset", (gradient.stops[i]*100).toFixed(2)+'%' );
			s.setAttributeNS(null, "stop-color", gradient.colors[i] );
			v.appendChild(s);
		}
		this.defs.appendChild(v);
		gradient.isAdded=true;
		
	}
	
	this.createLinearGradient = function(x1,y1,x2,y2){
		return new svgGradient(x1,y1,x2,y2,"linear");	
	}
	this.createRadialGradient = function(x0, y0, r0, x1, y1, r1){
		return new svgGradient(x0,y0,r1,r1,"radial");	 // only support a subset of radial gradients. where x1=x2 and y1=y2. fr=r
	}
	
	this._pixel_precision = 2;
	//.createPattern()
	//.shadowBlur = 0;
	//.shadowColor = ctx.shadowColor;
	//.shadowOffsetX
	//.shadowOffsetY
	
	/*.bezierCurveTo()
	.arcTo()
	.drawFocusIfNeeded()
	.scrollPathIntoView()
	.clip()
	.isPointInPath()
	.isPointInStroke()
	*/
	this._shape_type = 'path';
	this.fillStyle = '#000';
	this._path = '';
	this._isdrawn = false;
	this.clearAll = function(){
		while (this.target.lastChild) {
				this.target.removeChild(this.target.lastChild);
			}
	}
	this.arc = function(x,y,r,a1,a2,direction){
		this._shape_type = 'arc';
		this._shape = document.createElementNS(svgNS, "circle");
		this._shape.setAttributeNS(null, "r", r.toFixed(this._pixel_precision));
		this._shape.setAttributeNS(null, "cx", x.toFixed(this._pixel_precision));
		this._shape.setAttributeNS(null, "cy", y.toFixed(this._pixel_precision));
	}
	this.moveTo = function (x,y){
		this._path+= ' M' + x.toFixed(this._pixel_precision) + ' ' + y.toFixed(this._pixel_precision);
	}
	this.lineTo = function (x,y){
		this._path += ' L' + x.toFixed(this._pixel_precision) + ' ' + y.toFixed(this._pixel_precision);
	}
	this.beginPath = function(){
		this._shape_type = 'path';
		this._shape = document.createElementNS(svgNS, "path");
		this._path = '';
		this._isdrawn = false;
	}
	this.closePath = function(){
		this._path += 'Z';
	}
	this.quadraticCurveTo = function(x1,y1,x2,y2){
		this._path += ' Q' + x1.toFixed(this._pixel_precision) +' '+ y1.toFixed(this._pixel_precision) +' '+ x2.toFixed(this._pixel_precision) +' '+ y2.toFixed(this._pixel_precision);
	}
	this.bezierCurveTo = function(x1,y1,x2,y2,x3,y3){
		//console.log('bezierCurveTo is not implemented yet');
		this._path += ' Q' + (x1+x2)/02 +' '+ (y1+y2)/2 +' '+ x3.toFixed(this._pixel_precision) +' '+ y3.toFixed(this._pixel_precision);
	}
	this.stroke = function (){
		
		if ( ! this._shape.hasAttributeNS(null,"fill")){
			this._shape.setAttributeNS(null, "fill", 'none');
		}
		
		this._shape.setAttributeNS(null, "stroke-width", this.lineWidth.toFixed(this._pixel_precision));
		
		//this._shape.setAttributeNS(null, "stroke", this.strokeStyle);
		//standard fill
		if (typeof this.strokeStyle === "string"){
			this._shape.setAttributeNS(null, "stroke", this.strokeStyle);
		} else {
			//it is a gradient fill
			this.__addGradient(this.strokeStyle);
			this._shape.setAttributeNS(null, "stroke", "url(#"+this.strokeStyle.id+")");
		}
		
		if (this.globalAlpha <1 ){
				this._shape.setAttributeNS(null, "opacity", this.globalAlpha.toFixed(2));
		}
		this.__applyLineDash();
			
		
		if (!this._isdrawn){
			if (this._shape_type === 'path'){	this._shape.setAttributeNS(null, "d", this._path); }
			this.target.appendChild(this._shape);
			this._isdrawn = true;
		}
	}
	this.fill = function(){
		
		
		if ( ! this._shape.hasAttributeNS(null,"stroke")){
			this._shape.setAttributeNS(null, "stroke", 'none');
		}
		
		//standard fill
		if (typeof this.fillStyle === "string"){
			this._shape.setAttributeNS(null, "fill", this.fillStyle);
		} else {
			//it is a gradient fill
			this.__addGradient(this.fillStyle);
			this._shape.setAttributeNS(null, "fill", "url(#"+this.fillStyle.id+")");
		}
		
		if (this.globalAlpha <1 ){
				this._shape.setAttributeNS(null, "opacity", this.globalAlpha.toFixed(2));
		}
		
		if (!this._isdrawn){
			if (this._shape_type === 'path'){	this._shape.setAttributeNS(null, "d", this._path); }
			this.__applyLineDash();
			this.target.appendChild(this._shape);
			this._isdrawn = true;
		}
	}
	this.fillText = function (l,x,y){
		var t = document.createElementNS(svgNS, "text");
		var anchor = 'start';
		switch (this.textAlign){
		case 'left':anchor = 'start';break
		case 'right':anchor = 'end';break
		case 'center':anchor = 'middle';break
		case 'middle':anchor = 'middle';break
		}
		t.setAttributeNS(null, "text-anchor", anchor);
		//t.setAttributeNS(null, "fill", this.fillStyle);
		
		if (this.textBaseline !== 'alphabetic'){
			t.setAttributeNS(null, "alignment-baseline", this.textBaseline);
		}
		
		//standard fill
		if (typeof this.fillStyle === "string"){
			t.setAttributeNS(null, "fill", this.fillStyle);
		} else {
			//it is a gradient fill
			this.__addGradient(this.fillStyle);
			t.setAttributeNS(null, "fill", "url(#"+this.fillStyle.id+")");
		}
		
		if (this.globalAlpha <1 ){
				this._shape.setAttributeNS(null, "opacity", this.globalAlpha.toFixed(2));
		}
		
		t.setAttributeNS(null, "x", x.toFixed(this._pixel_precision));
		t.setAttributeNS(null, "x", x.toFixed(this._pixel_precision));
		t.setAttributeNS(null, "font-family", this.font_name );
		t.setAttributeNS(null, "y", y.toFixed(this._pixel_precision));
		t.setAttributeNS(null, "font-size", parseFloat(this.font.split(' ')[0].slice(0,-2)).toFixed(this._pixel_precision) );
		
		t.textContent=l;
		this.target.appendChild(t);
	}
	this.rect = function(x,y,w,h){
		this.moveTo(x,y);
		this.lineTo(x+w,y);
		this.lineTo(x+w,y+h);
		this.lineTo(x,y+h);
		this.lineTo(x,y);
	}
	this.fillRect = function(x,y,w,h){
		this._shape = document.createElementNS(svgNS, "rect");
		this._shape_type = 'rect';
		this._shape.setAttributeNS(null, "x", x.toFixed(x._pixel_precision));
		this._shape.setAttributeNS(null, "y", y.toFixed(y._pixel_precision));
		this._shape.setAttributeNS(null, "width", w.toFixed(w._pixel_precision));
		this._shape.setAttributeNS(null, "height", h.toFixed(h._pixel_precision));
		this.fill();
	}
	this.strokeText = function (l,x,y){	}
	this.startGroup = function(){
		this.targetStack.push(this.target);
		var g = document.createElementNS(svgNS, "g");
		this.target.appendChild(g);
		this.target = g;
	}
	this.endGroup = function(){
		this.target = this.targetStack.pop();
	}
	this.startClipBox = function(x,y,w,h){
		var defs = this.defs;
		
		var clippath = document.createElementNS(svgNS, "clipPath");
		clippath.setAttributeNS(null, "id", "graphClipPath");
		var rect = document.createElementNS(svgNS, "rect");
		rect.setAttributeNS(null, 'x', x.toFixed());
		rect.setAttributeNS(null, 'y', y.toFixed());
		rect.setAttributeNS(null, 'width', w.toFixed());
		rect.setAttributeNS(null, 'height', h.toFixed());
		
		clippath.appendChild(rect);
		
		defs.appendChild(clippath);
		
		this.target.appendChild(defs);
		this.targetStack.push(this.target);
		var g = document.createElementNS(svgNS, "g");
		g.setAttributeNS(null, 'clip-path', 'url(#graphClipPath)' );
		this.target.appendChild(g);
		this.target = g;
	}
	this.getImageData = this._ctx.getImageData;
	this.measureText = function(s){
		this._ctx.font = this.font;
		return {width:this._ctx.measureText(s).width}
	} ;
	
	this.image = function (x,y,w,h,data){
		this._shape = document.createElementNS(svgNS, "image");
		
		this._shape.setAttributeNS(null, "x", x.toFixed(this._pixel_precision));
		this._shape.setAttributeNS(null, "y", y.toFixed(this._pixel_precision));
		this._shape.setAttributeNS(null, "width", w.toFixed(this._pixel_precision));
		this._shape.setAttributeNS(null, "height", h.toFixed(this._pixel_precision));
		this._shape.setAttributeNS('http://www.w3.org/1999/xlink', "xlink:href", data );
		this.target.appendChild(this._shape);
		this._isdrawn = true;
	}
}

function drawSplash(canvas,ctx){
ctx.textAlign="center";

	ctx.beginPath();
	ctx.font='20 px "Monaco","Menlo","Ubuntu Mono","Consolas","source-code-pro",monospace"';
	ctx.fillText('MJS Plot',canvas.width/2,canvas.height/2-20);
	ctx.font='10 px "Monaco","Menlo","Ubuntu Mono","Consolas","source-code-pro",monospace"';
	ctx.fillText('Setting Up',canvas.width/2,canvas.height/2+20);
	ctx.rect(10,10,canvas.width-20,canvas.height-20);
	ctx.stroke();
}

var transforms = {
	scale_x: function(data,args,graph){
		for (var i = 0;i<data.length;i++){
			for (var j = 0;j<data[i][0].length;j++){
				data[i][0][j] = data[i][0][j] * args[0];
			}
		}
		graph.transform_text_x= graph.transform_text_x +'*'+mjs_precision(args[0],1);
	},
	nothing: function(data,args,graph){
		// a do nothing transform.
	},
	visvalingam: function(data,args,graph){ //https://bost.ocks.org/mike/simplify/
		var fraction = (1-5/(args+5));
		for (i = 0;i<data.length;i++){
			//compute the areas
			var areas = [];
			var centers = [];
			if (data[i][0].length < 3) { break; } // gtf out of here. not enough data, keep it all
			
			for (var j = 1;j<data[i][0].length-1;j++){ // loop from 1 to n-1 so that we can address j-1 ,j, and j+1 
				areas.push(Math.abs( data[i][0][j-1]*data[i][1][j] + data[i][0][j]*data[i][1][j+1] + data[i][0][j+1]*data[i][1][j-1] - data[i][0][j-1]*data[i][1][j+1] - data[i][0][j]*data[i][1][j-1] - data[i][0][j+1]*data[i][1][j] ) );
				centers.push(data[i][0][j]);
				// x1y2 + x2y3 + x3y1 – x1y3 – x2y1 – x3y2.
			}
			
			//there is a fast way to do this, but that can be implemented later...
			var areas_backup = areas.slice();
			areas.sort( function compareNumbers(a, b) {  return a - b;  } );
			var limit = areas[ Math.floor( areas.length * fraction ) ];
			
			var area = 0;
			var tri_start = 0;
			var tri_mid = 1;
			var tri_end = 2;
			var skips =1;
			var toRemove = []; // contains indixes of points to remove.
			while ( tri_end < data[i][0].length ){
				area = Math.abs( data[i][0][tri_start]*data[i][1][tri_mid]
				               + data[i][0][tri_mid  ]*data[i][1][tri_end]
				               + data[i][0][tri_end  ]*data[i][1][tri_start]
				               - data[i][0][tri_start]*data[i][1][tri_end]
				               - data[i][0][tri_mid  ]*data[i][1][tri_start]
				               - data[i][0][tri_end  ]*data[i][1][tri_mid]  );
				if (area > limit){
					//move forward
					tri_start += skips;
					skips = 1;
				} else {
					toRemove.push(tri_mid);
					skips +=1;
				}			
				tri_mid += 1;
				tri_end += 1;
			}
			
			for (j = 0;j<toRemove.length;j++){
				data[i][1][ toRemove[j] ] = NaN; // kill the point. this will be cleaned up later
			}
			
			
		}
		
		transforms.clean(data,graph);
		graph.transform_text_y= 'visvalingam(' + graph.transform_text_y + ',' + (100*fraction).toPrecision(2) + ')';
	},
	
	log_x: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][0][j] = Math.log10(data[i][0][j]);
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_x= 'log('+graph.transform_text_x +')';
	},
	x_c: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][0][j] = data[i][0][j]-args[0];
			}
		}
		graph.transform_text_x= graph.transform_text_x +'-'+ mjs_precision(args[0],graph.graphics_style.x_precision+1);
	},
	y_c: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] = data[i][1][j]-args[0];
			}
		}
		graph.transform_text_y = graph.transform_text_y +'-'+ mjs_precision(args[0],graph.graphics_style.y_precision+1);
	},
	remove_lines: function(data,args,graph){
		
		var hidden = args[0];
		var order = args[1];
		graph.captions = [];
		graph.data=[];
		graph.colors=[];
		graph.line_modes=[];
		graph.dash_modes=[];
		graph.symbol_modes=[];
	
		//do the reorder, then hide them.
		for (var i = 0;i<order.length;i++){
			var e = order[order.length - 1 - i]; //loop through it backwards, as we draw from back to front.
			if (!hidden[e]){
				graph.captions.push( graph.captions_backup[e]);
				graph.data.push(clone(graph.data_backup[e]));
				graph.colors.push( graph.colors_backup[e]);
				graph.line_modes.push( graph.line_modes_backup[e]);
				graph.dash_modes.push( graph.dash_modes_backup[e]);
				graph.symbol_modes.push( graph.symbol_modes_backup[e]);
			}
		}
	},
	y_vs_y: function(data,args,graph){
		
		//args[0] is the series ment to be the x-axis. 
		var x_axis = args[0] % data.length; //might be bigger than the data, so roll around
		var points = data[x_axis][0].length //Math.min(data[0][1].length,data[1][1].length);
		
		for (var i = 0;i<data.length;i++){
			var points = Math.min(data[i][0].length,data[x_axis][0].length);
				if (i!=x_axis){
					var newx = [];
					var newy = [];
					for (var j = 0;j<points;j++){
						newx[j] = data[x_axis][1][j];
						newy[j] = data[i][1][j];
					}
					data[i] = [ clone(newx),clone(newy) ];
					graph.captions[i] = graph.captions[x_axis] + ' vs ' + graph.captions[i];
				}
		}
		graph.transform_text_x= graph.captions[x_axis] + '('+graph.transform_text_y +')';
		//graph.transform_text_y= graph.captions[1] + '('+graph.transform_text_y +')';
		//data.splice(1,data.length-1);
		graph.captions.splice(x_axis,1);
		data.splice(x_axis,1);
		graph.colors.splice(x_axis,1);
	},
	sum: function(data,args,graph){
		var points = Math.min(data[0][0].length);
		var newx = [];
		var newy = [];
		for (j = 0;j<data[0][0].length;j++){
			newx[j] = data[0][0][j];
			newy[j] = 0.0;
			for (i = 0;i<data.length;i++){
				newy[j] += data[i][1][j];
			}
		}
		var t = "sum("
		for (i = 0;i<data.length;i++){
			t+= ", " + graph.captions[i];
		}
		t += ")"
		
		data[0] = [ newx,newy ];
		data.splice(1,data.length-1);
		graph.captions[0] = t ;
		graph.captions.splice(1,data.length-1);
		graph.transform_text_y = "sum(" + graph.transform_text_y +")";
		transforms.clean(data,graph);
		
	},
	ln_x: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][0][j] = Math.log(data[i][0][j]);
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_x= 'ln('+graph.transform_text_x +')';
	},
	e_to_x: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][0][j] = Math.pow(Math.E,data[i][0][j]);
			}
		}
		graph.transform_text_x= 'e^('+graph.transform_text_x +')';
	},
	ten_to_x: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][0][j] = Math.pow(10,data[i][0][j]);
			}
		}
		graph.transform_text_x= '10^('+graph.transform_text_x +')';
	},
	scale_y: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][1][j] = data[i][1][j] *  args[0];
			}
		}
		graph.transform_text_y= graph.transform_text_y +'*'+mjs_precision(args[0],1);
	},
	log_y: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] = Math.log10(data[i][1][j]);
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_y= 'log('+graph.transform_text_y +')';
	},
	ln_y: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] = Math.log(data[i][1][j]);
			}
		}
		transforms.clean(data,graph);
		
		graph.transform_text_y= 'ln('+graph.transform_text_y +')';
	},
	e_to_y: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] = Math.pow(Math.E,data[i][1][j]);
			}
		}
		graph.transform_text_y= 'e^('+graph.transform_text_y +')';
	},
	ten_to_y: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] = Math.pow(10,data[i][1][j]);
			}
		}
		graph.transform_text_y= '10^('+graph.transform_text_y +')';
	},
	one_over_y: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][1][j] = 1.0 / data[i][1][j];
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_y= '1/('+graph.transform_text_y +')';
	},
	custom_y: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			data[i][1] = parseExpression(graph,args[0],data[i][0],data[i][1])
		}
		transforms.clean(data,graph);
		graph.transform_text_y= 'f('+graph.transform_text_y +')';
	},
	custom_filter: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			var filter = parseExpression(graph,args[0],data[i][0],data[i][1]);
			for (j = 0;j<data[i][0].length;j++){
				if (!filter[j]){
					data[i][1][j] = NaN;
				}
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_y= 'filter('+graph.transform_text_y +')';
		
	},
	one_over_x: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][0][j] = 1.0 / data[i][0][j];
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_x= '1/('+graph.transform_text_x +')';
	},
	x_pow_n: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][0][j] = Math.pow(data[i][0][j],args[0]);
			}
		}
		graph.transform_text_x= '('+graph.transform_text_x +')^'+args[0];
	},
	y_pow_n: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] = Math.pow(data[i][1][j],args[0]);
			}
		}
		graph.transform_text_y= '('+graph.transform_text_y +')^'+args[0];
	},
	add_me: function(data,args,graph){
		graph.data = [[[2,2,3,4,4],[2,5,4,5,2]],[[5,7,6,6,5],[5,5,5,2,2]],[[8,10,10,8,8,10],[2,2,4,4,5,5]],[[1,1,11,11,1],[1,6,6,1,1]]];
		graph.captions = ['m','j','s',' '];
	},
	y_nth_root: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] = Math.pow(Math.abs(data[i][1][j]),1/args[0]);
			}
		}
		graph.transform_text_y= '('+graph.transform_text_y +')^1/'+args[0];
	},
	x_nth_root: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][0][j] = Math.pow(Math.abs(data[i][0][j]),1/args[0]);
			}
		}
		graph.transform_text_x= '('+graph.transform_text_x +')^1/'+args[0];
	},
	trim:function(data,args,graph){
		//removes any data outside of the box
		var xlow = args[0];
		var xhigh = args[1];
		var ylow = args[2];
		var yhigh = args[3];
		for (i = 0;i<data.length;i++){
			for(var ii = data[i][0].length - 1; ii >= 0; ii--) {
				if(  data[i][0][ii] < xlow ||
					 data[i][0][ii] > xhigh ||
					 data[i][1][ii] < ylow ||
					 data[i][1][ii] > yhigh ) {
					data[i][0][ii] = NaN;
				}
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_x= 'trim('+graph.transform_text_x +')';
		graph.transform_text_y= 'trim('+graph.transform_text_y +')';
	},
	cut:function(data,args,graph){
		//like trim, but removes any data in the box
		var xlow = args[0];
		var xhigh = args[1];
		var ylow = args[2];
		var yhigh = args[3];
		for (i = 0;i<data.length;i++){
			for(var ii = data[i][0].length - 1; ii >= 0; ii--) {
				if(  !(data[i][0][ii] < xlow ||
					 data[i][0][ii] > xhigh ||
					 data[i][1][ii] < ylow ||
					 data[i][1][ii] > yhigh)) {
					data[i][0][ii] = NaN;
				} 
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_x= 'cut('+graph.transform_text_x +')';
		graph.transform_text_y= 'cut('+graph.transform_text_y +')';
	},
	remove_linear: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			slope = linear_regression(data[i][0],data[i][1]);
			for (j = 0;j<data[i][0].length;j++){
				data[i][1][j] = data[i][1][j] - slope.a - slope.b*data[i][0][j];
			}
		}
		
		graph.transform_text_y= 'sub_linear('+graph.transform_text_y +')';
	},
	sublin : function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][1][j] = data[i][1][j] - args[1] - args[0]*data[i][0][j];
			}
		}
		var p = Math.max(graph.graphics_style.x_precision,graph.graphics_style.y_precision)+1;
		graph.transform_text_y= graph.transform_text_y +'-'+mjs_precision(args[1],p) +'-'+ mjs_precision(args[0],p)+'x';
	},
	swap_x_y: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			temp = data[i][0];
			data[i][0] = data[i][1];
			data[i][1] = temp;
		}
		var temp = graph.transform_text_x;
		graph.transform_text_x= graph.transform_text_y;
		graph.transform_text_y= temp;
	},
	normalise: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			ymin = Math.min.apply(null, data[i][1] );
			ymax = Math.max.apply(null, data[i][1] );
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] =  (data[i][1][j] - ymin)/(ymax-ymin);
			}
		}
		graph.transform_text_y= 'norm('+graph.transform_text_y +')';
	},
	mean_normalise: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			var s = series_stats(data[i][0],data[i][1]);
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] =  (data[i][1][j] - s.y_mean)/(s.sigma_y);
			}
		}
		graph.transform_text_y= 'norm('+graph.transform_text_y +')';
	},
	clean: function(data,graph){
		//cut off any infinites NaNs
		for (i = 0;i<data.length;i++){
			
			if (data[i].length == 2){
				/* this new method is much faster than the old method.
				it takes about the same time when removing 1 point, but can be 22x faster when removing many points. 
				*/
				var missing = 0;
				var len = data[i][0].length;
				var ii=0;
				var j = 0;
				while (ii < len){
					if(  ( isFinite(data[i][1][ii]) && isFinite(data[i][0][ii])  ) ) {
						data[i][0][j] = data[i][0][ii];
						data[i][1][j] = data[i][1][ii];
						j++;
					} else {
						missing++;
					}
					ii++;
				}
				data[i][0] = data[i][0].slice(0,len-missing);
				data[i][1] = data[i][1].slice(0,len-missing);
			}
			
			if (data[i].length == 3){
				var missing = 0;
				var len = data[i][0].length;
				var ii=0;
				var j = 0;
				while (ii < len){
					if(  ( isFinite(data[i][1][ii]) && isFinite(data[i][0][ii])  ) ) {
						data[i][0][j] = data[i][0][ii];
						data[i][1][j] = data[i][1][ii];
						data[i][2][j] = data[i][2][ii];
						j++;
					} else {
						missing++;
					}
					ii++;
				}
				data[i][0] = data[i][0].slice(0,len-missing);
				data[i][1] = data[i][1].slice(0,len-missing);
				data[i][2] = data[i][2].slice(0,len-missing);
			}
			
			if (data[i].length == 4){
				var missing = 0;
				var len = data[i][0].length;
				var ii=0;
				var j = 0;
				while (ii < len){
					if(  ( isFinite(data[i][1][ii]) && isFinite(data[i][0][ii])  ) ) {
						data[i][0][j] = data[i][0][ii];
						data[i][1][j] = data[i][1][ii];
						data[i][2][j] = data[i][2][ii];
						data[i][3][j] = data[i][3][ii];
						j++;
					} else {
						missing++;
					}
					ii++;
				}
				data[i][0] = data[i][0].slice(0,len-missing);
				data[i][1] = data[i][1].slice(0,len-missing);
				data[i][2] = data[i][2].slice(0,len-missing);
				data[i][3] = data[i][3].slice(0,len-missing);
			}
			
			
			
		}
		//remove any empty series.
		for (var ii = data.length - 1; ii >= 0; ii--){
			if (data[ii][0].length == 0){
				data.splice(ii,1);
				graph.captions.splice(ii,1);
				graph.colors.splice(ii,1);
				graph.symbol_modes.splice(ii,1);
				graph.line_modes.splice(ii,1);
				graph.dash_modes.splice(ii,1);
			}
		}
	},
	intergrate: function(data,args,graph){
		var tally = 0;
		for (i = 0;i<data.length;i++){
			tally = 0;
			tallys = [];
			tallys[0] = 0.0;
			for (j = 0;j<data[i][0].length-1;j++){
				tally += (data[i][0][j+1] - data[i][0][j]) * (data[i][1][j+1] + data[i][1][j])/2;
				tallys[j+1] = tally;
			}
			for (j = 0;j<data[i][0].length;j++){
				data[i][1][j] = tallys[j];
			}
		}
		graph.transform_text_y= 'int('+graph.transform_text_y +')';
	},
	accumulate: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 1;j<data[i][0].length;j++){
				data[i][1][j] = data[i][1][j] + data[i][1][j-1]; 
			}
		}
		graph.transform_text_y= 'accumulate('+graph.transform_text_y +')';
	},
	applySmooth: function(graph){
		var gs = graph.graphics_style;
		var n = gs.data_transforms.length;
		if (gs.data_transforms[n-1] == "smooth"){
			gs.data_transforms_args[n-1][0] = gs.data_transforms_args[n-1][0]*1.467799;
			graph.transform_index--;
		} else {
			gs.data_transforms[n] = "smooth";
			gs.data_transforms_args[n] = [2.1544339];
		}
	},
	smooth: function(data,args,graph){
		//simple linear smooth for now...
		var l = 0;
		var h = 0;
		var sumy= 0;
		var sumx = 0
		for (i = 0;i<data.length;i++){
			var width = Math.round(Math.min(data[i][0].length/3,args[0]/2)); //is half the apiture size
			var newx = [];
			var newy = [];
			var weights =[];
			//find weights
			var len = data[i][0].length;
			weights[0] = Math.sqrt(Math.pow(2*(data[i][0][1]-data[i][0][0]),2)+Math.pow(2*(data[i][1][1]-data[i][1][0]),2));
			weights[len-1] = Math.sqrt(Math.pow(2*(data[i][0][len-1]-data[i][0][len-2]),2)+Math.pow(2*(data[i][0][len-1]-data[i][1][len-2]),2));
			for (j = 1;j<data[i][0].length-1;j++){
				weights[j] = Math.sqrt(Math.pow(data[i][0][j+1]-data[i][0][j-1],2)+Math.pow(data[i][1][j+1]-data[i][1][j-1],2));
			}
			//weights[0] = weights[1];
			//weights[len-1] = weights[len-2];
			for (j = 0;j<data[i][0].length;j++){
				l = Math.max(j-width,0);
				h = Math.min(j+width,data[i][0].length-1);
				d = h-l;
				sumy = 0;
				sumx = 0;
				sumw = 0;
				for (var k = l;k<h;k++){
					sumx += data[i][0][k]*weights[k];
					sumy += data[i][1][k]*weights[k];
					sumw += weights[k];
				}
				newy[j] = sumy  / sumw;
				newx[j] = sumx  / sumw;
			}
			data[i] = [newx,newy];
		}
		graph.transform_text_y= 'smooth('+graph.transform_text_y +',' + Math.round(args[0]) + ')';
	},
	hist: function(data,args,graph){
		//make awesome histogram
		for (i = 0;i<data.length;i++){
			var ymin = Math.min.apply(null, data[i][1] );
			var ymax = Math.max.apply(null, data[i][1] );
			var val_i = 0;
			var power = -13 ;
			var notgood = 1;
			var scale = 0;
			var extra_sections = 2;
			var best_sections = Math.floor(Math.pow(data[i][1].length,0.5))*2;
			var scale = vals[val_i]* Math.pow(10,power);
			var sections = Math.ceil(ymax/scale)-Math.floor(ymin/scale)+extra_sections;
			
			while (sections > best_sections ){
				val_i+=1;	
				if (val_i == 3){
					val_i = 0;
					power +=1;
				}
				scale = vals[val_i]* Math.pow(10,power);
				sections = Math.ceil(ymax/scale)-Math.floor(ymin/scale)+extra_sections;
				
			}
			var lowpoint = Math.floor(ymin/scale-1)*scale; // bring low one section lower.
			var highpoint = Math.ceil(ymax/scale+1)*scale; //one section higher
			//starting from lowpoint to highpoint with bin widths of scale
			var bin_centers = [];
			var bin_counts = [];
			var bin_i = 0;
			for (bin_start = lowpoint;bin_start<highpoint;bin_start+=scale){
				var bin_end = bin_start+scale;
				bin_counts[bin_i] = 0;
				for (j = 0;j<data[i][1].length-1;j++){
					if (bin_start < data[i][1][j] && data[i][1][j] < bin_end){
						bin_counts[bin_i] +=1;
					}
				}
				bin_centers[bin_i] = (bin_start+bin_end)/2;
				bin_i++;
			}
			data[i][0] = bin_centers;
			data[i][1] = bin_counts;
			
		}
		graph.transform_text_y= 'hist('+graph.transform_text_y +')';
		graph.transform_text_x= 'bin_centers('+graph.transform_text_x +')';
	},
	
	kernals: function(data,args,graph){
		//jitter(y)
		var smoothing = args[0]; // how wide the kernal will be. in terms of the varience.
		// typical vaclues would be 0.1, 0.2 etc....
		var ymin;
		var ymax;
		var h = graph.canvas.height; // the maximum number of point needed for full resolution.
		var dy;
		var newx;
		var newy;
		var sigma;
		var varience;
		var n;
		console.log(n);
		for (i = 0;i<data.length;i++){
			sigma = online_variance(data[i][1]).sigma;//
			ymin = Math.min.apply(null, data[i][1] );
			ymax = Math.max.apply(null, data[i][1] );
			dy = (ymax-ymin);
			ymin-=0.2*dy;
			ymax+=0.2*dy;
			dy = (ymax-ymin)/h;
			sigma*=smoothing
			newx = [];
			newy = [];
			n= data[i][1].length;
			for (var k = 0;k<h;k++){
				newx.push(ymin+k*dy);
				newy.push(0);
			}
			for (j = 0;j<n;j++){
				//todo look up the normalisation methods.
				for (var k = 0;k<h;k++){
					newy[k] += Math.exp(  -1* Math.pow(newx[k]-data[i][1][j],2) / sigma )/n/Math.sqrt(sigma); 
				}
			}
			data[i][0] = newx;
			data[i][1] = newy;
		}
		graph.transform_text_y= 'kdf('+graph.transform_text_y +','+smoothing.toPrecision(2)+')';
	},
	subdivide: function(data,args,graph){
		var divisions = args;
		var i,j,k;
		var p,q;
		for (i = 0;i<data.length;i++){
			
			var newx = [];
			var newy = [];
			for (j = 0;j<data[i][0].length - 1;j++){ //from the start to the penultamate
				for (k=0;k<divisions;k++){
					
					p = k / (divisions);
					q = 1-p;
					newx.push( q*data[i][0][j]+p*data[i][0][j+1] );
					newy.push( q*data[i][1][j]+p*data[i][1][j+1] );
				}
			}
			newx.push( data[i][0][j] );
			newy.push( data[i][1][j] );
	
			data[i] = [newx,newy];
		}
		graph.transform_text_y= 'subdivide('+graph.transform_text_y +','+divisions+')';
	},
	interpolate: function(data,args,graph){
		var xmin = Math.min.apply(null, data[0][0] );
		var xmax = Math.max.apply(null, data[0][0] );;
		
		for (i = 0;i<data.length;i++){
			var xmini = Math.min.apply(null, data[i][0] );
			var xmaxi = Math.max.apply(null, data[i][0] );
			xmin = Math.min(xmin,xmini);
			xmax = Math.max(xmax,xmaxi);
		}
		
		var stepsize = (xmax-xmin)/args[0];
		for (i = 0;i<data.length;i++){
			
			//args[0] is the number of steps
			var newxs = [];
			var newys = [];
			for (j = 0;j<args[0];j++){
				newxs[j] = xmin+j*stepsize;
				
				//find closesest points on x below and above
				var closest_left = 1e200;
				var cli = 1;
				var closest_right = 1e200;
				var cri = data[i][0].length-2;
				
				for (k = 0;k<data[i][0].length;k++){
					var diff = newxs[j]-data[i][0][k];
					if (diff >= 0 && diff < closest_left){
						closest_left = diff;
						cli = k;
					}
					if (diff < 0 && -1*diff < closest_right){
						closest_right = -1*diff;
						cri =k;
					}
				}
				
				newys[j] = data[i][1][cli] + (data[i][1][cri]-data[i][1][cli])/(data[i][0][cri]-data[i][0][cli])*(newxs[j]-data[i][0][cli]);
			}
			data[i][0] = newxs;
			data[i][1]= newys;
			
		}
		transforms.clean(data,graph);
		
		graph.transform_text_y= 'interpolate('+graph.transform_text_y +','+args[0]+')';
		graph.transform_text_x= 'interpolate('+graph.transform_text_x +','+args[0]+')';
	},
	differentiate: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length-1;j++){
				data[i][1][j] = (data[i][1][j+1]-data[i][1][j])/(data[i][0][j+1]-data[i][0][j]);
				data[i][0][j] = (data[i][0][j] + data[i][0][j+1])/2;
			}
			data[i][1].pop();
			data[i][0].pop();
		}
		transforms.clean(data,graph);
		graph.transform_text_y= 'd/dx('+graph.transform_text_y +')';
	},
	subtract_fit: function(data,args,graph){
		var fit_method = args[0];
		for (i = 0;i<data.length;i++){
			var fit = fits.fit_funs[fits.fit_strings.indexOf(fit_method)](data[i][0],data[i][1]);
			var fit_points = fit.fun(data[i][0],fit.parameters);
			for (j = 0;j<data[i][0].length;j++){
				data[i][1][j] -= fit_points[j];
			}
		}
		transforms.clean(data,graph);
		graph.transform_text_y= graph.transform_text_y +'-'+fit.strings[0];
	},
	keep_outliers: function(data,args,graph){
		transforms.outliers_generic(data,args,graph,false);
	},
	remove_outliers: function(data,args,graph){
		transforms.outliers_generic(data,args,graph,true);
	},
	outliers_generic: function(data,args,graph,remove){
		//remove true = remove the outliers
		//remove false = remove the trend (keep outliers)
		var fit_method = args[0];
		var levels = [0.5,1,1.5,2,2.5,3];
		var i = args[1]%(levels.length)
		if (i<0){
			i += levels.length;
		}
		var threshold = levels[i]; //the number of sigma that is threshold
		for (i = 0;i<data.length;i++){
			var fit = fits.fit_funs[fits.fit_strings.indexOf(fit_method)](data[i][0],data[i][1]);
			var fit_points = fit.fun(data[i][0],fit.parameters);
			var r = [];
			var ri = 0;
			for (j = 0;j<data[i][0].length;j++){
				ri = data[i][1][j] - fit_points[j];
				if (isFinite(ri)){
					r.push( ri );
				}
			}
			//find sigma of r
			var sum_r = 0;
			var sum_rr = 0;
			for (var j = 0;j<r.length;j++){
				sum_r += r[j];
				sum_rr +=r[j]*r[j];
			}
			var n = r.length;
			sum_rr -= sum_r*sum_r/n;
			var sigma_r = Math.sqrt(sum_rr / n);
			//loop data again to find points further away than threshold
			if (remove){
				for (j = 0;j<data[i][0].length;j++){
					if ((data[i][1][j] - fit_points[j]) > threshold * sigma_r){
						data[i][1][j] = NaN;
					}
				}
			} else {
				for (j = 0;j<data[i][0].length;j++){
					if ((data[i][1][j] - fit_points[j]) < threshold * sigma_r){
						data[i][1][j] = NaN;
					}
				}
			}
			
		}
		transforms.clean(data,graph);
		if (remove){
			graph.transform_text_y= 'remove_outliers('+graph.transform_text_y+','+fit_method+','+threshold+')';
		} else {
			graph.transform_text_y= 'keep_outliers('+graph.transform_text_y+','+fit_method+','+threshold+')';
		}
	},
	jitter: function(data,args,graph){
		//jitter(y)
		var amount = args[0]; // a percentage. 
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length;j++){
				data[i][1][j] =  data[i][1][j] + (Math.random()*2-1)*amount*data[i][1][j]/100;
			}
		}
		graph.transform_text_y= 'jitter('+graph.transform_text_y +','+amount+'%)';
	},
	
	
	mean_bin: function(data,args,graph){
		//a  simple mean binning.
		var binsize = args[0]; // an interger number of point for the bin.
		console.log(binsize);
		for (i = 0;i<data.length;i++){
			var newx=[];
			var newy=[];
			for (j = 0;j+binsize<data[i][1].length;j+=binsize){
				var xbin =0;
				var ybin =0;
				for(var b=0;b<binsize;b++){
					xbin+=data[i][0][j+b];
					ybin+=data[i][1][j+b];
				}
				newx.push(xbin/binsize);
				newy.push(ybin/binsize);
			}
			data[i][0] = newx;
			data[i][1] = newy;
		}
		
		graph.transform_text_y= 'meanbin('+graph.transform_text_y +','+binsize+')';
	},
	//view only the last n data points. useful for rolling data
	view_last_n: function(data,args,graph){
		for (i = 0;i<data.length;i++){
			var l = data[i][1].length;
			data[i][1] = data[i][1].slice( Math.max(0,l-args[0]),l);
			data[i][0] = data[i][0].slice( Math.max(0,l-args[0]),l);
		}
	
	},
	spacing: function(data,args,graph){
		//the spacing between ajecent x points. 1/spacing is the dencity. 
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][1].length-1;j++){
				data[i][1][j] =  data[i][0][j+1] - data[i][0][j];
			}
			for (j = 0;j<data[i][1].length-1;j++){
				data[i][0][j] =  (data[i][0][j+1] + data[i][0][j])/2;
			}
			data[i][0][j] = 1/0;
		}
		transforms.clean(data,graph);
		graph.transform_text_y= 'spacing('+graph.transform_text_y +')';
		
	},
	dft: function(data,args,graph){
		/*
		 * need to have x data evenly spaced, run check and throw error if not.
		 * 
		 * use dft and plot magnitude vs freq
		 * 
		 * find what the freqs corrispond to
		 * 
		 * move data to 1st jan 1970? or do I need a differnt time axis that
		 * isn't absolute time.
		 * 		 
		 function computeDft(inreal, inimag) {
			var n = inreal.length;
			var outreal = new Array(n);
			var outimag = new Array(n);
			for (var k = 0; k < n; k++) {  // For each output element
				var sumreal = 0;
				var sumimag = 0;
				for (var t = 0; t < n; t++) {  // For each input element
					var angle = 2 * Math.PI * t * k / n;
					sumreal +=  inreal[t] * Math.cos(angle) + inimag[t] * Math.sin(angle);
					sumimag += -inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
				}
				outreal[k] = sumreal;
				outimag[k] = sumimag;
			}
			return [outreal, outimag];
		}
		
		 
		 */
		 
		 
	},
	time_to_num: function(data,args,graph){
		//convert a time to a number
		var axis = args[2];
		var reference = args[0];
		var time_axis = axis === 'x' ? 0 : 1;
		var other_axis = axis === 'x' ? 1 : 0;
		var units = [ 24*60*60*1000,60*60*1000,60*1000,1000 ];
		var unit = units[args[1]];
		//find reference number
		var offset = 0;
		if (reference ==0){
			offset = args[3];
		}
		if (reference ==1){
			var now = new Date();
			offset = now.getTime();
		}
		if (reference ==2){
			//from start
			var amin  = 1e+307; 
			var low = 1e+307; //very high. easy to shrink
			for (i = 0;i<data.length;i++){
				var amin = Math.min.apply(null, data[i][time_axis] );
				low = Math.min(amin,low);
			}
			offset = low;
		}
		if (reference ==3){
			//from end
			var ahigh  = 1e-307; 
			var high = 1e-307; //very high. easy to shrink
			for (i = 0;i<data.length;i++){
				var ahigh = Math.max.apply(null, data[i][time_axis] );
				high = Math.max(ahigh,high);
			}
			offset = high;
		}
		for (i = 0;i<data.length;i++){
			for (j = 0;j<data[i][0].length;j++){
				data[i][time_axis][j] = (data[i][time_axis][j] - offset)/unit;
			}
		}
		transforms.clean(data,graph);
	}
}

mjs_plot = {

new_graph : function (canvasID,oldcanvasID){
	"use strict";
	
	//for compatability with the old version.
	//where canvasname and name were reversed. we nee to try an find a canvas
	
	if (typeof oldcanvasID === 'string'){
		canvasID = oldcanvasID;
	}
	var canvas = document.getElementById(canvasID);
	
	//put up a simple splash screen.
	var ctx = canvas.getContext('2d');
	drawSplash(canvas,ctx);
	
	// canvas.style.cursor = "none"; // can only do this when there is a curse mode for everything.
	//canvas.style.cursor = "crosshair";
	
	var graphname;
	graphname = canvasID + window.location.pathname;//.split('/').pop().split('.').slice(0,1);
	graphname = 'G' + Math.abs(string_hash(graphname)); 
	
	
	var gs = load_gs(graphname);
	if (gs.v === MJS_PLOT_VERSION){
		//console.log('version is same');
	} else {
		gs  = mjs_plot.get_graph_style();
		console.log('version changed, get new style');
	}
	var graph = {
	graphics_style : gs,
	default_graphics_style : mjs_plot.get_graph_style(),
	graph_name : graphname,
	canvas_name : canvasID,
	drawfxmenu : false,
	drawlinemenu : false,
	drawinlinelinemenu : false,
	drawinlinesymbolmenu : false,
	drawinlinedashmenu : false,
	drawinlinecolormenu : false,
	drawmodemenu:false,
	drawfitsmenu : false,
	drawtimemenu : false,
	drawgraphmenu : false,
	drawapplystylemenu : false,
	drawremakecolormenu : false,
	drawFontMenu : false,
	drawStylemenu : false,
	drawcaptionmenu:false,
	drawxmenu:false,
	snap_positions: {x:[0],y:[0]}, // the snapping positions for using ctrl plus moving the mouse
	drawymenu:false,
	drawgridmenu:false,
	drawmarkermenu:false,
	timemenuoptions : [0,0], //which button is selected, [top row,bottom row] left to right.
	plot_failed : false,
	transparent : false,
	needs_drag_image : true,
	points_drawn : 0,
	orignal_canvas_width : 600,
	orignal_canvas_height : 400,
	isFullscreen : false,
	isSVG : false, // when using the SVG render is set to true.
	isPNGSVG : false,
	svg : '',
	errors : [],
	needsDataUpdate :false,
	data : [],
	data_backup : [],
	
	colors : [],
	colors_backup : [],
	
	captions : [],
	captions_backup : [],
	
	symbol_modes : [],
	symbol_modes_backup : [],
	
	line_modes : [],
	line_modes_backup : [],
	dash_modes : [],
	dash_modes_backup : [],
	__items_plotted : [], //for holding data before calling set_data
	__items_captions : [],
	
	
	onPlotFunctions :[],//each function in here is called after a plot
	fit_data : [], //save the fit data
	reader_index:[0,0],//the i,j indices in the data of the picked reader point. 
	transform_index : -1,
	transform_text_x : 'x',
	ui : {size:20,touch:is_touch_device(),mouse_is_dragging:false,
		is_touching : false,draw_time :1e200,copy_time:1e200,
		ticking:false,latestEvent:false,
		isMiddleMouseDrag : false,
		middleMouseDragRecoveryMode : gs.mouse_mode,
		anymenu:false,
		isWaitingForDraw:false,
		addMarker:"none", // the marker name to add
		addMarkerText:"TextHere",
		addMarkerExtras:{} }, //contains ui infomation.
	transform_text_y : 'y',
	drawing_methods : {
		draw_y_errors : function(graph,ctx,series,start,end,dot_size){
			ctx.beginPath();
			dot_size /=2;
			graph.points_drawn+=end-start;
			ctx.beginPath();
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var top_ei = graph.units_to_pixels(graph.data[series][1][j]+graph.data[series][2][j],'y');
				var bot_ei = graph.units_to_pixels(graph.data[series][1][j]-graph.data[series][2][j],'y');
				ctx.moveTo(xi,bot_ei);
				ctx.lineTo(xi,top_ei);
				ctx.moveTo(xi-dot_size,bot_ei);
				ctx.lineTo(xi+dot_size,bot_ei);
				ctx.moveTo(xi-dot_size,top_ei);
				ctx.lineTo(xi+dot_size,top_ei);
			}
			ctx.stroke();
		},
		draw_y_fill_between : function(graph,ctx,series,start,end,dot_size){
			graph.points_drawn+=end-start;
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var top_ei = graph.units_to_pixels(graph.data[series][1][j]+graph.data[series][2][j],'y');
			var bot_ei = graph.units_to_pixels(graph.data[series][1][j]-graph.data[series][2][j],'y');
			ctx.beginPath();
			ctx.moveTo(xi,bot_ei);
			ctx.lineTo(xi,top_ei);
			
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				top_ei = graph.units_to_pixels(graph.data[series][1][j]+graph.data[series][2][j],'y');
				bot_ei = graph.units_to_pixels(graph.data[series][1][j]-graph.data[series][2][j],'y');
				ctx.lineTo(xi,top_ei);
				ctx.lineTo(xi,bot_ei);
				ctx.closePath();
				ctx.fill();
				ctx.moveTo(xi,bot_ei);
				ctx.lineTo(xi,top_ei);
			}
			ctx.beginPath();
		},
		draw_x_errors : function(graph,ctx,series,start,end,dot_size){
			ctx.beginPath();
			dot_size /=2;
			graph.points_drawn+=end-start;
			ctx.beginPath();
			for (var j =start;j<end;j++){
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				var right_ei = graph.units_to_pixels(graph.data[series][0][j]+graph.data[series][3][j],'x');
				var left_ei = graph.units_to_pixels(graph.data[series][0][j]-graph.data[series][3][j],'x');
				ctx.moveTo(right_ei,yi);
				ctx.lineTo(left_ei,yi);
				ctx.moveTo(right_ei,yi+dot_size);
				ctx.lineTo(right_ei,yi-dot_size);
				ctx.moveTo(left_ei,yi+dot_size);
				ctx.lineTo(left_ei,yi-dot_size);
			}
			ctx.stroke();
		},
		line : function(graph,ctx,series,start,end){
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			ctx.beginPath();
			ctx.moveTo(xi,yi);
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.lineTo(xi,yi);
				var old_xi3 = xi;
				var old_yi3 = yi;
			}
			ctx.stroke();
		},
		sketch : function(graph,ctx,series,start,end){
			graph.points_drawn+=end-start;
			ctx.beginPath();
			var x1,x2,y1,y2;
			//var f = 0.2;
			x1 = graph.units_to_pixels(graph.data[series][0][start],'x');
			y1 = graph.units_to_pixels(graph.data[series][1][start],'y');
			ctx.moveTo(x1,y1);
			for (var j =start;j<end-1;j++){
				x2 = graph.units_to_pixels(graph.data[series][0][j+1],'x');
				y2 = graph.units_to_pixels(graph.data[series][1][j+1],'y');
				ctx.lineTo(x2,y2);
				//ctx.moveTo(x1-f*( x2-x1 ), y1-f*( y2-y1 ) );
				//ctx.quadraticCurveTo(x1+(0.5+Math.random()*f-f/2)*( x2-x1 ) + (Math.random()-0.5)*( x2-x1 )/3, y1+(0.5+Math.random()*f-f/2)*( y2-y1 )+ (Math.random()-0.5)*( y2-y1 )/3
				//,x1+(1+f)*( x2-x1 ), y1+(1+f)*( y2-y1 ) );
				
				
				x1 = graph.units_to_pixels(graph.data[series][0][j],'x');
				y1 = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.lineTo(x1,y1);
				//ctx.moveTo(x1-f*( x2-x1 ), y1-f*( y2-y1 ) );
				//ctx.quadraticCurveTo(x1+(0.5+Math.random()*f-f/2)*( x2-x1 ) + (Math.random()-0.5)*( x2-x1 )/3, y1+(0.5+Math.random()*f-f/2)*( y2-y1 )+ (Math.random()-0.5)*( y2-y1 )/3
				//,x1+(1+f)*( x2-x1 ), y1+(1+f)*( y2-y1 ) );
				
			}
			ctx.stroke();
		},
		box_fill : function(graph,ctx,series,start,end,dot_size){
			graph.points_drawn+=end-start;
			var xi, yi;
			ctx.beginPath();
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.rect(xi-dot_size/2,yi-dot_size/2,dot_size,dot_size);
			}
			ctx.fill();
		},
		box : function(graph,ctx,series,start,end,circle_size){
			graph.points_drawn+=end-start;
			var xi,yi;
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.rect(xi-circle_size/2,yi-circle_size/2,circle_size,circle_size);
				ctx.stroke();
			}
		},
		box_bg : function(graph,ctx,series,start,end,circle_size){
			graph.points_drawn+=end-start;
			var xi,yi;
			var oldfill = ctx.fillStyle;
			ctx.fillStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_bg);
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.rect(xi-circle_size/2,yi-circle_size/2,circle_size,circle_size);
				ctx.fill();
				ctx.stroke();
			}
			ctx.fillStyle = oldfill;
		},
		box_gap : function(graph,ctx,series,start,end,circle_size){
			graph.points_drawn+=end-start;
			var xi,yi;
			var oldstroke = ctx.strokeStyle;
			ctx.strokeStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_bg);
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.rect(xi-circle_size/2,yi-circle_size/2,circle_size,circle_size);
				ctx.fill();
				ctx.stroke();
			}
			ctx.strokeStyle = oldstroke;
		},
		ytext : function(graph,ctx,series,start,end,circle_size){
			graph.points_drawn+=end-start;
			var xi,yi;
			var oldTextAlign = ctx.textAlign;
			var oldFont = ctx.font;
			ctx.textAlign='center';
			//var size = graph.graphics_style.tick_labels_font_size*graph.graphics_style.scaling_factor;
			var size = circle_size * 0.7;
			ctx.font = ''+ size + 'px ' + graph.graphics_style.font_name;
			var oldfill = ctx.fillStyle;
			var bg =  renderColor(graph.canvas,ctx,graph.graphics_style.color_bg);
			var fg = oldfill;//renderColor(graph.canvas,ctx,graph.graphics_style.color_fg);
			ctx.fillStyle =bg;
			var label = '';
			var labelWidth = 10;
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				//ctx.beginPath();
				label = graph.get_axis_string( graph.data[series][1][j] ,'y',graph.graphics_style.y_precision) ;
				labelWidth = ctx.measureText(label).width;
				//console.log(xi,yi,size);
				ctx.fillStyle = bg;
				roundRectQuad(ctx,xi-labelWidth/2-size/4,
							  yi-size/2,
							  labelWidth+size*0.5,
							  1.3*size,
							  0.4*size)
				//ctx.rect(xi-labelWidth/2-size/4,yi-size/2,labelWidth+size*0.5,circle_size+1.2*size);
				ctx.fill();
				ctx.beginPath();
				ctx.fillStyle = fg;
				ctx.fillText(label,xi,yi+size/2);
				
			}
			ctx.textAlign=oldTextAlign;
			ctx.fillStyle = oldfill;
			ctx.font = oldFont;
		},
		
		// a stroked circle with no fill
		circ : function(graph,ctx,series,start,end,circle_size){
			circle_size/=2;
			ctx.beginPath();
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.arc(xi, yi, circle_size, 0 ,Math.PI*2, true);
				ctx.stroke();
			}
		},
		// a filled circle with no stroke
		circ_fill : function(graph,ctx,series,start,end,dot_size){
			dot_size/=2;
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				ctx.beginPath();
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.arc(xi, yi, dot_size, 0 ,Math.PI*2, true);
				ctx.fill();
				ctx.stroke();
			}
		},
		// a stroked circle with background fill 
		circ_bg : function(graph,ctx,series,start,end,circle_size){
			circle_size/=2;
			ctx.beginPath();
			ctx.beginPath();
			var oldfill = ctx.fillStyle;
			ctx.fillStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_bg);
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.arc(xi, yi, circle_size, 0 ,Math.PI*2, true);
				//ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
			ctx.fillStyle = oldfill;
		},
		// a filled circle with a background coloured stroke - gives a gap around the symbol
		circ_gap : function(graph,ctx,series,start,end,circle_size){
			circle_size/=2;
			ctx.beginPath();
			var oldstroke = ctx.strokeStyle;
			ctx.strokeStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_bg);
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.arc(xi, yi, circle_size, 0 ,Math.PI*2, true);
				//ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
			ctx.strokeStyle = oldstroke;
		},
		
		
		cross : function(graph,ctx,series,start,end,dot_size){
			dot_size/=2;
			ctx.beginPath();
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.moveTo(xi,yi-dot_size);
				ctx.lineTo(xi,yi+dot_size);
				ctx.moveTo(xi-dot_size,yi);
				ctx.lineTo(xi+dot_size,yi);
			}
			ctx.stroke();
		},
		x : function(graph,ctx,series,start,end,dot_size){
			dot_size/=2;
			ctx.beginPath();
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.moveTo(xi-dot_size,yi-dot_size);
				ctx.lineTo(xi+dot_size,yi+dot_size);
				ctx.moveTo(xi-dot_size,yi+dot_size);
				ctx.lineTo(xi+dot_size,yi-dot_size);
			}
			ctx.stroke();
		},
		asterix : function(graph,ctx,series,start,end,dot_size){
			dot_size/=2;
			ctx.beginPath();
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.moveTo(xi,yi-dot_size);
				ctx.lineTo(xi,yi+dot_size);
				ctx.moveTo(xi-0.9*dot_size,yi-0.6*dot_size);
				ctx.lineTo(xi+0.9*dot_size,yi+0.6*dot_size);
				ctx.moveTo(xi-0.9*dot_size,yi+0.6*dot_size);
				ctx.lineTo(xi+0.9*dot_size,yi-0.6*dot_size);
			}
			ctx.stroke();
		},
		burst : function(graph,ctx,series,start,end,dot_size){
			dot_size/=2;
			ctx.beginPath();
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.moveTo(xi,yi-dot_size);
				ctx.lineTo(xi,yi+dot_size);
				ctx.moveTo(xi-dot_size,yi);
				ctx.lineTo(xi+dot_size,yi);
				ctx.moveTo(xi-0.7*dot_size,yi-0.7*dot_size);
				ctx.lineTo(xi+0.7*dot_size,yi+0.7*dot_size);
				ctx.moveTo(xi-0.7*dot_size,yi+0.7*dot_size);
				ctx.lineTo(xi+0.7*dot_size,yi-0.7*dot_size);
			}
			ctx.stroke();
		},
		hash : function(graph,ctx,series,start,end,dot_size){
			ctx.beginPath();
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.moveTo(xi-dot_size/2,yi-dot_size/6);
				ctx.lineTo(xi+dot_size/2,yi-dot_size/6);
				ctx.moveTo(xi-dot_size/2,yi+dot_size/6);
				ctx.lineTo(xi+dot_size/2,yi+dot_size/6);
				
				ctx.moveTo(xi+dot_size/6,yi-dot_size/2);
				ctx.lineTo(xi+dot_size/6,yi+dot_size/2);
				ctx.moveTo(xi-dot_size/6,yi-dot_size/2);
				ctx.lineTo(xi-dot_size/6,yi+dot_size/2);
			}
			ctx.stroke();
		},
		linestar : function(graph,ctx,series,start,end,dot_size){
			ctx.beginPath();
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				fivestar(ctx,xi,yi,dot_size/2);
				ctx.stroke();
			}
		},
		star : function(graph,ctx,series,start,end,circle_size){
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				star(ctx,xi,yi,circle_size/2,0.5,6,0);
				ctx.stroke();
			}
		},
		fivestar : function(graph,ctx,series,start,end,circle_size){
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				star(ctx,xi,yi,circle_size/2,0.3,5,0);
				ctx.stroke();
			}
		},
		
		
		flower : function(graph,ctx,series,start,end,circle_size){
			var c=circle_size/2;
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.moveTo(xi-c,yi+c);
				ctx.quadraticCurveTo(xi,yi+c,xi,yi);
				ctx.quadraticCurveTo(xi,yi-c,xi-c,yi-c);
				ctx.quadraticCurveTo(xi-c,yi,xi,yi);
				ctx.quadraticCurveTo(xi+c,yi,xi+c,yi-c);
				ctx.quadraticCurveTo(xi,yi-c,xi,yi);
				ctx.quadraticCurveTo(xi,yi+c,xi+c,yi+c);
				ctx.quadraticCurveTo(xi+c,yi,xi,yi);
				ctx.quadraticCurveTo(xi-c,yi,xi-c,yi+c);
				ctx.closePath();
				ctx.stroke();
			}
		},
		none : function(graph,ctx,series,start,end,circle_size){
			return;
		},
		shuriken : function(graph,ctx,series,start,end,circle_size){
			ctx.beginPath();
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				star(ctx,xi,yi,circle_size/2,0.4,4,0);
				ctx.stroke();
			}
		},
		//the diamond shape with no fill, only the colourd stroke.
		diamond : function(graph,ctx,series,start,end,dot_size){
			dot_size /=2; 
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.moveTo(xi+dot_size,yi);
				ctx.lineTo(xi,yi-dot_size);
				ctx.lineTo(xi-dot_size,yi);
				ctx.lineTo(xi,yi+dot_size);
				//ctx.lineTo(xi+dot_size,yi);
				ctx.closePath();
				ctx.stroke();
			}
		},
		diamond_fill : function(graph,ctx,series,start,end,dot_size){
			dot_size /=2; 
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.moveTo(xi+dot_size,yi);
				ctx.lineTo(xi,yi-dot_size);
				ctx.lineTo(xi-dot_size,yi);
				ctx.lineTo(xi,yi+dot_size);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
		},
		diamond_bg : function(graph,ctx,series,start,end,dot_size){
			dot_size /=2; 
			graph.points_drawn+=end-start;
			var oldfill = ctx.fillStyle;
			ctx.fillStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_bg);
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.moveTo(xi+dot_size,yi);
				ctx.lineTo(xi,yi-dot_size);
				ctx.lineTo(xi-dot_size,yi);
				ctx.lineTo(xi,yi+dot_size);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
			ctx.fillStyle = oldfill;
		},
		diamond_gap : function(graph,ctx,series,start,end,dot_size){
			dot_size /=2; 
			graph.points_drawn+=end-start;
			var oldstroke = ctx.strokeStyle;
			ctx.strokeStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_bg);
			for (var j =start;j<end;j++){
				var xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				var yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.beginPath();
				ctx.moveTo(xi+dot_size,yi);
				ctx.lineTo(xi,yi-dot_size);
				ctx.lineTo(xi-dot_size,yi);
				ctx.lineTo(xi,yi+dot_size);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
			ctx.strokeStyle = oldstroke;
		},
		zig : function(graph,ctx,series,start,end){
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var old_xi3 = xi;
			var old_yi3 = yi;
			graph.points_drawn+=end-start;
			ctx.beginPath();
			ctx.moveTo(xi,yi);
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.lineTo(old_xi3,yi);
				ctx.lineTo(xi,yi);
				old_xi3 = xi;
				old_yi3 = yi;
			}
			ctx.stroke();
		},
		zag : function(graph,ctx,series,start,end){
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var old_xi3 = xi;
			var old_yi3 = yi;
			graph.points_drawn+=end-start;
			ctx.beginPath();
			ctx.moveTo(xi,yi);
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.lineTo(xi,old_yi3);
				ctx.lineTo(xi,yi);
				old_xi3 = xi;
				old_yi3 = yi;
			}
			ctx.stroke();
		},
		mid : function(graph,ctx,series,start,end){
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var old_xi2 = xi;
			var old_yi2 = yi;
			var old_xi3 = xi;
			var old_yi3 = yi;
			graph.points_drawn+=end-start;
			ctx.beginPath();
			ctx.moveTo(xi,yi);
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.lineTo((old_xi3+xi)/2,old_yi3);
				ctx.lineTo((old_xi3+xi)/2,yi);
				old_xi2 = old_xi3;
				old_yi2 = old_yi3;
				old_xi3 = xi;
				old_yi3 = yi;
			}
			xi = graph.units_to_pixels(graph.data[series][0][end-1],'x');
			yi = graph.units_to_pixels(graph.data[series][1][end-1],'y');
			ctx.lineTo(xi,yi);
			ctx.stroke();
		},
		hist : function(graph,ctx,series,start,end,zero){
			var hist_zero = zero ||  Math.min(graph.units_to_pixels(0,'y'),canvas.height);
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var old_xi2 = xi;
			var old_yi2 = yi;
			var old_xi3 = xi;
			var old_yi3 = yi;
			graph.points_drawn+=end-start;
			xi = graph.units_to_pixels(graph.data[series][0][start+1],'x');
			yi = graph.units_to_pixels(graph.data[series][1][start+1],'y');
			ctx.beginPath();
			ctx.moveTo(old_xi3-(xi-old_xi3)/2,hist_zero);
			ctx.lineTo(old_xi3-(xi-old_xi3)/2,old_yi3);
			ctx.lineTo((xi+old_xi3)/2,old_yi3);
			for (var j =start+1;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.lineTo((old_xi3+old_xi2)/2,old_yi3);
				ctx.lineTo((old_xi3+xi)/2,old_yi3);
				ctx.lineTo((old_xi3+xi)/2,hist_zero);
				old_xi2 = old_xi3;
				old_yi2 = old_yi3;
				old_xi3 = xi;
				old_yi3 = yi;
			}
			xi = graph.units_to_pixels(graph.data[series][0][end-1],'x');
			yi = graph.units_to_pixels(graph.data[series][1][end-1],'y');
			ctx.moveTo((old_xi2+xi)/2,hist_zero);
			ctx.lineTo((old_xi2+xi)/2,yi);
			ctx.lineTo(xi+(xi-old_xi2)/2,yi);
			ctx.lineTo(xi+(xi-old_xi2)/2,hist_zero);
			ctx.stroke();
		},
		fillBelow : function(graph,ctx,series,start,end,zero){
			var zero = zero ||  Math.min(graph.units_to_pixels(0,'y'),canvas.height);
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			ctx.beginPath();
			
			ctx.moveTo(xi,zero);
			ctx.lineTo(xi,yi);
			graph.points_drawn+=end-start;
			for (var j =start;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.lineTo(xi,yi);
				var old_xi3 = xi;
				var old_yi3 = yi;
			}
			ctx.lineTo(xi,zero);
			ctx.closePath();
			ctx.fill();
		},
		HighlightAndFill : function(graph,ctx,series,start,end,zero){
			ctx.globalAlpha=0.2;
			this.fillBelow(graph,ctx,series,start,end,zero);
			ctx.globalAlpha=1;
			this.line(graph,ctx,series,start,end);
		},
		LineAndFill : function(graph,ctx,series,start,end,zero){
			this.fillBelow(graph,ctx,series,start,end,zero);
			var oldstroke = ctx.strokeStyle;
			ctx.strokeStyle = renderColor(graph.canvas,ctx,graph.graphics_style.color_fg);
			this.line(graph,ctx,series,start,end);
			ctx.strokeStyle = oldstroke;
		},
		
		approx : function(graph,ctx,series,start,end){
			graph.points_drawn+=end-start;
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var old_xi1 = xi;
			var old_yi1 = yi;
			var old_xi2 = xi;
			var old_yi2 = yi;
			var old_xi3 = xi;
			var old_yi3 = yi;
			ctx.beginPath();
			ctx.moveTo(old_xi1,old_yi1);
			ctx.lineTo((old_xi1+xi)/2,(old_yi1+yi)/2);
			for (var j =start+1;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.quadraticCurveTo(old_xi3,old_yi3,(old_xi3+xi)/2,(old_yi3+yi)/2);
				old_xi1 = old_xi2;
				old_yi1 = old_yi2;
				old_xi2 = old_xi3;
				old_yi2 = old_yi3;
				old_xi3 = xi;
				old_yi3 = yi;
			}
			xi = graph.units_to_pixels(graph.data[series][0][end-1],'x');
			yi = graph.units_to_pixels(graph.data[series][1][end-1],'y');
			ctx.lineTo(xi,yi);
			ctx.stroke();
		},
		simiapprox : function(graph,ctx,series,start,end){
			graph.points_drawn+=end-start;
			var l = 0.3; // the ammount of rounding off. at 0.5 this is the same as the regular approx method
			var r = 1-l;
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var old_xi1 = xi;
			var old_yi1 = yi;
			var old_xi2 = xi;
			var old_yi2 = yi;
			var old_xi3 = xi;
			var old_yi3 = yi;
			ctx.beginPath();
			ctx.moveTo(old_xi1,old_yi1);
			ctx.lineTo(  old_xi1*r+xi*l,r*old_yi1+l*yi);
			for (var j =start+1;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.quadraticCurveTo(old_xi3,old_yi3,r*old_xi3+l*xi,r*old_yi3+l*yi);
				ctx.lineTo(l*old_xi3+r*xi,l*old_yi3+r*yi);
				old_xi1 = old_xi2;
				old_yi1 = old_yi2;
				old_xi2 = old_xi3;
				old_yi2 = old_yi3;
				old_xi3 = xi;
				old_yi3 = yi;
			}
			xi = graph.units_to_pixels(graph.data[series][0][end-1],'x');
			yi = graph.units_to_pixels(graph.data[series][1][end-1],'y');
			ctx.lineTo(xi,yi);
			ctx.stroke();
		},
		newinterp : function(graph,ctx,series,start,end){
			graph.points_drawn+=end-start;
			if (end - start < 3){
				this.line(graph,ctx,series,start,end); return;
			}
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var s = 6;
			//look forward to see the gradient
			var xi_1 = graph.units_to_pixels(graph.data[series][0][start+1],'x');
			var yi_1 = graph.units_to_pixels(graph.data[series][1][start+1],'y');
			var xi_2 = graph.units_to_pixels(graph.data[series][0][start+2],'x');
			var yi_2 = graph.units_to_pixels(graph.data[series][1][start+2],'y');
			var gx = xi_2 - xi;
			var gy = yi_2 - yi;
			var gl = Math.sqrt(gx*gx+gy*gy); gx/=gl;gy/=gl; //normalise the grad vector
			var old_gx = gx;
			var old_gy = gy;
			ctx.beginPath();
			ctx.moveTo(xi,yi);
			var dl = Math.sqrt( (xi_1 - xi)*(xi_1 - xi) + (yi_1 - yi)*(yi_1 - yi) );
			ctx.quadraticCurveTo(xi_1 - gx * dl/s,yi_1 - gy * dl/s,xi_1,yi_1);
			var mid_x, mid_y;
			for (var j =start+1;j<end-2;j++){
				xi = xi_1;
				yi = yi_1;
				xi_1 = xi_2;
				yi_1 = yi_2;
				old_gx = gx;
				old_gy = gy;
				xi_2 = graph.units_to_pixels(graph.data[series][0][j+2],'x');
				yi_2 = graph.units_to_pixels(graph.data[series][1][j+2],'y');
				dl = Math.sqrt( (xi_1 - xi)*(xi_1 - xi) + (yi_1 - yi)*(yi_1 - yi) );
				gx = xi_2 - xi;
				gy = yi_2 - yi;
				gl = Math.sqrt(gx*gx+gy*gy); gx/=gl;gy/=gl; //normalise the grad vector
				mid_x = 0.5*xi + 0.5*+ xi_1 + old_gx * dl/s/2  - gx * dl/s/2;
				mid_y = 0.5*yi + 0.5*+ yi_1 + old_gy * dl/s/2  - gy * dl/s/2;
				ctx.quadraticCurveTo(xi + old_gx * dl/s,yi + old_gy * dl/s,mid_x,mid_y);
				ctx.quadraticCurveTo(xi_1 - gx * dl/s,yi_1 - gy * dl/s,xi_1,yi_1);
			}
			
			ctx.quadraticCurveTo(xi_1 + gx * dl/s,yi_1 + gy * dl/s,xi_2,yi_2);
			
			
			ctx.stroke();
		},
		interp : function(graph,ctx,series,start,end){
			if (end - start < 3){
				this.line(graph,ctx,series,start,end); return;
			}
			graph.points_drawn+=end-start;
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var old_xi1 = xi;
			var old_yi1 = yi;
			var old_xi2 = xi;
			var old_yi2 = yi;
			var old_xi3 = graph.units_to_pixels(graph.data[series][0][start+1],'x');
			var old_yi3 = graph.units_to_pixels(graph.data[series][1][start+1],'y');
			var xi = graph.units_to_pixels(graph.data[series][0][start+2],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start+2],'y');
			ctx.beginPath();
			var smoothing = 5;
			ctx.moveTo(old_xi1,old_yi1);
			ctx.bezierCurveTo((old_xi3-old_xi1)/smoothing+old_xi1,
				(old_yi3-old_yi1)/smoothing+old_yi1,
				old_xi3-(xi-old_xi1)/smoothing,
				old_yi3-(yi-old_yi1)/smoothing,
				old_xi3,
				old_yi3
				);
			ctx.moveTo(old_xi2,old_yi2);
			for (var j =start+2;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				ctx.bezierCurveTo((old_xi3-old_xi1)/smoothing+old_xi2,
					(old_yi3-old_yi1)/smoothing+old_yi2,
					old_xi3-(xi-old_xi2)/smoothing,
					old_yi3-(yi-old_yi2)/smoothing,
					old_xi3,
					old_yi3
					);
				old_xi1 = old_xi2;
				old_yi1 = old_yi2;
				old_xi2 = old_xi3;
				old_yi2 = old_yi3;
				old_xi3 = xi;
				old_yi3 = yi;
			}
			xi = graph.units_to_pixels(graph.data[series][0][end-1],'x');
			yi = graph.units_to_pixels(graph.data[series][1][end-1],'y');
			//ctx.moveTo(old_xi3,old_yi3);
			ctx.bezierCurveTo((xi-old_xi1)/smoothing+old_xi2,
						(yi-old_yi1)/smoothing+old_yi2,
						xi-(xi-old_xi2)/smoothing,
						yi-(yi-old_yi2)/smoothing,
						xi,
						yi
						);
			ctx.stroke();
		},
		scribble : function(graph,ctx,series,start,end){
			if (end - start < 3){
				this.line(graph,ctx,series,start,end)
			}
			graph.points_drawn+=end-start;
			var xi = graph.units_to_pixels(graph.data[series][0][start],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start],'y');
			var old_xi1 = xi;
			var old_yi1 = yi;
			var old_xi2 = xi;
			var old_yi2 = yi;
			var old_xi3 = graph.units_to_pixels(graph.data[series][0][start+1],'x');
			var old_yi3 = graph.units_to_pixels(graph.data[series][1][start+1],'y');
			var  xi = graph.units_to_pixels(graph.data[series][0][start+2],'x');
			var yi = graph.units_to_pixels(graph.data[series][1][start+2],'y');
			ctx.beginPath();
			var smoothing = 0.5;//.2;
			ctx.moveTo(old_xi1,old_yi1);
					ctx.bezierCurveTo((old_xi3-old_xi1)/smoothing+old_xi1,
						(old_yi3-old_yi1)/smoothing+old_yi1,
						old_xi3-(xi-old_xi1)/smoothing,
						old_yi3-(yi-old_yi1)/smoothing,
						old_xi3,
						old_yi3
						);
			ctx.moveTo(old_xi2,old_yi2);
			for (var j =start+2;j<end;j++){
				xi = graph.units_to_pixels(graph.data[series][0][j],'x');
				yi = graph.units_to_pixels(graph.data[series][1][j],'y');
				
					ctx.bezierCurveTo((old_xi3-old_xi1)/smoothing+old_xi2,
						(old_yi3-old_yi1)/smoothing+old_yi2,
						old_xi3-(xi-old_xi2)/smoothing,
						old_yi3-(yi-old_yi2)/smoothing,
						old_xi3,
						old_yi3
						);
				old_xi1 = old_xi2;
				old_yi1 = old_yi2;
				old_xi2 = old_xi3;
				old_yi2 = old_yi3;
				old_xi3 = xi;
				old_yi3 = yi;
			}
			xi = graph.units_to_pixels(graph.data[series][0][end-1],'x');
			yi = graph.units_to_pixels(graph.data[series][1][end-1],'y');
			//ctx.moveTo(old_xi3,old_yi3);
			ctx.bezierCurveTo((xi-old_xi1)/smoothing+old_xi2,
						(yi-old_yi1)/smoothing+old_yi2,
						xi-(xi-old_xi2)/smoothing,
						yi-(yi-old_yi2)/smoothing,
						xi,
						yi
						);
			ctx.stroke();
		},
	},
	__plot:function(x,y,a,b,c,d){
		var r
		if(y instanceof Array) {
			r = [x,y];
		}else {
			var is = [];
			for (var i=0;i<x.length;i++){
				is.push(i);
			} 
			r = [is,x];
			
		}
		if(a instanceof Array) {r.push(a);}
		if(b instanceof Array) {r.push(b);}
		for (var c = 'Unlabeled', i=0;i<arguments.length;i++){
			if (typeof arguments[i] === 'string'){
				c = arguments[i];
			}
		}
		this.__items_captions.push(c);
		this.__items_plotted.push(r);
		this.draw();
	},
	clear:function(){
		this.__items_captions=[];
		this.__items_plotted=[];
		this.needsDataUpdate = true;
		return this;
	},
	plot:function (x,y,a,b,c,d){
		this.default_graphics_style.x_scale_mode = 'lin';
		this.default_graphics_style.y_scale_mode = 'lin';
		this.__plot(x,y,a,b,c,d);
		return this;
	},
	loglog:function (x,y,a,b,c,d){
		this.default_graphics_style.x_scale_mode = 'log';
		this.default_graphics_style.y_scale_mode = 'log';
		this.__plot(x,y,a,b,c,d);
		return this;
	},
	semilogy:function (x,y,a,b,c,d){
		this.default_graphics_style.x_scale_mode = 'lin';
		this.default_graphics_style.y_scale_mode = 'log';
		this.__plot(x,y,a,b,c,d);
		return this;
	},
	semilogx:function (x,y,a,b,c,d){
		this.default_graphics_style.x_scale_mode = 'log';
		this.default_graphics_style.y_scale_mode = 'lin';
		this.__plot(x,y,a,b,c,d);
		return this;
	},
	timeseries:function (x,y,a,b,c,d){
		this.default_graphics_style.x_scale_mode = 'time';
		this.default_graphics_style.y_scale_mode = 'lin';
		if (typeof x[0] === 'string'){
			this.__plot(mjs_plot.convert_time_strings(x),y,a,b,c,d);
		} else {
			this.__plot(x,y,a,b,c,d);
		}
		return this;
	},
	grid:function(x,y){
		this.default_graphics_style.show_xgrid = x;
		this.default_graphics_style.show_ygrid = y;
		return this;
	},
	useDefaults:function(){
		this.graphics_style.modified = false;
		return this;
	},
	draw:function(){
		//abuse-friendly spamming of draw(),
		//dosn't spam mjs_plot()
		if(!this.ui.ticking) {
			
			//don't do a draw if the user is in the middle of a menu or currentally drawing something.
			if (!this.ui.anymenu && !mouse_down){
				this.ui.ticking = true;
				this.ui.isWaitingForDraw = false;
				requestAnimationFrame( function(){graph.__draw_shim()} );
			} else if (!this.ui.isWaitingForDraw) {
				this.ui.isWaitingForDraw = true;
				setTimeout(function(){graph.draw()},200);
			}
			//requestAnimationFrame(graph.__draw_shimt);
			//requestAnimationFrame( function(){__draw_shim(graph)} );
			
		}
		return this;
	},
	
	 __draw_shim: function(){
		if (this.needsDataUpdate || this.data_backup.length != this.__items_plotted.length ){
				this.set_data(graph.__items_plotted);
				this.set_captions(graph.__items_captions);
				this.needsDataUpdate = false;
			}
		this.mjs_plot();
		this.ui.ticking = false;
	},
	
	
	title : function(title,subtitle,subsubtitle){
		this.default_graphics_style.title = title;
		if (subtitle){this.default_graphics_style.subtitle = subtitle;}
		if (subsubtitle){this.default_graphics_style.subtitle2 = subsubtitle;}	
		return this;
	},
	xlabel : function(s){
		this.default_graphics_style.x_axis_title = s;
		return this;
	},
	ylabel : function(s){
		this.default_graphics_style.y_axis_title = s;
		return this;
	},
	xlim: function(min,max){
		this.graphics_style.x_scale_auto_min = false;
		this.graphics_style.x_scale_auto_max = false;
		this.graphics_style.x_manual_max = Math.max(min,max);
		this.graphics_style.x_manual_min = Math.min(min,max);
		this.graphics_style.x_scale_tight = true;
		return this;
	},
	ylim: function(min,max){
		this.graphics_style.y_scale_auto_min = false;
		this.graphics_style.y_scale_auto_max = false;
		this.graphics_style.y_manual_max = Math.max(min,max);
		this.graphics_style.y_manual_min = Math.min(min,max);
		this.graphics_style.y_scale_tight = true;
		return this;
	},
	addTransform:function(name,args){
		this.graphics_style.data_transforms.push(name);
		this.graphics_style.data_transforms_args.push(args);
	},
	popTransform:function(){
		this.graphics_style.data_transforms.pop();
		this.graphics_style.data_transforms_args.pop();
	},
	set_data : function(data){
		"use strict";
		this.transform_index = -1;
		for (var i = 0;i<data.length;i++){
			if (data[i][0].length != data[i][1].length){
				this.errors.push("series " + i + " had different length x and y arrays");
			}
		}
		
		this.data_backup = clone(data);
		transforms.clean(this.data_backup,this);
		this.data = clone(this.data_backup);
		
		//check if things are the same lengths and provide errors
		if (this.data.length != data.length){
			this.errors.push("A series was cleaned away in set_data");
		} else {
			for (var i = 0;i<data.length;i++){
				//data might be longer than this.data if series were cut out.
				if (this.data[i][0].length != data[i][0].length){
					this.errors.push("series " + i + " had non finite values");
				}
			}
		}
		
		for (var i = 0;i<this.data.length;i++){
			this.graphics_style.hidden_lines[i] = this.graphics_style.hidden_lines[i] || false;
		}
		
		this._check_line_order();
		
		//chech that the line order is only contains unique items with no gaps
		//TODO..
		
		this.do_colours();
		this.do_symbols();
		this.do_line_modes();
	},
	add_data_from_json: function(d){
		/* d is array like containing objects that have the form
		caption: '',
		color:'',
		data:[[],[]],
		symbol_mode:'',
		line_mode: '',
		dash_mode:''
		* */
		
		if (typeof d === 'string'){
			d = JSON.parse(d);
		}
		if (!(typeof d === 'object' && typeof d[0] === 'object')){
			graph.errors.push('import failed');
			return
		}
		//as of now it assumes everything in d is well built and error free - HAH!
		//this.transform_index = -1;
		var series;
		for (var i=0;i<d.length;i++){
			series = d[i];
			//this.data.push(series.data);
			//this.data_backup.push(series.data);
			//this.captions.push(series.caption);
			//this.captions_backup.push(series.caption);
			//this.graphics_style.hidden_lines.push(true);
			//this.colors.push(series.color);
			//this.colors_backup.push(series.color);
			//this.line_modes.push(series.line_mode);
			//this.line_modes_backup.push(series.line_mode);
			//this.dash_modes.push(series.dash_mode);
			//this.dash_modes_backup.push(series.dash_mode);
			//this.symbol_modes.push(series.symbol_mode);
			//this.symbol_modes_backup.push(series.symbol_mode);
			this.__items_captions.push(series.caption);
			this.__items_plotted.push(series.data);
		
		}
		this.draw();
	},
	do_colours: function(){
		//console.log(this.graphics_style.line_colours);
		// TODO fix the colour generation methods to work and look good. 
		//var rand = Math.random();
		for (var i=0;i<this.data_backup.length;i++){
			this.graphics_style.line_colours[i] = this.graphics_style.line_colours[i] || this.graphics_style.color;
			//console.log(this.graphics_style.line_colours[i]);
			if (this.graphics_style.line_colours[i] === "byOne"){
				this.graphics_style.line_colours[i] = get_color(i,this.data_backup.length-1,0,0);
			}
			else if (this.graphics_style.line_colours[i] === "byOneLight"){
				this.graphics_style.line_colours[i] = get_color(i,this.data_backup.length-1,0.2,0.2);
			}
			else if (this.graphics_style.line_colours[i] === "byOneDark"){
				this.graphics_style.line_colours[i] = get_color(i,this.data_backup.length-1,-0.1,0.2);
			}
			else if (this.graphics_style.line_colours[i] === "byOnePastle"){
				this.graphics_style.line_colours[i] = get_color(i,this.data_backup.length-1,+0.1,-0.2);
			}
			else if (this.graphics_style.line_colours[i] === "byOneBold"){
				this.graphics_style.line_colours[i] = get_color(i,this.data_backup.length-1,0,+0.3);
			}
			else if (this.graphics_style.line_colours[i] === "caption"){
				this.graphics_style.line_colours[i] = color_from_string( this.captions_backup[i] ||  'label'  );
			}
			else if (this.graphics_style.line_colours[i] === "verticalGrad"){
				this.graphics_style.line_colours[i] = get_simple_gradient_color(i,this.data_backup.length-1,0,0,2); //get_simple_gradient_color(i,j,extraLightness,extraSaturation,position)
			}
			else if (this.graphics_style.line_colours[i] === "horisontalGrad"){
				this.graphics_style.line_colours[i] = get_simple_gradient_color(i,this.data_backup.length-1,0,0,6);
			}
			else if (this.graphics_style.line_colours[i] === "RadialGrad"){
				this.graphics_style.line_colours[i] = get_simple_gradient_color(i,this.data_backup.length-1,0,0,5);
			}
			else if (this.graphics_style.line_colours[i] === "darkGreys"){
				this.graphics_style.line_colours[i] =  get_greyscale_color(i,this.data_backup.length-1,0,.6);
			}
			else if (this.graphics_style.line_colours[i] === "lightGreys"){
				this.graphics_style.line_colours[i] =  get_greyscale_color(i,this.data_backup.length-1,0.4,0.6);
			}
			 // get_greyscale_color
			/*
			else if (this.graphics_style.line_colours[i] === "monoRed"){
				this.graphics_style.line_colours[i] = get_mono_color(i,this.data_backup.length-1,0.01);// get_mono_color(i,j,hue)
			}
			else if (this.graphics_style.line_colours[i] === "adjecentRed"){
				this.graphics_style.line_colours[i] = get_adjecent_color(i,this.data_backup.length-1,0.01);// get_mono_color(i,j,hue)
			}
			else if (this.graphics_style.line_colours[i] === "monoBlue"){
				this.graphics_style.line_colours[i] = get_mono_color(i,this.data_backup.length-1,0.7);
			}
			else if (this.graphics_style.line_colours[i] === "monoRand"){
				this.graphics_style.line_colours[i] = get_mono_color(i,this.data_backup.length-1,rand);
			}
			*/   // these mono and adjecent colors don't look good anyway. 
			else if (this.graphics_style.line_colours[i] === "spectrum"){
				this.graphics_style.line_colours[i] = get_spectrum_color(i,this.data_backup.length-1);
			}
			else if (this.graphics_style.line_colours[i] === "viridas"){
				this.graphics_style.line_colours[i] = get_viridas_color(i,this.data_backup.length-1);
			}
			else if (this.graphics_style.line_colours[i] === "plasma"){
				this.graphics_style.line_colours[i] = get_plasma_color(i,this.data_backup.length-1);
			}
			
		}
		//console.log(this.graphics_style.line_colours);
		this.colors = clone(this.graphics_style.line_colours);
		this.colors_backup = clone(this.colors);
		this.transform_index--;
	},
	redo_colours:function(){
		for (var i=0;i<this.data_backup.length;i++){
			this.graphics_style.line_colours[i] = false;
		}
		this.do_colours();
	},
	setLineColors:function(newlinecolor){
		graph.graphics_style.color = newlinecolor;
		graph.redo_colours();
		this.draw(); //request a draw
	},

	do_symbols:function(){
		
		for (var i=0;i<this.data_backup.length;i++){
			this.graphics_style.symbol_modes[i] = this.graphics_style.symbol_modes[i] || this.graphics_style.symbol_mode;
		}
		
		for (var i=0;i<this.data_backup.length;i++){
			if (this.graphics_style.symbol_modes[i] === "byOne"){
				this.graphics_style.symbol_modes[i] = symbols[i%symbols.length];
			} else if (this.graphics_style.symbol_modes[i] === "LineMarks"){
				this.graphics_style.symbol_modes[i] = ['x', 'cross','asterix','flower','linestar','star','burst','fivestar','shuriken','hash'][i%10]; //only show the line shapes
			} else if (this.graphics_style.symbol_modes[i] === "SolidMarks"){
				this.graphics_style.symbol_modes[i] = ['box_fill','circ_fill','diamond_fill'][i%3]; //only show the line shapes
			} else if (this.graphics_style.symbol_modes[i] === "GapedMarks"){
				this.graphics_style.symbol_modes[i] = ['box_gap','circ_gap','diamond_gap'][i%3]; //only show the line shapes
			} else if (this.graphics_style.symbol_modes[i] === "Emptymarks"){
				this.graphics_style.symbol_modes[i] = ['box_bg','circ_bg','diamond_bg'][i%3]; //only show the line shapes
			} else if (this.graphics_style.symbol_modes[i] === "ShapeMarks"){
				this.graphics_style.symbol_modes[i] = ['box','circ','diamond'][i%3]; //only show the line shapes
			}
			
		}
		this.symbol_modes = clone(this.graphics_style.symbol_modes);
		this.symbol_modes_backup = clone(this.graphics_style.symbol_modes);
		this.transform_index--;
	},
	do_line_modes : function(){
		for (var i=0;i<this.data_backup.length;i++){
			//pad the per-line modes from the single settings.
			this.graphics_style.line_modes[i] = this.graphics_style.line_modes[i] || this.graphics_style.line_mode;
			this.graphics_style.dash_modes[i] = this.graphics_style.dash_modes[i] || this.graphics_style.dash_mode;
		}
		this.line_modes = clone(this.graphics_style.line_modes);
		this.dash_modes = clone(this.graphics_style.dash_modes);
		this.line_modes_backup = clone(this.graphics_style.line_modes);
		this.dash_modes_backup = clone(this.graphics_style.dash_modes);
		this.transform_index--;
	},
	applyStyle:function(newStyle){
		if (typeof newStyle === 'string' && graphStyles.hasOwnProperty(newStyle)) {
			// use a named sttyle 
			updateDict(graphStyles['Plain'],this.graphics_style);
			updateDict({symbol_modes:[], line_modes:[], dash_modes:[], line_colours:[] },this.graphics_style); 
			updateDict(graphStyles[newStyle],this.graphics_style);
		} else if (typeof newStyle === 'object' ){
			updateDict(newStyle,this.graphics_style);
		} else {
			console.log('bad style:',newStyle);
			return
		}
		this.do_symbols();
		this.do_line_modes();
		this.do_colours();
		this.mjs_plot();
	},
    applyDefaultStyle:function(newStyle){
		if (typeof newStyle === 'string' && graphStyles.hasOwnProperty(newStyle)) {
			// use a named sttyle 
			updateDict(graphStyles['Plain'],this.default_graphics_style);
			updateDict({symbol_modes:[], line_modes:[], dash_modes:[], line_colours:[] },this.default_graphics_style); 
			updateDict(graphStyles[newStyle],this.default_graphics_style);
		} else if (typeof newStyle === 'object' ){
			updateDict(newStyle,this.default_graphics_style);
		} else {
			console.log('bad style:',newStyle);
			return
		}
	},
    
	_check_line_order:function(){
		//check the line order array is valid.
		var line_order = this.graphics_style.line_order;
		for (var i=0;i<this.data_backup.length;i++){
			if (line_order.indexOf(i) == -1 ) {
				line_order.push(i); // put it in if needed
			}
		}
		for (var i = 0 ; i < line_order.length ; i++ ){
			if (line_order.indexOf(line_order[i]) != i || line_order[i] <0 || line_order[i] >= this.data_backup.length){
				line_order.splice(i,1); //remove it, it dosn't point to anything
				i--;
			}	
		}
	},
	reset : function(){
		this.graphics_style = JSON.parse(JSON.stringify(graph.default_graphics_style));
		this.graphics_style.modified = false;
		this.transform_index= -1;
		this.do_colours();
		this.do_symbols();
		this.do_line_modes();
		this._check_line_order();
	},
	set_captions : function (captions){
	"use strict";
		this.captions_backup = clone(captions);
		this.captions = clone(captions);
		if (this.captions.length != this.data_backup.length){
			this.errors.push("number of captions and number of series don't match");
		}
		this.do_colours();
	},
	matchParentSize : function(){
		window.addEventListener("resize", function() {
			keep_parent_sized(graph);
		});
		requestAnimationFrame( function(){keep_parent_sized(graph)} ) ;
	},
	forceFullPage : function(){
		
		var viewPortTag=document.createElement('meta');
		viewPortTag.id="viewport";
		viewPortTag.name = "viewport";
		viewPortTag.content = "user-scalable=no, initial-scale=1, minimum-scale=1, maximum-scale=1";
		document.getElementsByTagName('head')[0].appendChild(viewPortTag);
		
		//document.querySelector('meta[name="viewport"]').content = 'user-scalable=no, initial-scale=1, minimum-scale=1, maximum-scale=1';
	
		graph.canvas.position = 'absolute';
		graph.canvas.style.left = 0;
		graph.canvas.style.top = 0;
		graph.canvas.style.width =  window.innerWidth;
		graph.canvas.style.height =  window.innerHeight;
		
		window.addEventListener("resize", function(){ keep_page_sized(graph) });
		requestAnimationFrame( function(){keep_page_sized(graph)} ) ;
	},
	find_scale : function (min_point,max_point,size,guide_width,scalemode,tight,axis){
	"use strict";
		if (scalemode === 'lin'){
			//linear scale
			var val_i = 0;
			if (Math.abs(min_point) > 1e-250){
			var power = Math.floor(Math.log10( max_point - min_point ))-10 ;
			} else {
			power = -250;
			} 
			var notgood = 1;
			var scale = 0;
			var width;
			var extra_sections = 0;
			if (tight){
			extra_sections = 0;
			} else {
			extra_sections = 2;
			}
			var best_sections = Math.floor( size / guide_width  ) +extra_sections;
			var scale = vals[val_i]* Math.pow(10,power);
			var sections = Math.ceil(max_point/scale)-Math.floor(min_point/scale)+extra_sections;
			
			while (sections > best_sections ){
				val_i+=1;	
				if (val_i == 3){
					val_i = 0;
					power +=1;
				}
				scale = vals[val_i]* Math.pow(10,power);
				sections = Math.ceil(max_point/scale)-Math.floor(min_point/scale)+extra_sections;
				
				
			}
			
			if (sections == 0){	width = size;}
			else{width = size/sections;	}
			
			if (tight){
				var lowpoint = Math.floor(min_point/scale)*scale;
				var highpoint = Math.ceil(max_point/scale)*scale; 
			} else {
				var lowpoint = Math.floor(min_point/scale-1)*scale; // bring low one section lower.
				var highpoint = Math.ceil(max_point/scale+1)*scale; //one section higher
			}
			return the_scale = {
				lowpoint : lowpoint,
				highpoint : highpoint,
				scale : scale,
				width : width,
				val_i : val_i,
				val_i_low : 1, //not used
				power_low : 1, //not used
				val_i_high : 1, //not used
				power_high : 1, //not used
				scalemode : scalemode
			}
		}
		
		if (scalemode === 'log'){
		//log scale
		var val_i = 0;
		var power = 100;
		var log_vals_i = -1;
		var do_not_use_linear = false;
		var required_secions = Math.floor( size / guide_width  );
		sections = 0;
		
		
		//the normal log view using the prebuilt arrays
		while (sections < required_secions){
			log_vals_i +=1;
			power = Math.ceil(Math.log10(min_point))+1;
			val_i = 0;
			while (log_vals[log_vals_i][val_i] * Math.pow(10,power) >= min_point){
				//roll down to find the low
				val_i -=1;
				if (val_i < 0){
					power -= 1;
					val_i = log_vals[log_vals_i].length-1;
				}
			}
			//roll down one more, this marks the low point
			if (tight == false){
				val_i -=1;
				if (val_i < 0){
					power -= 1;
					val_i = log_vals[log_vals_i].length-1;
				}
			}
			var val_i_low = val_i;
			var power_low = power;
			//roll up to find the high point and index keeping track on the number of sections
			sections = 0;
			while (log_vals[log_vals_i][val_i] * Math.pow(10,power) <= max_point){
				
				val_i +=1;
				sections +=1;
				if (val_i >= log_vals[log_vals_i].length){
					power += 1;
					val_i = 0;
				}
			}
			if (tight === false){
				//roll up one more
				val_i +=1;
				sections +=1;
				if (val_i >= log_vals[log_vals_i].length){
					power += 1;
					val_i = 0;
				}
			}
			var val_i_high = val_i;
			var power_high = power;
			
			//use a standard log view
			lowpoint = Math.log10(  log_vals[log_vals_i][val_i_low] * Math.pow(10,power_low) ) ;//far left point
			 highpoint = Math.log10(  log_vals[log_vals_i][val_i_high] * Math.pow(10,power_high) ); //far right point
			 scale = -1; //not used! // the width of a section on the graph.
			 width = size / sections; //also not used! //is the width of one section in pixels
			 log_vals_i = log_vals_i; //which log scale to use. . .
			 
			 //try a unlogy view
			if ( (log_vals_i-1 >= log_vals.length || Math.log10(max_point)-Math.log10(min_point) < 0.6) && do_not_use_linear == false ){
				
				the_scale = this.find_scale(min_point,max_point,size,guide_width,'lin',tight);
				if (the_scale.lowpoint > 0 && (Math.log10(the_scale.highpoint)-Math.log10(the_scale.lowpoint) < 0.6) ){
					lowpoint = Math.log10(the_scale.lowpoint);
					highpoint = Math.log10(the_scale.highpoint);
					scale = the_scale.scale;
					width = the_scale.width;
					log_vals_i = the_scale.val_i;
					sections = required_secions;
				} else {
					do_not_use_linear = true; sections = 0;
				}
				
			} 
			
		}
		
		if (scale < 0){
			//this corrects for the log finding scale loop.
			//it addes one at the end which is not needed if
			//the scale is ok. 
			//log_vals_i -=1;
		}
		if (log_vals_i == 0 && sections > 2*required_secions){
		//do the far zoomed out log scale.
		//if using si numbers change the way liner scales are found.
		var c = (axis === 'y' && ( this.graphics_style.y_label_mode === 'infix' || this.graphics_style.y_label_mode === 'postfix' ));
		c = c || (axis === 'x' && ( this.graphics_style.x_label_mode === 'infix' || this.graphics_style.x_label_mode === 'postfix' ));
		if (c){ vals = [1,3,6,9];}
		the_scale = this.find_scale( Math.max(-249,Math.log10(min_point)),Math.min(249,Math.log10(max_point)),size,guide_width,'lin',tight);
		if (c){ vals = [1,2,5];}
		lowpoint = the_scale.lowpoint; //308 is the javascript float maxamum and minimum
		highpoint = the_scale.highpoint;
		scale = the_scale.scale;
		scalemode = 'log';
		width = the_scale.width;
		log_vals_i = -1; // ! this is the flag to use the zoomed out view.
		}
		
		return the_scale = {
					lowpoint : lowpoint,
					highpoint : highpoint,
					scale : scale, 
					width : width, 
					val_i : log_vals_i,
					val_i_low : val_i_low,
					power_low : power_low,
					val_i_high : val_i_high,
					power_high : power_high,
					scalemode : scalemode
				}
		}
		if (scalemode ==='time'){
		//min_point,max_point,size,guide_width,scalemode,tight
			if (tight){
			var extra_sections = 0;
			} else {
			var extra_sections = 2;
			}
			var required_sections = Math.floor( size / guide_width  ) +extra_sections;
			var target_time_diff = (max_point-min_point)/required_sections;
			var i = 0;
			while (allowed_intervals[i] < target_time_diff){i++;}
			//i++;
			//can only go up to intervals of 500years.
			//so cap i at 43 :allowed_intervals.length-1;
			i = Math.min(i,allowed_intervals.length-1);
			
			extra_sections/=2;
			
			var start_time = min_point-(min_point%allowed_intervals[i]) - extra_sections*allowed_intervals[i];
			var high_time = max_point-(max_point%allowed_intervals[i]) + extra_sections*allowed_intervals[i];// +allowed_intervals[i] ;
			
			if (allowed_intervals[i]>=31536000000){
				//using years
				var d = new Date(start_time);
				d = new Date(d.getFullYear(),0,0);
				start_time = d.getTime();
				
				var d = new Date(high_time);
				d = new Date(d.getFullYear() + Math.round(allowed_intervals[i]/1000/60/60/24/365) + Math.round( d.getMonth()/12 ),0,0);
				high_time = d.getTime();
			}
			
			if (allowed_intervals[i]>=2592000000  && allowed_intervals[i]< 31536000000){
				//using months
				var d = new Date(start_time);
				d = new Date(d.getFullYear(),d.getMonth(),1);
				start_time = d.getTime();
				var d = new Date(high_time);
				if (d.getDate() < 15){
					d = new Date(d.getFullYear(),d.getMonth(),1);
				} else {
					d = new Date(d.getFullYear(),d.getMonth()+1,1);
				}
				high_time = d.getTime()+allowed_intervals[i];
			}
			
			if (allowed_intervals[i]>=43200000  && allowed_intervals[i]< 2592000000){
				//using days
				var d = new Date(start_time);
				var c = new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0,0);
				start_time = c.getTime();
				
				var d = new Date(high_time);
				d = new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0,0);
				high_time = d.getTime()+allowed_intervals[i];
			}
			
			if (allowed_intervals[i]>=1800000  && allowed_intervals[i]<= 21600000){
				//using hours
				var d = new Date(start_time);
				var c = new Date(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours(),0,0,0);
				start_time = c.getTime();
				
				var d = new Date(high_time);
				d = new Date(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours()+1,0,0,0);
				high_time = d.getTime();
			}
			
			if (allowed_intervals[i]==7200000 ){
				//every two hours
				var d = new Date(start_time);
				var c = new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(d.getHours()/2)*2,0,0,0);
				start_time = c.getTime();
				
				var d = new Date(high_time);
				d = new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(1+d.getHours()/2)*2,0,0,0);
				high_time = d.getTime();
			}
			
			if (allowed_intervals[i]==10800000 ){
				//every three hours
				var d = new Date(start_time);
				var c = new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(d.getHours()/3)*3,0,0,0);
				start_time = c.getTime();
				
				var d = new Date(high_time);
				d = new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(1+d.getHours()/3)*3,0,0,0);
				high_time = d.getTime();
			}
			if (allowed_intervals[i]==21600000 ){
				//every six hours
				var d = new Date(start_time);
				var c = new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(d.getHours()/6)*6,0,0,0);
				start_time = c.getTime();
				
				var d = new Date(high_time);
				d = new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(1+d.getHours()/6)*6,0,0,0);
				high_time = d.getTime();
			}
			if (allowed_intervals[i]<1800000 ){
				high_time += allowed_intervals[i];
			}
			
			var number_of_sections = Math.floor((high_time-start_time)/allowed_intervals[i]);
			var number_of_minor_ticks = Math.floor((high_time-start_time)/time_ticks[i]);
			var tick_scale = size/number_of_minor_ticks;
			var the_scale;
			return the_scale = {
					lowpoint : start_time,
					highpoint : high_time,
					scale : (high_time-start_time)/number_of_sections, 
					width : size/number_of_sections,//, //abuse here //grr no! now this is causing bugs......
					val_i : i,
					tick_scale:tick_scale, //all I've now done is move the abuse to here... :/
					val_i_low : 0, 
					power_low : 0,
					val_i_high : 0,
					power_high : 0,
					scalemode : 'time' 
				}
		}
	},
	find_limits : function(data,automin,automax,manualmin,manualmax,scale,name){
		"use strict";
		//data is [   [],[],...]
		// automax and automin are bools
		//manualmax and manual min are values for the min and max
		//scale is a string, e.g. 'log','lin'.
		//return object has:
		// limits.low limits.high
		// limits.scale //it can change to log or lin by looking at the data.
		//limits.automax
		//limits.automin //can change if a scale uses the autos or not. 
		//name is a string so that errors are more useful to the user.
		//protect agains +- infinity.
		manualmax = Math.min(manualmax,1e250);
		manualmin = Math.max(manualmin,-1e250);
		//protect against numbers smaller than 1e-250
		
		var t = manualmax;
		manualmax = Math.max(manualmax,manualmin);
		manualmin = Math.min(t,manualmin);
		//protect against times really far away. this could be improved.
		if (scale === 'time'){
			manualmax = Math.min(manualmax,+100000000000000);
			manualmin = Math.max(manualmin,-100000000000000);
		}
			//protect against empty data series
			this.no_data = false;
			if (data.length == 0){
				if (!automin && !automax){
					low = manualmin;
					high = manualmax;
				} else {
					low = 1;
					high = 10;
					automin = true;
					automax = true;
				}
				if (scale === 'log'){
					if (low<=0){low = 1;}
					if (high<=0 || low > high){high = 10;}
				}
				
				this.no_data = true;
				return {low:low, high:high, automax:automax,automin:automin,scale:scale};
				
			}
			//catch negatives for the log scale
			if (scale === 'log'){
				if (manualmin <= 0 && automin == false){
					automin = true;
					this.errors.push(name + " minimum was negative - using auto");
				}
				if (manualmax <= 0 && automax == false){
					automin = true;
					automax = true;
					this.errors.push(name + " maximum was negative - using auto");
				}
			}
			if ((automin == true ||
				automax == true ||
				low>=high	)){
				var amin  = 1e+307; 
				var amax = -1e+307;
				var low = 1e+307; //very high. easy to shrink
				var high = -1e+307; //very low. easy to grow
				for (i = 0;i<data.length;i++){
					var amin = Math.min.apply(null, data[i] );
					var amax = Math.max.apply(null, data[i] );
					low = Math.min(amin,low);
					high = Math.max(amax,high);
				}
			}
			
			if (this.data.length == 1 && this.data[0][0].length == 1 ){
				low = 0.6*Math.min(low,high);
				high = 1.6*Math.max(low,high);
			}
			//catch the case were it is off the range of data and trying to set the autos
			if (manualmin > high && automax && !automin){
				automin = true;
				automax = true;
				this.errors.push(name + " can't have inverted scale - using auto");
			}
			if (manualmax < low && automin && !automax){
				automin = true;
				automax = true;
				this.errors.push(name + " can't have inverted scale - using auto");
			}
			
			if (automin == false){
				low = manualmin;
			}
			if (automax == false){
				high = manualmax;
			}
			if (scale === 'log' && high <= 0){
				scale = 'lin';
				this.errors.push("all "+name+" data is negative, cant plot that log"+name);
			}
			if (scale === 'log' && low<=2e-250){
				low = 2e250;
				for (var i = 0;i<data.length;i++){
					//find lowest y that isn't zero
					for (var ii = 0;ii<this.data[i][1].length;ii++){
						if (data[i][ii] > 0 && data[i][ii] < low){
							low = data[i][ii];
						}
					}
				}
				
			}
		if (scale === 'log'){
			manualmax = Math.max(manualmax,2e-250);
			manualmin = Math.max(manualmin,2e-250);
		}			
		//catch the case where low is high
			if (low == high){
				low = 0.6*Math.min(low,high);
				high = 1.6*Math.max(low,high);
			}
			
		return {low:low, high:high, automax:automax,automin:automin,scale:scale};
	},
	use_scale : function (the_scale,target_size,guideWidth,axis){
		"use strict";
		var lowpoint = the_scale.lowpoint; 
		var highpoint = the_scale.highpoint;
		var scale = the_scale.scale;
		var width = the_scale.width;
		var val_i = the_scale.val_i;
		var val_i_low =the_scale.val_i_low;
		var power_low = the_scale.power_low;
		var val_i_high = the_scale.val_i_high;
		var power_high = the_scale.power_high;
		var scalemode =  the_scale.scalemode;
		//var target_size = 300;//this is going to be canvas.width or canvas.height depending which one is being used. . . 
		var many_tick_limit = 1;
		var pos = [];
		var strings = [];
		var minor_pos = [];
		var val_is;
		var power;
		var old_i;
		
		if (scalemode === 'lin'){
			var tick = 0;// for the dummy run start at the far left, even though there
			//won't be an actual label there.
			var prev_label = ' ';
			var precision = 1;
			var label = '';
			
			var zero_position = (0-lowpoint)*target_size/(highpoint - lowpoint)
			
			
			//dummy run to get the precision
			while (tick <= target_size) {
				i = tick/width*scale+lowpoint;
				//if (Math.abs(i)< not_zero) {i=0;}//javasript sucks.
				label = i.toPrecision(precision);
				if (label === prev_label){precision += 1;label = i.toPrecision(precision);}
				prev_label = label;
				tick += width;
			}
			
			//draw it this time
			tick = width;
			var j = 1;
			//j here is just the same as tick/width.
			//however repeated additions of width lead to annoying floating point errors.
			//using j reduces the number of floating point problums
			
			while (tick < target_size-1) {
				i = j*scale+lowpoint;
				pos.push(tick);
				//if (Math.abs(i)< not_zero) {i=0;}//javasript sucks.
				
				//within 2 pixels of zero. call it zero
				if (Math.abs(tick - zero_position) <2){
					label = (0).toFixed(Math.max(1,precision-1));
					
				} else {
					//label = mjs_precision(i,precision);
					label = this.get_axis_string(i,axis,precision);
				}
				strings.push(label);
				tick += width;
				j +=1;
			}
			
			var stepping = label.length*.7*this.graphics_style.tick_labels_font_size*this.graphics_style.scaling_factor > width;
			
			tick = 0;
			var minor_ticks = 1;
				if ( width > guideWidth*many_tick_limit) {
					minor_ticks = many_minor_ticks[val_i];
				//use many small ticks
				} else {
				//use few small ticks
					minor_ticks = few_minor_ticks[val_i];
				}
			while (tick < target_size-2) {
				tick += width/minor_ticks;
				minor_pos.push(tick);
			}
			minor_pos.pop();
		}
		//the far zoomed out view.
		if (scalemode === 'log' && val_i == -1){
			var tick = 0;// for the dummy run start at the far left, even though there
			//won't be an actual label there.
			var prev_label = ' ';
			var precision = 1;
			var label = '';
			
			//dummy run to get the precision
			while (tick <= target_size) {
				i = Math.pow(10,tick/width*scale+lowpoint);
				label = i.toPrecision(precision);
				if (label === prev_label){precision += 1;label = i.toPrecision(precision);}
				prev_label = label;
				tick += width;
			}
			
			//draw it this time
			tick = width;
			var j = 1;
			//j here is just the same as tick/width.
			//however repeated additions of width lead to annoying floating point errors.
			//using j reduces the number of floating point problums
			while (tick < target_size-1) {
				i = Math.pow(10,j*scale+lowpoint);
				pos.push(tick);
				//label = mjs_precision(i,precision);
				label = this.get_axis_string(i,axis,precision);
				strings.push(label);
				
				tick += width;
				j +=1;
			}
			
			var stepping = label.length*.7*this.graphics_style.tick_labels_font_size*this.graphics_style.scaling_factor > width;
			
			tick = 0;
			var minor_ticks = 1;
				if ( width > guideWidth*many_tick_limit) {
					minor_ticks = many_minor_ticks[val_i];
				//use many small ticks
				} else {
				//use few small ticks
					minor_ticks = few_minor_ticks[val_i];
				}
			while (tick <= target_size) {
				minor_pos.push(tick);
				tick += width/minor_ticks;
			}
			minor_pos.pop();
		}
		 if (scalemode === 'log' && val_i != -1){
			//the pure log mode
			if (scale < 0) {
				val_is = val_i_low;
				power = power_low;
				i = log_vals[val_i][val_i_low] * Math.pow(10,power_low);
				old_i = i;
				precision = 1;
				var lable = '';
				var old_lable = ''
				//dummy run for precision
				while (i < log_vals[val_i][val_i_high] * Math.pow(10,power_high) ){
					val_is +=1; 
					if (val_is >= log_vals[val_i].length){
						power += 1;
						val_is = 0;
					}
					i = log_vals[val_i][val_is] * Math.pow(10,power);
					tick = (Math.log10(i)-lowpoint)*target_size/(highpoint - lowpoint);
					
					lable = this.get_axis_string(i,axis,precision);
					if (lable === old_lable){
					precision++;
					lable = this.get_axis_string(i,axis,precision);
					}
					old_lable = lable;
				}
				//actual run
				i = log_vals[val_i][val_i_low] * Math.pow(10,power_low);
				val_is = val_i_low;
				power = power_low;
				while (i < log_vals[val_i][val_i_high] * Math.pow(10,power_high) ){
					val_is +=1; 
					if (val_is >= log_vals[val_i].length){
						power += 1;
						val_is = 0;
					}
					i = log_vals[val_i][val_is] * Math.pow(10,power);
					tick = (Math.log10(i)-lowpoint)*target_size/(highpoint - lowpoint);
					
					if (tick< target_size-10){
						//strings.push(mjs_precision(i,2));
						strings.push(this.get_axis_string(i,axis,precision));
						
						pos.push(tick);
					}
					//use the mid point rule for minor ticks 
					if (val_i > 8){
						var mid = (Math.log10( (old_i + i)/2  )-lowpoint)*target_size/(highpoint - lowpoint);
						minor_pos.push(mid);
					}
					
					old_i = i;
				}
				
				//use the minor ticks array 
				if (val_i <= 8){
					i = log_vals[val_i][val_i_low] * Math.pow(10,power_low);
					val_is = val_i_low;
					power = power_low;
					while (i < log_vals[val_i][val_i_high] * Math.pow(10,power_high)){
						val_is +=1;
						if (val_is >= log_vals_ticks[val_i].length){
							power += 1;
							val_is = 0;
						}
						i = log_vals_ticks[val_i][val_is] * Math.pow(10,power);
						tick = (Math.log10(i)-lowpoint)*target_size/(highpoint - lowpoint); 
						minor_pos.push(tick);
						
					}
					minor_pos.pop();
				}
			} else {
				//log mode with a linear labels and ticks( really zoomed in).
				var tick = 0;
				var prev_label = ' ';
				var precision = 1;
				var label = '';
				//dummy run to get the precision
				i = Math.pow(10,lowpoint);
				while (i <= Math.pow(10,highpoint) ) {
					label = i.toPrecision(precision);
					if (label === prev_label){precision += 1;label = i.toPrecision(precision);}
					prev_label = label;
					i += scale;
				}
				//sepping if the labels are really long. this stops them running into each other.
				//the other way of doing this is to not show every other label. or re-analyse the
				//data with a larger min_width. = label.lendth*text_size/2
				var stepping = label.length*.7*this.graphics_style.tick_labels_font_size*this.graphics_style.scaling_factor >= width;
				//draw it this time
				i = Math.pow(10,lowpoint)+scale;
				
				while (i < Math.pow(10,highpoint)-scale/2  ) {
					//label = mjs_precision(i,precision);
					label = this.get_axis_string(i,axis,precision);
					tick = (Math.log10(i)-lowpoint)*target_size/(highpoint - lowpoint); 
					pos.push(tick);
					strings.push(label);
					i += scale;
				}
				//draw minor ticks
				var minor_ticks = 1;
					if ( width >guideWidth*many_tick_limit) {
						minor_ticks = many_minor_ticks[val_i];
					//use many small ticks
					} else {
					//use few small ticks
						minor_ticks = few_minor_ticks[val_i];
					}
				i = Math.pow(10,lowpoint);
				while (i < Math.pow(10,highpoint)) {
					i += scale/minor_ticks;
					tick = (Math.log10(i)-lowpoint)*target_size/(highpoint - lowpoint); 
					minor_pos.push(tick);
				}
				minor_pos.pop();
			}
		}
		
		if (scalemode ==='time'){
			var i = the_scale.val_i;
			//find the high point precision
			var total_diff = (highpoint-lowpoint);
			//find which interval to use. 
			j = 0;
			while (allowed_intervals[j] < total_diff){j++;}
			
			j--;
			
			var low_precision = string_precisions[i];
			var high_precision = string_precisions[j];
			
			//check that the low-precision is enough.
			
			//dummy run to get precision
			var section_time = lowpoint;
			var first_lable = mjs_date_print(section_time,high_precision,high_precision);
			var tick = 0;
			var old_label = '';
			var label = '';
			while (section_time < highpoint) {
				
				section_time+=allowed_intervals[i];
				
				if (allowed_intervals[i]>=2592000000){
					section_time = round_to_month(section_time);
				}
				
				tick = (section_time-lowpoint)/total_diff * target_size;
				
				label = mjs_date_print(section_time,high_precision,low_precision)
				if (label === old_label){
					//i--;
					low_precision++;
					//low_precision = string_precisions[i];
				}
				old_label = label;
			
			}
			var last_lable = mjs_date_print(section_time,high_precision,high_precision);
			if (last_lable === first_lable){
				high_precision++;
			}
			
			var section_time = lowpoint;
			var tick = 0;
			var mtick = 0;
			//for ( var section_time = lowpoint;section_time<highpoint;){
			var minorTickWidth = the_scale.tick_scale;
			while (section_time < highpoint-allowed_intervals[i] && tick+width < target_size-2) {
				
				section_time+=allowed_intervals[i];
				
				if (allowed_intervals[i] >= 2592000000){
					section_time = round_to_month(section_time);
					
				}
				tick = (section_time-lowpoint)/total_diff * target_size;
				
				pos.push(tick);
				
				label = mjs_date_print(section_time,high_precision,low_precision);
				strings.push(label);
				
				while (mtick < tick) {
					mtick += minorTickWidth;
					minor_pos.push(mtick);
				}
				mtick = tick;
				minor_pos.pop();
				
			}
			
			while (mtick <= target_size-2) {
					mtick += minorTickWidth;
					minor_pos.push(mtick);
			}
			minor_pos.pop();
			
			stepping = false;
			var stepping = label.length*.7*this.graphics_style.tick_labels_font_size*this.graphics_style.scaling_factor > width;

			
			precision = low_precision;
		}
		return {pos:pos, strings:strings, minor_pos:minor_pos, stepping:stepping, precision:precision}
	},
	fit_points_drawn : 0,
	drawSimpleLine : function(ctx,x,y){
		
				var xi = this.units_to_pixels(x[0],'x');
				var yi = this.units_to_pixels(y[0],'y');
				var oxi = xi;
				var oyi = yi;
				ctx.beginPath();
				ctx.moveTo(xi,yi);
				var ongraph = true;
				var wasOngraph = true;
				for (var k = 0;k<x.length;k++){
					this.fit_points_drawn++;
					var yi = this.units_to_pixels(y[k],'y');
					var xi =  this.units_to_pixels(x[k],'x');
					ongraph = (yi > 0 && yi < this.canvas.height);
					if (ongraph && wasOngraph){
						ctx.lineTo(xi,yi);
					}
					if (!ongraph && wasOngraph){
						ctx.lineTo(xi,yi);
						ctx.stroke();
					}
					if (ongraph && !wasOngraph){
						ctx.beginPath();
						ctx.moveTo(oxi,oyi);
						ctx.lineTo(xi,yi);
						
					}
					wasOngraph = ongraph;
					oxi = xi;
					oyi=yi;
				}
				ctx.stroke();
	},
	mjs_plot : function () {
	"use strict";
	var start_time = new Date();
	//catch errors in plotting
	if (this.plot_failed){
		this.errors.push('failed for unknown reason');
		this.reset();
	}
	this.plot_failed = true; //is set to false at  the end. 
	
	// gs is the graph style.
	//get things out of gs.
	//if gs.modified is false use the default style
	if (this.graphics_style.modified == false){
		this.reset();
	}
	
	var gs = this.graphics_style;
	var ctx = this.canvas.getContext('2d');
	
	
	
	if (this.isPNGSVG){
		this.isSVG=true;
	}
	if (this.isSVG){
		var oldctx = ctx;
		var ctx = new SVGContext(ctx);
	}
	
	ctx.lineJoin="round";
	var canvas = this.canvas;
	
	
	var scaling_factor =gs.scaling_factor;
	var graph_line_thickness =gs.graph_line_thickness*scaling_factor;
	var symbol_size = gs.symbol_size*scaling_factor;
	var line_thickness= gs.line_thickness*scaling_factor;
	var tick_len = gs.tick_len*scaling_factor;
	var mode = gs.mode;
	var font_name = gs.font_name;
	var title_font_size = gs.title_font_size*scaling_factor;
	var title = gs.title;
	var subtitle = gs.subtitle;
	var title_spacing = gs.title_spacing*scaling_factor;
	var tick_labels_font_size = gs.tick_labels_font_size*scaling_factor;
	var tick_lables_font_padding = gs.tick_lables_font_padding*scaling_factor;
	var axis_labels_font_size=gs.axis_labels_font_size*scaling_factor;
	var lable_spacing =gs.lable_spacing*scaling_factor;
	var x_axis_title =gs.x_axis_title;
	var y_axis_title = gs.y_axis_title;
	var minor_tick_len = gs.minor_tick_len*scaling_factor;
	var guideWidthx = gs.guideWidthx*scaling_factor;
	var guideWidthy = gs.guideWidthy*scaling_factor;
	
	// clear prevous drawing
	ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
	ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg); //gs.color_fg;
	
	// background drawing code
	if (this.transparent ){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	} else {
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
	}
	if (this.isSVG){
		//ctx.clearAll();
		ctx.font_name = font_name;
		ctx.startClipBox(0,0,canvas.width,canvas.height)
	}
	
	//run data transforms
	//back up data so the transforms can mess it up	
	if (this.transform_index != gs.data_transforms.length ){
		
		this.colors_backup = clone(gs.line_colours);
		this.line_modes_backup = clone(gs.line_modes);
		this.dash_modes_backup = clone(gs.dash_modes);
		this.symbol_modes_backup = clone(gs.symbol_modes);
		
		this.transform_index = 0;
		this.transform_text_x = x_axis_title;//'x';
		this.transform_text_y = y_axis_title;//'y';
		
		this._check_line_order();
		//hide/show lines from the lines menu and reorder
		transforms.remove_lines(this.data,[gs.hidden_lines,gs.line_order],this);
	}
	
	//run the transforms
	while(this.transform_index<gs.data_transforms.length){
			var fun = transforms[gs.data_transforms[this.transform_index]]
			fun(this.data,gs.data_transforms_args[this.transform_index],this);
			this.transform_index++;
	}
	
	//TODO use a.concat(c,b) method here and test for speed improvements.
	var xdata = [];
	var ydata = [];
	for (var i = 0;i<this.data.length;i++){
		xdata.push(this.data[i][0]);
		ydata.push(this.data[i][1]);
	}
	
	var xlimits = this.find_limits(xdata,gs.x_scale_auto_min,gs.x_scale_auto_max,gs.x_manual_min,gs.x_manual_max,gs.x_scale_mode,'x');
	var xlow = xlimits.low;
	var xhigh = xlimits.high;
	gs.x_scale_auto_min = xlimits.automin;
	gs.x_scale_auto_max = xlimits.automax;
	gs.x_scale_mode = xlimits.scale;
	
	var ylimits = this.find_limits(ydata,gs.y_scale_auto_min,gs.y_scale_auto_max,gs.y_manual_min,gs.y_manual_max,gs.y_scale_mode,'y');
	var ylow = ylimits.low;
	var yhigh = ylimits.high;
	gs.y_scale_auto_min = ylimits.automin;
	gs.y_scale_auto_max = ylimits.automax;
	gs.y_scale_mode = ylimits.scale;
	
	var the_scalex = this.find_scale(xlow,xhigh,this.canvas.width,guideWidthx,gs.x_scale_mode,gs.x_scale_tight,'x');
	var the_scaley = this.find_scale(ylow,yhigh,this.canvas.height,guideWidthy,gs.y_scale_mode,gs.y_scale_tight,'y');
	
	var lowpointx = the_scalex.lowpoint; //far left point
	var highpointx = the_scalex.highpoint; //far right point
	var scalex = the_scalex.scale; // the width of a section on the graph.
	var widthx = the_scalex.width;  //is the width of one section in pixels
	var val_ix = the_scalex.val_i; //the posistion in vals or log_vals
	var val_i_lowx =the_scalex.val_i_low;
	var power_lowx = the_scalex.power_low;
	var val_i_highx = the_scalex.val_i_high;
	var power_highx = the_scalex.power_high;
	var lowpointy = the_scaley.lowpoint;
	var highpointy = the_scaley.highpoint;
	var scaley = the_scaley.scale;
	var widthy = the_scaley.width;
	var val_iy = the_scaley.val_i;
	var val_i_lowy =the_scaley.val_i_low;
	var power_lowy = the_scaley.power_low;
	var val_i_highy = the_scaley.val_i_high;
	var power_highy = the_scaley.power_high;
	
	//set the graphics style x_auto_max mins...
	gs.x_auto_min = lowpointx;
	gs.x_auto_max = highpointx;
	gs.y_auto_min = lowpointy;
	gs.y_auto_max = highpointy;
	//TODO remove these? only used in units to pizels and pixels to units functions. could store them in the graph object. stop polluting the gs
	
	var positionsx = this.use_scale(the_scalex,canvas.width,guideWidthx,'x');
	var positionsy = this.use_scale(the_scaley,canvas.height,guideWidthy,'y');
	//if the autos are on update the manual settings
	if (gs.y_scale_auto_min ){
		gs.y_manual_min = this.pixels_to_units(this.canvas.height,'y');
	}
	if (gs.y_scale_auto_max ){
		gs.y_manual_max = this.pixels_to_units(0,'y');
	}
	if (gs.x_scale_auto_min ){
		gs.x_manual_min = this.pixels_to_units(0,'x');
	}
	if (gs.x_scale_auto_max ){
		gs.x_manual_max = this.pixels_to_units(this.canvas.width,'x');
	}
	
	gs.scalex = scalex;
	gs.scaley = scaley;
	gs.widthx = widthx;
	gs.widthy = widthy;
	
	this.snap_positions.y = positionsy.minor_pos.concat(positionsy.pos);
	this.snap_positions.x = positionsx.minor_pos.concat(positionsx.pos);
	
	
	//draw a xgrid.
	if (gs.show_xgrid){
		ctx.strokeStyle = renderColor(canvas,ctx,gs.color_mg);
		ctx.beginPath();
		for (var i = 0;i<positionsx.pos.length;i++){
			var x = positionsx.pos[i];
			ctx.moveTo(x,0);
			ctx.lineTo(x,canvas.height);
		}
		ctx.stroke();
	}
	//draw a ygrid.
	if (gs.show_ygrid){
		ctx.strokeStyle = renderColor(canvas,ctx,gs.color_mg);
		ctx.beginPath();
		for (var i = 0;i<positionsy.pos.length;i++){
			var y = canvas.height - positionsy.pos[i];
			ctx.moveTo(0,y);
			ctx.lineTo(canvas.width,y);
		}
		ctx.stroke();
	}
	
	//draw a minor xgrid
	if (gs.show_xgrid==2){
		ctx.strokeStyle = renderColor(canvas,ctx,gs.color_mg);
		ctx.lineWidth = graph_line_thickness/2;
		ctx.beginPath();
		for (var i = 0;i<positionsx.minor_pos.length;i++){
			var x = positionsx.minor_pos[i];
			ctx.moveTo(x,0);
			ctx.lineTo(x,canvas.height);
		}
		ctx.stroke();
		ctx.lineWidth = graph_line_thickness;
	}
	//draw a minor ygrid
	if (gs.show_ygrid==2){
		ctx.strokeStyle = renderColor(canvas,ctx,gs.color_mg);
		ctx.lineWidth = graph_line_thickness/2;
		ctx.beginPath();
		for (var i = 0;i<positionsy.minor_pos.length;i++){
			var y = canvas.height - positionsy.minor_pos[i];
			ctx.moveTo(0,y);
			ctx.lineTo(canvas.width,y);
		}
		ctx.stroke();
		ctx.lineWidth = graph_line_thickness;
	}
	
	
	
	//draw the markers that go under the data
	for (var i = gs.show_markers?0:gs.markers.length;i<gs.markers.length;i++){
		var marker = gs.markers[i];
		if (marker.layer==0){
			drawMarker(graph,canvas,ctx,marker);
		}
	}

	//draw the function lines
	ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
	var lines_start = 0;
	var lines_end = canvas.width;
	var fit_x = [];
	for (var j=lines_start; j<lines_end;j+=2){
			fit_x.push(this.pixels_to_units(j,'x'));
	}
	var fit_y = [];
	for (var i = 0; i<gs.function_lines.length;i++){
		fit_y = parseExpression(graph,gs.function_lines[i],fit_x,fit_x);
		this.drawSimpleLine(ctx,fit_x,fit_y);
	}
	
	ctx.font=tick_labels_font_size + 'px ' + font_name//"24px Courier New";
	
	//testing pin drawing
	/*
	ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
	ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
	
	drawPin(ctx,canvas.width/2,canvas.height/2,'?',tick_labels_font_size);
	drawPin(ctx,canvas.width/3,canvas.height/2,'test',tick_labels_font_size);
	drawPin(ctx,canvas.width/2 + 50,canvas.height/2,'test a thing of things',tick_labels_font_size);
	drawPin(ctx,canvas.width/2 - 100,canvas.height/2,'howaboutalongword',tick_labels_font_size);
	drawPin(ctx,canvas.width/2 - 100,canvas.height/2 + 200,'a a  a a a a howaboutalongword',tick_labels_font_size);
	drawPin(ctx,canvas.width/2 + 100,canvas.height/2+200,'test thing',tick_labels_font_size);
	drawPin(ctx,2*canvas.width/3,canvas.height/2,'!',tick_labels_font_size);
	*/
	/*
	 * image drawing test
	 * */
	//drawLogo(ctx,100,100,100,100);
	
	//draw the points
	ctx.lineWidth = line_thickness;
	//ctx.strokeStyle = '#ff0000';
	var drawn_something = false;
	var drawn_caps = false;
	var points_drawn = 0;
	//for histogram find the 0 point or use the bottom of the screen.
	var hist_zero = Math.min(this.units_to_pixels(0,'y'),canvas.height);
	
	
	if (this.isPNGSVG){
		var svgctx = ctx;
		ctx = oldctx;
		this.isSVG=false;
	}
	
	
	var full_auto_zoom = gs.y_scale_auto_min && gs.y_scale_auto_max && gs.x_scale_auto_min && gs.x_scale_auto_max;
	//point drawing code here
	for (i = 0;i<this.data.length;i++){
		ctx.strokeStyle = renderColor(canvas,ctx,this.colors[i]);
		ctx.fillStyle = ctx.strokeStyle;
		var symbol_mode = this.symbol_modes[i];
		var line_mode = this.line_modes[i];
		var dash_mode = this.dash_modes[i];
		
		if (gs.symbol_mode === 'none' && gs.line_mode == 'none'){
			this.errors.push("no symbols or lines to draw");
		}
			//this chunk of code checks to find sequences of data that are on screen
			//don't waste time drawing points that aren't going to be seen.	
			// but if the auto zoom is on, then we know everything is going to be drawn anyway.
		if ( !full_auto_zoom ){
			//save each sequency in the seq_start and seq_end arrays
			var ongraph = false;
			var wasOngraph = false;
			var graph_top = this.pixels_to_units(0,'y');
			var graph_bottom = this.pixels_to_units(canvas.height,'y');
			
			var graph_left = this.pixels_to_units(0,'x');
			var graph_right = this.pixels_to_units(canvas.width,'x');
			var seq_start = [];
			var seq_end = [];
			for (var k = 0;k<this.data[i][0].length;k++){
				ongraph = ( this.data[i][0][k] > graph_left && this.data[i][0][k] < graph_right  &&
							this.data[i][1][k] > graph_bottom && this.data[i][1][k] < graph_top );
				if (!ongraph && wasOngraph){
					seq_end.push(Math.min(k+2,this.data[i][0].length));
				}
				if (ongraph && !wasOngraph){
					seq_start.push(Math.max(k-2,0));
				}
				wasOngraph = ongraph;
			}
			//finish of the last sequence if it is open.
			if (seq_start.length > seq_end.length){
				seq_end.push(k);
			}
			//do sequence merging
			//merge sequences if they are very close to each other or overlapping
			for (k=seq_start.length-1;k>=0;k--){
				//if they are within 1 just merge the sequences together.
				if (seq_start[k] <= seq_end[k-1] +2){
					seq_end[k-1] = seq_end[k];
					//remove 
					seq_end.splice(k,1);
					seq_start.splice(k,1);
				}
			}
		} else {
			seq_start= [0];
			seq_end = [this.data[i][0].length];
		}
			
		drawn_something = drawn_something || seq_start.length > 0;
			
		//keeps the prevous 3 data points for the curves
		// order goes 1,2,3,i
		//itinilisitation:
		// j = 0 [123i, , , ]
		// j = 1 [123,i, , ]
		// j = 2 [12,3,i, , ]
		// j = 3 [1,2,3,i, , ]
		//  . . .
		// j = n [ ,  ,  , 1,2,3,i, , ,]
		//draw the sequences. 
		if (this.isSVG){ctx.startGroup();}
		for (k=0;k<seq_start.length;k++){
			
			
			
			//apply the dash_mode to setLineDash according to the lookuptable or the dash generator method
			applyDashMode(ctx,dash_mode,line_thickness);
			
			//lines
			if (this.drawing_methods.hasOwnProperty(line_mode)){
				this.drawing_methods[line_mode](this,ctx,i,seq_start[k],seq_end[k]);
			}
			//put the line dash back
			ctx.setLineDash([]);
			
			//symbols
			if (this.drawing_methods.hasOwnProperty(symbol_mode)){
				this.drawing_methods[symbol_mode](this,ctx,i,seq_start[k],seq_end[k],symbol_size);
			}
			
			//draw the error bars
			if (this.data[i].length >=3){
				//has y error data
				if (  line_mode.indexOf('fill') >-1  ){
					this.drawing_methods.draw_y_fill_between(this,ctx,i,seq_start[k],seq_end[k]);
				} else {
					this.drawing_methods.draw_y_errors(this,ctx,i,seq_start[k],seq_end[k],symbol_size);
				}
			}
			if (this.data[i].length >=4){
				//has x error data
				this.drawing_methods.draw_x_errors(this,ctx,i,seq_start[k],seq_end[k],symbol_size);
			}
		}
		if (this.isSVG){ctx.endGroup();}
		
	}
	
	
	if (this.isPNGSVG){
		ctx = svgctx;
		this.isSVG=true;
		ctx.image(0,0,canvas.width,canvas.height,this.pngbackground );
	}
	
	if (!this.isSVG){
		//if (this.needs_drag_image || gs.mouse_mode === 'drag' || gs.mouse_mode === 'hreader'  ){
		if(true){ // this used to be optimised away, but now that middle mouse button drags the canvas any mouse mode
			// can initiate a drag. We allways need the image avaliable. 
			this.graph_image_for_drag = ctx.getImageData(0,0,canvas.width,canvas.height);
			this.needs_drag_image = false;
		}
	}
	
	ctx.lineWidth = graph_line_thickness;
	ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);//'#000000';
	ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);//'#000000';
	
	if (!drawn_something && this.no_data == false && gs.function_lines.length ==0){
		this.errors.push("there might be data around, just not where you're looking");
	}
	
	
	//draw the ticks and the points. 
	//for x
	var l = positionsx.strings.length;
	var stepping = ctx.measureText(positionsx.strings[1]+' ').width > positionsx.pos[1] - positionsx.pos[0]  || ctx.measureText(positionsx.strings[l-1] + ' ').width > positionsx.pos[l-1] - positionsx.pos[l-2] ;
	
	if (stepping ){
		var j = -1*tick_labels_font_size/2;
		var o = tick_labels_font_size/2;
	} else {
		var j = 0;
		var o = 0;
		
	}
	//draw the labels
	ctx.textAlign="center";
	if (this.isSVG){ctx.startGroup();} //group the text together - handy!
	for (var i = 0;i<positionsx.pos.length;i++){
		var x = positionsx.pos[i];
		if (x > graph_line_thickness && x < canvas.width - graph_line_thickness){
			var label = positionsx.strings[i];
			ctx.fillText(label,x,canvas.height-tick_len*1.2-tick_lables_font_padding - o - j);
			j *= -1;
		}
	}
	
	if (this.isSVG){ctx.endGroup();}
	
	//draw the ticks
	ctx.beginPath();
	for (var i = 0;i<positionsx.pos.length;i++){
		var x = positionsx.pos[i];
		if (x > graph_line_thickness && x < canvas.width - graph_line_thickness){
		ctx.moveTo(x,graph_line_thickness/2);
		ctx.lineTo(x,tick_len);
		ctx.moveTo(x,canvas.height-graph_line_thickness/2);
		ctx.lineTo(x,canvas.height-tick_len);
		}
	}
	ctx.stroke();
	
	
	ctx.beginPath();
	for (var i = 0;i<positionsx.minor_pos.length;i++){
		
		x = positionsx.minor_pos[i];
		if (x > graph_line_thickness && x < canvas.width - graph_line_thickness){
		ctx.moveTo(x,graph_line_thickness/2);
		ctx.lineTo(x,minor_tick_len);
		ctx.moveTo(x,canvas.height-graph_line_thickness/2);
		ctx.lineTo(x,canvas.height-minor_tick_len);
		}
	}
	ctx.stroke();
	gs.x_precision = positionsx.precision;
	ctx.textAlign="left";
	
	
	//get the left side of the leftmost bit of text 
	var leftmosttext =  positionsx.pos[0] - ctx.measureText(positionsx.strings[0]).width/2
	
	// compare that to the right side of the y text
	
	if (this.isSVG){ctx.startGroup();}
	for (var i = 0;i<positionsy.pos.length;i++){
		var y = canvas.height - positionsy.pos[i];
		if (y > graph_line_thickness && y < canvas.height - graph_line_thickness){
			var label = positionsy.strings[i];
			//if it is near the top, don't put a label, as this is where the axis label is.
			if ( y > tick_len+lable_spacing+axis_labels_font_size+tick_labels_font_size/2    &&  // dont draw over the axis label
			    (  ctx.measureText(label).width + 2*tick_lables_font_padding + tick_len < leftmosttext  ||  // draw if the x axis label text isn't in the way
			       y < canvas.height - tick_labels_font_size - tick_lables_font_padding-tick_len-tick_labels_font_size/2)  ){ // don't draw if 
				ctx.fillText(label,tick_len*1.2+tick_lables_font_padding+2,y+3);
			}
		}
	}
	if (this.isSVG){ctx.endGroup();}
	
	ctx.beginPath();
	for (var i = 0;i<positionsy.pos.length;i++){
		var y = canvas.height - positionsy.pos[i];
		if (y > graph_line_thickness && y < canvas.height - graph_line_thickness){
			ctx.moveTo(graph_line_thickness/2,y);
			ctx.lineTo(tick_len,y);
			ctx.moveTo(canvas.width-graph_line_thickness/2,y);
			ctx.lineTo(canvas.width-tick_len,y);
		}
	}
	ctx.stroke();
	
	ctx.beginPath();
	for (var i = 0;i<positionsy.minor_pos.length;i++){
		y = canvas.height - positionsy.minor_pos[i];
		if (y > graph_line_thickness && y < canvas.height - graph_line_thickness){
		ctx.moveTo(graph_line_thickness/2,y);
		ctx.lineTo(minor_tick_len,y);
		ctx.moveTo(canvas.width-graph_line_thickness/2,y);
		ctx.lineTo(canvas.width-minor_tick_len,y);
		}
	}
	ctx.stroke();
	gs.y_precision = positionsy.precision;

	if (gs.show_captions) {
		var caption_font_size = gs.caption_font_size * gs.scaling_factor;
		ctx.font=caption_font_size + 'px ' + font_name//"14px Courier New";
		
		x = gs.scaling_factor*gs.caption_position.x;
		y = gs.scaling_factor*gs.caption_position.y;
		var symbol_x =0;
		var symbol_y =0;
		var linelen = 0;
		if (gs.caption_position.y>0){
			//going down from top
			y += caption_font_size;
			dy = caption_font_size;
			y += tick_len;
		} else {
			//up from botton
			dy = caption_font_size;
			y = canvas.height + y;
			y += caption_font_size - this.data.length*dy;
			y -= tick_len;
		}
		if (gs.caption_position.x>0){
			ctx.textAlign="left";
			x += tick_len;
		} else {
			ctx.textAlign="right";
			x = canvas.width + x;
			x -= tick_len;
		}
		
		if ( gs.show_caption_symbol && gs.show_caption_line){
			if (ctx.textAlign==="left"){
				//draw to the right 
				symbol_x = x+3*symbol_size;
				x += 4*symbol_size;
			} else {
				symbol_x = x;
				x -= 4*symbol_size;
			}
			linelen = 3;
		} else if ( gs.show_caption_symbol || gs.show_caption_line){ // don't put as much spacing in if only one
			if (ctx.textAlign==="left"){
				symbol_x = x+2*symbol_size;
				x += 3*symbol_size;
			} else {
				symbol_x = x;
				x -= 3*symbol_size;
			}
			linelen = 2;
		} else {
			symbol_y = y;
			symbol_x = x;
		}
		
		if (linelen){
			dy = Math.sign(dy) * Math.max(  Math.abs(dy) , 1.1*symbol_size );
			symbol_y = y - caption_font_size + dy/2;
		}
		
		var drawnLabels = [];
		var longestLabel = 0;
		for (i = 0;i<this.data.length;i++){
			label = this.captions[i] ||  'label' ;
			var splitter = " : ";
			if (gs.show_caption_reader){
				switch(gs.captions_display){
					case "ylast":
						label += splitter +  this.get_axis_string(this.data[i][1][this.data[i][1].length-1],'y',gs.captions_extra_precision + gs.y_precision);
						break;
					case "xlast":
						label += splitter +  this.get_axis_string(this.data[i][0][this.data[i][0].length-1],'x',gs.captions_extra_precision + gs.x_precision);
						break;
					case "xfirst":
						label += splitter +  this.get_axis_string(this.data[i][0][0],'x',gs.captions_extra_precision + gs.x_precision);
						break;
					case "yfirst":
						label += splitter +  this.get_axis_string(this.data[i][1][0],'y',gs.captions_extra_precision + gs.y_precision);
						break;
					case "xmin":
						label += splitter +  this.get_axis_string(  Math.min.apply(null, this.data[i][0] )  ,'x',gs.captions_extra_precision + gs.x_precision);
						break;	
					case "ymin":
						label += splitter +  this.get_axis_string(  Math.min.apply(null, this.data[i][1] )  ,'y',gs.captions_extra_precision + gs.y_precision);
						break;
					case "ymax":
						label += splitter +  this.get_axis_string(  Math.max.apply(null, this.data[i][1] )  ,'y',gs.captions_extra_precision + gs.y_precision);
						break;
					case "xmax":
						label += splitter +  this.get_axis_string(  Math.max.apply(null, this.data[i][0] )  ,'x',gs.captions_extra_precision + gs.x_precision);
						break;			
				}
			}
			drawnLabels.push(label);
			longestLabel = Math.max(longestLabel, ctx.measureText(label).width );
		}
		
		if (gs.show_caption_box){
			var p = caption_font_size / 3;
			ctx.beginPath();
			var box_x = Math.min(x,symbol_x - linelen * symbol_size) -p;
			if (ctx.textAlign==="right"){
				box_x -= longestLabel;
			}
			ctx.rect( box_x , y - p - caption_font_size,
			          2*p + longestLabel +  (linelen?linelen+1:0)* symbol_size, 
			          drawnLabels.length * Math.abs(dy) + 2*p);
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.fill()
			ctx.stroke();
			ctx.beginPath();
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
		}
		
		for (i = 0;i<this.data.length;i++){
			ctx.fillStyle = renderColor(canvas,ctx,this.colors[i]);
			if (!this.transparent){
				ctx.strokeStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.lineWidth = axis_labels_font_size/3;
				ctx.strokeText(drawnLabels[i],x,y);
			}
			ctx.fillText(drawnLabels[i],x,y);
			
			// TODO add option to draw the caption beside the line
			// if set overwrite the y and symbol_y variables to draw at the vertical for that point.
			// maybe overwrite the x position too. 
			
			if (gs.show_caption_line){
				ctx.strokeStyle = renderColor(canvas,ctx,this.colors[i]);
				ctx.lineWidth = line_thickness;
				var dash_mode = this.dash_modes[i];
					var dashVector = [];
				if (lineDashModes[dash_mode]){
					for (var lineDashIndex=0;lineDashIndex<lineDashModes[dash_mode].length;lineDashIndex++){
						dashVector[lineDashIndex] = lineDashModes[dash_mode][lineDashIndex]  * line_thickness;
					}
					ctx.setLineDash(dashVector);
				} else if (buildDashArrayFromString(dash_mode)){
					dashVector = buildDashArrayFromString(dash_mode)
					for (var lineDashIndex=0;lineDashIndex<dashVector.length;lineDashIndex++){
						dashVector[lineDashIndex] = dashVector[lineDashIndex]  * line_thickness;
					}
					ctx.setLineDash(dashVector);
				}
				
				ctx.beginPath();
				ctx.moveTo(symbol_x - linelen* symbol_size,symbol_y);
				ctx.lineTo(symbol_x ,symbol_y);
				ctx.stroke();
				ctx.setLineDash([]);
			}
			
			if (gs.show_caption_symbol){
				fakeGraph.data[0][0][0] = symbol_x - linelen/2*symbol_size ;
				fakeGraph.data[0][1][0] = symbol_y;
				fakeGraph.canvas.width = canvas.width;
				fakeGraph.canvas.height = canvas.height;
				fakeGraph.graphics_style = gs;
				ctx.strokeStyle = renderColor(canvas,ctx,this.colors[i]);
				ctx.lineWidth = line_thickness;
				var symbol_mode = this.symbol_modes[i];
				
				if (this.drawing_methods.hasOwnProperty(symbol_mode)){
					this.drawing_methods[symbol_mode](fakeGraph,ctx,0,0,1,symbol_size);
				}
			}
			y += dy;
			symbol_y += dy;
		}
		
	
	//show the 'other lines hidden' text
	
	if (gs.showTransformTexts && this.data.length != this.data_backup.length){
		label = 'other lines hidden';
		if (!this.transparent){
			ctx.strokeStyle = renderColor(canvas,ctx,gs.color_bg);
			ctx.lineWidth = axis_labels_font_size/3;
			ctx.strokeText(label,x,y);
		}
		ctx.fillStyle = renderColor(canvas,ctx,gs.color_mg);
		ctx.fillText(label,x,y);
	}
	
	} // end of captions drawing
	
	
	ctx.lineWidth = graph_line_thickness;
	ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
	ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
	
	if (  (this.transform_text_x.length > 1 || this.transform_text_y.length > 1)&& gs.showTransformTexts   )   {
		var x_label = this.transform_text_x;
		var y_label = this.transform_text_y;
	} else {
		var x_label = x_axis_title;
		var y_label = y_axis_title;
	}
	
	//draw x axis label
	ctx.font=axis_labels_font_size + 'px ' + font_name//"14px Courier New";
	ctx.textAlign="right";
	var label = x_label;
	if (gs.x_scale_mode ==='time' && this.graphics_style.x_precision > 1 ){
		label += ' ' + mjs_date_print( this.pixels_to_units(canvas.width,'x') ,0,Math.max(this.graphics_style.x_precision-1,0));
	}
	if (stepping) {
	ctx.fillText(label,canvas.width - lable_spacing - tick_len,
					 canvas.height - tick_len-lable_spacing- 2*tick_labels_font_size-tick_lables_font_padding);
	} else {
	ctx.fillText(label,canvas.width - lable_spacing - tick_len,
					 canvas.height - tick_len-lable_spacing-tick_labels_font_size-tick_lables_font_padding);
	}
	ctx.textAlign="left"; 
	//draw y axis lable
	var label = y_label;
	if (gs.y_scale_mode ==='time' && this.graphics_style.y_precision > 1){
		label += ' ' + mjs_date_print( this.pixels_to_units(0,'y') ,0,Math.max(this.graphics_style.y_precision-1,0));
	}
	//var yoffset = ctx.measureText(positionsy.strings[positionsy.strings.length-1]).width;
	ctx.fillText(label,tick_len+lable_spacing+tick_lables_font_padding,tick_len+lable_spacing+axis_labels_font_size);
	//draw transforms stack
	
	// draw infomation overlay if the info button is pushed.
	ctx.beginPath();
	ctx.stroke();
	
	var sigma = String.fromCharCode( 963 ); //σ²
	var squared = String.fromCharCode( 178 ); //σ²
	var bar = String.fromCharCode( 773 ); //put befor what you want bared e.g. bar + 'y' 
	var edge = tick_len*2.6;
	ctx.font=axis_labels_font_size + 'px ' + font_name//"14px Courier New";

	var fit_points_drawn = 0;
	if (gs.fits === 'none'){
		//dont' do anything :(
	} else {
		//do some fits or stats!!!! wooo stats. 
		ctx.textAlign="left"; 
		
		var x = gs.fit_text_position.x * canvas.width;
		var y = gs.fit_text_position.y * canvas.height;
		var dy = 1.2*axis_labels_font_size;
		
		for (i = 0;i<this.data.length;i++){	
			var label = this.captions[i] ||  'label' ;
			ctx.fillStyle = renderColor(canvas,ctx,this.colors[i]);
			
			//three lines of text.
			var string1 = '';
			var string2 = '';
			var string3 = '';
			
			if (!this.transparent){
				ctx.strokeStyle = renderColor(canvas,ctx, gs.color_bg);
				ctx.lineWidth = axis_labels_font_size/2;
				ctx.strokeText(label,x,y);
			}
			
			ctx.fillText(label,x, y);
			ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
			
			ctx.lineWidth = line_thickness;
			if (gs.color_fits){
				ctx.strokeStyle = renderColor(canvas,ctx,this.colors[i]);
			} else {
				ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
			}
			
			if (gs.fits === 'stats'){
				var stats = series_stats(this.data[i][0],this.data[i][1]);
				ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
				
				string1 =  ' n = ' +stats.n +
					',    cov(x,y) = ' + mjs_precision(stats.cov,Math.min(gs.x_precision,gs.y_precision)+3);
				string2 = bar + 'x = ' +number_quote(stats.x_mean,stats.sigma_x) +
					',   '+sigma+'(x) = ' +mjs_precision(stats.sigma_x,2);
				string3 = bar + 'y = ' + number_quote(stats.y_mean,stats.sigma_y) + 
					',   '+sigma+'(y) = ' +mjs_precision(stats.sigma_y,2);
					
				if (gs.color_fits){
				ctx.strokeStyle = renderColor(canvas,ctx,this.colors[i]);
				} else {
				ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
				}
				//draw the mean and the 1 and 2 SD lines...
				//for x
				ctx.beginPath();
				for (var k = -1;k<1+1;k++){
					var yi = graph.units_to_pixels(stats.y_mean+k*stats.sigma_y,'y');
					ctx.moveTo(graph.units_to_pixels(stats.xmin,'x'),yi);
					ctx.lineTo(graph.units_to_pixels(stats.xmax,'x'),yi);
				}
				ctx.stroke();
				ctx.beginPath();
				for (var k = -1;k<1+1;k++){
					var xi = graph.units_to_pixels(stats.x_mean+k*stats.sigma_x,'x');
					ctx.moveTo(xi,graph.units_to_pixels(stats.ymax,'y'));
					ctx.lineTo(xi,graph.units_to_pixels(stats.ymin,'y'));
				}
				ctx.stroke();
				//drawEllipse(ctx, graph.units_to_pixels(stats.x_mean,'x'), graph.units_to_pixels(stats.y_mean,'y'), graph.units_to_pixels(stats.sigma_x,'x'), graph.units_to_pixels(stats.sigma_y,'y'));
				drawEllipse(this,ctx, stats.x_mean, stats.y_mean, stats.sigma_x, stats.sigma_y);
				drawEllipse(this,ctx, stats.x_mean, stats.y_mean, stats.sigma_x*2, stats.sigma_y*2);
			}
			if (gs.fits === 'old' && this.fit_data.length == 0){
				gs.fits = 'none';
			}
			if (gs.fits === 'old'){
				string1 = 'previous fit shown';
				string2 = 'pick new fit';
				//show the old fit if possible, don't make a new one.
					fit_x = this.fit_data[i][0];
					fit_y = this.fit_data[i][1];
					
					if (gs.color_fits){
					ctx.strokeStyle = renderColor(canvas,ctx,this.colors[i]);
					} else {
					ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
					}
					this.drawSimpleLine(ctx,fit_x,fit_y);
					
				
			}
			
			//fit_strings = ['exp','exp_c','linear','quad', 'cubic','poly4','poly5','poly6','poly7','const','log','power','power_c'];
			//fit_funs = [fits.exponential,fits.exponential_plus_c,fits.linear,fits.poly2,fits.poly3,fits.poly4,fits.poly5,fits.poly6,fits.poly7,fits.constant,fits.log,fits.power,fits.power_plus_c];
			if (fits.fit_strings.indexOf(gs.fits)>-1){
				//if time axis, normalise befor fit.
				var fit;
				var string1;
				var string2;
				var string3;
				if (gs.x_scale_mode ==='time'){
					var normed = fits.pre_fit_normalizing(this.data[i][0]);
					fit = fits.fit_funs[fits.fit_strings.indexOf(gs.fits)]( normed.x ,this.data[i][1]);
					string1=fit.strings[0] + "  "+normed.s;
				} else {
					fit = fits.fit_funs[fits.fit_strings.indexOf(gs.fits)](this.data[i][0],this.data[i][1]);
					string1=fit.strings[0];
				}
				
				string2=fit.strings[1];
				string3=fit.strings[2];
				
				//draw the line
				if (gs.extrapolate){
					var fit_start =0;
					var fit_end = canvas.width;
				} else {
					var fit_start = Math.max( 0, this.units_to_pixels(Math.min.apply(null, this.data[i][0]),'x') );
					var fit_end = Math.min( canvas.width, this.units_to_pixels(Math.max.apply(null, this.data[i][0]),'x') );
				}
				
				//make array of fit_x points to get y-points from
				var fit_x = [];
				for (var j=fit_start; j<fit_end;j+=5){
					fit_x.push(this.pixels_to_units(j,'x'));
				}
				
				//if noramalisation was used. 
				if (gs.x_scale_mode ==='time'){
					
					var fit_y = fit.fun( fits.post_fit_normalizing(fit_x,normed) ,fit.parameters);
				} else {
					var fit_y = fit.fun(fit_x,fit.parameters);
				}
				
				//save the fit data
				this.fit_data[i] = [];
				this.fit_data[i][0] = fit_x;
				this.fit_data[i][1] = fit_y;
				
				if (gs.color_fits){
				ctx.strokeStyle = renderColor(canvas,ctx,this.colors[i]);
				} else {
				ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
				}
				this.fit_points_drawn = 0;
				this.drawSimpleLine(ctx,fit_x,fit_y);
			}
			if (!this.transparent){
				ctx.strokeStyle = renderColor(canvas,ctx,gs.color_bg);
				ctx.lineWidth = axis_labels_font_size/3;
				ctx.strokeText(string1,x + (label.length+1)*.6*axis_labels_font_size, y);
				ctx.fillText(string1,x + (label.length+1)*.6*axis_labels_font_size, y);
				y+=dy;
				ctx.strokeText(string2,x, y);
				ctx.fillText(string2,x, y);
				y+=dy;
				ctx.strokeText(string3,x, y);
				ctx.fillText(string3,x, y);
				y+=dy;
			} else {
			ctx.fillText(string1,x + (label.length+1)*.6*axis_labels_font_size, y);
			y+=dy;
			ctx.fillText(string2,x, y);
			y+=dy;
			ctx.fillText(string3,x, y);
			y+=dy;
			}
			
		}
	} // end of series loop
	
	//draw the markers on top of the data.
	
	ctx.font=axis_labels_font_size + 'px ' + font_name//"14px Courier New";
	ctx.strokeStyle = renderColor(canvas,ctx, gs.color_fg);
	ctx.lineWidth = line_thickness;
	
	var h = axis_labels_font_size;
	var marker;
	for (var i = gs.show_markers?0:gs.markers.length;i<gs.markers.length;i++){
		//set the center of each
		marker = gs.markers[i];
		if (marker.layer==1){
			drawMarker(graph,canvas,ctx,marker);
		}
	}
	
	ctx.lineWidth = graph_line_thickness;
	ctx.textAlign="center"; 
	ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
	//draw title and subtitle
	ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg); 
	ctx.font=title_font_size + 'px ' + font_name;//"24px Courier New";
	ctx.fillText(title,canvas.width/2,tick_len+title_spacing+title_font_size);
	ctx.font=axis_labels_font_size + 'px ' + font_name;//"24px Courier New";
	ctx.fillText(gs.subtitle,canvas.width/2,tick_len+title_spacing+axis_labels_font_size+title_font_size);
	ctx.fillText(gs.subtitle2,canvas.width/2,tick_len+title_spacing+2*axis_labels_font_size+title_font_size);
	
	if (gs.data_transforms.length > 0 && gs.showTransformTexts){
		
		ctx.font=axis_labels_font_size + 'px ' + font_name;//"24px Courier New";
		var label = '['+gs.data_transforms.join('|')+']';
		var labely = title_spacing+title_font_size+tick_len+axis_labels_font_size;
		if (gs.subtitle.length>0){labely += axis_labels_font_size;}
		if (gs.subtitle2.length>0){labely += axis_labels_font_size;}
		//top center
		ctx.fillText(label,canvas.width/2,labely);
		//bottom left
		//ctx.fillText(label,lable_spacing + tick_len, canvas.height - tick_len-lable_spacing-tick_labels_font_size);
	}
	
	ctx.beginPath();
	ctx.stroke();
	if (gs.i >= 1){
		ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
		//white out the bg
		ctx.lineWidth = graph_line_thickness;
		ctx.fillStyle = renderColor(canvas,ctx,gs.color_bg);
		ctx.rect(2*edge,2*edge,canvas.width - 4*edge,canvas.height - 4*edge);
		ctx.fill();
		ctx.stroke();
		//graph.pre_mouse_mode = gs.mouse_mode;
		//gs.mouse_mode = 'i';
		ctx.fillStyle = renderColor(canvas,ctx,gs.color_fg);
		ctx.textAlign="left";
		var y = 3*edge;
		var dy = axis_labels_font_size*1.5;
		ctx.fillText('canvas width : ' + canvas.width,3*edge,y); y +=dy;
		ctx.fillText('canvas height : ' + canvas.height,3*edge,y);y +=dy;
		ctx.fillText('canvas ID : ' + this.canvas_name,3*edge,y);y +=dy;
		ctx.fillText('graph name : ' + this.graph_name,3*edge,y);y +=dy;
		ctx.fillText('No. series : ' + this.data.length + ' of ' + this.data_backup.length,3*edge,y);y +=dy;
		ctx.fillText('Points drawn : ' + this.points_drawn,3*edge,y);y +=dy;
		ctx.fillText('Drawn points for fits : ' + fit_points_drawn,3*edge,y);y +=dy;
		ctx.fillText('Touch : ' + is_touch_device(),3*edge,y);y +=dy;
		
		var end_time = new Date();
		graph.ui.draw_time = end_time.getTime() - start_time.getTime();
		ctx.fillText('Draw Time : ' + graph.ui.draw_time+'ms',3*edge,y);y +=dy;
		ctx.fillText('Copy Time : ' + graph.ui.copy_time+'ms',3*edge,y);y +=dy;
		ctx.textAlign="right"; 
		var label = "MJS"+"2015"; 
		ctx.fillText(label,canvas.width-tick_len-2*edge,canvas.height - axis_labels_font_size-2*edge);
		var label = 'version: ' + MJS_PLOT_VERSION;
		ctx.fillText(label,canvas.width-tick_len-2*edge,canvas.height - axis_labels_font_size*2.5-2*edge);
		var label = 'web:' + MJS_PLOT_WEBSITE;
		ctx.fillText(label,canvas.width-tick_len-2*edge,canvas.height - axis_labels_font_size*3.5-2*edge);
	}
	this.points_drawn =0;
	
	//print any errors to the screen
	//graph.errors = ['some error']
	if (this.errors.length >0){
		ctx.font=axis_labels_font_size + 'px ' + font_name;//"24px Courier New";
		//make the text red
		var oldfill = ctx.fillStyle;
		ctx.fillStyle = "#FF0000";
		ctx.textAlign="center"; 
		for (var i = 0;i<this.errors.length;i++){
			var s = "error > " + this.errors[i];
			var x = canvas.width/2;
			var y = 2*tick_len+title_spacing+axis_labels_font_size+canvas.height/2 - axis_labels_font_size*this.errors.length/2 + axis_labels_font_size*i;
			ctx.fillText(s,x,y);
		}
		// return the fill colour
		ctx.fillStyle = oldfill;
	}
	
	//clear the error list.
	this.errors = [];
	ctx.textAlign="left"; 
	//flush the drawing code
	ctx.beginPath();
	ctx.stroke();
	
	//draw box around the graph
	ctx.beginPath();
	ctx.rect(graph_line_thickness/2,
					graph_line_thickness/2,
					canvas.width-graph_line_thickness,
					canvas.height-graph_line_thickness);
	ctx.lineWidth = graph_line_thickness;
	ctx.strokeStyle = renderColor(canvas,ctx,gs.color_fg);
	ctx.stroke();
	
	gs.modified = true;
	//cookie stuff
	save_gs(this.graph_name, gs);
	if (!this.isSVG){
	this.graph_image = ctx.getImageData(0,0,canvas.width,canvas.height);
	}
	this.plot_failed = false;
	for (var i =0;i<this.onPlotFunctions.length;i++){
		this.onPlotFunctions[i]();
	}
	
},//end of plot function
	units_to_pixels : function (number,axis){//converts a number to its position in pixels
	
		if (axis === 'x'){
			if (this.graphics_style.x_scale_mode ==='lin' || this.graphics_style.x_scale_mode ==='time'){
				return (number-this.graphics_style.x_auto_min)*this.canvas.width/(this.graphics_style.x_auto_max - this.graphics_style.x_auto_min);
			}
			if (this.graphics_style.x_scale_mode ==='log'){
				return (Math.log10(number)-this.graphics_style.x_auto_min)*this.canvas.width/(this.graphics_style.x_auto_max - this.graphics_style.x_auto_min) || 0.0;
			}
		}
		if (axis === 'y'){
			if (this.graphics_style.y_scale_mode ==='lin'  || this.graphics_style.y_scale_mode ==='time'){
				return this.canvas.height - (number-this.graphics_style.y_auto_min)*this.canvas.height/(this.graphics_style.y_auto_max - this.graphics_style.y_auto_min);
			}
			if (this.graphics_style.y_scale_mode ==='log'){
				return this.canvas.height - (Math.log10(number)-this.graphics_style.y_auto_min)*this.canvas.height/(this.graphics_style.y_auto_max - this.graphics_style.y_auto_min) || canvas.height;
			}
		}
		
	},
	pixels_to_units : function (pixels,axis){ // convertis pixels over the graph to the corrisponding value on the graph
		
			if (axis === 'x'){
				if (this.graphics_style.x_scale_mode ==='lin' || this.graphics_style.x_scale_mode ==='time'){
					return  pixels / this.canvas.width * (this.graphics_style.x_auto_max - this.graphics_style.x_auto_min )+this.graphics_style.x_auto_min;
				}
				if (this.graphics_style.x_scale_mode ==='log'){
					return Math.pow(10,pixels / this.canvas.width * (this.graphics_style.x_auto_max - this.graphics_style.x_auto_min )+this.graphics_style.x_auto_min);
				}
			}
			if (axis === 'y'){
				if (this.graphics_style.y_scale_mode ==='lin' || this.graphics_style.y_scale_mode ==='time'){
					return (this.graphics_style.y_auto_max - this.graphics_style.y_auto_min) * (this.canvas.height-pixels) / this.canvas.height + this.graphics_style.y_auto_min;
				}
				if (this.graphics_style.y_scale_mode ==='log'){
					var r =  Math.pow(10,(this.canvas.height-pixels)  / this.canvas.height * (this.graphics_style.y_auto_max - this.graphics_style.y_auto_min )+this.graphics_style.y_auto_min);
					return r < 1e-200 ? 1e-200 : r;
				}
				
			}
		},
	get_axis_string : function (n, axis,precision){
		if ( !isFinite(precision)){
			if (axis == 'x'){
				precision = this.graphics_style.x_precision+1;
			}
			if (axis == 'y'){
				precision = this.graphics_style.y_precision+1;
			}
		}
		if (axis == 'x'){
			var r = this.graphics_style.x_axis_prefix|| "";
			if (this.graphics_style.x_scale_mode ==='lin' || this.graphics_style.x_scale_mode ==='log'){
				switch (this.graphics_style.x_label_mode){
				case "norm":
					r+= mjs_precision(n,precision);
					break;
				case "infix":
					r+= eng_form_infix(n,precision);
					break;
				case "postfix":
					r+= eng_form_postfix(n,precision);
					break;
				case "maths":
					r+=maths_form(n,precision);
					break;
				case "sci":
					r+= n.toExponential(precision-1);
					break;
				}
			}
			if (this.graphics_style.x_scale_mode ==='time'){
				r+= mjs_date_print(n,0,precision);
			}
			r += this.graphics_style.x_axis_postfix;
			return r;
		}
		if (axis == 'y'){
			var r = this.graphics_style.y_axis_prefix|| "";
			if (this.graphics_style.y_scale_mode ==='lin' || this.graphics_style.y_scale_mode ==='log'){
				switch (this.graphics_style.y_label_mode){
				case "norm":
					r+= mjs_precision(n,precision);
					break;
				case "infix":
					r+= eng_form_infix(n,precision);
					break;
				case "postfix":
					r+= eng_form_postfix(n,precision);
					break;
				case "sci":
					r+= n.toExponential(precision-1);
					break;
				case "maths":
					r+=maths_form(n,precision);
				}
				
			}
			if (this.graphics_style.y_scale_mode ==='time'){
				r+= mjs_date_print(n,0,precision);
			}
			r += this.graphics_style.y_axis_postfix;
			return r;
		}
	
	},
	make_full_screen : function (graph){
		var doc = window.document;
		full_screen_graph = graph;
		var docEl = full_screen_graph.canvas;
		full_screen_graph.orignal_canvas_width = full_screen_graph.canvas.width;
		full_screen_graph.orignal_canvas_height = full_screen_graph.canvas.height;

		var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
		if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
			requestFullScreen.call(docEl);
			
			full_screen_graph.isFullscreen = true;
			full_screen_graph.canvas.width = window.innerWidth;
			full_screen_graph.canvas.height = window.innerHeight;
			document.addEventListener("fullscreenchange", full_screen_graph.full_screen_handler);
			document.addEventListener("webkitfullscreenchange",  full_screen_graph.full_screen_handler);
			document.addEventListener("mozfullscreenchange",  full_screen_graph.full_screen_handler);
			document.addEventListener("MSFullscreenChange",  full_screen_graph.full_screen_handler);
			
			// was window
			window.addEventListener('resize', full_screen_graph.keep_full_screen, true);
			
		} else {
			full_screen_graph.errors.push("can't go fullscreen");
			full_screen_graph.isFullscreen = false;
		}
		
	},
	full_screen_handler : function(){
		if (
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		) {
		} else {
		full_screen_graph.exit_full_screen();
		}
	},
	exit_full_screen : function(){
		//fired when fullscreen is changed. do nothing when going to full screen but
		//on the way back return the canvas size to what it was
		// and detach the keep_full_screen handler.
		full_screen_graph.isFullscreen = false;
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		}
		window.removeEventListener('resize', full_screen_graph.keep_full_screen, true);
		full_screen_graph.canvas.width = full_screen_graph.orignal_canvas_width;
		full_screen_graph.canvas.height = full_screen_graph.orignal_canvas_height;
		
		full_screen_graph.mjs_plot();

	},
	keep_full_screen : function (){
		full_screen_graph.canvas.width = window.innerWidth;
		full_screen_graph.canvas.height = window.innerHeight;
		full_screen_graph.mjs_plot();
	},
	export_svg : function (width,height,filename){
		filename = filename || 'mjsplot_graph';
		
		
		var temp_width = this.canvas.width;
		var temp_height = this.canvas.height;
		this.canvas.width = width;
		this.canvas.height = height;
		
		var svgDiv = document.createElement('div');
		svgDiv.innerHTML = '<svg id="_mjsplotSVG" version="1.1" width="'+
			this.canvas.width+
			'" height="'+
			this.canvas.height+
			'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"/>';
		document.body.appendChild(svgDiv);
		this.isSVG=true;
		this.mjs_plot();
		
		//var svg = svgDiv.innerHTML;
		var svg = document.getElementById("_mjsplotSVG").outerHTML;
		svg =  svg.split('>').join('>\n');
		var xmlheadder = '<?xml version="1.0" encoding="utf-8" standalone="yes"?> ';
		download_text(xmlheadder+svg,filename+'.svg','data:image/svg+xml;charset=utf-8');
		document.body.removeChild(svgDiv);
		this.isSVG=false;
		this.canvas.width  = temp_width;
		this.canvas.height = temp_height;
		this.mjs_plot();
	},
	export_svg_png : function (width,height,sf,filename){
		filename = filename || 'mjsplot_graph';
		var temp_width = this.canvas.width;
		var temp_height = this.canvas.height;
		this.canvas.width = width*sf;
		this.canvas.height = height*sf;
		this.graphics_style.scaling_factor *= sf;
		this.transparent = true;
		this.needs_drag_image = true;
		this.mjs_plot();
		
		var ctx = this.canvas.getContext('2d');
		ctx.putImageData(this.graph_image_for_drag,0,0);
		this.pngbackground = this.canvas.toDataURL();
		this.transparent = false;
		this.graphics_style.scaling_factor /= sf;
		this.canvas.width = width;
		this.canvas.height = height;
		var svgDiv = document.createElement('div');
		svgDiv.innerHTML = '<svg id="_mjsplotSVG" version="1.1" width="'+
			this.canvas.width+
			'" height="'+
			this.canvas.height+
			'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"/>';
		document.body.appendChild(svgDiv);
		this.isSVG=false;
		this.isPNGSVG=true;
		this.mjs_plot();
		var svg = document.getElementById("_mjsplotSVG").outerHTML;
		svg = svg.replace('>','>\n');
		var xmlheadder = '<?xml version="1.0" encoding="utf-8" standalone="yes"?> ';
		download_text(xmlheadder+svg,filename+'.svg','data:image/svg+xml;charset=utf-8');
		document.body.removeChild(svgDiv);
		this.isSVG=false;
		this.isPNGSVG=false;
		
		this.canvas.width  = temp_width;
		this.canvas.height = temp_height;
		this.mjs_plot();
	},
	export_png :function(width,height,sf){
		var temp_width = this.canvas.width;
		var temp_height = this.canvas.height;
		this.canvas.width = width;
		this.canvas.height = height;
		this.graphics_style.scaling_factor *= sf;
		this.transparent = true;
		this.mjs_plot();
		var dataUrl = this.canvas.toDataURL();
		window.open(dataUrl, "toDataURL() image", "width="+width+", height="+height);
		this.transparent = false;
		this.graphics_style.scaling_factor /= sf;
		this.canvas.width  = temp_width;
		this.canvas.height = temp_height;
		this.mjs_plot();
	},
	export_jpeg:function(width,height,sf){
		var temp_width = this.canvas.width;
		var temp_height = this.canvas.height;
		this.canvas.width = width;
		this.canvas.height = height;
		this.graphics_style.scaling_factor *= sf;
		this.mjs_plot();
		var dataUrl = this.canvas.toDataURL("image/jpeg", 0.85);
		window.open(dataUrl, "toDataURL() image", "width="+width+", height="+height);
		this.graphics_style.scaling_factor /= sf;
		this.canvas.width  = temp_width;
		this.canvas.height = temp_height;
		this.mjs_plot();
	}

};//end of graph object
	graph.canvas = canvas;
	make_interactive(graph);
	return graph;
}//end of new_graph()

,
get_graph_style : function (){
	// set 'drag' to default mode on mobile, 'zoom' on desktops.
	if (is_touch_device()){
		var mouse_mode = 'drag'
	} else {
		var mouse_mode = 'zoom'
	}
	return  {
	 interactivity : 'full', // or 'none' or 'view'
	 graph_line_thickness : 1, // for the graph generally.
	 symbol_size : 5,
	 line_thickness: 2, // for plotted lines
	 tick_len : 7,
	 mode : 'dot line', //'circles', 'dot', or 'line'
	 symbol_mode : 'dot', // dot block circle croxx
	 line_mode : 'line', // line approx interp zig zag mid hist
	 dash_mode : 'solid', // line approx interp zig zag mid hist
	 symbol_modes : [], //per line symbol modes
	 line_modes : [], //per line line modes. 
	 dash_modes : [], //per line line dash modes
	 font_name : "serif",
	 title_font_size : 20,// in px (24)
	 title : "Title",
	 subtitle : "",
	 subtitle2 : "",
	 title_spacing : 2, // extra space from the top, in px.
	 tick_labels_font_size : 10,//10
	 tick_lables_font_padding : 2, // px extra space up from the ticks
	 axis_labels_font_size: 10,//12
	 lable_spacing : 4,//pixels away from the tick lables
	 x_axis_title : 'x axis (units)',
	 y_axis_title : 'y axis (units)',
	 x_axis_prefix : "",
	 x_axis_postfix : "",
	 y_axis_prefix : "",
	 y_axis_postfix : "",
	 x_label_mode : 'norm', // or infix,postfix,sci
	 y_label_mode : 'norm', // or infix,postfix,sci
	 minor_tick_len : 5,
	 guideWidthx : 35, //pixels accross
	 guideWidthy : 20, //pixels a across
	 scaling_factor : 1,//scales up everything together...
	 mouse_mode : mouse_mode, //changes the function of the mouse. between 'zoom' and 'drag' and 'measure'
	 hreader_mode : "vertical", // how the data reader works. changes between "vertical" "boxed" "single"
	 fits : 'none', //what fitting is applied
	 extrapolate : false, //if the fit should extrapolate beyond the data
	 color_fits : false, //if the fit lines should be black or with the color of the series
	 x_scale_auto_max : true,
	 x_scale_auto_min : true,
	 y_scale_auto_max : true,
	 y_scale_auto_min : true,
	 x_manual_min : 0.0,
	 x_manual_max : 1.0,
	 y_manual_min : 0.0,
	 y_manual_max : 1.0,
	 x_scale_mode : 'lin', //linear or log
	 y_scale_mode : 'lin',
	 x_scale_tight : false, //data goes right to the edges. 
	 y_scale_tight : false, // otherwise there will be a nice 1 section space on all sides.
	 show_captions : true,
	 showTransformTexts : true, //show the stack of transforms and modify the axis titles.
	 captions_display : "ylast",//xmin xmax ymin ymax yfirst ylast xfirst xlast or non
	 captions_extra_precision : 1, //extra precision to display on the captions has a minimum of 0. don't go negative.
	 show_caption_symbol : false, //to show an example of the symbol in the captions
	 show_caption_line: false, // show the line
	 show_caption_box: false, // to put a box around the captions
	 show_caption_reader: false, // show a digital display from each series
	 caption_font_size: 12, // for the size of the captions
	 color_fg : '#111', //foreground color
	 color_bg : '#eee', //background color
	 color_mg : '#aaa', //midground color, for the grid.
	 show_xgrid: 0, //the x and y grid options
	 show_ygrid: 0, // 0 is off, 1 is on major tick marks, 2 is on major and minor tickmarks
	 v : MJS_PLOT_VERSION, //version of mjsplot
	 color : 'byOne', // the defaul color of each series. can be hex, a name, or 'byOne' to have unique colors, or 'caption' to have it defined by the caption string 
	 hidden_lines : [], // array of booleans if each line should be hidden.
	 line_order : [], // the order to plot the lines in. e.g. [0,2,1] plots the first set data first, then the last then the second.
	 line_colours :[], // array of colours to use for the lines.
	 data_transforms : [], //a list of the transform functions
	 data_transforms_args : [], // the arguments for each transform
	 i : 0, //state of the infomation button
	 o : 0, //state of the options button
	 modified : false,  //changes to true as soon as the user does anything to customise the style
	 x_precision :2, //the number of sf to use when printing numbers on the x axis
	 y_precision :2, //as above for y
	 fit_text_position:{x:0.1,y:0.2}, //fraction accross and fraction down.
	 caption_position:{x:-10,y:10}, //raw pixels down and accross (is then scaled by scaling_factor)
	 markers : [], //user added annotations
	 show_markers : true,
	 function_lines :[] // userdefined lines that are drawn over the graph. each item in the array is a string of the function
	 }
}
,
convert_time_strings : function (array_of_strings){
	//converts an array of time strings to milliseconds from epoc
	//example time strings:
	/*
	ISO-8601 and other strings (browser dependent)
	March 2 2015
	March 2 2015 12:45
	2014/11/02 12:54
	12:53 2014/11/02
	2014
	2/3/2014 ( MM/DD/YYYY)
	Mon, 25 Dec 1995 13:30:00 GMT
	2011-11-12
	This does not include
	dd/mm/yyyy hh:mm:ss
	or
	yyy-mm-dd hh:mm:ss
	
	as that is some crazy non-standard old time brittish thing and you will end up with a mess. 
	*/
	var r = [];
	var test
	for (var i = 0 ; i < array_of_strings.length;i++){
		test = Date.parse( array_of_strings[i] )
		if (test){r.push( test);}
		else if (parseInt(array_of_strings[i]) > 1091403951902){
			test = Date.parse( parseInt(array_of_strings[i]) )
			if (test){r.push( test);}
		} 
		 else {
			test = Date.parse( array_of_strings[i].replace(' ','T'))
			if (test){r.push( test );}
		}
		
		
	}
	return r;
}

};

return mjs_plot;

}());

//embedd LZstring for compression 
var LZString=function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return"";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return"";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else{if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u)}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var t,i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(t=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return"";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else{if(l!==d)return null;v=s+s.charAt(0)}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module&&(module.exports=LZString);

//embedd MJSFont list for the font menu with added computer modern and cmr10
MJSFontList=function(){function a(a){var n,e,o,t=0;if(0==a.length)return t;for(n=0,o=a.length;o>n;n++)e=a.charCodeAt(n),t=(t<<5)-t+e,t|=0;return t}function n(n){d.clearRect(0,0,u,c),d.font=l+n,d.fillText(r,0,c/2);var e=i.toDataURL("image/png");return a(e)}function e(a){return-1==s.indexOf(n(a))}var o=["sans-serif","serif","monospace","cursive"],t=["Arial","Arial Black","Baskerville","Batang","Big Caslon","Book Antiqua","Brush Script MT","Calibri","Candara","Century Gothic","Charcoal","Comic Sans MS","Computer Modern","Copperplate","Courier","DejaVu Sans","DejaVu Sans Mono","DejaVu Serif","Didot","Droid Sans","Droid Sans Mono","Droid Serif","Franklin Gothic Medium","Futura","Gadget","Garamond","Geneva","Georgia","Goudy Old Style","Helvetica","Impact","Latin Modern Roman","Latin Modern Mono","Latin Modern Sans","Lato","Lora","Lucida Console","Lucida Grande","Lucida Sans Unicode","Monaco","Open Sans Condensed","Oswald","PT Sans","Palatino","Palatino Linotype","Roboto","Rockwell","Rockwell Extra Bold","Segoe UI","Source Sans Pro","Tahoma","Times New Roman","Trebuchet MS","Ubuntu","Ubuntu-Title","Ubuntu Mono","Verdana","cursive"],r=(document.getElementsByTagName("body")[0],["agAmMqQwWlLi1"]),i=document.createElement("canvas"),u=100,c=15;i.width=u,i.height=c;for(var l="10px ",d=i.getContext("2d"),s=[],S=0;S<o.length;S++)s.push(n(o[S]));for(var m=o,S=0;S<t.length;S++)e(t[S])&&m.push(t[S]);return{fontList:m,hasFont:e,getFontMetric:n}}();

