<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <!-- Skip to main content link for screen readers -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <NavBar />
    <main id="main-content" class="flex-grow-1">
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

/* Skip link for accessibility */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
  border-radius: 4px;
}

.skip-link:focus {
  top: 6px;
}

/* Enhanced focus indicators for accessibility */
*:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Ensure buttons have visible focus */
.btn:focus {
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
