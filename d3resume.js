/*! D3-resume v1.3.0 https://github.com/glena/d3-resume | Germán lena https://github.com/glena/ */
var d3Resume = function(_config){

	var lastTimeout = null;
	var formatToShow = d3.time.format("%m/%d/%Y");
	var format = d3.time.format("%Y-%m-%d");
	var parseDate = format.parse;
	var svg = null;
	var config = _config;
	var x = null;
	var y = null;
	var xAxis = null;
	var margin = 20;
	var width = document.documentElement.clientWidth-40;
	var height = d3.max([document.documentElement.clientHeight-300,600]);

	var colorWork = d3.scale.ordinal().range(["#5254a3","#637939","#BD9E39","#AD494A","#A55194","#01665E","#0868AC","#8C510A"]);
	var colorProject = d3.scale.ordinal().range(["#0868AC","#8C510A","#01665E","#A55194","#637939","#5254a3","#BD9E39","#AD494A"]);

  var init = function()
  {
		svg = d3
		.select(config.wrapperSelector)
		.append('svg')
			.attr('id', 'svg')
			.attr("width", width)
			.attr("height", height);

		x = d3.time.scale().range([20, width]);
		y = d3.scale.linear().range([height, 0]);
		y.domain([0, height]);

		xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(30)
			.tickSize(6)
			.tickFormat(d3.time.format("%Y"));

		d3.json(config.dataUrl, loadData);
  };

  var loadData = function(error, data){

		normalize(data.experience);
		normalize(data.study);

		x.domain([
				d3.min([
					d3.min(data.experience, function(d) { return d.from; }),
					d3.min(data.study, function(d) { return d.from; })
					]),
				d3.max([
					d3.max(data.experience, function(d) { return d.pto; }),
					d3.max(data.study, function(d) { return d.pto; })
					])
			]);

		calculateDiameter(data.experience);
		calculateDiameter(data.study);

		var graphContainer = svg
			.append("g")
			.attr("class", "graph-container")
			.attr("transform", "translate(" + [0,height - 220] + ")");

		var xAxilsEl = graphContainer.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + 0 + ")")
				.call(xAxis);

		xAxilsEl.selectAll("text")
				.style("text-anchor", "end")
				.attr("transform", "translate(-10,6)rotate(-60)");

		graphContainer.append('text')
				.classed('axis-label',true)
				.text('EXPERIENCE')
				.style("text-anchor", "center")
				.attr("transform", "translate("+[25,- 55]+") rotate(-90)");

		graphContainer.append('text')
				.classed('axis-label',true)
				.text('SPECIAL PROJECTS')
				.style("text-anchor", "end")
				.attr("transform", "translate("+[25,60]+") rotate(-90)");

		loadItems(svg, graphContainer, data.experience, "experience", -1, height / 10);
		loadItems(svg, graphContainer, data.study, "study", 1, height / 10);
	};

	var getPath = function (diameter, position)
	{
		var radius = diameter/2;
		var height = position * (100 + radius * 0.7);
		return "M0,0 q "+radius+" "+height+" "+diameter+" 0 z";
	};

	var normalize = function (data)
	{
		var a = 0;
		data.forEach(function(d) {
			d.id = a++;
			d.from = parseDate(d.from);
			if (d.to === null)
			{
				d.pto = new Date();
			}
			else
			{
				d.to = parseDate(d.to);
				d.pto = d.to;
			}
		});
	};

	var calculateDiameter = function (data)
	{
		data.forEach(function(d) {
			d.diameter = x(d.pto)-x(d.from);
			if (d.to === null)
			{
				d.diameter = d.diameter * 3;
			}
		});
		data.sort(function(a,b){
			return b.diameter - a.diameter;
		});
	};

	var addItemDetail = function (wrapper, size, position, weight, fill, text){
		wrapper.append('text')
					.attr("font-size",size)
					.style("font-weight", weight)
					.attr("fill", fill)
					.text(text)
					.attr("transform", position)
					.attr("class", "detail");
	};


	var loadItems = function (svg, graphContainer, data, className, position, infoTopPosition)
	{

		var gInfo = svg
			.selectAll("g.info."+className)
			.data(data)
			.enter()
				.append('g')
				.attr('class',function(d){ return className + d.id; })
				.classed('info',true)
				.classed('default',function(d){return d.default_item;})
				.classed(className,true)
				.attr("transform", "translate("+[width*0.1,infoTopPosition]+")")
				.attr("fill", function(d,i) {
					return d.type === "Work" ? colorWork(i) : colorProject(i);
				})
				.attr("fill-opacity", function(d){
					return d.default_item ? 1 : 0;
				});

		addItemDetail(gInfo, "20px", "translate("+[0,0]+")", "300", "#000000", function(d){return d.type;});
		addItemDetail(gInfo, "18px", "translate("+[0,25]+")", "normal", function(d,i) {return d.type === "Work" ? colorWork(i) : colorProject(i);}, function(d){return d.title;});
		addItemDetail(gInfo, "24px", "translate("+[0,50]+")", "300", "#525252",function(d){return d.institution;});
		addItemDetail(gInfo, "16px", "translate("+[0,75]+")", "300", "#000000", function(d){
																var text = formatToShow(d.from) + ' - ';
																if (d.to === null)
																	text += ' Present ';
																else
																	text += formatToShow(d.to);
																return text;
															});

		
		var descriptionWrapper = gInfo.selectAll('text.description')
				.data(function(d, i) {
					var position = 100;
					return d.description.split("\n").map(function(i){
						position += 20;
						return {
							text:i,
							position:position
						};
					});
				})
				.enter();

		addItemDetail(descriptionWrapper, "16px", function(d) {return "translate(0,"+d.position+")";},
			"300","#000000",function(d){return d.text;});


		graphContainer
			.selectAll("path."+className)
			.data(data)
			.enter()
			.append("path")
			.classed(className,true)
			.classed('item',true)
			.attr("fill", function(d,i) {
				return d.type === "Work" ? colorWork(i) : colorProject(i);
			})
			.attr("fill-opacity", 0.6)
			.attr("d",function(d){ return getPath(d.diameter, position); })
			.attr("transform", function(d) {
				return "translate(" + [x(d.from),  0] + ")";
			})
			.on('mouseover', function(d){
				graphContainer.selectAll("path.item").transition()
					.attr("stroke-width", "1")
					.attr("fill-opacity", 0.2);
				d3.select(this).transition()
					.attr("stroke-width", "2")
					.attr("fill-opacity", 1);
				showInfo(svg, className, d);
			})
			.on('mouseout', function(d){
				graphContainer
					.selectAll("path.item")
					.transition()
					.attr("stroke-width", "2")
					.attr("fill-opacity", 0.6);
				lastTimeout = setTimeout(hideInfo,3000);
			})
			.on('click', function(d) { return d.url === "" ? null : window.open(d.url); });
	};

	var hideInfo = function ()
	{
		svg.selectAll("g.info").transition().duration(1200).attr("fill-opacity", 0);
		svg.selectAll("g.info.default").transition().delay(1000).duration(1000).attr("fill-opacity", 1);
	};

	var showInfo = function (svg, className, d)
	{
		if (lastTimeout)
		{
			clearTimeout(lastTimeout);
			lastTimeout = null;
		}
		svg.selectAll("g.info").transition().attr("fill-opacity", 0);
		svg.selectAll("g.info."+className+"."+className+d.id).transition().attr("fill-opacity", 1);
	};

	// var resize = function()
 //  {
	//	width = document.documentElement.clientWidth-40;
	//	height = d3.max([document.documentElement.clientHeight-300,600]);

	//	svg = d3.select("#svg")
	//	.attr("width", width)
	//	.attr("height", height);

	//	x = d3.time.scale().range([20, width]);
	//	y = d3.scale.linear().range([height, 0]);
	//	y.domain([0, height]);

	//	xAxis = d3.svg.axis()
	//	.scale(x)
	//	.orient("bottom")
	//	.ticks(30)
	//	.tickSize(6)
	//	.tickFormat(d3.time.format("%Y"));

	//	d3.json(config.dataUrl, loadData);
 //  };

	// d3.select(window).on('resize', resize);

	init();
};
