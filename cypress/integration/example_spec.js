/* global describe, beforeEach, it, cy, context */
/* eslint xo/filename-case: 0 */

describe('Project χ - DEIVA', () => {
  context('home', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('cy.should - assert that <title> is correct', () => {
      cy.title().should('include', 'DEIVA');

      cy.get('#_scatter__chart svg')
        .should('have.attr', 'title', 'Bound vs unbound (DESeq2)');
    });
  });
});
