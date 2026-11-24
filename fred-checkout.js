const checkout = document.querySelector('[data-demo="fred"]');
if (checkout) {
  const consentBoxes = checkout.querySelectorAll('[data-terms]');
  function clearConsent() {
    for (const consent of consentBoxes) {
      consent.checked = false;
      consent.closest('.fred-payment').querySelector('[data-pay]').disabled = true;
    }
  }

  for (const consent of consentBoxes) {
    consent.addEventListener('change', () => {
      consent.closest('.fred-payment').querySelector('[data-pay]').disabled = !consent.checked;
    });
  }
  // Each visit through the identity choice starts a separate example purchase.
  checkout.addEventListener('click', event => {
    if (event.target.closest('[data-reset], [data-dest="identity"], [data-dest="member-review"], [data-dest="phone"]')) clearConsent();
  });
  clearConsent();
}
