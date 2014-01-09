

if(!String.prototype.startsWith){
    String.prototype.startsWith = function (str) { return !this.indexOf(str); };
    String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}



/*
 * A simple rendering of a chromosome's principle features, replicating the maps available on the classic
 * genedb site. Some attempt has been made to do a canvas version, but it has several problems that need
 * to be adressed, namely :
 *
 * - in Firefox there is an upper limit to the size of height of the canvas, which if exceeded nothing is rendered
 * - you can't currently draw text in canvas, which means using overlayed divs, which essentially means you still
 * 		have to draw the same number of text-divs for every feature, which means the advantage of using canvas
 * 		in this instance is questionable
 * - if the Canvas version is to be complete, clicking would have to be handled differently (not a problem, just
 * 		not worth doing if the above two issues aren't resolved first.
 *
 * Therefore, for the time being the canvas option should be treated as essentially broken, and the div-version
 * should be used instead.
 *
 *
 * @author gv1
 *
 * */
(function($) {


	$.fn.ChromosomeMap = function(arg) {

		return this.each(function() {

			var self = this;
			var settings=null;

			// variables
			var chromosomeCanvas = null;
			var chromosomeDiv = null;

			var aleadyLoaded = new Object();

			var useCanvas = false;
			var ctx = null;
			var length = 0;

			var base_position_start = 0;

			// lifted from web-artemis!
			var colours = [
		       '255,255,255',
		       '100,100,100',
		       '255,0,0',
		       '0,255,0',
		       '0,0,255',
		       '0,255,255',
		       '255,0,255',
		       '245,245,0',
		       '152,251,152',
		       '135,206,250',
		       '255,165,0',
		       '200,150,100',
		       '255,200,200',
		       '170,170,170',
		       '0,0,0',
		       '255,63,63',
		       '255,127,127',
		       '255,191,191'
		   ];

			this.reset = function () {
				$(self).html('');

				if (!settings.overideUseCanvas) {



			    	$(self).append("<canvas class='chromosome_canvas' style='position:absolute;' ></canvas>");
			    	chromosomeCanvas = $(self).children('.chromosome_canvas')[0];

			    	if (chromosomeCanvas.getContext && chromosomeCanvas.getContext('2d')) {
			    		ctx = chromosomeCanvas.getContext("2d");
			    		useCanvas = true;
			    	}


			    }

			    // whether or not we are using canvas, we still need a div for text
			    $(self).append("<div class='chromosome_div' style='position:relative;'></div>");
			    chromosomeDiv = $($(self).children('.chromosome_div')[0]);

			    aleadyLoaded = new Object();
			};

			this.getGridCoordinate = function (base_position) {

				var subtracted_position = base_position - base_position_start;

				var scaled_position = (subtracted_position / settings['bases_per_row']);
				var row_number = Math.floor(scaled_position);
				var x_position_in_bp = subtracted_position - (row_number * settings['bases_per_row']);
				var absolute_x_position = x_position_in_bp * ( settings.row_width / settings.bases_per_row );
				var absolute_y_position = (settings['row_vertical_space_sep'] + settings["row_height"]) * row_number;

				return {
					"x" : absolute_x_position,
					"y" : absolute_y_position,
					"row_number" : row_number
				};
			};

			this.append = function (x,y,w,h,color,label,text) {

				if (useCanvas) {
					ctx.fillStyle = color;
					ctx.fillRect(x,y,w,h);

					return "<div title='"+label +"' class='chromosome_feature "+label+"' style='position:absolute;left:" + x + "px;top:" + y + "px;height:"+ h +"px;'></div>";
				} else {

					var html = "<div title='"+label +"' class='chromosome_feature "+label+"' style='background-color:"+color+";position:absolute;left:" + x + "px;top:" + y + "px;height:"+ h +"px;width:"+ w +"px;'>";
					//html += "<div class='chromosome_feature_text' >" + text.substring(0,15) + "</div>";
					html += "</div>";

					return html;
				}
			};

			this.drawGraphLines=function(x,y,w,h,color,text) {

				var axisHtml = "";

				if (useCanvas) {
					ctx.strokeRect(x,y,w,h);
				} else {
					axisHtml += "<div class='chromosome_axis' style='border-top:1px solid black;position:absolute;left:" + x + "px;top:" + y + "px;width:"+ w +"px;height:0px;'></div>";
				}

				axisHtml += "<div class='chromosome_axis_label' style='z-index:100000000;position:absolute;left:" + (x + 5) + "px;top:" + (y) + "px;'>"+text+"</div>";
				return axisHtml;

			};

			this.escapeClassName=function(className) {
				// regex lifted from web-artemis
				return className.replace(/(:|\.|\|)/g,'\\$1');
			};

			this.loadSequence=function(options, success) {

				$.ajax({
			        url: settings.web_service_root + "/regions/sequenceLength.json",
			        type: 'GET',
			        dataType: 'jsonp',
			        data: {
			            'region' : settings.region
			        },
			        success: success
				});
			};



			this.drawAxes=function(length, oncomplete) {

				var yscale = self.getYScale();

				var row_num = Math.ceil (length / settings.bases_per_row);

				var height = (settings.row_height + settings.row_vertical_space_sep ) * row_num;

				$(self).css("height", height);

				if (useCanvas) {

					// might need to set a max for firefox
					// var max_canvas_height = 1000;
					// var canvas_height = (height > max_canvas_height) ? max_canvas_height : height;
					chromosomeCanvas.height = height;
					chromosomeCanvas.width = settings.row_width;

				}

				var row =0;

				var max_base_pair = length ;

//				if (max_base_pair > length) {
//					max_base_pair = length;
//				}

				var buffer = "";
				for (var base_position = base_position_start; base_position < max_base_pair; base_position += settings.bases_per_row) {
					row_y = (settings['row_vertical_space_sep'] + settings["row_height"]) * row / yscale;
					row_y += settings["row_height"] / 2;

					var text = (settings.axisLabels) ? base_position : "";

					buffer += this.drawGraphLines(0,row_y,settings.row_width, 0, "", text);
					row++;
				}

				chromosomeDiv.append(buffer);
				oncomplete(length);
			};



			// currently set to always return 1
			this.getYScale = function() {
				return 1;
			};

			// currently set to always return 1
			this.getXScale=function() {
				//return settings.bases_per_row / settings.row_width ;
				return 1;
			};

			this.loadChunk=function(start, end, onComplete) {
				$.ajax({
			        url: settings.web_service_root + "/regions/locations.json",
			        type: 'GET',
			        dataType: 'jsonp',
			        data: {
			            'region' : settings.region,
			            'types' : settings.types,
			            'exclude' : false,
			            'start' : start,
			            'end' : end
			        },
			        success: function(locations) {

			        	var base_position_end = base_position_start + settings.loading_interval;

			        	var yscale = self.getXScale() ;
			        	var xscale = self.getYScale() ;

			        	var minimum_possible_coordinate = self.getGridCoordinate(base_position_start).y / yscale;
			        	var maximum_possible_coordinate= self.getGridCoordinate(base_position_end).y / yscale;

		                var h = settings.row_height / 2 / yscale ;

		        		var buffer = '';
		        		var max_height = 0;

		        		$.each(locations, function(index, feature) {

			        		if (feature.isObsolete) {
			        			return;
	                        }

			        		if (aleadyLoaded[feature.uniqueName]) {
		        				return;
	        				}
			        		aleadyLoaded[feature.uniqueName] = 1;

		        			var actual_height  = 0;

		        			var coordsFmin = self.getGridCoordinate(feature.fmin);
		        			var coordsFmax = self.getGridCoordinate(feature.fmax);

		        			var color = settings.mouseoutColor;

		        			var propcolor = null;

		        			if (feature.hasOwnProperty("properties") && feature.properties.length > 0) {
		        			    propcolor = feature.properties[0].value;
		        			}

		        			if (propcolor != null) {
		        				color = "rgb(" + colours[propcolor] + ")";
		        			}


		        			var text = feature.uniqueName ;

		        			if (coordsFmin.row_number != coordsFmax.row_number) {

		        				var starting_row = coordsFmin.row_number;
		        				var ending_row = coordsFmax.row_number;

		        				for (r = starting_row; r <= ending_row; r++) {

		        					var r_x = null;
		        					var r_y = null;

		        					r_w = settings.row_width;


		        					if (r == starting_row) {

		        						r_x = coordsFmin.x / xscale;
		        						r_y = coordsFmin.y / yscale;


		        						r_w = settings.row_width - (coordsFmin.x / xscale);

		        					} else if (r == ending_row) {


		        						r_x = 0;
		        						r_y = coordsFmax.y / yscale;


		        						var row_y_start = (settings['row_vertical_space_sep'] + settings["row_height"]) * r / yscale;

		        						r_w = (coordsFmax.x - row_y_start) / yscale;

		        					} else {

		        						r_y = (settings['row_vertical_space_sep'] + settings["row_height"]) * r / yscale;
		        					}

		        					if (r_y > maximum_possible_coordinate) {
		        						continue;
		        					}

		        					if (r_y < minimum_possible_coordinate) {
	        							continue;
	        						}


		        					if (feature.strand == -1) {
		        					    y += (settings.row_height / 2) + 1
				        			}

		        					buffer += self.append(r_x,r_y,r_w,h,color,feature.uniqueName,text);
		        					text = '';

		        					actual_height = r_y + h;

		        				}

		        			} else {

		        				if (feature.fmin >= base_position_start) {

		        					var x = coordsFmin.x / xscale;
				        			var y = coordsFmin.y /yscale ;
				        			var w = (coordsFmax.x - coordsFmin.x) / yscale ;


				        			if (feature.strand == -1) {
				        				y += (settings.row_height / 2) + 1;
				        			}

				        			buffer += self.append(x,y,w,h,color,feature.uniqueName, text);
				        			actual_height = y + h;

	    						}



		        			}

		        			if (actual_height > max_height) {
		        				max_height = actual_height;
		        			}

			    		});


		        		chromosomeDiv.append(buffer);

		        		// $('chromosome_feature').fadeTo(500,0.5);

		        		//self.loadColors();



		        		onComplete();

			        }



			    });

			};

//			this.loadColors = function() {
//
//				var bin = [];
//				var n = 0;
//				var max = 20;
//
//				$.each (aleadyLoaded, function(featureNameAsIndex, number) {
//
//
//					if (n > max) {
//						n = 0;
//						self.loadColorSet(bin);
//						bin = [];
//					}
//
//					bin.push(featureNameAsIndex, featureNameAsIndex + ":pep");
//
//					n++;
//
//				});
//
//				if (bin.length > 0) {
//					self.loadColorSet(bin);
//				}
//
//			};

//			this.loadColorSet=function(bin) {
//				$.ajax({
//					traditional : true, // we're sending non string delimited arrays here, and we don't want [] either.
//			        url: settings.web_service_root + "features/properties.json",
//			        type: 'GET',
//			        dataType: 'jsonp',
//			        data: {
//			            'features' : bin,
//			            'types' : "colour"
//			        },
//			        success: function(features) {
//
//			        	if (! features) {
//			        		return;
//			        	}
//
//			        	$.each(features, function(index, feature) {
//
//			        		var uniqueName = feature.uniqueName;
//			        		if (feature.uniqueName.contains(":pep")) {
//			        			uniqueName = feature.uniqueName.replace("\:pep", "");
//			        		} else if (feature.uniqueName.contains(":mRNA")) {
//			        			uniqueName = feature.uniqueName.replace("\:mRNA", "");
//			        		}
//
//			        		var elements = $('.' + self.escapeClassName(uniqueName));
//
//			        		if (elements.length > 0) {
//
//			        			$.each(feature.properties, function(index, prop) {
//				        			if (prop.name == "colour") {
//				        				var colour = "rgb(" + colours[prop.value] + ")";
//				        				elements.css('backgroundColor', colour);
//				        				coloured = true;
//				        				return;
//				        			}
//				        		});
//
//			        			//elements.css('opacity', 0.5);
//			        		}
//			        	});
//
//			        }
//				});
//			};

//			function setColor(feature) {
//				var uniqueName = feature.uniqueName;
//        		if (feature.uniqueName.contains(":pep")) {
//        			uniqueName = feature.uniqueName.replace("\:pep", "");
//        		} else if (feature.uniqueName.contains(":mRNA")) {
//        			uniqueName = feature.uniqueName.replace("\:mRNA", "");
//        		}
//
//        		var elements = $('.' + self.escapeClassName(uniqueName));
//
//        		if (elements.length > 0) {
//
//        			$.each(feature.properties, function(index, prop) {
//	        			if (prop.name == "colour") {
//	        				var colour = "rgb(" + colours[prop.value] + ")";
//	        				elements.css('backgroundColor', colour);
//	        				coloured = true;
//	        				return;
//	        			}
//	        		});
//
//        			//elements.css('opacity', 0.5);
//        		}
//			}


//			this.next = function() {
//
//				this.reset();
//				base_position_start = base_position_start + settings.loading_interval;
//				this.drawAxes(length, function() {
//					self.loadChunk(base_position_start, base_position_start + settings.loading_interval);
//				});
//
//			};
//
//			this.previous = function() {
//
//				this.reset();
//				base_position_start = base_position_start - settings.loading_interval;
//				if (base_position_start < 0) {
//					base_position_start = 0;
//				}
//				this.drawAxes(length, function() {
//					self.loadChunk(base_position_start, base_position_start + settings.loading_interval);
//				});
//
//			};

			this.init = function( options ) {

				settings = $.extend({}, $.fn.ChromosomeMap.defaults, options);

				base_position_start = settings.base_position_start;

			    $(this).click(function(event)  {

			    	settings.click(event);

	        	}).mouseover(function(event) {

	        		var target = $(event.target);

	        		if (target.hasClass('chromosome_feature')) {
	        			var title = target.attr('title');
	                    $('.' + self.escapeClassName(title))
	                    	.css('borderColor', settings.mouseoverColor)
	                    	//.css('color', settings.mouseoverFontColor)
	                    	.stop().fadeTo(500,1);
	                    return false;
	        		}



	            }).mouseout(function(event) {

	            	var target = $(event.target);

	        		if (target.hasClass('chromosome_feature')) {
	        			var title = target.attr('title');
	                    $('.' + self.escapeClassName(title))
	                    	.css('borderColor', settings.mouseoutColor)
	                    	//.css('color', settings.mouseoutFontColor)
	                    	.stop().fadeTo(1000,0.5);
	                    return false;
	        		}

	            });

			    this.reset();



				this.loadSequence(settings, function(sequences) {
					length = sequences[0].length;
//					if (settings.bases_per_row >= length) {
//						settings.bases_per_row = length * 5;
//					}

					var Chunker = function(chunks) {
						var index = 0;
						var self_chunker = this;
						this.next = function () {
							//console.log("Loading chunk" + index);
							if (index < chunks.length) {
								var chunk = chunks[index];
								index++;
								self.loadChunk(chunk[0], chunk[1], self_chunker.next);
							}
						};
					};

					self.drawAxes(length, function() {
						var chunks = [];
						for (var base_position = base_position_start; base_position <= length ; base_position += settings.loading_interval) {
							//self.loadChunk(base_position, base_position + settings.loading_interval);
							chunks.push([base_position, base_position + settings.loading_interval]);
						}
						new Chunker(chunks).next();
					});
				});


			};


			var methods = {
				init:this.init,
				previous:this.previous,
				next:this.next
			};


			if (methods[arg]) {
				return methods[arg].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof arg === 'object' || !arg) {
				// we don't pass the arguments of this inner function, but instead the ones sent to the ChromosomeMap
				return methods.init.apply(this, [arg]);
			}


		});
	};

	$.fn.ChromosomeMap.defaults = {
		'region' : 'Pf3D7_01',
		'types' : 'polypeptide,rRNA,snoRNA,snRNA,tRNA,miscRNA,centromere',
		'bases_per_row' : 50000,
		'row_height' : 50,
		'row_width' : 800,
		'row_vertical_space_sep' : 50,
		'loading_interval' : 10000000,
		'mouseoverColor' : "rgb(34,145,220)",
		'mouseoutColor' : "rgb(168,202,235)",
		'mouseoverFontColor' : "rgb(50,50,50)",
		'mouseoutFontColor' : "rgb(0,0,0)",
		'overideUseCanvas' : false,
		'axisLabels' : true,
		'click' : function(event) {
			//$.log(event);
		},
		'base_position_start' : 0,
		'web_service_root' : "/services/"
	};



})(jQuery);

