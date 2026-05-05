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
    @confirm="(value) => handleConfirm(dialog.id, value)"
    @cancel="handleCancel(dialog.id)"
  />
</template>

<script setup lang="ts">
import Dialog from '@/components/Dialog.vue'
import { useDialog } from '@/composables/useDialog'

const { dialogQueue, handleConfirm, handleCancel } = useDialog()
</script>
