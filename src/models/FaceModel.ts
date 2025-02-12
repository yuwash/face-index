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

  public static getParameters(faceIndex: number): FaceParameters {
    const t = faceIndex;
    return {
      eyebrowCurve: Math.sin(6 * this.BASE_FREQ * t),
      eyebrowPeakOffset: Math.sin(8 * this.BASE_FREQ * t),
      eyebrowWidth: Math.sin(8 * this.BASE_FREQ * t),
      eyeYOffset: Math.sin(1 * this.BASE_FREQ * t),
      eyeXOffset: Math.sin(2 * this.BASE_FREQ * t),
      upperLipCurve: Math.sin(4 * this.BASE_FREQ * t),
      lowerLipCurve: Math.sin(5 * this.BASE_FREQ * t),
      cupidBowOffset: Math.sin(10 * this.BASE_FREQ * t),
      noseWidth: Math.sin(7 * this.BASE_FREQ * t),
    };
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
      eyebrowCurve: (params.eyebrowCurve + 1) * 0.5, // 0 to 1
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
    
    // Calculate control points for eyebrows using actual eye positions
    const eyebrowBaseWidth = 20;
    const leftEyebrowEnd = leftInnerEyeX; // Align with inner eye corner
    const leftEyebrowStart = leftEyebrowEnd - (eyebrowBaseWidth * scaledParams.eyebrowWidth);
    const rightEyebrowEnd = rightInnerEyeX; // Align with inner eye corner
    const rightEyebrowStart = rightEyebrowEnd + (eyebrowBaseWidth * scaledParams.eyebrowWidth);
    
    const eyebrowLength = Math.abs(leftEyebrowEnd - leftEyebrowStart);
    const leftEyebrowPeakX = leftEyebrowStart + eyebrowLength * scaledParams.eyebrowPeakOffset;
    const rightEyebrowPeakX = rightEyebrowStart - eyebrowLength * scaledParams.eyebrowPeakOffset;
    
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
        leftPath: `M${leftEyebrowStart} ${eyebrowY} 
                  C${leftEyebrowPeakX - 10} ${eyebrowY - scaledParams.eyebrowCurve * 8} 
                   ${leftEyebrowPeakX} ${eyebrowY - scaledParams.eyebrowCurve * 10} 
                   ${leftEyebrowEnd} ${eyebrowY}`,
        rightPath: `M${rightEyebrowStart} ${eyebrowY} 
                   C${rightEyebrowPeakX + 10} ${eyebrowY - scaledParams.eyebrowCurve * 8} 
                    ${rightEyebrowPeakX} ${eyebrowY - scaledParams.eyebrowCurve * 10} 
                    ${rightEyebrowEnd} ${eyebrowY}`,
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