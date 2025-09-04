import {debounce} from './debounce'

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('debounce', () => {
  it('should call the function after the delay', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced('test')
    expect(fn).not.toHaveBeenCalled()
    await wait(60)
    expect(fn).toHaveBeenCalledWith('test')
  })

  it('should only call the last invocation if called multiple times quickly', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced('first')
    debounced('second')
    debounced('third')
    await wait(60)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('third')
  })

  it('should not call the function if not enough time has passed', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('one')
    await wait(50)
    expect(fn).not.toHaveBeenCalled()
  })

  it('should preserve this context if used as a method', async () => {
    const context = {
      value: 42,
      fn: vi.fn(function (this: any) {
        return this.value
      })
    }
    const debounced = debounce(context.fn, 50).bind(context)
    debounced()
    await wait(60)
    expect(context.fn).toHaveBeenCalled()
    expect(context.fn.mock.instances[0].value).toBe(42)
  })
})
