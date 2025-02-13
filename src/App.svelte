<script lang="ts">
  import { onMount } from 'svelte';
  import { SVG } from '@svgdotjs/svg.js';
  import { FaceModel } from './models/FaceModel';
  
  let svgContainer: HTMLDivElement;
  let draw: any;
  let faceIndex = 0;
  let startingPoint = { ...FaceModel.DEFAULT_STARTING_POINT };
  let referenceCode = FaceModel.getStartingPointReference(startingPoint);
  let isValidReference = true;
  let isAdjustMode = false;
  
  $: params = FaceModel.getParameters(faceIndex, startingPoint);
  $: if (isAdjustMode) {
    faceIndex = 0;
  }
  $: if (draw && startingPoint) updateFace(faceIndex);
  
  function handleReferenceChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    isValidReference = FaceModel.validateReference(value);
    if (isValidReference) {
      referenceCode = value;
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (isValidReference) {
      startingPoint = FaceModel.parseReference(referenceCode);
    }
  }

  function toggleAdjustMode() {
    isAdjustMode = !isAdjustMode;
    if (!isAdjustMode) {
      // Update reference code when exiting adjust mode
      referenceCode = FaceModel.getStartingPointReference(startingPoint);
    }
  }

  function handleParameterChange(key: keyof FaceParameters, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    startingPoint = {
      ...startingPoint,
      [key]: value
    };
    // Update reference code in real-time while adjusting
    referenceCode = FaceModel.getStartingPointReference(startingPoint);
  }
  
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
            disabled={isAdjustMode}
          />
          <div class="text-center">Face Index: {faceIndex}</div>
        </div>
        
        <div class="parameters">
          {#each Object.entries(params) as [key, value]}
            <div>
              {#if isAdjustMode}
                <input
                  type="range"
                  min={-Math.PI/2}
                  max={Math.PI/2}
                  step="0.01"
                  value={startingPoint[key]}
                  on:input={(e) => handleParameterChange(key, e)}
                />
              {:else}
                <meter value={value} min={-1} max={1}></meter>
              {/if}
              <small>{key}</small>
            </div>
          {/each}
        </div>
      </div>
      <div class="card-section">
        <form on:submit={handleSubmit}>
          <div class="input-group">
            <span class="input-group-label">Starting Point Reference</span>
            <input
              type="text"
              value={referenceCode}
              on:input={handleReferenceChange}
              class="input-group-field monospace"
              class:is-invalid-input={!isValidReference}
              disabled={isAdjustMode}
            />
            <div class="input-group-button">
              {#if !isAdjustMode}
                <button
                  type="submit"
                  class="button"
                  disabled={!isValidReference}
                >
                  Apply
                </button>
              {/if}
              <button
                type="button"
                class="button"
                class:secondary={!isAdjustMode}
                on:click={toggleAdjustMode}
              >
                {isAdjustMode ? 'Done' : 'Adjust'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

<style>
  @import './app.css';
</style>