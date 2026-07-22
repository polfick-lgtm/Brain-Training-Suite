import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('routing applicazione', () => {
  it('mostra il catalogo giochi', () => {
    render(
      <MemoryRouter initialEntries={['/giochi']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'Giochi', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Torre di Hanoi/ }),
    ).toHaveAttribute('href', '/giochi/hanoi')
  })

  it('mostra una pagina 404 esplicita', () => {
    render(
      <MemoryRouter initialEntries={['/rotta-inesistente']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: 'Pagina non trovata' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Torna alla Home' }),
    ).toBeInTheDocument()
  })
})
