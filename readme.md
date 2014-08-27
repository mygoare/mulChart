### Example:

![example](mulChart_example.png)

### How to use:

1. Call d3.mulChart

		var myChart = d3.mulChart();
		
2. Select the container & bind the data

		var containerSelection = d3.select('#container').datum(data);
		
3. Call and generate the chart

		containerSelection.call(myChart)
		
		
### Redraw

You can also redraw the chart like this:

		containerSelection.call(myChart.destroy().mainWidth(600).mainHeight(150));
		
Then every single chart will be 600px width & 150px height.		

### To do list:

*	<del>可让x轴为时间显示</del>
*	每单个表格的名称、单位、颜色标识
*	可自行通过修改 less 来改变 mulChart 的样式