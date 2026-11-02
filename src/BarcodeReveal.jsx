// Barcode label for the top nav. A barcode appears over the words, a scan line
// sweeps left to right, and the words are revealed underneath as the bars clear.
// CSS only (keyframes in index.css), so it costs no JavaScript per frame. The
// loop repeats every six seconds, and reduced motion shows the words statically.
export default function BarcodeReveal({ text }) {
  return (
    <span className="bc" aria-label={text}>
      <span className="bc-text" aria-hidden="true">{text}</span>
      <span className="bc-bars" aria-hidden="true" />
      <span className="bc-scan" aria-hidden="true" />
    </span>
  );
}