(function($) {

	$.fn.ChromosomeMapSlider = function(arg) {

			var userArguments = arguments;

			return this.each(function() {

				this.pos = 0;
				this.width = 100;
				this.down = false;

				var self = this;

				this.init = function(options) {
			    	this.settings = $.extend({}, $.fn.ChromosomeMapSlider.defaults, options);


					$(this)
						.css('position' , 'relative')
						.css('cursor', 'pointer')
						.css('width', this.settings.windowWidth)
						.css('height', this.settings.windowHeight);

					$(this).append("<div class='chromosomeMapSliderButton'></div>");


					$('.chromosomeMapSliderButton')
						.css('position', 'absolute')
						.css('height', this.settings.windowHeight -2)
						.css('border', '1px solid')
						.css('cursor', 'move')
						.css('borderColor', this.settings.border);
						//.css('zIndex' , $(this).css('zIndex') - 100);

					$('.chromosomeMapSliderButton').bind('dragstart', function(event) {
					    event.preventDefault();
					});


					$('.chromosomeMapSliderButton').hover(
						function(e) {

							$(".chromosomeMapSliderButton").stop().animate({
								borderTopColor: self.settings.borderHover,
								borderBottomColor: self.settings.borderHover,
								borderLeftColor: self.settings.borderHover,
								borderRightColor: self.settings.borderHover
							}, 'fast');
						},
						function(e) {

							if (this.down) {
								return;
							}

							$(".chromosomeMapSliderButton").stop().animate({
								borderTopColor: self.settings.border,
								borderBottomColor: self.settings.border,
								borderLeftColor: self.settings.border,
								borderRightColor: self.settings.border
							}, 'slow');
						}
					);

					this.pos = parseInt(this.settings.pos);
					this.width = parseInt(this.settings.width);
					this.set(this.pos,this.width);

					$(this).mousedown(function(event) {
						this.notify('down');
						this.down = true;
						$(this).css('cursor', 'move');
					});

					$(this).mouseup(function(event) {
						this.notify('up');
						if (this.down) {
							this.redraw(event.pageX - $(this).offset().left);
						}
						this.down = false;
						$(this).css('cursor', 'pointer');
					});

					$(this).mousemove(function(event) {
						if (this.down) {
							this.redraw(event.pageX - $(this).offset().left);
							//this.pos = this.windowWindowToPos(event.pageX - this.offsetLeft) - parseInt(this.width / 2);
							//this.set(this.pos,this.width);
						}
					});

			    };

			    this.redraw=function(x) {

			    	this.pos = this.windowWindowToPos(x) - parseInt(this.width / 2);
					//var winWidth = this.posToWindow(this.width);

					this.set(this.pos,this.width);

					//console.log("?", x, winWidth);
					//this.setUsingWindowCoordinates(x,winWidth);
					this.notify('move',this.pos,this.width);
					this.down = true;
			    };

			    this.notify = function() {
			    	var notificationArgs = arguments;
			    	$.each(this.settings.observers, function(n,observer) {
			    		observer[notificationArgs[0]].apply(this, Array.prototype.slice.call(notificationArgs, 1));
			    	});

			    };

			    this.windowWindowToPos=function(value) {
			    	var scaledValue = value / this.settings.windowWidth;
			    	var pos = (scaledValue * (this.settings.max - this.settings.min)) - this.settings.min;
			    	//console.log([value, this.settings.windowWidth,scaledValue, pos]);
			    	return parseInt(pos);
			    };

			    this.posToWindow=function(value) {
			    	var scaledValue = (value + this.settings.min) / (this.settings.max - this.settings.min);
			    	//console.log(scaledValue);
			    	var windowValue = scaledValue * this.settings.windowWidth;
			    	return windowValue;
			    };


			    /**
			     * The only public method (other than init).
			     */
			    this.set = function(start,witdh) {
			    	this.pos = parseInt(start);
			    	this.width = parseInt(witdh);

//			    	if (this.pos < this.settings.min) {
//			    		this.pos = this.settings.min;
//			    	}
//
//			    	if (this.width > this.settings.max) {
//			    		this.width = this.settings.max;
//			    	}
//
			    	//console.log([start,witdh,this.pos,this.width,this.settings.min,this.settings.max]);

			    	var wStart = this.posToWindow(this.pos);
			    	var wWidth = this.posToWindow(this.width) ;
			    	//console.log([start,witdh,wStart,wWidth]);
			    	//console.log("!", this.pos,this.width);
			    	this.setUsingWindowCoordinates(wStart,wWidth);


			    };

			    this.setUsingWindowCoordinates = function(start,width) {

			    	//console.log(":", start,width);

			    	if (width < this.settings.minButtonWidth) {
			    		width = this.settings.minButtonWidth;
			    	}

			    	//console.log(":", start,width);

			    	$('.chromosomeMapSliderButton')
			    		.css('left' , start)
			    		.css('width', width);

			    };

			    /**
			     * Public methods.
			     */
				var methods = {
				    init:this.init,
				    set:this.set
				};


				if (methods[arg]) {
					return methods[arg].apply(this, Array.prototype.slice.call(userArguments, 1));
				} else if (typeof arg === 'object' || !arg) {
					// we don't pass the arguments of this inner function, but instead the ones sent to the ChromosomeMap
					return methods.init.apply(this, [arg]);
				}

			});

	};



	$.fn.ChromosomeMapSlider.defaults = {
		border : "rgb(0,53,130)",
		borderHover : "rgb(192,0,8)",
		windowWidth : 500,
		windowHeight : 22,
		minButtonWidth : 1,
		min : 1,
		max : 100,
		pos : 1,
		width : 100,
		observers : []
	};



})(jQuery);


