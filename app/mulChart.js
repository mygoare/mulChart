(function(window)
{
    var mulChart = {};

    mulChart.version = '0.1.5';

    mulChart.generate = function(config)
    {
        var d3 = window.d3 ? window.d3 : 'undefined' !== typeof require ? require("d3") : undefined;

        // params can control by outside
        var bindtoElement, data,
            size = {width: 960, height: 200},
            margin = {top: 20, right: 0, bottom: 20, left: 0},
            color =
            {
                // 60 colors from d3
                pattern: d3.scale.category20().range().concat(d3.scale.category20b().range(), d3.scale.category20c().range())
            },
            d3Selection,
            zoomTranslate = [0, 0],
            zoomScale = 1;

        var zoomCallback, zoomCallbackSetTimeout;

        var self;

        var xScaleWholedomain;

        var chart = function(selection)
        {
            // Data model
            /*
             Origin data sample:
             {
             category: 'date',   // or integer
             x: [1, 3, 5, 7, 9, 11, 13, 15, 29], // probably timestamps
             y: [
             [2,3,4,3,34,5,6,3,2],
             [2,3,4,3,34,5,6,3,2],
             [2,3,4,3,34,5,6,3,2],
             [2,3,4,3,34,5,6,3,2]
             ],
             alias: ['Light', 'Power', 'Pressure', 'Temperature'],
             unit:  ['kelvin', 'watt', 'hpa', 'celsius']
             }

             Result data sample:
             [
             [{x: 1, y: 2},{x: 3, y: 5},{x: 5, y: 23},{x: 7, y: 2},{x: 9, y: 2},{x: 11, y: 22},{x: 13, y: 132},{x: 15, y: 7},{x: 29, y: 7}],
             [{x: 1, y: 12},{x: 3, y: 15},{x: 5, y: 3},{x: 7, y: 21},{x: 9, y: 2},{x: 11, y: 22},{x: 13, y: 32},{x: 15, y: 71},{x: 29, y: 7}],
             [{x: 1, y: 22},{x: 3, y: 25},{x: 5, y: 33},{x: 7, y: 25},{x: 9, y: 2},{x: 11, y: 22},{x: 13, y: 32},{x: 15, y: 7},{x: 29, y: 7}],
             [{x: 1, y: 32},{x: 3, y: 35},{x: 5, y: 13},{x: 7, y: 29},{x: 9, y: 2},{x: 11, y: 22},{x: 13, y: 32},{x: 15, y: 98},{x: 29, y: 7}]
             ]
             */

            var width = size.width - margin.left - margin.right,
                height = size.height - margin.top - margin.bottom;

            var svg, tooltip, verticalLine;
            var tooltipWidth,
                tooltipHeight,
                tooltipMargin = {top: 20, right: 20, bottom: 20, left: 20};

            //  Dataset is the data after converted
            var originDataset, dataset, datasetLen;
            var xScale, xAxis;

            var scaleOffsetLeftBottom = 25,
                scaleOffsetRightTop   = 8;

            // actually chart title height uses martin.top's gap
            var chartTitleHeight = margin.top;

            // originDataset properties
            /*
             category: date, integer
             alias   : []
             unit    : []
             */
            var originDatasetCategory, originDatasetAlias, originDatasetUnit;

            var bindOnZoomArr = [], graphes = [], rects = [], circles = [], mainLines = [], yScales = [];

            var zoom;

            // Convert originData to resultData function
            var convertDataFormat = function()
            {
                var xData = originDataset.x,
                    yData = originDataset.y,
                    xDataLen = xData.length,
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
            //..........................................................................
            var defineSvg = function()
            {
                svg = d3.select(this)  // `this` is the html selection
                    .append('svg')
                    .attr('class', 'd3-chart')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', datasetLen * (height+margin.top+margin.bottom) - margin.bottom);  // hide the last margin.bottom area, don't want to show vertical line
            };
            //..........................................................................
            var drawBackgroundRect = function(bgColor)
            {
                var g = svg.append('g')
                    .attr('class', 'background-g')
                    .attr('transform', 'translate(0, 0)');

                for (var i = 0; i < datasetLen; i++)
                {
                    g.append('rect')
                        .attr('fill', bgColor)
                        .attr('width', width)
                        .attr('height', height)
                        .attr('transform', 'translate('+margin.left+','+ (margin.top + i * (height + margin.top + margin.bottom) ) +')');
                }
            };
            //..........................................................................
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
                    .attr('class', 'vertical-line');
            };
            //..........................................................................
            var defineCommonX = function()
            {
                if (originDatasetCategory == 'date')
                {
                    xScale = d3.time.scale()
                }
                else
                {
                    xScale = d3.scale.linear()
                }

                // x axis domain & range setting todo: when you redraw, xScaleWholedomain will not change any more, should be fixed in the future
                xScaleWholedomain = xScaleWholedomain ? xScaleWholedomain : d3.extent(originDataset.x, function(d){return d});
                xScale.domain(xScaleWholedomain).range([scaleOffsetLeftBottom, width - scaleOffsetRightTop]);
                xAxis = d3.svg.axis()
                    .tickSize(0)
                    .innerTickSize(6)
                    .scale(xScale)
                    .orient('top');
            };
            //..........................................................................
            var drawCharts = function()
            {
                for(var i = 0; i < datasetLen; i++)
                {
                    //..........................................................................
                    var graph, rect, circle, line, mainLine, yScale;

                    yScale = d3.scale.linear().domain(d3.extent(dataset[i], function(d){return d.y})).range([height - scaleOffsetLeftBottom, scaleOffsetRightTop]);

                    var g = svg.append('g')
                        .attr('class', 'g'+i+' d3-chart-g')
                        .attr('transform', 'translate('+margin.left+','+ (margin.top + i * (height + margin.top + margin.bottom) ) +')');

                    graph = d3.select(this)
                        .select('.g'+i);

                    //..........................................................................
                    var drawClipPath = function()
                    {
                        graph.append('clipPath')
                            .attr('id', 'clip')
                            .append('rect')
                            .attr('width', width)
                            .attr('height', height)
                            .attr('transform', 'translate(0, 0)')
                            .attr('fill', 'none');
                    };
                    //..........................................................................
                    var drawChartTitle = function()
                    {
                        // draw each chart title
                        svg.append('foreignObject')
                            .attr('width', width)
                            .attr('height', chartTitleHeight + 'px')
                            .attr('transform', 'translate('+margin.left+','+ (margin.top - chartTitleHeight + i * (height + margin.top + margin.bottom) ) +')')
                            .append('xhtml:body')
                            .style('background', 'transparent')
                            .html('<p style="line-height: '+chartTitleHeight+'px" class="chart-title"><span class="icon" style="background-color: '+color.pattern[i]+'"></span>'+(originDatasetAlias[i]?originDatasetAlias[i]: '') + '<span class="unit">'+ (originDatasetUnit[i]?originDatasetUnit[i]: '') +'</span></p>');
                    };
                    //..........................................................................
                    var drawXAxis = function()
                    {
                        // xAxis
                        graph.append('g')
                            .attr('class', 'xaxis')
                            .attr('transform', 'translate(0, '+ (height) +')')
                            .call(xAxis);
                    };
                    //..........................................................................
                    var drawYAxis = function()
                    {
                        // yAxis
                        var yAxis = d3.svg.axis()
                            .scale(yScale)
                            .tickSize(0)
                            .innerTickSize(8)
                            .orient('right');
                        graph.append('g')
                            .attr('class', 'yaxis')
                            .attr('transform', 'translate(0, 0)')
                            .call(yAxis);
                    };
                    //..........................................................................
                    var drawMainLine = function()
                    {
                        // line
                        line = d3.svg.line()
                            .x(function(d){return xScale(d.x)})
                            .y(function(d){return yScale(d.y)})
                            .interpolate('linear');
                        mainLine = graph.append('path')
                            .attr('d', line(dataset[i]))
                            .attr('stroke', color.pattern[i])
                            .attr('fill', 'none')
                            .attr('clip-path', 'url(#clip)');
                    };
                    //..........................................................................
                    var drawCircleDots = function()
                    {
                        // draw each chart circles
                        graph.selectAll('circle')
                            .data(dataset[i])
                            .enter()
                            .append('circle')
                            .attr('class', 'circle-dot')
                            .attr({
                                cx: function(d){return xScale(d.x)},
                                cy: function(d){return yScale(d.y)},
                                r:  function(){return 3}
                            })
                            .attr('clip-path', 'url(#clip)');
                    };
                    //..........................................................................
                    var drawFocusCircleDot = function()
                    {
                        // hover focus circle dot
                        circle = graph.append('circle')
                            .attr('class', 'focus-circle')
                            .attr('opacity', 0)
                            .attr({
                                r: 4,
                                fill: 'purple'
                            });
                    };
                    //..........................................................................
                    var drawMoveArea = function()
                    {
                        // transparent rect as move area
                        rect = graph.append('rect')
                            .attr('x', 0)
                            .attr('y', 0)
                            .attr('width', width)
                            .attr('height', height)
                            .attr('fill', 'transparent')
                            .attr('cursor', 'move');
                    };
                    //..........................................................................
                    var drawBorders = function()
                    {
                        // draw borders
                        var leftBorder = graph.append('line')
                            .attr('x1', 0 + 2)
                            .attr('y1', 0)
                            .attr('x2', 0 + 2)
                            .attr('y2', height)
                            .attr('stroke-width', 4)
                            .attr('stroke', '#b5b5b5');
                        var bottomBorder = graph.append('line')
                            .attr('x1', 0)
                            .attr('y1', height -1)
                            .attr('x2', width)
                            .attr('y2', height -1)
                            .attr('stroke-width', 4)
                            .attr('stroke', '#b5b5b5');
                        var rightBorder = graph.append('line')
                            .attr('x1', width - 1)
                            .attr('y1', 0)
                            .attr('x2', width - 1)
                            .attr('y2', height)
                            .attr('stroke-width', 2)
                            .attr('stroke', '#b5b5b5');
                    };
                    //..........................................................................

                    ////////////////////////////////////////////////////////////////////////////
                    drawClipPath();
                    drawChartTitle();
                    drawXAxis();
                    drawMainLine();
                    drawCircleDots();
                    drawFocusCircleDot();
                    drawYAxis();
                    drawMoveArea();
                    drawBorders();

                    zoom.on('zoom.g' +i, onZoomFun(i, graph, xAxis, mainLine, line, yScale));
                    graphes.push(graph);
                    rects.push(rect);
                    circles.push(circle);
                    mainLines.push(mainLine);
                    yScales.push(yScale);
                }
            };
            //..........................................................................
            var drawTooltip = function()
            {
                var htmlContainer = this;
                tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                htmlContainer.appendChild(tooltip);
            };
            //..........................................................................

            // Zoom binding function
            var onZoomFun = function(i, graph, xAxis, mainLine, line, yScale)
            {
                return function()
                {
                    var zoomCallbackTimer = 1000; // todo: need to set as a paramater
                    //..........................................................................
                    var setPanningLimit = function()
                    {
                        // panning limit
                        var s = zoom.scale() - 1,
                            t = zoom.translate(),
                            tx = t[0],
                            ty = t[1];

                        // referred to xScale's definition
                        tx = Math.min(tx, -s * scaleOffsetLeftBottom);
                        tx = Math.max(tx, -s * (width - scaleOffsetRightTop));

                        zoom.translate([tx, ty]);
                    };
                    //..........................................................................
                    var redrawXAxis = function()
                    {
                        // xaxis redraw
                        graph.select('.xaxis').call(xAxis);
                    };
                    //..........................................................................
                    var redrawMainLine = function()
                    {
                        // line redraw
                        line
                            .y(function(d, i){return yScale(d.y)});
                        mainLine.attr('d', line(dataset[i]));
                    };
                    //..........................................................................
                    var redrawCircleDots = function()
                    {
                        // circles redraw
                        graph.selectAll('circle.circle-dot')
                            .attr({
                                cx: function(d){return xScale(d.x)},
                                cy: function(d){return yScale(d.y)}
                            });
                    };
                    //..........................................................................
                    var onZoomCallback = function()
                    {
                        //run only once
                        if (i == datasetLen - 1)
                        {
                            clearTimeout(zoomCallbackSetTimeout);
                            zoomCallbackSetTimeout = setTimeout(zoomCallback.bind(self, xScale.domain(), zoom.translate(), zoom.scale()), zoomCallbackTimer); // self is the html dom element of chart wrapper
                        }
                    };

                    ////////////////////////////////////////////////////////////////////////////
                    setPanningLimit();
                    redrawXAxis();
                    redrawMainLine();
                    redrawCircleDots();
                    onZoomCallback();
                };
            };
            //..........................................................................

            // Mouse move binding function
            var onMouseMoveFun = function(index)
            {
                var self = this.node();
                var mouseX = d3.mouse(self)[0],
                    mouseY = d3.mouse(self)[1];
                var xAtDotValue,    // x value
                    yAtDotValues = [],
                    verticalLineX;

                var flag = true;
                ////////////////////////////////////////////////////////////////////////////

                // when mousemove, every chart calculates the correct dot point
                // dataset is the data after convert (convertDataFormat)
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
                    while (true)
                    {
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
                    var yAtDotValue;  // y value
                    var singleLineDataLength = singleLineData.length;

                    var getRightDotValue = function(prev, after)
                    {
                        if (prev === '')  // strict equal, because 0 == '' return true
                        {
                            xAtDotValue = singleLineData[after].x;
                            yAtDotValue = singleLineData[after].y;
                        }
                        else if (Math.abs(currentXValue - singleLineData[prev].x) <= Math.abs(currentXValue - (singleLineData[after].x)))
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

                    if (singleLineDataLength <= 20)   //  Linear search
                    {
                        singleLineData.forEach(function(data, index)
                        {
                            var low = index, high = index + 1;
                            try
                            {
                                if (currentXValue >= singleLineData[low].x && currentXValue <= singleLineData[high].x)
                                {
                                    getRightDotValue(low, high);
                                }
                            }
                            catch (e)
                            {
                                getRightDotValue('', singleLineDataLength - 1)
                            }

                        });
                    }
                    else    //  Binary search
                    {
                        var l = singleLineDataLength;
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

                    if (xScale(xAtDotValue) < 0 || xScale(xAtDotValue) > width)
                    {
                        flag = false;
                        return false;
                    }

                    // set the position
                    circle.attr('opacity', 1)
                        .attr('cx', xScale(xAtDotValue))
                        .attr('cy', yScales[i](yAtDotValue));
                    //  debug
                    //  console.log(xScale.invert(pos.x), yScales[i].invert(pos.y));

                    verticalLineX = xScale(xAtDotValue);

                    // console.log(xAtDotValue, yAtDotValue);
                    yAtDotValues.push(yAtDotValue);
                });

                if (flag)
                {
                    // set value on tooltip (xAtDotValue & yAtDotValue)
                    var tooltipTrs = '';
                    yAtDotValues.forEach(function(v, i)
                    {
                        var alias = originDatasetAlias[i] ? originDatasetAlias[i] : '';
                        var unit  = originDatasetUnit[i]  ? originDatasetUnit[i]  : '';

                        tooltipTrs += '<tr></tr><td><span style="background-color: '+color.pattern[i]+'"></span>'+alias+'</td><td>'+v+'</td><td>'+unit+'</td></tr>';
                    });
                    var table =
                        '<table>' +
                        '<tbody>' +
                        '<tr>' +
                        '<th colspan="2"></th>' +
                        '<th colspan="1"></th>' +
                        '</tr>' +
                        tooltipTrs +
                        '</tbody>' +
                        '</table>';
                    tooltip.innerHTML = table;
                    var tooltipThDate = tooltip.getElementsByTagName('th')[0];
                    var tooltipThTime = tooltip.getElementsByTagName('th')[1];
                    if (originDatasetCategory == 'date')
                    {
                        tooltipThDate.innerHTML = d3.time.format('%a %b %d %Y')(xAtDotValue);
                        tooltipThTime.innerHTML = d3.time.format('%H:%M:%S')(xAtDotValue);
                    }
                    else
                    {
                        tooltipThDate.innerHTML = xAtDotValue;
                    }


                    // set tooltip width & height
                    tooltipWidth = tooltip.offsetWidth;
                    tooltipHeight = tooltip.offsetHeight;

                    // set tooltip position
                    var tooltipX = verticalLineX + margin.left + tooltipMargin.left,
                        tooltipY = mouseY + margin.top  + tooltipMargin.top + index * (height + margin.top + margin.bottom),
                        svgWidth = svg.node().offsetWidth,
                        svgHeight = svg.node().offsetHeight;
                    if ((tooltipX + tooltipWidth + tooltipMargin.right) > svgWidth)
                    {
                        tooltipX = verticalLineX + margin.left - (tooltipWidth + tooltipMargin.right);
                    }
                    if ((tooltipY + tooltipHeight + tooltipMargin.top) > svgHeight)
                    {
                        tooltipY = mouseY + margin.top - (tooltipMargin.bottom + tooltipHeight) + index * (height + margin.top + margin.bottom);
                    }
                    tooltip.style.opacity = 0.9;
                    tooltip.style.left = tooltipX + 'px';
                    tooltip.style.top = tooltipY + 'px';


                    // set vertical line position
                    verticalLine
                        .attr('opacity', 1)
                        .attr('transform', function()
                        {
                            return 'translate('+(verticalLineX + margin.left)+')'
                        })
                }

            };
            //..........................................................................
            var onMouseOutFun = function()
            {
                //..........................................................................
                var setCircleOpacity = function(v, i)
                {
                    v.attr('opacity', 0);
                };
                ////////////////////////////////////////////////////////////////////////////
                verticalLine.attr('opacity', 0);
                circles.forEach(setCircleOpacity);
                tooltip.style.opacity = 0;
            };
            //..........................................................................
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
                // after zoom.on('zoom') all ready, then call it.
                // use rect1, rect2 is correct, graph can't call(zoom), it is a empty container
                var callZoom = function(v)
                {
                    v.call(zoom);
                };
                ////////////////////////////////////////////////////////////////////////////
                rects.forEach(callZoom);
            };
            //..........................................................................
            var mouseMoveBind = function()
            {
                //..........................................................................
                var bindMouseEvent = function(o ,index)
                {
                    o.on('mousemove', onMouseMoveFun.bind(o, index))
                        .on('mouseout', onMouseOutFun);
                };
                ////////////////////////////////////////////////////////////////////////////
                rects.forEach(bindMouseEvent);
            };
            //..........................................................................
            var processSelection = function(data, index)
            {
                // have a clone of origin data ready to use, DON'T change data by reference, be careful here.
                originDataset = clone(data);

                // validate x, y, category, alias, unit
                if (originDataset.x.length === 0 || originDataset.y.length === 0)
                {
                    self.innerHTML = 'Must have x and y data to draw the chart!';
                    return false;
                }
                originDatasetCategory      = originDataset.category ? originDataset.category : 'integer';
                originDatasetAlias         = originDataset.alias ? originDataset.alias : [];
                originDatasetUnit          = originDataset.unit ? originDataset.unit : [];

                // Convert to result data model
                dataset = convertDataFormat();
                datasetLen = dataset.length;

                // todo: generate chart line colors. Right now it is 29 specific colors
                // generateColors();

                // Define main svg
                defineSvg.call(this);
                // Draw background color for each chart group
                drawBackgroundRect('white');
                // Draw vertical line
                drawVerticalLine();

                // Define Common xScale & xAxis (x is common)
                defineCommonX();

                // Define zoom, then zoom will listen on 'zoom' event when drawCharts
                zoom = d3.behavior.zoom()
                    .x(xScale)
                    .scaleExtent([1, Infinity])
                    .translate(zoomTranslate)
                    .scale(zoomScale);

                // Draw charts using data
                drawCharts.call(this);
                drawTooltip.call(this);
                // Zoom binding
                zoomBind();
                // Mouse move binding
                mouseMoveBind();
            };
            //..........................................................................

            ////////////////////////////////////////////////////////////////////////////
            var originDataSelection = selection;
            self = originDataSelection.node();
            originDataSelection.node().style.position = 'relative';
            originDataSelection.each(processSelection);
        };

        // Properties:  bindto, data, size, color
        chart.bindto = function(element)
        {
            if (!arguments.length)
                return bindtoElement;

            if (element)
                bindtoElement = element;

            return chart;
        };
        chart.data = function(dataObj)
        {
            if (!arguments.length)
                return data;

            if (!!dataObj && typeof dataObj === 'object')
                data = dataObj;

            return chart;
        };
        chart.size = function(obj)
        {
            if (!arguments.length)
                return size;

            if (!!obj && typeof obj === 'object')
            {
                if (obj.width)
                {
                    size.width = obj.width
                }
                if (obj.height)
                {
                    size.height = obj.height
                }
            }

            return chart;
        };
        chart.color = function(obj)
        {
            if (!arguments.length)
                return color;

            if (!!obj && typeof obj === 'object')
            {
                if (obj.pattern)
                {
                    color.pattern = obj.pattern;
                }
            }

            return chart;
        };
        chart.zoomTranslate = function(arr)
        {
            if (!arguments.length)
                return zoomTranslate;

            if (Array.isArray(arr))
            {
                zoomTranslate = arr;
            }

            return chart;
        };
        chart.zoomScale = function(num)
        {
            if (!arguments.length)
                return zoomScale;

            // zoom can't less than 0
            if (num > 0)
            {
                zoomScale = num;
            }

            return chart;
        };

        chart.selection = function()
        {
            return d3Selection;
        };

        //
        chart.redraw = function(config)
        {
            if (!!config && typeof config === 'object')
            {
                if (config.bindto)
                {
                    this.bindto(config.bindto)
                }
                if (config.data)
                {
                    this.data(config.data)
                }
                if (config.size)
                {
                    this.size(config.size);
                }
                if (config.color)
                {
                    this.color(config.color);
                }
                if (config.zoomScale)
                {
                    zoomScale = config.zoomScale
                }
                if (config.zoomTranslate)
                {
                    zoomTranslate = config.zoomTranslate
                }
            }
            bindElementWithData(bindtoElement, data);

            this.destroy()
                .selection()
                .call(this);
        };
        chart.destroy = function()
        {
            self.innerHTML = '';
            return chart;
        };

        //..........................................................................
        // Methods
        //..........................................................................
        // clone object without reference
        // http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
        //..........................................................................
        function clone(obj)
        {
            var copy;

            // Handle the 3 simple types, and null or undefined
            if (null == obj || "object" != typeof obj) return obj;

            // Handle Date
            if (obj instanceof Date) {
                copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }

            // Handle Array
            if (obj instanceof Array) {
                copy = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    copy[i] = clone(obj[i]);
                }
                return copy;
            }

            // Handle Object
            if (obj instanceof Object) {
                copy = {};
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
                }
                return copy;
            }

            throw new Error("Unable to copy obj! Its type isn't supported.");
        }
        //..........................................................................
        function convertHtmlToDomElementObject(s)
        {
            var el = document.createElement('div');
            el.innerHTML = s;
            return el.childNodes[0];
        }
        //..........................................................................
        function bindElementWithData(bindto, data)
        {
            if (!!bindto && !!data && typeof data === 'object')
            {
                d3Selection = d3.select(bindto).datum(data);
            }
            else
            {
                console.error('bindto should not be empty and data should be object.');
                return;
            }
        }
        //..........................................................................

        ////////////////////////////////////////////////////////////////////////////
        if (!config)
        {
            console.error('Please set up configure.');
            return;
        }
        //..........................................................................
        if (config.bindto && config.data)
        {
            chart.bindto(config.bindto);
            chart.data(config.data);
        }
        if (config.size)
        {
            chart.size(config.size);
        }
        if (config.color)
        {
            chart.color(config.color);
        }
        if (config.zoomTranslate)
        {
            chart.zoomTranslate(config.zoomTranslate);
        }
        if (config.zoomScale)
        {
            chart.zoomScale(config.zoomScale);
        }

        if (config.zoomCallback)
        {
            zoomCallback = config.zoomCallback;
        }

        //..........................................................................
        bindElementWithData(bindtoElement, data);
        d3Selection.call(chart);

        return chart;

    };

    // AMD support
    if (typeof define === 'function' && define.amd)
    {
        define(['d3'], function(d3)
        {
            return mulChart;
        })
    }
    else
    {
        window.mulChart = mulChart;
    }

})(window);