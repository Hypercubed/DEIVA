# DEIVA: Interactive Visual Analysis of differential gene expression test results

## Contents

1. [Interactive exploration of gene expression tests made easy](#interactive-exploration-of-gene-expression-tests-made-easy)

2. [Features](#features)

3. [Using the DEIVA web interface](#using-the-deiva-web-interface)

   * [User-defined custom colors for symbols](#user-defined-custom-colors-for-symbols)

   * [Features with more than one symbol assigned should be separated by semicolon to enable multi-find](#features-with-more-than-one-symbol-assigned-should-be-separated-by-semicolon-to-enable-multi-find)

4. [DEIVA input file format](#deiva-input-file-format)

   * [DESeq2 flavor](#deseq2-flavor)

   * [edgeR flavor](#edger-flavor)

   * [Detailed example on generating DESeq2 and edgeR-based input files](#detailed-example-on-generating-deseq2-and-edger-based-input-files)

5. [Deploying DEIVA with your own data](#deploying-deiva-with-your-own-data)

   * [Pre-built](#pre-built)

   * [Building from source](#building-from-source)

6. [About Project χ](#about-project-χ)

7. [Contact](#contact)

8. [How to cite](#how-to-cite)

9. [Acknowledgments](#acknowledgments)

10. [Source Code License](#source-code-license)

## Interactive exploration of gene expression tests made easy

DEIVA (Differential Gene Expression Interactive Visual Analysis) is a web app to interactively identify and locate genes in a hexbin or scatter plot of DESeq2 or edgeR results.

The aim was to create a web app that meets user expectations and can be used without any knowledge of R, spreadsheets, or programming.

Using DEIVA, domain experts can examine the results of a differential gene expression test and immediately get answers to questions such as "What is the expression level of my genes of interest?", "How does expression of these genes differ between the two different states?", and can easily retrieve lists of genes just by brushing (highlighting) them.

While this could also be achieved using any spreadsheet program like Excel, LO Calc or Google Sheets, that process would be slow, cumbersome, and not intuitive.

DEIVA provides an interface where domain experts simply go to a URL and can immediately search for genes, retrieve genes, and filter results lists.

## Features

* **Select** an experiment from a drop-down list of datasets results.
* **Identify** genes by brushing.
* **Locate** genes by searching for their name. **Multiple genes can be located at the same time** (separated by a space), and are **automatically highlighted in different colors**
* **Search** for genes in the data table.
* **Zoom** using the toolbar to zoom into selected rectangle and to reset.
* **Filter** two different cut-off sliders which are linked by logical "and". Number of genes passing the filter, up and down, is shown.
* **Mobile device support**. The user interface adapts to desktop as well as mobile environment devices.
* **User data**.  Drag and drop formatted DGE files onto the plot area to view in DEIVA. (See [DEIVA input file format](#deiva-input-file-format))

## Using the DEIVA web interface

The interface is self-explanatory and should be usable by anyone accustomed to a contemporary web app. If you require further instructions use the "Show me" in the upper right of the user interface.

### User-defined custom colors for symbols

After searching and finding a symbol through the search box, the symbol appears as a label in the search box. Within this label, there is a counter which indicates how many features have been found and highlighted in the plot with this symbol. The counter has the same color as the symbol in the plot and the legend. Within the counter is a small down-arrow. Clicking on this arrow opens a color choose dialog. This enables the user to define a custom color for any symbol. The colors are remebered for each symbol. For example, if the user finds a symbol, changes the color, deletes the symbol, and finally finds the symbol again, the last color assigned to this symbol is remembered.

### Features with more than one symbol assigned should be separated by semicolon to enable multi-find

Symbols can also be found by clicking the symbol name in the table. If a feature is associated with two or more symbols separated by semicolons, all symbols added to search box as separate labels. The color assigned to the first symbol in the list is used for highlighting the respective feature. For example, a feature might be associated with the symbol "Kif1b;Cort". This means it belongs to the gene "Kif1b" as well as "Cort". When clicking on the symbol annotation "Kif1b;Cort" in the table, both gene symbols will be added to the search box as separate entities. Features annotated with "Kif1b" or "Cort" will be highlighted. Features annotated with multiple symbols including "Kif1b" or "Cort" (for example "Kif1b;Cort") will be highlighted separatedly in the same color as the first symbol in the compound string (in this case the color of Kif1b).

## DEIVA input file format

DEIVA accepts input files in two different input formats. Both input file formats are simple ASCII files containing a certain number of columns, either all tab- or comma-separated. Additional columns can be added as the user sees fit and are included in the table and can therefore be searched and sorted by, but have no effect on plot rendering. We refer to the two possible input file formats as the "DESeq2 flavour" and the "edgeR flavour". This alludes to the fact that these input file formats can be generated most easily when the differential gene expression test has been done with DESeq2 or edgeR respectively. However, DEIVA is on no way specific to DESeq2 or edgeR; the reason why the input file formats of DEIVA are designed in a way to ease working with these two packages is entirely for convenience and because we assume that DESeq2 and edgeR are maybe the most popular packages for differential gene expression testing.

Please keep in mind that neither DESeq2 nor edgeR have an "output format" as such, the exact format in which you write the resulting tables to disk depends on which function in R you use.

The number of required columns are six for the DESeq2 flavour and seven for the edgeR flavour.

### DESeq2 flavor

The input file needs to have the following columns:

* feature
* symbol
* baseMean
* log2FoldChange
* pvalue
* padj

The header *does* contain an entry for the first column! Typically, when wrinting a data frame from R, containing the result of a DESeq2 analysis, a user might omit the first entry and keep the first column unnamed - however it is required in this application.

DESeq2 does not have a standard output file format. Write the result of a differential expression test to a file with TAB or COMMA as the separator and no hyphens to delineate fields.  The file should be name appropriately (.tsv for tab separated, .csv for comma separated).

The DESeq2 output is augmented by one column: `symbol`. This contains a symbol (or symbols separated by semicolons) associated with the feature (cluster, transcription initiation site) of interest. These symbols are searched for when using the "Locate symbol" feature. The feature column can not be used for this, because there is no one-to-one relationship between features and symbols. A feature can be associated multiple times with the same symbol (or even list of symbols).

The `symbol` column will typically contain gene names or gene symbols associated with the respective feature, but can contain any annnotation desired (cluster names, protein identifiers...).

Example for a DEIVA input file:

|	feature |symbol	|baseMean	|log2FoldChange		|lfcSE		|stat		|pvalue		|padj|
|---	|---	|---		|---			|---		|---		|---		|--- |
| chr2\_246405441\_246405521\_+	| Grid | 1.64173845899039 | 0.899050240043084 | 4.76263324936837 | 0.188771671671825 | 0.850271775363256 | 0.925548049366256 |
| chr12\_54086426\_54086466\_+	| Pcp2 | 5.30160933550825 | 1.61745325417192 | 4.82390235826869 | 0.335299749879769 | 0.737398982387807 | 0.864181693747462 |
| chr7\_36876604\_36876766\_+	| n/a | 1.18273903072599 | -6.06413567391466 | 3.87533117153996 | 1.564804504567 | 0.117628755226941 | 0.585133009869474 |

**The symbol column is optional.**

**Columns may appear in any order.**

**Multiple symbols in the symbol column must be separated by semicolons.**

### edgeR flavor

An alternative input format is also possible, this is especially useful when starting from edgeR files. Here the input file needs to have the following columns:

* feature
* logFC
* logCPM
* LR
* PValue
* FDR
* symbol

Example:

| feature |logFC   |logCPM  |LR      |PValue  |FDR     |symbol|
|---	|---	|---		|---			|---		|---			|--- |
| chr10\_100486611\_100486680\_+     |-0.792817368178757      |6.15713415308089        |5.89498642469805        |0.0151840465950009      |0.0413077938423281      |Kcnj16|
| chr10\_102389850\_102389932\_+     |0.971318236831185       |3.51479142943153        |2.31041232774695        |0.128509956456949       |0.233565642765819       |NA|
| chr10\_102393454\_102393460\_+     |1.21869694330981        |3.74540666988435        |5.39366227820117        |0.020210011581406       |0.0523206275040398      |NA|

### Detailed example on generating DESeq2 and edgeR-based input files

See this git repository, describing how the example input files for DEIVA have been generated:

[antonkratz/genome-research-edgeR-DESeq2](https://github.com/antonkratz/genome-research-edgeR-DESeq2.git)

# Deploying DEIVA with your own data

## Pre-built

DEIVA may be used with custom data without modification to the source code.  Download the [gh-pages branch Zip file](https://github.com/Hypercubed/DEIVA/archive/gh-pages.zip) and replace the files in the `data/` with your data.  (See [Preparing input data files](##preparing-input-data-files)).  You will also need to modify the `datapackage.json` to reference the initial data file to load in DEIVA and the `index.tsv` file to contain a list of additional data files available in the interface (see example [here](https://github.com/Hypercubed/DEIVA/tree/gh-pages/data)).

## Building from source

DEIVA was developed using the [Project χ toolkit](https://github.com/Hypercubed/Project-chi).  If you are not familiar with Project-χ please see [here](https://github.com/Hypercubed/Project-chi#readme).  To utilize Project χ You should be familiar with [JSPM](http://jspm.io/), [SystemJS](https://github.com/systemjs/systemjs), and [Gulp](http://gulpjs.com/).

```sh
git clone https://github.com/Hypercubed/Project-Chi.git
cd Project-Chi
git checkout tags/v1.0.0-rc.13  # ensure you are using the same version of Project χ
npm install # jspm install is run post-install by npm
git clone https://github.com/Hypercubed/DEIVA.git dataset/DEIVA
```

Now add your data to the `./dataset/DEIVA/app/data` directory (see example [here](https://github.com/Hypercubed/DEIVA/tree/gh-pages/data)).  Alternatively you may download data from [antonkratz/genome-research-edgeR-DESeq2](https://github.com/antonkratz/genome-research-edgeR-DESeq2):

```sh
svn checkout https://github.com/antonkratz/genome-research-edgeR-DESeq2/trunk/annotated
mv annotated/* dataset/DEIVA/app/data/
rm -rf annotated/
```

Start the development server:

```sh
gulp dev --dataset=./dataset/DEIVA/
# navigate to http://localhost:9000
```

# About Project χ

This website was built using the [Project χ platform](https://github.com/Hypercubed/Project-chi). Project χ (pronounced project kai or /<abbr title="/ˈ/ primary stress follows">ˈ</abbr><abbr title="'k' in 'kind'">k</abbr><abbr title="/iː/ long 'e' in 'bead'">iː</abbr>/) is an modular open source visualization gallery toolkit built by Jayson Harshbarger at the [RIKEN Institute in Yokohama Japan](http://www.yokohama.riken.jp/english/).  It offers a template and toolset for building self-hosted data-centric visualization websites. Geared towards sharing of supplemental materials associated with scientific publications; Project χ allows visitors to interact with visualizations, download associated data and images, and even try the visualization with their own uploaded or publicly available datasets.  For developers the framework comes packaged with tools necessary for quickly integrating interactive visualizations using [d3.js](http://d3js.org/), [AngularJS](https://angularjs.org/), and [BioJS](http://biojs.io/). More information can be found [here](https://github.com/Hypercubed/Project-chi#readme).

# Contact

For more information please contact [J. Harshbarger](mailto:jayson.harshbarger@riken.jp)

## How to cite

TBD

## Acknowledgments

DEIVA visualization conceptualized and prototyped by Anton Kratz.

Project-χ implementation of DEIVA developed by Jayson  Harshbarger with inspiration from DESeq2IVA (Shiny version) and significant input from Anton Kratz.

This work was supported by a research grant from the Japanese Ministry of Education, Culture, Sports, Science and Technology (MEXT) to the RIKEN Center for Life Science Technologies.

## Source Code License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

Copyright (c) 2016 RIKEN, Japan.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
