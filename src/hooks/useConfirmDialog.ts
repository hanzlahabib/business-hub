import { useState, useCallback, useRef } from 'react'

interface ConfirmOptions {
    title?: string
    message?: string
    variant?: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
    cancelText?: string
}

interface DialogState extends ConfirmOptions {
    isOpen: boolean
    onConfirm?: () => void
}

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
    const [dialogState, setDialogState] = useState<DialogState>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    })

    const resolveRef = useRef<((value: boolean) => void) | null>(null)

    const confirm = useCallback(({
        title = 'Confirm',
        message = 'Are you sure?',
        variant = 'danger',
        confirmText = 'Confirm',
        cancelText = 'Cancel'
    }: ConfirmOptions = {}) => {
        return new Promise<boolean>((resolve) => {
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
