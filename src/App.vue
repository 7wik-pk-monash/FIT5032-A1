<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <NavBar />
    <main class="flex-grow-1">
      <router-view />
    </main>
    <footer class="footer bg-dark text-white py-4 mt-auto">
      <div class="container text-center">
        <p class="mb-1">&copy; 2025 TeamUp. All rights reserved.</p>
        <!-- <div>
          <a href="#" class="text-white me-3">Privacy Policy</a>
          <a href="#" class="text-white">Terms of Service</a>
        </div> -->
      </div>
    </footer>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
</script>

<style>
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  margin: 0;
}
.footer a:hover {
  text-decoration: underline;
}
</style>
