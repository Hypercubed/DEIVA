/* eslint max-lines: 0 */

import d3 from 'd3';

import crossfilter from 'crossfilter';
import _ from 'lodash';
import Clipboard from 'clipboard';

import {transaction} from 'mobx';

import {introOptions} from '../intro/index';

// import dp from 'common/services/datapackage/datapackage';

/* import steps from './intro.json!';
import hello from './intro.md!';
import thankYou from './intro-end.md!'; */

import ScatterChart from './scatter-chart';

// useStrict(true);

const cellTemplate = `
<div class="ui-grid-cell-contents">
  <span ng-switch="COL_FIELD">
    <span ng-switch-when="NA">
      {{COL_FIELD}}
    </span>
    <span ng-switch-default>
      <a href ng-click="grid.appScope.$ctrl.toggleSymbols(COL_FIELD)">
        {{COL_FIELD}}
      </a>
    </span>
  </span>
</div>`;

// grid
const columnDefs = [
  {name: 'feature'},
  {name: 'symbol', cellTemplate},
  {name: 'baseMean', displayName: 'Base Mean', type: 'number', cellFilter: 'number', enableFiltering: false},
  {name: 'log2FoldChange', displayName: 'Log2 Fold Change', type: 'number', cellFilter: 'number', enableFiltering: false},
  {name: 'pvalue', displayName: 'P-Value', type: 'number', cellFilter: 'number', enableFiltering: false},
  {name: 'padj', displayName: 'FDR', type: 'number', cellFilter: 'number', sort: {direction: 'asc'}, enableFiltering: false}
];

const gridOptions = {
  columnDefs,
  enableFiltering: true,
  enableRowSelection: false,
  enableSelectAll: false,
  selectionRowHeaderWidth: 35,
  enableFullRowSelection: true,
  enableRowHeaderSelection: false,
  enableColumnResizing: true,
  rowHeight: 25,
  showGridFooter: false,
  multiSelect: false,
  enableColumnMenus: false,
  noUnselect: true,
  enableGridMenu: true,
  exporterMenuCsv: true,
  exporterMenuPdf: false,
  exporterCsvFilename: 'selection.csv',
  exporterMenuAllData: false
};

/* steps[0].intro = hello;
steps[steps.length - 1].intro = thankYou;

// setup intro
const introOptions = {
  steps,
  showStepNumbers: false,
  exitOnOverlayClick: true,
  exitOnEsc: true
}; */

const sliderOpts = {
  showTicksValues: true,
  showTicks: true,
  enforceStep: false
};

function persistantColorStore(defaultColorScale) {
  defaultColorScale = defaultColorScale || d3.scale.category10();

  const map = Object.create(null);

  return Object.freeze({
    scale,
    map
  });

  function scale(id) {
    const color = map[id] || defaultColorScale(id);
    map[id] = color;
    return color;
  }
}

