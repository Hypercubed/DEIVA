/* eslint max-lines: 0 */
import d3 from 'd3';
import {legend} from 'd3-svg-legend';

import 'd3-plugins/hexbin/hexbin';

import tip from 'd3-tip';
import 'd3-tip/examples/example-styles.css!';

import {moveToFront} from './chart.utils';
import './scatter-chart.css!';

export default function Scatter(opts = {}) {
  const margin = opts.margin || {top: 20, right: 20, bottom: 30, left: 40};

  let width = (opts.width || 1024) - margin.left - margin.right;
  let height = (opts.height || 500) - margin.top - margin.bottom;

  const title = opts.title || 'DEIVA';
  let alpha = 0.1;

  let showScatter = false;
  let showDensity = true;

  // const xTickFormat = d3.format('g');
  const labelFormat = d3.format('1.3f');
  const expFormat = d3.format('.0e');
  // const superscript = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  /* const formatPower = d => {
    const x = Math.abs(d);
    const sgn = (x > 0) ? '' : '-';
    return sgn + String(x).split('').map(c => superscript[c]).join('');
  }; */
  // const powerOfTen = d => Math.abs(d) / Math.pow(10, Math.ceil(Math.log10(Math.abs(d)) - 1e-12)) === 1;

  let xValue = opts.xValue || (d => Number(d.baseMean) || 0.01); // data -> value
  let xLabel = opts.xLabel || 'baseMean';
  const xScale = d3.scale.linear().range([0, width]).nice(); // value -> display
  const xMap = d => xScale(xValue(d)); // data -> display
  const xAxis = d3.svg.axis().scale(xScale).orient('bottom'); // .tickFormat(null);

  let yValue = opts.yValue || (d => Number(d.log2FoldChange) || 0); // data -> value
  let yLabel = opts.yLabel || 'log2FoldChange';
  const yScale = d3.scale.linear().range([height, 0]); // value -> display
  const yMap = d => yScale(yValue(d)); // data -> display
  const yAxis = d3.svg.axis().scale(yScale).orient('left'); // .tickFormat(yTickFormat);

  const highlightColor = opts.highlightColor || d3.scale.category10();

  // const highlightFilter = d => d.highlight;
  let highlightDomain = highlightColor.domain();
  // const cutoffFilter = d => d.$cutoffCheck;

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
      <br />
      ${d.feature}
    </p>
    baseMean: ${labelFormat(d.baseMean)}<br />
    log2FoldChange: ${labelFormat(d.log2FoldChange)}<br />
    P-Value:  ${expFormat(d.pvalue)}<br />
    FDR: ${expFormat(d.padj)}`;

  const tooltip = tip()
    .attr('class', 'd3-tip d3-tip-scatter' + (showScatter ? '' : ' animate'))
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

      xExtent[0] = Math.floor(xExtent[0]);
      xExtent[1] = Math.ceil(xExtent[1]);

      const h = yExtent[1] - yExtent[0];

      yExtent[1] += h / 20;
      yExtent[0] -= h / 20;

      xScale.domain(xExtent).range([0, width]);
      yScale.domain(yExtent);

      const zoomHistory = [];

      let hd = null;

      zoom
        .x(xScale)
        .y(yScale)
        .on('zoom', zoomed);

      el.selectAll('svg').remove();

      const svg = el.append('svg')
        .attr('class', showScatter ? 'scatter' : 'hexbin')
        .attr('title', title)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

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
          // .style('text-anchor', 'end')
          .text(xLabel);

      container.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        // .style('text-anchor', 'end')
        .text(yLabel);

      const hexagonG = clipped.append('g')
        .attr('class', 'hexagons')
        .style('opacity', alpha);

      const $brush = clipped.append('g')
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
        .attr('stroke-dasharray', '10, 5');

      container.append('g')
        .attr('class', 'legendOrdinal')
        .attr('transform', `translate(${width + 10},10)`);

      const legendOrdinal = legend.color()
        .shape('circle')
        .shapePadding(10)
        .shapeRadius(5)
        .scale(highlightColor);

      hexbin
        .size([width, height]);

      tooltip.attr('class', 'd3-tip d3-tip-scatter n' + (showScatter ? '' : ' animate'));
      svg.call(tooltip);

      scatter.updatePoints = update;
      scatter.zoomExtent = zoomToExtent;
      scatter.zoomIn = zoomIn;
      scatter.zoomOut = zoomOut;
      scatter.zoomHome = zoomHome;

      return draw();

      function draw() {
        if (showDensity) {
          drawDensity();
        }
        return update();
      }

      function update() {
        if (showDensity) {
          updateDensityColor();
        }
        return drawPoints();
      }

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

      function zoomTo(x, y) {
        xScale.domain(x);
        yScale.domain(y);
        $brush
          .call(brush.clear())
          .call(brush.event);
        zoomed();
      }

      function zoomHome() {
        zoomHistory.splice(0, zoomHistory.length);
        return zoomTo(xExtent, yExtent);
      }

      function zoomToExtent() {
        if (brush.empty()) {
          return;
        }
        const xd = xScale.domain();
        const yd = yScale.domain();
        zoomHistory.push([[xd[0], xd[1]], [yd[0], yd[1]]]);
        [[xd[0], yd[0]], [xd[1], yd[1]]] = brush.extent();
        return zoomTo(xd, yd);
      }

      function zoomIn() {
        const xd = xScale.domain();
        const yd = yScale.domain();
        zoomHistory.push([[xd[0], xd[1]], [yd[0], yd[1]]]);

        // [xd[0], xd[1]] = xd.map(Math.log);
        const dx = (xd[1] - xd[0]) / 4;
        const dy = (yd[1] - yd[0]) / 4;
        xd[0] += dx;
        xd[1] -= dx;
        yd[0] += dy;
        yd[1] -= dy;
        // [xd[0], xd[1]] = xd.map(Math.exp);

        return zoomTo(xd, yd);
      }

      function zoomOut() {
        const z = (zoomHistory.length === 0) ? [xExtent, yExtent] : zoomHistory.pop();
        return zoomTo.apply(this, z);
      }

      function zoomed() {
        panLimit();

        container.select('g.x.axis').call(xAxis);
        container.select('g.y.axis').call(yAxis);

        midLine
          .attr('y1', yScale(0))
          .attr('y2', yScale(0));

        if (showDensity) {
          drawDensity();
          updateDensityColor();
        }
        updatePointsPosition();
      }

      function drawDensity() {
        const hexPath = hexbin
          .x(xMap)   // maps change on zoom, need to rebin
          .y(yMap)
          .hexagon(hsize);

        hd = hexbin(d);

        const hexagon = hexagonG
          .selectAll('path')
          .data(hd);

        hexagon.enter().append('path')
            // .style('stroke-width', 1)
            // .style('stroke', 'white')
            // .style('stroke-opacity', 0.5)
            ;

        hexagon
            .attr('d', hexPath)
            .attr('transform', d => `translate(${d.x},${d.y})`)
            // .style('stroke', d => hexColor(d.filter(cutoffFilter).length / d.length))
            // .style('fill', d => hexColor(d.filter(cutoffFilter).length / d.length))
            // .style('stroke-opacity', showScatter ? 0.2 : d => hexOpacity(d.length / 4))
            // .style('fill-opacity', showScatter ? 0.2 : d => hexOpacity(d.length))
            ;

        hexagon.exit().remove();
      }

      function updateDensityColor() {
        hexagonG.style('opacity', alpha);

        hd.forEach(d => {
          const len = d.length;
          d.color = hexColor(d.filter(d => d.$cutoffCheck).length / len);
          d.opacity = showScatter ? 0.2 : hexOpacity(len);
        });

        hexagonG
          .selectAll('path')
          .style('stroke', d => d.color)
          .style('fill', d => d.color)
          .style('fill-opacity', d => d.opacity);
      }

      function drawPoints() {
        const ordinal = d3.scale.ordinal()
          .domain(highlightDomain)
          .range(highlightColor.range());

        legendOrdinal
          .scale(ordinal);

        container.select('.legendOrdinal')
          .call(legendOrdinal);

        const dd = showScatter ? d : d.filter(d => d.$showPoint);

        /* const dd = d.filter(d => {
          d.highlight = highlightFilter(d);
          return showScatter || d.highlight > -1;
        }); */

        const points = pointsG.selectAll('.point')
            .data(dd);

        points.enter().append('circle')
            .attr('class', 'point')
            .attr('x', 0)
            .attr('y', 0)
            // .style('cursor', 'pointer')
            .on('mouseover', tooltip.show)
            .on('mouseout', tooltip.hide);

        points.exit().remove();

        points
          .attr('class', d => d.$showPoint ? 'point highlight' : 'point')
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
              const stroke = d.$cutoffCheck ? 'red' : 'black';
              const fill = isNaN(d.padj) ? 'white' : stroke;
              e
                .style('opacity', alpha)
                .attr('r', 2)
                .style('stroke', stroke)
                .style('fill', fill);
            }
          });
      }

      function updatePointsPosition() {
        pointsG.selectAll('.point')
          .attr('transform', d => `translate(${xMap(d)},${yMap(d)})`);
      }
    });
  }

  scatter.x = function (_) {
    if (arguments.length < 1) {
      return xValue;
    }
    xValue = _;
    return scatter;
  };

  scatter.y = function (_) {
    if (arguments.length < 1) {
      return yValue;
    }
    yValue = _;
    return scatter;
  };

  scatter.xLabel = function (_) {
    if (arguments.length < 1) {
      return xLabel;
    }
    xLabel = _;
    return scatter;
  };

  scatter.yLabel = function (_) {
    if (arguments.length < 1) {
      return yLabel;
    }
    yLabel = _;
    return scatter;
  };

  /* scatter.cutoffFilter = function (_) {
    if (arguments.length < 1) {
      return cutoffFilter;
    }
    cutoffFilter = _;
    return scatter;
  }; */

  /* scatter.highlightFilter = function (_) {
    if (arguments.length < 1) {
      return highlightFilter;
    }
    highlightFilter = _;
    return scatter;
  }; */

  scatter.highlightDomain = function (_) {
    if (arguments.length < 1) {
      return highlightDomain;
    }
    highlightDomain = _;
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

  scatter.height = function (_) {
    if (arguments.length < 1) {
      return height;
    }
    height = (_ || 500) - margin.left - margin.right;
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
