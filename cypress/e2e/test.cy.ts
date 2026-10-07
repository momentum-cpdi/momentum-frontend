describe('Momentum sports dashboard', () => {
  it('shows the dashboard and filters live scores by sport', () => {
    cy.visit('/')
    cy.contains('h1', 'Toute l’émotion')
    cy.contains('Scores de démonstration')

    cy.contains('.nav-link', 'Matchs').click()
    cy.contains('h1', 'Tous les matchs')
    cy.contains('.filter-chip', 'Basketball').click()
    cy.get('.matches-grid article').should('have.length', 2)

    cy.viewport(390, 844)
    cy.get('.mobile-nav').should('be.visible').contains('button', 'Classements').click()
    cy.contains('h1', 'Classements')
  })
})