/**
 * Observes the chromosome map, reporting any changes to Web-Artemis.
 * @returns {ChromosomeMapToWebArtemis}
 */
function ChromosomeMapToWebArtemis() {

	this.move = function(leftBase, bases) {
		var fDisplay = featureDisplayObjs[0];
        fDisplay.leftBase = leftBase;
        if (bases != null)
        	fDisplay.basesDisplayWidth = bases;
        drawAndScroll(fDisplay, fDisplay.lastLeftBase);
        $('#slider'+fDisplay.index).slider('option', 'value', leftBase);
	};

	this.down = function() {
		var fDisplay = featureDisplayObjs[0];
		fDisplay.minimumDisplay = true;
	};

	this.up = function() {
		var fDisplay = featureDisplayObjs[0];
        fDisplay.minimumDisplay = false;
	};
};


/**
 * Observes Web-Artemis, reporting any changes to the chromosome map.
 * @param selector
 * @returns {WebArtemisToChromosomeMap}
 */
function WebArtemisToChromosomeMap(selector) {
    this.redraw = function redraw(start, end) {
        $(selector).ChromosomeMapSlider('set', start, end - start);
    };
    this.select = function(feature, fDisplay) {};
};







/**
 *
 * A simple chromosome picker. Uses buttons.
 * @author gv1
 *
 */
