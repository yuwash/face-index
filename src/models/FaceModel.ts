export interface FaceParameters {
  eyebrowCurve: number;
  eyebrowPeakOffset: number;
  eyebrowWidth: number;
  eyeYOffset: number;
  eyeXOffset: number;
  upperLipCurve: number;
  lowerLipCurve: number;
  cupidBowOffset: number;
  noseWidth: number;
}

export interface FaceDimensions {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export class FaceModel {
  private static readonly BASE_FREQ = 2 * Math.PI / 100;
  private static readonly PARAM_ORDER: (keyof FaceParameters)[] = [
    'eyebrowCurve',
    'eyebrowPeakOffset',
    'eyebrowWidth',
    'eyeYOffset',
    'eyeXOffset',
    'upperLipCurve',
    'lowerLipCurve',
    'cupidBowOffset',
    'noseWidth'
  ];

  public static readonly DEFAULT_STARTING_POINT: FaceParameters = {
    eyebrowCurve: 0,
    eyebrowPeakOffset: 0,
    eyebrowWidth: 0,
    eyeYOffset: 0,
    eyeXOffset: 0,
    upperLipCurve: 0,
    lowerLipCurve: 0,
    cupidBowOffset: 0,
    noseWidth: 0
  };

  public static validateReference(reference: string): boolean {
    const hexPattern = /^[0-9A-Fa-f]{18}$/;
    return hexPattern.test(reference);
  }

  public static getParameters(faceIndex: number, startingPoint: FaceParameters): FaceParameters {
    const t = faceIndex;
    return {
      eyebrowCurve: Math.sin(7 * this.BASE_FREQ * t + startingPoint.eyebrowCurve),
      eyebrowPeakOffset: Math.sin(13 * this.BASE_FREQ * t + startingPoint.eyebrowPeakOffset),
      eyebrowWidth: Math.sin(17 * this.BASE_FREQ * t + startingPoint.eyebrowWidth),
      eyeYOffset: Math.sin(1 * this.BASE_FREQ * t + startingPoint.eyeYOffset),
      eyeXOffset: Math.sin(2 * this.BASE_FREQ * t + startingPoint.eyeXOffset),
      upperLipCurve: Math.sin(3 * this.BASE_FREQ * t + startingPoint.upperLipCurve),
      lowerLipCurve: Math.sin(5 * this.BASE_FREQ * t + startingPoint.lowerLipCurve),
      cupidBowOffset: Math.sin(19 * this.BASE_FREQ * t + startingPoint.cupidBowOffset),
      noseWidth: Math.sin(11 * this.BASE_FREQ * t + startingPoint.noseWidth),
    };
  }

  public static getStartingPointReference(startingPoint: FaceParameters): string {
    return this.PARAM_ORDER.map(key => {
      // Convert angle to amplitude using sin
      const amplitude = Math.sin(startingPoint[key]);
      // Map from [-1, 1] to [0, 255]
      const byte = Math.round((amplitude + 1) * 256 / 2);
      // Ensure the value is between 0 and 255
      const clampedByte = Math.max(0, Math.min(255, byte));
      // Convert to hex and pad with zeros if necessary
      return clampedByte.toString(16).padStart(2, '0');
    }).join('');
  }

  public static parseReference(reference: string): FaceParameters {
    const bytes = reference.match(/.{2}/g)?.map(hex => parseInt(hex, 16)) || [];
    const newStartingPoint = { ...this.DEFAULT_STARTING_POINT };

    this.PARAM_ORDER.forEach((key, index) => {
      if (index < bytes.length) {
        // Map from [0, 255] back to [-1, 1]
        const amplitude = (bytes[index] * 2 / 256) - 1;
        // Convert amplitude back to angle using arcsin
        // Clamp to avoid NaN from arcsin of values outside [-1, 1]
        const clampedAmplitude = Math.max(-1, Math.min(1, amplitude));
        newStartingPoint[key] = Math.asin(clampedAmplitude);
      }
    });

    return newStartingPoint;
  }

