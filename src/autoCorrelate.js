function autoCorrelate(buffer, sampleRate) {
  let SIZE = buffer.length;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // Ignore silence

  let lastCorrelation = 1;
  for (let offset = 1; offset < SIZE / 2; offset++) {
    let correlation = 0;

    for (let i = 0; i < SIZE / 2; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlation = correlation / (SIZE / 2);

    if (correlation > 0.9 && correlation > lastCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    } else if (correlation < lastCorrelation) {
      break;
    }

    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01) {
    let frequency = sampleRate / bestOffset;
    return frequency;
  }

  return -1;
}
export default autoCorrelate;
