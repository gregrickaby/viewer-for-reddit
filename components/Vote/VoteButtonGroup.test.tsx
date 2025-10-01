import {VoteButtonGroup} from '@/components/Vote/VoteButtonGroup'
import {render, screen} from '@/test-utils'
import {waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const voteMock = vi.fn()

vi.mock('@/lib/store/services/voteApi', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/store/services/voteApi')
  >('@/lib/store/services/voteApi')
  return {
    ...actual,
    useVoteMutation: () => [voteMock, {isLoading: false}]
  }
})

const {signInMock, useSessionMock} = vi.hoisted(() => ({
  signInMock: vi.fn(),
  useSessionMock: vi.fn()
}))

vi.mock('next-auth/react', async () => {
  const actual =
    await vi.importActual<typeof import('next-auth/react')>('next-auth/react')
  return {
    ...actual,
    useSession: useSessionMock,
    signIn: signInMock,
    signOut: vi.fn()
  }
})

describe('VoteButtonGroup', () => {
  beforeEach(async () => {
    voteMock.mockReset()
    voteMock.mockReturnValue({
      unwrap: () => Promise.resolve({success: true})
    })
    signInMock.mockReset()
    useSessionMock.mockReset()
    useSessionMock.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })
  })

  it('should prompt sign in when user is unauthenticated', async () => {
    render(<VoteButtonGroup id="t3_test" score={10} likes={null} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', {name: /upvote/i}))

    expect(signInMock).toHaveBeenCalledWith('reddit')
  })

  it('should optimistically update score and call vote mutation when authenticated', async () => {
    const session = {
      accessToken: 'token',
      user: {name: 'tester'}
    } as any

    useSessionMock.mockReturnValue({
      data: session,
      status: 'authenticated'
    })

    render(<VoteButtonGroup id="t3_test" score={5} likes={null} />)
    const user = userEvent.setup()

    expect(screen.getByText('5')).toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: /upvote/i}))

    expect(screen.getByText('6')).toBeInTheDocument()
    expect(voteMock).toHaveBeenCalledWith({dir: 1, id: 't3_test'})

    await user.click(screen.getByRole('button', {name: /downvote/i}))

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument()
    })
    expect(voteMock).toHaveBeenLastCalledWith({dir: -1, id: 't3_test'})
  })

  it('should revert score when mutation fails', async () => {
    const session = {
      accessToken: 'token',
      user: {name: 'tester'}
    } as any

    useSessionMock.mockReturnValue({
      data: session,
      status: 'authenticated'
    })

    voteMock.mockReturnValueOnce({
      unwrap: () => Promise.reject(new Error('fail'))
    })

    render(<VoteButtonGroup id="t3_test" score={2} likes={null} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', {name: /upvote/i}))

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
})
