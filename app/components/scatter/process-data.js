'use strict';

function processData(data) {
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

self.onmessage = function (e) {
  // console.log('Message received from main script', e);
  self.postMessage(processData(e.data));
};

/* self.addEventListener('message', e => {
  const reply = {
    ready: true
  };
  console.log(e);
  if (e.data && e.data.length) {
    reply.data = processData(e.data);
  }
  self.postMessage(reply);
}, false); */
