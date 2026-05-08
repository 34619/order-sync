<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { useStrategiesStore } from '../stores/strategies'

const store = useStrategiesStore()

// 接收端配置状态
const multiplier = ref(10)
const signalEnabled = ref(true)
const signalInterval = ref<'cumulative' | 'override'>('cumulative')
const tradeStatus = ref<'reject' | 'transmit'>('transmit')
const stopLoss = ref(100)
const prePayment1 = ref(10)
const prePayment2 = ref(0)
const selectedTemplate = ref('')

// 从已有策略加载配置
onMounted(() => {
  store.fetchStrategies()
  if (store.strategies.length) {
    const s = store.strategies[0]
    multiplier.value = s.multiplier
    stopLoss.value = s.stop_loss
    signalEnabled.value = s.is_active
  }
})

function handleSave() {
  // 保存逻辑 - 后续接入 Supabase
  alert('配置已保存')
}
</script>

<template>
  <Layout>
    <div class="receiver">
      <h2>接收端配置</h2>

      <!-- 基础配置 -->
      <div class="config-section">
        <h3>基础配置</h3>
        <div class="config-row">
          <span class="config-label">默认倍率</span>
          <div class="config-value">
            <input v-model.number="multiplier" type="number" class="input-green" />
          </div>
        </div>
        <div class="config-row">
          <span class="config-label">信号状态</span>
          <div class="config-value toggle-group">
            <button
              :class="['toggle-btn', !signalEnabled ? 'active-off' : '']"
              @click="signalEnabled = false"
            >关</button>
            <button
              :class="['toggle-btn', signalEnabled ? 'active-on' : '']"
              @click="signalEnabled = true"
            >开</button>
          </div>
        </div>
        <div class="config-row">
          <span class="config-label">信号间隔</span>
          <div class="config-value toggle-group">
            <button
              :class="['toggle-btn', signalInterval === 'cumulative' ? 'active-on' : '']"
              @click="signalInterval = 'cumulative'"
            >累加制</button>
            <button
              :class="['toggle-btn', signalInterval === 'override' ? 'active-on' : '']"
              @click="signalInterval = 'override'"
            >覆盖制</button>
          </div>
        </div>
        <div class="config-row">
          <span class="config-label">预付款</span>
          <div class="config-value dual-input">
            <div class="input-with-unit">
              <input v-model.number="prePayment1" type="number" />
              <span class="unit">%</span>
            </div>
            <div class="input-with-unit">
              <input v-model.number="prePayment2" type="number" />
              <span class="unit">%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 成交状态 -->
      <div class="config-section">
        <h3>成交状态</h3>
        <div class="config-row">
          <span class="config-label">成交状态</span>
          <div class="config-value toggle-group">
            <button
              :class="['toggle-btn', tradeStatus === 'reject' ? 'active-on' : '']"
              @click="tradeStatus = 'reject'"
            >不传</button>
            <button
              :class="['toggle-btn', tradeStatus === 'transmit' ? 'active-off' : '']"
              @click="tradeStatus = 'transmit'"
            >传</button>
          </div>
        </div>
      </div>

      <!-- 止损设置 -->
      <div class="config-section">
        <h3>止损设置</h3>
        <div class="config-row">
          <span class="config-label">止损设置</span>
          <div class="config-value input-with-unit">
            <input v-model.number="stopLoss" type="number" />
            <span class="unit">%</span>
          </div>
        </div>
        <div class="config-row">
          <span class="config-label">预付款</span>
          <div class="config-value select-wrapper">
            <select v-model="selectedTemplate">
              <option value="" disabled selected>选择需要反手的预付款</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
              <option value="50">50%</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 配置模板 -->
      <div class="config-section">
        <h3>配置模板</h3>
        <div class="config-row">
          <span class="config-label">模板</span>
          <div class="config-value select-wrapper">
            <select v-model="selectedTemplate">
              <option value="" disabled selected>选择配置模板</option>
              <option value="conservative">稳健型</option>
              <option value="aggressive">激进型</option>
              <option value="balanced">均衡型</option>
            </select>
          </div>
        </div>
      </div>

      <button class="save-btn" @click="handleSave">保存设置</button>
    </div>
  </Layout>
</template>

<style scoped>
.receiver {
  max-width: 500px;
  margin: 0 auto;
}

.receiver h2 {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 16px;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #2a3f5f;
}

.config-section {
  margin-bottom: 20px;
}

.config-section h3 {
  font-size: 0.9rem;
  color: #4caf50;
  font-weight: 500;
  margin-bottom: 2px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2a3f5f;
}

.config-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #1e2a4a;
}

.config-label {
  color: #ccc;
  font-size: 0.9rem;
  min-width: 80px;
}

.config-value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.config-value input {
  width: 80px;
  padding: 6px 10px;
  background: #0f1729;
  border: 1px solid #2a3f5f;
  border-radius: 6px;
  color: #fff;
  font-size: 0.95rem;
  text-align: right;
}

.config-value input:focus {
  outline: none;
  border-color: #4caf50;
}

.input-green {
  color: #4caf50 !important;
  font-weight: 700;
  font-size: 1.1rem !important;
}

.toggle-group {
  display: flex;
  gap: 0;
}

.toggle-btn {
  padding: 6px 14px;
  border: 1px solid #2a3f5f;
  background: #0f1729;
  color: #8899aa;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.toggle-btn:first-child {
  border-radius: 6px 0 0 6px;
}

.toggle-btn:last-child {
  border-radius: 0 6px 6px 0;
  border-left: none;
}

.active-on {
  background: #4caf50;
  color: #fff;
  border-color: #4caf50;
}

.active-off {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}

.dual-input {
  gap: 12px;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-with-unit input {
  width: 70px;
}

.unit {
  color: #8899aa;
  font-size: 0.85rem;
}

.select-wrapper select {
  width: 100%;
  padding: 8px 10px;
  background: #0f1729;
  border: 1px solid #2a3f5f;
  border-radius: 6px;
  color: #8899aa;
  font-size: 0.85rem;
}

.select-wrapper select:focus {
  outline: none;
  border-color: #4caf50;
}

.save-btn {
  width: 100%;
  padding: 14px;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 10px;
}

.save-btn:hover {
  background: #45a049;
}
</style>
