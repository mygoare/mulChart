var data = [3, 6, 2, 7, 5, 2, 0, 3, 18];
var data1 = [2, 5, 39, 3, 6, 3, 6, 2, 7];

var margin = {top: 20, right: 10, bottom: 30, left: 30},
    width = 960 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

var xScale = d3.scale.linear().domain([0, data.length - 1]).range([0, width]);

var yScale = d3.scale.linear().domain([0, d3.max(data)]).range([height, 0]);
var yScale1 = d3.scale.linear().domain([0, d3.max(data1)]).range([height, 0]);

//
var svg = d3.select('#example')
    .append('svg')
    .attr('class', 'd3-chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', 2 * (height + margin.top + margin.bottom));

// vertical line
var verticalLine = svg.append('line')
    .attr({
        'x1': 0,
        'y1': 0,
        'x2': 0,
        'y2': 2 * (height + margin.top + margin.bottom)
    })
    .attr('class', 'vertical-line')
    .attr('stroke', 'gray');

var g = svg.append('g')
    .attr('class', 'g d3-chart-g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
var g1 = svg.append('g')
    .attr('class', 'g1 d3-chart-g')
    .attr('transform', 'translate(' + margin.left + ',' + (height + margin.top + margin.bottom + margin.top) + ')');

// common xAxis
var xAxis = d3.svg.axis()
    .scale(xScale);
// g
var graph = d3.select('.g');
graph.append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width + margin.right)
    .attr('height', height + margin.top)
    .attr('transform', 'translate(0, ' + (-margin.top) + ')')
    .attr('fill', 'none');
graph.append('g')
    .attr('class', 'xaxis')
    .attr('transform', 'translate(0, ' + (height) + ')')
    .call(xAxis);
var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left');
graph.append('g')
    .attr('class', 'yaxis')
    .attr('transform', 'translate(0, 0)')
    .call(yAxis);
var line = d3.svg.line()
    .x(function (d, i) {
        return xScale(i)
    })
    .y(function (d) {
        return yScale(d)
    })
    .interpolate('step');
var mainLine = graph.append('path')
    .attr('d', line(data))
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

// g1
var graph1 = d3.select('.g1');
graph1.append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width + margin.right)
    .attr('height', height + margin.top)
    .attr('transform', 'translate(0, ' + (-margin.top) + ')')
    .attr('fill', 'none');
graph1.append('g')
    .attr('class', 'xaxis1')
    .attr('transform', 'translate(0, ' + height + ')')
    .call(xAxis);
var yAxis1 = d3.svg.axis()
    .scale(yScale1)
    .orient('left');
graph1.append('g')
    .attr('class', 'yaxis1')
    .attr('transform', 'translate(0, 0)')
    .call(yAxis1);
var line1 = d3.svg.line()
    .x(function (d, i) {
        return xScale(i)
    })
    .y(function (d) {
        return yScale1(d)
    })
    .interpolate('step');
var mainLine1 = graph1.append('path')
    .attr('d', line1(data1))
    .attr('stroke', 'green')
    .attr('fill', 'none')
    .attr('clip-path', 'url(#clip)');
var rect1 = graph1.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'white')
    .attr('fill', 'transparent')
    .attr('cursor', 'move');

// zoom
var onZoom = function () {
    graph.select('.xaxis').call(xAxis);
    mainLine.attr('d', line(data));

    graph.selectAll('circle.circle-dot')
        .attr({
            cx: function (d, i) {
                return xScale(i)
            },
            cy: function (d) {
                return yScale(d)
            }
        });
};
var onZoom1 = function () {
    graph1.select('.xaxis1').call(xAxis);
    mainLine1.attr('d', line1(data1));

    graph1.selectAll('circle.circle-dot')
        .attr({
            cx: function (d, i) {
                return xScale(i)
            },
            cy: function (d) {
                return yScale1(d)
            }
        });
};
var zoom = d3.behavior.zoom()
    .on('zoom.graph', onZoom)
    .on('zoom.graph1', onZoom1)
    .x(xScale)
    .scaleExtent([1, Infinity]);
graph.call(zoom);
graph1.call(zoom);


// when mouse move
var mouseMoveFun = function () {
    var mouseX = d3.mouse(this)[0];

    var pathLength = mainLine.node().getTotalLength();
    var pointToCheck = 0,
        increment,
        pos;
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
    circle.attr('opacity', 1)
        .attr('cx', pos.x)
        .attr('cy', pos.y);


    // set vertical line position
    d3.select('.vertical-line')
        .attr('transform', function () {
            return 'translate(' + (pos.x + margin.left) + ', 0)'
        });
};
[rect, rect1].forEach(function (o) {
    o.on('mousemove', mouseMoveFun);
});

// draw each value circles
graph.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'circle-dot')
    .attr({
        cx: function (d, i) {
            return xScale(i)
        },
        cy: function (d) {
            return yScale(d)
        },
        r: function () {
            return 4
        }
    })
    .attr('clip-path', 'url(#clip)');
graph1.selectAll('circle')
    .data(data1)
    .enter()
    .append('circle')
    .attr('class', 'circle-dot')
    .attr({
        cx: function (d, i) {
            return xScale(i)
        },
        cy: function (d) {
            return yScale1(d)
        },
        r: function () {
            return 4
        }
    })
    .attr('clip-path', 'url(#clip)');

// hover focus circle dot
var circle = graph.append('circle')
    .attr('opacity', 0)
    .attr({
        r: 6,
        fill: 'purple'
    });
var circle1 = graph1.append('circle')
    .attr('opacity', 0)
    .attr({
        r: 6,
        fill: 'purple'
    });
