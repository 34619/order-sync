<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from '../components/Layout.vue'
import { useStrategiesStore } from '../stores/strategies'

const store = useStrategiesStore()

const accountName = ref('v4live_232')

// 基础配置
const multiplier = ref(10)
const signalEnabled = ref(true)
const signalInterval = ref<'cumulative' | 'override'>('cumulative')
const prePayment1 = ref(10)
const prePayment2 = ref(0)

// 成交状态
const tradeTransmit = ref(true)

// 止损设置
const stopLoss = ref(100)
const prePaymentReverse = ref('')

// 配置模板
const selectedTemplate = ref('')

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
  alert('配置已保存')
}
</script>

<template>
  <Layout>
    <div class="page">
      <div class="title-bar">接收端 account: {{ accountName }}</div>

      <!-- 基础配置 -->
      <div class="section">
        <div class="section-title">基础配置</div>
        <div class="config-item">
          <span class="label">默认倍率</span>
          <span class="multiplier-badge">{{ multiplier }}</span>
        </div>
        <div class="config-item">
          <span class="label">信号状态</span>
          <div class="pill-group">
            <button :class="['pill', !signalEnabled && 'pill-active-off']" @click="signalEnabled = false">关</button>
            <button :class="['pill', signalEnabled && 'pill-active-on']" @click="signalEnabled = true">开</button>
          </div>
        </div>
        <div class="config-item">
          <span class="label">信号间隔</span>
          <div class="pill-group">
            <button :class="['pill', signalInterval === 'cumulative' && 'pill-active-on']" @click="signalInterval = 'cumulative'">累加制</button>
            <button :class="['pill', signalInterval === 'override' && 'pill-active-on']" @click="signalInterval = 'override'">覆盖制</button>
          </div>
        </div>
        <div class="config-item">
          <span class="label">预付款</span>
          <div class="dual-percent">
            <div class="percent-input">
              <input v-model.number="prePayment1" type="number" />
              <span class="pct">%</span>
            </div>
            <div class="percent-input">
              <input v-model.number="prePayment2" type="number" />
              <span class="pct">%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 成交状态 -->
      <div class="section">
        <div class="section-title">成交状态</div>
        <div class="config-item">
          <span class="label">成交状态</span>
          <div class="pill-group">
            <button :class="['pill', !tradeTransmit && 'pill-active-on']" @click="tradeTransmit = false">不传</button>
            <button :class="['pill', tradeTransmit && 'pill-active-warn']" @click="tradeTransmit = true">传</button>
          </div>
        </div>
      </div>

      <!-- 止损设置 -->
      <div class="section">
        <div class="section-title">止损设置</div>
        <div class="config-item">
          <span class="label">止损设置</span>
          <div class="inline-input">
            <input v-model.number="stopLoss" type="number" />
            <span class="unit">%</span>
          </div>
        </div>
        <div class="config-item">
          <span class="label">预付款</span>
          <select v-model="prePaymentReverse" class="select-input">
            <option value="" disabled selected>选择需要反手的预付款</option>
            <option value="10">10%</option>
            <option value="20">20%</option>
            <option value="50">50%</option>
          </select>
        </div>
      </div>

      <!-- 配置模板 -->
      <div class="config-item template-row">
        <span class="label">配置模板</span>
        <select v-model="selectedTemplate" class="select-input">
          <option value="" disabled selected>选择配置模板</option>
          <option value="conservative">稳健型</option>
          <option value="aggressive">激进型</option>
          <option value="balanced">均衡型</option>
        </select>
      </div>

      <button class="save-btn" @click="handleSave">保存设置</button>
    </div>
  </Layout>
</template>

<style scoped>
.page {
  max-width: 480px;
  margin: 0 auto;
}

.title-bar {
  text-align: center;
  color: #ccc;
  font-size: 0.95rem;
  padding-bottom: 14px;
  border-bottom: 1px solid #2a3f5f;
  margin-bottom: 4px;
}

.section {
  border-bottom: 1px solid #1e2a4a;
}

.section-title {
  color: #4caf50;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 10px 0 4px;
  border-bottom: 1px solid #2a3f5f;
  margin-bottom: 0;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #1e2a4a;
}

.config-item:last-child {
  border-bottom: none;
}

.label {
  color: #ccc;
  font-size: 0.9rem;
}

.multiplier-badge {
  background: #4caf50;
  color: #fff;
  padding: 4px 18px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
}

.pill-group {
  display: flex;
}

.pill {
  padding: 6px 14px;
  border: 1px solid #3a4f6f;
  background: transparent;
  color: #8899aa;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.pill:first-child {
  border-radius: 6px 0 0 6px;
}

.pill:last-child {
  border-radius: 0 6px 6px 0;
  border-left: none;
}

.pill-active-on {
  background: #4caf50;
  color: #fff;
  border-color: #4caf50;
}

.pill-active-off {
  background: #555;
  color: #fff;
  border-color: #555;
}

.pill-active-warn {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}

.dual-percent {
  display: flex;
  gap: 12px;
}

.percent-input {
  display: flex;
  align-items: center;
  gap: 2px;
}

.percent-input input {
  width: 65px;
  padding: 5px 8px;
  background: #0f1729;
  border: 1px solid #2a3f5f;
  border-radius: 4px;
  color: #fff;
  font-size: 0.9rem;
  text-align: center;
}

.percent-input input:focus {
  outline: none;
  border-color: #4caf50;
}

.pct {
  color: #8899aa;
  font-size: 0.85rem;
}

.inline-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.inline-input input {
  width: 65px;
  padding: 5px 8px;
  background: #0f1729;
  border: 1px solid #2a3f5f;
  border-radius: 4px;
  color: #fff;
  font-size: 0.9rem;
  text-align: center;
}

.inline-input input:focus {
  outline: none;
  border-color: #4caf50;
}

.unit {
  color: #8899aa;
  font-size: 0.85rem;
}

.select-input {
  padding: 7px 10px;
  background: #0f1729;
  border: 1px solid #2a3f5f;
  border-radius: 4px;
  color: #8899aa;
  font-size: 0.85rem;
  min-width: 180px;
}

.select-input:focus {
  outline: none;
  border-color: #4caf50;
}

.template-row {
  padding: 14px 0;
  border-bottom: none;
}

.save-btn {
  width: 100%;
  padding: 13px;
  background: #55b895;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 12px;
}

.save-btn:hover {
  background: #48a687;
}
</style>
