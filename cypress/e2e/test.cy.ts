describe('App shell', () => {
  it('redirects the root url to the first tab', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/tab1')
    cy.get('ion-title').first().should('contain.text', 'Find Friends')
  })

  it('renders the swipe cards', () => {
    cy.visit('/')
    cy.get('.swipe-card').should('have.length.greaterThan', 0)
  })

  it('navigates between tabs', () => {
    cy.visit('/')
    cy.get('ion-tab-button[tab="tab2"]').click()
    cy.location('pathname').should('eq', '/tab2')
  })
})