controller.$inject = ['$scope', 'dataService', '$log', '$timeout', 'growl'];
function controller($scope, dataService, $log, $timeout, growl) {  // eslint-disable-line max-params
  const main = this;

  let isEdgeR = false;

  // chart
  const $container = d3.select('#_scatter__chart');
  const colorScale = persistantColorStore(d3.scale.category10());
  const highlightColor = d3.scale.ordinal();

  const x = {
    MA: d => Math.log10(d.baseMean),
    Volcano: d => -Math.log10(d.pvalue || 1)
  };

  const xLabel = {
    MA: 'log10 baseMean',
    Volcano: '-log10 P-Value'
  };

  const chart = new ScatterChart({
    width: parseInt($container.style('width'), 10),
    height: 530,
    margin: {top: 30, right: 100, bottom: 40, left: 40},
    highlightColor: colorScale.scale
  });

  // clipboard
  const clipboard = new Clipboard('#clipboard-btn', {
    text: () => main.geneList.map(x => x.symbol).join(' ')
  });

  clipboard.on('error', () => {
    prompt( // eslint-disable-line no-alert
      'This browser does not suppport copying directly to clipboard.  Copy this text instead.',
      main.geneList.map(x => x.symbol).join(' ')
    );
  });

  const sliders = {
    alpha: {
      showTicksValues: false,
      showTicks: false,
      enforceStep: false,
      floor: 0,
      ceil: 1,
      step: 0.01,
      precision: 2,
      onEnd: updateChartData,
      translate: (value, sliderId, label) => {
        switch (label) {
          case 'model':
            return `Opacity: ${value}`;
          default:
            return value;
        }
      }
    },
    fccut: {
      ...sliderOpts,
      floor: 0,
      ceil: 5,
      step: 1,
      onEnd: updateChartData
    },
    logpcut: {
      ...sliderOpts,
      floor: -5,
      ceil: 0,
      step: 1,
      onEnd: updateChartData
    },
    bmcut: {
      ...sliderOpts,
      floor: -5,
      ceil: 5,
      step: 1,
      onEnd: updateChartData
    }
  };

  // debounced functions
  const δdrawChart = _.debounce(() => {
    $container.selectAll('svg').remove();

    $container.select('.chart').datum(main.dataState.data)
      .call(chart);

    $container.classed('dirty', false);
  }, 30);

  const δupdateList = _.debounce(() => {
    $scope.$applyAsync(() => {
      updateList();
    });
  }, 30);

  const δchartAction = _.debounce(action => {
    $container.classed('dirty', true);
    $scope.$applyAsync(() => {
      chart[action]();
      // updateList();
      $container.classed('dirty', false);
    });
  }, 30);

  const dataPackage = main.dataPackage;
  const resources = dataPackage.resources.slice();
  const experimentList = resources[0].data;

  return Object.assign(main, {
    resources,
    experimentList,
    editorOptions: {
      data: dataPackage,
      enableOpen: false
    },
    gene: experimentList[0].gene,
    selectedData: experimentList[0],
    geneList: [],
    colorMap: colorScale.map,
    uiState: {
      dataset: true,
      locate: true,
      filters: true,
      plot: true,
      fccut: true,
      logpcut: true,
      bmcut: true
    },
    plotState: {
      // pcut: 0.1,
      fccut: 0,
      bmcut: -5,
      logpcut: -1,
      alpha: 0.8,
      plot: 'hex',
      plotType: 'MA'
    },
    xLabel,
    upDown: [0, 0],
    // colorScale,
    dataState: {},
    introOptions,
    dropped,
    selectFile,
    gridOptions,
    draw: drawChart,
    update: updateChartData,
    change,
    loadDataset,
    pasteSymbols: list => {
      addSymbols(list);
      updateChartData();
    },
    toggleSymbols: sym => {
      addSymbols(sym, true);
      updateChartData();
    },
    chart,
    $container,
    updateList: δupdateList,
    /* fcAlphaSlider,
    fcCutSlider,
    fdrCutSlider,
    bmCutSlider, */
    sliders,
    chartAction: δchartAction,
    $onInit: () => {
      // set UI state
      // TODO: load from local storage?
      Object.assign(main.uiState, {
        dataset: true,
        locate: true,
        filters: true,
        plot: true,
        fccut: true,
        logpcut: true,
        bmcut: true
      });

      chart.brush.on('brushend.select', δupdateList);
      return loadDataset(experimentList[0]);
    }
  });

  function loadDataset(set) {
    $container.classed('dirty', true);

    return transaction(() => {
      return dataService.loadResource(dataPackage, {
        name: set.name,
        title: set.name,
        path: set.filename,
        data: [],
        content: '' // ,
        // schema: dataPackage.schemas.deseq2oredgeR
      })
        .then(r => {
          if (r.$error) {
            $log.error(r);
            return $container.classed('dirty', false);
          }
          if (dataPackage.resources.length > 1) {
            dataPackage.resources.pop().stop();
          }
          dataPackage.resources.push(r);

          main.resources = dataPackage.resources.slice();

          main.gene = set.gene || set.symbols || '';
          main.geneList = [];
          return change(r.data);
        });
    });
  }

  function updateList() {
    $log.debug('update list');

    const xFilter = (isEdgeR) ? main.dataState.byLogCPM : main.dataState.byBaseMean;
    const yFilter = main.dataState.byLog2FoldChange;
    const pFilter = main.dataState.byPvalue;

    if (chart.brush.empty()) {
      xFilter.filterAll();
      pFilter.filterAll();
      yFilter.filterAll();
    } else {
      const extent = chart.brush.extent();

      if (main.plotState.plotType === 'MA') {
        if (!isEdgeR) {
          extent[0][0] = Math.pow(10, extent[0][0]);
          extent[1][0] = Math.pow(10, extent[1][0]);
        }
        pFilter.filterAll();
        xFilter.filterRange([extent[0][0], extent[1][0]]);
      } else {
        extent[0][0] = Math.pow(10, -extent[0][0]);
        extent[1][0] = Math.pow(10, -extent[1][0]);
        xFilter.filterAll();
        pFilter.filterRange([extent[1][0], extent[0][0]]);
      }
      yFilter.filterRange([extent[0][1], extent[1][1]]);
    }
    main.gridOptions.data = yFilter.top(Infinity);
  }

  function setupChart() {
    if (!main.dataState.data) {
      return;  // not sure why I need this.
    }

    const pcut = Math.pow(10, Number(main.plotState.logpcut));
    const fccut = Number(main.plotState.fccut);

    let cutoffCheck;
    if (isEdgeR) {
      const bmcut = Number(main.plotState.bmcut);
      cutoffCheck = d =>
        d.padj <= pcut &&
        d.logCPM > bmcut &&
        (d.log2FoldChange > fccut || d.log2FoldChange < -fccut);
    } else {
      const bmcut = Math.pow(10, Number(main.plotState.bmcut));
      cutoffCheck = d =>
        d.padj <= pcut &&
        d.baseMean > bmcut &&
        (d.log2FoldChange > fccut || d.log2FoldChange < -fccut);
    }

    // List of symbols to highlight
    const symbolDomain = main.geneList.map(x => x.symbol);

    highlightColor
      .domain(symbolDomain)
      .range(symbolDomain.map(colorScale.scale));

    // update and filter by cutoff
    const d = main.dataState.data.filter(d => {
      d.$cutoffCheck = cutoffCheck(d);
      d.highlight = symbolDomain.find(symbol => d.symbols.includes(symbol));  // gene to highlight
      return d.$cutoffCheck;
    });

    const resource = dataPackage.resources[1];
    const plotType = main.plotState.plotType;
    const width = parseInt($container.style('width'), 10);

    chart
      .x(x[plotType])
      .y(d => d.log2FoldChange || 0)
      .xLabel(xLabel[plotType])
      .yLabel('log2FoldChange')
      .title(resource.title || resource.name)
      .showScatter(main.plotState.plot === 'scatter')
      .showDensity(main.plotState.plot === 'hex')
      .highlightColor(highlightColor)
      .alpha(main.plotState.alpha)
      .width(width);

    // Update up/down count
    main.upDown[0] = d.filter(d => d.log2FoldChange > 0).length;
    main.upDown[1] = d.length - main.upDown[0];
  }

  function change(data) {
    $log.debug('change');
    $container.classed('dirty', true);
    data = data || main.resources[1].data;
    isEdgeR = typeof data.logCPM !== 'undefined';

    // console.time('processDataWorker');
    // worker.postMessage(data);

    return $timeout(() => {
      // console.time('processData');
      data = processData(data);
      // console.timeEnd('processData');
      setupUI(data);
      setupChart();
      δdrawChart();
    }, 10);
  }

  function drawChart() {
    $log.debug('draw');
    $container.classed('dirty', true);
    setupChart();
    δdrawChart();
  }

  function updateChartData() {
    $log.debug('update');
    $container.classed('dirty', true);
    setupChart();
    δchartAction('updatePoints');
  }

  function setupUI(data) {
    $log.debug('sutupUI');

    const resource = dataPackage.resources[1];

    // Here we modify the x value and x-asix label if the file type is edgeR
    if (isEdgeR) {
      x.MA = d => d.logCPM;
      xLabel.MA = 'logCPM';
    } else {
      x.MA = d => Math.log10(d.baseMean);
      xLabel.MA = 'log10 baseMean';
    }

    const xExtent = d3.extent(data, x.MA);
    xExtent[0] = Math.floor(xExtent[0]);
    xExtent[1] = Math.ceil(xExtent[1]);

    sliders.bmcut.floor = xExtent[0];
    sliders.bmcut.ciel = xExtent[1];

    Object.assign(main.plotState, {
      fccut: 0,
      bmcut: xExtent[0],
      logpcut: -1,
      alpha: 0.8,
      plot: 'hex',
      plotType: 'MA'
    });

    const ignoredKeys = [
      'pvalue',
      'padj',
      'baseMean',
      'logCPM',
      'log2FoldChange',
      'symbols',
      'symbol',
      'feature'
    ];

    if (data.length < 1) {
      growl.error(`Failed to find any features in ${resource.name}`);
      return;
    }

    // new data, new cross filter
    const cf = crossfilter(data);

    main.dataState = {};

    main.dataState.byPvalue = cf.dimension(d => d.pvalue)
      .filterAll();

    if (isEdgeR) {
      main.dataState.byLogCPM = cf.dimension(d => d.logCPM)
        .filterAll();
    } else {
      main.dataState.byBaseMean = cf.dimension(d => d.baseMean)
        .filterAll();
    }

    main.dataState.byLog2FoldChange = cf.dimension(d => d.log2FoldChange)
      .filterAll();

    main.gridOptions.data = main.dataState.data = main.dataState.byLog2FoldChange.top(Infinity);
    main.gridOptions.columnDefs = columnDefs.slice();

    // switch baseMean for logCPM in table
    if (isEdgeR) {
      main.gridOptions.columnDefs[2] = {
        name: 'logCPM',
        displayName: 'log2 CPM',
        type: 'number',
        cellFilter: 'number',
        enableFiltering: false
      };
    }

    // add other fields to table
    Object.keys(data[0]).forEach(key => {
      if (!ignoredKeys.includes(key)) {
        main.gridOptions.columnDefs.push({name: key, displayName: key, visible: false});
      }
    });

    $log.debug('getting unique symbols');

    // const fullGeneList = _.flatMap(data, d => d.symbols).sort();

    /* data
      .forEach(d => {
        d.symbols.forEach(s => {
          fullGeneList.push(s);
        });
      }); */

    // fullGeneList.sort();

    const uniqGeneMap = Object.create(null);
    _.flatMap(data, d => d.symbols)
      .sort()
      .forEach(symbol => {
        const item = uniqGeneMap[symbol] || (uniqGeneMap[symbol] = {symbol, count: 0});
        item.count++;
      });

    main.uniqGeneMap = uniqGeneMap;
    main.uniqGeneList = Object.values(uniqGeneMap);

    $log.debug('done getting unique symbols', main.uniqGeneList.length);

    main.geneList = [];
    return addSymbols(main.gene);
  }

  function processData(data) {
    $log.debug('processData');
    return data.filter(d => {
      // ID	Gene_Symbol	baseMean	log2FoldChange	pvalue	padj
      d.pvalue = Number(d.pvalue) || Number(d.PValue);  // P-Value
      delete d.PValue;

      d.padj = Number(d.padj) || Number(d.FDR) || NaN;  // FDR
      delete d.FDR;

      if (typeof d.logCPM === 'undefined') {
        d.baseMean = Number(d.baseMean) || NaN;
      } else {
        d.baseMean = Math.pow(2, Number(d.logCPM)) || NaN;
        d.logCPM = Number(d.logCPM);
      }

      d.log2FoldChange = Number(d.log2FoldChange) || Number(d.logFC) || 0;  // Log2 Fold Change
      delete d.logFC;

      d.feature = d.feature || d.ID;
      delete d.ID;

      d.symbol = d.symbol || d.Gene_Symbol || d.feature;
      delete d.Gene_Symbol;

      d.symbols = d.symbol.split(';');

      return !isNaN(d.baseMean); // d.baseMean > 0.001;
    });
  }

  function addSymbols(list, toggle = false) {
    if (typeof list !== 'string' || list.length === 0) {
      return;
    }
    const arr = main.geneList;
    const missing = [];
    list.split(/[\s;]/).forEach(symbol => {
      const item = main.uniqGeneMap[symbol];
      if (item) {
        const index = arr.indexOf(item);
        if (index > -1) {
          if (toggle) {
            arr.splice(index, 1);
            item.selected = false;
          }
        } else {
          arr.push(item);
          item.selected = true;
          colorScale.scale(item.symbol); // set color
        }
      } else {
        missing.push(symbol);
      }
    });
    if (missing.length > 0) {
      const msg = missing.join(', ');
      $log.error('Symbols not found', msg);
      growl.error(msg, {title: 'Symbols not found'});
    }
  }

  function selectFile(file) {
    dropped(file);
  }

  function dropped(file) {
    $container.classed('dirty', true);

    const mediatype = file.type || dataService.mime.lookup(file.name);

    const newResource = dataPackage.resources[1];
    transaction(() => {
      Object.assign(newResource, {
        path: file.name || 'file',
        name: file.name || 'file',
        mediatype: (mediatype === 'text/plain') ? 'text/tab-separated-values' : mediatype,
        schema: dataPackage.schemas.deseq2oredgeR,
        content: file.content || ''
      });
    });

    if (newResource.$error) {
      return $container.classed('dirty', false);
    }

    // dataPackage.resources[1] = newResource;

    main.selectedData = null;
    main.gene = '';
    main.geneList = [];

    change(newResource.data);
  }
}

export default controller;
