<!-- eslint-disable vue/multi-word-component-names -->
<template>

  <section class="container donation-container py-5">

    <h1 class="page-title text-center mb-3">Equip a Community</h1>
    <p class="page-subtitle text-center mb-5">
      Your donation helps us purchase sports equipment for underrepresented communities. Choose a
      kit or enter a custom amount.
    </p>

    <div class="row g-4">
      <div v-for="item in donationItems" :key="item.key" class="col-12 col-md-6 col-lg-3">
        <div
          class="card donation-card h-100 p-3 d-flex flex-column justify-content-between shadow-sm"
        >
          <div>
            <p class="donation-label">{{ item.label }}</p>
            <p class="donation-price">${{ item.price }}</p>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3">
            <button class="btn btn-outline-secondary" @click="updateQuantity(item.key, -1)">
              -
            </button>
            <span class="qty">{{ kits[item.key] }}</span>
            <button class="btn btn-outline-secondary" @click="updateQuantity(item.key, 1)">
              +
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="custom-amount my-4">
      <label class="form-label">Or enter custom amount ($AUD)</label>
      <input type="number" class="form-control" placeholder="e.g. 100" v-model="customAmount" />
    </div>

    <div class="impact-box p-3 mb-4 bg-light rounded shadow-sm">
      <h2 class="impact-title">Your Impact</h2>
      <p>
        Football Kits: {{ kits.football }}, Cricket Kits: {{ kits.cricket }}, Tennis Gear:
        {{ kits.tennis }}, General Packs: {{ kits.general }}
      </p>
      <p class="impact-custom">Custom Donation: ${{ customAmount || 0 }}</p>
    </div>

    <button class="btn btn-primary w-100 btn-lg">Proceed to Payment</button>
  </section>
</template>

<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref } from 'vue'

const customAmount = ref('')
const kits = ref({ football: 0, cricket: 0, tennis: 0, general: 0 })
const donationItems = ref([
  { key: 'football', label: 'Football Kit', price: 50},
  { key: 'cricket', label: 'Cricket Kit', price: 70 },
  { key: 'tennis', label: 'Tennis Gear', price: 40 },
  { key: 'general', label: 'General Sports Pack', price: 30 },
])

const updateQuantity = (key, change) => {
  kits.value[key] = Math.max(0, kits.value[key] + change)
}
</script>

<style scoped>
.page-title {
  font-size: 2.5rem;
  font-weight: 700;
}
.page-subtitle {
  color: #555;
  font-size: 1.1rem;
}
.donation-card {
  border-radius: 0.75rem;
  transition: transform 0.2s;
}
.donation-card:hover {
  transform: translateY(-5px);
}
.donation-label {
  font-weight: 600;
  font-size: 1.1rem;
}
.donation-price {
  color: #666;
  font-weight: 500;
}
.qty {
  font-weight: 600;
  font-size: 1rem;
}
.impact-title {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.impact-custom {
  color: green;
  font-weight: 600;
}
.custom-amount input {
  max-width: 300px;
  margin: 0 auto;
}
.btn-primary {
  background-color: #0d6efd;
  border: none;
  transition:
    background-color 0.3s,
    transform 0.2s;
}
.btn-primary:hover {
  background-color: #0b5ed7;
  transform: translateY(-2px);
}

.donation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
</style>