(function($) {

	$.fn.ChromosomePicker = function(options) {

		var settings = $.extend({}, $.fn.ChromosomePicker.defaults, options);

		return this.each(function() {

			$(this).append("<div class='region_types'></div>");
			$(this).append("<div class='regions'></div>");

			this.region_types_container = $($(this).children('.region_types')[0]);
			this.region_types_container.addClass('ui-widget-header').addClass('fg-toolbar');

			this.regions_container = $($(this).children('.regions')[0]);

			this.offset = settings.initial_offset;
			this.limit = settings.initial_limit;

			// a reference to the element
			var self = this;

			// private methods follow...

			this.loadTypes = function () {
				self.addCall();

				self.regions_container.html('');
				self.region_types_container.html('');

				$.ajax({
			        url: settings.web_service_root + "regions/typesinorganism.json",
			        type: 'GET',
			        dataType: 'jsonp',
			        data: {
			            'organism' : settings.organism
			        },
			        success: function(regions) {
			        	$.each(regions, function(index, region) {
			        		var type = region.type.name;
			        		self.region_types_container.append("<button class='fg-button ui-state-default region_type' region_type='" + type + "' >" + type + "</button>");
			        	});
						self.onLoadTypes();
			        }
				});
			};

			this.onLoadTypes = function() {
				self.removeCall();

				$(self).find('.region_type').click(function(event) {
					var type = $(this).attr("region_type");

					self.loadRegions(type, self.limit, self.offset);

				}).button({
				  icons: {
					    primary: 'ui-icon-gear',
					    secondary: "ui-icon-triangle-1-s"
					  }
					});
			};

			this.loadRegions = function (type, limit, offset) {
				self.addCall();
				var data = {
		            'organism' : settings.organism
		        };

				if (type != null) {
					data["type"] = type;
				}
				if (limit != null) {
					data["limit"] = limit;
				}
				if (offset != null) {
					data["offset"] = offset;
				}

				$.ajax({
			        url: settings.web_service_root + "regions/inorganism.json",
			        type: 'GET',
			        dataType: 'jsonp',
			        data: data,
			        success: function(regions) {
//			        	var regions = [];
//			        	$.each(regions, function(index, region) {
//			        		regions.push(region.uniqueName);
//			        	});
			        	self.onLoadRegions(type, regions);
			        }
				});

			};

			this.onLoadRegions = function (type, regions) {
				self.removeCall();

				self.region_types_container.html('');
				self.regions_container.html('');

				var s = "";
				s += "<button class='ui-state-default fg-button region back' >Back</button>";
				$.each(regions, function(index, region) {
					s += "<button class='fg-button ui-state-default region' style='overflow:hidden;font-size:x-small;' alt='"+region.uniqueName+"' title='"+region.uniqueName+"' region='"+region.uniqueName+"' >" + region.uniqueName + "</button>";
				});

				if (regions.length == self.limit) {
					s += "<button class='ui-state-default fg-button region more' >More</button>";
				}

				self.regions_container.append(s);

				$(self).find('button.region').click(function(event) {

					var region = $(event.currentTarget).attr("region");

					if (region != null) {
						settings.on_select(region);
					} else if ($(event.currentTarget).hasClass('more')) {

						self.limit = self.limit * 10;

						self.loadRegions(type, self.limit, self.offset);

					} else if ($(event.currentTarget).hasClass('back')){
						self.loadTypes();
					}
				}).button({
					  icons: {
						    primary: 'ui-icon-document'//,
						    //secondary: 'ui-icon-triangle-1-e'
						  }
						});
				$('button.back').button({
				  icons: {
					    primary: 'ui-icon-triangle-1-w'
					  }
					});
				$('button.more').button({
				  icons: {
					    primary: 'ui-icon-triangle-1-s'
					  }
					});
			};

			this.addCall = function() {
				if (settings.spinner) {
					$(settings.spinner).CallStatusSpinner("addCall");
				}
			};

			this.removeCall = function() {
				if (settings.spinner) {
					$(settings.spinner).CallStatusSpinner("removeCall");
				}
			};

			this.loadTypes();

		});



	};

	$.fn.ChromosomePicker.defaults = {
		'web_service_root' : "/services/",
		"organism" : "com:Pfalciparum",
		"initial_offset" : 0,
		"initial_limit" : 5,
		"on_select" : function(region) {
			$.log(region);
		},
		"spinner" : null
	};



})(jQuery);


