<script lang="ts">
  import { onMount } from 'svelte';
  import { SVG } from '@svgdotjs/svg.js';
  import { FaceModel } from './models/FaceModel';
  
  let svgContainer: HTMLDivElement;
  let draw: any;
  let faceIndex = 0;
  
  $: params = FaceModel.getParameters(faceIndex);
  
  function updateFace(index: number) {
    if (!draw) return;
    
    draw.clear();
    
    const dimensions = {
      width: 300,
      height: 400,
      centerX: 150,
      centerY: 200,
    };
    
    const features = FaceModel.getFeaturePositions(dimensions, params);
    
    // Draw eyebrows
    draw
      .path(features.eyebrows.leftPath)
      .fill('none')
      .stroke({ width: 2, color: '#000' });
      
    draw
      .path(features.eyebrows.rightPath)
      .fill('none')
      .stroke({ width: 2, color: '#000' });
      
    // Draw eyes
    draw
      .line(
        features.eyes.leftStart.x,
        features.eyes.leftStart.y,
        features.eyes.leftEnd.x,
        features.eyes.leftEnd.y
      )
      .stroke({ width: 2, color: '#000' });
      
    draw
      .line(
        features.eyes.rightStart.x,
        features.eyes.rightStart.y,
        features.eyes.rightEnd.x,
        features.eyes.rightEnd.y
      )
      .stroke({ width: 2, color: '#000' });
      
    // Draw nose
    draw
      .circle(3)
      .cx(features.nose.leftNostril.x)
      .cy(features.nose.leftNostril.y)
      .fill('#000');
      
    draw
      .circle(3)
      .cx(features.nose.rightNostril.x)
      .cy(features.nose.rightNostril.y)
      .fill('#000');
      
    // Draw alae
    draw
      .path(features.nose.leftAlaePath)
      .fill('none')
      .stroke({ width: 2, color: '#000' });
      
    draw
      .path(features.nose.rightAlaePath)
      .fill('none')
      .stroke({ width: 2, color: '#000' });
      
    // Draw mouth
    draw
      .path(features.mouth.upperPath)
      .fill('none')
      .stroke({ width: 2, color: '#000' });
      
    draw
      .path(features.mouth.lowerPath)
      .fill('none')
      .stroke({ width: 2, color: '#000' });
  }
  
  onMount(() => {
    draw = SVG().addTo(svgContainer).size(300, 400);
    updateFace(faceIndex);
  });
  
  $: if (draw) updateFace(faceIndex);
</script>

<div class="face-generator">
  <div class="grid-container">
    <div class="card">
      <div class="card-section">
        <div class="text-center">
          <div bind:this={svgContainer}></div>
        </div>
        
        <div class="controls">
          <input
            type="range"
            min="0"
            max="100"
            bind:value={faceIndex}
            style="width: 100%;"
          />
          <div class="text-center">Face Index: {faceIndex}</div>
        </div>
        
        <div class="parameters">
          {#each Object.entries(params) as [key, value]}
            <div>
              <meter value={value} min={-1} max={1}></meter>
              <small>{key}</small>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @import './app.css';
</style>