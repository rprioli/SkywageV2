"use client"

import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface MobileInputProps extends React.ComponentProps<typeof Input> {
  /**
   * Input mode for mobile keyboards
   * - 'text': Default text keyboard
   * - 'numeric': Numeric keyboard
   * - 'decimal': Decimal numeric keyboard
   * - 'tel': Telephone keyboard
   * - 'email': Email keyboard with @ symbol
   * - 'url': URL keyboard with .com
   * - 'search': Search keyboard with search button
   */
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search'
  
  /**
   * Auto-capitalize behavior
   * - 'off': No auto-capitalization
   * - 'sentences': Capitalize first letter of sentences
   * - 'words': Capitalize first letter of words
   * - 'characters': Capitalize all characters
   */
  autoCapitalize?: 'off' | 'sentences' | 'words' | 'characters'
  
  /**
   * Auto-correct behavior
   */
  autoCorrect?: 'on' | 'off'
  
  /**
   * Spell check behavior
   */
  spellCheck?: boolean
}

export const MobileInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  MobileInputProps
>(({ 
  inputMode, 
  autoCapitalize = 'sentences', 
  autoCorrect = 'on', 
  spellCheck = true,
  className,
  type,
  ...props 
}, ref) => {
  // Auto-detect inputMode based on type if not provided
  const getInputMode = () => {
    if (inputMode) return inputMode
    
    switch (type) {
      case 'email':
        return 'email'
      case 'tel':
        return 'tel'
      case 'url':
        return 'url'
      case 'number':
        return 'numeric'
      case 'search':
        return 'search'
      default:
        return 'text'
    }
  }

  // Auto-detect autoCapitalize based on type
  const getAutoCapitalize = () => {
    if (props.autoCapitalize !== undefined) return autoCapitalize
    
    switch (type) {
      case 'email':
      case 'url':
      case 'tel':
      case 'number':
        return 'off'
      default:
        return autoCapitalize
    }
  }

  // Auto-detect autoCorrect based on type
  const getAutoCorrect = () => {
    if (props.autoCorrect !== undefined) return autoCorrect
    
    switch (type) {
      case 'email':
      case 'url':
      case 'tel':
      case 'number':
      case 'password':
        return 'off'
      default:
        return autoCorrect
    }
  }

  // Auto-detect spellCheck based on type
  const getSpellCheck = () => {
    if (props.spellCheck !== undefined) return spellCheck
    
    switch (type) {
      case 'email':
      case 'url':
      case 'tel':
      case 'number':
      case 'password':
        return false
      default:
        return spellCheck
    }
  }

  return (
    <Input
      ref={ref}
      type={type}
      inputMode={getInputMode()}
      autoCapitalize={getAutoCapitalize()}
      autoCorrect={getAutoCorrect()}
      spellCheck={getSpellCheck()}
      className={cn(
        // Additional mobile-specific optimizations
        "touch-manipulation", // Improves touch responsiveness
        className
      )}
      {...props}
    />
  )
})

MobileInput.displayName = "MobileInput"

export { MobileInput as Input }
