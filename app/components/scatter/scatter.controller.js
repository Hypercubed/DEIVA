/* eslint max-lines: 0 */

import d3 from 'd3';

import crossfilter from 'crossfilter';
import _ from 'lodash';
import Clipboard from 'clipboard';

// import dp from 'common/services/datapackage/datapackage';

import steps from './intro.json!';
import hello from './intro.md!';
import thankYou from './intro-end.md!';

import ScatterChart from './scatter-chart';

const cellTemplate = `
<div class="ui-grid-cell-contents">
  <span ng-switch="COL_FIELD">
    <span ng-switch-when="NA">
      {{COL_FIELD}}
    </span>
    <span ng-switch-default>
      <a href ng-click="grid.appScope.main.pasteSymbols(COL_FIELD)">
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

steps[0].intro = hello;
steps[steps.length - 1].intro = thankYou;

// setup intro
const introOptions = {
  steps,
  showStepNumbers: false,
  exitOnOverlayClick: true,
  exitOnEsc: true
};

const sliderOpts = {
  showTicksValues: true,
  showTicks: true,
  enforceStep: false
};

controller.$inject = ['$scope', 'dataService', '$log', '$timeout', 'growl'];
function controller($scope, dataService, $log, $timeout, growl) {  // eslint-disable-line max-params
  const main = this;

  let isEdgeR = false;

  // chart
  const $chart = d3.select('#_scatter__chart');
  const colorScale = d3.scale.category10();

  const x = {
    MA: d => Math.log10(d.baseMean),
    Volcano: d => -Math.log10(d.pvalue || 1)
  };

  const xLabel = {
    MA: 'log10 baseMean',
    Volcano: '-log10 P-Value'
  };

  const chart = new ScatterChart({
    width: parseInt($chart.style('width'), 10),
    height: 530,
    margin: {top: 30, right: 100, bottom: 40, left: 40},
    highlightColor: colorScale
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

  // sliderOpt
  const fcAlphaSlider = {
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
  };

  const fcCutSlider = {
    ...sliderOpts,
    floor: 0,
    ceil: 5,
    step: 1,
    onEnd: updateChartData
  };

  const fdrCutSlider = {
    ...sliderOpts,
    floor: -5,
    ceil: 0,
    step: 1,
    onEnd: updateChartData // () => {
      // main.plotState.pcut = Math.pow(10, Number(main.plotState.logpcut));
      // updateChartData();
    // } // ,
    // translate: value => `1e${value}`
  };

  // debounced functions
  const δdrawChart = _.debounce(() => {
    $chart.selectAll('svg').remove();

    $chart.datum(main.dataState.data)
      .call(chart);

    $chart.classed('dirty', false);
  }, 100);

  const δupdateList = _.debounce(() => {
    $scope.$applyAsync(() => {
      updateList();
    });
  }, 100);

  const δchartAction = _.debounce(action => {
    $chart.classed('dirty', true);
    $scope.$applyAsync(() => {
      chart[action]();
      // updateList();
      $chart.classed('dirty', false);
    });
  }, 100);

  return Object.assign(main, {
    editorOptions: {
      data: main.dataPackage,
      enableOpen: false
    },
    gene: main.dataPackage.resources[0].data[0].gene,
    geneList: [],
    plotState: {
      // pcut: 0.1,
      fccut: 0,
      logpcut: -1,
      alpha: 0.8,
      plot: 'hex',
      plotType: 'MA',
      colorScale // maybe shouldn't be state
    },
    selectedData: main.dataPackage.resources[0].data[0],
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
    chart,
    $chart,
    updateList: δupdateList,
    fcAlphaSlider,
    fcCutSlider,
    fdrCutSlider,
    chartAction: δchartAction,
    $onInit: () => {
      chart.brush.on('brushend.select', δupdateList);
      loadDataset(main.dataPackage.resources[0].data[0]);
    }
  });

  function loadDataset(set) {
    dataService.loadResource(main.dataPackage, {
      title: set.name,
      path: set.filename,
      schema: main.dataPackage.schemas.deseq2oredgeR
    })
      .then(r => {
        if (r.$error) {
          $log.error(r);
          return $chart.classed('dirty', false);
        }
        main.dataPackage.resources[1] = r;
        main.gene = set.gene || set.symbols || '';
        change();
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
    const fccut = main.plotState.fccut;
    const cutoffCheck = d => d.padj <= pcut && (d.log2FoldChange > fccut || d.log2FoldChange < -fccut);

    const genesSearch = main.geneList.map(x => x.symbol);

    const geneCheck = d => {
      for (let i = 0; i < d.symbols.length; i++) {
        for (let j = 0; j < genesSearch.length; j++) {
          if (genesSearch[j] === d.symbols[i]) {
            return j;
          }
        }
      }
      return -1;
    };

    const d = main.dataState.data.filter(d => {  // update and filter by cutoff
      d.$cutoffCheck = cutoffCheck(d);
      d.highlight = geneCheck(d);
      d.$showPoint = d.highlight > -1;
      return d.$cutoffCheck;
    });

    const resource = main.dataPackage.resources[1];

    chart
      .x(x[main.plotState.plotType])
      .y(d => d.log2FoldChange || 0)
      .xLabel(xLabel[main.plotState.plotType])
      .yLabel('log2FoldChange')
      .title(resource.title || resource.name)
      .showScatter(main.plotState.plot === 'scatter')
      .showDensity(main.plotState.plot === 'hex')
      // .highlightFilter(geneCheck)
      .highlightDomain(genesSearch)
      .alpha(main.plotState.alpha)
      .width(parseInt($chart.style('width'), 10))
      // .cutoffFilter(cutoffCheck)
      ;

    // Update up/down count
    main.upDown[0] = d.filter(d => d.log2FoldChange > 0).length;
    main.upDown[1] = d.length - main.upDown[0];
  }

  function updateChartData() {
    $log.debug('update');
    $chart.classed('dirty', true);
    setupChart();
    δchartAction('updatePoints');
  }

  function change() {
    $log.debug('change');
    $chart.classed('dirty', true);
    $timeout(() => {
      processData();
      drawChart();
    });
  }

  function drawChart() {
    $log.debug('draw');
    $chart.classed('dirty', true);
    setupChart();
    δdrawChart();
  }

  function processData() {
    $log.debug('processData');
    const resource = main.dataPackage.resources[1];

    const sample = resource.data[0];

    isEdgeR = typeof sample.baseMean === 'undefined' && typeof sample.logCPM !== 'undefined';

    if (isEdgeR) {
      x.MA = d => d.logCPM;
      xLabel.MA = 'logCPM';
    } else {
      x.MA = d => Math.log10(d.baseMean);
      xLabel.MA = 'log10 baseMean';
    }

    const data = resource.data.filter(d => {
      d.pvalue = Number(d.pvalue) || Number(d.PValue);  // P-Value
      delete d.PValue;

      d.padj = Number(d.padj) || Number(d.FDR) || NaN;  // FDR
      delete d.FDR;

      if (isEdgeR) {
        d.baseMean = Math.pow(2, Number(d.logCPM)) || 0.001;
        d.logCPM = Number(d.logCPM);
      } else {
        d.baseMean = Number(d.baseMean) || 0.001;
      }

      d.log2FoldChange = Number(d.log2FoldChange) || Number(d.logFC) || 0;  // Log2 Fold Change
      delete d.logFC;

      d.symbol = d.symbol || d.feature;
      d.symbols = d.symbol.split(';');

      return d.baseMean > 0.001;
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

    const fullGeneList = [];

    data
      .forEach(x => {
        x.symbols.forEach(s => {
          fullGeneList.push(s);
        });
      });

    fullGeneList
      .sort();

    $log.debug('done getting unique symbols', fullGeneList.length);

    const uniqGeneMap = {};
    const uniqGeneList = [];
    fullGeneList.forEach(symbol => {
      const item = uniqGeneMap[symbol];
      if (item) {
        item.count++;
      } else {
        uniqGeneMap[symbol] = {
          symbol,
          count: 1
        };
        uniqGeneList.push(uniqGeneMap[symbol]);
      }
    });

    main.uniqGeneMap = uniqGeneMap;
    main.uniqGeneList = uniqGeneList;

    main.geneList = [];
    addSymbols(main.gene);
  }

  function addSymbols(list) {
    if (typeof list !== 'string' || list.length === 0) {
      return;
    }
    const missing = [];
    list.split(/[\s;]/).forEach(symbol => {
      const item = main.uniqGeneMap[symbol];
      if (item) {
        if (!main.geneList.includes(item)) {
          main.geneList.push(item);
        }
      } else {
        missing.push(symbol);
      }
    });
    if (missing.length > 0) {
      const msg = missing.join(', ');
      console.error('Genes not found', msg);
      growl.error(msg, {title: 'Genes not found'});
    }
  }

  function selectFile(file) {
    dropped(file);
  }

  function dropped(file) {
    $chart.classed('dirty', true);

    const mediatype = file.type || dataService.mime.lookup(file.name);

    const newResource = dataService.processResource({
      path: file.name || 'file',
      name: file.name || 'file',
      mediatype: (mediatype === 'text/plain') ? 'text/tab-separated-values' : mediatype,
      content: file.content || '',
      active: true,
      $error: false,
      $errors: [],
      schema: main.dataPackage.schemas.deseq2oredgeR
    });

    if (newResource.$error) {
      return $chart.classed('dirty', false);
    }

    main.dataPackage.resources[1] = newResource;

    main.selectedData = null;
    main.gene = '';
    main.geneList = [];

    main.change();
  }
}

export default controller;
