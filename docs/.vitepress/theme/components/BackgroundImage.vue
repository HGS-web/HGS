<template>
  <div class="background-image-container">
    <div class="background-image-content">
      <slot></slot> 
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.background-image-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-image: url('/background.jpg'); 
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.background-image-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ffffff; 
  text-align: center;
}
</style>
