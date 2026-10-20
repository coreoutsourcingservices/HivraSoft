export function assertDiscountCodeCombination(currentCode: string, requestedCode: string, currentValid: boolean) {
  const diwali = /^DIWALI\d*$/i;
  if (currentValid && diwali.test(currentCode.trim()) && !diwali.test(requestedCode.trim())) {
    throw new Error("Other discount codes cannot be combined with the Diwali offer.");
  }
}
