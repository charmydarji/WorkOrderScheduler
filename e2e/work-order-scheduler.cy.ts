/// <reference types="cypress" />

describe('Work Order Scheduler', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
    cy.get('[role="grid"]', { timeout: 5000 }).should('be.visible');
  });

  it('should display the timeline grid', () => {
    cy.get('.grid').should('be.visible');
    cy.get('.leftRow').should('have.length.greaterThan', 0);
  });

  it('should display work order bars on timeline', () => {
    cy.get('.bar').first({ timeout: 5000 }).should('be.visible');
  });

  it('should show options menu when clicking bar menu button', () => {
    cy.get('.bar').first().trigger('mouseenter');
    cy.get('.options-btn').first().should('be.visible');
    cy.get('.options-btn').first().click();
    cy.get('.options-menu').should('be.visible');
  });

  it('should switch timescale view', () => {
    cy.get('.ng-select-container').click();
    cy.get('.ng-option').first().click();
    cy.get('.col').should('be.visible');
  });

  it('should display work centers in grid', () => {
    cy.get('.leftHeader').should('contain', 'Work Center');
    cy.get('.leftRow').each(($row: JQuery<HTMLElement>) => {
      cy.wrap($row).should('not.be.empty');
    });
  });

  it('should have navigation header', () => {
    cy.get('.main-header').should('be.visible');
    cy.get('.title').should('contain', 'Work Orders');
  });

  it('should have today button', () => {
    cy.get('button').contains('Today').should('be.visible');
  });
});
