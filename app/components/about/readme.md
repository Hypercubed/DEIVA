# DEIVA: Interactive Visual Analysis of differential gene expression test results

## Interactive exploration of gene expression tests made easy

DEIVA (Differential Gene Expression Interactive Visual Analysis) is a web app to interactively identify and locate genes in a hexbin or scatter plot of DESeq2 or edgeR results.

The aim was to create a web app that meets user expectations and can be used without any knowledge of R, spreadsheets, or programming.

Using DEIVA, domain experts can examine the results of a differential gene expression test and immediately get answers to questions such as "What is the expression level of my genes of interest?", "How does expression of these genes differ between the two different states?", and can easily retrieve lists of genes just by brushing (highlighting) them.

While this could also be achieved using any spreadsheet program like Excel, LO Calc or Google Sheets, that process would be slow, cumbersome, and not intuitive.

DEIVA provides an interface where domain experts simply go to a URL and can immediately search for genes, retrieve genes, and filter results lists.

DEIVA visualization conceptualize and prototyped by Anton Kratz.

Project-χ implementation of DEIVA developed by Jayson Harshbarger with inspiration from DESeq2IVA (Shiny version) and significant input from Anton Kratz.

## Features

* **Select** an experiment from a drop-down list of datasets results.
* **Identify** genes by brushing.
* **Locate** genes by searching for their name. **Multiple genes can be located at the same time** (separated by a space), and are **automatically highlighted in different colors**
* **Search** for genes in the data table.
* **Zoom** using the toolbar to zoom into selected rectangle and to reset.
* **Filter** two different cut-off sliders which are linked by logical "and". Number of genes passing the filter, up and down, is shown.
* **Mobile device support**. The user interface adapts to desktop as well as mobile environment devices.
* **User data**.  Drag and drop formatted DGE files onto the plot area to view in DEIVA. (See [Preparing input data files](#preparing-input-data-files))

## Using the DEIVA web interface

The interface is self-explanatory and should be usable by anyone accustomed to a contemporary web app.  If you require further instructions use the "Show me" in the upper right of the user interface.

## Preparing input data files

The code provided here works out of the box with the example given. But DEIVA can easily be expanded and modified to your own project. In particular the input data file can be augmented by more columns encoding gene features of interest, and these features can be rendered in different styles in the plot.

You need at least one input data file, which is a slightly augmented output from either DESeq2 or edgeR.

Please keep in mind that neither DESeq2 nor edgeR have an "output format" as such, the exact format in which you write the resulting tables to disc depends on which function in R you use.

### DESeq2 flavor

The input file needs to have the following columns:

* feature
* symbol
* baseMean
* log2FoldChange
* pvalue
* padj

The header *does* contain an entry for the first column! In a not typical for DESeq2 analysis but required in this application.

DESeq2 does not have a standard output file format. Write the result of a differential expression test to a file with TAB or COMMA as the separator and no hyphens to delineate fields.  The file should be name appropriately (.tsv for tab separated, .csv for comma separated).

The DESeq2 output is augmented by one column: symbol. This contains a gene symbol associated with the feature (cluster, transcription initiation site) of interest. This column is searched for when locating genes. The feature column can not be used for this, because there is no one-to-one relationship between features and genes.

Example for a DEIVA input file:

|	feature |symbol	|baseMean	|log2FoldChange		|lfcSE		|stat		|pvalue		|padj|
|---	|---	|---		|---			|---		|---		|---		|--- |
| chr2\_246405441\_246405521\_+	| Grid | 1.64173845899039 | 0.899050240043084 | 4.76263324936837 | 0.188771671671825 | 0.850271775363256 | 0.925548049366256 |
| chr12\_54086426\_54086466\_+	| Pcp2 | 5.30160933550825 | 1.61745325417192 | 4.82390235826869 | 0.335299749879769 | 0.737398982387807 | 0.864181693747462 |
| chr7\_36876604\_36876766\_+	| n/a | 1.18273903072599 | -6.06413567391466 | 3.87533117153996 | 1.564804504567 | 0.117628755226941 | 0.585133009869474 |

**The symbol column is optional.**

**Columns may appear in any order.**

### edgeR flavor

When starting from edgeR output, the input file needs to have the following columns:

* feature
* logFC
* logCPM
* LR
* PValue
* FDR
* symbol

An alternative input format is also possible, this is especially useful when starting from edgeR files:

| feature |logFC   |logCPM  |LR      |PValue  |FDR     |symbol|
|---	|---	|---		|---			|---		|---			|--- |
| chr10_100486611_100486680_+     |-0.792817368178757      |6.15713415308089        |5.89498642469805        |0.0151840465950009      |0.0413077938423281      |Kcnj16|
| chr10_102389850_102389932_+     |0.971318236831185       |3.51479142943153        |2.31041232774695        |0.128509956456949       |0.233565642765819       |NA|
| chr10_102393454_102393460_+     |1.21869694330981        |3.74540666988435        |5.39366227820117        |0.020210011581406       |0.0523206275040398      |NA|

# About Project χ

This website was built using the [Project χ platform](https://github.com/Hypercubed/Project-chi). Project χ (pronounced project kai or /<abbr title="/ˈ/ primary stress follows">ˈ</abbr><abbr title="'k' in 'kind'">k</abbr><abbr title="/iː/ long 'e' in 'bead'">iː</abbr>/) is an modular open source visualization gallery toolkit built by Jayson Harshbarger at the [RIKEN Institute in Yokohama Japan](http://www.yokohama.riken.jp/english/).  It offers a template and toolset for building self-hosted data-centric visualization websites. Geared towards sharing of supplemental materials associated with scientific publications; Project χ allows visitors to interact with visualizations, download associated data and images, and even try the visualization with their own uploaded or publicly available datasets.  For developers the framework comes packaged with tools necessary for quickly integrating interactive visualizations using [d3.js](http://d3js.org/), [AngularJS](https://angularjs.org/), and [BioJS](http://biojs.io/). More information can be found [here](https://github.com/Hypercubed/Project-chi#readme).

# Contact

For more information please contact [J. Harshbarger](mailto:jayson.harshbarger@riken.jp)

## How to cite

TBD

## Acknowledgments

DEIVA visualization conceptualize and prototyped by Anton Kratz.

Project-χ implementation of DEIVA developed by Jayson  Harshbarger with inspiration from DESeq2IVA (Shiny version) and significant input from Anton Kratz.

This work was supported by a research grant from the Japanese Ministry of Education, Culture, Sports, Science and Technology (MEXT) to the RIKEN Center for Life Science Technologies.

## Source Code License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

Copyright (c) 2016 RIKEN, Japan.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.