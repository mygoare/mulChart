define(['d3', './mulChart'], function(d3, mulChart)
{
    var a = ["Jan 2000", "Feb 2000", "Mar 2000", "Apr 2000", "May 2000", "Jun 2000", "Jul 2000", "Aug 2000", "Sep 2000", "Oct 2000", "Nov 2000", "Dec 2000", "Jan 2001", "Feb 2001", "Mar 2001", "Apr 2001", "May 2001", "Jun 2001", "Jul 2001", "Aug 2001", "Sep 2001", "Oct 2001", "Nov 2001", "Dec 2001", "Jan 2002", "Feb 2002", "Mar 2002", "Apr 2002", "May 2002", "Jun 2002", "Jul 2002", "Aug 2002", "Sep 2002"];
    var b = [];

    a.forEach(function(v, i){b.push (d3.time.format('%b %Y').parse(v))});

    console.log(b);

    var data = {
        //  todo: category, alias, unit etc.
        category: 'date',
//        x: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 40, 51, 232], // probably timestamps
        x: b,
        y: [
            [42, 23, 26, 45, 34, 3, 41, 32, 112, 223, 26, 45, 34, 3, 41, 32, 112, 23, 26, 45, 34, 3, 41, 32, 2, 31, 6, 5, 34, 35, 14, 33, 21],
            [112, 14, 41, 26, 23, 31, 32, 23, 33, 3, 26, 45, 34, 41, 34, 2, 112, 5, 32, 42, 34, 35, 34, 3, 26, 3, 21, 6, 23, 45, 41, 32, 45],
            [23, 112, 26, 3, 112, 6, 31, 26, 32, 34, 35, 41, 32, 21, 5, 34, 3, 32, 45, 324, 42, 2, 45, 41, 45, 14, 23, 41, 26, 33, 23, 34, 3],
            [26, 145, 45, 6, 23, 41, 5, 32, 2, 34, 23, 34, 112, 21, 34, 32, 41, 3, 32, 31, 41, 45, 33, 26, 3, 35, 26, 14, 34, 23, 3, 112, 42]
        ],
        alias: ['Light', 'Power', 'Battery', 'temperature']
    };

    // Get chart fun
    console.log(d3, mulChart);
    var myChart = mulChart.generate();
    // Section with data
    // https://github.com/mbostock/d3/wiki/Selections#datum
    var exampleSelection = d3.select('#example').datum(data);
    // Call to bind & draw
    // https://github.com/mbostock/d3/wiki/Selections#call
    exampleSelection.call(myChart);

});