/**
 * Pops up a window with recent changes displayed.
 *
 * */
(function($) {



	$.fn.AnnotationModificationReporter = function(options) {

		return this.each(function() {

			// we keep a copy of this for private methods
			var self = this;

			var settings = $.extend({}, $.fn.AnnotationModificationReporter.defaults, options);

			$(this).html('<div class="activities" style="display:none;" class="ui-state-default ui-corner-all">' +
					'<div class="datepickercontainer" style="text-align:right">Change date: <input type="text" class="annotation_change_datepicker" ><br><span  class="modifiedReporterPopupSpinner" >&nbsp;&nbsp;&nbsp;</span></div>' +
					'<div style="font-size:small;" class="readableActivity"></div>' +
					'</div>');

			var readableActivity = $(this).find('div.readableActivity')[0];
			var activities = $(this).find('.activities')[0];
			var annotation_change_datepicker = $(activities).find('input.annotation_change_datepicker')[0];

			// we create a spinner just for the popup
			$('.modifiedReporterPopupSpinner').CallStatusSpinner();

			// private methods follow ...

			this.loadStatistics = function (organism, date, handler) {
				if (settings.spinner) {
					$(settings.spinner).CallStatusSpinner("addCall");
				}
				$.ajax({
			        url: settings.web_service_root + "features/annotation_changes_statistics.json",
			        type: 'GET',
			        dataType: 'jsonp',
			        data: {
			            'organism' : settings.organism,
			            'date' : getDateString(date)
			        },
			        success: handler
				});
			};

			this.onLoadStatistics = function (statistics) {
				if (settings.spinner) {
					$(settings.spinner).CallStatusSpinner("removeCall");
				}

				$(self).append ("<P>Over last "+settings.defaultDateOffset+" days : <br/>");
				var inserted = false;
				$.each(statistics, function(index, statistic) {
	        		$(self).append(" &raquo; " + statistic.value + " features with <i>" + statistic.name + "</i> curations <br>");
	        		inserted = true;
	        	});
				if (! inserted) {
					$(self).append ("&raquo; No changes. <br>");
				}
				$(self).append ("<a id='showstats' style='cursor:pointer;' >More details...</a> </P>");
        $('span#activity_rss').html("<a href='" + settings.baseHREF + "../rss/" + settings.organism.slice(4) + "/since/4/months'><img src='" + settings.baseHREF + "../includes/images/rss.gif' alt='RSS' /></a>");
        $('head').append('<link rel="alternate" type="application/rss+xml" title="Annotation activity for ' + settings.organism.slice(4) + '" href="' + settings.baseHREF + '../rss/' + settings.organism.slice(4) + '/since/4/months" />');
				$('a#showstats').click(function(event) {
					self.loadAnnotationChanges(settings.organism, self.getDefaultDate(), self.onLoadAnnotationChanges);
				});

			};

			this.loadAnnotationChanges = function (organism, date, handler) {
				if (settings.spinner) {
					$(settings.spinner).CallStatusSpinner("addCall");
					$('.modifiedReporterPopupSpinner').CallStatusSpinner("addCall");
				}
				$.ajax({
			        url: settings.web_service_root + "features/annotation_changes.json",
			        type: 'GET',
			        dataType: 'jsonp',
			        data: {
			            'organism' : settings.organism,
			            'date' : getDateString(date)
			        },
			        success: function (changes) {
			        	handler(changes, organism, date);
			        }
				});
			};

			this.onLoadAnnotationChanges = function (features, organism, date) {
				if (settings.spinner) {
					$(settings.spinner).CallStatusSpinner("removeCall");
					$('.modifiedReporterPopupSpinner').CallStatusSpinner("removeCall");
				}

				var s = "<table cellpadding=10 cellspacing=10><tr><th>gene</th><th>type</th><th>details</th><th>date</th></tr>";

				var countFeatures = features.length;
				var countAnnotationChanges = 0;

				$.each(features, function(index, feature) {
					var a = "<tr ><td><a style='text-decoration:underline;' href='"
						+ settings.baseHREF + feature.uniqueName + "' >" + feature.uniqueName + "</a></td><td>";

					$.each(feature.changes, function(index, change) {
						a += "<tr><td>&nbsp;&raquo;&nbsp;</td>";
						a += "<td>" + change.type + "</td>";
						a += "<td>" + change.detail + "</td>";
						a += "<td>" + change.date + "</td>";
						a += "</tr>";
						countAnnotationChanges++;
					});

					a += "</tr>";

	                s += a;
				});

				s += "</table>";

				$(readableActivity).html(s);

				$(activities).dialog({
					width: 700,
					height: 530 ,
					title :  "Recent annotation activity (since "  + getDateString(date) + ", features " + countFeatures + ", annotations "+countAnnotationChanges+" )"
				});;

				$(annotation_change_datepicker).datepicker({
					maxDate: '+0D',
					dateFormat: 'yy-mm-dd',
					selectedDate: date,
					onSelect: function(dateText, inst) {
						var newDate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
						self.loadAnnotationChanges(organism, newDate, self.onLoadAnnotationChanges);
					}
				});


			};

			this.getDefaultDate = function () {
				return getDateAtXDaysAgo(settings.defaultDateOffset);
			};


			this.loadStatistics(settings.organism, this.getDefaultDate(), this.onLoadStatistics);

		});



	};

	// defaults can be overriden by users if desired
	$.fn.AnnotationModificationReporter.defaults = {
		web_service_root : "/services/",
		organism : "com:Pfalciparum",
		date : "2011-01-01",
		defaultDateOffset : 120,
		baseHREF : "/",
		spinner : null
	};

	// these are essentially private static methods, so no need to make copies for every element...

	function getDateAtXDaysAgo(since) {
		var d = new Date();
		d.setDate(d.getDate() - since);
		return d;
	}

	function getDateString(date) {
	    var year = pad(date.getFullYear(), 4);
	    var month = pad(date.getMonth() + 1, 2);
	    var day = pad(date.getDate(), 2);
	    var dateString = year + "-" + month + "-" + day;
	    return dateString;

	}

	function pad(number, length) {
	    var str = '' + number;
	    while (str.length < length) {
	        str = '0' + str;
	    }
	    return str;
	}



})(jQuery);




