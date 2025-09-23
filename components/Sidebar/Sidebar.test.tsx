import {Sidebar} from '@/components/Sidebar/Sidebar'
import {render, screen} from '@/test-utils'

vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual<any>('@mantine/hooks')
  return {
    ...actual,
    useMounted: () => true
  }
})

vi.mock('@/lib/hooks/useRemoveItemFromHistory', () => ({
  useRemoveItemFromHistory: () => ({remove: vi.fn()})
}))

vi.mock('@/lib/store/services/redditApi', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useGetPopularSubredditsQuery: () => ({data: []})
  }
})

vi.mock('@/lib/hooks/useHeaderState', () => ({
  useHeaderState: () => ({showNavbar: false, toggleNavbarHandler: vi.fn()})
}))

describe('Sidebar', () => {
  it('should render links', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', {name: 'Home'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Popular'})).toBeInTheDocument()
  })
})
