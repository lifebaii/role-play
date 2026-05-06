import { ref, readonly } from 'vue'
import type { DialogOptions } from '@/components/Dialog.vue'

export interface DialogState extends DialogOptions {
  id: number
  resolve: (value: boolean | string | any) => void
}

const dialogQueue = ref<DialogState[]>([])
let dialogId = 0

export function useDialog() {
  function showDialog(options: Omit<DialogOptions, 'type'> & { type: 'alert' | 'confirm' | 'prompt' }): Promise<boolean | string> {
    return new Promise((resolve) => {
      const id = ++dialogId
      dialogQueue.value.push({
        ...options,
        id,
        resolve: resolve as (value: boolean | string) => void
      })
    })
  }

  async function showAlert(message: string, title = '提示'): Promise<void> {
    await showDialog({
      type: 'alert',
      title,
      message
    })
  }

  async function showConfirm(message: string, title = '确认', confirmText?: string, cancelText?: string): Promise<boolean> {
    return showDialog({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText
    }) as Promise<boolean>
  }

  async function showPrompt(message: string, defaultValue = '', title = '输入'): Promise<string | null> {
    const result = await showDialog({
      type: 'prompt',
      title,
      message,
      inputValue: defaultValue
    })
    return result as string | null
  }

  async function showDangerConfirm(message: string, title = '警告'): Promise<boolean> {
    return showDialog({
      type: 'confirm',
      title,
      message,
      variant: 'danger'
    }) as Promise<boolean>
  }

  async function showMultiButtonConfirm(
    message: string,
    title: string,
    buttons: Array<{ text: string; value: any; variant?: 'default' | 'primary' | 'danger' | 'success' }>,
    variant?: 'default' | 'danger' | 'success'
  ): Promise<any> {
    return showDialog({
      type: 'multi-button',
      title,
      message,
      buttons,
      variant: variant || 'default'
    }) as Promise<any>
  }

  async function showSuccessAlert(message: string, title = '成功'): Promise<void> {
    await showDialog({
      type: 'alert',
      title,
      message,
      variant: 'success'
    })
  }

  async function showErrorAlert(message: string, title = '错误'): Promise<void> {
    await showDialog({
      type: 'alert',
      title,
      message,
      variant: 'danger'
    })
  }

  function handleConfirm(id: number, value?: string) {
    const index = dialogQueue.value.findIndex(d => d.id === id)
    if (index !== -1) {
      const dialog = dialogQueue.value[index]
      if (dialog.type === 'prompt') {
        dialog.resolve(value || '')
      } else if (dialog.type === 'confirm') {
        dialog.resolve(true)
      } else {
        dialog.resolve(true)
      }
      dialogQueue.value.splice(index, 1)
    }
  }

  function handleMultiButton(id: number, value: any) {
    const index = dialogQueue.value.findIndex(d => d.id === id)
    if (index !== -1) {
      const dialog = dialogQueue.value[index]
      dialog.resolve(value)
      dialogQueue.value.splice(index, 1)
    }
  }

  function handleCancel(id: number) {
    const index = dialogQueue.value.findIndex(d => d.id === id)
    if (index !== -1) {
      const dialog = dialogQueue.value[index]
      if (dialog.type === 'prompt') {
        dialog.resolve(null as unknown as string)
      } else {
        dialog.resolve(false)
      }
      dialogQueue.value.splice(index, 1)
    }
  }

  return {
    dialogQueue: readonly(dialogQueue),
    showDialog,
    showAlert,
    showConfirm,
    showPrompt,
    showDangerConfirm,
    showMultiButtonConfirm,
    showSuccessAlert,
    showErrorAlert,
    handleConfirm,
    handleMultiButton,
    handleCancel
  }
}
