<template>
  <div class="background-gif-container">
    <iframe 
      src="https://giphy.com/embed/xTiTnzR2H2VEgmRw5i" 
      width="100%" 
      height="100%" 
      frameborder="0" 
      class="giphy-embed" 
      allowfullscreen
    ></iframe>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.background-gif-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.giphy-embed {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; 
}

.content {
  position: relative;
  z-index: 1;
  color: #ffffff;
  text-align: center;
  padding-top: 40vh; 
}
</style>
