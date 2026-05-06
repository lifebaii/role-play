<template>
  <Dialog
    v-for="dialog in dialogQueue"
    :key="dialog.id"
    :visible="true"
    :type="dialog.type"
    :title="dialog.title"
    :message="dialog.message"
    :confirm-text="dialog.confirmText"
    :cancel-text="dialog.cancelText"
    :input-placeholder="dialog.inputPlaceholder"
    :input-value="dialog.inputValue"
    :variant="dialog.variant"
    :buttons="dialog.buttons"
    @confirm="(value) => handleConfirm(dialog.id, value)"
    @cancel="handleCancel(dialog.id)"
    @multi-button="(value) => handleMultiButton(dialog.id, value)"
  />
</template>

<script setup lang="ts">
import Dialog from '@/components/Dialog.vue'
import { useDialog } from '@/composables/useDialog'

const { dialogQueue, handleConfirm, handleMultiButton, handleCancel } = useDialog()
</script>
