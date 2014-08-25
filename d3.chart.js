(function()
{
    var mulChart = function()
    {
        var chart = function(section)
        {
            // Data model
            /*
            Origin data sample:
            {
                todo: add type like 'time' or 'number'
                x: [1, 3, 5, 7, 9, 11, 13, 15, 29], // probably timestamps
                y: [
                    [2,3,4,3,34,5,6,3,2],
                    [2,3,4,3,34,5,6,3,2],
                    [2,3,4,3,34,5,6,3,2],
                    [2,3,4,3,34,5,6,3,2]
                ]
            }

            Result data sample:
            [
                [{x: 1, y: 2},{x: 3, y: 5},{x: 5, y: 23},{x: 7, y: 2},{x: 9, y: 2},{x: 11, y: 22},{x: 13, y: 132},{x: 15, y: 7},{x: 29, y: 7}],
                [{x: 1, y: 12},{x: 3, y: 15},{x: 5, y: 3},{x: 7, y: 21},{x: 9, y: 2},{x: 11, y: 22},{x: 13, y: 32},{x: 15, y: 71},{x: 29, y: 7}],
                [{x: 1, y: 22},{x: 3, y: 25},{x: 5, y: 33},{x: 7, y: 25},{x: 9, y: 2},{x: 11, y: 22},{x: 13, y: 32},{x: 15, y: 7},{x: 29, y: 7}],
                [{x: 1, y: 32},{x: 3, y: 35},{x: 5, y: 13},{x: 7, y: 29},{x: 9, y: 2},{x: 11, y: 22},{x: 13, y: 32},{x: 15, y: 98},{x: 29, y: 7}]
            ]
            */


            var margin = {top: 20, right: 10, bottom: 30, left: 40},
                width = 960 - margin.left - margin.right,
                height = 200 - margin.top - margin.bottom;

            var svg, verticalLine;

            //  Dataset is the data after converted
            var dataset, datasetLen;
            var xScale, xAxis;


            var bindOnZoomArr = [], graphes = [], rects = [], circles = [], mainLines = [], yScales = [];

            var defineSvg = function()
            {
                svg = d3.select(this)  // `this` is the html selection
                    .append('svg')
                    .attr('class', 'd3-chart')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', datasetLen * (height+margin.top+margin.bottom));
            };
            var drawVerticalLine = function()
            {
                verticalLine = svg.append('line')
                    .attr({
                        'x1': 0,
                        'y1': 0,
                        'x2': 0,
                        'y2': datasetLen * (height+margin.top+margin.bottom)
                    })
                    .attr('opacity', 0)
                    .attr('class', 'vertical-line')
                    .attr('stroke', 'gray');
            };
            var defineCommonX = function()
            {
                xScale = d3.scale.linear().domain(d3.extent(data.x, function(d){return d})).range([0, width]);
                xAxis = d3.svg.axis()
                    .scale(xScale);
            };

            // Convert originData to resultData function
            var convertDataFormat = function(originData)
            {
                var xData = originData.x,
                    xDataLen = xData.length,
                    yData = originData.y,
                    yDataLen = yData.length;

                for (var i = 0; i < yDataLen; i++)
                {
                    var eachOriginData = yData[i];
                    eachOriginData.forEach(function(v, i)
                    {
                        var obj = {};
                        obj['x'] = xData[i];
                        obj['y'] = v;
                        eachOriginData[i] = obj;
                    });
                }

                return yData;
            };

            // Zoom binding function
            var onZoomFun = function(i, graph, xAxis, mainLine, line, yScale)
            {
                return function()
                {
                    // xaxis redraw
                    graph.select('.xaxis').call(xAxis);

                    // line redraw
                    line
                        .y(function(d, i){return yScale(d.y)});
                    mainLine.attr('d', line(dataset[i]));

                    // circles redraw
                    graph.selectAll('circle.circle-dot')
                        .attr({
                            cx: function(d){return xScale(d.x)},
                            cy: function(d){return yScale(d.y)}
                        });

                };
            };

            // Mouse move binding function
            var mouseMoveFun = function()
            {
                var mouseX = d3.mouse(this)[0];
                var verticalLineX;

                dataset.forEach(function(v, i)
                {
                    var mainLine = mainLines[i],
                        circle = circles[i];

                    var pathLength = mainLine.node().getTotalLength();
                    var pointToCheck = 0,
                        increment,
                        pos;  // 相对坐标的位移
                    // Find the dots on path lines, which intersect with verticalLine
                    // Return pos
                    while (true) {
                        if (pointToCheck > pathLength) {
                            pos = mainLine.node().getPointAtLength(pathLength);
                            break;
                        }
                        pos = mainLine.node().getPointAtLength(pointToCheck);
                        if (mouseX <= pos.x) {
                            break;
                        }
                        else {
                            increment = mouseX - pos.x;
                            pointToCheck += increment;
                        }
                    }

                    // Find the position of lately circle dot.
                    // Two methods here: Linear search && Binary search
                    var currentXValue = xScale.invert(pos.x);   // value, not position offset
                    var singleLineData = dataset[i];
                    var xAtDotValue, yAtDotValue;  // x, y value

                    var getRightDotValue = function(prev, after)
                    {
                        if (Math.abs(currentXValue - singleLineData[prev].x) <= Math.abs(currentXValue - (singleLineData[after].x)))
                        {
                            xAtDotValue = singleLineData[prev].x;
                            yAtDotValue = singleLineData[prev].y;
                        }
                        else
                        {
                            xAtDotValue = singleLineData[after].x;
                            yAtDotValue = singleLineData[after].y;
                        }
                    };

                    if (singleLineData.length <= 20)   //  Linear search
                    {
                        singleLineData.forEach(function(data, index)
                        {
                            if (currentXValue >= singleLineData[index].x && currentXValue <= singleLineData[index+1].x)      // todo: has bug of this method
                            {
                                getRightDotValue(index, index+1);
                            }
                        });
                    }
                    else    //  Binary search
                    {
                        var l = singleLineData.length;
                        var binarySearch = function(low, high)
                        {
                            var midKey = Math.floor((high + low) / 2);   // Array starts with 0

                            if (singleLineData[midKey-1].x == currentXValue)
                            {
                                xAtDotValue = singleLineData[midKey-1].x;
                                yAtDotValue = singleLineData[midKey-1].y;
                            }
                            else
                            {
                                if ((high - low) == 1)  //  get the correct district
                                {
                                    getRightDotValue(low-1, high-1);
                                }
                                else
                                {
                                    if (singleLineData[midKey-1].x > currentXValue)
                                    {
                                        binarySearch(low, midKey);
                                    }
                                    else
                                    {
                                        binarySearch(midKey, high);
                                    }
                                }
                            }
                        };
                        binarySearch(1, l);

                    }
                    // set the position
                    circle.attr('opacity', 1)
                        .attr('cx', xScale(xAtDotValue))
                        .attr('cy', yScales[i](yAtDotValue));

                //        debug
                //        console.log(xScale.invert(pos.x), yScales[i].invert(pos.y));

                    verticalLineX = xScale(xAtDotValue);
                });



                // set vertical line position
                verticalLine
                    .attr('opacity', 1)
                    .attr('transform', function()
                    {
                        return 'translate('+(verticalLineX + margin.left)+')'
                    })
            };

            var mouseOutFun = function()
            {
                verticalLine.attr('opacity', 0);
                circles.forEach(function(v, i)
                {
                    v.attr('opacity', 0);
                });
            };

            var drawCharts = function()
            {
                for(var i = 0; i < datasetLen; i++)
                {
                    var yScale = d3.scale.linear().domain(d3.extent(dataset[i], function(d){return d.y})).range([height, 0]);

                    var g = svg.append('g')
                        .attr('class', 'g'+i+' d3-chart-g')
                        .attr('transform', 'translate('+margin.left+','+ (margin.top + i * (height + margin.top + margin.bottom) ) +')');

                    var graph = d3.select('.g'+i);
                    graph.append('clipPath')
                        .attr('id', 'clip')
                        .append('rect')
                        .attr('width', width + margin.right)
                        .attr('height', height + margin.top)
                        .attr('transform', 'translate(0, '+ (-margin.top) +')')
                        .attr('fill', 'none');
                    graph.append('g')
                        .attr('class', 'xaxis')
                        .attr('transform', 'translate(0, '+ (height) +')')
                        .call(xAxis);

                    var yAxis = d3.svg.axis()
                        .scale(yScale)
                        .orient('left');
                    graph.append('g')
                        .attr('class', 'yaxis')
                        .attr('transform', 'translate(0, 0)')
                        .call(yAxis);
                    var line = d3.svg.line()
                        .x(function(d){return xScale(d.x)})
                        .y(function(d){return yScale(d.y)})
                        .interpolate('step');
                    var mainLine = graph.append('path')
                        .attr('d', line(dataset[i]))
                        .attr('stroke', 'red')
                        .attr('fill', 'none')
                        .attr('clip-path', 'url(#clip)');
                    var rect = graph.append('rect')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr('width', width)
                        .attr('height', height)
                        .attr('fill', 'transparent')
                        .attr('cursor', 'move');

                    // draw each chart circles
                    graph.selectAll('circle')
                        .data(dataset[i])
                        .enter()
                        .append('circle')
                        .attr('class', 'circle-dot')
                        .attr({
                            cx: function(d){return xScale(d.x)},
                            cy: function(d){return yScale(d.y)},
                            r:  function(){return 4}
                        })
                        .attr('clip-path', 'url(#clip)');

                    // hover focus circle dot
                    var circle = graph.append('circle')
                        .attr('class', 'focus-circle')
                        .attr('opacity', 0)
                        .attr({
                            r: 6,
                            fill: 'purple'
                        });

                    bindOnZoomArr.push(onZoomFun(i, graph, xAxis, mainLine, line, yScale));
                    graphes.push(graph);
                    rects.push(rect);
                    circles.push(circle);
                    mainLines.push(mainLine);
                    yScales.push(yScale);
                }
            };

            var zoomBind = function()
            {
                /*
                 How to bind zoom event on multiple charts (zoom on one chart but affects multiple charts)

                 var zoom = d3.behavior.zoom()
                 .on('zoom.g1', onZoom)
                 .on('zoom.g2', onZoom);

                 // graph1, graph2 are chart groups
                 var graph1, graph2;
                 graph1.call(zoom);
                 graph2.call(zoom);

                 */
                var zoom = d3.behavior.zoom()
                    .x(xScale)
                    .scaleExtent([1, Infinity]);
                bindOnZoomArr.forEach(function(v, i)
                {
                    zoom.on('zoom.g'+i, v);
                });
                // after zoom.on('zoom') all ready, then call it.
                graphes.forEach(function(v)
                {
                    v.call(zoom);
                });
            };

            var mouseMoveBind = function()
            {
                rects.forEach(function(o, index)
                {
                    o.on('mousemove', mouseMoveFun)
                     .on('mouseout', mouseOutFun);
                });
            };


            var dealWithSelection = function(data, index)
            {
                /* todo: judge every data's length */
                /////////////////////
                // check every dataset data's length is the same
                //var testDataFirst = dataset[0].length;
                //dataset.forEach(function(v)
                //{
                //    var result = (testDataFirst === v.length);
                //    if (!result)
                //    {
                //        console.error("data's length not the same!");
                //        return result
                //    }
                //    return result;
                //});

                // Convert to result data model
                dataset = convertDataFormat(data);
                datasetLen = dataset.length;

                // Define main svg
                defineSvg.call(this);
                // Draw vertical line
                drawVerticalLine();
                // Define Common xScale & xAxis (x is common)
                defineCommonX();

                // Draw charts using data
                drawCharts();
                // Zoom binding
                zoomBind();
                // Mouse move binding
                mouseMoveBind();
            };
            //  Start here
            var originDataSelection = section;
            originDataSelection.each(dealWithSelection);
        };

        chart.width = function()
        {};
        chart.height = function()
        {};

        return chart;

    }
})();