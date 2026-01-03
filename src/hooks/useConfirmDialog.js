import { useState, useCallback, useRef } from 'react'

/**
 * Hook for promise-based confirm dialogs
 * Usage:
 *   const { dialogState, confirm, close } = useConfirmDialog()
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Item',
 *       message: 'Are you sure?',
 *       variant: 'danger'
 *     })
 *     if (confirmed) {
 *       // do delete
 *     }
 *   }
 *
 *   <AlertDialog {...dialogState} onClose={close} />
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  })

  const resolveRef = useRef(null)

  const confirm = useCallback(({
    title = 'Confirm',
    message = 'Are you sure?',
    variant = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  } = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setDialogState({
        isOpen: true,
        title,
        message,
        variant,
        confirmText,
        cancelText,
        onConfirm: () => {
          resolve(true)
          resolveRef.current = null
        }
      })
    })
  }, [])

  const close = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false)
      resolveRef.current = null
    }
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }, [])

  return { dialogState, confirm, close }
}
