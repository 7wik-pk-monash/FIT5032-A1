<template>
  <section
    class="hero-section text-center text-white d-flex align-items-center justify-content-center"
  >
    <div class="hero-content">
      <h1 class="display-4 fw-bold mb-3">Empower Communities Through Sport</h1>
      <p class="lead mb-4">
        Join us in creating opportunities for underrepresented communities to stay active and
        healthy.
      </p>
      <div  id="hero-buttons">
          <router-link to="/donate" class="btn btn-primary btn-lg">Donate Now</router-link>
          <router-link to="/events" class="btn btn-outline-light btn-lg">View Events</router-link>
      </div>

    </div>
  </section>
</template>

<script>
export default {
  name: 'LandingPage',
}
</script>

<style scoped>
.hero-section {
  background: url('@/assets/hero-bg.jpg') center/cover no-repeat;
  min-height: 80vh;
  padding: 4rem 1rem;
  position: relative;
}
.hero-section::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
}
.hero-content {
  position: relative;
  z-index: 1;
}

#hero-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4rem;
  justify-content: center;
}

@media (max-width: 576px) {
  #hero-buttons {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  #hero-buttons .btn {
    width: 10rem;
  }
}

</style>