  public static getFeaturePositions(dimensions: FaceDimensions, params: FaceParameters) {
    const { centerX, centerY } = dimensions;
    const eyeBaseWidth = 20;
    const innerEyeBaseX = 20;
    
    // Calculate vertical positions
    const eyebrowY = centerY - 50;
    const noseY = centerY + 10;
    const eyeBaseY = eyebrowY + (noseY - eyebrowY) * 0.4; // 60% towards eyebrows from middle point
    
    // Scale parameters
    const scaledParams = {
      eyebrowCurve: 8 * (params.eyebrowCurve + 1) * 0.5, // 0 to 8
      eyebrowPeakOffset: 0.2 + 0.6 * ((params.eyebrowPeakOffset + 1) * 0.5), // 20% to 80%
      eyebrowWidth: 1 + 0.15 * (params.eyebrowWidth + 1), // 1 to 1.3 multiplier
      eyeYOffset: 6 * params.eyeYOffset,
      eyeXOffset: 3 * params.eyeXOffset,
      upperLipCurve: (params.upperLipCurve + 1) * 0.5, // 0 to 1
      lowerLipCurve: (-params.lowerLipCurve + 1) * 0.5, // Inverted, 0 to 1
      cupidBowOffset: 0.5 + 0.3 * params.cupidBowOffset, // 0.2 to 0.8
      noseWidth: 12 + 2 * params.noseWidth,
    };
    
    // Calculate eye positions
    const eyeY = eyeBaseY + scaledParams.eyeYOffset;
    const innerEyeX = innerEyeBaseX + scaledParams.eyeXOffset;
    const eyeWidth = eyeBaseWidth;
    
    const leftInnerEyeX = centerX - innerEyeX;
    const leftOuterEyeX = leftInnerEyeX - eyeWidth;
    const rightInnerEyeX = centerX + innerEyeX;
    const rightOuterEyeX = rightInnerEyeX + eyeWidth;
    
    // Calculate eyebrow positions
    const eyebrowBaseWidth = 20;
    const leftOuterEyebrowX = leftInnerEyeX - (eyebrowBaseWidth * scaledParams.eyebrowWidth);
    const rightOuterEyebrowX = rightInnerEyeX + (eyebrowBaseWidth * scaledParams.eyebrowWidth);
    
    // Calculate peak positions using inner points as reference
    const eyebrowSpan = eyebrowBaseWidth * scaledParams.eyebrowWidth;
    const leftEyebrowPeakX = leftInnerEyeX - (eyebrowSpan * scaledParams.eyebrowPeakOffset);
    const rightEyebrowPeakX = rightInnerEyeX + (eyebrowSpan * scaledParams.eyebrowPeakOffset);
    
    // Fixed nostril positions
    const nostrilDistance = 5; // Fixed distance from center
    const leftNostrilX = centerX - nostrilDistance;
    const rightNostrilX = centerX + nostrilDistance;
    
    // Calculate control points for lips
    const lipStart = centerX - 30;
    const lipEnd = centerX + 30;
    const lipLength = Math.abs(lipEnd - lipStart) / 2;
    const leftLipPeakX = lipStart + lipLength * scaledParams.cupidBowOffset;
    const rightLipPeakX = lipEnd - lipLength * scaledParams.cupidBowOffset;
    
    return {
      eyebrows: {
        y: eyebrowY,
        leftPath: `M${leftOuterEyebrowX} ${eyebrowY}
                  C${leftEyebrowPeakX} ${eyebrowY - scaledParams.eyebrowCurve}
                   ${leftEyebrowPeakX} ${eyebrowY - scaledParams.eyebrowCurve}
                   ${leftInnerEyeX} ${eyebrowY}`,
        rightPath: `M${rightOuterEyebrowX} ${eyebrowY}
                   C${rightEyebrowPeakX} ${eyebrowY - scaledParams.eyebrowCurve}
                    ${rightEyebrowPeakX} ${eyebrowY - scaledParams.eyebrowCurve}
                    ${rightInnerEyeX} ${eyebrowY}`,
      },
      eyes: {
        y: eyeY,
        leftStart: { x: leftOuterEyeX, y: eyeY },
        leftEnd: { x: leftInnerEyeX, y: eyeY },
        rightStart: { x: rightInnerEyeX, y: eyeY },
        rightEnd: { x: rightOuterEyeX, y: eyeY },
      },
      nose: {
        y: noseY,
        leftNostril: { x: leftNostrilX, y: noseY },
        rightNostril: { x: rightNostrilX, y: noseY },
        leftAlaePath: `M${centerX - scaledParams.noseWidth} ${centerY}
                      Q${centerX - scaledParams.noseWidth - 2} ${centerY + 5} ${centerX - scaledParams.noseWidth} ${noseY}`,
        rightAlaePath: `M${centerX + scaledParams.noseWidth} ${centerY}
                       Q${centerX + scaledParams.noseWidth + 2} ${centerY + 5} ${centerX + scaledParams.noseWidth} ${noseY}`,
      },
      mouth: {
        y: centerY + 40,
        upperPath: `M${lipStart} ${centerY + 40}
                   C${leftLipPeakX - 10} ${centerY + 40 - scaledParams.upperLipCurve * 5}
                    ${leftLipPeakX} ${centerY + 40 - scaledParams.upperLipCurve * 8}
                    ${centerX} ${centerY + 40}
                   C${rightLipPeakX} ${centerY + 40 - scaledParams.upperLipCurve * 8}
                    ${rightLipPeakX + 10} ${centerY + 40 - scaledParams.upperLipCurve * 5}
                    ${lipEnd} ${centerY + 40}`,
        lowerPath: `M${lipStart} ${centerY + 40}
                   C${centerX - 15} ${centerY + 40 + scaledParams.lowerLipCurve * 8}
                    ${centerX + 15} ${centerY + 40 + scaledParams.lowerLipCurve * 8}
                    ${lipEnd} ${centerY + 40}`,
      },
    };
  }
}
