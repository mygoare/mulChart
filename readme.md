### Example:

![example](http://trello-abc.stor.sinaapp.com/5424bc8f784b754b2e4bf303c0a2b1060e8d08e4687bd.gif)

### Why do this:

We already know that there are many chart libraries which all can make data visualize very well. But I think they all lack one good chart style about how to display multiple charts using the same X-axis.

These charts have common X-axis, but they have different Y-axis. So this will make problems. Because we can't control their Y-axis data scope, if one comes with the scope 100 to 1000, but another only 0 to 5. If you put these data into one chart to show, the 0 to 5 scope line nearly invisible.

Like in the example, the second chart have a max of 97 Y-axis and third chart only 4.2, if we put them in one chart, then the third chart will a little below the second chart line, and you can hard to see more detail (trend e.g.) of the third chart line.

So this is what I want to solve in this repository.

### Data model

Before start using the chart, you should organize your data which requested from server to the specific Data model, after that you can bind it to the plugin.
	
	var data =
    	{
        	category: 'date',   // or integer
        	x: [1, 3, 5, 7, 9, 11, 13, 15, 29], // x axis. probably timestamps (Date object each item)
        	y: 	// y axis
            	[
                	[2,3,4,3,34,5,6,3,2],
                	[2,3,4,3,34,5,6,3,2],
	                [2,3,4,3,34,5,6,3,2],
    	            [2,3,4,3,34,5,6,3,2]
        	    ],
	        alias: ['Light', 'Power', 'Battery', 'Temperature']  // each chart alias name
	        unit: []
    	}

### How to use:

	var myChart = mulChart.generate({
		bindto: '#element',
		data: data,
		size: {
			width: 800,
			height: 200
		},
		color: {
			pattern: ['green', 'yellow', 'gray', 'red']
		},
		alias: ['Light', 'Power', 'Battery', 'Temperature'],
		unit: []
	});		
	
You can get the value of each configure item:

	myChart.bindto();  // output '#element'
	myChart.data();
	myChart.size();  // output {width:800, height:200}
	myChart.color();
	
Or set value to them:

	myChart.bindto('#do');
	myChart.size({width: 600, height: 100});
	
After the value set, then you can redraw to update the chart:

	myChart.redraw();
		
### Redraw

You have two ways to redraw:

	myChart.redraw({
		bindto: '#do',
		data: testData,
		size: {
			width: 1000,
			height: 150
		},
		color: {
			pattern: []
		}
	});		
	
Or like writting d3:

	myChart
		.bindto('#do')
		.data(testData)
		.size({
			width: 1000,
			height: 150
		})
		.color({
			pattern: []
		})
		.redraw();

### To do list:

- [x] x轴为 时间 或 数字 显示
- [x] 添加 AMD , CommonJS支持
- [x] 每单个表格名称、单位、颜色标识
- [ ] 统一样式模版，便于创造出更多theme
- [x] brower install mul-chart
- [ ] node module (browerify)

### License
[MIT](http://opensource.org/licenses/MIT)

