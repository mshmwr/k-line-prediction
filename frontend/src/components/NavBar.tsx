import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/app">App</Link>
      <Link to="/about">About</Link>
      <Link to="/diary">Diary</Link>
      <Link to="/business-logic">Business Logic</Link>
    </nav>
  )
}
