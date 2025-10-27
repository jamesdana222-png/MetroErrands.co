describe('Navigation', () => {
  it('should navigate to main pages', () => {
    // Home page
    cy.visit('/');
    cy.get('nav').should('be.visible');
    
    // About page
    cy.contains('About').click();
    cy.url().should('include', '/about');
    
    // Services page
    cy.contains('Services').click();
    cy.url().should('include', '/services');
    
    // Contact page
    cy.contains('Contact').click();
    cy.url().should('include', '/contact');
  });

  it('should have working skip-to-content link', () => {
    cy.visit('/');
    cy.get('a[href="#main-content"]').focus().click();
    cy.focused().should('have.attr', 'id', 'main-content');
  });
});