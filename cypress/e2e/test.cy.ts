describe('App shell', () => {
  it('redirects the root url to Discover', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/discover')
    cy.get('ion-title').first().should('contain.text', 'Discover')
  })

  it('renders the swipe cards', () => {
    cy.visit('/')
    cy.get('.swipe-card').should('have.length.greaterThan', 0)
  })

  it('navigates between tabs', () => {
    cy.visit('/')
    cy.get('ion-tab-button[tab="listings"]').click()
    cy.location('pathname').should('eq', '/listings')
  })
})
