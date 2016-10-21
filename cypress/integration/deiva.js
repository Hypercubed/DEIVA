/* global describe, before, it, cy, context */
/* eslint xo/filename-case: 0 */

describe('Project χ - DEIVA', () => {
  before(() => {
    cy.visit('/');
  });

  context('home', () => {
    it('should have a title', () => {
      cy.title().should('include', 'DEIVA');

      cy.get('#gene-select')
        .find('.ui-select-match > span')
          .should('have.length', 2);
    });

    it('should select two symbols', () => {
      cy.get('#gene-select')
        .find('.ui-select-match > span')
          .should('have.length', 2);
    });

    it('have an svg', () => {
      cy.get('#_scatter__chart svg')
        .should('have.attr', 'title', 'Bound vs unbound (DESeq2)');
    });

    it('have an 61 points', () => {
      cy.get('#_scatter__chart svg')
        .find('.point')
          .should('have.length', 61);
    });
  });
});
