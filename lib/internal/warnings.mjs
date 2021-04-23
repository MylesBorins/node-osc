let bundleWarned = false;

function bundleWarning() {
  if (!bundleWarned) {
    bundleWarned = true;
    process.emitWarning('Support for OSC Bundles is experimental and subject to change at any point.');
  }
}

export {
  bundleWarning
};
