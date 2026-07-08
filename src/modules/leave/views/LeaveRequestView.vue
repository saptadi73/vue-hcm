<script setup lang="ts">
import SectionCard from '@/components/common/SectionCard.vue'
</script>

<template>
  <div class="space-y-4">
    <SectionCard
      title="Request Cuti"
      subtitle="Modul cuti dipisahkan agar maintainable dan mudah diintegrasikan ke Odoo."
    >
      <p class="text-sm text-slate-600">
        Nanti form cuti dapat langsung map ke model leave request Odoo 14 dan status approval
        real-time.
      </p>
    </SectionCard>
  </div>
</template>