/**
 * A simple spinner plugin, which can be told to stack up calls. As long as the call number
 * is over 0, it will keep on spinning.
 * @author gv1
 */
(function($) {

	$.fn.CallStatusSpinner = function(arg) {
		return this.each(function() {

			// if it's a method name we're invoking
			if (methods[arg]) {
				// we use apply to pass the correct "this" to the public methods
				return methods[arg].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof arg === 'object' || !arg) {
				// we don't pass the arguments of this inner function, but instead the ones sent to CallStatusSpinner
				return methods.init.apply(this, [arg]);
			}

		});
	};

	// exposed so that default can be changed once globally if desired
	$.fn.CallStatusSpinner.defaults = {
        height: 20,
        width: 20,
        img: '/path/to/image'
    };

	var methods = {
		addCall : function () {
	        this.calls++;
	        if (! this.calling) {
	            var img = "<img src='" + this.settings.img + "' height='"+ this.settings.height +"' width='"+ this.settings.width + "' >";
	            $(this).html(img);
	        }
	        calling = true;
	    },
		removeCall : function() {
	    	this.calls--;
	        if (this.calls < 0) {
	        	this.calls = 0;
	        }
	        if (this.calls == 0) {
	            $(this).html('');
	            this.calling = false;
	        }
	    },
		reset : function() {
	    	this.calls = 0;
	    	this.calling = false;
	        $(this).html('');
	    },
	    init : function(options) {
	    	this.settings = $.extend({}, $.fn.CallStatusSpinner.defaults, options);
			this.calling = false;
			this.calls = 0;
	    }
	};





})(jQuery);

