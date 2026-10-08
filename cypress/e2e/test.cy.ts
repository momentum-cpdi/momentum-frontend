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

  it('shows the API status from the backend', () => {
    cy.intercept('GET', '/api/health', { body: { status: 'UP', service: 'momentum-backend', timestamp: '2026-10-07T00:00:00Z' } })
    cy.intercept('GET', '/api/sports', { body: [{ id: 1, name: 'Football', code: 'FOOT', type: 'FOOTBALL', active: true }] })
    cy.visit('/')
    cy.get('[role=status]').should('contain.text', 'API connectée')
  })

  it('degrades gracefully when the backend is down', () => {
    cy.intercept('GET', '/api/**', { statusCode: 503, body: { status: 'unavailable' } })
    cy.visit('/')
    cy.get('[role=status]').should('contain.text', 'API indisponible')
    cy.contains('h1', 'Toute l')
  })
})
