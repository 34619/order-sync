<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const uploading = ref(false)
const error = ref('')
const previewUrl = ref<string | null>(props.modelValue)

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    error.value = '仅支持 JPG/PNG/WebP 格式'
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    error.value = '文件大小不能超过 2MB'
    return
  }

  error.value = ''
  uploading.value = true

  try {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = `products/${fileName}`

    console.log('开始上传:', filePath, '大小:', file.size)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    console.log('上传结果:', { data: uploadData, error: uploadError })

    if (uploadError) {
      error.value = '上传失败: ' + uploadError.message
      return
    }

    // 直接用文件路径存储，详情页再生成签名 URL
    previewUrl.value = URL.createObjectURL(file)
    emit('update:modelValue', filePath)
    console.log('上传成功:', filePath)
  } catch (e: any) {
    console.error('上传异常:', e)
    error.value = e.message || '上传失败'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function removeImage() {
  if (props.modelValue) {
    await supabase.storage.from('product-images').remove([props.modelValue])
  }
  previewUrl.value = null
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="image-upload">
    <div v-if="previewUrl" class="preview">
      <img :src="previewUrl" alt="产品图片" />
      <button type="button" class="btn btn-sm btn-danger" @click="removeImage">删除</button>
    </div>
    <div v-else class="upload-area">
      <label class="upload-label">
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleFileChange" hidden />
        <span v-if="uploading" class="text-secondary">上传中...</span>
        <span v-else class="text-secondary">+ 上传图片</span>
      </label>
    </div>
    <p v-if="error" class="upload-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.image-upload {
  display: inline-block;
}

.upload-area {
  width: 80px;
  height: 80px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-area:hover {
  border-color: var(--accent);
}

.upload-label {
  cursor: pointer;
  font-size: 12px;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.preview img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.upload-error {
  color: var(--danger);
  font-size: 12px;
  margin-top: 4px;
}
</style>
