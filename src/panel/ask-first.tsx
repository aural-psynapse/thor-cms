import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RED } from './icon-button'
import { WORDS } from './words'

/** The question asked before anything is removed. */
export type AskFirstProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "Remove Instagram?" */
  title: string
  /** What happens, in one or two plain sentences. */
  children: ReactNode
  /** The red button's words: Remove, Delete, Throw away. */
  action: string
  onConfirm: () => void
}

/**
 * Asked before anything is removed, so one slip never deletes her work. The
 * safe answer is the grey one and says what it keeps.
 */
export function AskFirst({
  open,
  onOpenChange,
  title,
  children,
  action,
  onConfirm,
}: AskFirstProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{children}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{WORDS.ask.keep}</AlertDialogCancel>
          <AlertDialogAction className={RED} onClick={onConfirm}>
            {action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
