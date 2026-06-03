import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isDisabled = false
    
    const result = cn(
      'base-class',
      isActive && 'active',
      isDisabled && 'disabled'
    )
    
    expect(result).toBe('base-class active')
  })

  it('should handle undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2')
    expect(result).toBe('class1 class2')
  })

  it('should handle empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should merge conflicting Tailwind classes correctly', () => {
    // This tests the twMerge functionality
    const result = cn('px-2 px-4', 'py-1 py-2')
    expect(result).toBe('px-4 py-2')
  })

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle object-style classes', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    })
    expect(result).toBe('class1 class3')
  })

  it('should handle complex combinations', () => {
    const isVisible = true
    const type = 'primary'
    
    const result = cn(
      'base',
      {
        'visible': isVisible,
        'hidden': !isVisible,
      },
      type === 'primary' && 'bg-blue-500',
      type === 'secondary' && 'bg-gray-500',
      ['border', 'rounded']
    )
    
    expect(result).toContain('base')
    expect(result).toContain('visible')
    expect(result).toContain('bg-blue-500')
    expect(result).toContain('border')
    expect(result).toContain('rounded')
    expect(result).not.toContain('hidden')
    expect(result).not.toContain('bg-gray-500')
  })

  it('should deduplicate identical classes', () => {
    const result = cn('class1', 'class2', 'class1', 'class3', 'class2')
    
    // Should contain each class only once
    const classes = result.split(' ')
    const uniqueClasses = [...new Set(classes)]
    
    expect(classes.length).toBe(uniqueClasses.length)
    expect(result).toContain('class1')
    expect(result).toContain('class2')
    expect(result).toContain('class3')
  })
})