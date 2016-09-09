/* eslint max-lines: 0 */
import d3 from 'd3';

import 'd3-plugins/hexbin/hexbin';

import d3Tip from 'd3-tip';
import 'd3-tip/examples/example-styles.css!';

import {moveToFront} from './chart.utils';
import './scatter-chart.css!';

export default function Scatter(opts = {}) {
  const margin = opts.margin || {top: 20, right: 20, bottom: 30, left: 40};
  let width = (opts.width || 1024) - margin.left - margin.right;
  const height = (opts.height || 500) - margin.top - margin.bottom;
  const title = opts.title || 'DEIVA';
  let alpha = 0.1;

  let showScatter = false;
  let showDensity = true;

  const xTickFormat = d3.format('g');
  const labelFormat = d3.format('1.3f');

  const xValue = d => (Number(d.baseMean) || 0.01); // data -> value
  const xScale = d3.scale.log().range([0, width]); // value -> display
  const xMap = d => xScale(xValue(d)); // data -> display
  const xAxis = d3.svg.axis().scale(xScale).orient('bottom').tickFormat(d => {
    const x = Math.log10(d) + 1e-6;
    return Math.abs(x - Math.floor(x)) < 0.1 ? xTickFormat(d) : '';
  });

  const yValue = d => Number(d.log2FoldChange) || 0; // data -> value
  const yScale = d3.scale.linear().range([height, 0]); // value -> display
  const yMap = d => yScale(yValue(d)); // data -> display
  const yAxis = d3.svg.axis().scale(yScale).orient('left'); // .tickFormat(yTickFormat);

  const highlightColor = opts.highlightColor || d3.scale.category10();

  let highlightFilter = () => false;
  let cutoffFilter = d => d.padj <= 0.05;

  const hsize = 4;

  const hexbin = d3.hexbin()
    .radius(hsize);

  const hexColor = d3.scale.linear()
    .domain([0, 1])   // fraction above cutoff
    .range(['black', 'red'])
    .interpolate(d3.interpolateLab);

  const hexOpacity = d3.scale.linear()
    .domain([0, 10])  // fraction above cutoff
    .range([0, 1])
    .clamp(true);

  const brush = scatter.brush = d3.svg.brush()
    .x(xScale)
    .y(yScale)
    .clamp(false);

  const tooltipHtml = d => `
    <p>
      ${d.symbol}
      </br />
      ${d.feature}
    </p>
    baseMean: ${labelFormat(d.baseMean)}<br />
    log2FoldChange: ${labelFormat(d.log2FoldChange)}<br />
    Adjusted p-value: ${labelFormat(d.padj)}`;

  const tooltips = d3Tip()
    .attr('class', 'd3-tip d3-tip-scatter animate')
    .html(tooltipHtml)
    .offset([-10, 0]);

  const zoom = d3.behavior.zoom()
    .x(xScale)
    .y(yScale)
    .scaleExtent([1, 10]);

  function scatter(selection) {
    selection.each(function (d) {
      const el = d3.select(this);

      const xExtent = d3.extent(d, xValue);
      const yExtent = d3.extent(d, yValue);

      xExtent[1] *= 2;
      xExtent[0] /= 2;

      const h = yExtent[1] - yExtent[0];

      yExtent[1] += h / 20;
      yExtent[0] -= h / 20;

      xScale.domain(xExtent).range([0, width]);
      yScale.domain(yExtent);

      zoom
        .x(xScale)
        .y(yScale)
        .on('zoom', zoomed);

      function panLimit() {
        // let tx = zoom.translate()[0];
        // let ty = zoom.translate()[1];
        const xmin = xExtent[0];
        const xmax = xExtent[1];

        const ymin = yExtent[0];
        const ymax = yExtent[1];

        if (xScale.domain()[0] < xmin) {
          zoom.translate([zoom.translate()[0] - xScale(xmin) + xScale.range()[0], zoom.translate()[1]]);
        } else if (xScale.domain()[1] > xmax) {
          zoom.translate([zoom.translate()[0] - xScale(xmax) + xScale.range()[1], zoom.translate()[1]]);
        }

        if (yScale.domain()[0] < ymin) {
          zoom.translate([zoom.translate()[0], zoom.translate()[1] - yScale(ymin) + yScale.range()[0]]);
        } else if (yScale.domain()[1] > ymax) {
          zoom.translate([zoom.translate()[0], zoom.translate()[1] - yScale(ymax) + yScale.range()[1]]);
        }

        // return [tx, ty];
      }

      el.selectAll('svg').remove();

      const svg = el.append('svg')
        .attr('title', title)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`)
            // .call(zoom)
          ;

      svg.append('clipPath')       // define a clip path
          .attr('id', 'rect-clip') // give the clipPath an ID
        .append('rect')          // shape it as an ellipse
          .attr('width', width)
          .attr('height', height);

      const container = svg.append('g');

      const clipped = container.append('g')
        .attr('clip-path', 'url(#rect-clip)');

      container.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .append('text')
        .attr('transform', 'rotate(0)')
        .attr('x', width)
        .attr('dy', '-.71em')
        .style('text-anchor', 'end')
        .text('baseMean');

      container.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('log2FoldChange');

      const hexagonG = clipped.append('g')
        .attr('class', 'hexagons')
        .style('opacity', alpha);

      clipped.append('g')
        .attr('class', 'brush')
        .call(brush);

      const pointsG = clipped.append('g')
        .attr('class', 'points');

      const midLine = container.append('line')
        .attr('class', 'mid-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0))
        .attr('stroke-dasharray', '10, 5')
        .style({
          'fill': 'none',
          'stroke': '#A3A3A3',
          'stroke-width': '1px',
          'shape-rendering': 'crispEdges'
        });

      clipped.select('.extent').on('dblclick', () => {
        xScale.domain(xExtent);
        yScale.domain(yExtent);
        zoomed();
      });

      hexbin
        .size([width, height]);

      if (showDensity) {
        updateDensity();
      }

      updatePoints();
      zoomPoints();

      svg.call(tooltips);

      scatter.updatePoints = updatePoints;
      scatter.zoomExtent = zoomToExtent;
      scatter.zoomOut = zoomOut;

      function zoomOut() {
        xScale.domain(xExtent);
        yScale.domain(yExtent);
        zoomed();
      }

      function zoomToExtent() {
        if (brush.empty()) {
          return;
        }

        // console.log(zoom.translate());
        // var x0, y0, x1, y1;
        const [[x0, y0], [x1, y1]] = brush.extent();

        // console.log('zoom', [x0, x1], [y0, y1]);

        xScale.domain([x0, x1]);
        yScale.domain([y0, y1]);

        svg.selectAll('.brush').call(brush.clear());

        //  zoom.translate([x0, y0]);
        //  zoom.scale([x1 - x0, y1 - y0]);
        zoomed();
      }

      function zoomed() {
        panLimit();

        container.select('g.x.axis').call(xAxis);
        container.select('g.y.axis').call(yAxis);

        midLine
          .attr('y1', yScale(0))
          .attr('y2', yScale(0));

        if (showDensity) {
          updateDensity();
        }
        zoomPoints();
      }

      function updateDensity() {
        const hexPath = hexbin
          .x(xMap)   // maps change on zoom, need to rebin
          .y(yMap)
          .hexagon(hsize);

        const hexagon = hexagonG
          .selectAll('path')
          .data(hexbin(d));

        hexagon.enter().append('path')
            .style('stroke-width', 1)
            .style('stroke', 'white')
            .style('stroke-opacity', 0.5)
            ;

        hexagon
            .attr('d', hexPath)
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .style('stroke', d => hexColor(d.filter(cutoffFilter).length / d.length))
            .style('fill', d => hexColor(d.filter(cutoffFilter).length / d.length))
            // .style('stroke-opacity', showScatter ? 0.2 : d => hexOpacity(d.length / 4))
            .style('fill-opacity', showScatter ? 0.2 : d => hexOpacity(d.length));

        hexagon.exit().remove();
      }

      function zoomPoints() {
        pointsG.selectAll('.point')
          .attr('transform', d => `translate(${xMap(d)},${yMap(d)})`);
      }

      function updatePoints() {
        hexagonG.style('opacity', alpha);

        const dd = d.filter(d => {
          d.highlight = highlightFilter(d);
          return showScatter || d.highlight > -1;
        });

        const points = pointsG.selectAll('.point')
            .data(dd);

        points.enter().append('circle')
            .attr('class', 'point')
              .attr('x', 0)
              .attr('y', 0)
              .style('cursor', 'pointer')
              .on('mouseover', tooltips.show)
              .on('mouseout', tooltips.hide);

        points.exit().remove();

        points
          .attr('transform', d => `translate(${xMap(d)},${yMap(d)})`)
          .each(function (d) {
            const e = d3.select(this);
            const highlight = d.highlight;

            if (highlight > -1) {
              e
                .style('opacity', 1)
                .attr('r', 4)
                .style('fill', highlightColor(highlight));

              moveToFront.call(this);
            } else {
              e
                .style('opacity', alpha)
                .attr('r', 2)
                .style('fill', cutoffFilter(d) ? 'red' : 'black');
            }
          });

        if (showDensity) {
          hexagonG
            .selectAll('path')
            .style('stroke', d => hexColor(d.filter(cutoffFilter).length / d.length))
            .style('fill', d => hexColor(d.filter(cutoffFilter).length / d.length));
        }
      }
    });
  }

  scatter.cutoffFilter = function (_) {
    if (arguments.length < 1) {
      return cutoffFilter;
    }
    cutoffFilter = _;
    return scatter;
  };

  scatter.highlightFilter = function (_) {
    if (arguments.length < 1) {
      return highlightFilter;
    }
    highlightFilter = _;
    return scatter;
  };

  scatter.showScatter = function (_) {
    if (arguments.length < 1) {
      return showScatter;
    }
    showScatter = _;
    return scatter;
  };

  scatter.showDensity = function (_) {
    if (arguments.length < 1) {
      return showDensity;
    }
    showDensity = _;
    return scatter;
  };

  scatter.width = function (_) {
    if (arguments.length < 1) {
      return width;
    }
    width = (_ || 1024) - margin.left - margin.right;
    return scatter;
  };

  scatter.alpha = function (_) {
    if (arguments.length < 1) {
      return alpha;
    }
    alpha = _;
    return scatter;
  };

  return scatter;
}
